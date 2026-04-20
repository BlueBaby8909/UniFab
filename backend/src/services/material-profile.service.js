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

function parseRequiredNonNegativeNumber(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    throw new ApiError(400, `${fieldName} is required`);
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

function validateProfileUploadInput({ tempFilePath, uploadedBy }) {
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
}

async function createNewActiveProfileVersion({
  connection,
  materialRow,
  quality,
  printerName,
  nozzle,
  supportRule,
  orientationRule,
  tempFilePath,
  originalFileName,
  uploadedBy,
  fileState,
}) {
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

  const [versionRows] = await connection.query(
    `
      SELECT version_number
      FROM slicer_profiles
      WHERE material_id = ? AND quality = ?
      ORDER BY version_number DESC
      LIMIT 1
    `,
    [materialRow.id, quality],
  );

  const nextVersion = Number(versionRows[0]?.version_number || 0) + 1;

  const finalFileName = buildStoredProfileFileName({
    materialKey: materialRow.material_key,
    quality,
    versionNumber: nextVersion,
    originalFileName,
  });

  const finalFilePath = getSlicerProfileFilePath(finalFileName);
  fileState.finalFilePath = finalFilePath;

  await fs.promises.rename(tempFilePath, finalFilePath);

  await connection.query(
    `
      UPDATE slicer_profiles
      SET is_active = FALSE
      WHERE material_id = ? AND quality = ? AND is_active = TRUE
    `,
    [materialRow.id, quality],
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
      materialRow.id,
      quality,
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

  return profileRows[0];
}

/**
 * Temporary backward-compatible flow:
 * create/update material metadata, then register a new profile version.
 */
// async function registerMaterialProfile({
//   materialKey,
//   displayName,
//   materialCostPerGram,
//   isActiveMaterial,
//   quality,
//   printerName = "Creality Ender 3 V3 SE",
//   nozzle = "0.4mm",
//   supportRule = "auto",
//   orientationRule = "original",
//   tempFilePath,
//   originalFileName,
//   uploadedBy,
// }) {
//   validateProfileUploadInput({ tempFilePath, uploadedBy });

//   const normalizedMaterialKey = normalizeMaterialKey(materialKey);
//   const normalizedQuality = normalizeQuality(quality);
//   const parsedMaterialCostPerGram = parseRequiredNonNegativeNumber(
//     materialCostPerGram,
//     "Material cost per gram",
//   );
//   const parsedIsActiveMaterial = parseOptionalBoolean(
//     isActiveMaterial,
//     "isActiveMaterial",
//   );

//   const connection = await pool.getConnection();
//   const fileState = { finalFilePath: null };

//   try {
//     await connection.beginTransaction();

//     const [existingMaterialRows] = await connection.query(
//       `
//         SELECT
//           id,
//           material_key,
//           display_name,
//           material_cost_per_gram,
//           is_active,
//           created_at,
//           updated_at
//         FROM materials
//         WHERE material_key = ?
//         LIMIT 1
//         FOR UPDATE
//       `,
//       [normalizedMaterialKey],
//     );

//     let materialId;

//     if (existingMaterialRows.length === 0) {
//       const nextDisplayName = normalizeDisplayName(
//         displayName,
//         normalizedMaterialKey,
//       );
//       const nextIsActiveMaterial =
//         parsedIsActiveMaterial !== undefined ? parsedIsActiveMaterial : true;

//       const [insertMaterialResult] = await connection.query(
//         `
//           INSERT INTO materials (
//             material_key,
//             display_name,
//             material_cost_per_gram,
//             is_active
//           )
//           VALUES (?, ?, ?, ?)
//         `,
//         [
//           normalizedMaterialKey,
//           nextDisplayName,
//           parsedMaterialCostPerGram,
//           nextIsActiveMaterial,
//         ],
//       );

//       materialId = insertMaterialResult.insertId;
//     } else {
//       const existingMaterial = existingMaterialRows[0];

//       const nextDisplayName = hasText(displayName)
//         ? normalizeDisplayName(displayName, normalizedMaterialKey)
//         : existingMaterial.display_name;

//       const nextIsActiveMaterial =
//         parsedIsActiveMaterial !== undefined
//           ? parsedIsActiveMaterial
//           : Boolean(existingMaterial.is_active);

//       await connection.query(
//         `
//           UPDATE materials
//           SET
//             display_name = ?,
//             material_cost_per_gram = ?,
//             is_active = ?
//           WHERE id = ?
//         `,
//         [
//           nextDisplayName,
//           parsedMaterialCostPerGram,
//           nextIsActiveMaterial,
//           existingMaterial.id,
//         ],
//       );

//       materialId = existingMaterial.id;
//     }

//     const [materialRows] = await connection.query(
//       `
//         SELECT
//           id,
//           material_key,
//           display_name,
//           material_cost_per_gram,
//           is_active,
//           created_at,
//           updated_at
//         FROM materials
//         WHERE id = ?
//         LIMIT 1
//       `,
//       [materialId],
//     );

//     const materialRow = materialRows[0];

//     const slicerProfile = await createNewActiveProfileVersion({
//       connection,
//       materialRow,
//       quality: normalizedQuality,
//       printerName,
//       nozzle,
//       supportRule,
//       orientationRule,
//       tempFilePath,
//       originalFileName,
//       uploadedBy,
//       fileState,
//     });

//     await connection.commit();

//     return {
//       material: materialRow,
//       slicerProfile,
//     };
//   } catch (error) {
//     await connection.rollback();

//     if (fileState.finalFilePath && fs.existsSync(fileState.finalFilePath)) {
//       await fs.promises.rm(fileState.finalFilePath, { force: true });
//     }

//     if (tempFilePath && fs.existsSync(tempFilePath)) {
//       await fs.promises.rm(tempFilePath, { force: true });
//     }

//     throw error;
//   } finally {
//     connection.release();
//   }
// }

/**
 * New long-term flow:
 * register a new slicer profile version for an existing active material only.
 */
async function registerSlicerProfileVersion({
  materialKey,
  quality,
  printerName = "Creality Ender 3 V3 SE",
  nozzle = "0.4mm",
  supportRule = "auto",
  orientationRule = "original",
  tempFilePath,
  originalFileName,
  uploadedBy,
}) {
  validateProfileUploadInput({ tempFilePath, uploadedBy });

  const normalizedMaterialKey = normalizeMaterialKey(materialKey);
  const normalizedQuality = normalizeQuality(quality);

  const connection = await pool.getConnection();
  const fileState = { finalFilePath: null };

  try {
    await connection.beginTransaction();

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
        WHERE material_key = ? AND is_active = TRUE
        LIMIT 1
        FOR UPDATE
      `,
      [normalizedMaterialKey],
    );

    const materialRow = materialRows[0];

    if (!materialRow) {
      throw new ApiError(
        404,
        `Active material not found for key: ${normalizedMaterialKey}`,
      );
    }

    const slicerProfile = await createNewActiveProfileVersion({
      connection,
      materialRow,
      quality: normalizedQuality,
      printerName,
      nozzle,
      supportRule,
      orientationRule,
      tempFilePath,
      originalFileName,
      uploadedBy,
      fileState,
    });

    await connection.commit();

    return {
      material: materialRow,
      slicerProfile,
    };
  } catch (error) {
    await connection.rollback();

    if (fileState.finalFilePath && fs.existsSync(fileState.finalFilePath)) {
      await fs.promises.rm(fileState.finalFilePath, { force: true });
    }

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      await fs.promises.rm(tempFilePath, { force: true });
    }

    throw error;
  } finally {
    connection.release();
  }
}

export { registerSlicerProfileVersion };
