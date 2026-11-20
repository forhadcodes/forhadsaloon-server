import { Router } from "express";

import {
  getServiceById,
  listFeaturedServices,
  listPublicServices,
  listServiceCategories,
} from "../controllers/service.controller.js";
import { auth } from "../middleware/index.js";

const router = Router();

// Fixed paths must be declared before "/:id" so they are not captured by it.
router.get("/services/featured", listFeaturedServices);
router.get("/services/categories", listServiceCategories);
router.get("/services", listPublicServices);
router.get("/services/:id", auth, getServiceById);

export default router;
