import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';

const FuturisticHome = () => {
  const { theme } = useContext(ThemeContext);
  const [siteConfig, setSiteConfig] = useState({
    siteName: 'MaxiOS Pool',
    heroTitle: 'Bienvenido a nuestra Pool de Minería Bitcoin',
    homeText: 'Minando el futuro, un bloque a la vez.',
  });

  useEffect(() => {
    const fetchSiteConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'siteConfig');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSiteConfig(data || {
            siteName: 'MaxiOS Pool',
            heroTitle: 'Bienvenido a nuestra Pool de Minería Bitcoin',
            homeText: 'Minando el futuro, un bloque a la vez.',
          });
        } else {
          setSiteConfig({
            siteName: 'MaxiOS Pool',
            heroTitle: 'Bienvenido a nuestra Pool de Minería Bitcoin',
            homeText: 'Minando el futuro, un un bloque a la vez.',
          });
        }
      } catch (err) {
        console.error("Error fetching site config for FuturisticHome page from Firebase:", err);
        setSiteConfig({
          siteName: 'MaxiOS Pool',
          heroTitle: 'Bienvenido a nuestra Pool de Minería Bitcoin',
          homeText: 'Minando el futuro, un bloque a la vez.',
        });
      }
    };

    fetchSiteConfig();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center p-4 overflow-hidden z-0 pt-24">

      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-orange-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full mix-blend-screen"></div>
        {/* Malla decorativa opcional */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50 z-0"></div>
      </div>

      <div className="text-center max-w-4xl relative z-10">
        {/* Insignia del Bono de Bienvenida */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 mb-6 text-sm font-semibold shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          🎁 ¡Bono de Bienvenida de $1.00 USD al registrarte!
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
            {siteConfig.siteName}
          </span>
        </h1>
        <p className="text-xl md:text-2xl mb-6 text-gray-300 font-medium max-w-3xl mx-auto">
          {siteConfig.heroTitle}
        </p>
        <p className="text-lg md:text-xl mb-12 text-gray-500 max-w-2xl mx-auto">
          {siteConfig.homeText}
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
          <Link
            to="/signup"
            className="group relative px-8 py-4 bg-gradient-to-r from-orange-600 to-yellow-500 rounded-full font-bold text-white shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:shadow-[0_0_60px_rgba(249,115,22,0.6)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative flex items-center gap-2">
              Registrarme y Obtener $1 Gratis
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </span>
          </Link>
          <Link
            to="/news"
            className="group px-8 py-4 bg-[#131824]/80 backdrop-blur-md border border-[#1e2330] hover:border-gray-500/50 rounded-full font-bold text-gray-300 hover:text-white transition-all duration-300 transform hover:-translate-y-1"
          >
            Últimas Noticias
          </Link>
        </div>
      </div>

      {/* Sección de características futuristas */}
      <div className="mt-24 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl w-full relative z-10 pb-20">

        {/* Card Bono Bienvenida */}
        <div className="group relative bg-[#131824]/80 backdrop-blur-xl p-8 rounded-3xl border border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 hover:-translate-y-2 overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/20 transition-colors"></div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center mb-6 border border-emerald-500/30 shadow-inner">
            <span className="text-2xl">🎁</span>
          </div>
          <h3 className="text-xl font-bold mb-3 text-emerald-400">Bono de Bienvenida $1 USD</h3>
          <p className="text-gray-300 leading-relaxed text-sm">
            Recibe $1 USD en tu billetera al registrarte y reclamarlo en tu panel. ¡Comienza a generar rentabilidad desde el primer segundo!
          </p>
        </div>

        {/* Card 1 */}
        <div className="group relative bg-[#131824]/60 backdrop-blur-xl p-8 rounded-3xl border border-[#1e2330] hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-2 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-orange-500/20 transition-colors"></div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/10 flex items-center justify-center mb-6 border border-orange-500/20 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-white">Tecnología Avanzada</h3>
          <p className="text-gray-400 leading-relaxed text-sm">
            Utilizamos algoritmos optimizados constantemente en minería de última generación para maximizar tu rentabilidad diaria.
          </p>
        </div>

        {/* Card 2 */}
        <div className="group relative bg-[#131824]/60 backdrop-blur-xl p-8 rounded-3xl border border-[#1e2330] hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-2 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-500/20 transition-colors"></div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center mb-6 border border-blue-500/20 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-white">Seguridad Encriptada</h3>
          <p className="text-gray-400 leading-relaxed text-sm">
            Tus activos están protegidos en billeteras frías con los más altos estándares y protocolos de seguridad cibernética.
          </p>
        </div>

        {/* Card 3 */}
        <div className="group relative bg-[#131824]/60 backdrop-blur-xl p-8 rounded-3xl border border-[#1e2330] hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-2 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-purple-500/20 transition-colors"></div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center mb-6 border border-purple-500/20 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-white">Interfaz Intuitiva</h3>
          <p className="text-gray-400 leading-relaxed text-sm">
            Gestiona tus operaciones de minería de forma clara y precisa con una experiencia de control sin precedentes.
          </p>
        </div>

      </div>
    </div>
  );
};

export default FuturisticHome;
