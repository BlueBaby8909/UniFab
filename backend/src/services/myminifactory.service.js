import { ApiError } from "../utils/api-error.js";
import {
  getCachedSearchResult,
  setCachedSearchResult,
  getCachedObject,
  setCachedObject,
} from "../utils/mmf-cache.util.js";

const MMF_API_BASE_URL = process.env.MMF_API_BASE_URL;

const MMF_REQUEST_TIMEOUT_MS = Number(process.env.MMF_REQUEST_TIMEOUT_MS);
const MAX_MMF_FILE_DOWNLOAD_BYTES = 50 * 1024 * 1024;
const SUPPORTED_MMF_MODEL_EXTENSIONS = new Set([".stl", ".obj", ".3mf"]);

function getApiKey() {
  const apiKey = process.env.MMF_API_KEY;

  if (!apiKey) {
    throw new ApiError(500, "MyMiniFactory API key is not configured");
  }

  return apiKey;
}

function buildMmfUrl(pathname, queryParams = {}) {
  const url = new URL(`${MMF_API_BASE_URL}${pathname}`);

  url.searchParams.set("key", getApiKey());

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    clear() {
      clearTimeout(timeout);
    },
  };
}

async function fetchMmfJson(url) {
  const { signal, clear } = createTimeoutSignal(MMF_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    });

    const data = await parseJsonSafely(response);

    if (!response.ok) {
      const message =
        data?.message || data?.error || "MyMiniFactory request failed";

      throw new ApiError(response.status || 502, message);
    }

    if (!data) {
      throw new ApiError(
        502,
        "MyMiniFactory returned an invalid JSON response",
      );
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new ApiError(504, "MyMiniFactory request timed out");
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, "Unable to reach MyMiniFactory");
  } finally {
    clear();
  }
}

function normalizeDesigner(designer) {
  if (!designer) {
    return null;
  }

  return {
    username: designer.username || null,
    name: designer.name || null,
    profileUrl: designer.profile_url || null,
    avatarUrl: designer.avatar_url || null,
  };
}

function normalizeImage(image) {
  if (!image) {
    return null;
  }

  return {
    id: image.id || null,
    isPrimary: Boolean(image.is_primary),
    originalUrl: image.original?.url || null,
    thumbnailUrl: image.thumbnail?.url || null,
    standardUrl: image.standard?.url || null,
  };
}

function getFirstText(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return null;
}

function getPathExtension(value) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(String(value));
    const pathname = url.pathname.toLowerCase();
    const match = pathname.match(/\.[a-z0-9]+$/);
    return match?.[0] || null;
  } catch {
    const match = String(value).toLowerCase().match(/\.[a-z0-9]+$/);
    return match?.[0] || null;
  }
}

function normalizeMmfFile(file) {
  if (!file || typeof file !== "object") {
    return null;
  }

  const downloadUrl = getFirstText(
    file.download_url,
    file.downloadUrl,
    file.file_url,
    file.fileUrl,
    file.direct_url,
    file.directUrl,
    file.archive_url,
    file.archiveUrl,
    file.url,
    file.download?.url,
    file.file?.url,
    file.model?.url,
  );

  const name = getFirstText(
    file.name,
    file.filename,
    file.file_name,
    file.original_filename,
    file.title,
    downloadUrl,
  );

  const extension = getPathExtension(name) || getPathExtension(downloadUrl);

  return {
    id: file.id || file.file_id || null,
    name,
    extension,
    downloadUrl,
    size: file.size || file.filesize || file.file_size || null,
    mimeType: file.mime_type || file.mimeType || file.content_type || null,
  };
}

