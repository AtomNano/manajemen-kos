import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AdminAuthGuard({ children, kosName, onOpenPublicDemo }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('kos_admin_token');
    if (!savedToken) {
      setChecking(false);
      return;
    }

    fetch('/api/auth/verify', {
      headers: {
        Authorization: `Bearer ${savedToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.authenticated) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('kos_admin_token');
        }
      })
      .catch(() => {
        // In case offline, keep saved token or let user re-auth
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Silakan masukkan PIN pengelola');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'PIN Salah');
      }

      if (rememberMe) {
        localStorage.setItem('kos_admin_token', data.token);
      } else {
        sessionStorage.setItem('kos_admin_token', data.token);
      }

      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kos_admin_token');
    sessionStorage.removeItem('kos_admin_token');
    setIsAuthenticated(false);
    setPin('');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div>
        {/* Pass logout function down or provide context */}
        {React.cloneElement(children, { onLogout: handleLogout })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {kosName || 'KosManager'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Panel Pengelola Kos • Akses Terbatas Khusus Pemilik
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Masukkan PIN Pengelola
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoFocus
                placeholder="••••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-base tracking-widest font-mono text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="remember" className="text-xs text-slate-600 font-medium cursor-pointer">
              Ingat saya di perangkat / browser ini
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Memverifikasi...' : 'Buka Panel Manajemen Kos'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {onOpenPublicDemo && (
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={onOpenPublicDemo}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Lihat Tampilan Form Pendaftaran Calon Penghuni &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
