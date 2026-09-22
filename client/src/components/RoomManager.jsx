import React, { useState } from 'react';
import { 
  BedDouble, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  UserCheck, 
  Wrench,
  X,
  Phone,
  Calendar,
  Layers,
  Copy,
  MessageCircle
} from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/formatters';

export default function RoomManager({ 
  rooms, 
  onRefresh, 
  onOpenCheckInWithRoom, 
  onOpenTenantDetail 
}) {
  const [filterFloor, setFilterFloor] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [copiedRoomId, setCopiedRoomId] = useState(null);
  const [formData, setFormData] = useState({
    room_number: '',
    name: '',
    floor: 1,
    price: '',
    capacity: 1,
    facilities: '',
    status: 'tersedia',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getFormUrl = (room) => {
    return `${window.location.origin}/daftar/${room.id}`;
  };

  const handleCopyFormLink = (room) => {
    const url = getFormUrl(room);
    navigator.clipboard.writeText(url);
    setCopiedRoomId(room.id);
    setTimeout(() => setCopiedRoomId(null), 2000);
  };

  const handleShareFormWA = (room) => {
    const url = getFormUrl(room);
    const text = encodeURIComponent(
      `Halo Kak! Silakan isi formulir pendaftaran sewa kos untuk *${room.room_number}* (${formatRupiah(room.price)}/bln) di tautan berikut:\n\n👉 ${url}\n\nSetelah diisi, data akan langsung tercatat dan kamar akan diamankan untuk Kakak. Terima kasih! 🙏😊`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  const filteredRooms = rooms.filter((r) => {
    if (filterFloor !== 'ALL' && r.floor !== Number(filterFloor)) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData({
      room_number: `Kamar ${String(rooms.length + 1).padStart(2, '0')}`,
      name: `Kamar ${String(rooms.length + 1).padStart(2, '0')} (Lantai 1)`,
      floor: 1,
      price: 850000,
      capacity: 1,
      facilities: 'Kasur, Lemari, Kamar Mandi Dalam',
      status: 'tersedia',
      notes: '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      name: room.name,
      floor: room.floor,
      price: room.price,
      capacity: room.capacity,
      facilities: room.facilities || '',
      status: room.status,
      notes: room.notes || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleDeleteRoom = async (room) => {
    if (room.status === 'terisi') {
      alert('Tidak bisa menghapus kamar yang sedang terisi penghuni. Lakukan check-out terlebih dahulu.');
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus ${room.room_number} (${room.name})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/rooms/${room.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onRefresh();
    } catch (err) {
      alert('Gagal menghapus kamar: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms';
    const method = editingRoom ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Daftar Kamar Kos</h2>
          <p className="text-xs text-slate-500">
            Total {rooms.length} Kamar terdaftar. Anda dapat menambah atau menyesuaikan fasilitas dan harga setiap kamar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + Tambah Kamar Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 text-sm">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4" /> Filter:
        </span>

        {/* Floor filter */}
        <select
          value={filterFloor}
          onChange={(e) => setFilterFloor(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">Semua Lantai</option>
          {floors.map((fl) => (
            <option key={fl} value={fl}>
              Lantai {fl}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">Semua Status</option>
          <option value="tersedia">Tersedia (Kosong)</option>
          <option value="terisi">Terisi (Pengekos)</option>
          <option value="perbaikan">Dalam Perbaikan</option>
        </select>

        <span className="text-xs text-slate-400 ml-auto font-medium">
          Menampilkan {filteredRooms.length} dari {rooms.length} kamar
        </span>
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map((room) => {
          const isOccupied = room.status === 'terisi';
          const isMaintenance = room.status === 'perbaikan';

          let statusBadge = (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" /> Tersedia
            </span>
          );

          if (isOccupied) {
            statusBadge = (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800">
                <UserCheck className="w-3.5 h-3.5" /> Terisi ({room.occupants_count || 1} org)
              </span>
            );
          } else if (isMaintenance) {
            statusBadge = (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
                <Wrench className="w-3.5 h-3.5" /> Perbaikan
              </span>
            );
          }

          return (
            <div
              key={room.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                isOccupied ? 'border-blue-200' : 'border-slate-200'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Lantai {room.floor}
                    </span>
                    <h3 className="text-lg font-black text-slate-800">{room.room_number}</h3>
                    <p className="text-xs text-slate-500">{room.name}</p>
                  </div>
                  {statusBadge}
                </div>

                {/* Price & Capacity */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Harga Sewa</p>
                    <p className="text-base font-black text-emerald-600">{formatRupiah(room.price)}/bln</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400 font-medium">Kapasitas</p>
                    <p className="text-xs font-bold text-slate-700">{room.capacity} Orang</p>
                  </div>
                </div>

                {/* Facilities */}
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Fasilitas:</p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                    {room.facilities || 'Kasur, Lemari'}
                  </p>
                </div>

                {/* Occupant Info if Occupied */}
                {isOccupied && (
                  <div className="mt-3.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                    <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                      Pengekos Saat Ini:
                    </p>
                    <p className="text-sm font-black text-slate-800">{room.tenant_name}</p>
                    <div className="flex items-center gap-3 text-slate-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-blue-600" /> {room.tenant_phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-600" /> Tgl {room.billing_day}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer / Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(room)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Kamar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room)}
                    disabled={isOccupied}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
                    title={isOccupied ? 'Tidak bisa hapus kamar yang sedang terisi' : 'Hapus Kamar'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {isOccupied ? (
                  <button
                    onClick={() => onOpenTenantDetail(room.active_tenant_id)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                  >
                    Detail Penghuni
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyFormLink(room)}
                      title="Salin Link Formulir Pendaftaran Mandiri"
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 text-[11px] font-bold"
                    >
                      <Copy className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{copiedRoomId === room.id ? 'Tersalin!' : 'Link Form'}</span>
                    </button>
                    <button
                      onClick={() => handleShareFormWA(room)}
                      title="Kirim Link Form via WhatsApp ke Calon Penghuni"
                      className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg bg-emerald-50 border border-emerald-200 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenCheckInWithRoom(room.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                    >
                      + Isi Manual
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                {editingRoom ? 'Edit Data Kamar' : 'Tambah Kamar Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Kamar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kamar 08"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lantai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama / Label Kamar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kamar 08 (Lantai 2 Depan)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Sewa per Bulan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="850000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapasitas Maksimal (Orang)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Kamar
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="tersedia">Tersedia (Kosong)</option>
                  <option value="terisi">Terisi (Pengekos)</option>
                  <option value="perbaikan">Perbaikan / Renovasi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fasilitas Kamar
                </label>
                <textarea
                  rows="2"
                  placeholder="Contoh: AC 1/2 PK, Kasur Springbed, Lemari 2 Pintu, Kamar Mandi Dalam"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dekat jendela samping"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Kamar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
