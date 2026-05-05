import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import pool from "../db/db.js";
import {
  searchObjects,
  getObjectById,
} from "../services/myminifactory.service.js";
import {
  getActiveLocalDesigns,
  getAllLocalDesignsForAdmin,
  getLocalDesignById,
  getLocalDesignByIdForAdmin,
  createLocalDesign as createLocalDesignRecord,
  updateLocalDesignById,
  deactivateLocalDesignById,
  archiveLocalDesignById,
  countLocalDesignReferences,
  deleteLocalDesignById,
  listDesignCategories,
  listDesignTags,
  getDesignCategoryById,
  upsertDesignCategoryByName,
  upsertDesignTagByName,
  replaceLocalDesignTags,
} from "../models/local-design.model.js";
import {
  getAllDesignOverrides,
  getDesignOverrideById,
  getDesignOverrideByMmfObjectId,
  getDesignOverridesByMmfObjectIds,
  createDesignOverride as createDesignOverrideRecord,
  updateDesignOverrideById,
  deleteDesignOverrideById,
} from "../models/design-overrides.model.js";
import {
  LOCAL_DESIGN_FILE_UPLOAD_FIELD,
  LOCAL_DESIGN_THUMBNAIL_UPLOAD_FIELD,
} from "../middlewares/local-design-upload.middleware.js";
import { removeManagedLocalDesignFile } from "../utils/local-design-storage.util.js";

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizeOptionalText(value) {
  if (!hasText(value)) {
    return null;
  }

  return String(value).trim();
}

function buildOverrideMap(overrides) {
  const map = new Map();

  for (const override of overrides) {
    map.set(Number(override.mmf_object_id), override);
  }

  return map;
}

