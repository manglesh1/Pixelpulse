module.exports = function applyLocationScope(model, req, options = {}) {
  const isAdmin = req.ctx?.role === "admin";
  const locationId = req.ctx?.locationId;

  if (!locationId || isAdmin) return options;

  const hasLocationColumn = !!model.rawAttributes?.LocationID;

  if (hasLocationColumn) {
    options.where = { ...(options.where || {}), LocationID: locationId };
  }

  return options;
};
