import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const LanguageToggle = ({ className = '', compact = false }) => {
  const { language, setLanguage } = useLanguage();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#131824]/90 border border-[#1e2330] hover:border-orange-500/40 text-xs font-bold text-gray-200 transition-all duration-200 shadow-sm backdrop-blur-md cursor-pointer ${className}`}
        title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
      >
        <span className="text-sm">{language === 'es' ? '🇺🇸' : '🇪🇸'}</span>
        <span>{language === 'es' ? 'EN' : 'ES'}</span>
      </button>
    );
  }

  return (
    <div className={`inline-flex items-center p-1 rounded-full bg-[#131824]/90 border border-[#1e2330] shadow-md backdrop-blur-md ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage('es')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
          language === 'es'
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <span className="text-sm">🇪🇸</span>
        <span>ES</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
          language === 'en'
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <span className="text-sm">🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  );
};

export default LanguageToggle;
