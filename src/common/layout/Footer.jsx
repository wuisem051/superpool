import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t, language } = useLanguage();
  const [customTextEs, setCustomTextEs] = useState('© 2025 MaxiOS. Todos los derechos reservados.');
  const [customTextEn, setCustomTextEn] = useState('© 2025 MaxiOS. All rights reserved.');

  useEffect(() => {
    const fetchFooterText = async () => {
      try {
        const docRef = doc(db, 'settings', 'siteConfig');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.footerText) setCustomTextEs(data.footerText);
          if (data.footerTextEn) setCustomTextEn(data.footerTextEn);
        }
      } catch (err) {
        console.error("Error fetching footer text from Firebase:", err);
      }
    };
    fetchFooterText();
  }, []);

  const defaultText = language === 'en' ? '© 2025 MaxiOS. All rights reserved.' : '© 2025 MaxiOS. Todos los derechos reservados.';

  const currentCustomText = language === 'en' ? (customTextEn || customTextEs) : customTextEs;
  const displayText = currentCustomText || defaultText;

  return (
    <footer className="relative bg-[#0b0e14]/90 backdrop-blur-lg border-t border-[#1e2330] mt-auto z-40 overflow-hidden">
      {/* Resplandor de fondo ornamental */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-orange-500/10 blur-[100px] rounded-full opacity-50"></div>
      </div>

      <div className="container mx-auto py-6 px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-yellow-500 p-[1.5px] shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              <div className="w-full h-full rounded-full bg-[#0b0e14] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-400 font-medium text-xs sm:text-sm tracking-wide text-center">
              {displayText}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
