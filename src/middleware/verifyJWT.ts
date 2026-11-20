import type { RequestHandler } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { env } from "../config/env.js";
import { ApiError, isValidObjectId } from "../utils/index.js";

// Better Auth runs inside the Next.js app and publishes its public keys here.
const authBaseUrl = env.BETTER_AUTH_URL.replace(/\/+$/, "");
const jwks = createRemoteJWKSet(new URL(`${authBaseUrl}/api/auth/jwks`));

/**
 * Verifies the Bearer token signature, expiry, issuer and audience, then
 * stores the subject (the user's ObjectId as a string) on the request.
 */
export const verifyJWT: RequestHandler = async (req, _res, next) => {
  if (req.userId) return next();

  try {
    const header = req.headers.authorization;
    if (!header) throw new ApiError(401, "Authentication required");

    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      throw new ApiError(401, "Invalid authorization header");
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: authBaseUrl,
      audience: authBaseUrl,
    });

    const subject = typeof payload.sub === "string" ? payload.sub : "";
    if (!subject || !isValidObjectId(subject)) {
      throw new ApiError(401, "Invalid or expired token");
    }

    req.userId = subject;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(new ApiError(401, "Invalid or expired token"));
  }
};
