-- Adds uploaded reference file metadata to custom design requests.

SET @has_design_request_reference_files := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'design_requests'
    AND column_name = 'reference_files'
);

SET @add_design_request_reference_files_sql := IF(
  @has_design_request_reference_files = 0,
  'ALTER TABLE design_requests ADD COLUMN reference_files JSON NULL AFTER quantity',
  'SELECT ''design_requests.reference_files already exists'' AS message'
);

PREPARE add_design_request_reference_files_stmt FROM @add_design_request_reference_files_sql;
EXECUTE add_design_request_reference_files_stmt;
DEALLOCATE PREPARE add_design_request_reference_files_stmt;
