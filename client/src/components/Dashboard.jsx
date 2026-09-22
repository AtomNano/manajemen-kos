import React from 'react';
import { 
  BedDouble, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  MessageCircle, 
  PlusCircle,
  Clock,
  TrendingUp,
  Building2
} from 'lucide-react';
import { formatRupiah, formatDate, formatDateTime } from '../utils/formatters';

export default function Dashboard({ 
  stats, 
  rooms, 
  dues, 
  recentLogs, 
  onOpenCheckIn, 
  onSelectRoom, 
  onOpenPayment, 
  setActiveTab 
}) {
  const pendingDues = (dues || []).filter(d => d.status === 'TERLAMBAT' || d.status === 'MENDEKATI');

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm mb-2">
            <Building2 className="w-3.5 h-3.5" /> Manajemen Kos Siap Pakai
          </span>
          <h2 className="text-2xl font-black tracking-tight">Selamat Datang di Pengelolaan Kos</h2>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            Sistem aktif mengelola <b>{stats?.totalRooms || 7} Kamar</b>. Pantau status kamar, penghuni aktif, dan kirim pengingat sewa WhatsApp langsung dari sini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCheckIn}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 text-sm font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            + Pengekos Baru
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Kamar */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Kamar</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800">{stats?.occupiedRooms || 0}</span>
              <span className="text-sm font-medium text-slate-500">/ {stats?.totalRooms || 7} Terisi</span>
            </div>
            <p className="text-xs font-semibold text-emerald-600 mt-1">
              {stats?.occupancyRate || 0}% Keterisian ({stats?.availableRooms || 0} Kamar Kosong)
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BedDouble className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Penghuni Aktif */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Penghuni Aktif</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800">{stats?.activeTenants || 0}</span>
              <span className="text-sm font-medium text-slate-500">Kamar ({stats?.totalOccupants || 0} Orang)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Bisa multi-penghuni per kamar</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Tagihan Jatuh Tempo */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perlu Ditagih</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-600">
                {(stats?.overdueCount || 0) + (stats?.upcomingCount || 0)}
              </span>
              <span className="text-sm font-medium text-slate-500">Penyewa</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.overdueCount || 0} terlambat, {stats?.upcomingCount || 0} mendekati (H-5)
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Pendapatan Bulan Ini */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendapatan Masuk</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-slate-800">
                {formatRupiah(stats?.incomeThisMonth || 0)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Potensi sewa: {formatRupiah(stats?.monthlyPotentialIncome || 0)}/bln
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid Status Kamar Visual */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Denah & Status Kamar</h3>
            <p className="text-xs text-slate-500">Klik kamar untuk melihat detail atau mendaftarkan pengekos</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Kosong ({stats?.availableRooms || 0})
            </span>
            <span className="inline-flex items-center gap-1.5 text-blue-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Terisi ({stats?.occupiedRooms || 0})
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Perbaikan ({stats?.maintenanceRooms || 0})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {(rooms || []).map((room) => {
            const isOccupied = room.status === 'terisi';
            const isMaintenance = room.status === 'perbaikan';

            let cardBg = 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400';
            let badgeBg = 'bg-emerald-100 text-emerald-800';
            let badgeText = 'Kosong';

            if (isOccupied) {
              cardBg = 'border-blue-200 bg-blue-50/50 hover:border-blue-400';
              badgeBg = 'bg-blue-100 text-blue-800';
              badgeText = 'Terisi';
            } else if (isMaintenance) {
              cardBg = 'border-amber-200 bg-amber-50/50 hover:border-amber-400';
              badgeBg = 'bg-amber-100 text-amber-800';
              badgeText = 'Perbaikan';
            }

            return (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className={`p-3.5 rounded-xl border text-left transition-all hover:shadow-md flex flex-col justify-between h-36 ${cardBg}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{room.room_number}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badgeBg}`}>
                      {badgeText}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">Lt. {room.floor}</p>
                </div>

                <div className="mt-2">
                  {isOccupied ? (
                    <div>
                      <p className="text-xs font-bold text-blue-900 line-clamp-1">
                        {room.tenant_name || 'Penghuni'}
                      </p>
                      <p className="text-[10px] text-blue-700">
                        {room.occupants_count || 1} orang • tgl {room.billing_day || '-'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-emerald-800">
                        {formatRupiah(room.price)}
                      </p>
                      <p className="text-[10px] text-emerald-600">+ Klik Isi Kamar</p>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column: Upcoming Dues (WhatsApp Ready) & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: WhatsApp Reminder Box */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                Pengingat Sewa & Tagihan
              </h3>
              <p className="text-xs text-slate-500">Kirim pesan tagihan otomatis via WhatsApp langsung ke HP penghuni</p>
            </div>
            <button
              onClick={() => setActiveTab('billing')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
            {pendingDues.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/60 mb-2" />
                <p className="text-sm font-medium text-slate-600">Semua tagihan sewa saat ini aman!</p>
                <p className="text-xs text-slate-400 mt-0.5">Tidak ada tagihan yang mendekati tempo atau terlambat.</p>
              </div>
            ) : (
              pendingDues.map((item) => {
                const isOverdue = item.status === 'TERLAMBAT';
                return (
                  <div
                    key={item.tenant_id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      isOverdue
                        ? 'border-rose-200 bg-rose-50/40'
                        : 'border-amber-200 bg-amber-50/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{item.tenant_name}</span>
                        <span className="text-[11px] font-semibold text-slate-600 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                          {item.room_number}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Tempo: <b>{item.formatted_due_date}</b> ({formatRupiah(item.rent_price)})
                      </p>
                      <span
                        className={`inline-block text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {isOverdue ? `Terlambat ${Math.abs(item.diff_days)} hari` : `Kurang ${item.diff_days} hari lagi`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenPayment(item)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Bayar
                      </button>
                      <a
                        href={item.wa_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Kirim WA
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Recent Activity Log */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" />
                Riwayat Log Terbaru
              </h3>
              <p className="text-xs text-slate-500">Catatan otomatis keluar/masuk dan transaksi</p>
            </div>
            <button
              onClick={() => setActiveTab('logs')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              Lihat Riwayat <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
            {(recentLogs || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Belum ada aktivitas tercatat.</p>
            ) : (
              (recentLogs || []).slice(0, 6).map((log) => {
                let badgeColor = 'bg-slate-100 text-slate-700';
                if (log.event_type === 'CHECK_IN') badgeColor = 'bg-emerald-100 text-emerald-800';
                if (log.event_type === 'CHECK_OUT') badgeColor = 'bg-rose-100 text-rose-800';
                if (log.event_type === 'PAYMENT') badgeColor = 'bg-blue-100 text-blue-800';

                return (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${badgeColor}`}>
                        {log.event_type}
                      </span>
                      <span className="text-slate-400 text-[11px]">{formatDateTime(log.created_at)}</span>
                    </div>
                    <p className="text-slate-700 leading-snug font-medium">{log.description}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
