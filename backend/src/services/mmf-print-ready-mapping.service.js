import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { ApiError } from "../utils/api-error.js";
import { ensureDirExists } from "../utils/temp-path.util.js";
import { LOCAL_DESIGN_FILES_ROOT } from "../utils/local-design-storage.util.js";
import {
  downloadMmfFile,
  getObjectFilesById,
  selectPreferredPrintableMmfFile,
} from "./myminifactory.service.js";
import {
  createLocalDesign,
  createLocalDesignAuditEvent,
} from "../models/local-design.model.js";

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function firstMmfImageUrl(mmfObject) {
  const primaryImage = mmfObject?.images?.find((image) => image.isPrimary);
  const image = primaryImage || mmfObject?.images?.[0];

  return (
    image?.standardUrl ||
    image?.thumbnailUrl ||
    image?.originalUrl ||
    null
  );
}

function formatMmfDescription(mmfObject, selectedFile) {
  const lines = [
    hasText(mmfObject?.description) ? String(mmfObject.description).trim() : null,
    `Mapped automatically from MyMiniFactory object #${mmfObject.id}.`,
    hasText(mmfObject?.url) ? `Source: ${mmfObject.url}` : null,
    hasText(mmfObject?.designer?.name)
      ? `Designer: ${mmfObject.designer.name}`
      : null,
    hasText(selectedFile?.name)
      ? `Mapped file: ${selectedFile.name}`
      : null,
  ];

  return lines.filter(Boolean).join("\n\n");
}

function getLicenseType(mmfObject) {
  if (hasText(mmfObject?.license)) {
    return String(mmfObject.license).trim();
  }

  const activeLicenses = mmfObject?.licenses
    ?.filter((license) => license.value === true && hasText(license.type))
    .map((license) => license.type);

  return activeLicenses?.length ? activeLicenses.join(", ") : null;
}

function formatDimensions(dimensions) {
  if (!dimensions) {
    return null;
  }

  if (typeof dimensions === "string") {
    return dimensions;
  }

  const axisValues = ["x", "y", "z"]
    .map((axis) => dimensions[axis] || dimensions[axis.toUpperCase()])
    .filter(Boolean);

  if (axisValues.length > 0) {
    return axisValues.join(" x ");
  }

  return JSON.stringify(dimensions);
}

async function mapMmfObjectToLocalDesign({ mmfObject, adminUserId }) {
  if (!mmfObject?.id) {
    throw new ApiError(404, "MyMiniFactory design not found");
  }

  const files =
    mmfObject?.files?.length > 0
      ? mmfObject.files
      : await getObjectFilesById(mmfObject.id);
  const selectedFile = selectPreferredPrintableMmfFile(files);

  if (!selectedFile) {
    throw new ApiError(
      400,
      "No supported printable STL, OBJ, or 3MF file was found through the MyMiniFactory API. Download and verify the design manually, then link a local design if needed.",
    );
  }

  const fileBuffer = await downloadMmfFile(selectedFile);
  const extension = selectedFile.extension;
  const safeFileName = `${randomUUID()}${extension}`;
  const absoluteFilePath = path.join(LOCAL_DESIGN_FILES_ROOT, safeFileName);
  const publicFilePath = `/storage/local-designs/files/${safeFileName}`;

  ensureDirExists(LOCAL_DESIGN_FILES_ROOT);
  await fs.promises.writeFile(absoluteFilePath, fileBuffer);

  try {
    const localDesign = await createLocalDesign({
      sourceKind: "lab",
      title: mmfObject?.name
        ? `MMF: ${mmfObject.name}`
        : `MMF object #${mmfObject.id}`,
      description: formatMmfDescription(mmfObject, selectedFile),
      thumbnailUrl: firstMmfImageUrl(mmfObject),
      fileUrl: publicFilePath,
      material: null,
      dimensions: formatDimensions(mmfObject?.dimensions),
      licenseType: getLicenseType(mmfObject),
      categoryId: null,
      uploadedBy: adminUserId,
      isActive: false,
      moderationStatus: "admin_approved",
      isPrintReady: true,
      ownershipConfirmed: true,
      policyAcknowledged: true,
      moderationFlags: [
        {
          code: "mmf_api_file_mapped",
          source: "admin",
          severity: "info",
          label: "MMF file mapped through API",
          detail:
            "A FabLab admin marked this MyMiniFactory design Print Ready after the backend mapped a supported file through the MyMiniFactory API.",
        },
      ],
      moderationSummary:
        "Mapped from MyMiniFactory API as a backend-managed Print Ready file.",
      moderationFeedback: null,
      moderationDecisionSource: "admin",
      publishedAt: new Date(),
    });

    await createLocalDesignAuditEvent({
      localDesignId: localDesign.id,
      actorId: adminUserId,
      actorType: "admin",
      eventType: "mmf_file_mapped",
      fromStatus: null,
      toStatus: "admin_approved",
      summary: "Mapped a MyMiniFactory file into a Print Ready local design.",
      metadata: {
        mmfObjectId: mmfObject.id,
        mmfUrl: mmfObject.url,
        mappedFile: selectedFile,
      },
    });

    return {
      localDesign,
      selectedFile,
    };
  } catch (error) {
    await fs.promises.rm(absoluteFilePath, { force: true });
    throw error;
  }
}

export { mapMmfObjectToLocalDesign };
