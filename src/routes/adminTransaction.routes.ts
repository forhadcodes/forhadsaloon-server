import { Router } from "express";

import { listAdminTransactions } from "../controllers/payment.controller.js";

const router = Router();

// Mounted under /api/admin, which is already guarded by auth + adminOnly.
router.get("/", listAdminTransactions);

export default router;
