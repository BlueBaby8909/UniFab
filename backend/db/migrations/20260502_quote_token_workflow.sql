-- Quote token workflow migration.
-- Run this against the UniFab MySQL database before testing quote submission.

CREATE TABLE IF NOT EXISTS quote_records (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  quote_token_hash CHAR(64) NOT NULL UNIQUE,

  source_type ENUM('upload', 'library', 'design_request') NOT NULL,

  design_id INT UNSIGNED NULL,
  design_request_id INT UNSIGNED NULL,

  file_url VARCHAR(500) NULL,
  file_original_name VARCHAR(255) NULL,
  file_mime_type VARCHAR(120) NULL,
  file_size INT UNSIGNED NULL,

  material VARCHAR(50) NOT NULL,
  print_quality ENUM('draft', 'standard', 'fine') NOT NULL,
  infill DECIMAL(5,2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,

  estimated_cost DECIMAL(10,2) NOT NULL,

  design_snapshot JSON NULL,
  quote_snapshot JSON NOT NULL,
  pricing_config_snapshot JSON NOT NULL,
  material_snapshot JSON NOT NULL,

  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_quote_records_infill
    CHECK (infill >= 0 AND infill <= 100),

  CONSTRAINT chk_quote_records_quantity
    CHECK (quantity >= 1)
);

SET @has_quote_records_expires_at_index := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'quote_records'
    AND index_name = 'idx_quote_records_expires_at'
);

SET @add_quote_records_expires_at_index_sql := IF(
  @has_quote_records_expires_at_index = 0,
  'CREATE INDEX idx_quote_records_expires_at ON quote_records(expires_at)',
  'SELECT ''idx_quote_records_expires_at already exists'' AS message'
);

PREPARE add_quote_records_expires_at_index_stmt FROM @add_quote_records_expires_at_index_sql;
EXECUTE add_quote_records_expires_at_index_stmt;
DEALLOCATE PREPARE add_quote_records_expires_at_index_stmt;

SET @has_quote_records_used_at_index := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'quote_records'
    AND index_name = 'idx_quote_records_used_at'
);

SET @add_quote_records_used_at_index_sql := IF(
  @has_quote_records_used_at_index = 0,
  'CREATE INDEX idx_quote_records_used_at ON quote_records(used_at)',
  'SELECT ''idx_quote_records_used_at already exists'' AS message'
);

PREPARE add_quote_records_used_at_index_stmt FROM @add_quote_records_used_at_index_sql;
EXECUTE add_quote_records_used_at_index_stmt;
DEALLOCATE PREPARE add_quote_records_used_at_index_stmt;

SET @has_quote_token := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_requests'
    AND column_name = 'quote_token'
);

SET @add_quote_token_sql := IF(
  @has_quote_token = 0,
  'ALTER TABLE print_requests ADD COLUMN quote_token VARCHAR(64) NULL AFTER design_snapshot',
  'SELECT ''print_requests.quote_token already exists'' AS message'
);

PREPARE add_quote_token_stmt FROM @add_quote_token_sql;
EXECUTE add_quote_token_stmt;
DEALLOCATE PREPARE add_quote_token_stmt;

SET @has_quote_snapshot := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_requests'
    AND column_name = 'quote_snapshot'
);

SET @add_quote_snapshot_sql := IF(
  @has_quote_snapshot = 0,
  'ALTER TABLE print_requests ADD COLUMN quote_snapshot JSON NULL AFTER quote_token',
  'SELECT ''print_requests.quote_snapshot already exists'' AS message'
);

PREPARE add_quote_snapshot_stmt FROM @add_quote_snapshot_sql;
EXECUTE add_quote_snapshot_stmt;
DEALLOCATE PREPARE add_quote_snapshot_stmt;
