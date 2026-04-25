import pool from "../db/db.js";

function getExecutor(connection) {
  return connection || pool;
}

function serializeJson(value) {
  if (value === undefined || value === null) {
    return null;
  }

  return JSON.stringify(value);
}

async function createPrintRequest(payload, connection = null) {
  const executor = getExecutor(connection);

  const sql = `
    INSERT INTO print_requests (
      reference_number,
      client_id,
      source_type,
      design_id,
      design_request_id,
      file_url,
      file_original_name,
      file_mime_type,
      file_size,
      design_snapshot,
      material,
      print_quality,
      infill,
      quantity,
      notes,
      estimated_cost,
      confirmed_cost,
      payment_slip_url,
      receipt_url,
      receipt_original_name,
      receipt_mime_type,
      receipt_size,
      receipt_uploaded_at,
      status,
      rejection_reason
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await executor.query(sql, [
    payload.referenceNumber,
    payload.clientId,
    payload.sourceType,
    payload.designId ?? null,
    payload.designRequestId ?? null,
    payload.fileUrl ?? null,
    payload.fileOriginalName ?? null,
    payload.fileMimeType ?? null,
    payload.fileSize ?? null,
    serializeJson(payload.designSnapshot),
    payload.material,
    payload.printQuality,
    payload.infill,
    payload.quantity,
    payload.notes ?? null,
    payload.estimatedCost ?? null,
    payload.confirmedCost ?? null,
    payload.paymentSlipUrl ?? null,
    payload.receiptUrl ?? null,
    payload.receiptOriginalName ?? null,
    payload.receiptMimeType ?? null,
    payload.receiptSize ?? null,
    payload.receiptUploadedAt ?? null,
    payload.status,
    payload.rejectionReason ?? null,
  ]);

  return getPrintRequestById(result.insertId, connection);
}

async function getPrintRequestById(requestId, connection = null) {
  const executor = getExecutor(connection);

  const sql = `
    SELECT
      id,
      reference_number,
      client_id,
      source_type,
      design_id,
      design_request_id,
      file_url,
      file_original_name,
      file_mime_type,
      file_size,
      design_snapshot,
      material,
      print_quality,
      infill,
      quantity,
      notes,
      estimated_cost,
      confirmed_cost,
      payment_slip_url,
      receipt_url,
      receipt_original_name,
      receipt_mime_type,
      receipt_size,
      receipt_uploaded_at,
      status,
      rejection_reason,
      created_at,
      updated_at
    FROM print_requests
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await executor.query(sql, [requestId]);
  return rows[0] || null;
}

async function getPrintRequestByIdForOwner(
  requestId,
  clientId,
  connection = null,
) {
  const executor = getExecutor(connection);

  const sql = `
    SELECT
      id,
      reference_number,
      client_id,
      source_type,
      design_id,
      design_request_id,
      file_url,
      file_original_name,
      file_mime_type,
      file_size,
      design_snapshot,
      material,
      print_quality,
      infill,
      quantity,
      notes,
      estimated_cost,
      confirmed_cost,
      payment_slip_url,
      receipt_url,
      receipt_original_name,
      receipt_mime_type,
      receipt_size,
      receipt_uploaded_at,
      status,
      rejection_reason,
      created_at,
      updated_at
    FROM print_requests
    WHERE id = ? AND client_id = ?
    LIMIT 1
  `;

  const [rows] = await executor.query(sql, [requestId, clientId]);
  return rows[0] || null;
}

