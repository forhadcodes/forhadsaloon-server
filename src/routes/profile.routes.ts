import { Router } from "express";

import { getProfile, updateProfile } from "../controllers/profile.controller.js";
import { auth } from "../middleware/index.js";
import { validate } from "../utils/index.js";
import { updateProfileSchema } from "../validators/profile.validator.js";

const router = Router();

router.get("/profile", auth, getProfile);
router.patch("/profile", auth, validate(updateProfileSchema), updateProfile);

export default router;
