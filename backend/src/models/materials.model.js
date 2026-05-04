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

async function getMaterialByKeyForAdmin(materialKey) {
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
    WHERE material_key = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [materialKey]);
  return rows[0] || null;
}

async function listActiveMaterialsForQuote() {
  const sql = `
    SELECT
      material_key,
      display_name
    FROM materials
    WHERE is_active = TRUE
    ORDER BY display_name ASC, material_key ASC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function listMaterialsForAdmin() {
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
    ORDER BY display_name ASC, material_key ASC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function createMaterial({
  materialKey,
  displayName,
  materialCostPerGram,
  isActive = true,
}) {
  const sql = `
    INSERT INTO materials (
      material_key,
      display_name,
      material_cost_per_gram,
      is_active
    )
    VALUES (?, ?, ?, ?)
  `;

  await pool.query(sql, [
    materialKey,
    displayName,
    materialCostPerGram,
    isActive,
  ]);

  return getMaterialByKeyForAdmin(materialKey);
}

async function updateMaterialByKey(materialKey, payload) {
  const sql = `
    UPDATE materials
    SET
      display_name = ?,
      material_cost_per_gram = ?,
      is_active = ?
    WHERE material_key = ?
  `;

  const [result] = await pool.query(sql, [
    payload.displayName,
    payload.materialCostPerGram,
    payload.isActive,
    materialKey,
  ]);

  if (result.affectedRows === 0) {
    return null;
  }

  return getMaterialByKeyForAdmin(materialKey);
}

async function deactivateMaterialByKey(materialKey) {
  const sql = `
    UPDATE materials
    SET is_active = FALSE
    WHERE material_key = ?
  `;

  const [result] = await pool.query(sql, [materialKey]);

  if (result.affectedRows === 0) {
    return null;
  }

  return getMaterialByKeyForAdmin(materialKey);
}

export {
  getMaterialByKey,
  getMaterialByKeyForAdmin,
  listActiveMaterialsForQuote,
  listMaterialsForAdmin,
  createMaterial,
  updateMaterialByKey,
  deactivateMaterialByKey,
};
