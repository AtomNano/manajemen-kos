import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Calendar, 
  MapPin, 
  ShieldAlert, 
  CreditCard, 
  LogOut, 
  Edit3, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle,
  X,
  History,
  FileText
} from 'lucide-react';
import { formatRupiah, formatDate, formatDateTime, cleanPhoneForWA } from '../utils/formatters';

export default function TenantManager({ 
  onRefresh, 
  onOpenPayment, 
  onOpenCheckIn 
}) {
  const [activeFilter, setActiveFilter] = useState('aktif'); // 'aktif' | 'keluar'
  const [searchQuery, setSearchQuery] = useState('');
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Check-out modal state
  const [checkoutTenant, setCheckoutTenant] = useState(null);
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  // Edit tenant modal state
  const [editingTenant, setEditingTenant] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchTenants = () => {
    setLoading(true);
    fetch(`/api/tenants?status=${activeFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTenants(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTenants();
  }, [activeFilter]);

  const handleOpenDetail = async (tenant) => {
    setSelectedTenant(tenant);
    setIsDetailOpen(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}`);
      const data = await res.json();
      if (data.success) {
        setDetailData(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (tenant) => {
    setEditingTenant(tenant);
    setEditFormData({
      name: tenant.name,
      representative_name: tenant.representative_name || '',
      phone: tenant.phone,
      emergency_contact: tenant.emergency_contact || '',
      emergency_relation: tenant.emergency_relation || '',
      address: tenant.address || '',
      occupants_count: tenant.occupants_count,
      rent_price: tenant.rent_price,
      deposit: tenant.deposit || 0,
      notes: tenant.notes || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    try {
      const res = await fetch(`/api/tenants/${editingTenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setEditingTenant(null);
      fetchTenants();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Gagal update pengekos: ' + err.message);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handlePerformCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutTenant) return;

    setSubmittingCheckout(true);
    try {
      const res = await fetch(`/api/tenants/${checkoutTenant.id}/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_out_date: checkoutDate,
          checkout_notes: checkoutNotes,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setCheckoutTenant(null);
      setCheckoutNotes('');
      fetchTenants();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Gagal check-out: ' + err.message);
    } finally {
      setSubmittingCheckout(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(query) ||
      t.room_number.toLowerCase().includes(query) ||
      t.phone.toLowerCase().includes(query) ||
      (t.representative_name && t.representative_name.toLowerCase().includes(query)) ||
      (t.address && t.address.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Pengekos (Penyewa)</h2>
          <p className="text-xs text-slate-500">
            Kelola data identitas, perwakilan, nomor WhatsApp, kontak darurat, serta alur masuk & keluar.
          </p>
        </div>

        <button
          onClick={onOpenCheckIn}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-all hover:scale-105 active:scale-95"
        >
          + Check-In Pengekos Baru
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('aktif')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeFilter === 'aktif'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Penghuni Aktif ({activeFilter === 'aktif' ? tenants.length : '...'})
          </button>
          <button
            onClick={() => setActiveFilter('keluar')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeFilter === 'keluar'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Riwayat Mantan Penghuni ({activeFilter === 'keluar' ? tenants.length : '...'})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, kamar, WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tenants Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          Memuat data pengekos...
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">
            {activeFilter === 'aktif'
              ? 'Belum ada penghuni aktif.'
              : 'Belum ada riwayat mantan penghuni yang keluar.'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Klik tombol "+ Check-In Pengekos Baru" untuk menambahkan penghuni.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTenants.map((t) => {
            const isOut = t.status === 'keluar';
            const cleanPhone = cleanPhoneForWA(t.phone);

            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Upper Details */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-800">{t.name}</h3>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black">
                          {t.room_number}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{t.room_name}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOut ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isOut ? 'Sudah Keluar' : `${t.occupants_count} Orang dlm Kamar`}
                    </span>
                  </div>

                  {/* Representative & Address */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block">Perwakilan / Wali</span>
                      <span className="font-semibold text-slate-700">{t.representative_name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block">Biaya Sewa</span>
                      <span className="font-bold text-emerald-600">{formatRupiah(t.rent_price)}/bln</span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp:
                      </span>
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        {t.phone} <MessageCircle className="w-3 h-3 text-emerald-600" />
                      </a>
                    </div>

                    {t.emergency_contact && (
                      <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/50">
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Kontak Darurat ({t.emergency_relation || 'Kerabat'}):
                        </span>
                        <span className="font-semibold text-slate-700">{t.emergency_contact}</span>
                      </div>
                    )}

                    {t.address && (
                      <div className="flex items-start gap-1.5 text-slate-500 pt-1 border-t border-slate-200/50">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{t.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3 px-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Masuk: <b>{formatDate(t.check_in_date)}</b>
                    </span>
                    {isOut ? (
                      <span className="text-rose-600 font-semibold">
                        Keluar: {formatDate(t.check_out_date)}
                      </span>
                    ) : (
                      <span>
                        Jatuh tempo tgl: <b>{t.billing_day}</b>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenDetail(t)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <FileText className="w-4 h-4" /> Riwayat
                    </button>
                    {!isOut && (
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                    )}
                  </div>

                  {!isOut && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenPayment(t)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Bayar
                      </button>
                      <button
                        onClick={() => setCheckoutTenant(t)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Check-Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Check-Out Confirmation Modal */}
      {checkoutTenant && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2.5 text-rose-700">
                <LogOut className="w-5 h-5" />
                <h3 className="text-base font-bold">Konfirmasi Check-Out Penghuni</h3>
              </div>
              <button
                onClick={() => setCheckoutTenant(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePerformCheckout} className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Anda akan meng-checkout <b>{checkoutTenant.name}</b> dari{' '}
                <b>{checkoutTenant.room_number}</b>. Kamar ini akan otomatis kembali berstatus <b>Tersedia (Kosong)</b>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Keluar Resmi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={checkoutDate}
                  onChange={(e) => setCheckoutDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Check-out / Kondisi Kamar / Pengembalian Deposit
                </label>
                <textarea
                  rows="3"
                  placeholder="Contoh: Kunci kamar sudah dikembalikan lengkap, deposit Rp 200.000 sudah ditransfer balik."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutTenant(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCheckout}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white text-sm font-bold rounded-lg shadow-sm"
                >
                  {submittingCheckout ? 'Memproses...' : 'Ya, Check-Out Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
              <h3 className="text-base font-bold text-slate-800">
                Edit Data Penghuni: {editingTenant.name}
              </h3>
              <button
                onClick={() => setEditingTenant(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pengekos
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Perwakilan / Wali
                  </label>
                  <input
                    type="text"
                    value={editFormData.representative_name}
                    onChange={(e) => setEditFormData({ ...editFormData, representative_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berapa Orang dlm Kamar
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editFormData.occupants_count}
                    onChange={(e) => setEditFormData({ ...editFormData, occupants_count: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kontak Darurat
                  </label>
                  <input
                    type="text"
                    value={editFormData.emergency_contact}
                    onChange={(e) => setEditFormData({ ...editFormData, emergency_contact: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hubungan Kontak Darurat
                  </label>
                  <input
                    type="text"
                    value={editFormData.emergency_relation}
                    onChange={(e) => setEditFormData({ ...editFormData, emergency_relation: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Asal / KTP
                </label>
                <textarea
                  rows="2"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Biaya Sewa (Rp)
                  </label>
                  <input
                    type="number"
                    value={editFormData.rent_price}
                    onChange={(e) => setEditFormData({ ...editFormData, rent_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deposit (Rp)
                  </label>
                  <input
                    type="number"
                    value={editFormData.deposit}
                    onChange={(e) => setEditFormData({ ...editFormData, deposit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-sm font-bold rounded-lg shadow-sm"
                >
                  {submittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenant History & Detail Drawer */}
      {isDetailOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  {selectedTenant.room_number}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{selectedTenant.name}</h3>
                  <p className="text-xs text-slate-500">
                    Masuk sejak: {formatDate(selectedTenant.check_in_date)} • {selectedTenant.occupants_count} orang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Payment Records */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" /> Riwayat Pembayaran Sewa
                </h4>
                {detailData?.payments?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg">
                    Belum ada riwayat pembayaran tercatat.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detailData?.payments?.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {formatRupiah(p.amount)}
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            Periode: {formatDate(p.period_start)} s/d {formatDate(p.period_end)}
                          </p>
                          {p.notes && <p className="text-slate-400 text-[11px] mt-0.5">Ket: {p.notes}</p>}
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[10px]">
                            {p.payment_method}
                          </span>
                          <p className="text-slate-400 text-[11px] mt-1">{formatDate(p.payment_date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Logs related to tenant */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-600" /> Log Aktivitas Penghuni Ini
                </h4>
                <div className="space-y-2">
                  {detailData?.logs?.map((l) => (
                    <div key={l.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-bold text-slate-600">{l.event_type}</span>
                        <span>{formatDateTime(l.created_at)}</span>
                      </div>
                      <p className="text-slate-700">{l.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
