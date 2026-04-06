import pool from "../db/db.js";
import { ApiError } from "../utils/api-error.js";

async function getCurrentPricingConfig() {
  const sql = "SELECT * FROM pricing_config WHERE id = 1 LIMIT 1";
  const [rows] = await pool.query(sql);
  return rows[0] || null;
}

async function updatePricingConfig(payload) {
  const sql = `
    UPDATE pricing_config
    SET
      material_cost_per_gram = ?,
      machine_hour_rate = ?,
      base_fee = ?,
      waste_factor = ?,
      support_markup_factor = ?,
      electricity_cost_per_kwh = ?,
      power_consumption_watts = ?,
      currency = ?,
      updated_by = ?
    WHERE id = 1
  `;

  const [result] = await pool.query(sql, [
    JSON.stringify(payload.material_cost_per_gram),
    payload.machine_hour_rate,
    payload.base_fee,
    payload.waste_factor,
    payload.support_markup_factor,
    payload.electricity_cost_per_kwh,
    payload.power_consumption_watts,
    payload.currency,
    payload.updated_by,
  ]);

  if (result.affectedRows === 0) {
    throw new ApiError(500, "Pricing config is not initialized");
  }

  return getCurrentPricingConfig();
}

export { getCurrentPricingConfig, updatePricingConfig };
