import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Wifi, 
  CreditCard, 
  MessageSquare, 
  Smartphone, 
  CheckCircle, 
  AlertCircle,
  Lock
} from 'lucide-react';

export default function SettingsModal({ onUpdateKosName }) {
  const [settings, setSettings] = useState({
    kos_name: '',
    owner_name: '',
    owner_phone: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    reminder_template: '',
    pin: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSettings(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessage('Pengaturan berhasil disimpan!');
      if (onUpdateKosName) onUpdateKosName(settings.kos_name);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInsertTag = (tag) => {
    setSettings((prev) => ({
      ...prev,
      reminder_template: (prev.reminder_template || '') + ' ' + tag,
    }));
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Pengaturan Sistem & Pengelola Kos
          </h2>
          <p className="text-xs text-slate-500">
            Atur profil kos, rekening penerimaan sewa, dan template pengingat WhatsApp.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {error}
        </div>
      )}

      {/* Form Settings */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Profil Kos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            Informasi Kos & Pengelola
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Rumah Kos</label>
              <input
                type="text"
                value={settings.kos_name}
                onChange={(e) => setSettings({ ...settings, kos_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pengelola / Pemilik</label>
              <input
                type="text"
                value={settings.owner_name}
                onChange={(e) => setSettings({ ...settings, owner_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp Pengelola</label>
              <input
                type="text"
                value={settings.owner_phone}
                onChange={(e) => setSettings({ ...settings, owner_phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Rekening Bank */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            Rekening Bank Penerima Sewa (Ditampilkan di Tagihan WA)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Bank</label>
              <input
                type="text"
                placeholder="Contoh: BCA / Mandiri / BRI"
                value={settings.bank_name}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Rekening</label>
              <input
                type="text"
                placeholder="Contoh: 1234567890"
                value={settings.bank_account_number}
                onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Atas Nama (Pemilik Rekening)</label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={settings.bank_account_name}
                onChange={(e) => setSettings({ ...settings, bank_account_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Template Pengingat WhatsApp */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Template Pesan Pengingat Sewa WhatsApp
            </h3>
          </div>

          <p className="text-xs text-slate-500">
            Klik tag di bawah ini untuk memasukkan variabel otomatis ke dalam pesan:
          </p>

          {/* Variable pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              '{NAMA_PENGHUNI}',
              '{NOMOR_KAMAR}',
              '{TANGGAL_JATUH_TEMPO}',
              '{NOMINAL_SEWA}',
              '{NAMA_BANK}',
              '{NOMOR_REKENING}',
              '{ATAS_NAMA}',
              '{NAMA_KOS}',
            ].map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => handleInsertTag(tag)}
                className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-mono font-bold border border-emerald-200 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>

          <textarea
            rows="9"
            value={settings.reminder_template}
            onChange={(e) => setSettings({ ...settings, reminder_template: e.target.value })}
            className="w-full p-3.5 rounded-xl border border-slate-300 text-xs font-sans leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
          />
        </div>

        {/* Card 4: Keamanan & PIN Pengelola */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            Keamanan & PIN Pengelola Kos
          </h3>
          <p className="text-xs text-slate-500">
            PIN ini digunakan untuk mengunci dashboard manajemen agar hanya Anda yang dapat mengakses data kamar, penghuni, dan keuangan. Calon penghuni kos yang membuka form pendaftaran mandiri tidak akan melihat panel ini.
          </p>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              PIN Pengelola (Angka/Karakter)
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 1234"
              value={settings.pin || ''}
              onChange={(e) => setSettings({ ...settings, pin: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono tracking-widest font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Card 5: Panduan Akses Jaringan Lokal (Wi-Fi Rumah) */}
        <div className="bg-blue-50/70 p-6 rounded-2xl border border-blue-200 space-y-3">
          <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-blue-600" />
            Panduan Akses Melalui HP / Laptop di Jaringan Wi-Fi Rumah
          </h3>
          <p className="text-xs text-blue-800 leading-relaxed">
            Aplikasi ini berjalan di komputer rumah Anda dan dapat diakses oleh HP atau laptop lain selama terhubung ke jaringan Wi-Fi yang sama:
          </p>
          <ul className="text-xs text-blue-700 list-disc list-inside space-y-1 bg-white/70 p-3 rounded-xl border border-blue-200">
            <li>Buka browser (Google Chrome / Safari) di HP Anda yang tersambung ke Wi-Fi kos.</li>
            <li>
              Ketik alamat IP komputer ini di browser HP, misalnya: <b>http://192.168.1.xxx:5000</b> (alamat IP tampil di jendela hitam server saat dijalankan).
            </li>
            <li>Anda bisa bookmark atau simpan halaman ini di beranda HP Anda layaknya aplikasi asli!</li>
          </ul>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
}
