import { API_BASE_URL, apiRequest } from "./client";

export function submitPrintRequestFromQuote(quoteToken, payload = {}) {
  return apiRequest("/requests", {
    method: "POST",
    body: JSON.stringify({
      quoteToken,
      ...payload,
    }),
  });
}

export function getMyPrintRequests() {
  return apiRequest("/requests");
}

export function getPrintRequestById(requestId) {
  return apiRequest(`/requests/${requestId}`);
}

export function uploadPrintRequestReceipt(requestId, formData) {
  return apiRequest(`/requests/${requestId}/receipt`, {
    method: "POST",
    body: formData,
  });
}

export function getAdminPrintRequests(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();

  return apiRequest(`/requests/admin${queryString ? `?${queryString}` : ""}`);
}

export function updateAdminPrintRequestStatus(requestId, payload) {
  return apiRequest(`/requests/admin/${requestId}/status`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function uploadAdminPaymentSlip(requestId, formData) {
  return apiRequest(`/requests/admin/${requestId}/payment-slip`, {
    method: "POST",
    body: formData,
  });
}

export function archiveAdminPrintRequest(requestId) {
  return apiRequest(`/requests/admin/${requestId}/archive`, {
    method: "PATCH",
  });
}

export function deleteAdminPrintRequest(requestId) {
  return apiRequest(`/requests/admin/${requestId}`, {
    method: "DELETE",
  });
}

export function getPrintRequestReceiptUrl(requestId) {
  return `${API_BASE_URL}/requests/${requestId}/receipt`;
}
