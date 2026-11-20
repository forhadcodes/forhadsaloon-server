import type { Request, Response } from "express";

import { Appointment, Service } from "../models/index.js";
import {
  ApiError,
  asyncHandler,
  getPagination,
  getTotalPages,
  parseQuery,
  toServiceDTO,
} from "../utils/index.js";
import { buildServiceFilter, getServiceIdParam, SORT_MAP } from "../utils/serviceQuery.js";
import { adminServiceListQuerySchema } from "../validators/service.validator.js";

export const listAdminServices = asyncHandler(async (req: Request, res: Response) => {
  const query = parseQuery(adminServiceListQuerySchema, req.query);
  const filter = buildServiceFilter({
    search: query.search,
    category: query.category,
    status: query.status,
  });
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const [docs, total] = await Promise.all([
    Service.find(filter).sort(SORT_MAP[query.sort]).skip(skip).limit(limit).lean(),
    Service.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: docs.map(toServiceDTO),
      total,
      page,
      pages: getTotalPages(total, limit),
    },
  });
});

export const createService = asyncHandler(async (req: Request, res: Response) => {
  const created = await Service.create(req.body);

  res.status(201).json({ success: true, data: toServiceDTO(created.toObject()) });
});

export const updateService = asyncHandler(async (req: Request, res: Response) => {
  const id = getServiceIdParam(req);

  const updated = await Service.findByIdAndUpdate(id, req.body, {
    returnDocument: "after",
    runValidators: true,
  }).lean();

  if (!updated) throw new ApiError(404, "Service not found");

  res.json({ success: true, data: toServiceDTO(updated) });
});

export const updateServiceStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getServiceIdParam(req);

  const updated = await Service.findByIdAndUpdate(
    id,
    { status: req.body.status },
    { returnDocument: "after", runValidators: true },
  ).lean();

  if (!updated) throw new ApiError(404, "Service not found");

  res.json({ success: true, data: toServiceDTO(updated) });
});

export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  const id = getServiceIdParam(req);

  const hasAppointments = await Appointment.exists({ serviceId: id });
  if (hasAppointments) {
    throw new ApiError(409, "Service has appointments; deactivate it instead");
  }

  const deleted = await Service.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Service not found");

  res.json({ success: true, data: { id } });
});
