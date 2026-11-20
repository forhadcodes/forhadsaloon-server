import type { Request, Response } from "express";
import { Types } from "mongoose";

import { TIME_SLOTS } from "../config/constants.js";
import { Appointment, Service, Transaction } from "../models/index.js";
import {
  ApiError,
  asyncHandler,
  assertObjectId,
  assertTodayOrFuture,
  dateOnlyToUtcMidnight,
  getPagination,
  getTotalPages,
  parseDateOnly,
  parseQuery,
  toAppointmentDTO,
} from "../utils/index.js";
import {
  appointmentListQuerySchema,
  availabilityQuerySchema,
} from "../validators/appointment.validator.js";

const ACTIVE = { $in: ["pending", "confirmed"] };
const SLOT_CONFLICT = "This time slot is already booked, please choose another";

const customerId = (req: Request): string => {
  if (!req.user) throw new ApiError(401, "Authentication required");
  return req.user.id;
};

/** POST /api/appointments — customer books a service. */
export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
  const { serviceId, appointmentDate, timeSlot, message } = req.body as {
    serviceId: string;
    appointmentDate: string;
    timeSlot: string;
    message?: string;
  };

  const date = parseDateOnly(appointmentDate);
  assertTodayOrFuture(date);
  const appointmentDateObj = dateOnlyToUtcMidnight(date);

  const service = await Service.findById(assertObjectId(serviceId, "service")).lean();
  if (!service) throw new ApiError(404, "Service not found");
  if (service.status !== "active") {
    throw new ApiError(400, "This service is not available for booking");
  }
  if (!TIME_SLOTS.includes(timeSlot as (typeof TIME_SLOTS)[number])) {
    throw new ApiError(400, "Invalid time slot");
  }

  // Salon-wide rule: one active appointment per date + time slot.
  const taken = await Appointment.exists({
    appointmentDate: appointmentDateObj,
    timeSlot,
    status: ACTIVE,
  });
  if (taken) throw new ApiError(409, SLOT_CONFLICT);

  const appointment = new Appointment({
    serviceId: service._id,
    customerId: new Types.ObjectId(customerId(req)),
    appointmentDate: appointmentDateObj,
    timeSlot,
    message: message ?? "",
    // Never trust the client for these three fields.
    servicePrice: service.price,
    paymentStatus: "unpaid",
    status: "pending",
  });

  try {
    await appointment.save();
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new ApiError(409, SLOT_CONFLICT);
    }
    throw error;
  }

  const populated = await Appointment.findById(appointment._id)
    .populate("serviceId", "serviceName category price duration image")
    .populate("customerId", "name email image phone")
    .lean();

  res.status(201).json({ success: true, data: toAppointmentDTO(populated!) });
});

/** GET /api/appointments/availability?date=YYYY-MM-DD — no personal data. */
export const getAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { date } = parseQuery(availabilityQuerySchema, req.query);
  const dateObj = dateOnlyToUtcMidnight(date);

  const taken = await Appointment.find({
    appointmentDate: dateObj,
    status: ACTIVE,
  })
    .select("timeSlot")
    .lean();

  const takenSlots = Array.from(new Set(taken.map((item) => item.timeSlot)));
  const availableSlots = TIME_SLOTS.filter((slot) => !takenSlots.includes(slot));

  res.json({ success: true, data: { date, takenSlots, availableSlots } });
});

/** GET /api/appointments/my?status=&page= — own appointments only. */
export const getMyAppointments = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit } = parseQuery(appointmentListQuerySchema, req.query);
  const { skip } = getPagination(page, limit);
  const filter: Record<string, unknown> = { customerId: new Types.ObjectId(customerId(req)) };
  if (status) filter.status = status;

  const [docs, total] = await Promise.all([
    Appointment.find(filter)
      .populate("serviceId", "serviceName category price duration image")
      .populate("customerId", "name email image phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: docs.map(toAppointmentDTO),
      total,
      page,
      pages: getTotalPages(total, limit),
    },
  });
});

