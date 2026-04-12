import path from "path";
import { randomUUID } from "crypto";
import { getCurrentVersion } from "../models/slicer-profile.model.js";
import { getMaterialByKey } from "../models/materials.model.js";
import { ApiError } from "../utils/api-error.js";

function toSafeSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function generateProfileFileName(materialKey, quality, originalName) {
  if (!materialKey) {
    throw new ApiError(400, "Material is required");
  }

  if (!quality) {
    throw new ApiError(400, "Quality is required");
  }

  if (!originalName) {
    throw new ApiError(400, "Original name is required");
  }

  const ext = path.extname(originalName).toLowerCase();

  if (ext !== ".ini") {
    throw new ApiError(400, "Only .ini files are allowed");
  }

  const materialRow = await getMaterialByKey(materialKey);

  if (!materialRow) {
    throw new ApiError(
      400,
      `Material is not configured or inactive: ${materialKey}`,
    );
  }

  const currentVersion = await getCurrentVersion(materialRow.id, quality);
  const nextVersion = Number(currentVersion) + 1;

  if (!Number.isInteger(nextVersion) || nextVersion < 1) {
    throw new ApiError(
      500,
      "Failed to generate a valid profile version number",
    );
  }

  const safeMaterialKey = toSafeSlug(materialRow.material_key);
  const safeQuality = toSafeSlug(quality);
  const uniqueSuffix = randomUUID().split("-")[0];

  return `${safeMaterialKey}-${safeQuality}-v${nextVersion}-${uniqueSuffix}${ext}`;
}

export { generateProfileFileName };
