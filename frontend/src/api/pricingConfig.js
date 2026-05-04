import { apiRequest } from "./client";

export function getPricingConfig() {
  return apiRequest("/pricing-config");
}

export function updatePricingConfig(payload) {
  return apiRequest("/pricing-config", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
