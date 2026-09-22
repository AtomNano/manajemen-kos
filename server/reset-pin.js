const db = require('./database');

const args = process.argv.slice(2);
const newPin = args[0];

if (newPin) {
  if (String(newPin).trim().length < 4) {
    console.error('❌ Error: PIN minimal 4 karakter!');
    process.exit(1);
  }
  db.prepare('UPDATE settings SET pin = ? WHERE id = 1').run(String(newPin).trim());
  console.log(`\n✅ SUKSES: PIN Pengelola berhasil diperbarui menjadi: ${newPin}`);
}

const current = db.prepare('SELECT pin, recovery_key, kos_name, owner_name, owner_phone FROM settings WHERE id = 1').get();

console.log('\n================================================================');
console.log(`🏡 ${current?.kos_name || 'KOS PUTRA'} - PUSAT PEMULIHAN AKSES CEPAT`);
console.log('================================================================');
console.log(`👤 Pengelola Kos      : ${current?.owner_name || 'Pengelola'}`);
console.log(`📱 No. WhatsApp       : ${current?.owner_phone || '-'}`);
console.log(`📌 PIN Saat Ini       : ${current?.pin || '1234'}`);
console.log(`🔑 Kunci Pemulihan HP : ${current?.recovery_key || 'KOS-PUTRA-9988'}`);
console.log('----------------------------------------------------------------');
console.log('Cara reset PIN instan via Terminal Server:');
console.log('  node server/reset-pin.js <PIN_BARU>');
console.log('Contoh:');
console.log('  node server/reset-pin.js 8899');
console.log('================================================================\n');
