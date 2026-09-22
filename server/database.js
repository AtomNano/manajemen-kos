const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'kos_database.sqlite');
const db = new Database(dbPath);

// Enable Foreign Keys & WAL mode for performance and safety
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  // 1. Table Rooms
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      floor INTEGER DEFAULT 1,
      price INTEGER NOT NULL DEFAULT 0,
      capacity INTEGER NOT NULL DEFAULT 1,
      facilities TEXT DEFAULT '',
      status TEXT CHECK(status IN ('tersedia', 'terisi', 'perbaikan')) DEFAULT 'tersedia',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Table Tenants
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      representative_name TEXT DEFAULT '',
      phone TEXT NOT NULL,
      emergency_contact TEXT DEFAULT '',
      emergency_relation TEXT DEFAULT '',
      address TEXT DEFAULT '',
      occupants_count INTEGER NOT NULL DEFAULT 1,
      check_in_date DATE NOT NULL,
      check_out_date DATE,
      billing_day INTEGER NOT NULL,
      billing_frequency INTEGER NOT NULL DEFAULT 1, -- 1 = per bulan
      rent_price INTEGER NOT NULL DEFAULT 0,
      deposit INTEGER NOT NULL DEFAULT 0,
      status TEXT CHECK(status IN ('aktif', 'keluar')) DEFAULT 'aktif',
      is_self_registered INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
    );
  `);

  // Migrate tenants table if is_self_registered column doesn't exist
  try {
    db.prepare('ALTER TABLE tenants ADD COLUMN is_self_registered INTEGER DEFAULT 0').run();
  } catch (e) {
    // Column already exists, ignore
  }

  // 3. Table Payments
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      payment_date DATE NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      payment_method TEXT DEFAULT 'Transfer Bank',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
    );
  `);

  // 4. Table Logs (Audit Trail)
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL, -- CHECK_IN, CHECK_OUT, PAYMENT, ROOM_UPDATE, TENANT_UPDATE, SYSTEM, SELF_REGISTER
      description TEXT NOT NULL,
      tenant_id INTEGER,
      room_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Table Settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      kos_name TEXT NOT NULL DEFAULT 'Kos Berkah Mandiri',
      owner_name TEXT NOT NULL DEFAULT 'Pengelola Kos',
      owner_phone TEXT NOT NULL DEFAULT '08123456789',
      bank_name TEXT NOT NULL DEFAULT 'BCA',
      bank_account_number TEXT NOT NULL DEFAULT '1234567890',
      bank_account_name TEXT NOT NULL DEFAULT 'Nama Pemilik',
      reminder_template TEXT NOT NULL,
      pin TEXT DEFAULT '1234',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate settings table if pin column doesn't exist
  try {
    db.prepare("ALTER TABLE settings ADD COLUMN pin TEXT DEFAULT '1234'").run();
  } catch (e) {
    // Column already exists, ignore
  }

  // Seed default 7 rooms if table is empty
  const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
  if (roomCount === 0) {
    const insertRoom = db.prepare(`
      INSERT INTO rooms (room_number, name, floor, price, capacity, facilities, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, 'tersedia', ?)
    `);

    const initialRooms = [
      { num: 'Kamar 01', name: 'Kamar 01 (Lantai 1)', floor: 1, price: 850000, cap: 2, fac: 'Kasur Springbed, Lemari Pakaian, Kamar Mandi Dalam, Kipas Angin', note: 'Dekat pintu masuk utama' },
      { num: 'Kamar 02', name: 'Kamar 02 (Lantai 1)', floor: 1, price: 850000, cap: 2, fac: 'Kasur Springbed, Lemari Pakaian, Kamar Mandi Dalam, Kipas Angin', note: 'Ventilasi bagus' },
      { num: 'Kamar 03', name: 'Kamar 03 (Lantai 1)', floor: 1, price: 750000, cap: 1, fac: 'Kasur Busa Tebal, Lemari, Meja Belajar, Kamar Mandi Luar', note: 'Tenang, samping dapur' },
      { num: 'Kamar 04', name: 'Kamar 04 (Lantai 1)', floor: 1, price: 750000, cap: 1, fac: 'Kasur Busa Tebal, Lemari, Meja Belajar, Kamar Mandi Luar', note: 'Dekat ruang cuci' },
      { num: 'Kamar 05', name: 'Kamar 05 (Lantai 2)', floor: 2, price: 1000000, cap: 2, fac: 'AC 1/2 PK, Kasur Springbed, Lemari Pakaian, Kamar Mandi Dalam', note: 'Lantai 2 depan' },
      { num: 'Kamar 06', name: 'Kamar 06 (Lantai 2)', floor: 2, price: 1000000, cap: 2, fac: 'AC 1/2 PK, Kasur Springbed, Lemari Pakaian, Kamar Mandi Dalam', note: 'Lantai 2 samping' },
      { num: 'Kamar 07', name: 'Kamar 07 (Lantai 2)', floor: 2, price: 850000, cap: 2, fac: 'Kasur Springbed, Lemari, Balkon Pribadi, Kamar Mandi Luar', note: 'Pemandangan luar luas' },
    ];

    const insertMany = db.transaction((rooms) => {
      for (const r of rooms) {
        insertRoom.run(r.num, r.name, r.floor, r.price, r.cap, r.fac, r.note);
      }
    });
    insertMany(initialRooms);

    // Initial system log
    db.prepare(`
      INSERT INTO logs (event_type, description)
      VALUES ('SYSTEM', 'Inisialisasi sistem: Berhasil membuat 7 kamar bawaan kos.')
    `).run();
  }

  // Seed default settings if empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
  if (settingsCount === 0) {
    const defaultReminder = `Halo Kak {NAMA_PENGHUNI} ({NOMOR_KAMAR}),\n\nSekadar mengingatkan untuk pembayaran sewa kos periode bulan ini yang jatuh tempo pada tanggal *{TANGGAL_JATUH_TEMPO}* sebesar *{NOMINAL_SEWA}*.\n\nPembayaran dapat ditransfer ke:\n🏦 Bank: *{NAMA_BANK}*\n💳 No. Rekening: *{NOMOR_REKENING}*\n👤 Atas Nama: *{ATAS_NAMA}*\n\nJika sudah melakukan transfer, mohon kirimkan bukti pembayarannya ya Kak. Terima kasih banyak! 🙏😊\n\nSalam,\n*{NAMA_KOS}*`;

    db.prepare(`
      INSERT INTO settings (id, kos_name, owner_name, owner_phone, bank_name, bank_account_number, bank_account_name, reminder_template, pin)
      VALUES (1, 'Kos Berkah Mandiri', 'Pengelola Kos', '08123456789', 'BCA', '1234567890', 'Pemilik Kos', ?, '1234')
    `).run(defaultReminder);
  }
}

initDb();

module.exports = db;
