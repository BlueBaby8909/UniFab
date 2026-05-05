import { body, param } from "express-validator";

const PRINTER_STATUSES = ["active", "maintenance", "retired"];

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function printerPayloadValidator({ requireAllFields = true } = {}) {
  const optional = !requireAllFields;

  return [
    body("name")
      .if(() => requireAllFields)
      .trim()
      .notEmpty()
      .withMessage("Printer name is required")
      .bail()
      .isLength({ min: 1, max: 120 })
      .withMessage("Printer name must be between 1 and 120 characters"),

    body("name")
      .if(() => optional)
      .optional()
      .trim()
      .isLength({ min: 1, max: 120 })
      .withMessage("Printer name must be between 1 and 120 characters"),

    body("model")
      .optional()
      .trim()
      .isLength({ max: 120 })
      .withMessage("Model must not exceed 120 characters"),

    body("technology")
      .optional()
      .trim()
      .isLength({ min: 1, max: 80 })
      .withMessage("Technology must be between 1 and 80 characters"),

    body("buildVolume")
      .optional()
      .trim()
      .isLength({ max: 120 })
      .withMessage("Build volume must not exceed 120 characters"),

    body("nozzleSize")
      .optional()
      .trim()
      .isLength({ max: 40 })
      .withMessage("Nozzle size must not exceed 40 characters"),

    body("supportedMaterials")
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) {
          return value.every((item) => hasText(item));
        }

        if (typeof value === "string") {
          return true;
        }

        throw new Error(
          "Supported materials must be an array or comma-separated string",
        );
      }),

    body("status")
      .optional()
      .isIn(PRINTER_STATUSES)
      .withMessage("Status must be one of: active, maintenance, retired"),

    body("isPublic")
      .optional()
      .isIn(["true", "false", "1", "0", "yes", "no", true, false])
      .withMessage("isPublic must be a boolean value"),

    body("displayOrder")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Display order must be a non-negative integer"),

    body("notes")
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Notes must not exceed 2000 characters"),
  ];
}

const createPrinterValidator = () => printerPayloadValidator();

const updatePrinterValidator = () => [
  ...printerIdValidator(),
  ...printerPayloadValidator({ requireAllFields: false }),
  body().custom((_, { req }) => {
    const fields = [
      "name",
      "model",
      "technology",
      "buildVolume",
      "nozzleSize",
      "supportedMaterials",
      "status",
      "isPublic",
      "displayOrder",
      "notes",
    ];

    if (!fields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field))) {
      throw new Error("At least one printer field must be provided");
    }

    return true;
  }),
];

function printerIdValidator() {
  return [
    param("printerId")
      .isInt({ min: 1 })
      .withMessage("Printer ID must be a positive integer"),
  ];
}

export {
  createPrinterValidator,
  updatePrinterValidator,
  printerIdValidator,
};
