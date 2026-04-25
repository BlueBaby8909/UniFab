import fs from "fs";
import path from "path";

const PRINT_REQUEST_STORAGE_ROOT = path.resolve(
  process.cwd(),
  "storage",
  "print-requests",
);

const PRINT_REQUEST_MODEL_FILES_ROOT = path.join(
  PRINT_REQUEST_STORAGE_ROOT,
  "models",
);

const PRINT_REQUEST_RECEIPTS_ROOT = path.join(
  PRINT_REQUEST_STORAGE_ROOT,
  "receipts",
);

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function buildPrintRequestModelPublicPath(file) {
  if (!file?.filename) {
    return null;
  }

  return `/storage/print-requests/models/${file.filename}`;
}

function buildPrintRequestReceiptPublicPath(file) {
  if (!file?.filename) {
    return null;
  }

  return `/storage/print-requests/receipts/${file.filename}`;
}

function getManagedPrintRequestModelAbsolutePath(publicPath) {
  if (!hasText(publicPath)) {
    return null;
  }

  const normalizedPublicPath = String(publicPath).trim();
  const publicPrefix = "/storage/print-requests/models/";

  if (!normalizedPublicPath.startsWith(publicPrefix)) {
    return null;
  }

  const fileName = path.basename(normalizedPublicPath);

  if (!fileName || fileName === "." || fileName === "..") {
    return null;
  }

  return path.resolve(PRINT_REQUEST_MODEL_FILES_ROOT, fileName);
}

function getManagedPrintRequestReceiptAbsolutePath(publicPath) {
  if (!hasText(publicPath)) {
    return null;
  }

  const normalizedPublicPath = String(publicPath).trim();
  const publicPrefix = "/storage/print-requests/receipts/";

  if (!normalizedPublicPath.startsWith(publicPrefix)) {
    return null;
  }

  const fileName = path.basename(normalizedPublicPath);

  if (!fileName || fileName === "." || fileName === "..") {
    return null;
  }

  return path.resolve(PRINT_REQUEST_RECEIPTS_ROOT, fileName);
}

async function removeManagedPrintRequestModelFile(publicPath) {
  const absolutePath = getManagedPrintRequestModelAbsolutePath(publicPath);

  if (!absolutePath) {
    return false;
  }

  if (!fs.existsSync(absolutePath)) {
    return false;
  }

  await fs.promises.rm(absolutePath, { force: true });
  return true;
}

async function removeManagedPrintRequestReceiptFile(publicPath) {
  const absolutePath = getManagedPrintRequestReceiptAbsolutePath(publicPath);

  if (!absolutePath) {
    return false;
  }

  if (!fs.existsSync(absolutePath)) {
    return false;
  }

  await fs.promises.rm(absolutePath, { force: true });
  return true;
}

export {
  PRINT_REQUEST_STORAGE_ROOT,
  PRINT_REQUEST_MODEL_FILES_ROOT,
  PRINT_REQUEST_RECEIPTS_ROOT,
  buildPrintRequestModelPublicPath,
  buildPrintRequestReceiptPublicPath,
  getManagedPrintRequestModelAbsolutePath,
  getManagedPrintRequestReceiptAbsolutePath,
  removeManagedPrintRequestModelFile,
  removeManagedPrintRequestReceiptFile,
};
