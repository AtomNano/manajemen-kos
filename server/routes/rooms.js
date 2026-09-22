const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all rooms with active tenant details
router.get('/', (req, res) => {
  try {
    const rooms = db.prepare(`
      SELECT 
        r.*,
        t.id as active_tenant_id,
        t.name as tenant_name,
        t.phone as tenant_phone,
        t.representative_name,
        t.occupants_count,
        t.check_in_date,
        t.billing_day,
        t.rent_price as tenant_rent_price
      FROM rooms r
      LEFT JOIN tenants t ON r.id = t.room_id AND t.status = 'aktif'
      ORDER BY r.floor ASC, r.room_number ASC
    `).all();

    res.json({ success: true, data: rooms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single room
router.get('/:id', (req, res) => {
  try {
    const room = db.prepare(`
      SELECT 
        r.*,
        t.id as active_tenant_id,
        t.name as tenant_name,
        t.phone as tenant_phone,
        t.representative_name,
        t.occupants_count,
        t.check_in_date,
        t.billing_day
      FROM rooms r
      LEFT JOIN tenants t ON r.id = t.room_id AND t.status = 'aktif'
      WHERE r.id = ?
    `).get(req.params.id);

    if (!room) {
      return res.status(404).json({ success: false, error: 'Kamar tidak ditemukan' });
    }

    res.json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST add room
router.post('/', (req, res) => {
  const { room_number, name, floor, price, capacity, facilities, status, notes } = req.body;
  if (!room_number || !name) {
    return res.status(400).json({ success: false, error: 'Nomor dan nama kamar wajib diisi' });
  }

  try {
    const existing = db.prepare('SELECT id FROM rooms WHERE room_number = ?').get(room_number);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Nomor kamar sudah terdaftar' });
    }

    const info = db.prepare(`
      INSERT INTO rooms (room_number, name, floor, price, capacity, facilities, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      room_number,
      name,
      Number(floor) || 1,
      Number(price) || 0,
      Number(capacity) || 1,
      facilities || '',
      status || 'tersedia',
      notes || ''
    );

    db.prepare(`
      INSERT INTO logs (event_type, description, room_id)
      VALUES ('ROOM_UPDATE', ?, ?)
    `).run(`Menambahkan kamar baru: ${room_number} (${name})`, info.lastInsertRowid);

    res.json({ success: true, id: info.lastInsertRowid, message: 'Kamar berhasil ditambahkan' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update room
router.put('/:id', (req, res) => {
  const { room_number, name, floor, price, capacity, facilities, status, notes } = req.body;
  const roomId = req.params.id;

  try {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Kamar tidak ditemukan' });
    }

    // Check unique room_number if changed
    if (room_number && room_number !== room.room_number) {
      const existing = db.prepare('SELECT id FROM rooms WHERE room_number = ? AND id != ?').get(room_number, roomId);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Nomor kamar sudah digunakan' });
      }
    }

    db.prepare(`
      UPDATE rooms
      SET room_number = COALESCE(?, room_number),
          name = COALESCE(?, name),
          floor = COALESCE(?, floor),
          price = COALESCE(?, price),
          capacity = COALESCE(?, capacity),
          facilities = COALESCE(?, facilities),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      room_number,
      name,
      floor !== undefined ? Number(floor) : null,
      price !== undefined ? Number(price) : null,
      capacity !== undefined ? Number(capacity) : null,
      facilities,
      status,
      notes,
      roomId
    );

    db.prepare(`
      INSERT INTO logs (event_type, description, room_id)
      VALUES ('ROOM_UPDATE', ?, ?)
    `).run(`Memperbarui data kamar: ${room_number || room.room_number}`, roomId);

    res.json({ success: true, message: 'Kamar berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE room
router.delete('/:id', (req, res) => {
  const roomId = req.params.id;

  try {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Kamar tidak ditemukan' });
    }

    // Check if occupied
    const activeTenant = db.prepare("SELECT id FROM tenants WHERE room_id = ? AND status = 'aktif'").get(roomId);
    if (activeTenant) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tidak dapat menghapus kamar yang sedang terisi penghuni. Silakan lakukan check-out terlebih dahulu.' 
      });
    }

    db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);

    db.prepare(`
      INSERT INTO logs (event_type, description)
      VALUES ('ROOM_UPDATE', ?)
    `).run(`Menghapus kamar: ${room.room_number} (${room.name})`);

    res.json({ success: true, message: 'Kamar berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
