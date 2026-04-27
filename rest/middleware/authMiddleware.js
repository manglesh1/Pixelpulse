// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const { parse } = require("cookie");
const db = require("../models");
const { getApiKeyRecord } = require("../services/apiKeyService");

const JWT_SECRET = process.env.JWT_SECRET;

// ---------------------------------------------------------------------------
// 🔒 Verify JWT Token (from cookie or Bearer header)
// ---------------------------------------------------------------------------
async function verifyToken(req, res, next) {
  try {
    const cookies = parse(req.headers.cookie || "");
    const token =
      cookies.adminToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const decoded = jwt.verify(token, JWT_SECRET, { clockTolerance: 5 });

    req.auth = {
      type: "jwt",
      userId: decoded.id,
      role: decoded.role,
      locationId:
        decoded.locationId || decoded.LocationID || decoded.location_id || null,
      email: decoded.email || null,
    };

    req.user = decoded;

    // ✅ Ensure consistent location scope for non-admin users
    if (req.auth.role !== "admin" && req.auth.locationId) {
      req.locationScope = req.auth.locationId;
    }

    // ✅ Build context if available
    if (typeof req.buildCtx === "function") req.buildCtx();

    next();
  } catch (err) {
    console.error("verifyToken error:", err.message);
    return res.status(403).json({ error: "Token invalid or expired" });
  }
}

// ---------------------------------------------------------------------------
// 🔑 Verify API Key (from x-api-key header)
// ---------------------------------------------------------------------------
function verifyApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) return res.status(401).json({ error: "API key missing" });

  const record = getApiKeyRecord(apiKey);
  if (!record) {
    return res.status(403).json({ error: "Invalid or inactive API key" });
  }

  // Attach auth info
  req.auth = {
    type: "apikey",
    key: record.key,
    role: "apikey",
    locationId: record.locationId,
    name: record.name,
  };

  // ✅ Set location scope for downstream filtering
  req.locationScope = record.locationId;

  // ✅ Rebuild ctx if available
  if (typeof req.buildCtx === "function") req.buildCtx();

  next();
}

// ---------------------------------------------------------------------------
// Allow either JWT or API Key
// ---------------------------------------------------------------------------
async function verifyAnyAuth(req, res, next) {
  req.auth = null;
  const hasCookieOrBearer =
    (req.headers.cookie && req.headers.cookie.includes("adminToken")) ||
    (req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer "));
  const hasApiKey = !!req.headers["x-api-key"];

  if (hasApiKey) return verifyApiKey(req, res, next);
  if (hasCookieOrBearer) return verifyToken(req, res, next);

  return res.status(401).json({ error: "No authentication provided" });
}

// ---------------------------------------------------------------------------
// 🧍 Restrict route to certain roles
// ---------------------------------------------------------------------------
function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.auth?.role || req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// 📍 Restrict access to assigned location (unless admin)
// ---------------------------------------------------------------------------
function restrictToLocation(req, res, next) {
  const role = req.auth?.role;
  const locationId =
    req.locationScope || req.auth?.locationId || req.ctx?.locationId || null;

  if (!locationId && role !== "admin") {
    return res
      .status(403)
      .json({ error: "No location assigned to this account" });
  }

  if (role !== "admin") {
    req.locationScope = locationId;
  }

  if (typeof req.buildCtx === "function") req.buildCtx();

  next();
}

module.exports = {
  verifyToken,
  verifyApiKey,
  verifyAnyAuth,
  requireRole,
  restrictToLocation,
};
