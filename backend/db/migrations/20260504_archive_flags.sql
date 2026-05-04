ALTER TABLE print_requests
  ADD COLUMN archived_at datetime DEFAULT NULL AFTER rejection_reason,
  ADD COLUMN archived_by int unsigned DEFAULT NULL AFTER archived_at,
  ADD KEY idx_print_requests_archived_status_created_at (archived_at, status, created_at, id),
  ADD CONSTRAINT fk_print_requests_archived_by
    FOREIGN KEY (archived_by) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

ALTER TABLE design_requests
  ADD COLUMN archived_at datetime DEFAULT NULL AFTER admin_note,
  ADD COLUMN archived_by int unsigned DEFAULT NULL AFTER archived_at,
  ADD KEY idx_design_requests_archived_status_created_at (archived_at, status, created_at, id),
  ADD CONSTRAINT fk_design_requests_archived_by
    FOREIGN KEY (archived_by) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

ALTER TABLE local_designs
  ADD COLUMN archived_at datetime DEFAULT NULL AFTER uploaded_by,
  ADD COLUMN archived_by int unsigned DEFAULT NULL AFTER archived_at,
  ADD KEY idx_local_designs_archived_active_created_at (archived_at, is_active, created_at, id),
  ADD CONSTRAINT fk_local_designs_archived_by
    FOREIGN KEY (archived_by) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
