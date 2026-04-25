import pool from "../db/db.js";
import { ApiError } from "../utils/api-error.js";
import {
  PRINT_REQUEST_SOURCE_TYPES,
  PRINT_REQUEST_STATUSES,
  PRINT_REQUEST_STATUS_TRANSITIONS,
  PRINT_REQUEST_STATUS_LABELS,
} from "../constants/print-request.constants.js";
import { getMaterialByKey } from "../models/materials.model.js";
import { getLocalDesignById } from "../models/local-design.model.js";
import { getDesignRequestByIdForOwner } from "../models/design-requests.model.js";
import { getDesignOverrideByMmfObjectId } from "../models/design-overrides.model.js";
import { getObjectById } from "./myminifactory.service.js";
import {
  createPrintRequest,
  createPrintRequestStatusHistory,
  getPrintRequestById,
  getPrintRequestByIdForOwner,
  getPrintRequestStatusHistoryByRequestId,
  getPaginatedPrintRequestsByOwner,
  getPaginatedAllPrintRequests,
  updatePrintRequestStatusById,
  attachReceiptToPrintRequest,
} from "../models/print-request.model.js";
import {
  buildPrintRequestModelPublicPath,
  buildPrintRequestReceiptPublicPath,
  getManagedPrintRequestReceiptAbsolutePath,
  removeManagedPrintRequestModelFile,
  removeManagedPrintRequestReceiptFile,
} from "../utils/print-request-storage.util.js";
import { findUserById } from "../models/user.model.js";
import { printRequestStatusMailgenContent, sendEmail } from "../utils/mail.js";

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizeOptionalText(value) {
  if (!hasText(value)) {
    return null;
  }

  return String(value).trim();
}

function generateReferenceNumber() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `PR-${year}${month}${day}-${randomPart}`;
}

function buildLocalDesignSnapshot(localDesign) {
  return {
    source: "local",
    id: localDesign.id,
    title: localDesign.title,
    description: localDesign.description,
    thumbnailUrl: localDesign.thumbnail_url,
    fileUrl: localDesign.file_url,
    material: localDesign.material,
    dimensions: localDesign.dimensions,
    licenseType: localDesign.license_type,
    capturedAt: new Date().toISOString(),
  };
}

function getPrimaryMmfImage(mmfObject) {
  if (!Array.isArray(mmfObject.images) || mmfObject.images.length === 0) {
    return null;
  }

  const primaryImage =
    mmfObject.images.find((image) => image.isPrimary) || mmfObject.images[0];

  return {
    originalUrl: primaryImage.originalUrl || null,
    thumbnailUrl: primaryImage.thumbnailUrl || null,
    standardUrl: primaryImage.standardUrl || null,
  };
}

function buildMmfDesignSnapshot(mmfObject, override = null) {
  return {
    source: "myminifactory",
    id: mmfObject.id,
    url: mmfObject.url,
    name: mmfObject.name,
    description: mmfObject.description,
    dimensions: mmfObject.dimensions,
    license: mmfObject.license,
    licenses: mmfObject.licenses || [],
    primaryImage: getPrimaryMmfImage(mmfObject),
    designer: mmfObject.designer || null,
    clientNote: override?.client_note || null,
    capturedAt: new Date().toISOString(),
  };
}

function normalizePagination(queryPage, queryLimit) {
  const page = Number.parseInt(queryPage, 10);
  const limit = Number.parseInt(queryLimit, 10);

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 && limit <= 50 ? limit : 20,
  };
}

function hasOwnField(object, fieldName) {
  return Object.prototype.hasOwnProperty.call(object, fieldName);
}

function normalizeOptionalMoney(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new ApiError(400, `${fieldName} must be a non-negative number`);
  }

  return parsedValue;
}

function assertValidStatusTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) {
    throw new ApiError(400, "Request is already in the selected status");
  }

  const allowedNextStatuses =
    PRINT_REQUEST_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedNextStatuses.includes(nextStatus)) {
    throw new ApiError(
      400,
      `Invalid status transition from ${currentStatus} to ${nextStatus}`,
    );
  }
}

