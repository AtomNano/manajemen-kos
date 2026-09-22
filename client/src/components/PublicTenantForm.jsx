import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  BedDouble, 
  Calendar, 
  Users, 
  MapPin, 
  Phone, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  MessageCircle, 
  Copy,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { formatRupiah, formatDate, cleanPhoneForWA } from '../utils/formatters';

export default function PublicTenantForm({ roomId, onBackToAdmin }) {
  const [loading, setLoading] = useState(true);
  const [roomData, setRoomData] = useState(null);
  const [kosData, setKosData] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [copiedRek, setCopiedRek] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    representative_name: '',
    emergency_contact: '',
    emergency_relation: '',
    address: '',
    occupants_count: 1,
    check_in_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (!roomId) {
      setError('Nomor kamar tidak ditentukan dalam tautan.');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/public/rooms/${roomId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRoomData(data.data.room);
          setKosData(data.data.kos);
        } else {
          setError(data.error || 'Kamar tidak ditemukan');
        }
      })
      .catch((err) => setError('Gagal memuat data kamar: ' + err.message))
      .finally(() => setLoading(false));
  }, [roomId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Nama Lengkap wajib diisi.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Nomor WhatsApp wajib diisi.');
      return;
    }
    if (!formData.emergency_contact.trim()) {
      setError('Nomor kontak darurat wajib diisi.');
      return;
    }
    if (!formData.address.trim()) {
      setError('Alamat asal / KTP wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/public/register/${roomData.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Pendaftaran gagal');
      }

      setSuccessData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyRekening = (num) => {
    navigator.clipboard.writeText(num);
    setCopiedRek(true);
    setTimeout(() => setCopiedRek(false), 2000);
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Memuat Formulir Pengekos...</p>
        </div>
      </div>
    );
  }

  // 2. Success Screen (After Submitting)
  if (successData) {
    const ownerWA = cleanPhoneForWA(kosData?.owner_phone || '');
    const waText = encodeURIComponent(
      `Halo ${kosData?.owner_name || 'Pengelola Kos'}, saya *${formData.name}* baru saja mengisi formulir pendaftaran sewa untuk *${roomData?.room_number}* di *${kosData?.kos_name || 'Kos'}*. Rencana masuk tanggal ${formatDate(formData.check_in_date)}. Mohon konfirmasinya. Terima kasih! 🙏`
    );
    const waUrl = `https://wa.me/${ownerWA}?text=${waText}`;

    return (
      <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 flex justify-center items-center">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          {/* Top Banner */}
          <div className="bg-emerald-600 text-white p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black">Pendaftaran Berhasil!</h2>
            <p className="text-emerald-100 text-sm mt-1">
              Selamat bergabung di <b>{kosData?.kos_name || 'Kos'}</b>
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Booking Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ringkasan Pendaftaran
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Kamar Dipesan:</span>
                <span className="text-base font-black text-slate-800">{roomData?.room_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Nama Penghuni:</span>
                <span className="text-sm font-bold text-slate-800">{formData.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Rencana Masuk:</span>
                <span className="text-sm font-bold text-slate-800">{formatDate(formData.check_in_date)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-600">Biaya Sewa / Bulan:</span>
                <span className="text-lg font-black text-emerald-600">{formatRupiah(roomData?.price)}</span>
              </div>
            </div>

            {/* Payment Account Instructions */}
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 text-xs">
              <h4 className="font-bold text-blue-900 uppercase tracking-wider">
                Informasi Pembayaran Sewa
              </h4>
              <p className="text-blue-800">
                Untuk mengamankan kamar dan melunasi sewa pertama, silakan transfer ke rekening resmi pengelola kos berikut:
              </p>
              <div className="p-3.5 bg-white rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase">{kosData?.bank_name || 'Bank'}</p>
                  <p className="text-base font-mono font-black text-slate-800">{kosData?.bank_account_number || '-'}</p>
                  <p className="text-xs text-slate-600">a.n. {kosData?.bank_account_name || 'Pemilik Kos'}</p>
                </div>
                <button
                  onClick={() => handleCopyRekening(kosData?.bank_account_number || '')}
                  className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedRek ? 'Tersalin!' : 'Salin'}
                </button>
              </div>
            </div>

            {/* Confirmation to Owner via WhatsApp */}
            <div className="space-y-3">
              <p className="text-xs text-slate-500 text-center">
                Setelah transfer atau untuk konfirmasi serah terima kunci, silakan hubungi pengelola:
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 text-center flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <MessageCircle className="w-5 h-5" />
                Konfirmasi ke Pengelola via WhatsApp
              </a>
            </div>

            {onBackToAdmin && (
              <div className="pt-2 text-center">
                <button
                  onClick={onBackToAdmin}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Kembali ke Panel Pengelola
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Error or Unavailable Room Screen
  if (roomData && roomData.status !== 'tersedia') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <BedDouble className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {roomData.room_number} Sudah Tidak Tersedia
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Mohon maaf, kamar ini saat ini sedang <b>{roomData.status === 'terisi' ? 'terisi oleh penghuni lain' : 'dalam perbaikan'}</b>.
            Silakan hubungi pengelola kos untuk mengecek ketersediaan kamar lainnya.
          </p>

          {kosData?.owner_phone && (
            <a
              href={`https://wa.me/${cleanPhoneForWA(kosData.owner_phone)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Tanya Kamar Lain ke Pengelola
            </a>
          )}

          {onBackToAdmin && (
            <div className="pt-3">
              <button
                onClick={onBackToAdmin}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Kembali ke Dashboard Admin
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. Main Google-Form-Style Registration Form
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Branding Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 border-t-8 border-t-emerald-600 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-3">
                <Building2 className="w-3.5 h-3.5" /> {kosData?.kos_name || 'Kos'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Formulir Pendaftaran Pengekos
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Silakan lengkapi data diri Anda di bawah ini untuk pendaftaran sewa kamar. Data akan tercatat langsung di sistem pengelola kos.
              </p>
            </div>
          </div>

          {/* Selected Room Details Banner */}
          {roomData && (
            <div className="mt-6 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  <BedDouble className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-800">{roomData.room_number}</h3>
                    <span className="text-xs text-slate-500 font-medium">({roomData.name})</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Lantai {roomData.floor} • Kapasitas: <b>{roomData.capacity} Orang</b>
                  </p>
                </div>
              </div>

              <div className="sm:text-right">
                <p className="text-[11px] text-slate-400 font-semibold">Harga Sewa</p>
                <p className="text-lg font-black text-emerald-700">{formatRupiah(roomData.price)}<span className="text-xs font-normal text-slate-500">/bln</span></p>
              </div>
            </div>
          )}

          {roomData?.facilities && (
            <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-700">Fasilitas Kamar:</span> {roomData.facilities}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card 1: Identitas Pengekos */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
              1. Identitas Penyewa
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap Anda <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan nama lengkap sesuai KTP"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nomor ini akan digunakan untuk notifikasi jatuh tempo dan komunikasi kos.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alamat Asal / Alamat KTP <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="2"
                required
                placeholder="Contoh: Jl. Sudirman No. 45, Padang"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Berapa Orang yang Tinggal di Kamar? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={roomData?.capacity || 4}
                  required
                  value={formData.occupants_count}
                  onChange={(e) => setFormData({ ...formData, occupants_count: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Maksimal kapasitas kamar ini: {roomData?.capacity || 1} orang
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Rencana Tanggal Masuk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.check_in_date}
                  onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Wali & Kontak Darurat */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
              2. Wali & Kontak Darurat
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Wali / Penanggung Jawab (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Bpk. Bambang (Orang Tua / Wali)"
                value={formData.representative_name}
                onChange={(e) => setFormData({ ...formData, representative_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  No. Telepon Kontak Darurat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 085712345678"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Hubungan Kerabat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibu Kandung / Kakak"
                  value={formData.emergency_relation}
                  onChange={(e) => setFormData({ ...formData, emergency_relation: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Catatan */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
              3. Catatan Tambahan (Opsional)
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pesan untuk Pengelola Kos
              </label>
              <textarea
                rows="2"
                placeholder="Contoh: Membawa 1 unit motor Vario, mahasiswa tingkat akhir"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              {submitting ? 'Mengirimkan Formulir...' : 'Kirim Formulir Pendaftaran Sekarang'}
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Dengan mengirimkan formulir ini, Anda menyetujui ketentuan dan tata tertib sewa di {kosData?.kos_name || 'Kos'}.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
