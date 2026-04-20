import fs from "fs";
import { getCurrentPricingConfig } from "../models/pricing-config.model.js";
import { getMaterialByKey } from "../models/materials.model.js";
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

  const normalizedInfill = Number(infill);
  const normalizedQuantity = Number(quantity);

  try {
    const materialRow = await getMaterialByKey(material);

    if (!materialRow) {
      throw new ApiError(
        400,
        `Material is not configured or inactive: ${material}`,
      );
    }

    const pricingConfig = await getCurrentPricingConfig();

    if (!pricingConfig) {
      throw new ApiError(500, "Pricing config not found");
    }

    const slicerResult = await runSliceEstimate({
      modelPath,
      material: materialRow.material_key,
      quality,
      infill: normalizedInfill,
      quantity: normalizedQuantity,
    });

    const result = calculateQuoteEstimate({
      slicerResult,
      pricingConfig,
      materialCostPerGram: materialRow.material_cost_per_gram,
      quantity: normalizedQuantity,
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

export { calculateQuote };
