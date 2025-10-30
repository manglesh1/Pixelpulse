const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const cache = new Map();

function gc() {
  const now = Date.now();
  for (const [k, v] of cache) if (v.expiresAt <= now) cache.delete(k);
}

module.exports = function idempotency() {
  return (req, res, next) => {
    const key = req.headers["idempotency-key"];
    if (!key) return next();

    gc();

    const existing = cache.get(key);
    if (existing && existing.expiresAt > Date.now()) {
      // short-circuit with previous result payload
      return res.status(200).json(existing.value);
    }

    // hook into res.json to capture the first successful result
    const json = res.json.bind(res);
    res.json = (body) => {
      cache.set(key, { value: body, expiresAt: Date.now() + CACHE_TTL_MS });
      return json(body);
    };
    next();
  };
};