function applyOverrideToMmfItem(item, override) {
  return {
    ...item,
    override: override
      ? {
          id: override.id,
          isHidden: Boolean(override.is_hidden),
          isPinned: Boolean(override.is_pinned),
          isPrintReady: Boolean(override.is_print_ready),
          linkedLocalDesignId: override.linked_local_design_id || null,
          clientNote: override.client_note || null,
        }
      : {
          isHidden: false,
          isPinned: false,
          isPrintReady: false,
          linkedLocalDesignId: null,
          clientNote: null,
        },
  };
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

function matchesLocalDesignSearch(localDesign, searchQuery) {
  if (!hasText(searchQuery)) {
    return true;
  }

  const normalizedQuery = String(searchQuery).trim().toLowerCase();

  return [
    localDesign.title,
    localDesign.description,
    localDesign.material,
    localDesign.dimensions,
    localDesign.license_type,
    localDesign.category_name,
    ...(Array.isArray(localDesign.tags)
      ? localDesign.tags.map((tag) => tag.name)
      : []),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

function matchesLocalDesignCategory(localDesign, categoryFilter) {
  if (!hasText(categoryFilter)) {
    return true;
  }

  const normalizedCategory = String(categoryFilter).trim().toLowerCase();

  return [localDesign.category_slug, localDesign.category_name]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase() === normalizedCategory);
}

function matchesLocalDesignTag(localDesign, tagFilter) {
  if (!hasText(tagFilter)) {
    return true;
  }

  const normalizedTag = String(tagFilter).trim().toLowerCase();

  return (localDesign.tags || []).some((tag) =>
    [tag.slug, tag.name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase() === normalizedTag),
  );
}

function parseIdList(value) {
  if (Array.isArray(value)) {
    return value.map(Number).filter((item) => Number.isInteger(item) && item > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item) && item > 0);
  }

  return [];
}

function parseNameList(value) {
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

function getUploadedFile(req, fieldName) {
  const files = req.files?.[fieldName];

  if (!Array.isArray(files) || files.length === 0) {
    return null;
  }

  return files[0];
}

function buildStoredLocalDesignPath(file, fileType) {
  if (!file?.filename) {
    return null;
  }

  if (fileType === "design") {
    return `/storage/local-designs/files/${file.filename}`;
  }

  if (fileType === "thumbnail") {
    return `/storage/local-designs/thumbnails/${file.filename}`;
  }

  return null;
}

function normalizeLocalDesign(localDesign) {
  if (!localDesign) {
    return null;
  }

  return {
    id: localDesign.id,
    source: "local",
    title: localDesign.title,
    description: localDesign.description,
    thumbnailUrl: localDesign.thumbnail_url,
    fileUrl: localDesign.file_url,
    material: localDesign.material,
    dimensions: localDesign.dimensions,
    licenseType: localDesign.license_type,
    category: localDesign.category_id
      ? {
          id: localDesign.category_id,
          name: localDesign.category_name,
          slug: localDesign.category_slug,
          description: localDesign.category_description,
        }
      : null,
    tags: Array.isArray(localDesign.tags) ? localDesign.tags : [],
    isActive: Boolean(localDesign.is_active),
    uploadedBy: localDesign.uploaded_by,
    archivedAt: localDesign.archived_at,
    archivedBy: localDesign.archived_by,
    createdAt: localDesign.created_at,
    updatedAt: localDesign.updated_at,
  };
}

function normalizeDesignOverride(designOverride) {
  if (!designOverride) {
    return null;
  }

  return {
    id: designOverride.id,
    mmfObjectId: designOverride.mmf_object_id,
    isHidden: Boolean(designOverride.is_hidden),
    isPinned: Boolean(designOverride.is_pinned),
    isPrintReady: Boolean(designOverride.is_print_ready),
    linkedLocalDesignId: designOverride.linked_local_design_id || null,
    clientNote: designOverride.client_note,
    createdBy: designOverride.created_by,
    updatedBy: designOverride.updated_by,
    createdAt: designOverride.created_at,
    updatedAt: designOverride.updated_at,
  };
}

function normalizeCategory(category) {
  if (!category) {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    isActive: Boolean(category.is_active),
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  };
}

function normalizeTag(tag) {
  if (!tag) {
    return null;
  }

  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    isActive: Boolean(tag.is_active),
    createdAt: tag.created_at,
    updatedAt: tag.updated_at,
  };
}

async function resolveLocalDesignTaxonomy({
  body,
  userId,
  connection,
  existingLocalDesign = null,
}) {
  let categoryId = existingLocalDesign?.category_id || null;

  if (Object.prototype.hasOwnProperty.call(body, "categoryId")) {
    categoryId = body.categoryId ? Number(body.categoryId) : null;

    if (categoryId) {
      const category = await getDesignCategoryById(categoryId, connection);

      if (!category || !category.is_active) {
        throw new ApiError(400, "Selected design category is unavailable");
      }
    }
  }

  if (hasText(body.categoryName)) {
    const category = await upsertDesignCategoryByName({
      name: body.categoryName,
      userId,
      connection,
    });
    categoryId = category?.id || null;
  }

  const hasTagUpdate =
    Object.prototype.hasOwnProperty.call(body, "tagIds") ||
    Object.prototype.hasOwnProperty.call(body, "tagNames");

  const tagIds = parseIdList(body.tagIds);
  const tagNames = parseNameList(body.tagNames);

  for (const tagName of tagNames) {
    const tag = await upsertDesignTagByName({
      name: tagName,
      userId,
      connection,
    });

    if (tag?.id) {
      tagIds.push(tag.id);
    }
  }

  return {
    categoryId,
    tagIds: [...new Set(tagIds)],
    hasTagUpdate,
  };
}

async function resolveLinkedLocalDesignId(body) {
  if (!Object.prototype.hasOwnProperty.call(body, "linkedLocalDesignId")) {
    return null;
  }

  if (!hasText(body.linkedLocalDesignId)) {
    return null;
  }

  const linkedLocalDesignId = Number(body.linkedLocalDesignId);
  const localDesign = await getLocalDesignById(linkedLocalDesignId);

  if (!localDesign) {
    throw new ApiError(
      400,
      "Linked local design must be active and available to clients",
    );
  }

  return linkedLocalDesignId;
}

async function cleanupNewUploadedLocalDesignAssets(req) {
  const uploadedDesignFile = getUploadedFile(
    req,
    LOCAL_DESIGN_FILE_UPLOAD_FIELD,
  );
  const uploadedThumbnailImage = getUploadedFile(
    req,
    LOCAL_DESIGN_THUMBNAIL_UPLOAD_FIELD,
  );

  if (uploadedDesignFile) {
    const uploadedDesignPath = buildStoredLocalDesignPath(
      uploadedDesignFile,
      "design",
    );
    await removeManagedLocalDesignFile(uploadedDesignPath, "design");
  }

  if (uploadedThumbnailImage) {
    const uploadedThumbnailPath = buildStoredLocalDesignPath(
      uploadedThumbnailImage,
      "thumbnail",
    );
    await removeManagedLocalDesignFile(uploadedThumbnailPath, "thumbnail");
  }
}

const searchDesignLibrary = asyncHandler(async (req, res) => {
  const searchQuery = hasText(req.query.q) ? String(req.query.q).trim() : null;

  const allLocalDesigns = await getActiveLocalDesigns();

  const localDesigns = allLocalDesigns
    .filter((localDesign) => matchesLocalDesignSearch(localDesign, searchQuery))
    .filter((localDesign) =>
      matchesLocalDesignCategory(localDesign, req.query.category),
    )
    .filter((localDesign) => matchesLocalDesignTag(localDesign, req.query.tag))
    .map(normalizeLocalDesign);

  let mmfResults = null;
  let mmfStatus = {
    available: true,
    message: null,
  };

  if (searchQuery) {
    try {
      mmfResults = await searchObjects({
        q: searchQuery,
        page: req.query.page,
        per_page: req.query.per_page,
        sort: req.query.sort,
        order: req.query.order,
      });
    } catch (error) {
      mmfStatus = {
        available: false,
        message: error.message || "MyMiniFactory is currently unavailable",
      };
    }
  }

  let curatedMmfResults = {
    totalCount: 0,
    items: [],
  };

  if (mmfResults) {
    const mmfObjectIds = Array.isArray(mmfResults.items)
      ? mmfResults.items.map((item) => item.id)
      : [];

    const overrides = await getDesignOverridesByMmfObjectIds(mmfObjectIds);
    const overrideMap = buildOverrideMap(overrides);

    const visibleItems = mmfResults.items
      .map((item) => {
        const override = overrideMap.get(Number(item.id)) || null;
        return applyOverrideToMmfItem(item, override);
      })
      .filter((item) => !item.override?.isHidden);

    const pinnedItems = visibleItems.filter((item) => item.override?.isPinned);
    const unpinnedItems = visibleItems.filter(
      (item) => !item.override?.isPinned,
    );

    curatedMmfResults = {
      totalCount: visibleItems.length,
      items: [...pinnedItems, ...unpinnedItems],
    };
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        mmfResults: curatedMmfResults,
        localDesigns,
        mmfStatus,
      },
      "Design library results fetched successfully",
    ),
  );
});

