import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';

const Navbar = () => {
  const { darkMode } = useContext(ThemeContext);

  const NavItem = ({ to, label }) => (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isActive
            ? 'text-white bg-gradient-to-r from-orange-500/80 to-yellow-500/80 shadow-lg shadow-orange-500/20'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`
        }
      >
        {label}
      </NavLink>
    </li>
  );

  return (
    <div className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0b0e14]/80 border-b border-[#1e2330] p-4 flex items-center justify-between">
      {/* Opcional: Si hubiera un botón hamburguesa iría aquí */}
      <nav className="hidden md:flex flex-1 overflow-x-auto custom-scrollbar pb-1">
        <ul className="flex items-center gap-2">
          <NavItem to="/user-panel/dashboard" label="Dashboard" />
          <NavItem to="/user-panel/home-miners" label="Hogar" />
          <NavItem to="/user-panel/miners" label="Tienda" />
          <NavItem to="/user-panel/my-wallet" label="Mi Billetera" />
          <NavItem to="/user-panel/withdrawals" label="Retiros" />
          <NavItem to="/user-panel/p2p-marketplace" label="Mercado P2P" />
        </ul>
      </nav>

      {/* Botón de acciones rápidas / Perfil a la derecha */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="relative p-2 rounded-full bg-[#1e2330] text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#0b0e14]"></div>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
