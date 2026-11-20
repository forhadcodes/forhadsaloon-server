import type { Request } from "express";
import type { QueryFilter, SortOrder } from "mongoose";

import type { IService } from "../models/index.js";
import { ApiError } from "./apiError.js";
import { escapeRegex } from "./escapeRegex.js";
import { isValidObjectId } from "./isValidObjectId.js";

export const SORT_MAP: Record<string, Record<string, SortOrder>> = {
  price_asc: { price: 1, createdAt: -1 },
  price_desc: { price: -1, createdAt: -1 },
  newest: { createdAt: -1 },
};

type FilterOptions = {
  search?: string;
  category?: string;
  status?: string;
  onlyActive?: boolean;
};

/** Shared filter builder for the public and admin service lists. */
export const buildServiceFilter = ({
  search,
  category,
  status,
  onlyActive,
}: FilterOptions): QueryFilter<IService> => {
  const filter: QueryFilter<IService> = {};

  if (onlyActive) filter.status = "active";
  else if (status) filter.status = status;

  if (category) filter.category = category;
  if (search) filter.serviceName = { $regex: escapeRegex(search), $options: "i" };

  return filter;
};

/** Reads `:id` and fails with 400 instead of a Mongoose cast error. */
export const getServiceIdParam = (req: Request): string => {
  const raw = req.params.id;
  const id = typeof raw === "string" ? raw : "";
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid service id");
  return id;
};
