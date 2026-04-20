import {
  getCurrentPricingConfig,
  updatePricingConfig,
} from "../models/pricing-config.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

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

export { getPricingConfig, updatePricing };
