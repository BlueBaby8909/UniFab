import fs from "fs";
import path from "path";

const DESIGN_REQUEST_STORAGE_ROOT = path.resolve(
  process.cwd(),
  "storage",
  "design-requests",
);

const DESIGN_REQUEST_REFERENCE_FILES_ROOT = path.join(
  DESIGN_REQUEST_STORAGE_ROOT,
  "references",
);

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function buildDesignRequestReferencePublicPath(file) {
  if (!file?.filename) {
    return null;
  }

  return `/storage/design-requests/references/${file.filename}`;
}

function getManagedDesignRequestReferenceAbsolutePath(publicPath) {
  if (!hasText(publicPath)) {
    return null;
  }

  const normalizedPublicPath = String(publicPath).trim();
  const publicPrefix = "/storage/design-requests/references/";

  if (!normalizedPublicPath.startsWith(publicPrefix)) {
    return null;
  }

  const fileName = path.basename(normalizedPublicPath);

  if (!fileName || fileName === "." || fileName === "..") {
    return null;
  }

  return path.resolve(DESIGN_REQUEST_REFERENCE_FILES_ROOT, fileName);
}

async function removeManagedDesignRequestReferenceFile(publicPath) {
  const absolutePath =
    getManagedDesignRequestReferenceAbsolutePath(publicPath);

  if (!absolutePath || !fs.existsSync(absolutePath)) {
    return false;
  }

  await fs.promises.rm(absolutePath, { force: true });
  return true;
}

async function removeManagedDesignRequestReferenceFiles(referenceFiles) {
  if (!Array.isArray(referenceFiles)) {
    return 0;
  }

  let removedCount = 0;

  for (const referenceFile of referenceFiles) {
    if (await removeManagedDesignRequestReferenceFile(referenceFile.url)) {
      removedCount += 1;
    }
  }

  return removedCount;
}

export {
  DESIGN_REQUEST_STORAGE_ROOT,
  DESIGN_REQUEST_REFERENCE_FILES_ROOT,
  buildDesignRequestReferencePublicPath,
  getManagedDesignRequestReferenceAbsolutePath,
  removeManagedDesignRequestReferenceFile,
  removeManagedDesignRequestReferenceFiles,
};