async function sendPrintRequestStatusEmail({ printRequest, note }) {
  const client = await findUserById(printRequest.client_id);

  if (!client?.email) {
    return;
  }

  const username = [client.first_name, client.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const statusLabel =
    PRINT_REQUEST_STATUS_LABELS[printRequest.status] || printRequest.status;

  try {
    await sendEmail({
      to: client.email,
      subject: `UniFab Print Request ${printRequest.reference_number} Updated`,
      mailgenContent: printRequestStatusMailgenContent({
        username: username || "UniFab Client",
        referenceNumber: printRequest.reference_number,
        statusLabel,
        note,
      }),
    });
  } catch (error) {
    console.error("Print request status email failed:", error);
  }
}

async function resolveSourceData({ body, file, clientId }) {
  const sourceType = String(body.sourceType).trim();

  if (sourceType === PRINT_REQUEST_SOURCE_TYPES.UPLOAD) {
    if (!file) {
      throw new ApiError(400, "Model file is required");
    }

    const fileUrl = buildPrintRequestModelPublicPath(file);

    if (!fileUrl) {
      throw new ApiError(500, "Unable to resolve uploaded model file path");
    }

    return {
      sourceType,
      designId: null,
      designRequestId: null,
      fileUrl,
      fileOriginalName: file.originalname,
      fileMimeType: file.mimetype,
      fileSize: file.size,
      designSnapshot: null,
    };
  }

  if (sourceType === PRINT_REQUEST_SOURCE_TYPES.LIBRARY) {
    const librarySource = String(body.librarySource).trim();

    if (librarySource === "local") {
      const localDesign = await getLocalDesignById(body.designId);

      if (!localDesign) {
        throw new ApiError(404, "Local design not found or inactive");
      }

      return {
        sourceType,
        designId: localDesign.id,
        designRequestId: null,
        fileUrl: null,
        fileOriginalName: null,
        fileMimeType: null,
        fileSize: null,
        designSnapshot: buildLocalDesignSnapshot(localDesign),
      };
    }

    if (librarySource === "myminifactory") {
      const mmfObjectId = Number(body.mmfObjectId);
      const override = await getDesignOverrideByMmfObjectId(mmfObjectId);

      if (override?.is_hidden) {
        throw new ApiError(404, "Design not found");
      }

      const mmfObject = await getObjectById(mmfObjectId);

      if (!mmfObject) {
        throw new ApiError(404, "MyMiniFactory design not found");
      }

      return {
        sourceType,
        designId: null,
        designRequestId: null,
        fileUrl: null,
        fileOriginalName: null,
        fileMimeType: null,
        fileSize: null,
        designSnapshot: buildMmfDesignSnapshot(mmfObject, override),
      };
    }

    throw new ApiError(400, "Invalid library source");
  }

  if (sourceType === PRINT_REQUEST_SOURCE_TYPES.DESIGN_REQUEST) {
    const designRequest = await getDesignRequestByIdForOwner(
      body.designRequestId,
      clientId,
    );

    if (!designRequest) {
      throw new ApiError(404, "Design request not found");
    }

    return {
      sourceType,
      designId: null,
      designRequestId: designRequest.id,
      fileUrl: null,
      fileOriginalName: null,
      fileMimeType: null,
      fileSize: null,
      designSnapshot: {
        source: "design_request",
        id: designRequest.id,
        title: designRequest.title,
        description: designRequest.description,
        preferredMaterial: designRequest.preferred_material,
        dimensions: designRequest.dimensions,
        quantity: designRequest.quantity,
        status: designRequest.status,
        capturedAt: new Date().toISOString(),
      },
    };
  }

  throw new ApiError(400, "Invalid source type");
}

async function submitPrintRequest({ clientId, user, body, file }) {
  let uploadedFileUrl = file ? buildPrintRequestModelPublicPath(file) : null;

  try {
    const material = await getMaterialByKey(String(body.material).trim());

    if (!material) {
      throw new ApiError(
        400,
        `Material is not configured or inactive: ${body.material}`,
      );
    }

    const sourceData = await resolveSourceData({
      body,
      file,
      clientId,
    });

    uploadedFileUrl = sourceData.fileUrl;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const printRequest = await createPrintRequest(
        {
          referenceNumber: generateReferenceNumber(),
          clientId,
          sourceType: sourceData.sourceType,
          designId: sourceData.designId,
          designRequestId: sourceData.designRequestId,
          fileUrl: sourceData.fileUrl,
          fileOriginalName: sourceData.fileOriginalName,
          fileMimeType: sourceData.fileMimeType,
          fileSize: sourceData.fileSize,
          designSnapshot: sourceData.designSnapshot,
          material: material.material_key,
          printQuality: String(body.printQuality).trim(),
          infill: Number(body.infill),
          quantity: Number(body.quantity),
          notes: normalizeOptionalText(body.notes),
          estimatedCost: null,
          confirmedCost: null,
          paymentSlipUrl: null,
          receiptUrl: null,
          receiptOriginalName: null,
          receiptMimeType: null,
          receiptSize: null,
          receiptUploadedAt: null,
          status: PRINT_REQUEST_STATUSES.PENDING_REVIEW,
          rejectionReason: null,
        },
        connection,
      );

      await createPrintRequestStatusHistory(
        {
          printRequestId: printRequest.id,
          status: PRINT_REQUEST_STATUSES.PENDING_REVIEW,
          changedBy: clientId,
          changedByRole: user?.isAdmin ? "admin" : "client",
          note: "Print request submitted",
        },
        connection,
      );

      await connection.commit();

      const statusHistory = await getPrintRequestStatusHistoryByRequestId(
        printRequest.id,
      );

      return {
        printRequest,
        statusHistory,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (uploadedFileUrl) {
      await removeManagedPrintRequestModelFile(uploadedFileUrl);
    }

    throw error;
  }
}

async function listClientPrintRequests({ clientId, query = {} }) {
  const { page, limit } = normalizePagination(query.page, query.limit);

  return getPaginatedPrintRequestsByOwner(clientId, {
    page,
    limit,
    status: normalizeOptionalText(query.status),
  });
}

async function getPrintRequestDetailForUser({ user, requestId }) {
  const printRequest = user?.isAdmin
    ? await getPrintRequestById(requestId)
    : await getPrintRequestByIdForOwner(requestId, user.id);

  if (!printRequest) {
    throw new ApiError(404, "Print request not found");
  }

  const statusHistory = await getPrintRequestStatusHistoryByRequestId(
    printRequest.id,
  );

  return {
    printRequest,
    statusHistory,
  };
}

async function listAdminPrintRequests({ query = {} }) {
  const { page, limit } = normalizePagination(query.page, query.limit);

  return getPaginatedAllPrintRequests({
    page,
    limit,
    status: normalizeOptionalText(query.status),
    sourceType: normalizeOptionalText(query.sourceType),
  });
}

async function updateAdminPrintRequestStatus({ requestId, adminId, body }) {
  const existingPrintRequest = await getPrintRequestById(requestId);

  if (!existingPrintRequest) {
    throw new ApiError(404, "Print request not found");
  }

  const nextStatus = String(body.status).trim();

  assertValidStatusTransition(existingPrintRequest.status, nextStatus);

  const nextRejectionReason =
    nextStatus === PRINT_REQUEST_STATUSES.REJECTED
      ? normalizeOptionalText(body.rejectionReason)
      : existingPrintRequest.rejection_reason;

  if (nextStatus === PRINT_REQUEST_STATUSES.REJECTED && !nextRejectionReason) {
    throw new ApiError(
      400,
      "Rejection reason is required when rejecting a request",
    );
  }

  const parsedConfirmedCost = normalizeOptionalMoney(
    body.confirmedCost,
    "Confirmed cost",
  );

  const nextConfirmedCost =
    parsedConfirmedCost !== undefined
      ? parsedConfirmedCost
      : existingPrintRequest.confirmed_cost;

  const nextPaymentSlipUrl = hasOwnField(body, "paymentSlipUrl")
    ? normalizeOptionalText(body.paymentSlipUrl)
    : existingPrintRequest.payment_slip_url;

  if (nextStatus === PRINT_REQUEST_STATUSES.PAYMENT_SLIP_ISSUED) {
    if (nextConfirmedCost === null || nextConfirmedCost === undefined) {
      throw new ApiError(
        400,
        "Confirmed cost is required when issuing a payment slip",
      );
    }

    if (!nextPaymentSlipUrl) {
      throw new ApiError(
        400,
        "Payment slip URL is required when issuing a payment slip",
      );
    }
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const updatedPrintRequest = await updatePrintRequestStatusById(
      requestId,
      {
        status: nextStatus,
        rejectionReason: nextRejectionReason,
        confirmedCost: nextConfirmedCost,
        paymentSlipUrl: nextPaymentSlipUrl,
      },
      connection,
    );

    await createPrintRequestStatusHistory(
      {
        printRequestId: requestId,
        status: nextStatus,
        changedBy: adminId,
        changedByRole: "admin",
        note:
          normalizeOptionalText(body.note) ||
          `Status updated from ${existingPrintRequest.status} to ${nextStatus}`,
      },
      connection,
    );

    await connection.commit();

    const statusHistory = await getPrintRequestStatusHistoryByRequestId(
      updatedPrintRequest.id,
    );

    await sendPrintRequestStatusEmail({
      printRequest: updatedPrintRequest,
      note:
        normalizeOptionalText(body.note) ||
        normalizeOptionalText(body.rejectionReason) ||
        null,
    });

    return {
      printRequest: updatedPrintRequest,
      statusHistory,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function uploadClientPrintRequestReceipt({ clientId, requestId, file }) {
  if (!file) {
    throw new ApiError(400, "Receipt file is required");
  }

  const receiptUrl = buildPrintRequestReceiptPublicPath(file);

  if (!receiptUrl) {
    throw new ApiError(500, "Unable to resolve uploaded receipt file path");
  }

  try {
    const existingPrintRequest = await getPrintRequestByIdForOwner(
      requestId,
      clientId,
    );

    if (!existingPrintRequest) {
      throw new ApiError(404, "Print request not found");
    }

    if (
      existingPrintRequest.status !== PRINT_REQUEST_STATUSES.PAYMENT_SLIP_ISSUED
    ) {
      throw new ApiError(
        400,
        "Receipt can only be uploaded after a payment slip has been issued",
      );
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const updatedPrintRequest = await attachReceiptToPrintRequest(
        requestId,
        {
          receiptUrl,
          receiptOriginalName: file.originalname,
          receiptMimeType: file.mimetype,
          receiptSize: file.size,
          status: PRINT_REQUEST_STATUSES.PAYMENT_SUBMITTED,
        },
        connection,
      );

      await createPrintRequestStatusHistory(
        {
          printRequestId: requestId,
          status: PRINT_REQUEST_STATUSES.PAYMENT_SUBMITTED,
          changedBy: clientId,
          changedByRole: "client",
          note: "Payment receipt uploaded by client",
        },
        connection,
      );

      await connection.commit();

      const statusHistory = await getPrintRequestStatusHistoryByRequestId(
        updatedPrintRequest.id,
      );

      return {
        printRequest: updatedPrintRequest,
        statusHistory,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    await removeManagedPrintRequestReceiptFile(receiptUrl);
    throw error;
  }
}

async function getPrintRequestReceiptForUser({ user, requestId }) {
  const printRequest = user?.isAdmin
    ? await getPrintRequestById(requestId)
    : await getPrintRequestByIdForOwner(requestId, user.id);

  if (!printRequest) {
    throw new ApiError(404, "Print request not found");
  }

  if (!printRequest.receipt_url) {
    throw new ApiError(404, "Receipt not found for this print request");
  }

  const receiptPath = getManagedPrintRequestReceiptAbsolutePath(
    printRequest.receipt_url,
  );

  if (!receiptPath) {
    throw new ApiError(500, "Stored receipt path is invalid");
  }

  return {
    receiptPath,
    originalName: printRequest.receipt_original_name || "receipt",
    mimeType: printRequest.receipt_mime_type || "application/octet-stream",
  };
}

export {
  submitPrintRequest,
  listClientPrintRequests,
  getPrintRequestDetailForUser,
  listAdminPrintRequests,
  updateAdminPrintRequestStatus,
  uploadClientPrintRequestReceipt,
  getPrintRequestReceiptForUser,
};
