import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ApiError } from "./apiError.js";

export const validate =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return next(new ApiError(400, "Validation failed", errors));
    }

    req.body = result.data;
    next();
  };
