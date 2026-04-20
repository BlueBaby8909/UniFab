import fs from "fs";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  getMaterialByKeyForAdmin,
  createMaterial as createMaterialRecord,
  updateMaterialByKey,
  deactivateMaterialByKey,
} from "../models/materials.model.js";
import { registerSlicerProfileVersion } from "../services/material-profile.service.js";

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizeMaterialKey(value, fieldName = "Material key") {
  if (!hasText(value)) {
    throw new ApiError(400, `${fieldName} is required`);
  }

  return String(value).trim().toUpperCase();
}

function normalizeDisplayName(value, fallbackValue) {
  if (!hasText(value)) {
    return fallbackValue;
  }

  return String(value).trim();
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

function parseOptionalNonNegativeNumber(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return undefined;
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

const createMaterial = asyncHandler(async (req, res) => {
  const materialKey = normalizeMaterialKey(req.body.materialKey);
  const existingMaterial = await getMaterialByKeyForAdmin(materialKey);

  if (existingMaterial) {
    throw new ApiError(409, `Material already exists: ${materialKey}`);
  }

  const displayName = normalizeDisplayName(req.body.displayName, materialKey);
  const materialCostPerGram = parseRequiredNonNegativeNumber(
    req.body.materialCostPerGram,
    "Material cost per gram",
  );
  const isActive =
    parseOptionalBoolean(req.body.isActiveMaterial, "isActiveMaterial") ?? true;

  const material = await createMaterialRecord({
    materialKey,
    displayName,
    materialCostPerGram,
    isActive,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { material }, "Material created successfully"));
});

const updateMaterial = asyncHandler(async (req, res) => {
  const materialKey = normalizeMaterialKey(
    req.params.materialKey,
    "Material key",
  );
  const existingMaterial = await getMaterialByKeyForAdmin(materialKey);

  if (!existingMaterial) {
    throw new ApiError(404, `Material not found: ${materialKey}`);
  }

  const displayName = hasText(req.body.displayName)
    ? normalizeDisplayName(req.body.displayName, materialKey)
    : existingMaterial.display_name;

  const materialCostPerGram =
    parseOptionalNonNegativeNumber(
      req.body.materialCostPerGram,
      "Material cost per gram",
    ) ?? Number(existingMaterial.material_cost_per_gram);

  const isActive =
    parseOptionalBoolean(req.body.isActiveMaterial, "isActiveMaterial") ??
    Boolean(existingMaterial.is_active);

  const material = await updateMaterialByKey(materialKey, {
    displayName,
    materialCostPerGram,
    isActive,
  });

  if (!material) {
    throw new ApiError(404, `Material not found: ${materialKey}`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { material }, "Material updated successfully"));
});

const deactivateMaterial = asyncHandler(async (req, res) => {
  const materialKey = normalizeMaterialKey(
    req.params.materialKey,
    "Material key",
  );

  const material = await deactivateMaterialByKey(materialKey);

  if (!material) {
    throw new ApiError(404, `Material not found: ${materialKey}`);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { material }, "Material deactivated successfully"),
    );
});

const uploadSlicerProfileVersion = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Profile file is required");
  }

  const tempFilePath = req.file.path;

  try {
    const result = await registerSlicerProfileVersion({
      materialKey: req.params.materialKey,
      quality: req.body.quality,
      printerName: req.body.printerName,
      nozzle: req.body.nozzle,
      supportRule: req.body.supportRule,
      orientationRule: req.body.orientationRule,
      tempFilePath,
      originalFileName: req.file.originalname,
      uploadedBy: req.user.id,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          result,
          "Slicer profile version registered successfully",
        ),
      );
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      await fs.promises.rm(tempFilePath, { force: true });
    }
  }
});

/**
 * Temporary backward-compatible controller for the current POST /materials route.
 * This will be removed after the routes are updated in the next step.
 */
// const addMaterial = asyncHandler(async (req, res) => {
//   if (!req.file) {
//     throw new ApiError(400, "Profile file is required");
//   }

//   const tempFilePath = req.file.path;

//   try {
//     const result = await registerMaterialProfile({
//       materialKey: req.body.materialKey,
//       displayName: req.body.displayName,
//       materialCostPerGram: req.body.materialCostPerGram,
//       isActiveMaterial: req.body.isActiveMaterial,
//       quality: req.body.quality,
//       printerName: req.body.printerName,
//       nozzle: req.body.nozzle,
//       supportRule: req.body.supportRule,
//       orientationRule: req.body.orientationRule,
//       tempFilePath,
//       originalFileName: req.file.originalname,
//       uploadedBy: req.user.id,
//     });

//     return res
//       .status(201)
//       .json(
//         new ApiResponse(
//           201,
//           result,
//           "Material and slicer profile registered successfully",
//         ),
//       );
//   } finally {
//     if (tempFilePath && fs.existsSync(tempFilePath)) {
//       await fs.promises.rm(tempFilePath, { force: true });
//     }
//   }
// });

export {
  createMaterial,
  updateMaterial,
  deactivateMaterial,
  uploadSlicerProfileVersion,
};
