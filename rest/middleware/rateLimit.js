const buckets = new Map();
// key: `${type}:${id}` -> { tokens, updatedAt }

module.exports = function rateLimit({ capacity = 120, refillPerSec = 1 } = {}) {
  return (req, res, next) => {
    const id =
      (req.auth?.type === "apikey" && req.auth.key) ||
      (req.auth?.type === "jwt" && req.auth.userId) ||
      req.ip;
    const key = `rl:${id}`;

    const now = Date.now();
    let b = buckets.get(key) || { tokens: capacity, updatedAt: now };
    // refill
    const deltaSec = (now - b.updatedAt) / 1000;
    b.tokens = Math.min(capacity, b.tokens + deltaSec * refillPerSec);
    b.updatedAt = now;

    if (b.tokens < 1) {
      buckets.set(key, b);
      return res.status(429).json({ error: "Too Many Requests" });
    }
    b.tokens -= 1;
    buckets.set(key, b);
    next();
  };
};
