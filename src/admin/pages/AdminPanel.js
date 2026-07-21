import React, { useState, useContext } from 'react'; // Importar useContext
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext'; // Importar ThemeContext
import MinerManagement from '../components/MinerManagement';
import PoolConfiguration from '../components/PoolConfiguration';
import UserManagement from '../components/UserManagement';
import ProfitabilitySettings from '../components/ProfitabilitySettings';
import PoolArbitrage from '../components/PoolArbitrage';
import Backup from '../components/Backup';
import NewsManagement from '../components/NewsManagement';
import ContentManagement from '../components/ContentManagement';
import ContactRequestsManagement from '../components/ContactRequestsManagement';
import WithdrawalRequestsManagement from '../components/WithdrawalRequestsManagement';
import BalanceManagement from '../../user/components/BalanceManagement';
import SiteSettingsContent from '../components/SiteSettingsContent';
import MinerApproval from '../components/MinerApproval';


const AdminPanel = () => {
  const { darkMode } = useContext(ThemeContext); // Usar ThemeContext
  const location = useLocation();
  const [unreadContactRequests, setUnreadContactRequests] = useState(0);
  const [unreadWithdrawalRequests, setUnreadWithdrawalRequests] = useState(0);
  const [unreadMinersCount, setUnreadMinersCount] = useState(0); // Nuevo estado para notificaciones de mineros

  const handleUnreadContactRequestsChange = (count) => {
    setUnreadContactRequests(count);
  };

  const handleUnreadWithdrawalRequestsChange = (count) => {
    setUnreadWithdrawalRequests(count);
  };

  const handleNewMinerNotification = (count) => {
    setUnreadMinersCount(prevCount => {
      const newCount = prevCount + count;
      console.log("AdminPanel: handleNewMinerNotification llamado. Nuevos mineros:", count, "Total no leídos:", newCount);
      return newCount;
    });
  };

  const handleClearMinerNotification = () => {
    console.log("AdminPanel: Limpiando notificación de mineros.");
    setUnreadMinersCount(0);
  };

  console.log("AdminPanel: Renderizando. unreadMinersCount:", unreadMinersCount);

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-[#06080c] text-gray-300' : 'bg-gray-50 text-gray-800'} overflow-hidden`}>
      {/* Sidebar de Navegación */}
      <aside className={`w-64 flex-shrink-0 flex flex-col border-r ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl`}>
        {/* Sidebar Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-[#1e2330]' : 'border-gray-200'} flex items-center gap-3`}>
          <div className="p-2.5 bg-yellow-500/10 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h1 className={`text-md font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>SuperPool</h1>
            <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Panel Admin</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <Link
            to="/"
            className={`flex items-center px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider mb-4 border transition-all ${
              darkMode 
                ? 'text-gray-400 border-white/5 bg-white/[0.02] hover:text-white hover:bg-white/[0.05]' 
                : 'text-gray-600 border-gray-200 bg-gray-100 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 mr-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Inicio
          </Link>

          {[
            {
              path: '/admin/miners',
              label: 'Gestión de Mineros',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
              badge: unreadMinersCount > 0 ? { count: unreadMinersCount, type: 'danger' } : null,
              onClick: handleClearMinerNotification
            },
            {
              path: '/admin/miner-approval',
              label: 'Aprobación de Mineros',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
              badge: unreadMinersCount > 0 ? { count: unreadMinersCount, type: 'warning' } : null
            },
            {
              path: '/admin/pool-config',
              label: 'Configuración Pool',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            },
            {
              path: '/admin/users',
              label: 'Gestión de Usuarios',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            },
            {
              path: '/admin/profitability-settings',
              label: 'Configuración Rentabilidad',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            },
            {
              path: '/admin/pool-arbitrage',
              label: 'Arbitraje de Pools',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            },
            {
              path: '/admin/backup',
              label: 'Respaldo de Datos',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
            },
            {
              path: '/admin/news',
              label: 'Gestión de Noticias',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            },
            {
              path: '/admin/content',
              label: 'Gestión de Contenido',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            },
            {
              path: '/admin/contact-requests',
              label: 'Solicitudes de Contacto',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
              badge: unreadContactRequests > 0 ? { count: unreadContactRequests, type: 'danger' } : null
            },
            {
              path: '/admin/withdrawal-requests',
              label: 'Solicitudes de Pago',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
              badge: unreadWithdrawalRequests > 0 ? { count: unreadWithdrawalRequests, type: 'danger' } : null
            },
            {
              path: '/admin/balance-management',
              label: 'Gestión de Balance',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V3a1 1 0 00-1-1H4a1 1 0 00-1 1v18a1 1 0 001 1h12a1 1 0 001-1v-5m-1-10v4m-4 0h4" />
            },
            {
              path: '/admin/site-settings',
              label: 'Configuración del Sitio',
              icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
            }
          ].map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={item.onClick}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? (darkMode 
                        ? 'bg-yellow-500/10 text-yellow-500 border-l-4 border-yellow-500 font-bold' 
                        : 'bg-yellow-500 text-gray-900 font-bold')
                    : (darkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-white/[0.02]' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 mr-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.icon}
                  </svg>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-full ${
                    item.badge.type === 'danger' 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-yellow-500 text-gray-950 animate-pulse'
                  }`}>
                    {item.badge.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className={`flex-1 p-6 sm:p-8 overflow-y-auto ${darkMode ? 'bg-[#06080c]' : 'bg-gray-50'}`}>
          <div className="max-w-6xl mx-auto space-y-6">
            <Routes>
              <Route
                path="miners"
                element={<MinerManagement onNewMinerAdded={handleNewMinerNotification} />}
              />
              <Route path="miner-approval" element={<MinerApproval />} />
              <Route path="pool-config" element={<PoolConfiguration />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="profitability-settings" element={<ProfitabilitySettings />} />
              <Route path="pool-arbitrage" element={<PoolArbitrage />} />
              <Route path="backup" element={<Backup />} />
              <Route path="news" element={<NewsManagement />} />
              <Route path="content" element={<ContentManagement />} />
              <Route
                path="contact-requests"
                element={<ContactRequestsManagement onUnreadCountChange={handleUnreadContactRequestsChange} />}
              />
              <Route
                path="withdrawal-requests"
                element={<WithdrawalRequestsManagement onUnreadCountChange={handleUnreadWithdrawalRequestsChange} />}
              />
              <Route path="balance-management" element={<BalanceManagement />} />
              <Route path="site-settings" element={<SiteSettingsContent />} />
              {/* Overview / Home Dashboard */}
              <Route path="/" element={
                <div className={`p-8 rounded-2xl border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl max-w-xl mx-auto my-12 text-center space-y-4`}>
                  <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Bienvenido al Panel Admin</h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                    Gestiona mineros, aprueba retiros, edita balances y personaliza la rentabilidad desde el menú lateral.
                  </p>
                </div>
              } />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
