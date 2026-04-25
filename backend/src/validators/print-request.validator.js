import { body, param, query } from "express-validator";
import {
  PRINT_REQUEST_SOURCE_TYPES,
  PRINT_REQUEST_SOURCE_TYPE_VALUES,
  PRINT_REQUEST_STATUS_VALUES,
  PRINT_QUALITY_VALUES,
  MAX_PRINT_REQUEST_NOTES_LENGTH,
  MAX_PRINT_REQUEST_QUANTITY,
} from "../constants/print-request.constants.js";

const LIBRARY_SOURCE_VALUES = ["local", "myminifactory"];

function hasOwnField(req, fieldName) {
  return Object.prototype.hasOwnProperty.call(req.body, fieldName);
}

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function getSourceType(req) {
  return hasText(req.body.sourceType) ? String(req.body.sourceType).trim() : "";
}

function getLibrarySource(req) {
  return hasText(req.body.librarySource)
    ? String(req.body.librarySource).trim()
    : "";
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
    body("sourceType")
      .trim()
      .notEmpty()
      .withMessage("Source type is required")
      .bail()
      .isIn(PRINT_REQUEST_SOURCE_TYPE_VALUES)
      .withMessage(
        "Source type must be one of: upload, library, design_request",
      ),

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

    body("printQuality")
      .trim()
      .notEmpty()
      .withMessage("Print quality is required")
      .bail()
      .isIn(PRINT_QUALITY_VALUES)
      .withMessage("Print quality must be one of: draft, standard, fine"),

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
      .isInt({ min: 1, max: MAX_PRINT_REQUEST_QUANTITY })
      .withMessage(
        `Quantity must be between 1 and ${MAX_PRINT_REQUEST_QUANTITY}`,
      ),

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

    body("librarySource")
      .optional()
      .trim()
      .isIn(LIBRARY_SOURCE_VALUES)
      .withMessage("Library source must be one of: local, myminifactory"),

    body("designId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Design ID must be a positive integer"),

    body("mmfObjectId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("MyMiniFactory object ID must be a positive integer"),

    body("designRequestId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Design request ID must be a positive integer"),

    body().custom((_, { req }) => {
      rejectForbiddenClientFields(req);

      const sourceType = getSourceType(req);

      if (sourceType === PRINT_REQUEST_SOURCE_TYPES.UPLOAD) {
        if (!req.file) {
          throw new Error("Model file is required when source type is upload");
        }

        if (hasOwnField(req, "designId")) {
          throw new Error(
            "Design ID is not allowed when source type is upload",
          );
        }

        if (hasOwnField(req, "mmfObjectId")) {
          throw new Error(
            "MyMiniFactory object ID is not allowed when source type is upload",
          );
        }

        if (hasOwnField(req, "librarySource")) {
          throw new Error(
            "Library source is not allowed when source type is upload",
          );
        }

        if (hasOwnField(req, "designRequestId")) {
          throw new Error(
            "Design request ID is not allowed when source type is upload",
          );
        }
      }

      if (sourceType === PRINT_REQUEST_SOURCE_TYPES.LIBRARY) {
        const librarySource = getLibrarySource(req);

        if (!librarySource) {
          throw new Error(
            "Library source is required when source type is library",
          );
        }

        if (req.file) {
          throw new Error(
            "Model file is not allowed when source type is library",
          );
        }

        if (hasOwnField(req, "designRequestId")) {
          throw new Error(
            "Design request ID is not allowed when source type is library",
          );
        }

        if (librarySource === "local") {
          if (!hasText(req.body.designId)) {
            throw new Error(
              "Design ID is required when library source is local",
            );
          }

          if (hasOwnField(req, "mmfObjectId")) {
            throw new Error(
              "MyMiniFactory object ID is not allowed when library source is local",
            );
          }
        }

        if (librarySource === "myminifactory") {
          if (!hasText(req.body.mmfObjectId)) {
            throw new Error(
              "MyMiniFactory object ID is required when library source is myminifactory",
            );
          }

          if (hasOwnField(req, "designId")) {
            throw new Error(
              "Design ID is not allowed when library source is myminifactory",
            );
          }
        }
      }

      if (sourceType === PRINT_REQUEST_SOURCE_TYPES.DESIGN_REQUEST) {
        if (!hasText(req.body.designRequestId)) {
          throw new Error(
            "Design request ID is required when source type is design_request",
          );
        }

        if (req.file) {
          throw new Error(
            "Model file is not allowed when source type is design_request",
          );
        }

        if (hasOwnField(req, "designId")) {
          throw new Error(
            "Design ID is not allowed when source type is design_request",
          );
        }

        if (hasOwnField(req, "mmfObjectId")) {
          throw new Error(
            "MyMiniFactory object ID is not allowed when source type is design_request",
          );
        }

        if (hasOwnField(req, "librarySource")) {
          throw new Error(
            "Library source is not allowed when source type is design_request",
          );
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

    body("paymentSlipUrl")
      .optional()
      .trim()
      .isString()
      .withMessage("Payment slip URL must be a string")
      .bail()
      .isLength({ max: 500 })
      .withMessage("Payment slip URL must not exceed 500 characters"),

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
        "paymentSlipUrl",
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

export {
  submitPrintRequestValidator,
  printRequestIdValidator,
  listMyPrintRequestsQueryValidator,
  listAllPrintRequestsQueryValidator,
  updatePrintRequestStatusValidator,
  uploadPrintRequestReceiptValidator,
};