const getMmfDesignDetail = asyncHandler(async (req, res) => {
  const mmfObject = await getObjectById(req.params.objectId);
  const override = await getDesignOverrideByMmfObjectId(req.params.objectId);

  const curatedMmfObject = applyOverrideToMmfItem(mmfObject, override);

  if (curatedMmfObject.override?.isHidden) {
    throw new ApiError(404, "Design not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { mmfObject: curatedMmfObject },
        "Design detail fetched successfully",
      ),
    );
});

const listLocalDesigns = asyncHandler(async (req, res) => {
  const localDesigns = (await getActiveLocalDesigns()).map(
    normalizeLocalDesign,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { localDesigns },
        "Local designs fetched successfully",
      ),
    );
});

const getDesignTaxonomy = asyncHandler(async (req, res) => {
  const [categories, tags] = await Promise.all([
    listDesignCategories({ activeOnly: true }),
    listDesignTags({ activeOnly: true }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        categories: categories.map(normalizeCategory),
        tags: tags.map(normalizeTag),
      },
      "Design taxonomy fetched successfully",
    ),
  );
});

const listLocalDesignsForAdmin = asyncHandler(async (req, res) => {
  const archived = ["true", "1", "yes"].includes(
    String(req.query.archived ?? "")
      .trim()
      .toLowerCase(),
  );

  const localDesigns = (
    await getAllLocalDesignsForAdmin({
      archived,
    })
  ).map(normalizeLocalDesign);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { localDesigns },
        "Admin local designs fetched successfully",
      ),
    );
});

