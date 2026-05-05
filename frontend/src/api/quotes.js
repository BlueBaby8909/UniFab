import { apiRequest } from "./client";

export function calculateUploadQuote(formData) {
  return apiRequest("/quotes/calculate", {
    method: "POST",
    body: formData,
  });
}

export function getQuoteByToken(quoteToken) {
  return apiRequest(`/quotes/${quoteToken}`);
}

export function calculateLocalDesignQuote(designId, payload) {
  return apiRequest(`/quotes/local-designs/${designId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function calculateDesignRequestQuote(requestId, payload) {
  return apiRequest(`/quotes/design-requests/${requestId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function calculateMmfDesignQuote(objectId, payload) {
  return apiRequest(`/quotes/mmf/${objectId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function cleanupExpiredQuotes(limit = 100) {
  return apiRequest(`/quotes/expired?limit=${encodeURIComponent(limit)}`, {
    method: "DELETE",
  });
}
