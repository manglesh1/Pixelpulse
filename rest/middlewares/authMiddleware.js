const jwt = require("jsonwebtoken");
const { parse } = require("cookie");
const db = require("../models");
const JWT_SECRET = process.env.JWT_SECRET;

async function verifyToken(req, res, next) {
  try {
    const cookies = parse(req.headers.cookie || "");
    const token =
      cookies.adminToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;
    req.auth = {
      type: "jwt",
      userId: decoded.id,
      role: decoded.role,
      locationId: decoded.LocationID || decoded.locationId || null,
    };

    next();
  } catch (err) {
    console.error("verifyToken error:", err.message);
    return res.status(403).json({ error: "Token invalid or expired" });
  }
}

async function verifyApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) return res.status(401).json({ error: "API key missing" });

  try {
    const ApiKey = db.ApiKey;
    const record = await ApiKey.findOne({
      where: { key: apiKey, isActive: true },
    });

    if (!record) {
      return res.status(403).json({ error: "Invalid or inactive API key" });
    }

    req.apiClient = {
      key: record.key,
      locationId: record.locationId,
      name: record.name,
    };

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error verifying API key" });
  }
}

async function verifyAnyAuth(req, res, next) {
  const hasCookieOrBearer =
    req.headers.cookie?.includes("adminToken") ||
    req.headers.authorization?.startsWith("Bearer ");
  const hasApiKey = !!req.headers["x-api-key"];

  if (hasCookieOrBearer) return verifyToken(req, res, next);
  if (hasApiKey) return verifyApiKey(req, res, next);

  return res.status(401).json({ error: "No authentication provided" });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

function restrictToOwnLocation(req, res, next) {
  if (req.auth?.role === "admin") return next();

  req.restrictToLocation = req.auth.locationId;
  next();
}

module.exports = {
  verifyToken,
  verifyApiKey,
  verifyAnyAuth,
  requireRole,
};
