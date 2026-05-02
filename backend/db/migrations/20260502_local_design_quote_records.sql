-- Adds local-design linkage fields to quote records.
-- Safe to run after the initial quote token migration.

SET @has_quote_design_id := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'quote_records'
    AND column_name = 'design_id'
);

SET @add_quote_design_id_sql := IF(
  @has_quote_design_id = 0,
  'ALTER TABLE quote_records ADD COLUMN design_id INT UNSIGNED NULL AFTER source_type',
  'SELECT ''quote_records.design_id already exists'' AS message'
);

PREPARE add_quote_design_id_stmt FROM @add_quote_design_id_sql;
EXECUTE add_quote_design_id_stmt;
DEALLOCATE PREPARE add_quote_design_id_stmt;

SET @has_quote_design_request_id := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'quote_records'
    AND column_name = 'design_request_id'
);

SET @add_quote_design_request_id_sql := IF(
  @has_quote_design_request_id = 0,
  'ALTER TABLE quote_records ADD COLUMN design_request_id INT UNSIGNED NULL AFTER design_id',
  'SELECT ''quote_records.design_request_id already exists'' AS message'
);

PREPARE add_quote_design_request_id_stmt FROM @add_quote_design_request_id_sql;
EXECUTE add_quote_design_request_id_stmt;
DEALLOCATE PREPARE add_quote_design_request_id_stmt;

SET @has_quote_design_snapshot := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'quote_records'
    AND column_name = 'design_snapshot'
);

SET @add_quote_design_snapshot_sql := IF(
  @has_quote_design_snapshot = 0,
  'ALTER TABLE quote_records ADD COLUMN design_snapshot JSON NULL AFTER estimated_cost',
  'SELECT ''quote_records.design_snapshot already exists'' AS message'
);

PREPARE add_quote_design_snapshot_stmt FROM @add_quote_design_snapshot_sql;
EXECUTE add_quote_design_snapshot_stmt;
DEALLOCATE PREPARE add_quote_design_snapshot_stmt;
