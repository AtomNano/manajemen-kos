const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all payments
router.get('/', (req, res) => {
  const { tenant_id, limit } = req.query;
  let query = `
    SELECT 
      p.*,
      t.name as tenant_name,
      t.phone as tenant_phone,
      r.room_number,
      r.name as room_name
    FROM payments p
    JOIN tenants t ON p.tenant_id = t.id
    JOIN rooms r ON p.room_id = r.id
  `;
  const params = [];

  if (tenant_id) {
    query += ` WHERE p.tenant_id = ?`;
    params.push(tenant_id);
  }

  query += ` ORDER BY p.payment_date DESC, p.id DESC`;

  if (limit) {
    query += ` LIMIT ?`;
    params.push(Number(limit));
  }

  try {
    const payments = db.prepare(query).all(...params);
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET dues & billing status for all active tenants
router.get('/dues', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() || {};
    const tenants = db.prepare(`
      SELECT 
        t.*,
        r.room_number,
        r.name as room_name
      FROM tenants t
      JOIN rooms r ON t.room_id = r.id
      WHERE t.status = 'aktif'
      ORDER BY r.room_number ASC
    `).all();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = tenants.map((tenant) => {
      // Get the latest payment
      const latestPayment = db.prepare(`
        SELECT * FROM payments 
        WHERE tenant_id = ? 
        ORDER BY period_end DESC, payment_date DESC 
        LIMIT 1
      `).get(tenant.id);

      let nextDueDate;
      let isPaidCurrentPeriod = false;

      if (!latestPayment) {
        // No payment recorded yet -> due immediately on check_in_date
        nextDueDate = new Date(tenant.check_in_date);
      } else {
        // Next due date is the end of the last paid period
        nextDueDate = new Date(latestPayment.period_end);
      }
      nextDueDate.setHours(0, 0, 0, 0);

      // Diff in days (due date - today)
      const diffTime = nextDueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status = 'LUNAS'; // 'LUNAS', 'MENDEKATI', 'TERLAMBAT'
      if (diffDays < 0) {
        status = 'TERLAMBAT';
      } else if (diffDays <= 5) {
        status = 'MENDEKATI';
      } else {
        status = 'LUNAS';
      }

      // Format WhatsApp Message
      const formattedDate = nextDueDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const formattedRent = 'Rp ' + Number(tenant.rent_price).toLocaleString('id-ID');

      let waMessage = settings.reminder_template || '';
      waMessage = waMessage
        .replace('{NAMA_PENGHUNI}', tenant.name)
        .replace('{NOMOR_KAMAR}', tenant.room_number)
        .replace('{TANGGAL_JATUH_TEMPO}', formattedDate)
        .replace('{NOMINAL_SEWA}', formattedRent)
        .replace('{NAMA_BANK}', settings.bank_name || 'BCA')
        .replace('{NOMOR_REKENING}', settings.bank_account_number || '-')
        .replace('{ATAS_NAMA}', settings.bank_account_name || '-')
        .replace('{NAMA_KOS}', settings.kos_name || 'Kos');

      // Standardize phone number for WhatsApp link
      let cleanPhone = tenant.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      }

      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

      return {
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        room_number: tenant.room_number,
        room_name: tenant.room_name,
        phone: tenant.phone,
        clean_phone: cleanPhone,
        check_in_date: tenant.check_in_date,
        billing_day: tenant.billing_day,
        rent_price: tenant.rent_price,
        latest_payment: latestPayment || null,
        next_due_date: nextDueDate.toISOString().split('T')[0],
        formatted_due_date: formattedDate,
        diff_days: diffDays,
        status,
        wa_message: waMessage,
        wa_url: waUrl
      };
    });

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Record new payment
router.post('/', (req, res) => {
  const { tenant_id, amount, payment_date, period_start, period_end, payment_method, notes } = req.body;

  if (!tenant_id || !amount || !payment_date || !period_start || !period_end) {
    return res.status(400).json({
      success: false,
      error: 'Data pembayaran belum lengkap (Penyewa, Nominal, Tgl Bayar, Periode Mulai & Selesai wajib diisi)'
    });
  }

  try {
    const tenant = db.prepare(`
      SELECT t.*, r.room_number 
      FROM tenants t
      JOIN rooms r ON t.room_id = r.id
      WHERE t.id = ?
    `).get(tenant_id);

    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Data penghuni tidak ditemukan' });
    }

    const insertPayment = db.prepare(`
      INSERT INTO payments (
        tenant_id, room_id, amount, payment_date, period_start, period_end, payment_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tenant_id,
      tenant.room_id,
      Number(amount),
      payment_date,
      period_start,
      period_end,
      payment_method || 'Transfer Bank',
      notes || ''
    );

    db.prepare(`
      INSERT INTO logs (event_type, description, tenant_id, room_id)
      VALUES ('PAYMENT', ?, ?, ?)
    `).run(
      `Pencatatan sewa: Rp ${Number(amount).toLocaleString('id-ID')} dari ${tenant.name} (${tenant.room_number}) untuk periode ${period_start} s/d ${period_end}`,
      tenant_id,
      tenant.room_id
    );

    res.json({
      success: true,
      id: insertPayment.lastInsertRowid,
      message: 'Pembayaran berhasil dicatat'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
