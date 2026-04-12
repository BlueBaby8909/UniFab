import pool from "../db/db.js";

async function getMaterialByKey(materialKey) {
  const sql = `
    SELECT
      id,
      material_key,
      display_name,
      material_cost_per_gram,
      is_active,
      created_at,
      updated_at
    FROM materials
    WHERE material_key = ? AND is_active = TRUE
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [materialKey]);
  return rows[0] || null;
}

export { getMaterialByKey };
