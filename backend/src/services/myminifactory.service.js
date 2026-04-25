import { ApiError } from "../utils/api-error.js";
import {
  getCachedSearchResult,
  setCachedSearchResult,
  getCachedObject,
  setCachedObject,
} from "../utils/mmf-cache.util.js";

const MMF_API_BASE_URL = process.env.MMF_API_BASE_URL;

const MMF_REQUEST_TIMEOUT_MS = Number(process.env.MMF_REQUEST_TIMEOUT_MS);

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
    designer: normalizeDesigner(object.designer),
    publishedAt: object.published_at || null,
    views: object.views ?? null,
    likes: object.likes ?? null,
    featured: Boolean(object.featured),
  };
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

export { searchObjects, getObjectById };
