import fs from "fs";
import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

function cleanupUploadedFiles(req) {
  try {
    if (req.file?.path) {
      fs.rmSync(req.file.path, { force: true });
    }

    if (Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file?.path) {
          fs.rmSync(file.path, { force: true });
        }
      }
    } else if (req.files && typeof req.files === "object") {
      for (const value of Object.values(req.files)) {
        if (Array.isArray(value)) {
          for (const file of value) {
            if (file?.path) {
              fs.rmSync(file.path, { force: true });
            }
          }
        }
      }
    }
  } catch {
    // Ignore cleanup errors so validation errors still return normally.
  }
}

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  cleanupUploadedFiles(req);

  const extractedErrors = [];
  errors.array().forEach((err) => {
    extractedErrors.push({ [err.path]: err.msg });
  });

  return next(new ApiError(422, "Received data is not valid", extractedErrors));
};
