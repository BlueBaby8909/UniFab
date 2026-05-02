import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";
import { ApiError } from "../utils/api-error.js";
import { ensureDirExists } from "../utils/temp-path.util.js";
import {
  PRINT_REQUEST_MODEL_UPLOAD_FIELD,
  PRINT_REQUEST_RECEIPT_UPLOAD_FIELD,
  PRINT_REQUEST_PAYMENT_SLIP_UPLOAD_FIELD,
  PRINT_REQUEST_MODEL_ALLOWED_EXTENSIONS,
  PRINT_REQUEST_RECEIPT_ALLOWED_EXTENSIONS,
  PRINT_REQUEST_RECEIPT_ALLOWED_MIME_TYPES,
  PRINT_REQUEST_PAYMENT_SLIP_ALLOWED_EXTENSIONS,
  PRINT_REQUEST_PAYMENT_SLIP_ALLOWED_MIME_TYPES,
  MAX_PRINT_REQUEST_MODEL_FILE_SIZE_BYTES,
  MAX_PRINT_REQUEST_RECEIPT_FILE_SIZE_BYTES,
  MAX_PRINT_REQUEST_PAYMENT_SLIP_FILE_SIZE_BYTES,
} from "../constants/print-request.constants.js";
import {
  PRINT_REQUEST_MODEL_FILES_ROOT,
  PRINT_REQUEST_PAYMENT_SLIPS_ROOT,
  PRINT_REQUEST_RECEIPTS_ROOT,
} from "../utils/print-request-storage.util.js";

const ALLOWED_MODEL_EXTENSIONS = new Set(
  PRINT_REQUEST_MODEL_ALLOWED_EXTENSIONS,
);

const ALLOWED_RECEIPT_EXTENSIONS = new Set(
  PRINT_REQUEST_RECEIPT_ALLOWED_EXTENSIONS,
);

const ALLOWED_PAYMENT_SLIP_EXTENSIONS = new Set(
  PRINT_REQUEST_PAYMENT_SLIP_ALLOWED_EXTENSIONS,
);

const ALLOWED_RECEIPT_MIME_TYPES = new Set(
  PRINT_REQUEST_RECEIPT_ALLOWED_MIME_TYPES,
);

const ALLOWED_PAYMENT_SLIP_MIME_TYPES = new Set(
  PRINT_REQUEST_PAYMENT_SLIP_ALLOWED_MIME_TYPES,
);

ensureDirExists(PRINT_REQUEST_MODEL_FILES_ROOT);
ensureDirExists(PRINT_REQUEST_RECEIPTS_ROOT);
ensureDirExists(PRINT_REQUEST_PAYMENT_SLIPS_ROOT);

const modelStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, PRINT_REQUEST_MODEL_FILES_ROOT);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeFileName = `${randomUUID()}${ext}`;
    cb(null, safeFileName);
  },
});

const receiptStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, PRINT_REQUEST_RECEIPTS_ROOT);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeFileName = `${randomUUID()}${ext}`;
    cb(null, safeFileName);
  },
});

const paymentSlipStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, PRINT_REQUEST_PAYMENT_SLIPS_ROOT);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeFileName = `${randomUUID()}${ext}`;
    cb(null, safeFileName);
  },
});

function modelFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MODEL_EXTENSIONS.has(ext)) {
    return cb(
      new ApiError(
        400,
        "Invalid model file type. Only STL, OBJ, and 3MF files are allowed.",
      ),
      false,
    );
  }

  return cb(null, true);
}

function receiptFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_RECEIPT_EXTENSIONS.has(ext)) {
    return cb(
      new ApiError(
        400,
        "Invalid receipt file type. Only JPG, JPEG, PNG, and PDF files are allowed.",
      ),
      false,
    );
  }

  if (!ALLOWED_RECEIPT_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        "Invalid receipt MIME type. Only JPEG, PNG, and PDF files are allowed.",
      ),
      false,
    );
  }

  return cb(null, true);
}

function paymentSlipFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_PAYMENT_SLIP_EXTENSIONS.has(ext)) {
    return cb(
      new ApiError(
        400,
        "Invalid payment slip file type. Only JPG, JPEG, PNG, and PDF files are allowed.",
      ),
      false,
    );
  }

  if (!ALLOWED_PAYMENT_SLIP_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        "Invalid payment slip MIME type. Only JPEG, PNG, and PDF files are allowed.",
      ),
      false,
    );
  }

  return cb(null, true);
}

const modelUpload = multer({
  storage: modelStorage,
  limits: {
    fileSize: MAX_PRINT_REQUEST_MODEL_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: modelFileFilter,
});

const receiptUpload = multer({
  storage: receiptStorage,
  limits: {
    fileSize: MAX_PRINT_REQUEST_RECEIPT_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: receiptFileFilter,
});

const paymentSlipUpload = multer({
  storage: paymentSlipStorage,
  limits: {
    fileSize: MAX_PRINT_REQUEST_PAYMENT_SLIP_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: paymentSlipFileFilter,
});

const printRequestModelUploadMiddleware = modelUpload.single(
  PRINT_REQUEST_MODEL_UPLOAD_FIELD,
);

const printRequestReceiptUploadMiddleware = receiptUpload.single(
  PRINT_REQUEST_RECEIPT_UPLOAD_FIELD,
);

const printRequestPaymentSlipUploadMiddleware = paymentSlipUpload.single(
  PRINT_REQUEST_PAYMENT_SLIP_UPLOAD_FIELD,
);

export {
  printRequestModelUploadMiddleware,
  printRequestPaymentSlipUploadMiddleware,
  printRequestReceiptUploadMiddleware,
};
