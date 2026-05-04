import express from "express";
import {
  calculateDesignRequestQuote,
  calculateQuote,
  calculateLocalDesignQuote,
  getQuoteByToken,
  cleanupExpiredQuotes,
} from "../controllers/quote.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { quoteUploadMiddleware } from "../middlewares/quote-upload.middleware.js";
import {
  calculateDesignRequestQuoteValidator,
  calculateLocalDesignQuoteValidator,
  calculateQuoteValidator,
  cleanupExpiredQuotesValidator,
  quoteTokenValidator,
} from "../validators/quote.validator.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/role.middleware.js";
import {
  publicReadRateLimiter,
  quoteCalculationRateLimiter,
  writeRateLimiter,
} from "../middlewares/rate-limit.middleware.js";

const router = express.Router();

router
  .route("/calculate")
  .post(
    quoteCalculationRateLimiter,
    quoteUploadMiddleware,
    calculateQuoteValidator(),
    validate,
    calculateQuote,
  );

router
  .route("/local-designs/:designId")
  .post(
    quoteCalculationRateLimiter,
    calculateLocalDesignQuoteValidator(),
    validate,
    calculateLocalDesignQuote,
  );

router
  .route("/design-requests/:requestId")
  .post(
    quoteCalculationRateLimiter,
    verifyJWT,
    calculateDesignRequestQuoteValidator(),
    validate,
    calculateDesignRequestQuote,
  );

router
  .route("/expired")
  .delete(
    writeRateLimiter,
    verifyJWT,
    verifyAdmin,
    cleanupExpiredQuotesValidator(),
    validate,
    cleanupExpiredQuotes,
  );

router
  .route("/:quoteToken")
  .get(publicReadRateLimiter, quoteTokenValidator(), validate, getQuoteByToken);

export default router;
