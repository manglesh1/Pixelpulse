// retryMiddleware.js
const retryWithTimeout = require('../utils/retryWithTimeout');

const retryMiddleware = (requestHandler, retries = 3, timeoutMs = 5000) => {
  return async (req, res, next) => {
    try {
      const result = await retryWithTimeout(() => requestHandler(req, res, next), retries, timeoutMs);

      // Check if headers have already been sent before attempting to send the result
      if (!res.headersSent) {
        res.send(result); // Send the result back to the client if successful
      }
    } catch (error) {
      next(error); // Pass any errors to the next middleware (e.g., error handler)
    }
  };
};

module.exports = retryMiddleware;
