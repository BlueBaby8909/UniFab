import pool from "../db/db.js";

async function getActiveSlicerProfile(materialId, quality) {
  const sql = `
    SELECT
      id,
      material_id,
      quality,
      printer_name,
      nozzle,
      support_rule,
      orientation_rule,
      profile_filename,
      version_number,
      is_active,
      uploaded_by,
      created_at,
      updated_at
    FROM slicer_profiles
    WHERE material_id = ? AND quality = ? AND is_active = TRUE
    ORDER BY version_number DESC
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [materialId, quality]);
  return rows[0] || null;
}

export { getActiveSlicerProfile };
