import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function PaymentModal({ isOpen, onClose, onSuccess, tenant }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    amount: '',
    payment_date: todayStr,
    period_start: todayStr,
    period_end: todayStr,
    payment_method: 'Transfer BCA',
    notes: '',
  });

  useEffect(() => {
    if (!isOpen || !tenant) return;

    // Calculate default period start and end
    let start = new Date();
    if (tenant.latest_payment && tenant.latest_payment.period_end) {
      start = new Date(tenant.latest_payment.period_end);
    } else if (tenant.check_in_date) {
      start = new Date(tenant.check_in_date);
    }

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    setFormData({
      amount: tenant.rent_price || '',
      payment_date: todayStr,
      period_start: start.toISOString().split('T')[0],
      period_end: end.toISOString().split('T')[0],
      payment_method: 'Transfer Bank',
      notes: '',
    });
    setError('');
  }, [isOpen, tenant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Nominal pembayaran harus lebih dari 0.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id || tenant.tenant_id,
          amount: Number(formData.amount),
          payment_date: formData.payment_date,
          period_start: formData.period_start,
          period_end: formData.period_end,
          payment_method: formData.payment_method,
          notes: formData.notes,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mencatat pembayaran');
      }

      onSuccess('Pembayaran berhasil dicatat!');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Catat Pembayaran Sewa</h2>
              <p className="text-xs text-slate-600">
                Penghuni: <b>{tenant.name || tenant.tenant_name}</b> ({tenant.room_number})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/50"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nominal Bayar (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal Pembayaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Periode Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.period_start}
                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Periode Selesai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.period_end}
                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="Transfer Bank BCA">Transfer Bank BCA</option>
              <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
              <option value="Transfer Bank BRI">Transfer Bank BRI</option>
              <option value="Transfer Bank BNI">Transfer Bank BNI</option>
              <option value="Tunai / Cash">Tunai / Cash</option>
              <option value="QRIS / E-Wallet">QRIS / GoPay / OVO / Dana</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catatan / No. Referensi Transfer
            </label>
            <input
              type="text"
              placeholder="Contoh: Transfer atas nama Budi via m-BCA"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
