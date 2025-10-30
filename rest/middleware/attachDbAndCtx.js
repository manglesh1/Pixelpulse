const db = require("../models");

/**
 * Attaches Sequelize db and unified context (ctx)
 * Keeps req.ctx automatically in sync with req.auth + req.locationScope
 */
module.exports = function attachDbAndCtx(req, _res, next) {
  req.db = db;

  // ensure ctx exists
  req.ctx = req.ctx || {};

  // helper to rebuild ctx whenever auth changes
  req.buildCtx = () => {
    const a = req.auth || {};
    req.ctx.authType = a.type || null;
    req.ctx.userId = a.userId || null;
    req.ctx.role = a.role || null;
    req.ctx.locationId =
      a.locationId || req.locationScope || req.ctx.locationId || null;
    req.ctx.name = a.name || null;
    req.ctx.email = a.email || null;
    req.ctx.isAdmin = a.role === "admin";
  };

  req.buildCtx();

  next();
};
