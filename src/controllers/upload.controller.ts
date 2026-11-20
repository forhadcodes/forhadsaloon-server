import type { Request, Response } from "express";

import { ApiError, asyncHandler, uploadToImgbb } from "../utils/index.js";

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "No image file provided");

  const uploaded = await uploadToImgbb(file);

  res.status(201).json({ success: true, data: uploaded });
});
