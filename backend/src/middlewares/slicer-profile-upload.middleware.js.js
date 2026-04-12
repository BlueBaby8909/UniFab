import fs from "fs";
import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";
import { ApiError } from "../utils/api-error.js";

const ALLOWED_EXTENSIONS = new Set([".ini"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PROFILE_UPLOAD_DIR = path.resolve(
  process.cwd(),
  "storage",
  "slicer-profiles",
  "incoming",
);

fs.mkdirSync(PROFILE_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, PROFILE_UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const tempFileName = `${randomUUID()}${ext}`;
    cb(null, tempFileName);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new ApiError(400, "Invalid file type. Only .ini files are allowed."),
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

export const SLICER_PROFILE_UPLOAD_FIELD = "profileFile";
export const slicerProfileUploadMiddleware = upload.single(
  SLICER_PROFILE_UPLOAD_FIELD,
);
export { PROFILE_UPLOAD_DIR };
