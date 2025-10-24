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

    // Always normalize fields here
    req.auth = {
      type: "jwt",
      userId: decoded.id,
      role: decoded.role,
      locationId:
        decoded.locationId || decoded.LocationID || decoded.location_id || null,
      email: decoded.email || null,
    };

    req.user = decoded;
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
    const record = await db.ApiKey.findOne({
      where: { key: apiKey, isActive: true },
    });

    if (!record) {
      return res.status(403).json({ error: "Invalid or inactive API key" });
    }

    req.auth = {
      type: "apikey",
      key: record.key,
      role: "apikey",
      locationId: record.locationId,
      name: record.name,
    };

    next();
  } catch (err) {
    console.error("verifyApiKey error:", err);
    res.status(500).json({ error: "Error verifying API key" });
  }
}

async function verifyAnyAuth(req, res, next) {
  const hasCookieOrBearer =
    req.headers.cookie?.includes("adminToken") ||
    req.headers.authorization?.startsWith("Bearer ");
  const hasApiKey = !!req.headers["x-api-key"];

  try {
    if (hasCookieOrBearer) {
      await verifyToken(req, res, next);
      return;
    }
    if (hasApiKey) {
      await verifyApiKey(req, res, next);
      return;
    }
    return res.status(401).json({ error: "No authentication provided" });
  } catch (err) {
    console.error("verifyAnyAuth error:", err);
    return res.status(403).json({ error: "Authentication failed" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.auth?.role || req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
function restrictToLocation(req, res, next) {
  console.log("restrictToLocation:", req.auth);

  const locationId = req.auth?.locationId;
  const role = req.auth?.role;

  if (!locationId && role !== "admin") {
    return res
      .status(403)
      .json({ error: "No location assigned to this account" });
  }

  if (role === "admin") {
    console.log("Admin detected — no restriction applied");
    return next();
  }

  req.locationScope = locationId;
  console.log("Restricting to location:", req.locationScope);
  next();
}
module.exports = {
  verifyToken,
  verifyApiKey,
  verifyAnyAuth,
  requireRole,
  restrictToLocation,
};
