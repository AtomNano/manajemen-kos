const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all logs
router.get('/', (req, res) => {
  const { event_type, limit } = req.query;
  let query = `
    SELECT 
      l.*,
      t.name as tenant_name,
      r.room_number
    FROM logs l
    LEFT JOIN tenants t ON l.tenant_id = t.id
    LEFT JOIN rooms r ON l.room_id = r.id
  `;
  const params = [];

  if (event_type && event_type !== 'ALL') {
    query += ` WHERE l.event_type = ?`;
    params.push(event_type);
  }

  query += ` ORDER BY l.created_at DESC, l.id DESC`;

  if (limit) {
    query += ` LIMIT ?`;
    params.push(Number(limit));
  } else {
    query += ` LIMIT 100`;
  }

  try {
    const logs = db.prepare(query).all(...params);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
