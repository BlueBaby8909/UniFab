import pool from "../db/db.js";

async function getAllDesignOverrides() {
  const sql = `
    SELECT
      id,
      mmf_object_id,
      is_hidden,
      is_pinned,
      is_print_ready,
      linked_local_design_id,
      client_note,
      created_by,
      updated_by,
      created_at,
      updated_at
    FROM design_overrides
    ORDER BY updated_at DESC, id DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function getDesignOverrideById(overrideId) {
  const sql = `
    SELECT
      id,
      mmf_object_id,
      is_hidden,
      is_pinned,
      is_print_ready,
      linked_local_design_id,
      client_note,
      created_by,
      updated_by,
      created_at,
      updated_at
    FROM design_overrides
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [overrideId]);
  return rows[0] || null;
}

async function getDesignOverrideByMmfObjectId(mmfObjectId) {
  const sql = `
    SELECT
      id,
      mmf_object_id,
      is_hidden,
      is_pinned,
      is_print_ready,
      linked_local_design_id,
      client_note,
      created_by,
      updated_by,
      created_at,
      updated_at
    FROM design_overrides
    WHERE mmf_object_id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [mmfObjectId]);
  return rows[0] || null;
}

async function createDesignOverride({
  mmfObjectId,
  isHidden = false,
  isPinned = false,
  isPrintReady = false,
  linkedLocalDesignId = null,
  clientNote = null,
  createdBy,
  updatedBy,
}) {
  const sql = `
    INSERT INTO design_overrides (
      mmf_object_id,
      is_hidden,
      is_pinned,
      is_print_ready,
      linked_local_design_id,
      client_note,
      created_by,
      updated_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(sql, [
    mmfObjectId,
    isHidden,
    isPinned,
    isPrintReady,
    linkedLocalDesignId,
    clientNote,
    createdBy,
    updatedBy,
  ]);

  return getDesignOverrideById(result.insertId);
}

async function updateDesignOverrideById(overrideId, payload) {
  const sql = `
    UPDATE design_overrides
    SET
      is_hidden = ?,
      is_pinned = ?,
      is_print_ready = ?,
      linked_local_design_id = ?,
      client_note = ?,
      updated_by = ?
    WHERE id = ?
  `;

  const [result] = await pool.query(sql, [
    payload.isHidden,
    payload.isPinned,
    payload.isPrintReady,
    payload.linkedLocalDesignId ?? null,
    payload.clientNote,
    payload.updatedBy,
    overrideId,
  ]);

  if (result.affectedRows === 0) {
    return null;
  }

  return getDesignOverrideById(overrideId);
}

async function deleteDesignOverrideById(overrideId) {
  const sql = `
    DELETE FROM design_overrides
    WHERE id = ?
  `;

  const [result] = await pool.query(sql, [overrideId]);
  return result.affectedRows > 0;
}

async function getDesignOverridesByMmfObjectIds(mmfObjectIds) {
  if (!Array.isArray(mmfObjectIds) || mmfObjectIds.length === 0) {
    return [];
  }

  const normalizedIds = [...new Set(mmfObjectIds.map(Number))].filter(
    (value) => Number.isInteger(value) && value > 0,
  );

  if (normalizedIds.length === 0) {
    return [];
  }

  const placeholders = normalizedIds.map(() => "?").join(", ");

  const sql = `
    SELECT
      id,
      mmf_object_id,
      is_hidden,
      is_pinned,
      is_print_ready,
      linked_local_design_id,
      client_note,
      created_by,
      updated_by,
      created_at,
      updated_at
    FROM design_overrides
    WHERE mmf_object_id IN (${placeholders})
  `;

  const [rows] = await pool.query(sql, normalizedIds);
  return rows;
}

export {
  getAllDesignOverrides,
  getDesignOverrideById,
  getDesignOverrideByMmfObjectId,
  getDesignOverridesByMmfObjectIds,
  createDesignOverride,
  updateDesignOverrideById,
  deleteDesignOverrideById,
};
