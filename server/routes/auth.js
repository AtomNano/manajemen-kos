const express = require('express');
const router = express.Router();
const db = require('../database');
const { generateToken, verifyToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ success: false, error: 'PIN wajib diisi' });
  }

  try {
    const settings = db.prepare('SELECT pin FROM settings WHERE id = 1').get();
    const correctPin = (settings && settings.pin) ? String(settings.pin).trim() : '1234';

    if (String(pin).trim() !== correctPin) {
      return res.status(401).json({ success: false, error: 'PIN Pengelola salah' });
    }

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

module.exports = router;
