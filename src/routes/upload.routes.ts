import { Router } from "express";
import rateLimit from "express-rate-limit";

import { uploadImage } from "../controllers/upload.controller.js";
import { auth } from "../middleware/index.js";
import { imageUpload } from "../utils/upload.js";

const router = Router();

/**
 * The sign-up form uploads before the account exists, so this endpoint cannot
 * require a token. A tight limiter keeps it from being abused.
 */
const publicUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many image uploads. Please try again in a few minutes.",
  },
});

router.post("/upload/image", auth, imageUpload.single("image"), uploadImage);
router.post("/upload/public", publicUploadLimiter, imageUpload.single("image"), uploadImage);

export default router;
