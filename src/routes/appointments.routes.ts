import { Router } from "express";

import {
  cancelMyAppointment,
  createAppointment,
  getAppointmentById,
  getAvailability,
  getMyAppointments,
  getMyAppointmentsStats,
} from "../controllers/appointment.controller.js";
import { customerBookingOnly, customerOnly } from "../middleware/index.js";
import { validate } from "../utils/index.js";
import { createAppointmentSchema } from "../validators/appointment.validator.js";

const router = Router();

// Static paths MUST be registered before /:id.
router.post("/", customerBookingOnly, validate(createAppointmentSchema), createAppointment);
router.get("/availability", customerOnly, getAvailability);
router.get("/my", customerOnly, getMyAppointments);
router.get("/my/stats", customerOnly, getMyAppointmentsStats);
router.get("/:id", customerOnly, getAppointmentById);
router.patch("/:id/cancel", customerOnly, cancelMyAppointment);

export default router;
