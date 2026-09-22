import React, { useState } from 'react';
import { 
  CreditCard, 
  MessageCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Copy, 
  ExternalLink,
  Calendar,
  X
} from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/formatters';

export default function PaymentReminder({ dues, onRefresh, onOpenPayment }) {
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'TERLAMBAT' | 'MENDEKATI' | 'LUNAS'
  const [previewItem, setPreviewItem] = useState(null);
  const [copied, setCopied] = useState(false);

  const filteredDues = (dues || []).filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  const overdueCount = (dues || []).filter((d) => d.status === 'TERLAMBAT').length;
  const upcomingCount = (dues || []).filter((d) => d.status === 'MENDEKATI').length;
  const paidCount = (dues || []).filter((d) => d.status === 'LUNAS').length;

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Pengingat Tagihan & Notifikasi WhatsApp
          </h2>
          <p className="text-xs text-slate-500">
            Jatuh tempo sewa dihitung otomatis dari tanggal masuk pengekos. Klik tombol Kirim WA untuk mengirim pesan penagihan langsung.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
        >
          Perbarui Data
        </button>
      </div>

      {/* 3 Status Filter Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'ALL'
              ? 'border-slate-800 bg-slate-800 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider block font-bold opacity-75">Semua Tagihan</span>
          <span className="text-xl font-black mt-1 block">{(dues || []).length}</span>
        </button>

        <button
          onClick={() => setFilterStatus('TERLAMBAT')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'TERLAMBAT'
              ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
              : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider block font-bold opacity-75">Lewat Tempo</span>
          <span className="text-xl font-black mt-1 block">{overdueCount}</span>
        </button>

        <button
          onClick={() => setFilterStatus('MENDEKATI')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'MENDEKATI'
              ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
              : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider block font-bold opacity-75">Mendekati (H-5)</span>
          <span className="text-xl font-black mt-1 block">{upcomingCount}</span>
        </button>

        <button
          onClick={() => setFilterStatus('LUNAS')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'LUNAS'
              ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider block font-bold opacity-75">Lunas Berjalan</span>
          <span className="text-xl font-black mt-1 block">{paidCount}</span>
        </button>
      </div>

      {/* Dues List */}
      <div className="space-y-3">
        {filteredDues.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada data tagihan dalam kategori ini.</p>
          </div>
        ) : (
          filteredDues.map((item) => {
            const isOverdue = item.status === 'TERLAMBAT';
            const isUpcoming = item.status === 'MENDEKATI';
            const isPaid = item.status === 'LUNAS';

            let cardBorder = 'border-slate-200 bg-white';
            let badgeStyle = 'bg-emerald-100 text-emerald-800';
            let badgeText = 'Lunas';

            if (isOverdue) {
              cardBorder = 'border-rose-200 bg-rose-50/30';
              badgeStyle = 'bg-rose-100 text-rose-800 font-black';
              badgeText = `Terlambat ${Math.abs(item.diff_days)} Hari`;
            } else if (isUpcoming) {
              cardBorder = 'border-amber-200 bg-amber-50/30';
              badgeStyle = 'bg-amber-100 text-amber-800 font-black';
              badgeText = `Jatuh Tempo dlm ${item.diff_days} Hari`;
            }

            return (
              <div
                key={item.tenant_id}
                className={`p-5 rounded-2xl border ${cardBorder} shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                {/* Info Left */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Kamar</span>
                    <span className="text-xs font-black">{item.room_number.replace('Kamar ', '')}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-800">{item.tenant_name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs ${badgeStyle}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                      <span>
                        Sewa: <b className="text-emerald-700 font-bold">{formatRupiah(item.rent_price)}</b>/bln
                      </span>
                      <span>
                        Masuk: {formatDate(item.check_in_date)} (Siklus tgl {item.billing_day})
                      </span>
                      <span>
                        Jatuh Tempo: <b>{item.formatted_due_date}</b>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Right */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Preview Pesan
                  </button>

                  <button
                    onClick={() => onOpenPayment(item)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Catat Bayar
                  </button>

                  <a
                    href={item.wa_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 transition-all hover:scale-105 flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Kirim WA
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* WhatsApp Message Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-800">
                  Preview Pesan WhatsApp ({previewItem.tenant_name})
                </h3>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-500">
                Nomor Tujuan: <b>{previewItem.phone}</b> ({previewItem.clean_phone})
              </div>

              {/* Chat Bubble UI */}
              <div className="p-4 rounded-2xl bg-[#EFEAE2] border border-slate-200 text-slate-800 text-xs whitespace-pre-wrap font-sans leading-relaxed">
                <div className="bg-white p-3.5 rounded-xl rounded-tl-none shadow-sm inline-block w-full">
                  {previewItem.wa_message}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(previewItem.wa_message)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Tersalin!' : 'Salin Teks'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewItem(null)}
                    className="px-3.5 py-1.5 text-xs text-slate-500 font-medium hover:text-slate-700"
                  >
                    Tutup
                  </button>
                  <a
                    href={previewItem.wa_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Buka di WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
