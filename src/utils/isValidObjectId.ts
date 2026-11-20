import { Types } from "mongoose";

export const isValidObjectId = (value: string): boolean =>
  /^[0-9a-fA-F]{24}$/.test(value) && Types.ObjectId.isValid(value);
