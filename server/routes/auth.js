const express = require('express');
const router = express.Router();
const db = require('../database');
const { generateToken, verifyToken } = require('../middleware/auth');

// In-memory brute force tracker
const loginAttempts = new Map(); // ip -> { count, lockedUntil }

// POST /api/auth/login
router.post('/login', (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  const attempts = loginAttempts.get(clientIp) || { count: 0, lockedUntil: 0 };
  if (attempts.lockedUntil > now) {
    const remainingMinutes = Math.ceil((attempts.lockedUntil - now) / 60000);
    return res.status(429).json({
      success: false,
      error: `Terlalu banyak percobaan salah. Silakan coba lagi dalam ${remainingMinutes} menit.`
    });
  }

  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ success: false, error: 'PIN wajib diisi' });
  }

  try {
    const settings = db.prepare('SELECT pin FROM settings WHERE id = 1').get();
    const correctPin = (settings && settings.pin) ? String(settings.pin).trim() : '1234';

    if (String(pin).trim() !== correctPin) {
      attempts.count += 1;
      if (attempts.count >= 5) {
        attempts.lockedUntil = now + 15 * 60 * 1000; // Lock 15 minutes
        loginAttempts.set(clientIp, attempts);
        return res.status(429).json({
          success: false,
          error: 'Terlalu banyak percobaan salah (5x). Akses dikunci selama 15 menit demi keamanan.'
        });
      }
      loginAttempts.set(clientIp, attempts);
      const remaining = 5 - attempts.count;
      return res.status(401).json({
        success: false,
        error: `PIN Pengelola salah. Sisa kesempatan: ${remaining} kali.`
      });
    }

    // Success - reset attempts
    loginAttempts.delete(clientIp);

    const { token, expiresAt } = generateToken();
    res.json({
      success: true,
      token,
      expiresAt,
      message: 'Autentikasi admin berhasil'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (token && verifyToken(token)) {
    return res.json({ success: true, authenticated: true });
  }

  return res.status(401).json({ success: false, authenticated: false });
});

// POST /api/auth/emergency-reset
router.post('/emergency-reset', (req, res) => {
  const { recovery_key, new_pin } = req.body;
  if (!recovery_key || !new_pin) {
    return res.status(400).json({ success: false, error: 'Kunci Pemulihan dan PIN Baru wajib diisi' });
  }

  try {
    const settings = db.prepare('SELECT recovery_key FROM settings WHERE id = 1').get();
    const correctKey = (settings && settings.recovery_key) ? String(settings.recovery_key).trim() : 'KOS-PUTRA-9988';

    if (String(recovery_key).trim().toUpperCase() !== correctKey.toUpperCase()) {
      return res.status(401).json({ success: false, error: 'Kunci Pemulihan Darurat tidak cocok / salah' });
    }

    if (String(new_pin).trim().length < 4) {
      return res.status(400).json({ success: false, error: 'PIN Baru minimal 4 karakter' });
    }

    // Update PIN in database
    db.prepare('UPDATE settings SET pin = ? WHERE id = 1').run(String(new_pin).trim());

    // Clear all lockout attempts
    loginAttempts.clear();

    const { token, expiresAt } = generateToken();
    res.json({
      success: true,
      message: 'Akses dan PIN berhasil dipulihkan secara instan!',
      token,
      expiresAt
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
module.exports.clearLockouts = () => loginAttempts.clear();

