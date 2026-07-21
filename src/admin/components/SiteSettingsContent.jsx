import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTheme } from '../../context/ThemeContext';
import { useError } from '../../context/ErrorContext';

const SiteSettingsContent = () => {
  const [siteName, setSiteName] = useState('');
  const [homeText, setHomeText] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [siteDomain, setSiteDomain] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [faviconFile, setFaviconFile] = useState(null);
  const [footerText, setFooterText] = useState('');
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useError();
  const storage = getStorage();

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'settings', 'siteConfig');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSiteName(data.siteName || '');
          setHomeText(data.homeText || '');
          setHeroTitle(data.heroTitle || '');
          setSiteDomain(data.siteDomain || '');
          setFaviconUrl(data.faviconUrl || '');
          setFooterText(data.footerText || '');
        } else {
          const defaults = {
            siteName: 'BitcoinPool',
            homeText: 'Minando el futuro, un bloque a la vez.',
            heroTitle: 'Bienvenido a nuestra Pool de Minería Bitcoin',
            performanceStatsResetDate: null,
            siteDomain: '',
            faviconUrl: '',
            footerText: `© ${new Date().getFullYear()} BitcoinPool. Todos los derechos reservados.`,
          };
          await setDoc(docRef, defaults);
          setSiteName(defaults.siteName);
          setHomeText(defaults.homeText);
          setHeroTitle(defaults.heroTitle);
          setFooterText(defaults.footerText);
        }
      } catch (err) {
        console.error(err);
        showError('Error al cargar la configuración del sitio.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showError]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let updatedFaviconUrl = faviconUrl;
      if (faviconFile) {
        const faviconRef = ref(storage, `favicons/${faviconFile.name}`);
        await uploadBytes(faviconRef, faviconFile);
        updatedFaviconUrl = await getDownloadURL(faviconRef);
      }
      await updateDoc(doc(db, 'settings', 'siteConfig'), { siteName, homeText, heroTitle, siteDomain, faviconUrl: updatedFaviconUrl, footerText });
      setFaviconUrl(updatedFaviconUrl);
      showSuccess('Configuración del sitio guardada exitosamente!');
    } catch (err) {
      console.error(err);
      showError(`Error al guardar: ${err.message}`);
    } finally {
      setLoading(false);
      setFaviconFile(null);
    }
  };

  const handleResetPerformanceStats = async () => {
    if (!window.confirm('¿Reiniciar las estadísticas de rendimiento? Se borrarán los datos históricos.')) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'settings', 'siteConfig'), { performanceStatsResetDate: new Date() });
      showSuccess('Estadísticas de rendimiento reiniciadas!');
    } catch (err) {
      showError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm`;
  const labelClass = `block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">⚙️ Configuración del Sitio</h2>
        <p className="text-xs text-gray-500 mt-1">Personaliza el nombre, textos y aspecto del sitio público.</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-4 h-4 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
          Cargando configuración...
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-5">
        <div className={`rounded-2xl p-6 border bg-[#0b0e14] border-[#1e2330] shadow-xl space-y-4`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3">🌐 Información General</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="siteName" className={labelClass}>Nombre del Sitio</label>
              <input type="text" id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} className={inputClass} placeholder="BitcoinPool" required />
            </div>
            <div>
              <label htmlFor="siteDomain" className={labelClass}>Dominio Web</label>
              <input type="text" id="siteDomain" value={siteDomain} onChange={(e) => setSiteDomain(e.target.value)} className={inputClass} placeholder="www.tusitio.com" />
            </div>
          </div>

          <div>
            <label htmlFor="heroTitle" className={labelClass}>Título Principal (Hero)</label>
            <input type="text" id="heroTitle" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className={inputClass} placeholder="Bienvenido a nuestra Pool de Minería Bitcoin" required />
          </div>

          <div>
            <label htmlFor="homeText" className={labelClass}>Texto Descriptivo (Home)</label>
            <textarea id="homeText" rows="3" value={homeText} onChange={(e) => setHomeText(e.target.value)}
              className={`${inputClass} resize-none`} placeholder="Minando el futuro, un bloque a la vez." required />
          </div>

          <div>
            <label htmlFor="footerText" className={labelClass}>Texto del Footer</label>
            <textarea id="footerText" rows="2" value={footerText} onChange={(e) => setFooterText(e.target.value)}
              className={`${inputClass} resize-none`} placeholder="© 2024 BitcoinPool. Todos los derechos reservados." required />
          </div>
        </div>

        <div className={`rounded-2xl p-6 border bg-[#0b0e14] border-[#1e2330] shadow-xl space-y-4`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3">🖼️ Favicon</h3>

          <div>
            <label htmlFor="faviconUrl" className={labelClass}>URL del Favicon</label>
            <div className="flex gap-3 items-center">
              <input type="text" id="faviconUrl" value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)}
                className={inputClass} placeholder="https://tusitio.com/favicon.ico" />
              {faviconUrl && (
                <img src={faviconUrl} alt="Favicon" className="w-8 h-8 rounded border border-[#1e2330] bg-[#131824] object-contain shrink-0"
                  onError={(e) => e.target.style.display = 'none'} />
              )}
            </div>
          </div>

          <div className="p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-xs text-yellow-400/70">
            💡 Introduce la URL pública del favicon. La subida directa de archivos está deshabilitada en esta versión.
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl shadow-lg transition-all text-sm disabled:opacity-50">
          {loading ? 'Guardando...' : '💾 Guardar Configuración del Sitio'}
        </button>
      </form>

      {/* Zona de peligro */}
      <div className="rounded-2xl p-6 border bg-[#0b0e14] border-red-500/10 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 border-b border-red-500/10 pb-3 mb-4">⚠️ Zona de Peligro</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
          <div>
            <p className="text-sm font-bold text-white">Reiniciar Estadísticas de Rendimiento</p>
            <p className="text-xs text-gray-500 mt-1">Borra los datos históricos del gráfico de rendimiento. No se puede deshacer.</p>
          </div>
          <button onClick={handleResetPerformanceStats} disabled={loading}
            className="shrink-0 px-5 py-2.5 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 hover:text-red-300 font-bold rounded-xl text-xs transition-all disabled:opacity-40">
            Reiniciar Estadísticas
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteSettingsContent;
