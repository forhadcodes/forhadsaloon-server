import type { RequestHandler } from "express";
import { z, type ZodType } from "zod";
import { ApiError } from "./apiError.js";

const toFieldErrors = (issues: { path: PropertyKey[]; message: string }[]) =>
  issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));

/**
 * Validates and REPLACES the request body.
 * Schemas must be `.strict()` so unknown keys (role, isBlocked,
 * paymentStatus, servicePrice, ...) are rejected instead of ignored.
 */
export const validate =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(new ApiError(400, "Validation failed", toFieldErrors(result.error.issues)));
    }

    req.body = result.data;
    next();
  };

/**
 * Validates query parameters without assigning back to `req.query`
 * (read-only in Express 5). Returns the parsed value.
 */
export const parseQuery = <T extends ZodType>(schema: T, query: unknown): z.output<T> => {
  const result = schema.safeParse(query);

  if (!result.success) {
    throw new ApiError(400, "Invalid query parameters", toFieldErrors(result.error.issues));
  }

  return result.data;
};
