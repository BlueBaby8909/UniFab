import pool from "../db/db.js";

function getExecutor(connection) {
  return connection || pool;
}

const LOCAL_DESIGN_SELECT = `
  ld.id,
  ld.title,
  ld.description,
  ld.thumbnail_url,
  ld.file_url,
  ld.material,
  ld.dimensions,
  ld.license_type,
  ld.category_id,
  dc.name AS category_name,
  dc.slug AS category_slug,
  dc.description AS category_description,
  ld.is_active,
  ld.uploaded_by,
  ld.archived_at,
  ld.archived_by,
  ld.created_at,
  ld.updated_at
`;

function toSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeName(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue || null;
}

async function attachTagsToLocalDesigns(localDesigns, connection = null) {
  if (!Array.isArray(localDesigns) || localDesigns.length === 0) {
    return localDesigns;
  }

  const executor = getExecutor(connection);
  const designIds = localDesigns.map((item) => item.id);

  const [tagRows] = await executor.query(
    `
      SELECT
        ldt.local_design_id,
        dt.id,
        dt.name,
        dt.slug
      FROM local_design_tags ldt
      INNER JOIN design_tags dt ON dt.id = ldt.tag_id
      WHERE ldt.local_design_id IN (?)
        AND dt.is_active = TRUE
      ORDER BY dt.name ASC
    `,
    [designIds],
  );

  const tagsByDesignId = new Map();

  for (const tagRow of tagRows) {
    const currentTags = tagsByDesignId.get(tagRow.local_design_id) || [];
    currentTags.push({
      id: tagRow.id,
      name: tagRow.name,
      slug: tagRow.slug,
    });
    tagsByDesignId.set(tagRow.local_design_id, currentTags);
  }

  return localDesigns.map((item) => ({
    ...item,
    tags: tagsByDesignId.get(item.id) || [],
  }));
}

async function getLocalDesignRows(sql, params = [], connection = null) {
  const executor = getExecutor(connection);
  const [rows] = await executor.query(sql, params);
  return attachTagsToLocalDesigns(rows, connection);
}

async function getActiveLocalDesigns() {
  const sql = `
    SELECT
      ${LOCAL_DESIGN_SELECT}
    FROM local_designs ld
    LEFT JOIN design_categories dc ON dc.id = ld.category_id
    WHERE ld.is_active = TRUE AND ld.archived_at IS NULL
    ORDER BY ld.created_at DESC
  `;

  return getLocalDesignRows(sql);
}

async function getAllLocalDesignsForAdmin({ archived = false } = {}) {
  const sql = `
    SELECT
      ${LOCAL_DESIGN_SELECT}
    FROM local_designs ld
    LEFT JOIN design_categories dc ON dc.id = ld.category_id
    WHERE ld.archived_at ${archived ? "IS NOT NULL" : "IS NULL"}
    ORDER BY ld.created_at DESC
  `;

  return getLocalDesignRows(sql);
}

async function getLocalDesignById(designId, connection = null) {
  const sql = `
    SELECT
      ${LOCAL_DESIGN_SELECT}
    FROM local_designs ld
    LEFT JOIN design_categories dc ON dc.id = ld.category_id
    WHERE ld.id = ? AND ld.is_active = TRUE AND ld.archived_at IS NULL
    LIMIT 1
  `;

  const rows = await getLocalDesignRows(sql, [designId], connection);
  return rows[0] || null;
}

async function getLocalDesignByIdForAdmin(designId, connection = null) {
  const sql = `
    SELECT
      ${LOCAL_DESIGN_SELECT}
    FROM local_designs ld
    LEFT JOIN design_categories dc ON dc.id = ld.category_id
    WHERE ld.id = ?
    LIMIT 1
  `;

  const rows = await getLocalDesignRows(sql, [designId], connection);
  return rows[0] || null;
}

