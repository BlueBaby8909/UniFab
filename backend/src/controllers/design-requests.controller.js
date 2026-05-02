import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  createDesignRequest as createDesignRequestRecord,
  getDesignRequestByIdForOwner,
  getDesignRequestsByOwner,
  getAllDesignRequests,
  getDesignRequestById,
  updateDesignRequestStatusById,
  updateDesignRequestResultById,
  getPaginatedDesignRequestsByOwner,
  getPaginatedAllDesignRequests,
} from "../models/design-requests.model.js";
import { getLocalDesignByIdForAdmin } from "../models/local-design.model.js";
import {
  buildDesignRequestReferencePublicPath,
  removeManagedDesignRequestReferenceFiles,
} from "../utils/design-request-storage.util.js";

function parseJsonSafely(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
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

const DESIGN_REQUEST_STATUSES = Object.freeze({
  PENDING: "pending",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
});

const DESIGN_REQUEST_STATUS_TRANSITIONS = Object.freeze({
  [DESIGN_REQUEST_STATUSES.PENDING]: [
    DESIGN_REQUEST_STATUSES.UNDER_REVIEW,
    DESIGN_REQUEST_STATUSES.APPROVED,
    DESIGN_REQUEST_STATUSES.REJECTED,
  ],
  [DESIGN_REQUEST_STATUSES.UNDER_REVIEW]: [
    DESIGN_REQUEST_STATUSES.APPROVED,
    DESIGN_REQUEST_STATUSES.REJECTED,
  ],
  [DESIGN_REQUEST_STATUSES.APPROVED]: [DESIGN_REQUEST_STATUSES.COMPLETED],
  [DESIGN_REQUEST_STATUSES.REJECTED]: [],
  [DESIGN_REQUEST_STATUSES.COMPLETED]: [],
});

function assertValidDesignRequestStatusTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedNextStatuses =
    DESIGN_REQUEST_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedNextStatuses.includes(nextStatus)) {
    throw new ApiError(
      400,
      `Invalid design request status transition from ${currentStatus} to ${nextStatus}`,
    );
  }
}

function normalizeOptionalPositiveInteger(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return null;
  }

  return parsedValue;
}

function normalizeDesignRequest(designRequest) {
  if (!designRequest) {
    return null;
  }

  return {
    id: designRequest.id,
    requestedBy: designRequest.requested_by,
    title: designRequest.title,
    description: designRequest.description,
    preferredMaterial: designRequest.preferred_material,
    dimensions: designRequest.dimensions,
    quantity: designRequest.quantity,
    referenceFiles: parseJsonSafely(designRequest.reference_files),
    resultDesignId: designRequest.result_design_id,
    status: designRequest.status,
    adminNote: designRequest.admin_note,
    createdAt: designRequest.created_at,
    updatedAt: designRequest.updated_at,
  };
}

function normalizeReferenceFiles(files) {
  if (!Array.isArray(files)) {
    return [];
  }

  return files.map((file) => ({
    url: buildDesignRequestReferencePublicPath(file),
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  }));
}

function normalizePagination(queryPage, queryLimit) {
  const page = Number.parseInt(queryPage, 10);
  const limit = Number.parseInt(queryLimit, 10);

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 ? limit : 20,
  };
}

const createDesignRequest = asyncHandler(async (req, res) => {
  const referenceFiles = normalizeReferenceFiles(req.files);

  try {
    const designRequest = await createDesignRequestRecord({
      requestedBy: req.user.id,
      title: String(req.body.title).trim(),
      description: String(req.body.description).trim(),
      preferredMaterial: normalizeOptionalText(req.body.preferredMaterial),
      dimensions: normalizeOptionalText(req.body.dimensions),
      quantity: normalizeOptionalPositiveInteger(req.body.quantity) ?? 1,
      referenceFiles,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { designRequest: normalizeDesignRequest(designRequest) },
          "Design request created successfully",
        ),
      );
  } catch (error) {
    await removeManagedDesignRequestReferenceFiles(referenceFiles);
    throw error;
  }
});

const listMyDesignRequests = asyncHandler(async (req, res) => {
  const { page, limit } = normalizePagination(req.query.page, req.query.limit);

  const result = await getPaginatedDesignRequestsByOwner(req.user.id, {
    page,
    limit,
  });

  const designRequests = result.rows.map(normalizeDesignRequest);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        designRequests,
        pagination: {
          page: result.page,
          limit: result.limit,
          totalCount: result.totalCount,
        },
      },
      "Design requests fetched successfully",
    ),
  );
});

const getMyDesignRequestDetail = asyncHandler(async (req, res) => {
  const designRequest = await getDesignRequestByIdForOwner(
    req.params.requestId,
    req.user.id,
  );

  if (!designRequest) {
    throw new ApiError(404, "Design request not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { designRequest: normalizeDesignRequest(designRequest) },
        "Design request fetched successfully",
      ),
    );
});

