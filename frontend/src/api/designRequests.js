import { apiRequest } from "./client";

export function createDesignRequest(formData) {
  return apiRequest("/design-requests", {
    method: "POST",
    body: formData,
  });
}

export function getMyDesignRequests() {
  return apiRequest("/design-requests/mine");
}

export function getMyDesignRequestById(requestId) {
  return apiRequest(`/design-requests/mine/${requestId}`);
}

export function getAdminDesignRequests(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();

  return apiRequest(
    `/design-requests/admin${queryString ? `?${queryString}` : ""}`,
  );
}

export function getAdminDesignRequestById(requestId) {
  return apiRequest(`/design-requests/admin/${requestId}`);
}

export function updateAdminDesignRequestStatus(requestId, payload) {
  return apiRequest(`/design-requests/admin/${requestId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function linkAdminDesignRequestResult(requestId, payload) {
  return apiRequest(`/design-requests/admin/${requestId}/result`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveAdminDesignRequest(requestId) {
  return apiRequest(`/design-requests/admin/${requestId}/archive`, {
    method: "PATCH",
  });
}

export function deleteAdminDesignRequest(requestId) {
  return apiRequest(`/design-requests/admin/${requestId}`, {
    method: "DELETE",
  });
}
