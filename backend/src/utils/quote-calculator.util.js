import { ApiError } from "../utils/api-error.js";

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function calculateQuoteEstimate({
  slicerResult,
  pricingConfig,
  materialCostPerGram,
  quantity,
}) {
  if (!slicerResult) {
    throw new ApiError(400, "Slicer result is required");
  }

  if (!pricingConfig) {
    throw new ApiError(500, "Pricing config is required");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(
      400,
      "Quantity must be an integer greater than or equal to 1",
    );
  }

  const normalizedMaterialCostPerGram = Number(materialCostPerGram);

  if (
    Number.isNaN(normalizedMaterialCostPerGram) ||
    normalizedMaterialCostPerGram < 0
  ) {
    throw new ApiError(
      500,
      "Material cost per gram must be a valid non-negative number",
    );
  }

  const {
    estimatedPrintTimeMinutes,
    filamentWeightGrams,
    filamentLengthMeters,
    profile,
  } = slicerResult;

  if (!profile?.material) {
    throw new ApiError(500, "Slicer result profile material is required");
  }

  const printHours = Number(estimatedPrintTimeMinutes) / 60;

  const baseFee = Number(pricingConfig.base_fee) || 0;
  const machineHourRate = Number(pricingConfig.machine_hour_rate) || 0;
  const wasteFactor = Number(pricingConfig.waste_factor) || 0;
  const supportMarkupFactor = Number(pricingConfig.support_markup_factor) || 0;
  const electricityCostPerKwh =
    Number(pricingConfig.electricity_cost_per_kwh) || 0;
  const powerConsumptionWatts =
    Number(pricingConfig.power_consumption_watts) || 0;

  const materialCost =
    Number(filamentWeightGrams) * normalizedMaterialCostPerGram;
  const machineCost = printHours * machineHourRate;
  const electricityCost =
    printHours * (powerConsumptionWatts / 1000) * electricityCostPerKwh;

  const singleUnitSubtotal =
    baseFee + materialCost + machineCost + electricityCost;

  const markupFactor = 1 + wasteFactor + supportMarkupFactor;
  const singleUnitTotal = singleUnitSubtotal * markupFactor;
  const totalPrice = singleUnitTotal * quantity;

  return {
    quantity,
    currency: pricingConfig.currency,
    estimatedPrintTimeMinutes: Number(estimatedPrintTimeMinutes),
    filamentWeightGrams: Number(filamentWeightGrams),
    filamentLengthMeters: Number(filamentLengthMeters),
    profile,
    costBreakdown: {
      baseFee: roundMoney(baseFee),
      materialCost: roundMoney(materialCost),
      machineCost: roundMoney(machineCost),
      electricityCost: roundMoney(electricityCost),
      wasteFactor,
      supportMarkupFactor,
      singleUnitSubtotal: roundMoney(singleUnitSubtotal),
      singleUnitTotal: roundMoney(singleUnitTotal),
    },
    totalPrice: roundMoney(totalPrice),
  };
}

export { calculateQuoteEstimate };
