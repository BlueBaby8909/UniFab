import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { ApiError } from "../utils/api-error.js";
import { getTempDir } from "../utils/temp-path.util.js";

const ALLOWED_EXTENSIONS = new Set([".stl", ".obj", ".3mf"]);
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const UPLOAD_DIR = getTempDir("quote-uploads");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeFileName = `${randomUUID()}${ext}`;
    cb(null, safeFileName);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new ApiError(
        400,
        "Invalid file type. Only STL, OBJ, and 3MF files are allowed.",
      ),
      false,
    );
  }

  cb(null, true);
}

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

export const quoteUploadMiddleware = upload.single("modelFile");
