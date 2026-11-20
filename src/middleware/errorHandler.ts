import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { ApiError } from "../utils/index.js";

/** JSON 404 for any unmatched route. */
export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

type MongoLikeError = {
  name?: string;
  code?: number | string;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message?: string }>;
  type?: string;
  message?: string;
};

const isMongoDuplicateKey = (error: MongoLikeError): boolean => error.code === 11000;

/**
 * Single exit point for every failure.
 * Returns { success:false, message, errors? } and never leaks stack traces.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (res.headersSent) return;

  const raw = (error ?? {}) as MongoLikeError;

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.errors === undefined ? {} : { errors: error.errors }),
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (raw.name === "MulterError") {
    const message =
      raw.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5MB or smaller"
        : "Invalid image upload";
    res.status(400).json({ success: false, message });
    return;
  }

  if (raw.name === "ValidationError" && raw.errors) {
    const errors = Object.entries(raw.errors).map(([path, detail]) => ({
      path,
      message: detail.message ?? "Invalid value",
    }));
    res.status(400).json({ success: false, message: "Validation failed", errors });
    return;
  }

  if (isMongoDuplicateKey(raw)) {
    res.status(409).json({
      success: false,
      message: "A record with these details already exists",
    });
    return;
  }

  if (raw.type === "entity.parse.failed") {
    res.status(400).json({ success: false, message: "Invalid JSON body" });
    return;
  }

  const status = 500;
  console.error(`[error] ${req.method} ${req.originalUrl} -> ${status}: ${raw.message ?? "Unknown error"}`);

  res.status(status).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : raw.message ?? "Internal server error",
  });
};
