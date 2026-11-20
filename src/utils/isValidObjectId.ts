import { Types } from "mongoose";

import { ApiError } from "./apiError.js";

export const isValidObjectId = (value: string): boolean =>
  /^[0-9a-fA-F]{24}$/.test(value) && Types.ObjectId.isValid(value);

/** Validates a route :id parameter and returns a real ObjectId (400 on bad input). */
export const assertObjectId = (value: unknown, label = "id"): Types.ObjectId => {
  if (typeof value !== "string" || !isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${label} id`);
  }
  return new Types.ObjectId(value);
};
