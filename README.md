# Sistem Manajemen Kos Lokal (KosManager)

Aplikasi manajemen operasional rumah kos yang praktis, ringan, dan siap pakai untuk pengelolaan lokal di rumah/PC/Laptop maupun diakses dari Smartphone melalui jaringan Wi-Fi lokal.

---

## Fitur Utama

1. **Denah & Status Kamar (Bawaan 7 Kamar, Dinamis)**
   - Sudah terisi otomatis 7 kamar awal (Kamar 01 s/d Kamar 07) dengan harga, lantai, dan fasilitas yang dapat diubah sesuai kebutuhan.
   - Penambahan kamar baru tanpa batas.
   - Status visual: **Tersedia (Hijau)**, **Terisi (Biru)**, **Perbaikan (Kuning)**.

2. **Form Masuk Pengekos (Check-In Cepat)**
   - Cukup 1 klik untuk memasukkan penghuni baru ke kamar yang kosong.
   - Mencatat identitas lengkap:
     - Nama Pengekos
     - Nama Perwakilan / Penanggung Jawab / Wali
     - Nomor WhatsApp
     - Kontak Darurat & Hubungan Kerabat
     - Alamat Asal / KTP
     - Jumlah orang dalam kamar
     - Tanggal masuk & siklus jatuh tempo sewa bulanan
     - Pilihan langsung melunasi sewa bulan pertama saat check-in.

3. **Pengingat Tagihan & Notifikasi WhatsApp 1-Klik**
   - Jatuh tempo sewa dihitung otomatis dari tanggal masuk pengekos setiap bulannya.
   - Indikator status tagihan:
     - **Lewat Tempo** (Merah)
     - **Mendekati Jatuh Tempo H-5** (Kuning)
     - **Lunas Berjalan** (Hijau)
   - Tombol **"Kirim WA"**: Langsung membuka chat WhatsApp dengan pesan tagihan resmi, sopan, dan mencantumkan nomor rekening kos secara otomatis.

4. **Alur Check-Out & Log Riwayat (Audit Trail)**
   - Tombol Check-Out untuk penghuni yang keluar, dengan pencatatan tanggal keluar dan catatan pengembalian deposit/kunci.
   - Kamar otomatis kembali kosong dan siap diisi penghuni baru.
   - Tab **Riwayat Log**: Memantau siapa yang masuk, siapa yang keluar, dan pencatatan pembayaran lengkap dengan waktu kejadian.

5. **Pengaturan Kos & Rekening Bank**
   - Atur nama kos, pengelola, no WhatsApp pengelola.
   - Atur rekening bank tujuan transfer sewa.
   - Sesuaikan template teks pengingat WhatsApp sesuai selera.

---

## Cara Menjalankan

### Cara Termudah (Windows):
Cukup **double-click file `jalankan-kos.bat`** di dalam folder `kos-app`.
Browser otomatis akan terbuka ke `http://localhost:5000`.

### Cara Manual via Terminal:
```bash
cd "d:/github/Lutech Website/kos-app"
npm start
```

---

## Cara Mengakses dari HP / Smartphone (Via Wi-Fi Rumah)

1. Pastikan HP dan Komputer terhubung ke jaringan Wi-Fi yang sama di rumah kos.
2. Buka terminal atau jalankan aplikasi, Anda akan melihat alamat IP lokal, contohnya:
   ```
   📱 Akses dari HP/Laptop via Wi-Fi: http://192.168.1.15:5000
   ```
3. Buka browser di HP (Chrome / Safari), ketikkan alamat tersebut.
4. Anda dapat mengelola kos langsung dari HP Anda sambil keliling mengecek kamar!

---

## Backup Database
Seluruh data kamar, penghuni, riwayat log, dan transaksi tersimpan rapi dalam satu file lokal:
`server/kos_database.sqlite`
Untuk membuat cadangan (backup), Anda cukup menyalin file tersebut ke Google Drive atau flashdisk sewaktu-waktu.
