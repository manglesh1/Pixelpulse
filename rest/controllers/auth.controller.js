const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const logger = require("../utils/logger");

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = "8h";

function makeTokenPayload(user) {
  return {
    type: "jwt",
    userId: user.id,
    email: user.email,
    role: user.role,
    locationId: user.LocationID ?? null,
  };
}

function setAuthCookie(res, token, req) {
  const isProd = process.env.NODE_ENV === "production";
  // if behind a proxy/https, set secure=true — tweak as needed
  const secure = isProd; // or: !!req.secure
  res.cookie("adminToken", token, {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    maxAge: 8 * 60 * 60 * 1000, // 8h
  });
}

module.exports = {
  // POST /auth/login
  login: async (req, res) => {
    const db = req.db;
    const AdminUser = db.AdminUser;

    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "email and password are required" });
      }

      const user = await AdminUser.findOne({ where: { email } });
      if (!user)
        return res.status(401).json({ error: "Invalid email or password" });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok)
        return res.status(401).json({ error: "Invalid email or password" });

      const payload = makeTokenPayload(user);
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });

      setAuthCookie(res, token, req);

      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        message: "Login successful",
        token, // handy for API clients
        user: payload, // normalized user info
      });
    } catch (err) {
      logger.error("auth.login error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // GET /auth/me
  getMe: async (req, res) => {
    const db = req.db;
    const AdminUser = db.AdminUser;

    try {
      const token =
        req.cookies?.adminToken ||
        req.headers.authorization?.replace(/^Bearer\s+/i, "");
      if (!token) return res.status(401).json({ error: "No token provided" });

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch {
        return res.status(401).json({ error: "Invalid token" });
      }

      const user = await AdminUser.findByPk(decoded.userId, {
        attributes: ["id", "email", "role", "LocationID"],
      });
      if (!user) return res.status(401).json({ error: "Invalid token" });

      res.setHeader("Cache-Control", "no-store");
      return res.json({
        userId: user.id,
        email: user.email,
        role: user.role,
        locationId: user.LocationID ?? null,
        authType: "jwt",
      });
    } catch (err) {
      logger.error("auth.getMe error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // POST /auth/register (admin)
  register: async (req, res) => {
    const db = req.db;
    const AdminUser = db.AdminUser;

    try {
      // Only admins can create accounts
      if (req.ctx?.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const {
        email,
        password,
        role = "user",
        LocationID = null,
      } = req.body || {};
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "email and password are required" });
      }
      if (!["user", "manager", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const existing = await AdminUser.findOne({ where: { email } });
      if (existing)
        return res.status(400).json({ error: "Email already in use" });

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await AdminUser.create({
        email,
        passwordHash,
        role,
        LocationID, // admin can set null (global) or a specific location
      });

      return res.status(201).json({
        message: "Admin user created",
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          locationId: newUser.LocationID ?? null,
        },
      });
    } catch (err) {
      logger.error("auth.register error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // POST /auth/logout
  logout: (req, res) => {
    const isProd = process.env.NODE_ENV === "production";
    const secure = isProd; // or: !!req.secure
    res.clearCookie("adminToken", {
      httpOnly: true,
      secure,
      sameSite: secure ? "none" : "lax",
    });
    return res.status(200).json({ message: "Logged out successfully" });
  },
};
