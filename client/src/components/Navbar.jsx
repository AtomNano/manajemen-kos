import React, { useState, useEffect } from 'react';
import { Home, BedDouble, Users, CreditCard, Clock, Settings, UserPlus, Lock, Smartphone } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenCheckIn, kosName, onLogout }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsPwaInstalled(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'Untuk memasang aplikasi di HP:\n\n' +
        '• Android (Chrome/Edge): Ketuk menu titik tiga (⋮) di pojok kanan atas, lalu pilih "Instal Aplikasi" / "Tambahkan ke Layar Utama".\n' +
        '• iPhone (Safari): Ketuk tombol Share (kotak panah atas), lalu pilih "Add to Home Screen".'
      );
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Ringkasan', icon: Home },
    { id: 'rooms', label: 'Kamar', icon: BedDouble },
    { id: 'tenants', label: 'Penghuni', icon: Users },
    { id: 'billing', label: 'Tagihan & WA', icon: CreditCard },
    { id: 'logs', label: 'Riwayat Log', icon: Clock },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">
                {kosName || 'KosManager'}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">Sistem Manajemen Kos Lokal</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions & PWA Install */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isPwaInstalled && (
              <button
                onClick={handleInstallPwa}
                title="Pasang Aplikasi di HP (PWA)"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Pasang di HP</span>
              </button>
            )}

            <button
              onClick={onOpenCheckIn}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm shadow-emerald-300 transition-all hover:shadow active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">+ Pengekos Baru</span>
              <span className="sm:hidden">Masuk</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Kunci Akses Admin (Logout)"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-1 px-2 text-xs font-medium ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
