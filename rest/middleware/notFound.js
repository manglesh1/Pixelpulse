module.exports = function notFound(_req, res, _next) {
  // Don’t leak internal details—just a clear 404 payload.
  // errorHandler will NOT run for 404s (we’re finishing the response here).
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource does not exist.",
    reqId: res.req?.id || null,
    method: res.req?.method,
    path: res.req?.originalUrl || res.req?.url,
  });
};
