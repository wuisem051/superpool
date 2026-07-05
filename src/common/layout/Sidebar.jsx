import React, { useContext, useState } from 'react';
import { Link, useMatch, useLocation } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const SidebarItem = ({ to, icon, label, isActive, hasBadge, badgeCount, onClick }) => (
  <li className="mb-2">
    {onClick ? (
      <div
        onClick={onClick}
        className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${isActive
          ? 'bg-gradient-to-r from-orange-500/20 to-transparent text-orange-500 border-l-4 border-orange-500 shadow-lg shadow-orange-500/10'
          : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border-l-4 border-transparent'
          }`}
      >
        <div className="flex items-center">
          <span className={`mr-3 transition-colors duration-300 ${isActive ? 'text-orange-400' : 'text-gray-500'}`}>
            {icon}
          </span>
          <span>{label}</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform duration-300 ${isActive ? 'rotate-90 text-orange-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
      </div>
    ) : (
      <Link
        to={to}
        className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${isActive
          ? 'bg-gradient-to-r from-orange-500/20 to-transparent text-orange-500 border-l-4 border-orange-500 shadow-lg shadow-orange-500/10'
          : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border-l-4 border-transparent'
          }`}
      >
        <div className="flex items-center">
          <span className={`mr-3 transition-colors duration-300 ${isActive ? 'text-orange-400' : 'text-gray-500'}`}>
            {icon}
          </span>
          <span>{label}</span>
        </div>
        {hasBadge && badgeCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg shadow-red-500/40 animate-pulse">
            {badgeCount}
          </span>
        )}
      </Link>
    )}
  </li>
);

const Sidebar = ({ unreadTicketsCount, displayUser }) => {
  const { pathname } = useLocation();
  const basePath = pathname.split('/').slice(0, 2).join('/');
  const [showWithdrawals, setShowWithdrawals] = useState(false);
  const { logout } = useAuth();

  const activePaths = {
    dashboard: useMatch(`${basePath}/dashboard`),
    miningInfo: useMatch(`${basePath}/mining-info`),
    referrals: useMatch(`${basePath}/referrals`),
    poolArbitrage: useMatch(`${basePath}/pool-arbitrage`),
    bonus: useMatch(`${basePath}/bonus`),
    myWallet: useMatch(`${basePath}/my-wallet`),
    withdrawals: useMatch(`${basePath}/withdrawals`),
    p2p: useMatch(`${basePath}/p2p-marketplace`),
    collectiveFund: useMatch(`${basePath}/collective-fund`),
    portfolio: useMatch(`${basePath}/mining-portfolio`),
    miners: useMatch(`${basePath}/miners`),
    settings: useMatch(`${basePath}/settings`),
    support: useMatch(`${basePath}/contact-support`),
  };

  const isWalletGroupActive = activePaths.myWallet || activePaths.withdrawals;

  const Icons = {
    home: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    dashboard: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    pool: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
    arbitrage: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    bonus: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
    wallet: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    creditCard: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    money: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    marketplace: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
    portfolio: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
    users: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    settings: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    support: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
  };

  return (
    <aside className="w-72 h-screen fixed top-0 left-0 flex flex-col bg-[#0b0e14] border-r border-[#1e2330] z-50 overflow-y-auto custom-scrollbar">
      {/* Perfil de Borde superior */}
      <div className="p-6 sticky top-0 bg-[#0b0e14]/95 backdrop-blur-md z-10 border-b border-[#1e2330]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-yellow-400 p-[2px] shadow-lg shadow-orange-500/20 shadow-orange-500/20">
            <div className="h-full w-full rounded-2xl bg-[#0b0e14] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold truncate w-40 text-white tracking-wide">
              {displayUser?.email || 'Usuario'}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-xs text-gray-400 font-medium">En línea</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación y Enlaces */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-1">
          <SidebarItem to={`${basePath}/dashboard`} icon={Icons.dashboard} label="Dashboard" isActive={activePaths.dashboard} />

          <h3 className="text-[11px] font-bold uppercase text-gray-500 tracking-wider mt-8 mb-4 px-4">Centro de Ganancias</h3>
          <SidebarItem to={`${basePath}/mining-info`} icon={Icons.pool} label="Conectar Pool" isActive={activePaths.miningInfo} />
          <SidebarItem to={`${basePath}/pool-arbitrage`} icon={Icons.arbitrage} label="Pools de Arbitraje" isActive={activePaths.poolArbitrage} />

          <h3 className="text-[11px] font-bold uppercase text-gray-500 tracking-wider mt-8 mb-4 px-4">Finanzas</h3>
          <SidebarItem to={`${basePath}/my-wallet`} icon={Icons.wallet} label="Mi Billetera" isActive={activePaths.myWallet} />

          <SidebarItem to={`${basePath}/mining-portfolio`} icon={Icons.portfolio} label="Miner Pool" isActive={activePaths.portfolio} />

          <h3 className="text-[11px] font-bold uppercase text-gray-500 tracking-wider mt-8 mb-4 px-4">Sistema</h3>
          <SidebarItem to={`${basePath}/referrals`} icon={Icons.users} label="Referidos" isActive={activePaths.referrals} />
          <SidebarItem to={`${basePath}/settings`} icon={Icons.settings} label="Configuración" isActive={activePaths.settings} />
          <SidebarItem
            to={`${basePath}/contact-support`}
            icon={Icons.support}
            label="Soporte"
            isActive={activePaths.support}
            hasBadge={true}
            badgeCount={unreadTicketsCount}
          />
        </ul>
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-4 bg-[#0b0e14] border-t border-[#1e2330]">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-[#1e2330] transition-colors"
        >
          {Icons.logout}
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
