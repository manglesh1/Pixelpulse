const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { AdminUser } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET;

// Login route
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await AdminUser.findOne({ where: { email } });
  if (!user)
    return res.status(401).json({ error: "Invalid email or password" });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match)
    return res.status(401).json({ error: "Invalid email or password" });

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      LocationID: user.LocationID,
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.cookie("adminToken", token, {
    httpOnly: true,
    secure: false, // switch to true when switching https
    sameSite: "strict",
    maxAge: 8 * 60 * 60 * 1000, // 8h
  });

  res.status(200).json({ message: "Login successful" });
};

// Get user info (from token)
exports.getMe = async (req, res) => {
  try {
    const token = req.cookies.adminToken;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await AdminUser.findByPk(decoded.id, {
      attributes: ["id", "email", "role", "LocationID"],
    });

    res.setHeader("Cache-Control", "no-store");
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

exports.register = async (req, res) => {
  const { email, password, role, LocationID } = req.body;

  // Only allow valid roles
  // if (!['user', 'manager', 'admin'].includes(role)) {
  //   return res.status(400).json({ error: 'Invalid role' });
  // }

  const existing = await AdminUser.findOne({ where: { email } });
  if (existing) return res.status(400).json({ error: "Email already in use" });

  const hash = await bcrypt.hash(password, 10);

  const newUser = await AdminUser.create({
    email,
    passwordHash: hash,
    role,
    LocationID,
  });

  res.status(201).json({
    message: "Admin user created",
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      LocationID: newUser.LocationID,
    },
  });
};

exports.logout = (req, res) => {
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: false, // switch to true when switching https
    sameSite: "strict",
  });

  res.status(200).json({ message: "Logged out successfully" });
};
