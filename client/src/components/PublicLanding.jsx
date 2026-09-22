import React from 'react';
import { Home, ShieldCheck, MessageCircle, Wifi, MapPin, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PublicLanding({ kosInfo, onGoToAdmin }) {
  const kosName = kosInfo?.kos_name || 'Kos Putra';
  const ownerPhone = (kosInfo?.owner_phone || '08123456789').replace(/^0/, '62').replace(/[^0-9]/g, '');

  const waUrl = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(
    `Halo Pengelola ${kosName}, saya tertarik untuk menanyakan ketersediaan kamar kos dan informasi pendaftaran sewa. Terima kasih!`
  )}`;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-10 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/40">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white">{kosName}</h1>
              <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Hunian Nyaman & Tenang</p>
            </div>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chat WhatsApp</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-10 flex flex-col justify-center">
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Sistem Pendaftaran Tertutup</span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              Pendaftaran & Ketersediaan Kamar {kosName}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Untuk menjaga kenyamanan, keamanan, dan ketertiban seluruh penghuni, formulir pendaftaran calon penghuni baru dilakukan secara tertutup.
            </p>
          </div>

          {/* Guidelines Box */}
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700/50 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Cara Mendaftar Sewa Kamar:
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Hubungi Pengelola Kos melalui WhatsApp untuk menanyakan kamar kosong.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Pengelola akan mengirimkan <b>tautan formulir khusus</b> sesuai nomor kamar yang Anda pilih.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Isi formulir online tersebut, pilih tanggal masuk, dan konfirmasi reservasi Anda.</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <div>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Hubungi Pengelola Kos Sekarang</span>
            </a>
            <p className="text-[11px] text-slate-400 text-center mt-2.5">
              Respons cepat via WhatsApp untuk informasi harga & ketersediaan kamar.
            </p>
          </div>
        </div>
      </main>

      {/* Footer with subtle hidden admin access */}
      <footer className="border-t border-slate-800/80 px-4 py-4 text-center">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <p>© 2026 {kosName}. Seluruh hak cipta dilindungi.</p>
          
          <button
            onClick={onGoToAdmin}
            title="Akses Pengelola"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
          >
            <Lock className="w-3 h-3 text-slate-500 hover:text-emerald-400 transition-colors" />
            <span className="hidden sm:inline">Khusus Pengelola</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
