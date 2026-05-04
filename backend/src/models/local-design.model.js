import pool from "../db/db.js";

async function getActiveLocalDesigns() {
  const sql = `
    SELECT
      id,
      title,
      description,
      thumbnail_url,
      file_url,
      material,
      dimensions,
      license_type,
      is_active,
      uploaded_by,
      archived_at,
      archived_by,
      created_at,
      updated_at
    FROM local_designs
    WHERE is_active = TRUE AND archived_at IS NULL
    ORDER BY created_at DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function getAllLocalDesignsForAdmin({ archived = false } = {}) {
  const sql = `
    SELECT
      id,
      title,
      description,
      thumbnail_url,
      file_url,
      material,
      dimensions,
      license_type,
      is_active,
      uploaded_by,
      archived_at,
      archived_by,
      created_at,
      updated_at
    FROM local_designs
    WHERE archived_at ${archived ? "IS NOT NULL" : "IS NULL"}
    ORDER BY created_at DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function getLocalDesignById(designId) {
  const sql = `
    SELECT
      id,
      title,
      description,
      thumbnail_url,
      file_url,
      material,
      dimensions,
      license_type,
      is_active,
      uploaded_by,
      archived_at,
      archived_by,
      created_at,
      updated_at
    FROM local_designs
    WHERE id = ? AND is_active = TRUE AND archived_at IS NULL
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [designId]);
  return rows[0] || null;
}

async function getLocalDesignByIdForAdmin(designId) {
  const sql = `
    SELECT
      id,
      title,
      description,
      thumbnail_url,
      file_url,
      material,
      dimensions,
      license_type,
      is_active,
      uploaded_by,
      archived_at,
      archived_by,
      created_at,
      updated_at
    FROM local_designs
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [designId]);
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
  uploadedBy,
  isActive = true,
}) {
  const sql = `
    INSERT INTO local_designs (
      title,
      description,
      thumbnail_url,
      file_url,
      material,
      dimensions,
      license_type,
      is_active,
      uploaded_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(sql, [
    title,
    description,
    thumbnailUrl,
    fileUrl,
    material,
    dimensions,
    licenseType,
    isActive,
    uploadedBy,
  ]);

  return getLocalDesignByIdForAdmin(result.insertId);
}

async function updateLocalDesignById(designId, payload) {
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
      is_active = ?
    WHERE id = ?
  `;

  const [result] = await pool.query(sql, [
    payload.title,
    payload.description,
    payload.thumbnailUrl,
    payload.fileUrl,
    payload.material,
    payload.dimensions,
    payload.licenseType,
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

  return getLocalDesignByIdForAdmin(designId);
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
};
