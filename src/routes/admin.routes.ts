import { Router } from "express";

import { adminOnly, auth } from "../middleware/index.js";
import adminServiceRoutes from "./adminService.routes.js";
import adminAppointmentRoutes from "./adminAppointment.routes.js";
import adminTransactionRoutes from "./adminTransaction.routes.js";
import adminUserRoutes from "./adminUser.routes.js";

const router = Router();

/**
 * Every admin router is mounted BELOW this guard, so no admin route can be
 * added without authentication + the database role check.
 */
router.use("/admin", auth, adminOnly);

router.use("/admin", adminUserRoutes);
router.use("/admin/services", adminServiceRoutes);
router.use("/admin/appointments", adminAppointmentRoutes);
router.use("/admin/transactions", adminTransactionRoutes);

export default router;