async function createLocalDesign({
  title,
  description,
  thumbnailUrl,
  fileUrl,
  material,
  dimensions,
  licenseType,
  categoryId,
  uploadedBy,
  isActive = true,
}, connection = null) {
  const executor = getExecutor(connection);

  const sql = `
    INSERT INTO local_designs (
      title,
      description,
      thumbnail_url,
      file_url,
      material,
      dimensions,
      license_type,
      category_id,
      is_active,
      uploaded_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await executor.query(sql, [
    title,
    description,
    thumbnailUrl,
    fileUrl,
    material,
    dimensions,
    licenseType,
    categoryId ?? null,
    isActive,
    uploadedBy,
  ]);

  return getLocalDesignByIdForAdmin(result.insertId, connection);
}

async function updateLocalDesignById(designId, payload, connection = null) {
  const executor = getExecutor(connection);

  const sql = `
    UPDATE local_designs
    SET
      title = ?,
      description = ?,
      thumbnail_url = ?,
      file_url = ?,
      material = ?,
      dimensions = ?,
      license_type = ?,
      category_id = ?,
      is_active = ?
    WHERE id = ?
  `;

  const [result] = await executor.query(sql, [
    payload.title,
    payload.description,
    payload.thumbnailUrl,
    payload.fileUrl,
    payload.material,
    payload.dimensions,
    payload.licenseType,
    payload.categoryId ?? null,
    payload.isActive,
    designId,
  ]);

  if (result.affectedRows === 0) {
    return null;
  }

  return getLocalDesignByIdForAdmin(designId);
}

async function deactivateLocalDesignById(designId) {
  const sql = `
    UPDATE local_designs
    SET is_active = FALSE
    WHERE id = ?
  `;

  const [result] = await pool.query(sql, [designId]);

  if (result.affectedRows === 0) {
    return null;
  }

  return getLocalDesignByIdForAdmin(designId);
}

async function archiveLocalDesignById(designId, archivedBy) {
  const sql = `
    UPDATE local_designs
    SET
      archived_at = NOW(),
      archived_by = ?
    WHERE id = ? AND archived_at IS NULL
  `;

  const [result] = await pool.query(sql, [archivedBy, designId]);

  if (result.affectedRows === 0) {
    return null;
  }

  return getLocalDesignByIdForAdmin(designId, connection);
}

async function countLocalDesignReferences(designId) {
  const printRequestSql = `
    SELECT COUNT(*) AS total_count
    FROM print_requests
    WHERE design_id = ?
  `;

  const designRequestSql = `
    SELECT COUNT(*) AS total_count
    FROM design_requests
    WHERE result_design_id = ?
  `;

  const [[printRequestRows], [designRequestRows]] = await Promise.all([
    pool.query(printRequestSql, [designId]),
    pool.query(designRequestSql, [designId]),
  ]);

  return {
    printRequestCount: Number(printRequestRows[0]?.total_count || 0),
    designRequestCount: Number(designRequestRows[0]?.total_count || 0),
  };
}

async function listDesignCategories({ activeOnly = true } = {}) {
  const whereSql = activeOnly ? "WHERE is_active = TRUE" : "";
  const [rows] = await pool.query(
    `
      SELECT
        id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
      FROM design_categories
      ${whereSql}
      ORDER BY name ASC
    `,
  );

  return rows;
}

async function listDesignTags({ activeOnly = true } = {}) {
  const whereSql = activeOnly ? "WHERE is_active = TRUE" : "";
  const [rows] = await pool.query(
    `
      SELECT
        id,
        name,
        slug,
        is_active,
        created_at,
        updated_at
      FROM design_tags
      ${whereSql}
      ORDER BY name ASC
    `,
  );

  return rows;
}

async function getDesignCategoryById(categoryId, connection = null) {
  if (!categoryId) {
    return null;
  }

  const executor = getExecutor(connection);
  const [rows] = await executor.query(
    `
      SELECT id, name, slug, description, is_active, created_at, updated_at
      FROM design_categories
      WHERE id = ?
      LIMIT 1
    `,
    [categoryId],
  );

  return rows[0] || null;
}

async function upsertDesignCategoryByName({
  name,
  description = null,
  userId = null,
  connection = null,
}) {
  const normalizedName = normalizeName(name);

  if (!normalizedName) {
    return null;
  }

  const executor = getExecutor(connection);
  const slug = toSlug(normalizedName);

  await executor.query(
    `
      INSERT INTO design_categories (
        name,
        slug,
        description,
        is_active,
        created_by,
        updated_by
      )
      VALUES (?, ?, ?, TRUE, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = COALESCE(VALUES(description), description),
        is_active = TRUE,
        updated_by = VALUES(updated_by)
    `,
    [normalizedName, slug, description, userId, userId],
  );

  const [rows] = await executor.query(
    `
      SELECT id, name, slug, description, is_active, created_at, updated_at
      FROM design_categories
      WHERE slug = ?
      LIMIT 1
    `,
    [slug],
  );

  return rows[0] || null;
}

async function upsertDesignTagByName({
  name,
  userId = null,
  connection = null,
}) {
  const normalizedName = normalizeName(name);

  if (!normalizedName) {
    return null;
  }

  const executor = getExecutor(connection);
  const slug = toSlug(normalizedName);

  await executor.query(
    `
      INSERT INTO design_tags (
        name,
        slug,
        is_active,
        created_by,
        updated_by
      )
      VALUES (?, ?, TRUE, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        is_active = TRUE,
        updated_by = VALUES(updated_by)
    `,
    [normalizedName, slug, userId, userId],
  );

  const [rows] = await executor.query(
    `
      SELECT id, name, slug, is_active, created_at, updated_at
      FROM design_tags
      WHERE slug = ?
      LIMIT 1
    `,
    [slug],
  );

  return rows[0] || null;
}

async function replaceLocalDesignTags({
  localDesignId,
  tagIds = [],
  connection = null,
}) {
  const executor = getExecutor(connection);
  const uniqueTagIds = [...new Set(tagIds.map(Number).filter(Boolean))];

  await executor.query("DELETE FROM local_design_tags WHERE local_design_id = ?", [
    localDesignId,
  ]);

  if (uniqueTagIds.length === 0) {
    return [];
  }

  await executor.query(
    `
      INSERT INTO local_design_tags (local_design_id, tag_id)
      VALUES ?
    `,
    [uniqueTagIds.map((tagId) => [localDesignId, tagId])],
  );

  const [rows] = await executor.query(
    `
      SELECT dt.id, dt.name, dt.slug, dt.is_active, dt.created_at, dt.updated_at
      FROM local_design_tags ldt
      INNER JOIN design_tags dt ON dt.id = ldt.tag_id
      WHERE ldt.local_design_id = ?
      ORDER BY dt.name ASC
    `,
    [localDesignId],
  );

  return rows;
}

async function deleteLocalDesignById(designId) {
  const sql = `
    DELETE FROM local_designs
    WHERE id = ?
  `;

  const [result] = await pool.query(sql, [designId]);
  return result.affectedRows > 0;
}

export {
  getActiveLocalDesigns,
  getAllLocalDesignsForAdmin,
  getLocalDesignById,
  getLocalDesignByIdForAdmin,
  createLocalDesign,
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
};