const getLocalDesignDetail = asyncHandler(async (req, res) => {
  const localDesign = await getLocalDesignById(req.params.designId);

  if (!localDesign) {
    throw new ApiError(404, "Local design not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { localDesign: normalizeLocalDesign(localDesign) },
        "Local design fetched successfully",
      ),
    );
});

const getLocalDesignDetailForAdmin = asyncHandler(async (req, res) => {
  const localDesign = await getLocalDesignByIdForAdmin(req.params.designId);

  if (!localDesign) {
    throw new ApiError(404, "Local design not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { localDesign: normalizeLocalDesign(localDesign) },
        "Admin local design fetched successfully",
      ),
    );
});

const createLocalDesign = asyncHandler(async (req, res) => {
  const uploadedDesignFile = getUploadedFile(
    req,
    LOCAL_DESIGN_FILE_UPLOAD_FIELD,
  );
  const uploadedThumbnailImage = getUploadedFile(
    req,
    LOCAL_DESIGN_THUMBNAIL_UPLOAD_FIELD,
  );

  if (!uploadedDesignFile) {
    throw new ApiError(400, "Design file is required");
  }

  const fileUrl = buildStoredLocalDesignPath(uploadedDesignFile, "design");
  const thumbnailUrl = uploadedThumbnailImage
    ? buildStoredLocalDesignPath(uploadedThumbnailImage, "thumbnail")
    : null;

  try {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const taxonomy = await resolveLocalDesignTaxonomy({
        body: req.body,
        userId: req.user.id,
        connection,
      });

      const localDesign = await createLocalDesignRecord(
        {
          title: String(req.body.title).trim(),
          description: normalizeOptionalText(req.body.description),
          thumbnailUrl,
          fileUrl,
          material: normalizeOptionalText(req.body.material),
          dimensions: normalizeOptionalText(req.body.dimensions),
          licenseType: normalizeOptionalText(req.body.licenseType),
          categoryId: taxonomy.categoryId,
          uploadedBy: req.user.id,
        },
        connection,
      );

      await replaceLocalDesignTags({
        localDesignId: localDesign.id,
        tagIds: taxonomy.tagIds,
        connection,
      });

      await connection.commit();

      const savedLocalDesign = await getLocalDesignByIdForAdmin(localDesign.id);

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            { localDesign: normalizeLocalDesign(savedLocalDesign) },
            "Local design created successfully",
          ),
        );
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    await removeManagedLocalDesignFile(fileUrl, "design");

    if (thumbnailUrl) {
      await removeManagedLocalDesignFile(thumbnailUrl, "thumbnail");
    }

    throw error;
  }
});

