import { apiRequest } from "./client";

function toMaterialPayload(payload) {
  const body = { ...payload };

  if (body.isActive !== undefined) {
    body.isActiveMaterial = String(Boolean(body.isActive));
    delete body.isActive;
  }

  return body;
}

export function getActiveMaterials() {
  return apiRequest("/materials/active");
}

export function getAdminMaterials() {
  return apiRequest("/materials");
}

export function createMaterial(payload) {
  return apiRequest("/materials", {
    method: "POST",
    body: JSON.stringify(toMaterialPayload(payload)),
  });
}

export function updateMaterial(materialKey, payload) {
  return apiRequest(`/materials/${encodeURIComponent(materialKey)}`, {
    method: "PATCH",
    body: JSON.stringify(toMaterialPayload(payload)),
  });
}

export function deactivateMaterial(materialKey) {
  return apiRequest(
    `/materials/${encodeURIComponent(materialKey)}/deactivate`,
    {
      method: "PATCH",
    },
  );
}

export function getSlicerProfiles() {
  return apiRequest("/materials/profiles");
}

export function uploadSlicerProfile(materialKey, payload) {
  const formData = new FormData();

  formData.append("profileFile", payload.profileFile);
  formData.append("quality", payload.quality);

  if (payload.printerName) {
    formData.append("printerName", payload.printerName);
  }

  if (payload.nozzle) {
    formData.append("nozzle", payload.nozzle);
  }

  if (payload.supportRule) {
    formData.append("supportRule", payload.supportRule);
  }

  if (payload.orientationRule) {
    formData.append("orientationRule", payload.orientationRule);
  }

  return apiRequest(`/materials/${encodeURIComponent(materialKey)}/profiles`, {
    method: "POST",
    body: formData,
  });
}
