const jwt    = require('jsonwebtoken');
const { parse } = require('cookie');
const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(req, res, next) {
  const cookies = parse(req.headers.cookie || '');
  const token   = cookies.adminToken;
  if (!token) return res.status(401).json({ error: 'Token missing' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token invalid or expired' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
