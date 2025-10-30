// middleware/ensureBelongsToLocationBody.js
module.exports = function ensureBelongsToLocationBody({
  model,
  bodyField = "id",
  locationField = "LocationID",
  asForeignKey = false,
}) {
  return async (req, res, next) => {
    try {
      const id = req.body[bodyField];

      if (!id) return res.status(400).json({ error: "Missing body id" });
      if (req.ctx?.role === "admin") return next();

      const db = req.db;
      const record = await db[model].findByPk(id);
      if (!record) return res.status(404).json({ error: "Not found" });

      const userLoc = String(req.ctx.locationId);
      const recordLoc = asForeignKey
        ? String(record[locationField])
        : String(record[locationField]);

      if (recordLoc !== userLoc)
        return res.status(403).json({ error: "Cross-location access denied" });

      next();
    } catch (err) {
      console.error("ensureBelongsToLocationBody error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};
