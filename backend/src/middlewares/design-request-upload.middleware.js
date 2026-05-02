import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { ApiError } from "../utils/api-error.js";
import { ensureDirExists } from "../utils/temp-path.util.js";
import { DESIGN_REQUEST_REFERENCE_FILES_ROOT } from "../utils/design-request-storage.util.js";

const DESIGN_REQUEST_REFERENCE_UPLOAD_FIELD = "referenceFiles";
const MAX_REFERENCE_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REFERENCE_FILE_COUNT = 5;

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".pdf",
  ".stl",
  ".obj",
  ".3mf",
]);

ensureDirExists(DESIGN_REQUEST_REFERENCE_FILES_ROOT);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, DESIGN_REQUEST_REFERENCE_FILES_ROOT);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new ApiError(
        400,
        "Invalid reference file type. Only JPG, JPEG, PNG, PDF, STL, OBJ, and 3MF files are allowed.",
      ),
      false,
    );
  }

  return cb(null, true);
}

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_REFERENCE_FILE_SIZE,
    files: MAX_REFERENCE_FILE_COUNT,
  },
  fileFilter,
});

const designRequestReferenceUploadMiddleware = upload.array(
  DESIGN_REQUEST_REFERENCE_UPLOAD_FIELD,
  MAX_REFERENCE_FILE_COUNT,
);

export {
  DESIGN_REQUEST_REFERENCE_UPLOAD_FIELD,
  MAX_REFERENCE_FILE_COUNT,
  designRequestReferenceUploadMiddleware,
};
