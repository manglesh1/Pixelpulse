module.exports = function ensureBelongsToLocation(
  model,
  idField = "id",
  locationField = "LocationID",
  foreignModel = null,
  foreignKey = null
) {
  return async (req, res, next) => {
    try {
      const id = req.params[idField];
      if (!id) return res.status(400).json({ error: "Missing path id" });

      // Admins skip location enforcement
      if (req.ctx?.role === "admin") return next();

      const db = req.db;
      const record = await db[model].findByPk(id, {
        include: foreignModel
          ? [{ model: db[foreignModel], required: true }]
          : [],
      });

      if (!record) return res.status(404).json({ error: "Not found" });

      const userLoc = String(req.ctx.locationId);

      // 1. direct location check
      if (record[locationField] && String(record[locationField]) === userLoc) {
        return next();
      }

      // 2. foreign relation check
      if (
        foreignModel &&
        record[foreignModel] &&
        String(record[foreignModel][locationField]) === userLoc
      ) {
        return next();
      }

      return res.status(403).json({ error: "Cross-location access denied" });
    } catch (err) {
      next(err);
    }
  };
};
