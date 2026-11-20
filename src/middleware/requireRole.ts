import type { RequestHandler } from "express";

import { ApiError } from "../utils/index.js";

export type UserRole = "admin" | "customer";

/**
 * Role gate. Must run after loadUser so the role comes from the database.
 */
export const requireRole =
  (role: UserRole, message = "You do not have permission to perform this action"): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    if (req.user.role !== role) {
      return next(new ApiError(403, message));
    }

    next();
  };