const updateLocalDesign = asyncHandler(async (req, res) => {
  const designId = req.params.designId;
  const existingLocalDesign = await getLocalDesignByIdForAdmin(designId);

  if (!existingLocalDesign) {
    await cleanupNewUploadedLocalDesignAssets(req);
    throw new ApiError(404, "Local design not found");
  }

  if (existingLocalDesign.archived_at) {
    await cleanupNewUploadedLocalDesignAssets(req);
    throw new ApiError(400, "Archived local designs cannot be updated");
  }

  const uploadedDesignFile = getUploadedFile(
    req,
    LOCAL_DESIGN_FILE_UPLOAD_FIELD,
  );
  const uploadedThumbnailImage = getUploadedFile(
    req,
    LOCAL_DESIGN_THUMBNAIL_UPLOAD_FIELD,
  );

  const nextFileUrl = uploadedDesignFile
    ? buildStoredLocalDesignPath(uploadedDesignFile, "design")
    : existingLocalDesign.file_url;

  const nextThumbnailUrl = uploadedThumbnailImage
    ? buildStoredLocalDesignPath(uploadedThumbnailImage, "thumbnail")
    : existingLocalDesign.thumbnail_url;

  const isActive =
    parseOptionalBoolean(req.body.isActive, "isActive") ??
    Boolean(existingLocalDesign.is_active);

  try {
    const connection = await pool.getConnection();
    let localDesign;

    try {
      await connection.beginTransaction();

      const taxonomy = await resolveLocalDesignTaxonomy({
        body: req.body,
        userId: req.user.id,
        connection,
        existingLocalDesign,
      });

      localDesign = await updateLocalDesignById(
        designId,
        {
          title: hasText(req.body.title)
            ? String(req.body.title).trim()
            : existingLocalDesign.title,
          description: hasText(req.body.description)
            ? String(req.body.description).trim()
            : existingLocalDesign.description,
          thumbnailUrl: nextThumbnailUrl,
          fileUrl: nextFileUrl,
          material: hasText(req.body.material)
            ? String(req.body.material).trim()
            : existingLocalDesign.material,
          dimensions: hasText(req.body.dimensions)
            ? String(req.body.dimensions).trim()
            : existingLocalDesign.dimensions,
          licenseType: hasText(req.body.licenseType)
            ? String(req.body.licenseType).trim()
            : existingLocalDesign.license_type,
          categoryId: taxonomy.categoryId,
          isActive,
        },
        connection,
      );

      if (taxonomy.hasTagUpdate) {
        await replaceLocalDesignTags({
          localDesignId: Number(designId),
          tagIds: taxonomy.tagIds,
          connection,
        });
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    if (!localDesign) {
      throw new ApiError(404, "Local design not found");
    }

    const refreshedLocalDesign = await getLocalDesignByIdForAdmin(designId);

    const replacedDesignFile =
      uploadedDesignFile &&
      existingLocalDesign.file_url &&
      existingLocalDesign.file_url !== localDesign.file_url;

    const replacedThumbnailFile =
      uploadedThumbnailImage &&
      existingLocalDesign.thumbnail_url &&
      existingLocalDesign.thumbnail_url !== localDesign.thumbnail_url;

    if (replacedDesignFile) {
      await removeManagedLocalDesignFile(
        existingLocalDesign.file_url,
        "design",
      );
    }

    if (replacedThumbnailFile) {
      await removeManagedLocalDesignFile(
        existingLocalDesign.thumbnail_url,
        "thumbnail",
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { localDesign: normalizeLocalDesign(refreshedLocalDesign) },
          "Local design updated successfully",
        ),
      );
  } catch (error) {
    if (uploadedDesignFile && nextFileUrl !== existingLocalDesign.file_url) {
      await removeManagedLocalDesignFile(nextFileUrl, "design");
    }

    if (
      uploadedThumbnailImage &&
      nextThumbnailUrl !== existingLocalDesign.thumbnail_url
    ) {
      await removeManagedLocalDesignFile(nextThumbnailUrl, "thumbnail");
    }

    throw error;
  }
});

const deactivateLocalDesign = asyncHandler(async (req, res) => {
  const localDesign = await deactivateLocalDesignById(req.params.designId);

  if (!localDesign) {
    throw new ApiError(404, "Local design not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { localDesign: normalizeLocalDesign(localDesign) },
        "Local design deactivated successfully",
      ),
    );
});

const archiveLocalDesign = asyncHandler(async (req, res) => {
  const existingLocalDesign = await getLocalDesignByIdForAdmin(
    req.params.designId,
  );

  if (!existingLocalDesign) {
    throw new ApiError(404, "Local design not found");
  }

  if (existingLocalDesign.archived_at) {
    throw new ApiError(400, "Local design is already archived");
  }

  if (existingLocalDesign.is_active) {
    throw new ApiError(400, "Only unavailable local designs can be archived");
  }

  const localDesign = await archiveLocalDesignById(
    req.params.designId,
    req.user.id,
  );

  if (!localDesign) {
    throw new ApiError(404, "Local design not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { localDesign: normalizeLocalDesign(localDesign) },
        "Local design archived successfully",
      ),
    );
});

const deleteLocalDesign = asyncHandler(async (req, res) => {
  const existingLocalDesign = await getLocalDesignByIdForAdmin(
    req.params.designId,
  );

  if (!existingLocalDesign) {
    throw new ApiError(404, "Local design not found");
  }

  if (!existingLocalDesign.archived_at) {
    throw new ApiError(400, "Only archived local designs can be deleted");
  }

  if (existingLocalDesign.is_active) {
    throw new ApiError(400, "Only unavailable local designs can be deleted");
  }

  const references = await countLocalDesignReferences(req.params.designId);

  if (references.printRequestCount > 0 || references.designRequestCount > 0) {
    throw new ApiError(
      409,
      "Local design cannot be deleted while print requests or design requests still reference it",
    );
  }

  const deleted = await deleteLocalDesignById(req.params.designId);

  if (!deleted) {
    throw new ApiError(404, "Local design not found");
  }

  await Promise.all([
    removeManagedLocalDesignFile(existingLocalDesign.file_url, "design"),
    removeManagedLocalDesignFile(existingLocalDesign.thumbnail_url, "thumbnail"),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Local design deleted successfully"));
});

const listDesignOverrides = asyncHandler(async (req, res) => {
  const designOverrides = (await getAllDesignOverrides()).map(
    normalizeDesignOverride,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { designOverrides },
        "Design overrides fetched successfully",
      ),
    );
});

const createDesignOverride = asyncHandler(async (req, res) => {
  const mmfObjectId = Number(req.body.mmfObjectId);

  const existingOverride = await getDesignOverrideByMmfObjectId(mmfObjectId);

  if (existingOverride) {
    throw new ApiError(
      409,
      `Design override already exists for MMF object ID: ${mmfObjectId}`,
    );
  }

  const isPrintReady =
    parseOptionalBoolean(req.body.isPrintReady, "isPrintReady") ?? false;
  const linkedLocalDesignId = await resolveLinkedLocalDesignId(req.body);

  if (isPrintReady && !linkedLocalDesignId) {
    throw new ApiError(
      400,
      "A print-ready MMF override must link to an active local design",
    );
  }

  const designOverride = await createDesignOverrideRecord({
    mmfObjectId,
    isHidden: parseOptionalBoolean(req.body.isHidden, "isHidden") ?? false,
    isPinned: parseOptionalBoolean(req.body.isPinned, "isPinned") ?? false,
    isPrintReady,
    linkedLocalDesignId,
    clientNote: normalizeOptionalText(req.body.clientNote),
    createdBy: req.user.id,
    updatedBy: req.user.id,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { designOverride: normalizeDesignOverride(designOverride) },
        "Design override created successfully",
      ),
    );
});

const updateDesignOverride = asyncHandler(async (req, res) => {
  const overrideId = req.params.overrideId;
  const existingOverride = await getDesignOverrideById(overrideId);

  if (!existingOverride) {
    throw new ApiError(404, "Design override not found");
  }

  const isPrintReady =
    parseOptionalBoolean(req.body.isPrintReady, "isPrintReady") ??
    Boolean(existingOverride.is_print_ready);
  const linkedLocalDesignId = Object.prototype.hasOwnProperty.call(
    req.body,
    "linkedLocalDesignId",
  )
    ? await resolveLinkedLocalDesignId(req.body)
    : existingOverride.linked_local_design_id;

  if (isPrintReady && !linkedLocalDesignId) {
    throw new ApiError(
      400,
      "A print-ready MMF override must link to an active local design",
    );
  }

  const designOverride = await updateDesignOverrideById(overrideId, {
    isHidden:
      parseOptionalBoolean(req.body.isHidden, "isHidden") ??
      Boolean(existingOverride.is_hidden),
    isPinned:
      parseOptionalBoolean(req.body.isPinned, "isPinned") ??
      Boolean(existingOverride.is_pinned),
    isPrintReady,
    linkedLocalDesignId,
    clientNote: Object.prototype.hasOwnProperty.call(req.body, "clientNote")
      ? normalizeOptionalText(req.body.clientNote)
      : existingOverride.client_note,
    updatedBy: req.user.id,
  });

  if (!designOverride) {
    throw new ApiError(404, "Design override not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { designOverride: normalizeDesignOverride(designOverride) },
        "Design override updated successfully",
      ),
    );
});

const deleteDesignOverride = asyncHandler(async (req, res) => {
  const deleted = await deleteDesignOverrideById(req.params.overrideId);

  if (!deleted) {
    throw new ApiError(404, "Design override not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Design override deleted successfully"));
});

export {
  searchDesignLibrary,
  getMmfDesignDetail,
  getDesignTaxonomy,
  listLocalDesigns,
  listLocalDesignsForAdmin,
  getLocalDesignDetail,
  getLocalDesignDetailForAdmin,
  createLocalDesign,
  updateLocalDesign,
  deactivateLocalDesign,
  archiveLocalDesign,
  deleteLocalDesign,
  listDesignOverrides,
  createDesignOverride,
  updateDesignOverride,
  deleteDesignOverride,
};
