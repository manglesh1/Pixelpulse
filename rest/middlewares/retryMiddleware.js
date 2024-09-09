// retryMiddleware.js (middleware file)
const retryWithTimeout = require('../utils/retryWithTimeout');

const retryMiddleware = (requestHandler, retries = 3, timeoutMs = 5000) => {
  return async (req, res, next) => {
    try {
      const result = await retryWithTimeout(() => requestHandler(req, res, next), retries, timeoutMs);
      res.send(result); // Send the result back to the client if successful
    } catch (error) {
      next(error); // Pass any errors to the next middleware (e.g., error handler)
    }
  };
};

module.exports = retryMiddleware;
