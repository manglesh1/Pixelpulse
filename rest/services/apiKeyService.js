let cachedByKey = new Map();
let lastLoadedAt = null;

async function loadApiKeys(db, logger) {
  if (!db?.ApiKey) {
    throw new Error("db.ApiKey is not registered in ./models/index.js");
  }

  const rows = await db.ApiKey.findAll({
    where: { isActive: true },
    attributes: ["key", "name", "locationId"],
    raw: true,
  });

  const next = new Map();
  for (const r of rows) {
    if (r.key) next.set(r.key, r);
  }
  cachedByKey = next;
  lastLoadedAt = new Date();

  logger?.info?.(`Loaded ${cachedByKey.size} active API key(s) from database`);
  return cachedByKey.size;
}

function getApiKeyRecord(key) {
  if (!key) return null;
  return cachedByKey.get(key) || null;
}

function getApiKeyMeta() {
  return {
    count: cachedByKey.size,
    lastLoadedAt,
  };
}

module.exports = {
  loadApiKeys,
  getApiKeyRecord,
  getApiKeyMeta,
};
