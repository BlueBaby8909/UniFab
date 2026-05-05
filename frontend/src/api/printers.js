import { apiRequest } from "./client";

export function getPublicPrinters() {
  return apiRequest("/printers");
}

export function getAdminPrinters() {
  return apiRequest("/printers/admin");
}

export function createAdminPrinter(payload) {
  return apiRequest("/printers/admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminPrinter(printerId, payload) {
  return apiRequest(`/printers/admin/${printerId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminPrinter(printerId) {
  return apiRequest(`/printers/admin/${printerId}`, {
    method: "DELETE",
  });
}
