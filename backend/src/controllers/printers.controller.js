import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  createPrinter,
  deletePrinterById,
  getPrinterById,
  listPrintersForAdmin,
  listPublicPrinters,
  updatePrinterById,
} from "../models/printers.model.js";

function parseJsonSafely(value, fallbackValue = null) {
  if (value === null || value === undefined) {
    return fallbackValue;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallbackValue;
  }
}

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizeOptionalText(value) {
  if (!hasText(value)) {
    return null;
  }

  return String(value).trim();
}

function parseBoolean(value, fallbackValue = false) {
  if (value === undefined || value === null || value === "") {
    return fallbackValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return ["true", "1", "yes"].includes(String(value).trim().toLowerCase());
}

function normalizeSupportedMaterials(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeOptionalText).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(normalizeOptionalText)
      .filter(Boolean);
  }

  return [];
}

function normalizePrinter(printer) {
  if (!printer) {
    return null;
  }

  return {
    id: printer.id,
    name: printer.name,
    model: printer.model,
    technology: printer.technology,
    buildVolume: printer.build_volume,
    nozzleSize: printer.nozzle_size,
    supportedMaterials: parseJsonSafely(printer.supported_materials, []),
    status: printer.status,
    isPublic: Boolean(printer.is_public),
    displayOrder: Number(printer.display_order || 0),
    notes: printer.notes,
    createdBy: printer.created_by,
    updatedBy: printer.updated_by,
    createdAt: printer.created_at,
    updatedAt: printer.updated_at,
  };
}

function buildPrinterPayload(body, userId, existingPrinter = null) {
  return {
    name: hasText(body.name)
      ? String(body.name).trim()
      : existingPrinter?.name,
    model: Object.prototype.hasOwnProperty.call(body, "model")
      ? normalizeOptionalText(body.model)
      : existingPrinter?.model,
    technology: hasText(body.technology)
      ? String(body.technology).trim()
      : existingPrinter?.technology || "FDM",
    buildVolume: Object.prototype.hasOwnProperty.call(body, "buildVolume")
      ? normalizeOptionalText(body.buildVolume)
      : existingPrinter?.build_volume,
    nozzleSize: Object.prototype.hasOwnProperty.call(body, "nozzleSize")
      ? normalizeOptionalText(body.nozzleSize)
      : existingPrinter?.nozzle_size,
    supportedMaterials: Object.prototype.hasOwnProperty.call(
      body,
      "supportedMaterials",
    )
      ? normalizeSupportedMaterials(body.supportedMaterials)
      : parseJsonSafely(existingPrinter?.supported_materials, []),
    status: body.status || existingPrinter?.status || "active",
    isPublic: parseBoolean(body.isPublic, existingPrinter?.is_public ?? true),
    displayOrder:
      body.displayOrder === undefined || body.displayOrder === null
        ? Number(existingPrinter?.display_order || 0)
        : Number(body.displayOrder),
    notes: Object.prototype.hasOwnProperty.call(body, "notes")
      ? normalizeOptionalText(body.notes)
      : existingPrinter?.notes,
    createdBy: userId,
    updatedBy: userId,
  };
}

const listPublicPrinterInfo = asyncHandler(async (req, res) => {
  const printers = (await listPublicPrinters()).map(normalizePrinter);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { printers }, "Printer information fetched successfully"),
    );
});

const listAdminPrinters = asyncHandler(async (req, res) => {
  const printers = (await listPrintersForAdmin()).map(normalizePrinter);

  return res
    .status(200)
    .json(new ApiResponse(200, { printers }, "Printers fetched successfully"));
});

const createAdminPrinter = asyncHandler(async (req, res) => {
  const printer = await createPrinter(buildPrinterPayload(req.body, req.user.id));

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { printer: normalizePrinter(printer) },
        "Printer created successfully",
      ),
    );
});

const updateAdminPrinter = asyncHandler(async (req, res) => {
  const existingPrinter = await getPrinterById(req.params.printerId);

  if (!existingPrinter) {
    throw new ApiError(404, "Printer not found");
  }

  const printer = await updatePrinterById(
    req.params.printerId,
    buildPrinterPayload(req.body, req.user.id, existingPrinter),
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { printer: normalizePrinter(printer) },
        "Printer updated successfully",
      ),
    );
});

const deleteAdminPrinter = asyncHandler(async (req, res) => {
  const deleted = await deletePrinterById(req.params.printerId);

  if (!deleted) {
    throw new ApiError(404, "Printer not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Printer deleted successfully"));
});

export {
  listPublicPrinterInfo,
  listAdminPrinters,
  createAdminPrinter,
  updateAdminPrinter,
  deleteAdminPrinter,
};
