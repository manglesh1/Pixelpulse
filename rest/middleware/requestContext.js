const { randomUUID } = require("crypto");

module.exports = function requestContext(logger) {
  return (req, _res, next) => {
    req.id = req.headers["x-request-id"] || randomUUID();
    req.startHr = process.hrtime.bigint();
    req.log = logger.child ? logger.child({ reqId: req.id }) : logger;
    next();
  };
};
