import type { RequestHandler } from "express";
import { Types } from "mongoose";

import { User } from "../models/index.js";
import { ApiError, asyncHandler } from "../utils/index.js";

/**
 * Re-reads the authenticated user from MongoDB on every protected request.
 * Role and isBlocked always come from the database, never from the JWT.
 */
export const loadUser: RequestHandler = asyncHandler(async (req, _res, next) => {
  if (req.user) return next();

  if (!req.userId) throw new ApiError(401, "Authentication required");

  const user = await User.findById(new Types.ObjectId(req.userId));
  if (!user) throw new ApiError(401, "Your account no longer exists");

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked");
  }

  req.user = {
    id: String(user._id),
    role: user.role,
    name: user.name,
    email: user.email,
  };

  next();
});
