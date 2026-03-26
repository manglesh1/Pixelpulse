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
  const secure = isProd;

  res.cookie("adminToken", token, {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

module.exports = {
  // POST /login
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

      const user = await AdminUser.findOne({
        where: { email: normalizeEmail(email) },
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const payload = makeTokenPayload(user);
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });

      setAuthCookie(res, token, req);

      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        message: "Login successful",
        token,
        user: payload,
      });
    } catch (err) {
      logger.error("auth.login error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // GET /me
  getMe: async (req, res) => {
    const db = req.db;
    const AdminUser = db.AdminUser;

    try {
      const token =
        req.cookies?.adminToken ||
        req.headers.authorization?.replace(/^Bearer\s+/i, "");

      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch {
        return res.status(401).json({ error: "Invalid token" });
      }

      const user = await AdminUser.findByPk(decoded.userId, {
        attributes: ["id", "email", "role", "LocationID"],
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid token" });
      }

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

  // POST /register
  register: async (req, res) => {
    const db = req.db;
    const AdminUser = db.AdminUser;

    try {
      if (req.ctx?.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const {
        email,
        password,
        role = "user",
        LocationID = null,
      } = req.body || {};

      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail || !password) {
        return res
          .status(400)
          .json({ error: "email and password are required" });
      }

      if (!["user", "manager", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const existing = await AdminUser.findOne({
        where: { email: normalizedEmail },
      });

      if (existing) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await AdminUser.create({
        email: normalizedEmail,
        passwordHash,
        role,
        LocationID,
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

  // GET /admin-users
  listUsers: async (req, res) => {
    const db = req.db;
    const AdminUser = db.AdminUser;

    try {
      if (req.ctx?.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const rows = await AdminUser.findAll({
        attributes: [
          "id",
          "email",
          "role",
          "LocationID",
          "createdAt",
          "updatedAt",
        ],
        order: [["email", "ASC"]],
      });

      return res.status(200).json(rows);
    } catch (err) {
      logger.error("auth.listUsers error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // GET /admin-users/:id
  getUserById: async (req, res) => {
    const db = req.db;
    const AdminUser = db.AdminUser;

    try {
      if (req.ctx?.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const row = await AdminUser.findByPk(req.params.id, {
        attributes: [
          "id",
          "email",
          "role",
          "LocationID",
          "createdAt",
          "updatedAt",
        ],
      });

      if (!row) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json(row);
    } catch (err) {
      logger.error("auth.getUserById error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // PUT /admin-users/:id
  updateUser: async (req, res) => {
    const db = req.db;
    const AdminUser = db.AdminUser;

    try {
      if (req.ctx?.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const row = await AdminUser.findByPk(req.params.id);

      if (!row) {
        return res.status(404).json({ error: "User not found" });
      }

      const { email, role, LocationID } = req.body || {};

      if (email !== undefined) {
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) {
          return res.status(400).json({ error: "email cannot be empty" });
        }

        const existing = await AdminUser.findOne({
          where: { email: normalizedEmail },
        });

        if (existing && Number(existing.id) !== Number(row.id)) {
          return res.status(400).json({ error: "Email already in use" });
        }

        row.email = normalizedEmail;
      }

      if (role !== undefined) {
        if (!["user", "manager", "admin"].includes(role)) {
          return res.status(400).json({ error: "Invalid role" });
        }
        row.role = role;
      }

      if (LocationID !== undefined) {
        row.LocationID = LocationID ?? null;
      }

      await row.save();

      return res.status(200).json({
        message: "User updated successfully",
        user: {
          id: row.id,
          email: row.email,
          role: row.role,
          locationId: row.LocationID ?? null,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
      });
    } catch (err) {
      logger.error("auth.updateUser error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // PUT /admin-users/:id/password
  changePassword: async (req, res) => {
    const db = req.db;
    const AdminUser = db.AdminUser;

    try {
      if (req.ctx?.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const row = await AdminUser.findByPk(req.params.id);

      if (!row) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password } = req.body || {};

      if (!password || String(password).trim().length < 6) {
        return res
          .status(400)
          .json({ error: "password must be at least 6 characters" });
      }

      row.passwordHash = await bcrypt.hash(String(password), 10);
      await row.save();

      return res.status(200).json({
        message: "Password updated successfully",
      });
    } catch (err) {
      logger.error("auth.changePassword error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // DELETE /admin-users/:id
  deleteUser: async (req, res) => {
    const db = req.db;
    const AdminUser = db.AdminUser;

    try {
      if (req.ctx?.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const row = await AdminUser.findByPk(req.params.id);

      if (!row) {
        return res.status(404).json({ error: "User not found" });
      }

      if (Number(row.id) === Number(req.ctx?.userId)) {
        return res
          .status(400)
          .json({ error: "You cannot delete your own account" });
      }

      await row.destroy();

      return res.status(200).json({
        message: "User deleted successfully",
      });
    } catch (err) {
      logger.error("auth.deleteUser error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // POST /logout
  logout: (req, res) => {
    const isProd = process.env.NODE_ENV === "production";
    const secure = isProd;

    res.clearCookie("adminToken", {
      httpOnly: true,
      secure,
      sameSite: secure ? "none" : "lax",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  },
};
