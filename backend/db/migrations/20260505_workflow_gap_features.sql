CREATE TABLE IF NOT EXISTS design_categories (
  id int unsigned NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  slug varchar(120) NOT NULL,
  description text DEFAULT NULL,
  is_active tinyint(1) NOT NULL DEFAULT 1,
  created_by int unsigned DEFAULT NULL,
  updated_by int unsigned DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_design_categories_name (name),
  UNIQUE KEY uq_design_categories_slug (slug),
  KEY fk_design_categories_created_by (created_by),
  KEY fk_design_categories_updated_by (updated_by),
  CONSTRAINT fk_design_categories_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_design_categories_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS design_tags (
  id int unsigned NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  slug varchar(120) NOT NULL,
  is_active tinyint(1) NOT NULL DEFAULT 1,
  created_by int unsigned DEFAULT NULL,
  updated_by int unsigned DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_design_tags_name (name),
  UNIQUE KEY uq_design_tags_slug (slug),
  KEY fk_design_tags_created_by (created_by),
  KEY fk_design_tags_updated_by (updated_by),
  CONSTRAINT fk_design_tags_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_design_tags_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE local_designs
  ADD COLUMN category_id int unsigned DEFAULT NULL AFTER license_type,
  ADD KEY idx_local_designs_category_id (category_id),
  ADD CONSTRAINT fk_local_designs_category
    FOREIGN KEY (category_id) REFERENCES design_categories (id)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS local_design_tags (
  local_design_id int NOT NULL,
  tag_id int unsigned NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (local_design_id, tag_id),
  KEY idx_local_design_tags_tag_id (tag_id),
  CONSTRAINT fk_local_design_tags_design
    FOREIGN KEY (local_design_id) REFERENCES local_designs (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_local_design_tags_tag
    FOREIGN KEY (tag_id) REFERENCES design_tags (id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS printers (
  id int unsigned NOT NULL AUTO_INCREMENT,
  name varchar(120) NOT NULL,
  model varchar(120) DEFAULT NULL,
  technology varchar(80) NOT NULL DEFAULT 'FDM',
  build_volume varchar(120) DEFAULT NULL,
  nozzle_size varchar(40) DEFAULT NULL,
  supported_materials json DEFAULT NULL,
  status enum('active','maintenance','retired') NOT NULL DEFAULT 'active',
  is_public tinyint(1) NOT NULL DEFAULT 1,
  display_order int NOT NULL DEFAULT 0,
  notes text DEFAULT NULL,
  created_by int unsigned DEFAULT NULL,
  updated_by int unsigned DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_printers_public_status_order (is_public, status, display_order, name),
  KEY fk_printers_created_by (created_by),
  KEY fk_printers_updated_by (updated_by),
  CONSTRAINT fk_printers_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_printers_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE design_overrides
  ADD COLUMN linked_local_design_id int DEFAULT NULL AFTER is_print_ready,
  ADD KEY idx_design_overrides_linked_local_design_id (linked_local_design_id),
  ADD CONSTRAINT fk_design_overrides_linked_local_design
    FOREIGN KEY (linked_local_design_id) REFERENCES local_designs (id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE quote_records
  MODIFY source_type enum('upload','library','design_request','mmf') NOT NULL;

ALTER TABLE print_requests
  MODIFY source_type enum('upload','library','design_request','mmf') NOT NULL;
