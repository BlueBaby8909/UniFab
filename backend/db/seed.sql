-- UniFab baseline seed data.
-- This file intentionally avoids test users, quote records, print requests,
-- design requests, and local design rows so a reset starts clean.

INSERT INTO materials (
  id,
  material_key,
  display_name,
  material_cost_per_gram,
  is_active
)
VALUES
  (1, 'PLA', 'PLA', 1.5000, TRUE),
  (2, 'PETG', 'PETG', 1.8000, TRUE),
  (3, 'TPU', 'TPU Flexible', 2.3500, FALSE)
ON DUPLICATE KEY UPDATE
  material_key = VALUES(material_key),
  display_name = VALUES(display_name),
  material_cost_per_gram = VALUES(material_cost_per_gram),
  is_active = VALUES(is_active);

INSERT INTO pricing_config (
  id,
  material_cost_per_gram,
  machine_hour_rate,
  base_fee,
  waste_factor,
  support_markup_factor,
  electricity_cost_per_kwh,
  power_consumption_watts,
  currency,
  updated_by
)
VALUES (
  1,
  JSON_OBJECT('PLA', 0.562, 'PETG', 0.386),
  13.00,
  20.00,
  0.1500,
  0.1000,
  13.0000,
  180.00,
  'PHP',
  NULL
)
ON DUPLICATE KEY UPDATE
  material_cost_per_gram = VALUES(material_cost_per_gram),
  machine_hour_rate = VALUES(machine_hour_rate),
  base_fee = VALUES(base_fee),
  waste_factor = VALUES(waste_factor),
  support_markup_factor = VALUES(support_markup_factor),
  electricity_cost_per_kwh = VALUES(electricity_cost_per_kwh),
  power_consumption_watts = VALUES(power_consumption_watts),
  currency = VALUES(currency),
  updated_by = VALUES(updated_by);

INSERT INTO slicer_profiles (
  id,
  material_id,
  quality,
  printer_name,
  nozzle,
  support_rule,
  orientation_rule,
  profile_filename,
  version_number,
  is_active,
  uploaded_by
)
VALUES
  (1, 1, 'draft', 'Creality Ender 3 V3 SE', '0.4mm', 'auto', 'original', 'ender3v3se-pla-draft.ini', 1, TRUE, NULL),
  (2, 1, 'standard', 'Creality Ender 3 V3 SE', '0.4mm', 'auto', 'original', 'ender3v3se-pla-standard.ini', 1, FALSE, NULL),
  (3, 1, 'fine', 'Creality Ender 3 V3 SE', '0.4mm', 'auto', 'original', 'ender3v3se-pla-fine.ini', 1, TRUE, NULL),
  (4, 2, 'draft', 'Creality Ender 3 V3 SE', '0.4mm', 'auto', 'original', 'ender3v3se-petg-draft.ini', 1, TRUE, NULL),
  (5, 2, 'standard', 'Creality Ender 3 V3 SE', '0.4mm', 'auto', 'original', 'ender3v3se-petg-standard.ini', 1, TRUE, NULL),
  (6, 2, 'fine', 'Creality Ender 3 V3 SE', '0.4mm', 'auto', 'original', 'ender3v3se-petg-fine.ini', 1, TRUE, NULL),
  (7, 1, 'standard', 'Creality Ender 3 V3 SE', '0.4mm', 'auto', 'original', 'pla-standard-v2-4d2566a0.ini', 2, TRUE, NULL),
  (8, 3, 'standard', 'Creality Ender 3 V3 SE', '0.4mm', 'auto', 'original', 'tpu-standard-v1-f08e0e89.ini', 1, FALSE, NULL),
  (9, 3, 'standard', 'Creality Ender 3 V3 SE', '0.4mm', 'auto', 'original', 'tpu-standard-v2-e39ccc9b.ini', 2, FALSE, NULL),
  (10, 3, 'standard', 'Creality Ender 3 V3 SE', '0.4mm', 'auto', 'original', 'tpu-standard-v3-f7819d5f.ini', 3, TRUE, NULL)
ON DUPLICATE KEY UPDATE
  material_id = VALUES(material_id),
  quality = VALUES(quality),
  printer_name = VALUES(printer_name),
  nozzle = VALUES(nozzle),
  support_rule = VALUES(support_rule),
  orientation_rule = VALUES(orientation_rule),
  profile_filename = VALUES(profile_filename),
  version_number = VALUES(version_number),
  is_active = VALUES(is_active),
  uploaded_by = VALUES(uploaded_by);
