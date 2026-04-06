import fs from "fs";
import {
  getCurrentPricingConfig,
  updatePricingConfig,
} from "../models/pricing-config.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { runSliceEstimate } from "../services/slicer.service.js";
import { calculateQuoteEstimate } from "../utils/quote-calculator.util.js";

const calculateQuote = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Model file is required");
  }

  const modelPath = req.file.path;
  const { material, quality, infill, quantity } = req.body;

  try {
    const slicerResult = await runSliceEstimate({
      modelPath,
      material,
      quality,
      infill: Number(infill),
      quantity: Number(quantity),
    });

    const pricingConfig = await getCurrentPricingConfig();

    if (!pricingConfig) {
      throw new ApiError(500, "Pricing config not found");
    }

    const result = calculateQuoteEstimate({
      slicerResult,
      pricingConfig,
      quantity: Number(quantity),
    });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Quote calculated successfully"));
  } finally {
    if (modelPath) {
      await fs.promises.rm(modelPath, { force: true });
    }
  }
});

const getPricingConfig = asyncHandler(async (req, res) => {
  const pricingConfig = await getCurrentPricingConfig();

  if (!pricingConfig) {
    throw new ApiError(500, "Pricing config not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { pricingConfig },
        "Pricing config fetched successfully",
      ),
    );
});

const updatePricing = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    updated_by: req.user.id,
  };

  const pricingConfig = await updatePricingConfig(payload);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { pricingConfig },
        "Pricing config updated successfully",
      ),
    );
});

export { calculateQuote, getPricingConfig, updatePricing };
