-- Adds admin-controlled print readiness for MyMiniFactory design overrides.

SET @has_is_print_ready := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'design_overrides'
    AND column_name = 'is_print_ready'
);

SET @add_is_print_ready_sql := IF(
  @has_is_print_ready = 0,
  'ALTER TABLE design_overrides ADD COLUMN is_print_ready BOOLEAN NOT NULL DEFAULT FALSE AFTER is_pinned',
  'SELECT ''design_overrides.is_print_ready already exists'' AS message'
);

PREPARE add_is_print_ready_stmt FROM @add_is_print_ready_sql;
EXECUTE add_is_print_ready_stmt;
DEALLOCATE PREPARE add_is_print_ready_stmt;
