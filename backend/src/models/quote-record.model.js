import crypto from "crypto";
import pool from "../db/db.js";

const QUOTE_TOKEN_BYTES = 32;

function getExecutor(connection) {
  return connection || pool;
}

function createQuoteToken() {
  return crypto.randomBytes(QUOTE_TOKEN_BYTES).toString("hex");
}

function hashQuoteToken(quoteToken) {
  return crypto.createHash("sha256").update(String(quoteToken)).digest("hex");
}

function serializeJson(value) {
  if (value === undefined || value === null) {
    return null;
  }

  return JSON.stringify(value);
}

async function createQuoteRecord(payload, connection = null) {
  const executor = getExecutor(connection);
  const quoteToken = createQuoteToken();
  const quoteTokenHash = hashQuoteToken(quoteToken);

  const sql = `
    INSERT INTO quote_records (
      quote_token_hash,
      source_type,
      design_id,
      design_request_id,
      file_url,
      file_original_name,
      file_mime_type,
      file_size,
      material,
      print_quality,
      infill,
      quantity,
      estimated_cost,
      design_snapshot,
      quote_snapshot,
      pricing_config_snapshot,
      material_snapshot,
      expires_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await executor.query(sql, [
    quoteTokenHash,
    payload.sourceType,
    payload.designId ?? null,
    payload.designRequestId ?? null,
    payload.fileUrl ?? null,
    payload.fileOriginalName ?? null,
    payload.fileMimeType ?? null,
    payload.fileSize ?? null,
    payload.material,
    payload.printQuality,
    payload.infill,
    payload.quantity,
    payload.estimatedCost,
    serializeJson(payload.designSnapshot),
    serializeJson(payload.quoteSnapshot),
    serializeJson(payload.pricingConfigSnapshot),
    serializeJson(payload.materialSnapshot),
    payload.expiresAt,
  ]);

  const quoteRecord = await getQuoteRecordById(result.insertId, connection);

  return {
    quoteToken,
    quoteRecord,
  };
}

async function getQuoteRecordById(quoteRecordId, connection = null) {
  const executor = getExecutor(connection);

  const sql = `
    SELECT
      id,
      quote_token_hash,
      source_type,
      design_id,
      design_request_id,
      file_url,
      file_original_name,
      file_mime_type,
      file_size,
      material,
      print_quality,
      infill,
      quantity,
      estimated_cost,
      design_snapshot,
      quote_snapshot,
      pricing_config_snapshot,
      material_snapshot,
      expires_at,
      used_at,
      created_at,
      updated_at
    FROM quote_records
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await executor.query(sql, [quoteRecordId]);
  return rows[0] || null;
}

async function getValidQuoteRecordByToken(quoteToken, connection = null) {
  const executor = getExecutor(connection);
  const quoteTokenHash = hashQuoteToken(quoteToken);

  const sql = `
    SELECT
      id,
      quote_token_hash,
      source_type,
      design_id,
      design_request_id,
      file_url,
      file_original_name,
      file_mime_type,
      file_size,
      material,
      print_quality,
      infill,
      quantity,
      estimated_cost,
      design_snapshot,
      quote_snapshot,
      pricing_config_snapshot,
      material_snapshot,
      expires_at,
      used_at,
      created_at,
      updated_at
    FROM quote_records
    WHERE quote_token_hash = ?
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `;

  const [rows] = await executor.query(sql, [quoteTokenHash]);
  return rows[0] || null;
}

async function markQuoteRecordUsed(quoteRecordId, connection = null) {
  const executor = getExecutor(connection);

  const sql = `
    UPDATE quote_records
    SET used_at = NOW()
    WHERE id = ? AND used_at IS NULL
  `;

  const [result] = await executor.query(sql, [quoteRecordId]);
  return result.affectedRows > 0;
}

async function getExpiredUnusedQuoteRecords({ limit = 100 } = {}) {
  const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 100;

  const sql = `
    SELECT
      id,
      source_type,
      file_url,
      expires_at,
      created_at
    FROM quote_records
    WHERE used_at IS NULL
      AND expires_at <= NOW()
    ORDER BY expires_at ASC, id ASC
    LIMIT ?
  `;

  const [rows] = await pool.query(sql, [normalizedLimit]);
  return rows;
}

async function deleteQuoteRecordById(quoteRecordId, connection = null) {
  const executor = getExecutor(connection);

  const sql = `
    DELETE FROM quote_records
    WHERE id = ?
  `;

  const [result] = await executor.query(sql, [quoteRecordId]);
  return result.affectedRows > 0;
}

export {
  createQuoteRecord,
  getValidQuoteRecordByToken,
  markQuoteRecordUsed,
  getExpiredUnusedQuoteRecords,
  deleteQuoteRecordById,
};
