import { Router } from "express";

import {
  blockUser,
  getAdminStats,
  getUserById,
  listUsers,
  unblockUser,
} from "../controllers/adminUser.controller.js";

const router = Router();

// Guarded by `router.use("/admin", auth, adminOnly)` in admin.routes.ts.
router.get("/users", listUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);
router.get("/stats", getAdminStats);

export default router;
