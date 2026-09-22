import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, AlertCircle, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, Key, CheckCircle2 } from 'lucide-react';

export default function AdminAuthGuard({ children, kosName, onBackToPublic }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Emergency Recovery states
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPin, setNewPin] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('kos_admin_token') || sessionStorage.getItem('kos_admin_token');
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
          sessionStorage.removeItem('kos_admin_token');
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

  const handleEmergencyRecovery = async (e) => {
    e.preventDefault();
    if (!recoveryKey.trim() || !newPin.trim()) {
      setRecoveryError('Kunci Pemulihan dan PIN Baru wajib diisi');
      return;
    }

    if (newPin.trim().length < 4) {
      setRecoveryError('PIN Baru minimal 4 karakter');
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError('');
    setRecoverySuccess('');

    try {
      const res = await fetch('/api/auth/emergency-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recovery_key: recoveryKey.trim(),
          new_pin: newPin.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Pemulihan gagal');
      }

      setRecoverySuccess('Akses & PIN berhasil dipulihkan!');
      if (rememberMe) {
        localStorage.setItem('kos_admin_token', data.token);
      } else {
        sessionStorage.setItem('kos_admin_token', data.token);
      }

      setTimeout(() => {
        setIsAuthenticated(true);
      }, 1000);
    } catch (err) {
      setRecoveryError(err.message);
    } finally {
      setRecoveryLoading(false);
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div>
        {/* Pass logout function down */}
        {React.cloneElement(children, { onLogout: handleLogout })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-7 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-13 h-13 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {kosName || 'Kos Putra'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Panel Pengelola Kos • Akses Khusus Pemilik
          </p>
        </div>

        {!isRecoveryMode ? (
          /* Normal PIN Login Form */
          <>
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
                  Ingat saya di perangkat ini
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

            {/* Recovery / Forgot PIN Trigger */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              {onBackToPublic && (
                <button
                  type="button"
                  onClick={onBackToPublic}
                  className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ke Beranda</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsRecoveryMode(true);
                  setError('');
                }}
                className="text-emerald-700 hover:text-emerald-800 font-semibold ml-auto cursor-pointer"
              >
                Lupa PIN / Terkunci?
              </button>
            </div>
          </>
        ) : (
          /* Emergency Recovery Form */
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-xs">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <Key className="w-4 h-4 text-amber-600" />
                Pemulihan Akses Instan
              </p>
              <p className="leading-relaxed text-[11px] text-amber-800">
                Gunakan <b>Kunci Pemulihan Darurat</b> Anda untuk membuka blokir lockout dan langsung mengatur PIN baru tanpa harus menunggu 15 menit.
              </p>
            </div>

            {recoveryError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{recoverySuccess}</span>
              </div>
            )}

            <form onSubmit={handleEmergencyRecovery} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kunci Pemulihan Darurat (Master Key)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: KOS-PUTRA-9988"
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN Baru (Minimal 4 Karakter)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan PIN baru Anda"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={recoveryLoading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {recoveryLoading ? 'Memulihkan...' : 'Buka Kunci & Set PIN Baru'}
                <RefreshCw className="w-4 h-4" />
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setIsRecoveryMode(false);
                setRecoveryError('');
                setRecoverySuccess('');
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold pt-1 cursor-pointer"
            >
              &larr; Kembali ke Form PIN Biasa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
