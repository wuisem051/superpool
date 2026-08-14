import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('app_language');
    if (saved) return saved;
    const browserLang = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage) || '').toLowerCase();
    return browserLang.startsWith('en') ? 'en' : 'es';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'es' ? 'en' : 'es';
    setLanguage(nextLang);
  };

  /**
   * Helper function for translations.
   * Can be used as:
   * 1. t('Texto en español', 'Text in English')
   * 2. t('translation.key')
   */
  const t = (keyOrEs, enText) => {
    if (enText !== undefined) {
      return language === 'en' ? enText : keyOrEs;
    }

    if (translations[language] && translations[language][keyOrEs]) {
      return translations[language][keyOrEs];
    }

    return keyOrEs;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  es: {
    'nav.home': 'Inicio',
    'nav.calculator': 'Calculadora',
    'nav.global_network': 'Red Global',
    'nav.user_panel': 'Panel de Usuario',
    'nav.logout': 'Cerrar Sesión',
    'nav.register': 'Registrarse',
    'nav.login': 'Iniciar Sesión',
    'nav.back_home': 'Volver al Inicio',
    'nav.dashboard': 'Dashboard',
    'nav.mining_info': 'Conectar Pool',
    'nav.pool_arbitrage': 'Pools de Arbitraje',
    'nav.my_wallet': 'Mi Billetera',
    'nav.mining_portfolio': 'Miner Pool',
    'nav.referrals': 'Referidos',
    'nav.settings': 'Configuración',
    'nav.support': 'Soporte',
    'nav.shop': 'Tienda',
    'nav.home_miners': 'Hogar',
    'nav.withdrawals': 'Retiros',
    'nav.p2p': 'Mercado P2P',
  },
  en: {
    'nav.home': 'Home',
    'nav.calculator': 'Calculator',
    'nav.global_network': 'Global Network',
    'nav.user_panel': 'User Dashboard',
    'nav.logout': 'Logout',
    'nav.register': 'Register',
    'nav.login': 'Login',
    'nav.back_home': 'Back to Home',
    'nav.dashboard': 'Dashboard',
    'nav.mining_info': 'Connect Pool',
    'nav.pool_arbitrage': 'Arbitrage Pools',
    'nav.my_wallet': 'My Wallet',
    'nav.mining_portfolio': 'Miner Pool',
    'nav.referrals': 'Referrals',
    'nav.settings': 'Settings',
    'nav.support': 'Support',
    'nav.shop': 'Store',
    'nav.home_miners': 'Home Miners',
    'nav.withdrawals': 'Withdrawals',
    'nav.p2p': 'P2P Market',
  }
};
