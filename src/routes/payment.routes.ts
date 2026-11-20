import { Router } from "express";

import {
  createCheckoutSession,
  getPaymentSessionStatus,
} from "../controllers/payment.controller.js";
import { customerOnly } from "../middleware/index.js";
import { validate } from "../utils/index.js";
import { createCheckoutSchema } from "../validators/payment.validator.js";

const router = Router();

router.post(
  "/payments/create-checkout-session",
  customerOnly,
  validate(createCheckoutSchema),
  createCheckoutSession,
);

// Read-only: Stripe is queried only to confirm ownership, never to write state.
router.get("/payments/session/:sessionId", customerOnly, getPaymentSessionStatus);

export default router;
