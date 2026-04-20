import express from "express";
import { calculateQuote } from "../controllers/quote.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { quoteUploadMiddleware } from "../middlewares/quote-upload.middleware.js";
import { calculateQuoteValidator } from "../validators/quote.validator.js";
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

export default router;