function collectMmfFiles(object) {
  const candidateGroups = [
    object?.files,
    object?.model_files,
    object?.modelFiles,
    object?.models,
    object?.download_files,
    object?.downloadFiles,
    object?.downloads,
  ];

  const normalizedFiles = [];

  for (const group of candidateGroups) {
    const files = Array.isArray(group) ? group : group?.items;

    if (!Array.isArray(files)) {
      continue;
    }

    for (const file of files) {
      const normalizedFile = normalizeMmfFile(file);

      if (normalizedFile?.downloadUrl) {
        normalizedFiles.push(normalizedFile);
      }
    }
  }

  const seenKeys = new Set();

  return normalizedFiles.filter((file) => {
    const key = [file.id, file.name, file.downloadUrl].filter(Boolean).join(":");

    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function normalizeCategory(category) {
  if (!category) {
    return null;
  }

  return {
    id: category.id || null,
    name: category.name || null,
    slug: category.slug || null,
    url: category.url || null,
  };
}

function normalizeLicenseFlag(licenseFlag) {
  if (!licenseFlag) {
    return null;
  }

  return {
    type: licenseFlag.type || null,
    value: typeof licenseFlag.value === "boolean" ? licenseFlag.value : null,
  };
}

function normalizeObject(object) {
  if (!object) {
    return null;
  }

  return {
    id: object.id || null,
    source: "myminifactory",
    url: object.url || null,
    name: object.name || null,
    description: object.description || null,
    descriptionHtml: object.description_html || null,
    printingDetails: object.printing_details || null,
    printingDetailsHtml: object.printing_details_html || null,
    dimensions: object.dimensions || null,
    materialQuantity: object.material_quantity || null,
    license: object.license || null,
    licenses: Array.isArray(object.licenses)
      ? object.licenses.map(normalizeLicenseFlag).filter(Boolean)
      : [],
    tags: Array.isArray(object.tags) ? object.tags : [],
    categories: Array.isArray(object.categories)
      ? object.categories.map(normalizeCategory).filter(Boolean)
      : [],
    images: Array.isArray(object.images)
      ? object.images.map(normalizeImage).filter(Boolean)
      : [],
    files: collectMmfFiles(object),
    designer: normalizeDesigner(object.designer),
    publishedAt: object.published_at || null,
    views: object.views ?? null,
    likes: object.likes ?? null,
    featured: Boolean(object.featured),
  };
}

function selectPreferredPrintableMmfFile(files = []) {
  const supportedFiles = files.filter(
    (file) =>
      file?.downloadUrl && SUPPORTED_MMF_MODEL_EXTENSIONS.has(file.extension),
  );

  const extensionPriority = new Map([
    [".3mf", 0],
    [".stl", 1],
    [".obj", 2],
  ]);

  return (
    supportedFiles.sort((a, b) => {
      const aPriority = extensionPriority.get(a.extension) ?? 99;
      const bPriority = extensionPriority.get(b.extension) ?? 99;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return String(a.name || "").localeCompare(String(b.name || ""));
    })[0] || null
  );
}

function buildDownloadUrl(file) {
  const url = new URL(file.downloadUrl);
  const apiBaseUrl = new URL(MMF_API_BASE_URL);

  if (url.hostname === apiBaseUrl.hostname && !url.searchParams.has("key")) {
    url.searchParams.set("key", getApiKey());
  }

  return url;
}

async function downloadMmfFile(file) {
  if (!file?.downloadUrl) {
    throw new ApiError(400, "MyMiniFactory file does not include a download URL");
  }

  const declaredSize = Number(file.size || 0);

  if (declaredSize > MAX_MMF_FILE_DOWNLOAD_BYTES) {
    throw new ApiError(
      400,
      "MyMiniFactory file is larger than the supported 50 MB limit",
    );
  }

  const { signal, clear } = createTimeoutSignal(MMF_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildDownloadUrl(file), {
      method: "GET",
      headers: {
        Accept: "application/octet-stream",
      },
      signal,
    });

    if (!response.ok) {
      throw new ApiError(
        response.status || 502,
        "Unable to download printable file from MyMiniFactory",
      );
    }

    const contentLength = Number(response.headers.get("content-length") || 0);

    if (contentLength > MAX_MMF_FILE_DOWNLOAD_BYTES) {
      throw new ApiError(
        400,
        "MyMiniFactory file is larger than the supported 50 MB limit",
      );
    }

    const fileBuffer = Buffer.from(await response.arrayBuffer());

    if (fileBuffer.byteLength > MAX_MMF_FILE_DOWNLOAD_BYTES) {
      throw new ApiError(
        400,
        "MyMiniFactory file is larger than the supported 50 MB limit",
      );
    }

    return fileBuffer;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new ApiError(504, "MyMiniFactory file download timed out");
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, "Unable to download printable file from MyMiniFactory");
  } finally {
    clear();
  }
}

async function searchObjects({ q, page, per_page, sort, order }) {
  const cacheParams = {
    q,
    page,
    per_page,
    sort,
    order,
  };

  const cachedResult = getCachedSearchResult(cacheParams);

  if (cachedResult) {
    return cachedResult;
  }

  const url = buildMmfUrl("/search", cacheParams);
  const data = await fetchMmfJson(url);

  const normalizedResult = {
    totalCount: Number(data?.total_count || 0),
    items: Array.isArray(data?.items)
      ? data.items.map(normalizeObject).filter(Boolean)
      : [],
  };

  return setCachedSearchResult(cacheParams, normalizedResult);
}

async function getObjectById(objectId) {
  const cachedObject = getCachedObject(objectId);

  if (cachedObject) {
    return cachedObject;
  }

  const url = buildMmfUrl(`/objects/${objectId}`);
  const data = await fetchMmfJson(url);

  const normalizedObject = normalizeObject(data);

  return setCachedObject(objectId, normalizedObject);
}

async function getObjectFilesById(objectId) {
  try {
    const url = buildMmfUrl(`/objects/${objectId}/files`);
    const data = await fetchMmfJson(url);
    const files = Array.isArray(data) ? data : data?.items || data?.files || [];

    return collectMmfFiles({ files });
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return [];
    }

    throw error;
  }
}

export {
  searchObjects,
  getObjectById,
  getObjectFilesById,
  selectPreferredPrintableMmfFile,
  downloadMmfFile,
  SUPPORTED_MMF_MODEL_EXTENSIONS,
};
