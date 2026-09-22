const express = require('express');
const router = express.Router();
const db = require('../database');

// GET tenants
router.get('/', (req, res) => {
  const { status } = req.query; // 'aktif', 'keluar', 'all'
  let query = `
    SELECT 
      t.*,
      r.room_number,
      r.name as room_name,
      r.price as room_standard_price
    FROM tenants t
    JOIN rooms r ON t.room_id = r.id
  `;

  const params = [];
  if (status && status !== 'all') {
    query += ` WHERE t.status = ?`;
    params.push(status);
  } else if (!status) {
    query += ` WHERE t.status = 'aktif'`;
  }

  query += ` ORDER BY t.check_in_date DESC`;

  try {
    const tenants = db.prepare(query).all(...params);
    res.json({ success: true, data: tenants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single tenant detail with payments & logs
router.get('/:id', (req, res) => {
  const tenantId = req.params.id;

  try {
    const tenant = db.prepare(`
      SELECT 
        t.*,
        r.room_number,
        r.name as room_name,
        r.price as room_standard_price,
        r.facilities
      FROM tenants t
      JOIN rooms r ON t.room_id = r.id
      WHERE t.id = ?
    `).get(tenantId);

    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Pengekos tidak ditemukan' });
    }

    const payments = db.prepare(`
      SELECT * FROM payments 
      WHERE tenant_id = ? 
      ORDER BY payment_date DESC
    `).all(tenantId);

    const logs = db.prepare(`
      SELECT * FROM logs 
      WHERE tenant_id = ? 
      ORDER BY created_at DESC
    `).all(tenantId);

    res.json({
      success: true,
      data: {
        ...tenant,
        payments,
        logs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Check-in new tenant
router.post('/check-in', (req, res) => {
  const {
    room_id,
    name,
    representative_name,
    phone,
    emergency_contact,
    emergency_relation,
    address,
    occupants_count,
    check_in_date,
    billing_frequency,
    rent_price,
    deposit,
    notes,
    initial_payment_paid // boolean: apakah langsung bayar uang sewa awal
  } = req.body;

  if (!room_id || !name || !phone || !check_in_date) {
    return res.status(400).json({ 
      success: false, 
      error: 'Data wajib: Kamar, Nama Pengekos, No WhatsApp, dan Tanggal Masuk' 
    });
  }

  const checkIn = new Date(check_in_date);
  const billing_day = checkIn.getDate(); // Jatuh tempo sesuai tanggal masuk setiap bulannya

  try {
    // Check if room exists and is available
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(room_id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Kamar tidak ditemukan' });
    }

    if (room.status === 'terisi') {
      return res.status(400).json({ success: false, error: 'Kamar ini sedang terisi penghuni lain' });
    }

    const finalRentPrice = Number(rent_price) > 0 ? Number(rent_price) : room.price;

    const checkInTx = db.transaction(() => {
      // 1. Insert tenant
      const insertTenant = db.prepare(`
        INSERT INTO tenants (
          room_id, name, representative_name, phone, emergency_contact, emergency_relation,
          address, occupants_count, check_in_date, billing_day, billing_frequency,
          rent_price, deposit, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', ?)
      `).run(
        room_id,
        name.trim(),
        representative_name ? representative_name.trim() : '',
        phone.trim(),
        emergency_contact ? emergency_contact.trim() : '',
        emergency_relation ? emergency_relation.trim() : '',
        address ? address.trim() : '',
        Number(occupants_count) || 1,
        check_in_date,
        billing_day,
        Number(billing_frequency) || 1,
        finalRentPrice,
        Number(deposit) || 0,
        notes ? notes.trim() : ''
      );

      const tenantId = insertTenant.lastInsertRowid;

      // 2. Update room status to 'terisi'
      db.prepare("UPDATE rooms SET status = 'terisi' WHERE id = ?").run(room_id);

      // 3. Log check-in event
      db.prepare(`
        INSERT INTO logs (event_type, description, tenant_id, room_id)
        VALUES ('CHECK_IN', ?, ?, ?)
      `).run(
        `Penghuni baru masuk: ${name} di ${room.room_number} (${room.name}) - ${Number(occupants_count) || 1} orang. Jatuh tempo tgl ${billing_day} setiap bulan.`,
        tenantId,
        room_id
      );

      // 4. Record initial payment if indicated
      if (initial_payment_paid) {
        // Calculate 1 month period
        const periodStart = new Date(check_in_date);
        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + (Number(billing_frequency) || 1));

        const periodStartStr = periodStart.toISOString().split('T')[0];
        const periodEndStr = periodEnd.toISOString().split('T')[0];

        db.prepare(`
          INSERT INTO payments (tenant_id, room_id, amount, payment_date, period_start, period_end, payment_method, notes)
          VALUES (?, ?, ?, ?, ?, ?, 'Transfer/Tunai Awal', 'Pembayaran sewa pertama saat check-in')
        `).run(tenantId, room_id, finalRentPrice, check_in_date, periodStartStr, periodEndStr);

        db.prepare(`
          INSERT INTO logs (event_type, description, tenant_id, room_id)
          VALUES ('PAYMENT', ?, ?, ?)
        `).run(
          `Pembayaran sewa awal masuk: Rp ${finalRentPrice.toLocaleString('id-ID')} untuk ${name} (${room.room_number})`,
          tenantId,
          room_id
        );
      }

      return tenantId;
    });

    const newTenantId = checkInTx();

    res.json({
      success: true,
      id: newTenantId,
      message: `Berhasil check-in penghuni ${name} di kamar ${room.room_number}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update tenant info
router.put('/:id', (req, res) => {
  const tenantId = req.params.id;
  const {
    name,
    representative_name,
    phone,
    emergency_contact,
    emergency_relation,
    address,
    occupants_count,
    billing_frequency,
    rent_price,
    deposit,
    notes
  } = req.body;

  try {
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Pengekos tidak ditemukan' });
    }

    db.prepare(`
      UPDATE tenants
      SET name = COALESCE(?, name),
          representative_name = COALESCE(?, representative_name),
          phone = COALESCE(?, phone),
          emergency_contact = COALESCE(?, emergency_contact),
          emergency_relation = COALESCE(?, emergency_relation),
          address = COALESCE(?, address),
          occupants_count = COALESCE(?, occupants_count),
          billing_frequency = COALESCE(?, billing_frequency),
          rent_price = COALESCE(?, rent_price),
          deposit = COALESCE(?, deposit),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      name,
      representative_name,
      phone,
      emergency_contact,
      emergency_relation,
      address,
      occupants_count !== undefined ? Number(occupants_count) : null,
      billing_frequency !== undefined ? Number(billing_frequency) : null,
      rent_price !== undefined ? Number(rent_price) : null,
      deposit !== undefined ? Number(deposit) : null,
      notes,
      tenantId
    );

    db.prepare(`
      INSERT INTO logs (event_type, description, tenant_id, room_id)
      VALUES ('TENANT_UPDATE', ?, ?, ?)
    `).run(`Memperbarui profil pengekos: ${name || tenant.name}`, tenantId, tenant.room_id);

    res.json({ success: true, message: 'Data penghuni berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Check-out tenant
router.post('/:id/check-out', (req, res) => {
  const tenantId = req.params.id;
  const { check_out_date, checkout_notes } = req.body;

  const actualCheckOutDate = check_out_date || new Date().toISOString().split('T')[0];

  try {
    const tenant = db.prepare(`
      SELECT t.*, r.room_number, r.name as room_name 
      FROM tenants t
      JOIN rooms r ON t.room_id = r.id
      WHERE t.id = ?
    `).get(tenantId);

    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Pengekos tidak ditemukan' });
    }

    if (tenant.status === 'keluar') {
      return res.status(400).json({ success: false, error: 'Pengekos ini sudah berstatus keluar' });
    }

    const checkOutTx = db.transaction(() => {
      // 1. Update tenant status to 'keluar'
      db.prepare(`
        UPDATE tenants
        SET status = 'keluar',
            check_out_date = ?,
            notes = notes || ?
        WHERE id = ?
      `).run(
        actualCheckOutDate,
        checkout_notes ? ` [Check-out note: ${checkout_notes}]` : '',
        tenantId
      );

      // 2. Set room status back to 'tersedia'
      db.prepare("UPDATE rooms SET status = 'tersedia' WHERE id = ?").run(tenant.room_id);

      // 3. Insert audit log
      db.prepare(`
        INSERT INTO logs (event_type, description, tenant_id, room_id)
        VALUES ('CHECK_OUT', ?, ?, ?)
      `).run(
        `Penghuni keluar: ${tenant.name} dari ${tenant.room_number} pada tanggal ${actualCheckOutDate}. Kamar kembali tersedia.`,
        tenantId,
        tenant.room_id
      );
    });

    checkOutTx();

    res.json({
      success: true,
      message: `Penghuni ${tenant.name} berhasil di-check out. Kamar ${tenant.room_number} kini tersedia.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
