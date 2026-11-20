import type { Request, Response } from "express";
import mongoose, { Types } from "mongoose";

import { Appointment, Service, Transaction, User } from "../models/index.js";
import {
  ApiError,
  asyncHandler,
  assertObjectId,
  escapeRegex,
  getPagination,
  getTotalPages,
  parseQuery,
  toUserDTO,
} from "../utils/index.js";
import { userListQuerySchema } from "../validators/user.validator.js";

/** GET /api/admin/users?search=&page= — registered customers only. */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { search, page, limit } = parseQuery(userListQuerySchema, req.query);
  const { skip } = getPagination(page, limit);

  const filter: Record<string, unknown> = { role: "customer" };
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
  }

  const [docs, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: docs.map(toUserDTO),
      total,
      page,
      pages: getTotalPages(total, limit),
    },
  });
});

/** GET /api/admin/users/:id — customer details plus appointment counts. */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({
    _id: assertObjectId(req.params.id, "user"),
    role: "customer",
  }).lean();
  if (!user) throw new ApiError(404, "Customer not found");

  const owner = new Types.ObjectId(String(user._id));
  const [total, pending, confirmed, cancelled] = await Promise.all([
    Appointment.countDocuments({ customerId: owner }),
    Appointment.countDocuments({ customerId: owner, status: "pending" }),
    Appointment.countDocuments({ customerId: owner, status: "confirmed" }),
    Appointment.countDocuments({ customerId: owner, status: "cancelled" }),
  ]);

  res.json({
    success: true,
    data: {
      ...toUserDTO(user),
      appointmentCounts: { total, pending, confirmed, cancelled },
    },
  });
});

/**
 * Blocking also removes the user's Better Auth sessions so an existing login
 * stops working immediately. Session documents store the id field as `userId`.
 */
async function revokeSessions(userId: Types.ObjectId): Promise<void> {
  await mongoose.connection.db?.collection("sessions").deleteMany({ userId });
}

const assertManageableUser = (req: Request, id: Types.ObjectId) => {
  if (!req.user) throw new ApiError(401, "Authentication required");
  if (String(id) === req.user.id) {
    throw new ApiError(400, "You cannot change your own block status");
  }
};

/** PATCH /api/admin/users/:id/block */
export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, "user");
  assertManageableUser(req, id);

  const user = await User.findOneAndUpdate(
    { _id: id, role: "customer" },
    { $set: { isBlocked: true } },
    { new: true },
  ).lean();
  if (!user) throw new ApiError(404, "Customer not found");

  await revokeSessions(id);

  res.json({ success: true, data: { id: String(user._id), isBlocked: true } });
});

/** PATCH /api/admin/users/:id/unblock */
export const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, "user");
  assertManageableUser(req, id);

  const user = await User.findOneAndUpdate(
    { _id: id, role: "customer" },
    { $set: { isBlocked: false } },
    { new: true },
  ).lean();
  if (!user) throw new ApiError(404, "Customer not found");

  res.json({ success: true, data: { id: String(user._id), isBlocked: false } });
});

/** GET /api/admin/stats */
export const getAdminStats = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalCustomers,
    totalActiveServices,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    totalSuccessfulPayments,
  ] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    Service.countDocuments({ status: "active" }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: "pending" }),
    Appointment.countDocuments({ status: "confirmed" }),
    Transaction.countDocuments({ status: "paid" }),
  ]);

  res.json({
    success: true,
    data: {
      totalCustomers,
      totalActiveServices,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      totalSuccessfulPayments,
    },
  });
});
