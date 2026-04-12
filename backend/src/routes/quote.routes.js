import express from "express";
import {
  calculateQuote,
  getPricingConfig,
  updatePricing,
  addMaterial,
} from "../controllers/quote.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/role.middleware.js";
import { quoteUploadMiddleware } from "../middlewares/quote-upload.middleware.js";
import { slicerProfileUploadMiddleware } from "../middlewares/slicer-profile-upload.middleware.js";
import {
  calculateQuoteValidator,
  updateQuoteValidator,
  addMaterialValidator,
} from "../validators/quote.validator.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const router = express.Router();

router
  .route("/calculate")
  .post(
    authLimiter,
    quoteUploadMiddleware,
    calculateQuoteValidator(),
    validate,
    calculateQuote,
  );

// admin
router
  .route("/pricing-config")
  .get(authLimiter, verifyJWT, verifyAdmin, getPricingConfig);

router
  .route("/pricing-config")
  .put(
    authLimiter,
    verifyJWT,
    verifyAdmin,
    updateQuoteValidator(),
    validate,
    updatePricing,
  );

router
  .route("/materials")
  .post(
    authLimiter,
    verifyJWT,
    verifyAdmin,
    slicerProfileUploadMiddleware,
    addMaterialValidator(),
    validate,
    addMaterial,
  );

export default router;
