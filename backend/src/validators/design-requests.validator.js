import { body, param, query } from "express-validator";
import { DESIGN_REQUEST_REFERENCE_UPLOAD_FIELD } from "../middlewares/design-request-upload.middleware.js";

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function rejectFields(req, allowedFields, actionName) {
  for (const field of Object.keys(req.body)) {
    if (!allowedFields.has(field)) {
      throw new Error(`${field} is not allowed for ${actionName}`);
    }
  }
}

const DESIGN_REQUEST_STATUS_VALUES = [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "completed",
];

const designRequestIdValidator = () => {
  return [
    param("requestId")
      .isInt({ min: 1 })
      .withMessage("Request ID must be a positive integer"),
  ];
};

const createDesignRequestValidator = () => {
  return [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required")
      .bail()
      .isString()
      .withMessage("Title must be a string")
      .bail()
      .isLength({ min: 1, max: 255 })
      .withMessage("Title must be between 1 and 255 characters"),

    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .bail()
      .isString()
      .withMessage("Description must be a string")
      .bail()
      .isLength({ min: 1, max: 5000 })
      .withMessage("Description must be between 1 and 5000 characters"),

    body("preferredMaterial")
      .optional()
      .trim()
      .isString()
      .withMessage("Preferred material must be a string")
      .bail()
      .isLength({ max: 100 })
      .withMessage("Preferred material must not exceed 100 characters"),

    body("dimensions")
      .optional()
      .trim()
      .isString()
      .withMessage("Dimensions must be a string")
      .bail()
      .isLength({ max: 255 })
      .withMessage("Dimensions must not exceed 255 characters"),

    body("quantity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive integer"),

    body().custom((_, { req }) => {
      rejectFields(
        req,
        new Set([
          "title",
          "description",
          "preferredMaterial",
          "dimensions",
          "quantity",
          DESIGN_REQUEST_REFERENCE_UPLOAD_FIELD,
        ]),
        "design request creation",
      );

      return true;
    }),
  ];
};

const updateDesignRequestStatusValidator = () => {
  return [
    ...designRequestIdValidator(),

    body("status")
      .optional()
      .trim()
      .isIn(DESIGN_REQUEST_STATUS_VALUES)
      .withMessage(
        "Status must be one of: pending, under_review, approved, rejected, completed",
      ),

    body("adminNote")
      .optional()
      .trim()
      .isString()
      .withMessage("Admin note must be a string")
      .bail()
      .isLength({ max: 2000 })
      .withMessage("Admin note must not exceed 2000 characters"),

    body().custom((_, { req }) => {
      rejectFields(
        req,
        new Set(["status", "adminNote"]),
        "design request status updates",
      );

      const hasAnyUpdatableField =
        Object.prototype.hasOwnProperty.call(req.body, "status") ||
        Object.prototype.hasOwnProperty.call(req.body, "adminNote");

      if (!hasAnyUpdatableField) {
        throw new Error(
          "At least one update field must be provided: status or adminNote",
        );
      }

      return true;
    }),
  ];
};

const updateDesignRequestResultValidator = () => {
  return [
    ...designRequestIdValidator(),

    body("resultDesignId")
      .exists()
      .withMessage("Result design ID is required")
      .bail()
      .isInt({ min: 1 })
      .withMessage("Result design ID must be a positive integer"),

    body("adminNote")
      .trim()
      .notEmpty()
      .withMessage("Admin note is required")
      .bail()
      .isString()
      .withMessage("Admin note must be a string")
      .bail()
      .isLength({ max: 2000 })
      .withMessage("Admin note must not exceed 2000 characters"),

    body().custom((_, { req }) => {
      rejectFields(
        req,
        new Set(["resultDesignId", "adminNote"]),
        "design request result linking",
      );

      return true;
    }),
  ];
};

const listMyDesignRequestsQueryValidator = () => {
  return [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ];
};

const listAllDesignRequestsQueryValidator = () => {
  return [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),

    query("status")
      .optional()
      .trim()
      .isIn(DESIGN_REQUEST_STATUS_VALUES)
      .withMessage(
        "Status must be one of: pending, under_review, approved, rejected, completed",
      ),
  ];
};

export {
  designRequestIdValidator,
  createDesignRequestValidator,
  updateDesignRequestStatusValidator,
  updateDesignRequestResultValidator,
  listMyDesignRequestsQueryValidator,
  listAllDesignRequestsQueryValidator,
  DESIGN_REQUEST_STATUS_VALUES,
};
