const express = require('express');
const router = express.Router();
const db = require('../database');

// GET settings
router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update settings
router.put('/', (req, res) => {
  const {
    kos_name,
    owner_name,
    owner_phone,
    bank_name,
    bank_account_number,
    bank_account_name,
    reminder_template,
    pin
  } = req.body;

  try {
    db.prepare(`
      UPDATE settings
      SET kos_name = COALESCE(?, kos_name),
          owner_name = COALESCE(?, owner_name),
          owner_phone = COALESCE(?, owner_phone),
          bank_name = COALESCE(?, bank_name),
          bank_account_number = COALESCE(?, bank_account_number),
          bank_account_name = COALESCE(?, bank_account_name),
          reminder_template = COALESCE(?, reminder_template),
          pin = COALESCE(?, pin),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      kos_name,
      owner_name,
      owner_phone,
      bank_name,
      bank_account_number,
      bank_account_name,
      reminder_template,
      pin
    );

    db.prepare(`
      INSERT INTO logs (event_type, description)
      VALUES ('SYSTEM', 'Pengaturan kos dan rekening pembayaran diperbarui')
    `).run();

    res.json({ success: true, message: 'Pengaturan berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
