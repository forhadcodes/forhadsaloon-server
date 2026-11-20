import { Router } from "express";

import { adminOnly, auth } from "../middleware/index.js";
import adminServiceRoutes from "./adminService.routes.js";

const router = Router();

/**
 * Every admin router is mounted BELOW this guard, so no admin route can be
 * added without authentication + the database role check.
 */
router.use("/admin", auth, adminOnly);

router.use("/admin/services", adminServiceRoutes);

export default router;
