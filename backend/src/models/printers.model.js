import pool from "../db/db.js";

function serializeJson(value) {
  if (value === undefined || value === null) {
    return null;
  }

  return JSON.stringify(value);
}

async function listPublicPrinters() {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        name,
        model,
        technology,
        build_volume,
        nozzle_size,
        supported_materials,
        status,
        is_public,
        display_order,
        notes,
        created_at,
        updated_at
      FROM printers
      WHERE is_public = TRUE
        AND status <> 'retired'
      ORDER BY display_order ASC, name ASC
    `,
  );

  return rows;
}

async function listPrintersForAdmin() {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        name,
        model,
        technology,
        build_volume,
        nozzle_size,
        supported_materials,
        status,
        is_public,
        display_order,
        notes,
        created_by,
        updated_by,
        created_at,
        updated_at
      FROM printers
      ORDER BY display_order ASC, name ASC
    `,
  );

  return rows;
}

async function getPrinterById(printerId) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        name,
        model,
        technology,
        build_volume,
        nozzle_size,
        supported_materials,
        status,
        is_public,
        display_order,
        notes,
        created_by,
        updated_by,
        created_at,
        updated_at
      FROM printers
      WHERE id = ?
      LIMIT 1
    `,
    [printerId],
  );

  return rows[0] || null;
}

async function createPrinter(payload) {
  const [result] = await pool.query(
    `
      INSERT INTO printers (
        name,
        model,
        technology,
        build_volume,
        nozzle_size,
        supported_materials,
        status,
        is_public,
        display_order,
        notes,
        created_by,
        updated_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.name,
      payload.model ?? null,
      payload.technology,
      payload.buildVolume ?? null,
      payload.nozzleSize ?? null,
      serializeJson(payload.supportedMaterials),
      payload.status,
      payload.isPublic,
      payload.displayOrder,
      payload.notes ?? null,
      payload.createdBy ?? null,
      payload.updatedBy ?? null,
    ],
  );

  return getPrinterById(result.insertId);
}

async function updatePrinterById(printerId, payload) {
  const [result] = await pool.query(
    `
      UPDATE printers
      SET
        name = ?,
        model = ?,
        technology = ?,
        build_volume = ?,
        nozzle_size = ?,
        supported_materials = ?,
        status = ?,
        is_public = ?,
        display_order = ?,
        notes = ?,
        updated_by = ?
      WHERE id = ?
    `,
    [
      payload.name,
      payload.model ?? null,
      payload.technology,
      payload.buildVolume ?? null,
      payload.nozzleSize ?? null,
      serializeJson(payload.supportedMaterials),
      payload.status,
      payload.isPublic,
      payload.displayOrder,
      payload.notes ?? null,
      payload.updatedBy ?? null,
      printerId,
    ],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getPrinterById(printerId);
}

async function deletePrinterById(printerId) {
  const [result] = await pool.query("DELETE FROM printers WHERE id = ?", [
    printerId,
  ]);

  return result.affectedRows > 0;
}

export {
  listPublicPrinters,
  listPrintersForAdmin,
  getPrinterById,
  createPrinter,
  updatePrinterById,
  deletePrinterById,
};
