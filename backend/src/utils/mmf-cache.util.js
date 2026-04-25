const MMF_SEARCH_CACHE_TTL_MS = Number(
  process.env.MMF_SEARCH_CACHE_TTL_MS || 5 * 60 * 1000,
);

const MMF_OBJECT_CACHE_TTL_MS = Number(
  process.env.MMF_OBJECT_CACHE_TTL_MS || 10 * 60 * 1000,
);

const MMF_SEARCH_CACHE_MAX_ENTRIES = Number(
  process.env.MMF_SEARCH_CACHE_MAX_ENTRIES,
);

const MMF_OBJECT_CACHE_MAX_ENTRIES = Number(
  process.env.MMF_OBJECT_CACHE_MAX_ENTRIES,
);

const searchCache = new Map();
const objectCache = new Map();

function isExpired(entry) {
  if (!entry) {
    return true;
  }

  return entry.expiresAt <= Date.now();
}

function buildStableKey(payload) {
  return JSON.stringify(payload);
}

function deleteExpiredEntries(cache) {
  for (const [key, entry] of cache.entries()) {
    if (isExpired(entry)) {
      cache.delete(key);
    }
  }
}

function evictOldestEntries(cache, maxEntries) {
  while (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value;

    if (oldestKey === undefined) {
      break;
    }

    cache.delete(oldestKey);
  }
}

function getFromCache(cache, key) {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (isExpired(entry)) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function setInCache(cache, key, value, ttlMs, maxEntries) {
  deleteExpiredEntries(cache);

  if (cache.has(key)) {
    cache.delete(key);
  }

  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });

  evictOldestEntries(cache, maxEntries);

  return value;
}

function getCachedSearchResult(params) {
  const key = buildStableKey(params);
  return getFromCache(searchCache, key);
}

function setCachedSearchResult(params, value) {
  const key = buildStableKey(params);
  return setInCache(
    searchCache,
    key,
    value,
    MMF_SEARCH_CACHE_TTL_MS,
    MMF_SEARCH_CACHE_MAX_ENTRIES,
  );
}

function getCachedObject(objectId) {
  const key = String(objectId);
  return getFromCache(objectCache, key);
}

function setCachedObject(objectId, value) {
  const key = String(objectId);
  return setInCache(
    objectCache,
    key,
    value,
    MMF_OBJECT_CACHE_TTL_MS,
    MMF_OBJECT_CACHE_MAX_ENTRIES,
  );
}

function clearMmfSearchCache() {
  searchCache.clear();
}

function clearMmfObjectCache() {
  objectCache.clear();
}

function clearAllMmfCache() {
  clearMmfSearchCache();
  clearMmfObjectCache();
}

export {
  getCachedSearchResult,
  setCachedSearchResult,
  getCachedObject,
  setCachedObject,
  clearMmfSearchCache,
  clearMmfObjectCache,
  clearAllMmfCache,
};
