import { body } from "express-validator";

const ALLOWED_QUALITIES = ["draft", "standard", "fine"];

const calculateQuoteValidator = () => {
  return [
    body("material")
      .trim()
      .notEmpty()
      .withMessage("Material is required")
      .bail()
      .isString()
      .withMessage("Material must be a string")
      .bail()
      .isLength({ min: 1, max: 50 })
      .withMessage("Material must be between 1 and 50 characters"),

    body("quality")
      .trim()
      .notEmpty()
      .withMessage("Quality is required")
      .bail()
      .isString()
      .withMessage("Quality must be a string")
      .bail()
      .isIn(ALLOWED_QUALITIES)
      .withMessage("Quality must be one of: draft, standard, fine"),

    body("infill")
      .exists()
      .withMessage("Infill is required")
      .bail()
      .isFloat({ min: 0, max: 100 })
      .withMessage("Infill must be a percentage between 0 and 100"),

    body("quantity")
      .exists()
      .withMessage("Quantity is required")
      .bail()
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive integer"),
  ];
};

const updateQuoteValidator = () => {
  return [
    body("machine_hour_rate")
      .exists()
      .withMessage("Machine hour rate is required")
      .bail()
      .isFloat({ min: 0 })
      .withMessage("Machine hour rate must be a non-negative number"),

    body("base_fee")
      .exists()
      .withMessage("Base fee is required")
      .bail()
      .isFloat({ min: 0 })
      .withMessage("Base fee must be a non-negative number"),

    body("waste_factor")
      .exists()
      .withMessage("Waste factor is required")
      .bail()
      .isFloat({ min: 0 })
      .withMessage("Waste factor must be a non-negative number"),

    body("support_markup_factor")
      .exists()
      .withMessage("Support markup factor is required")
      .bail()
      .isFloat({ min: 0 })
      .withMessage("Support markup factor must be a non-negative number"),

    body("electricity_cost_per_kwh")
      .exists()
      .withMessage("Electricity cost per kWh is required")
      .bail()
      .isFloat({ min: 0 })
      .withMessage("Electricity cost per kWh must be a non-negative number"),

    body("power_consumption_watts")
      .exists()
      .withMessage("Power consumption watts is required")
      .bail()
      .isFloat({ min: 0 })
      .withMessage("Power consumption watts must be a non-negative number"),

    body("currency")
      .trim()
      .notEmpty()
      .withMessage("Currency is required")
      .bail()
      .isString()
      .withMessage("Currency must be a string")
      .bail()
      .isLength({ min: 3, max: 10 })
      .withMessage("Currency must be between 3 and 10 characters"),
  ];
};

const addMaterialValidator = () => {
  return [
    body("materialKey")
      .trim()
      .notEmpty()
      .withMessage("Material key is required")
      .bail()
      .isString()
      .withMessage("Material key must be a string")
      .bail()
      .isLength({ min: 1, max: 50 })
      .withMessage("Material key must be between 1 and 50 characters"),

    body("displayName")
      .optional({ values: "falsy" })
      .trim()
      .isString()
      .withMessage("Display name must be a string")
      .bail()
      .isLength({ min: 1, max: 100 })
      .withMessage("Display name must be between 1 and 100 characters"),

    body("materialCostPerGram")
      .optional({ values: "falsy" })
      .isFloat({ min: 0 })
      .withMessage("Material cost per gram must be a non-negative number"),

    body("quality")
      .trim()
      .notEmpty()
      .withMessage("Quality is required")
      .bail()
      .isString()
      .withMessage("Quality must be a string")
      .bail()
      .isIn(ALLOWED_QUALITIES)
      .withMessage("Quality must be one of: draft, standard, fine"),

    body("printerName")
      .optional({ values: "falsy" })
      .trim()
      .isString()
      .withMessage("Printer name must be a string")
      .bail()
      .isLength({ min: 1, max: 100 })
      .withMessage("Printer name must be between 1 and 100 characters"),

    body("nozzle")
      .optional({ values: "falsy" })
      .trim()
      .isString()
      .withMessage("Nozzle must be a string")
      .bail()
      .isLength({ min: 1, max: 20 })
      .withMessage("Nozzle must be between 1 and 20 characters"),

    body("supportRule")
      .optional({ values: "falsy" })
      .trim()
      .isString()
      .withMessage("Support rule must be a string")
      .bail()
      .isLength({ min: 1, max: 30 })
      .withMessage("Support rule must be between 1 and 30 characters"),

    body("orientationRule")
      .optional({ values: "falsy" })
      .trim()
      .isString()
      .withMessage("Orientation rule must be a string")
      .bail()
      .isLength({ min: 1, max: 30 })
      .withMessage("Orientation rule must be between 1 and 30 characters"),

    body("isActiveMaterial")
      .optional({ values: "falsy" })
      .isIn(["true", "false", "1", "0", "yes", "no"])
      .withMessage(
        "isActiveMaterial must be one of: true, false, 1, 0, yes, no",
      ),
  ];
};

export { calculateQuoteValidator, updateQuoteValidator, addMaterialValidator };
