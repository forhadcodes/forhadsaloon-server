import type { RequestHandler } from "express";

import { loadUser } from "./loadUser.js";
import { requireRole } from "./requireRole.js";
import { verifyJWT } from "./verifyJWT.js";

export { errorHandler, notFound } from "./errorHandler.js";
export { loadUser } from "./loadUser.js";
export { requireRole } from "./requireRole.js";
export { verifyJWT } from "./verifyJWT.js";

/**
 * Composed guards.
 *
 * Handlers are idempotent (verifyJWT returns early when req.userId is already
 * set, loadUser returns early when req.user is set) so mounting
 * `router.use("/admin", auth, adminOnly)` performs a single verification and
 * a single database read.
 */
export const auth: RequestHandler[] = [verifyJWT, loadUser];

export const adminOnly: RequestHandler[] = [verifyJWT, loadUser, requireRole("admin")];

export const customerOnly: RequestHandler[] = [verifyJWT, loadUser, requireRole("customer")];
