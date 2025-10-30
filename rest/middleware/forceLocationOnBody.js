// middleware/forceLocationOnBody.js
module.exports = function forceLocationOnBody() {
  return async (req, _res, next) => {
    const isWrite = ["POST", "PUT", "PATCH"].includes(req.method);
    const isAdmin = req.ctx?.role === "admin";
    const locationId = req.ctx?.locationId;

    if (!isWrite || isAdmin || !locationId) return next();

    if (!req.body) req.body = {};

    // Primary rule: always override LocationID directly if present
    if ("LocationID" in req.body) {
      req.body.LocationID = locationId;
      return next();
    }

    // For middle tables like GameLocations or LocationVariants
    // we'll infer location from the context or related model keys
    const db = req.db;

    try {
      // Example: If creating a LocationVariant
      if (req.body.GameID && db.Game) {
        const game = await db.Game.findByPk(req.body.GameID, {
          include: db.Location,
        });

        if (game?.LocationID) {
          req.body.LocationID = game.LocationID;
        } else {
          req.body.LocationID = locationId;
        }
      }

      // Example: GameLocations table (many-to-many)
      if (req.body.GameID && !req.body.LocationID) {
        req.body.LocationID = locationId;
      }

      // Future: add any other middle tables here

      next();
    } catch (err) {
      next(err);
    }
  };
};
