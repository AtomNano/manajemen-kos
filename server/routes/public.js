const express = require('express');
const router = express.Router();
const db = require('../database');

// GET public room details & kos profile for the tenant registration form
router.get('/rooms/:id', (req, res) => {
  const roomId = req.params.id;

  try {
    const room = db.prepare(`
      SELECT id, room_number, name, floor, price, capacity, facilities, status, notes
      FROM rooms 
      WHERE id = ? OR room_number = ?
    `).get(roomId, roomId);

    if (!room) {
      return res.status(404).json({ success: false, error: 'Kamar tidak ditemukan' });
    }

    const settings = db.prepare(`
      SELECT kos_name, owner_name, owner_phone, bank_name, bank_account_number, bank_account_name
      FROM settings 
      WHERE id = 1
    `).get() || {};

    res.json({
      success: true,
      data: {
        room,
        kos: settings
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST public self-registration by prospective tenant
router.post('/register/:id', (req, res) => {
  const roomId = req.params.id;
  const {
    name,
    representative_name,
    phone,
    emergency_contact,
    emergency_relation,
    address,
    occupants_count,
    check_in_date,
    notes
  } = req.body;

  if (!name || !phone || !check_in_date) {
    return res.status(400).json({
      success: false,
      error: 'Harap lengkapi data: Nama Lengkap, Nomor WhatsApp, dan Rencana Tanggal Masuk'
    });
  }

  try {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ? OR room_number = ?').get(roomId, roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Kamar tidak ditemukan' });
    }

    if (room.status === 'terisi') {
      return res.status(400).json({
        success: false,
        error: 'Mohon maaf, kamar ini saat ini sudah terisi oleh penghuni lain.'
      });
    }

    if (room.status === 'perbaikan') {
      return res.status(400).json({
        success: false,
        error: 'Mohon maaf, kamar ini sedang dalam perbaikan/renovasi.'
      });
    }

    const actualRoomId = room.id;
    const checkIn = new Date(check_in_date);
    const billing_day = checkIn.getDate() || 1;
    const count = Number(occupants_count) > 0 ? Number(occupants_count) : 1;

    const registerTx = db.transaction(() => {
      // 1. Insert tenant with is_self_registered = 1
      const insert = db.prepare(`
        INSERT INTO tenants (
          room_id, name, representative_name, phone, emergency_contact, emergency_relation,
          address, occupants_count, check_in_date, billing_day, billing_frequency,
          rent_price, deposit, status, is_self_registered, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, 'aktif', 1, ?)
      `).run(
        actualRoomId,
        name.trim(),
        representative_name ? representative_name.trim() : '',
        phone.trim(),
        emergency_contact ? emergency_contact.trim() : '',
        emergency_relation ? emergency_relation.trim() : '',
        address ? address.trim() : '',
        count,
        check_in_date,
        billing_day,
        room.price,
        notes ? `[Pendaftaran Online] ${notes.trim()}` : '[Pendaftaran Mandiri Online]'
      );

      const tenantId = insert.lastInsertRowid;

      // 2. Set room to 'terisi'
      db.prepare("UPDATE rooms SET status = 'terisi' WHERE id = ?").run(actualRoomId);

      // 3. Log audit event
      db.prepare(`
        INSERT INTO logs (event_type, description, tenant_id, room_id)
        VALUES ('CHECK_IN', ?, ?, ?)
      `).run(
        `[PENDAFTARAN ONLINE] Pengekos baru mendaftar mandiri via form web: ${name} di ${room.room_number} (${room.name}) - ${count} orang. Rencana masuk: ${check_in_date}.`,
        tenantId,
        actualRoomId
      );

      return tenantId;
    });

    const newTenantId = registerTx();

    const settings = db.prepare(`
      SELECT kos_name, owner_name, owner_phone, bank_name, bank_account_number, bank_account_name
      FROM settings 
      WHERE id = 1
    `).get() || {};

    res.json({
      success: true,
      message: `Pendaftaran berhasil! Selamat bergabung di ${settings.kos_name || 'Kos'}.`,
      data: {
        tenant_id: newTenantId,
        room_number: room.room_number,
        room_name: room.name,
        price: room.price,
        check_in_date,
        kos: settings
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
