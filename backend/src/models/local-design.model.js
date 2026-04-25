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
      created_at,
      updated_at
    FROM local_designs
    WHERE is_active = TRUE
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
      created_at,
      updated_at
    FROM local_designs
    WHERE id = ? AND is_active = TRUE
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

export {
  getActiveLocalDesigns,
  getLocalDesignById,
  getLocalDesignByIdForAdmin,
  createLocalDesign,
  updateLocalDesignById,
  deactivateLocalDesignById,
};