const listAllDesignRequests = asyncHandler(async (req, res) => {
  const { page, limit } = normalizePagination(req.query.page, req.query.limit);

  const result = await getPaginatedAllDesignRequests({
    page,
    limit,
    status: normalizeOptionalText(req.query.status),
  });

  const designRequests = result.rows.map(normalizeDesignRequest);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        designRequests,
        pagination: {
          page: result.page,
          limit: result.limit,
          totalCount: result.totalCount,
        },
      },
      "Design requests fetched successfully",
    ),
  );
});

const getDesignRequestDetailForAdmin = asyncHandler(async (req, res) => {
  const designRequest = await getDesignRequestById(req.params.requestId);

  if (!designRequest) {
    throw new ApiError(404, "Design request not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { designRequest: normalizeDesignRequest(designRequest) },
        "Design request fetched successfully",
      ),
    );
});

const updateDesignRequestStatus = asyncHandler(async (req, res) => {
  const existingDesignRequest = await getDesignRequestById(
    req.params.requestId,
  );

  if (!existingDesignRequest) {
    throw new ApiError(404, "Design request not found");
  }

  const nextStatus = Object.prototype.hasOwnProperty.call(req.body, "status")
    ? String(req.body.status).trim()
    : existingDesignRequest.status;

  const nextAdminNote = Object.prototype.hasOwnProperty.call(
    req.body,
    "adminNote",
  )
    ? normalizeOptionalText(req.body.adminNote)
    : existingDesignRequest.admin_note;

  const normalizedExistingAdminNote = existingDesignRequest.admin_note ?? null;
  const normalizedNextAdminNote = nextAdminNote ?? null;

  const hasStatusChange = nextStatus !== existingDesignRequest.status;
  const hasAdminNoteChange =
    normalizedNextAdminNote !== normalizedExistingAdminNote;

  assertValidDesignRequestStatusTransition(
    existingDesignRequest.status,
    nextStatus,
  );

  if (nextStatus === DESIGN_REQUEST_STATUSES.REJECTED && !nextAdminNote) {
    throw new ApiError(
      400,
      "Admin note is required when rejecting a design request",
    );
  }

  if (nextStatus === DESIGN_REQUEST_STATUSES.COMPLETED && !nextAdminNote) {
    throw new ApiError(
      400,
      "Admin note is required when completing a design request",
    );
  }

  if (!hasStatusChange && !hasAdminNoteChange) {
    throw new ApiError(400, "No changes detected for design request");
  }

  const designRequest = await updateDesignRequestStatusById(
    req.params.requestId,
    {
      status: nextStatus,
      adminNote: nextAdminNote,
    },
  );

  if (!designRequest) {
    throw new ApiError(404, "Design request not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { designRequest: normalizeDesignRequest(designRequest) },
        "Design request updated successfully",
      ),
    );
});

const updateDesignRequestResult = asyncHandler(async (req, res) => {
  const existingDesignRequest = await getDesignRequestById(
    req.params.requestId,
  );

  if (!existingDesignRequest) {
    throw new ApiError(404, "Design request not found");
  }

  if (
    ![
      DESIGN_REQUEST_STATUSES.APPROVED,
      DESIGN_REQUEST_STATUSES.COMPLETED,
    ].includes(existingDesignRequest.status)
  ) {
    throw new ApiError(
      400,
      "Design request must be approved before linking a completed local design",
    );
  }

  const resultDesignId = Number(req.body.resultDesignId);
  const localDesign = await getLocalDesignByIdForAdmin(resultDesignId);

  if (!localDesign) {
    throw new ApiError(404, "Result local design not found");
  }

  if (!localDesign.is_active) {
    throw new ApiError(400, "Result local design must be active");
  }

  const nextAdminNote = normalizeOptionalText(req.body.adminNote);

  if (!nextAdminNote) {
    throw new ApiError(
      400,
      "Admin note is required when linking a completed design result",
    );
  }

  const designRequest = await updateDesignRequestResultById(
    req.params.requestId,
    {
      resultDesignId,
      status: DESIGN_REQUEST_STATUSES.COMPLETED,
      adminNote: nextAdminNote,
    },
  );

  if (!designRequest) {
    throw new ApiError(404, "Design request not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { designRequest: normalizeDesignRequest(designRequest) },
        "Design request result linked successfully",
      ),
    );
});

export {
  createDesignRequest,
  listMyDesignRequests,
  getMyDesignRequestDetail,
  listAllDesignRequests,
  getDesignRequestDetailForAdmin,
  updateDesignRequestStatus,
  updateDesignRequestResult,
};
