import fs from "fs";
import path from "path";

const SLICER_PROFILE_STORAGE_DIR = path.resolve(
  process.cwd(),
  "storage",
  "slicer-profiles",
  "library",
);

function ensureSlicerProfileStorageDir() {
  fs.mkdirSync(SLICER_PROFILE_STORAGE_DIR, { recursive: true });
  return SLICER_PROFILE_STORAGE_DIR;
}

function getSlicerProfileStorageDir() {
  return SLICER_PROFILE_STORAGE_DIR;
}

function getSlicerProfileFilePath(profileFilename) {
  return path.join(SLICER_PROFILE_STORAGE_DIR, profileFilename);
}

export {
  SLICER_PROFILE_STORAGE_DIR,
  ensureSlicerProfileStorageDir,
  getSlicerProfileStorageDir,
  getSlicerProfileFilePath,
};
