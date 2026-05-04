import pool from "../db/db.js";

async function createDesignRequest({
  requestedBy,
  title,
  description,
  preferredMaterial,
  dimensions,
  quantity,
  referenceFiles,
  status = "pending",
}) {
  const sql = `
    INSERT INTO design_requests (
      requested_by,
      title,
      description,
      preferred_material,
      dimensions,
      quantity,
      reference_files,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(sql, [
    requestedBy,
    title,
    description,
    preferredMaterial,
    dimensions,
    quantity,
    referenceFiles === undefined || referenceFiles === null
      ? null
      : JSON.stringify(referenceFiles),
    status,
  ]);

  return getDesignRequestById(result.insertId);
}

async function getDesignRequestById(requestId) {
  const sql = `
    SELECT
      id,
      requested_by,
      title,
      description,
      preferred_material,
      dimensions,
      quantity,
      reference_files,
      result_design_id,
      status,
      admin_note,
      archived_at,
      archived_by,
      created_at,
      updated_at
    FROM design_requests
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [requestId]);
  return rows[0] || null;
}

async function getDesignRequestByIdForOwner(requestId, userId) {
  const sql = `
    SELECT
      id,
      requested_by,
      title,
      description,
      preferred_material,
      dimensions,
      quantity,
      reference_files,
      result_design_id,
      status,
      admin_note,
      archived_at,
      archived_by,
      created_at,
      updated_at
    FROM design_requests
    WHERE id = ? AND requested_by = ? AND archived_at IS NULL
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [requestId, userId]);
  return rows[0] || null;
}

async function getDesignRequestsByOwner(userId) {
  const sql = `
    SELECT
      id,
      requested_by,
      title,
      description,
      preferred_material,
      dimensions,
      quantity,
      reference_files,
      result_design_id,
      status,
      admin_note,
      archived_at,
      archived_by,
      created_at,
      updated_at
    FROM design_requests
    WHERE requested_by = ? AND archived_at IS NULL
    ORDER BY created_at DESC, id DESC
  `;

  const [rows] = await pool.query(sql, [userId]);
  return rows;
}

async function getAllDesignRequests() {
  const sql = `
    SELECT
      id,
      requested_by,
      title,
      description,
      preferred_material,
      dimensions,
      quantity,
      reference_files,
      result_design_id,
      status,
      admin_note,
      archived_at,
      archived_by,
      created_at,
      updated_at
    FROM design_requests
    ORDER BY created_at DESC, id DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function updateDesignRequestStatusById(requestId, payload) {
  const sql = `
    UPDATE design_requests
    SET
      status = ?,
      admin_note = ?
    WHERE id = ?
  `;

  const [result] = await pool.query(sql, [
    payload.status,
    payload.adminNote,
    requestId,
  ]);

  if (result.affectedRows === 0) {
    return null;
  }

  return getDesignRequestById(requestId);
}

async function updateDesignRequestResultById(requestId, payload) {
  const sql = `
    UPDATE design_requests
    SET
      result_design_id = ?,
      status = ?,
      admin_note = ?
    WHERE id = ?
  `;

  const [result] = await pool.query(sql, [
    payload.resultDesignId,
    payload.status,
    payload.adminNote,
    requestId,
  ]);

  if (result.affectedRows === 0) {
    return null;
  }

  return getDesignRequestById(requestId);
}

async function getPaginatedDesignRequestsByOwner(
  userId,
  { page = 1, limit = 20 },
) {
  const offset = (page - 1) * limit;

  const countSql = `
    SELECT COUNT(*) AS total_count
    FROM design_requests
    WHERE requested_by = ? AND archived_at IS NULL
  `;

  const dataSql = `
    SELECT
      id,
      requested_by,
      title,
      description,
      preferred_material,
      dimensions,
      quantity,
      reference_files,
      result_design_id,
      status,
      admin_note,
      archived_at,
      archived_by,
      created_at,
      updated_at
    FROM design_requests
    WHERE requested_by = ? AND archived_at IS NULL
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  const [[countRows], [rows]] = await Promise.all([
    pool.query(countSql, [userId]),
    pool.query(dataSql, [userId, limit, offset]),
  ]);

  return {
    rows,
    totalCount: Number(countRows[0]?.total_count || 0),
    page,
    limit,
  };
}

async function getPaginatedAllDesignRequests({
  page = 1,
  limit = 20,
  status = null,
  archived = false,
}) {
  const offset = (page - 1) * limit;

  const whereClauses = [archived ? "archived_at IS NOT NULL" : "archived_at IS NULL"];
  const params = [];

  if (status) {
    whereClauses.push("status = ?");
    params.push(status);
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countSql = `
    SELECT COUNT(*) AS total_count
    FROM design_requests
    ${whereSql}
  `;

  const dataSql = `
    SELECT
      id,
      requested_by,
      title,
      description,
      preferred_material,
      dimensions,
      quantity,
      reference_files,
      result_design_id,
      status,
      admin_note,
      archived_at,
      archived_by,
      created_at,
      updated_at
    FROM design_requests
    ${whereSql}
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  const [[countRows], [rows]] = await Promise.all([
    pool.query(countSql, params),
    pool.query(dataSql, [...params, limit, offset]),
  ]);

  return {
    rows,
    totalCount: Number(countRows[0]?.total_count || 0),
    page,
    limit,
  };
}

async function archiveDesignRequestById(requestId, archivedBy) {
  const sql = `
    UPDATE design_requests
    SET
      archived_at = NOW(),
      archived_by = ?
    WHERE id = ? AND archived_at IS NULL
  `;

  const [result] = await pool.query(sql, [archivedBy, requestId]);

  if (result.affectedRows === 0) {
    return null;
  }

  return getDesignRequestById(requestId);
}

async function countPrintRequestsByDesignRequestId(requestId) {
  const sql = `
    SELECT COUNT(*) AS total_count
    FROM print_requests
    WHERE design_request_id = ?
  `;

  const [rows] = await pool.query(sql, [requestId]);
  return Number(rows[0]?.total_count || 0);
}

async function deleteDesignRequestById(requestId) {
  const sql = `
    DELETE FROM design_requests
    WHERE id = ?
  `;

  const [result] = await pool.query(sql, [requestId]);
  return result.affectedRows > 0;
}

export {
  createDesignRequest,
  getDesignRequestById,
  getDesignRequestByIdForOwner,
  getDesignRequestsByOwner,
  getPaginatedDesignRequestsByOwner,
  getAllDesignRequests,
  getPaginatedAllDesignRequests,
  updateDesignRequestStatusById,
  updateDesignRequestResultById,
  archiveDesignRequestById,
  countPrintRequestsByDesignRequestId,
  deleteDesignRequestById,
};
