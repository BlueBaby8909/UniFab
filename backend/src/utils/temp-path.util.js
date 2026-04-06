import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getTempDir(...segments) {
  const dirPath = path.resolve(process.cwd(), "temp", ...segments);
  ensureDirExists(dirPath);
  return dirPath;
}

function createTempFilePath(folderSegments, extension) {
  const dirPath = getTempDir(...folderSegments);
  return path.join(dirPath, `${randomUUID()}${extension}`);
}

export { ensureDirExists, getTempDir, createTempFilePath };
