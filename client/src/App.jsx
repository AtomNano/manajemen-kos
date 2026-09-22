import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import RoomManager from './components/RoomManager';
import TenantManager from './components/TenantManager';
import PaymentReminder from './components/PaymentReminder';
import ActivityLogs from './components/ActivityLogs';
import SettingsModal from './components/SettingsModal';
import CheckInModal from './components/CheckInModal';
import PaymentModal from './components/PaymentModal';
import PublicTenantForm from './components/PublicTenantForm';
import AdminAuthGuard from './components/AdminAuthGuard';
import { CheckCircle, AlertCircle } from 'lucide-react';

// Setup fetch interceptor to attach Admin Token
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [resource, config = {}] = args;
    const token = localStorage.getItem('kos_admin_token') || sessionStorage.getItem('kos_admin_token');
    if (
      token &&
      typeof resource === 'string' &&
      resource.startsWith('/api') &&
      !resource.startsWith('/api/public') &&
      !resource.startsWith('/api/auth/login')
    ) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
    return originalFetch(resource, config);
  };
}

export default function App() {
  // Check if current route is a public tenant registration form
  const [publicRoomId, setPublicRoomId] = useState(() => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    if (path.startsWith('/daftar/')) {
      return path.replace('/daftar/', '').split('/')[0];
    }
    if (path.startsWith('/form/')) {
      return path.replace('/form/', '').split('/')[0];
    }
    if (searchParams.get('daftar')) {
      return searchParams.get('daftar');
    }
    if (searchParams.get('kamar')) {
      return searchParams.get('kamar');
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [dues, setDues] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [kosName, setKosName] = useState('Kos Berkah Mandiri');

  // Modals state
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInRoomId, setCheckInRoomId] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentTenant, setPaymentTenant] = useState(null);

  // Global toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      // 1. Stats
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // 2. Rooms
      const roomsRes = await fetch('/api/rooms');
      const roomsData = await roomsRes.json();
      if (roomsData.success) setRooms(roomsData.data);

      // 3. Dues & WA reminders
      const duesRes = await fetch('/api/payments/dues');
      const duesData = await duesRes.json();
      if (duesData.success) setDues(duesData.data);

      // 4. Logs
      const logsRes = await fetch('/api/logs?limit=10');
      const logsData = await logsRes.json();
      if (logsData.success) setRecentLogs(logsData.data);

      // 5. Settings
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.data?.kos_name) {
        setKosName(settingsData.data.kos_name);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    // Only load admin data if not in public registration mode
    if (!publicRoomId) {
      loadData();
    }
  }, [publicRoomId]);

  // If public registration route is active, render the public form directly
  if (publicRoomId) {
    return (
      <PublicTenantForm
        roomId={publicRoomId}
        onBackToAdmin={() => {
          window.history.pushState({}, '', '/');
          setPublicRoomId(null);
        }}
      />
    );
  }

  const handleOpenCheckInWithRoom = (roomId) => {
    setCheckInRoomId(roomId);
    setIsCheckInOpen(true);
  };

  const handleOpenCheckInGeneral = () => {
    setCheckInRoomId(null);
    setIsCheckInOpen(true);
  };

  const handleOpenPayment = (tenantItem) => {
    setPaymentTenant(tenantItem);
    setIsPaymentOpen(true);
  };

  const handleSelectRoomFromGrid = (room) => {
    if (room.status === 'tersedia') {
      handleOpenCheckInWithRoom(room.id);
    } else {
      setActiveTab('rooms');
    }
  };

  const handleOpenTenantDetailFromRoom = () => {
    setActiveTab('tenants');
  };

  return (
    <AdminAuthGuard
      kosName={kosName}
      onOpenPublicDemo={() => {
        window.history.pushState({}, '', '/daftar/1');
        setPublicRoomId('1');
      }}
    >
      <AdminDashboardView
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        kosName={kosName}
        setKosName={setKosName}
        stats={stats}
        rooms={rooms}
        dues={dues}
        recentLogs={recentLogs}
        toast={toast}
        showToast={showToast}
        loadData={loadData}
        isCheckInOpen={isCheckInOpen}
        setIsCheckInOpen={setIsCheckInOpen}
        checkInRoomId={checkInRoomId}
        setCheckInRoomId={setCheckInRoomId}
        isPaymentOpen={isPaymentOpen}
        setIsPaymentOpen={setIsPaymentOpen}
        paymentTenant={paymentTenant}
        setPaymentTenant={setPaymentTenant}
        handleOpenCheckInWithRoom={handleOpenCheckInWithRoom}
        handleOpenCheckInGeneral={handleOpenCheckInGeneral}
        handleOpenPayment={handleOpenPayment}
        handleSelectRoomFromGrid={handleSelectRoomFromGrid}
        handleOpenTenantDetailFromRoom={handleOpenTenantDetailFromRoom}
      />
    </AdminAuthGuard>
  );
}

// Inner Admin Dashboard View (rendered after passing Admin PIN Gatekeeper)
function AdminDashboardView({
  activeTab,
  setActiveTab,
  kosName,
  setKosName,
  stats,
  rooms,
  dues,
  recentLogs,
  toast,
  showToast,
  loadData,
  isCheckInOpen,
  setIsCheckInOpen,
  checkInRoomId,
  setCheckInRoomId,
  isPaymentOpen,
  setIsPaymentOpen,
  paymentTenant,
  setPaymentTenant,
  handleOpenCheckInWithRoom,
  handleOpenCheckInGeneral,
  handleOpenPayment,
  handleSelectRoomFromGrid,
  handleOpenTenantDetailFromRoom,
  onLogout,
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCheckIn={handleOpenCheckInGeneral}
        kosName={kosName}
        onLogout={onLogout}
      />

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white shadow-emerald-900/20'
                : 'bg-rose-600 text-white shadow-rose-900/20'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            rooms={rooms}
            dues={dues}
            recentLogs={recentLogs}
            onOpenCheckIn={handleOpenCheckInGeneral}
            onSelectRoom={handleSelectRoomFromGrid}
            onOpenPayment={handleOpenPayment}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomManager
            rooms={rooms}
            onRefresh={loadData}
            onOpenCheckInWithRoom={handleOpenCheckInWithRoom}
            onOpenTenantDetail={handleOpenTenantDetailFromRoom}
          />
        )}

        {activeTab === 'tenants' && (
          <TenantManager
            onRefresh={loadData}
            onOpenPayment={handleOpenPayment}
            onOpenCheckIn={handleOpenCheckInGeneral}
          />
        )}

        {activeTab === 'billing' && (
          <PaymentReminder
            dues={dues}
            onRefresh={loadData}
            onOpenPayment={handleOpenPayment}
          />
        )}

        {activeTab === 'logs' && <ActivityLogs />}

        {activeTab === 'settings' && (
          <SettingsModal
            onUpdateKosName={(name) => setKosName(name)}
          />
        )}
      </main>

      {/* Modals */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => {
          setIsCheckInOpen(false);
          setCheckInRoomId(null);
        }}
        preselectedRoomId={checkInRoomId}
        onSuccess={(msg) => {
          showToast(msg);
          loadData();
        }}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setPaymentTenant(null);
        }}
        tenant={paymentTenant}
        onSuccess={(msg) => {
          showToast(msg);
          loadData();
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-400">
          <p>
            {kosName} • Sistem Manajemen Kos (Protected Admin Panel & Public Tenant Forms)
          </p>
        </div>
      </footer>
    </div>
  );
}
