import type { Request, Response } from "express";
import { Types } from "mongoose";

import { User } from "../models/index.js";
import { ApiError, asyncHandler, toUserDTO } from "../utils/index.js";

/** Current user, minus anything the client does not need. */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "Authentication required");

  const user = await User.findById(new Types.ObjectId(req.user.id)).lean();
  if (!user) throw new ApiError(401, "Your account no longer exists");

  res.json({ success: true, data: toUserDTO(user) });
});
