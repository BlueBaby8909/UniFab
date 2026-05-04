import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

function createLimiter({ max, message }) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      statusCode: 429,
      data: null,
      message,
      success: false,
    },
  });
}

export const publicReadRateLimiter = createLimiter({
  max: 300,
  message: "Too many read requests. Please wait a moment and try again.",
});

export const authenticatedReadRateLimiter = createLimiter({
  max: 300,
  message: "Too many read requests. Please wait a moment and try again.",
});

export const writeRateLimiter = createLimiter({
  max: 60,
  message: "Too many update requests. Please wait a moment and try again.",
});

export const uploadRateLimiter = createLimiter({
  max: 30,
  message: "Too many upload requests. Please wait a moment and try again.",
});

export const quoteCalculationRateLimiter = createLimiter({
  max: 30,
  message: "Too many quote calculations. Please wait a moment and try again.",
});
