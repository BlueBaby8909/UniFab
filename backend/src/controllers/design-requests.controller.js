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
  getPaginatedDesignRequestsByOwner,
  getPaginatedAllDesignRequests,
} from "../models/design-requests.model.js";

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizeOptionalText(value) {
  if (!hasText(value)) {
    return null;
  }

  return String(value).trim();
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
    status: designRequest.status,
    adminNote: designRequest.admin_note,
    createdAt: designRequest.created_at,
    updatedAt: designRequest.updated_at,
  };
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
  const designRequest = await createDesignRequestRecord({
    requestedBy: req.user.id,
    title: String(req.body.title).trim(),
    description: String(req.body.description).trim(),
    preferredMaterial: normalizeOptionalText(req.body.preferredMaterial),
    dimensions: normalizeOptionalText(req.body.dimensions),
    quantity: normalizeOptionalPositiveInteger(req.body.quantity) ?? 1,
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

export {
  createDesignRequest,
  listMyDesignRequests,
  getMyDesignRequestDetail,
  listAllDesignRequests,
  getDesignRequestDetailForAdmin,
  updateDesignRequestStatus,
};
