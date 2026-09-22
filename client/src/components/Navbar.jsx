import React from 'react';
import { Home, BedDouble, Users, CreditCard, Clock, Settings, UserPlus, Lock } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenCheckIn, kosName, onLogout }) {
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

          {/* Quick Check-in Button & Lock Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCheckIn}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm shadow-emerald-300 transition-all hover:shadow active:scale-95"
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
