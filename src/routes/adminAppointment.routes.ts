import { Router } from "express";

import {
  getAdminAppointments,
  getAdminAppointmentById,
  confirmAppointment,
  cancelAdminAppointment,
} from "../controllers/appointment.controller.js";
import { auth, adminOnly } from "../middleware/index.js";

const router = Router();

// ---------- Admin appointment endpoints ----------

/**
 * GET /api/admin/appointments?status=&page=
 * Populated customer + service info. Admin can filter by status.
 */
router.get("/", auth, adminOnly, getAdminAppointments);

/**
 * GET /api/admin/appointments/:id
 * Admin can view any appointment with full details.
 */
router.get("/:id", auth, adminOnly, getAdminAppointmentById);

/**
 * PATCH /api/admin/appointments/:id/confirm
 * Only "pending" appointments can be confirmed. Else 400.
 */
router.patch("/:id/confirm", auth, adminOnly, confirmAppointment);

/**
 * PATCH /api/admin/appointments/:id/cancel
 * "pending" or "confirmed" appointments can be cancelled. Else 400.
 */
router.patch("/:id/cancel", auth, adminOnly, cancelAdminAppointment);

export default router;