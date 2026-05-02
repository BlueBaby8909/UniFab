-- Links completed custom design requests to produced local designs.

SET @has_design_request_result_design_id := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'design_requests'
    AND column_name = 'result_design_id'
);

SET @add_design_request_result_design_id_sql := IF(
  @has_design_request_result_design_id = 0,
  'ALTER TABLE design_requests ADD COLUMN result_design_id INT NULL AFTER reference_files',
  'SELECT ''design_requests.result_design_id already exists'' AS message'
);

PREPARE add_design_request_result_design_id_stmt FROM @add_design_request_result_design_id_sql;
EXECUTE add_design_request_result_design_id_stmt;
DEALLOCATE PREPARE add_design_request_result_design_id_stmt;

SET @has_design_request_result_design_index := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'design_requests'
    AND index_name = 'idx_design_requests_result_design_id'
);

SET @add_design_request_result_design_index_sql := IF(
  @has_design_request_result_design_index = 0,
  'CREATE INDEX idx_design_requests_result_design_id ON design_requests(result_design_id)',
  'SELECT ''idx_design_requests_result_design_id already exists'' AS message'
);

PREPARE add_design_request_result_design_index_stmt FROM @add_design_request_result_design_index_sql;
EXECUTE add_design_request_result_design_index_stmt;
DEALLOCATE PREPARE add_design_request_result_design_index_stmt;
