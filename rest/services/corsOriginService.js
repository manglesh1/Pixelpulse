let cachedOrigins = new Set();
let lastLoadedAt = null;

function normalizeOrigin(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "");
}

async function loadCorsOrigins(db, logger) {
  if (!db?.CorsOrigin) {
    throw new Error("db.CorsOrigin is not registered in ./models/index.js");
  }

  const rows = await db.CorsOrigin.findAll({
    where: { isActive: true },
    attributes: ["origin"],
    raw: true,
  });

  cachedOrigins = new Set(
    rows.map((r) => normalizeOrigin(r.origin)).filter(Boolean),
  );

  lastLoadedAt = new Date();

  logger?.info?.(
    `Loaded ${cachedOrigins.size} allowed CORS origin(s) from database`,
  );

  return Array.from(cachedOrigins);
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  return cachedOrigins.has(normalizeOrigin(origin));
}

function getCachedOrigins() {
  return Array.from(cachedOrigins);
}

function getCorsMeta() {
  return {
    count: cachedOrigins.size,
    lastLoadedAt,
  };
}

module.exports = {
  loadCorsOrigins,
  isOriginAllowed,
  getCachedOrigins,
  getCorsMeta,
};
