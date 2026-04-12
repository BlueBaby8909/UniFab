import fs from "fs";
import {
  getCurrentPricingConfig,
  updatePricingConfig,
} from "../models/pricing-config.model.js";
import { getMaterialByKey } from "../models/materials.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { runSliceEstimate } from "../services/slicer.service.js";
import { calculateQuoteEstimate } from "../utils/quote-calculator.util.js";
import { registerMaterialProfile } from "../services/material-profile.service.js";

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

const addMaterial = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Profile file is required");
  }

  const tempFilePath = req.file.path;

  try {
    const result = await registerMaterialProfile({
      materialKey: req.body.materialKey ?? req.body.material,
      displayName: req.body.displayName,
      materialCostPerGram: req.body.materialCostPerGram ?? req.body.price,
      isActiveMaterial: req.body.isActiveMaterial ?? req.body.is_active,
      quality: req.body.quality,
      printerName: req.body.printerName,
      nozzle: req.body.nozzle,
      supportRule: req.body.supportRule,
      orientationRule: req.body.orientationRule,
      tempFilePath,
      originalFileName: req.file.originalname,
      uploadedBy: req.user.id,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          result,
          "Material and slicer profile registered successfully",
        ),
      );
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      await fs.promises.rm(tempFilePath, { force: true });
    }
  }
});

export { calculateQuote, getPricingConfig, updatePricing, addMaterial };
