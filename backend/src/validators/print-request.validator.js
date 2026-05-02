import { body, param, query } from "express-validator";
import {
  PRINT_REQUEST_SOURCE_TYPE_VALUES,
  PRINT_REQUEST_STATUS_VALUES,
  MAX_PRINT_REQUEST_NOTES_LENGTH,
} from "../constants/print-request.constants.js";

function hasOwnField(req, fieldName) {
  return Object.prototype.hasOwnProperty.call(req.body, fieldName);
}

function rejectForbiddenClientFields(req) {
  const forbiddenFields = [
    "id",
    "clientId",
    "referenceNumber",
    "fileUrl",
    "fileOriginalName",
    "fileMimeType",
    "fileSize",
    "designSnapshot",
    "estimatedCost",
    "confirmedCost",
    "paymentSlipUrl",
    "receiptUrl",
    "receiptUploadedAt",
    "status",
    "rejectionReason",
    "createdAt",
    "updatedAt",
  ];

  for (const field of forbiddenFields) {
    if (hasOwnField(req, field)) {
      throw new Error(
        `${field} is managed by the server and cannot be submitted`,
      );
    }
  }
}

const submitPrintRequestValidator = () => {
  return [
    body("quoteToken")
      .trim()
      .notEmpty()
      .withMessage("Quote token is required")
      .bail()
      .isLength({ min: 64, max: 64 })
      .withMessage("Quote token is invalid")
      .bail()
      .isHexadecimal()
      .withMessage("Quote token is invalid"),

    body("notes")
      .optional()
      .trim()
      .isString()
      .withMessage("Notes must be a string")
      .bail()
      .isLength({ max: MAX_PRINT_REQUEST_NOTES_LENGTH })
      .withMessage(
        `Notes must not exceed ${MAX_PRINT_REQUEST_NOTES_LENGTH} characters`,
      ),

    body().custom((_, { req }) => {
      rejectForbiddenClientFields(req);

      if (req.file) {
        throw new Error(
          "Model file is not allowed when submitting from a quote token",
        );
      }

      const allowedFields = new Set(["quoteToken", "notes"]);

      for (const field of Object.keys(req.body)) {
        if (!allowedFields.has(field)) {
          throw new Error(`${field} is not allowed for quote submission`);
        }
      }

      return true;
    }),
  ];
};

const printRequestIdValidator = () => {
  return [
    param("requestId")
      .isInt({ min: 1 })
      .withMessage("Print request ID must be a positive integer"),
  ];
};

const listMyPrintRequestsQueryValidator = () => {
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
      .isIn([
        "pending_review",
        "design_in_progress",
        "approved",
        "payment_slip_issued",
        "payment_submitted",
        "payment_verified",
        "printing",
        "completed",
        "rejected",
      ])
      .withMessage(
        "Status must be one of: pending_review, design_in_progress, approved, payment_slip_issued, payment_submitted, payment_verified, printing, completed, rejected",
      ),
  ];
};

const listAllPrintRequestsQueryValidator = () => {
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
      .isIn(PRINT_REQUEST_STATUS_VALUES)
      .withMessage(
        "Status must be one of: pending_review, design_in_progress, approved, payment_slip_issued, payment_submitted, payment_verified, printing, completed, rejected",
      ),

    query("sourceType")
      .optional()
      .trim()
      .isIn(PRINT_REQUEST_SOURCE_TYPE_VALUES)
      .withMessage(
        "Source type must be one of: upload, library, design_request",
      ),
  ];
};

const updatePrintRequestStatusValidator = () => {
  return [
    ...printRequestIdValidator(),

    body("status")
      .trim()
      .notEmpty()
      .withMessage("Status is required")
      .bail()
      .isIn(PRINT_REQUEST_STATUS_VALUES)
      .withMessage(
        "Status must be one of: pending_review, design_in_progress, approved, payment_slip_issued, payment_submitted, payment_verified, printing, completed, rejected",
      ),

    body("rejectionReason")
      .optional()
      .trim()
      .isString()
      .withMessage("Rejection reason must be a string")
      .bail()
      .isLength({ max: 2000 })
      .withMessage("Rejection reason must not exceed 2000 characters"),

    body("confirmedCost")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Confirmed cost must be a non-negative number"),

    body("note")
      .optional()
      .trim()
      .isString()
      .withMessage("Note must be a string")
      .bail()
      .isLength({ max: 2000 })
      .withMessage("Note must not exceed 2000 characters"),

    body().custom((_, { req }) => {
      const allowedFields = new Set([
        "status",
        "rejectionReason",
        "confirmedCost",
        "note",
      ]);

      for (const field of Object.keys(req.body)) {
        if (!allowedFields.has(field)) {
          throw new Error(`${field} is not allowed for status updates`);
        }
      }

      return true;
    }),
  ];
};

const uploadPrintRequestReceiptValidator = () => {
  return [
    ...printRequestIdValidator(),

    body().custom((_, { req }) => {
      if (!req.file) {
        throw new Error("Receipt file is required");
      }

      const allowedFields = new Set([]);

      for (const field of Object.keys(req.body)) {
        if (!allowedFields.has(field)) {
          throw new Error(`${field} is not allowed for receipt upload`);
        }
      }

      return true;
    }),
  ];
};

const uploadPrintRequestPaymentSlipValidator = () => {
  return [
    ...printRequestIdValidator(),

    body("confirmedCost")
      .exists()
      .withMessage("Confirmed cost is required")
      .bail()
      .isFloat({ min: 0 })
      .withMessage("Confirmed cost must be a non-negative number"),

    body("note")
      .optional()
      .trim()
      .isString()
      .withMessage("Note must be a string")
      .bail()
      .isLength({ max: 2000 })
      .withMessage("Note must not exceed 2000 characters"),

    body().custom((_, { req }) => {
      if (!req.file) {
        throw new Error("Payment slip file is required");
      }

      const allowedFields = new Set(["confirmedCost", "note"]);

      for (const field of Object.keys(req.body)) {
        if (!allowedFields.has(field)) {
          throw new Error(`${field} is not allowed for payment slip upload`);
        }
      }

      return true;
    }),
  ];
};

export {
  submitPrintRequestValidator,
  printRequestIdValidator,
  listMyPrintRequestsQueryValidator,
  listAllPrintRequestsQueryValidator,
  updatePrintRequestStatusValidator,
  uploadPrintRequestPaymentSlipValidator,
  uploadPrintRequestReceiptValidator,
};
