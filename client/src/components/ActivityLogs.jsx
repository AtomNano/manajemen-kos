import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  UserPlus, 
  LogOut, 
  CreditCard, 
  BedDouble, 
  Settings, 
  Filter,
  RefreshCw
} from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const fetchLogs = () => {
    setLoading(true);
    let url = '/api/logs?limit=100';
    if (filterType !== 'ALL') {
      url += `&event_type=${filterType}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setLogs(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [filterType]);

  const getEventBadge = (type) => {
    switch (type) {
      case 'CHECK_IN':
        return {
          icon: UserPlus,
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          label: 'Masuk (Check-In)'
        };
      case 'CHECK_OUT':
        return {
          icon: LogOut,
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          label: 'Keluar (Check-Out)'
        };
      case 'PAYMENT':
        return {
          icon: CreditCard,
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          label: 'Pembayaran'
        };
      case 'ROOM_UPDATE':
        return {
          icon: BedDouble,
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          label: 'Data Kamar'
        };
      case 'TENANT_UPDATE':
        return {
          icon: Settings,
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          label: 'Data Pengekos'
        };
      default:
        return {
          icon: Clock,
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          label: 'Sistem'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Riwayat Log & Audit Kos
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan otomatis seluruh riwayat aktivitas: siapa yang masuk, siapa yang keluar, dan pembayaran sewa.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Segarkan
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <span className="font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {[
          { id: 'ALL', label: 'Semua Aktivitas' },
          { id: 'CHECK_IN', label: 'Pengekos Masuk' },
          { id: 'CHECK_OUT', label: 'Pengekos Keluar' },
          { id: 'PAYMENT', label: 'Pembayaran Sewa' },
          { id: 'ROOM_UPDATE', label: 'Perubahan Kamar' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterType === tab.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {loading ? (
          <p className="text-center py-12 text-xs text-slate-400">Memuat log riwayat...</p>
        ) : logs.length === 0 ? (
          <p className="text-center py-12 text-xs text-slate-400">Belum ada riwayat aktivitas dalam kategori ini.</p>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
            {logs.map((log) => {
              const meta = getEventBadge(log.event_type);
              const Icon = meta.icon;

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 group-hover:scale-125 transition-transform" />

                  <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-100 p-4 rounded-xl transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${meta.bg}`}>
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                        {log.room_number && (
                          <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {log.room_number}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatDateTime(log.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {log.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
