const db = require('../database');
const crypto = require('crypto');

// In-memory active tokens map: token -> { createdAt, expiresAt }
const activeTokens = new Map();

function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
  activeTokens.set(token, { createdAt: now, expiresAt });
  return { token, expiresAt };
}

function verifyToken(token) {
  if (!token) return false;
  const session = activeTokens.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeTokens.delete(token);
    return false;
  }
  return true;
}

function authMiddleware(req, res, next) {
  // Allow public paths through
  if (
    req.path.startsWith('/api/public') ||
    req.path.startsWith('/api/auth/login') ||
    !req.path.startsWith('/api')
  ) {
    return next();
  }

  // Check header Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (token && verifyToken(token)) {
    return next();
  }

  // Check direct PIN header: x-admin-pin
  const pinHeader = req.headers['x-admin-pin'];
  if (pinHeader) {
    const settings = db.prepare('SELECT pin FROM settings WHERE id = 1').get();
    if (settings && String(settings.pin).trim() === String(pinHeader).trim()) {
      return next();
    }
  }

  return res.status(401).json({
    success: false,
    error: 'Akses ditolak: Memerlukan otentikasi PIN Pengelola Kos'
  });
}

module.exports = {
  authMiddleware,
  generateToken,
  verifyToken,
  activeTokens
};
