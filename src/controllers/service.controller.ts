import type { Request, Response } from "express";

import { CATEGORIES } from "../config/constants.js";
import { Service } from "../models/index.js";
import {
  ApiError,
  asyncHandler,
  getPagination,
  getTotalPages,
  parseQuery,
  toServiceDTO,
} from "../utils/index.js";
import { buildServiceFilter, getServiceIdParam, SORT_MAP } from "../utils/serviceQuery.js";
import {
  featuredServicesQuerySchema,
  serviceListQuerySchema,
} from "../validators/service.validator.js";

export const listPublicServices = asyncHandler(async (req: Request, res: Response) => {
  const query = parseQuery(serviceListQuerySchema, req.query);
  const filter = buildServiceFilter({
    search: query.search,
    category: query.category,
    onlyActive: true,
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

export const listFeaturedServices = asyncHandler(async (req: Request, res: Response) => {
  const { limit } = parseQuery(featuredServicesQuerySchema, req.query);
  const safeLimit = Math.min(Math.max(limit, 6), 24);

  const docs = await Service.find({ status: "active" })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  res.json({
    success: true,
    data: { items: docs.map(toServiceDTO), total: docs.length },
  });
});

export const listServiceCategories = asyncHandler(async (_req: Request, res: Response) => {
  const grouped = await Service.aggregate<{ _id: string; count: number }>([
    { $match: { status: "active" } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const counts = new Map(grouped.map((row) => [row._id, row.count]));

  const items = CATEGORIES.map((name) => ({ name, count: counts.get(name) ?? 0 }));

  res.json({ success: true, data: { items, total: items.length } });
});

export const getServiceById = asyncHandler(async (req: Request, res: Response) => {
  const id = getServiceIdParam(req);

  const service = await Service.findById(id).lean();
  if (!service) throw new ApiError(404, "Service not found");

  // Inactive services are still returned so the page can show
  // "currently unavailable" instead of a 404.
  res.json({ success: true, data: toServiceDTO(service) });
});