async function getPaginatedPrintRequestsByOwner(
  clientId,
  { page = 1, limit = 20, status = null } = {},
) {
  const offset = (page - 1) * limit;

  const whereClauses = ["client_id = ?"];
  const params = [clientId];

  if (status) {
    whereClauses.push("status = ?");
    params.push(status);
  }

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

  const countSql = `
    SELECT COUNT(*) AS total_count
    FROM print_requests
    ${whereSql}
  `;

  const dataSql = `
    SELECT
      id,
      reference_number,
      client_id,
      source_type,
      design_id,
      design_request_id,
      file_url,
      file_original_name,
      file_mime_type,
      file_size,
      design_snapshot,
      material,
      print_quality,
      infill,
      quantity,
      notes,
      estimated_cost,
      confirmed_cost,
      payment_slip_url,
      receipt_url,
      receipt_original_name,
      receipt_mime_type,
      receipt_size,
      receipt_uploaded_at,
      status,
      rejection_reason,
      created_at,
      updated_at
    FROM print_requests
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

async function getPaginatedAllPrintRequests({
  page = 1,
  limit = 20,
  status = null,
  sourceType = null,
} = {}) {
  const offset = (page - 1) * limit;

  const whereClauses = [];
  const params = [];

  if (status) {
    whereClauses.push("status = ?");
    params.push(status);
  }

  if (sourceType) {
    whereClauses.push("source_type = ?");
    params.push(sourceType);
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countSql = `
    SELECT COUNT(*) AS total_count
    FROM print_requests
    ${whereSql}
  `;

  const dataSql = `
    SELECT
      id,
      reference_number,
      client_id,
      source_type,
      design_id,
      design_request_id,
      file_url,
      file_original_name,
      file_mime_type,
      file_size,
      design_snapshot,
      material,
      print_quality,
      infill,
      quantity,
      notes,
      estimated_cost,
      confirmed_cost,
      payment_slip_url,
      receipt_url,
      receipt_original_name,
      receipt_mime_type,
      receipt_size,
      receipt_uploaded_at,
      status,
      rejection_reason,
      created_at,
      updated_at
    FROM print_requests
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

async function updatePrintRequestStatusById(
  requestId,
  payload,
  connection = null,
) {
  const executor = getExecutor(connection);

  const sql = `
    UPDATE print_requests
    SET
      status = ?,
      rejection_reason = ?,
      confirmed_cost = ?,
      payment_slip_url = ?
    WHERE id = ?
  `;

  const [result] = await executor.query(sql, [
    payload.status,
    payload.rejectionReason ?? null,
    payload.confirmedCost ?? null,
    payload.paymentSlipUrl ?? null,
    requestId,
  ]);

  if (result.affectedRows === 0) {
    return null;
  }

  return getPrintRequestById(requestId, connection);
}

async function createPrintRequestStatusHistory(payload, connection = null) {
  const executor = getExecutor(connection);

  const sql = `
    INSERT INTO print_request_status_history (
      print_request_id,
      status,
      changed_by,
      changed_by_role,
      note
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await executor.query(sql, [
    payload.printRequestId,
    payload.status,
    payload.changedBy,
    payload.changedByRole,
    payload.note ?? null,
  ]);

  return getPrintRequestStatusHistoryById(result.insertId, connection);
}

async function getPrintRequestStatusHistoryById(historyId, connection = null) {
  const executor = getExecutor(connection);

  const sql = `
    SELECT
      id,
      print_request_id,
      status,
      changed_by,
      changed_by_role,
      note,
      created_at
    FROM print_request_status_history
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await executor.query(sql, [historyId]);
  return rows[0] || null;
}

async function getPrintRequestStatusHistoryByRequestId(
  requestId,
  connection = null,
) {
  const executor = getExecutor(connection);

  const sql = `
    SELECT
      id,
      print_request_id,
      status,
      changed_by,
      changed_by_role,
      note,
      created_at
    FROM print_request_status_history
    WHERE print_request_id = ?
    ORDER BY created_at ASC, id ASC
  `;

  const [rows] = await executor.query(sql, [requestId]);
  return rows;
}

async function attachReceiptToPrintRequest(
  requestId,
  payload,
  connection = null,
) {
  const executor = getExecutor(connection);

  const sql = `
    UPDATE print_requests
    SET
      receipt_url = ?,
      receipt_original_name = ?,
      receipt_mime_type = ?,
      receipt_size = ?,
      receipt_uploaded_at = NOW(),
      status = ?
    WHERE id = ?
  `;

  const [result] = await executor.query(sql, [
    payload.receiptUrl,
    payload.receiptOriginalName,
    payload.receiptMimeType,
    payload.receiptSize,
    payload.status,
    requestId,
  ]);

  if (result.affectedRows === 0) {
    return null;
  }

  return getPrintRequestById(requestId, connection);
}

export {
  createPrintRequest,
  getPrintRequestById,
  getPrintRequestByIdForOwner,
  getPaginatedPrintRequestsByOwner,
  getPaginatedAllPrintRequests,
  updatePrintRequestStatusById,
  attachReceiptToPrintRequest,
  createPrintRequestStatusHistory,
  getPrintRequestStatusHistoryById,
  getPrintRequestStatusHistoryByRequestId,
};
