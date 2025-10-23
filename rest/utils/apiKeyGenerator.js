const crypto = require('crypto');

function generateApiKey(prefix = 'sk_') {
  // 64 hex chars = 32 bytes of random data
  return prefix + crypto.randomBytes(32).toString('hex');
}

module.exports = { generateApiKey };