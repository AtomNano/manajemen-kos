import React, { useState, useEffect } from 'react';
import { X, UserPlus, BedDouble, AlertCircle, CheckCircle } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function CheckInModal({ isOpen, onClose, onSuccess, preselectedRoomId }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    room_id: '',
    name: '',
    representative_name: '',
    phone: '',
    emergency_contact: '',
    emergency_relation: '',
    address: '',
    occupants_count: 1,
    check_in_date: new Date().toISOString().split('T')[0],
    billing_frequency: 1,
    rent_price: '',
    deposit: '',
    notes: '',
    initial_payment_paid: true,
  });

  // Fetch available rooms
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError('');

    fetch('/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const available = data.data.filter((r) => r.status === 'tersedia' || r.id === Number(preselectedRoomId));
          setRooms(available);

          if (preselectedRoomId) {
            const match = data.data.find((r) => r.id === Number(preselectedRoomId));
            if (match) {
              setFormData((prev) => ({
                ...prev,
                room_id: match.id,
                rent_price: match.price,
              }));
            }
          } else if (available.length > 0) {
            setFormData((prev) => ({
              ...prev,
              room_id: available[0].id,
              rent_price: available[0].price,
            }));
          }
        }
      })
      .catch((err) => setError('Gagal memuat daftar kamar: ' + err.message))
      .finally(() => setLoading(false));
  }, [isOpen, preselectedRoomId]);

  const handleRoomChange = (e) => {
    const roomId = e.target.value;
    const selected = rooms.find((r) => r.id === Number(roomId));
    setFormData((prev) => ({
      ...prev,
      room_id: roomId,
      rent_price: selected ? selected.price : prev.rent_price,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.room_id) {
      setError('Silakan pilih kamar yang akan ditempati.');
      return;
    }
    if (!formData.name.trim()) {
      setError('Nama pengekos wajib diisi.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Nomor WhatsApp wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/tenants/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Gagal melakukan check-in');
      }

      onSuccess(data.message);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Form Masuk Pengekos Baru (Check-In)</h2>
              <p className="text-xs text-slate-600">Catat penghuni baru & otomatis atur status kamar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Room Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Pilih Kamar yang Ditempati <span className="text-rose-500">*</span>
            </label>
            {loading ? (
              <p className="text-sm text-slate-500">Memuat kamar...</p>
            ) : rooms.length === 0 ? (
              <p className="text-sm text-rose-600 font-medium">
                Tidak ada kamar kosong yang tersedia saat ini.
              </p>
            ) : (
              <select
                value={formData.room_id}
                onChange={handleRoomChange}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.room_number} - {r.name} ({formatRupiah(r.price)}/bln - Kapasitas: {r.capacity} orang)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Section: Tenant Identity */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Identitas Pengekos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Lengkap Pengekos <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fauzi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nomor WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Perwakilan / Penanggung Jawab
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Orang tua / Kakak kandung"
                  value={formData.representative_name}
                  onChange={(e) => setFormData({ ...formData, representative_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jumlah Orang dalam Kamar
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.occupants_count}
                  onChange={(e) => setFormData({ ...formData, occupants_count: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Address */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Alamat Asal / KTP
              </label>
              <textarea
                rows="2"
                placeholder="Alamat domisili asal / kota asal"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section: Emergency Contact */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Kontak Darurat (Bisa Dihubungi)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  No. Telepon Kontak Darurat
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 085711223344"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Hubungan dengan Pengekos
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ibu Kandung / Paman"
                  value={formData.emergency_relation}
                  onChange={(e) => setFormData({ ...formData, emergency_relation: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Rent & Billing */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Jadwal & Biaya Sewa
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tanggal Masuk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.check_in_date}
                  onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Jatuh tempo setiap tgl: <b>{new Date(formData.check_in_date).getDate() || 1}</b>
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Biaya Sewa per Bulan (Rp)
                </label>
                <input
                  type="number"
                  placeholder="850000"
                  value={formData.rent_price}
                  onChange={(e) => setFormData({ ...formData, rent_price: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Uang Jaminan / Deposit (Rp)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Initial Payment Checkbox */}
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
              <input
                type="checkbox"
                id="initial_payment"
                checked={formData.initial_payment_paid}
                onChange={(e) => setFormData({ ...formData, initial_payment_paid: e.target.checked })}
                className="w-4 h-4 mt-1 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="initial_payment" className="text-xs text-slate-700 cursor-pointer">
                <span className="font-semibold text-emerald-900 block">
                  Langsung catat pembayaran uang sewa bulan pertama sebagai LUNAS
                </span>
                Nominal {formatRupiah(formData.rent_price || 0)} akan otomatis tercatat di data pembayaran untuk periode 1 bulan pertama.
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Bawa motor Scoopy hitam, mahasiswa Univ X"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Footer / Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || rooms.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg shadow-sm shadow-emerald-200 transition-all flex items-center gap-2"
            >
              {submitting ? 'Menyimpan...' : 'Simpan & Check-In Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
