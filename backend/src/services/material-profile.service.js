import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import pool from "../db/db.js";
import { ApiError } from "../utils/api-error.js";
import {
  ensureSlicerProfileStorageDir,
  getSlicerProfileFilePath,
} from "../utils/slicer-profile-path.util.js";

const ALLOWED_QUALITIES = new Set(["draft", "standard", "fine"]);

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizeMaterialKey(materialKey) {
  if (!hasText(materialKey)) {
    throw new ApiError(400, "Material key is required");
  }

  return String(materialKey).trim().toUpperCase();
}

function normalizeQuality(quality) {
  if (!hasText(quality)) {
    throw new ApiError(400, "Quality is required");
  }

  const normalizedQuality = String(quality).trim().toLowerCase();

  if (!ALLOWED_QUALITIES.has(normalizedQuality)) {
    throw new ApiError(400, "Quality must be one of: draft, standard, fine");
  }

  return normalizedQuality;
}

function normalizeDisplayName(displayName, fallbackValue) {
  if (!hasText(displayName)) {
    return fallbackValue;
  }

  return String(displayName).trim();
}

function parseOptionalNonNegativeNumber(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue) || parsedValue < 0) {
    throw new ApiError(400, `${fieldName} must be a valid non-negative number`);
  }

  return parsedValue;
}

function parseOptionalBoolean(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  if (["true", "1", "yes"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "0", "no"].includes(normalizedValue)) {
    return false;
  }

  throw new ApiError(400, `${fieldName} must be a valid boolean value`);
}

function toSafeSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getIniExtension(originalFileName) {
  if (!hasText(originalFileName)) {
    throw new ApiError(400, "Original file name is required");
  }

  const ext = path.extname(originalFileName).toLowerCase();

  if (ext !== ".ini") {
    throw new ApiError(400, "Only .ini files are allowed");
  }

  return ext;
}

function buildStoredProfileFileName({
  materialKey,
  quality,
  versionNumber,
  originalFileName,
}) {
  const ext = getIniExtension(originalFileName);
  const uniqueSuffix = randomUUID().split("-")[0];

  return `${toSafeSlug(materialKey)}-${toSafeSlug(quality)}-v${versionNumber}-${uniqueSuffix}${ext}`;
}

