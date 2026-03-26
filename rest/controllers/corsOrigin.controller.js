const logger = require("../utils/logger");
const { loadCorsOrigins } = require("../services/corsOriginService");

function normalizeOrigin(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "");
}

exports.findAll = async (req, res) => {
  const rows = await req.db.CorsOrigin.findAll({
    order: [["origin", "ASC"]],
  });

  return res.status(200).json(rows);
};

exports.findOne = async (req, res) => {
  const { id } = req.params;

  const row = await req.db.CorsOrigin.findByPk(id);

  if (!row) {
    return res.status(404).json({ message: "CORS origin not found" });
  }

  return res.status(200).json(row);
};

exports.create = async (req, res) => {
  const origin = normalizeOrigin(req.body.origin);
  const isActive =
    req.body.isActive === undefined ? true : Boolean(req.body.isActive);
  const description = req.body.description?.trim() || null;

  if (!origin) {
    return res.status(400).json({ message: "origin is required" });
  }

  const existing = await req.db.CorsOrigin.findOne({
    where: { origin },
  });

  if (existing) {
    return res.status(409).json({ message: "Origin already exists" });
  }

  const created = await req.db.CorsOrigin.create({
    origin,
    isActive,
    description,
  });

  await loadCorsOrigins(req.db, logger);

  return res.status(201).json(created);
};

exports.update = async (req, res) => {
  const { id } = req.params;

  const row = await req.db.CorsOrigin.findByPk(id);

  if (!row) {
    return res.status(404).json({ message: "CORS origin not found" });
  }

  if (req.body.origin !== undefined) {
    const normalized = normalizeOrigin(req.body.origin);

    if (!normalized) {
      return res.status(400).json({ message: "origin cannot be empty" });
    }

    const duplicate = await req.db.CorsOrigin.findOne({
      where: { origin: normalized },
    });

    if (duplicate && Number(duplicate.id) !== Number(row.id)) {
      return res.status(409).json({ message: "Origin already exists" });
    }

    row.origin = normalized;
  }

  if (req.body.isActive !== undefined) {
    row.isActive = Boolean(req.body.isActive);
  }

  if (req.body.description !== undefined) {
    row.description = req.body.description?.trim() || null;
  }

  await row.save();
  await loadCorsOrigins(req.db, logger);

  return res.status(200).json(row);
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  const row = await req.db.CorsOrigin.findByPk(id);

  if (!row) {
    return res.status(404).json({ message: "CORS origin not found" });
  }

  await row.destroy();
  await loadCorsOrigins(req.db, logger);

  return res.status(200).json({ success: true });
};

exports.reload = async (req, res) => {
  await loadCorsOrigins(req.db, logger);

  return res.status(200).json({
    success: true,
    message: "CORS origins cache reloaded",
  });
};
