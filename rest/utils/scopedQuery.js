const applyLocationScope = require("../middleware/locationScope");

exports.scopedFindAll = (req, model, opts = {}) =>
  model.findAll(applyLocationScope(model, req, opts));

exports.scopedFindOne = (req, model, opts = {}) =>
  model.findOne(applyLocationScope(model, req, opts));

exports.scopedCount = (req, model, opts = {}) =>
  model.count(applyLocationScope(model, req, opts));