async function registerMaterialProfile({
  materialKey,
  displayName,
  materialCostPerGram,
  isActiveMaterial,
  quality,
  printerName = "Creality Ender 3 V3 SE",
  nozzle = "0.4mm",
  supportRule = "auto",
  orientationRule = "original",
  tempFilePath,
  originalFileName,
  uploadedBy,
}) {
  if (!tempFilePath) {
    throw new ApiError(400, "Profile file is required");
  }

  if (!fs.existsSync(tempFilePath)) {
    throw new ApiError(400, "Uploaded profile file does not exist");
  }

  if (!Number.isInteger(Number(uploadedBy)) || Number(uploadedBy) < 1) {
    throw new ApiError(401, "Valid uploadedBy user id is required");
  }

  ensureSlicerProfileStorageDir();

  const normalizedMaterialKey = normalizeMaterialKey(materialKey);
  const normalizedQuality = normalizeQuality(quality);
  const parsedMaterialCostPerGram = parseOptionalNonNegativeNumber(
    materialCostPerGram,
    "Material cost per gram",
  );
  const parsedIsActiveMaterial = parseOptionalBoolean(
    isActiveMaterial,
    "isActiveMaterial",
  );

  const normalizedPrinterName = hasText(printerName)
    ? String(printerName).trim()
    : "Creality Ender 3 V3 SE";

  const normalizedNozzle = hasText(nozzle) ? String(nozzle).trim() : "0.4mm";

  const normalizedSupportRule = hasText(supportRule)
    ? String(supportRule).trim()
    : "auto";

  const normalizedOrientationRule = hasText(orientationRule)
    ? String(orientationRule).trim()
    : "original";

  const connection = await pool.getConnection();
  let finalFilePath = null;

  try {
    await connection.beginTransaction();

    const [existingMaterialRows] = await connection.query(
      `
        SELECT
          id,
          material_key,
          display_name,
          material_cost_per_gram,
          is_active,
          created_at,
          updated_at
        FROM materials
        WHERE material_key = ?
        LIMIT 1
        FOR UPDATE
      `,
      [normalizedMaterialKey],
    );

    let materialId;

    if (existingMaterialRows.length === 0) {
      if (parsedMaterialCostPerGram === null) {
        throw new ApiError(
          400,
          "Material cost per gram is required for a new material",
        );
      }

      const nextDisplayName = normalizeDisplayName(
        displayName,
        normalizedMaterialKey,
      );
      const nextIsActiveMaterial =
        parsedIsActiveMaterial !== undefined ? parsedIsActiveMaterial : true;

      const [insertMaterialResult] = await connection.query(
        `
          INSERT INTO materials (
            material_key,
            display_name,
            material_cost_per_gram,
            is_active
          )
          VALUES (?, ?, ?, ?)
        `,
        [
          normalizedMaterialKey,
          nextDisplayName,
          parsedMaterialCostPerGram,
          nextIsActiveMaterial,
        ],
      );

      materialId = insertMaterialResult.insertId;
    } else {
      const existingMaterial = existingMaterialRows[0];

      const nextDisplayName = hasText(displayName)
        ? normalizeDisplayName(displayName, normalizedMaterialKey)
        : existingMaterial.display_name;

      const nextMaterialCostPerGram =
        parsedMaterialCostPerGram !== null
          ? parsedMaterialCostPerGram
          : Number(existingMaterial.material_cost_per_gram);

      const nextIsActiveMaterial =
        parsedIsActiveMaterial !== undefined
          ? parsedIsActiveMaterial
          : Boolean(existingMaterial.is_active);

      await connection.query(
        `
          UPDATE materials
          SET
            display_name = ?,
            material_cost_per_gram = ?,
            is_active = ?
          WHERE id = ?
        `,
        [
          nextDisplayName,
          nextMaterialCostPerGram,
          nextIsActiveMaterial,
          existingMaterial.id,
        ],
      );

      materialId = existingMaterial.id;
    }

    const [materialRows] = await connection.query(
      `
        SELECT
          id,
          material_key,
          display_name,
          material_cost_per_gram,
          is_active,
          created_at,
          updated_at
        FROM materials
        WHERE id = ?
        LIMIT 1
      `,
      [materialId],
    );

    const materialRow = materialRows[0];

    const [versionRows] = await connection.query(
      `
        SELECT version_number
        FROM slicer_profiles
        WHERE material_id = ? AND quality = ?
        ORDER BY version_number DESC
        LIMIT 1
      `,
      [materialId, normalizedQuality],
    );

    const nextVersion = Number(versionRows[0]?.version_number || 0) + 1;

    const finalFileName = buildStoredProfileFileName({
      materialKey: materialRow.material_key,
      quality: normalizedQuality,
      versionNumber: nextVersion,
      originalFileName,
    });

    finalFilePath = getSlicerProfileFilePath(finalFileName);

    await fs.promises.rename(tempFilePath, finalFilePath);

    await connection.query(
      `
        UPDATE slicer_profiles
        SET is_active = FALSE
        WHERE material_id = ? AND quality = ? AND is_active = TRUE
      `,
      [materialId, normalizedQuality],
    );

    const [insertProfileResult] = await connection.query(
      `
        INSERT INTO slicer_profiles (
          material_id,
          quality,
          printer_name,
          nozzle,
          support_rule,
          orientation_rule,
          profile_filename,
          version_number,
          is_active,
          uploaded_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)
      `,
      [
        materialId,
        normalizedQuality,
        normalizedPrinterName,
        normalizedNozzle,
        normalizedSupportRule,
        normalizedOrientationRule,
        finalFileName,
        nextVersion,
        uploadedBy,
      ],
    );

    const [profileRows] = await connection.query(
      `
        SELECT
          id,
          material_id,
          quality,
          printer_name,
          nozzle,
          support_rule,
          orientation_rule,
          profile_filename,
          version_number,
          is_active,
          uploaded_by,
          created_at,
          updated_at
        FROM slicer_profiles
        WHERE id = ?
        LIMIT 1
      `,
      [insertProfileResult.insertId],
    );

    await connection.commit();

    return {
      material: materialRow,
      slicerProfile: profileRows[0],
    };
  } catch (error) {
    await connection.rollback();

    if (finalFilePath && fs.existsSync(finalFilePath)) {
      await fs.promises.rm(finalFilePath, { force: true });
    }

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      await fs.promises.rm(tempFilePath, { force: true });
    }

    throw error;
  } finally {
    connection.release();
  }
}

export { registerMaterialProfile };
