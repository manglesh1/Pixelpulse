module.exports = function pagination(allowedSort = []) {
  return (req, _res, next) => {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.pageSize || "25", 10), 1),
      200
    );
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    let sortBy = req.query.sortBy || allowedSort[0] || null;
    let sortDir = (req.query.sortDir || "DESC").toUpperCase();
    if (!allowedSort.includes(sortBy)) sortBy = allowedSort[0] || null;
    if (!["ASC", "DESC"].includes(sortDir)) sortDir = "DESC";

    req.page = { page, pageSize, offset, limit };
    req.sort = sortBy ? { order: [[sortBy, sortDir]] } : { order: [] };
    next();
  };
};
