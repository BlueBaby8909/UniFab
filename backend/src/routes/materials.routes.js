import express from "express";
import {
  createMaterial,
  updateMaterial,
  deactivateMaterial,
  uploadSlicerProfileVersion,
} from "../controllers/materials.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/role.middleware.js";
import { slicerProfileUploadMiddleware } from "../middlewares/slicer-profile-upload.middleware.js";
import {
  createMaterialValidator,
  updateMaterialValidator,
  deactivateMaterialValidator,
  uploadSlicerProfileVersionValidator,
} from "../validators/materials.validator.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const router = express.Router();

router.use(authLimiter, verifyJWT, verifyAdmin);

router.route("/").post(createMaterialValidator(), validate, createMaterial);

router
  .route("/:materialKey")
  .patch(updateMaterialValidator(), validate, updateMaterial);

router
  .route("/:materialKey/deactivate")
  .patch(deactivateMaterialValidator(), validate, deactivateMaterial);

router
  .route("/:materialKey/profiles")
  .post(
    slicerProfileUploadMiddleware,
    uploadSlicerProfileVersionValidator(),
    validate,
    uploadSlicerProfileVersion,
  );

export default router;
