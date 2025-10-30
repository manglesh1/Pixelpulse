module.exports = (logger) => (err, req, res, _next) => {
  const durationMs = req.startHr
    ? Number((process.hrtime.bigint() - req.startHr) / 1000000n)
    : null;
  (req.log || logger || console).error(
    { err, reqId: req.id, durationMs },
    "Unhandled error"
  );

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      details:
        err.errors?.map((e) => ({ field: e.path, message: e.message })) || [],
    });
  }
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ error: "Duplicate", details: err.fields });
  }
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Invalid token" });
  }

  res.status(500).json({ error: "Internal Server Error" });
};