/** GET /api/appointments/my/stats */
export const getMyAppointmentsStats = asyncHandler(async (req: Request, res: Response) => {
  const owner = new Types.ObjectId(customerId(req));
  const [total, pending, confirmed, cancelled] = await Promise.all([
    Appointment.countDocuments({ customerId: owner }),
    Appointment.countDocuments({ customerId: owner, status: "pending" }),
    Appointment.countDocuments({ customerId: owner, status: "confirmed" }),
    Appointment.countDocuments({ customerId: owner, status: "cancelled" }),
  ]);

  res.json({ success: true, data: { total, pending, confirmed, cancelled } });
});

/** GET /api/appointments/:id — own only, with related transaction if any. */
export const getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, "appointment");

  const appointment = await Appointment.findOne({
    _id: id,
    customerId: new Types.ObjectId(customerId(req)),
  })
    .populate("serviceId", "serviceName category price duration image")
    .populate("customerId", "name email image phone")
    .lean();

  if (!appointment) throw new ApiError(404, "Appointment not found");

  const transaction = await Transaction.findOne({ appointmentId: id }).lean();

  res.json({
    success: true,
    data: toAppointmentDTO({ ...appointment, transaction: transaction ?? undefined }),
  });
});

/** PATCH /api/appointments/:id/cancel — owner, pending only. */
export const cancelMyAppointment = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, "appointment");

  const appointment = await Appointment.findOne({
    _id: id,
    customerId: new Types.ObjectId(customerId(req)),
  });
  if (!appointment) throw new ApiError(404, "Appointment not found");
  if (appointment.status !== "pending") {
    throw new ApiError(400, "Only pending appointments can be cancelled");
  }

  appointment.status = "cancelled";
  await appointment.save();

  res.json({ success: true, data: { id: String(appointment._id), status: appointment.status } });
});

/** GET /api/admin/appointments?status=&page= — all appointments. */
export const getAdminAppointments = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit } = parseQuery(appointmentListQuerySchema, req.query);
  const { skip } = getPagination(page, limit);
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const [docs, total] = await Promise.all([
    Appointment.find(filter)
      .populate("customerId", "name email image phone")
      .populate("serviceId", "serviceName category price duration image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: docs.map(toAppointmentDTO),
      total,
      page,
      pages: getTotalPages(total, limit),
    },
  });
});

/** GET /api/admin/appointments/:id */
export const getAdminAppointmentById = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, "appointment");
  const appointment = await Appointment.findById(id)
    .populate("customerId", "name email image phone")
    .populate("serviceId", "serviceName category price duration image")
    .lean();
  if (!appointment) throw new ApiError(404, "Appointment not found");

  res.json({ success: true, data: toAppointmentDTO(appointment) });
});

/** PATCH /api/admin/appointments/:id/confirm — pending only. */
export const confirmAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await Appointment.findById(assertObjectId(req.params.id, "appointment"));
  if (!appointment) throw new ApiError(404, "Appointment not found");
  if (appointment.status !== "pending") {
    throw new ApiError(400, "Only pending appointments can be confirmed");
  }

  appointment.status = "confirmed";
  await appointment.save();
  res.json({ success: true, data: { id: String(appointment._id), status: appointment.status } });
});

/** PATCH /api/admin/appointments/:id/cancel — pending or confirmed only. */
export const cancelAdminAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await Appointment.findById(assertObjectId(req.params.id, "appointment"));
  if (!appointment) throw new ApiError(404, "Appointment not found");
  if (appointment.status !== "pending" && appointment.status !== "confirmed") {
    throw new ApiError(400, "Only pending or confirmed appointments can be cancelled");
  }

  appointment.status = "cancelled";
  await appointment.save();
  res.json({ success: true, data: { id: String(appointment._id), status: appointment.status } });
});
