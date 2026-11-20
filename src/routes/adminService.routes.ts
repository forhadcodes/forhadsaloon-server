import { Router } from "express";

import {
  createService,
  deleteService,
  listAdminServices,
  updateService,
  updateServiceStatus,
} from "../controllers/adminService.controller.js";
import { validate } from "../utils/index.js";
import {
  serviceCreateSchema,
  serviceStatusSchema,
  serviceUpdateSchema,
} from "../validators/service.validator.js";

const router = Router();

router.get("/", listAdminServices);
router.post("/", validate(serviceCreateSchema), createService);
router.patch("/:id/status", validate(serviceStatusSchema), updateServiceStatus);
router.patch("/:id", validate(serviceUpdateSchema), updateService);
router.delete("/:id", deleteService);

export default router;
