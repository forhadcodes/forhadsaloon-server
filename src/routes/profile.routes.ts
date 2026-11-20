import { Router } from "express";

import { getProfile } from "../controllers/profile.controller.js";
import { auth } from "../middleware/index.js";

const router = Router();

router.get("/profile", auth, getProfile);

export default router;
