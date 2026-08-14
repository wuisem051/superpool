import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const DEFAULT_HOME_NEWS = [
  {
    id: 'news-home-1',
    title: 'Manifiesto Colectivo: Optimización de Rendimiento a Tasa Fija',
    titleEn: 'Collective Manifesto: Yield Optimization at Fixed Rate',
    category: 'Manifiesto',
    categoryEn: 'Manifesto',
    createdAt: new Date('2026-08-10'),
    summary: 'Maximizamos el rendimiento de tus ASICs a tasa fija garantizada mediante enrutamiento inteligente y arbitraje P2P.',
    summaryEn: 'We maximize your ASIC yield at a guaranteed fixed rate through intelligent routing and P2P arbitrage.',
  },
  {
    id: 'news-home-2',
    title: 'Enrutamiento Inteligente y Failover Automatizado',
    titleEn: 'Intelligent Routing and Automated Failover',
    category: 'Tecnología',
    categoryEn: 'Technology',
    createdAt: new Date('2026-08-05'),
    summary: 'Sistema de colocación de hashrate en mercados P2P y pools de alto retorno para evitar caídas y asegurar ganancias constantes.',
    summaryEn: 'Hashrate placement system across P2P markets and high-yield pools to avoid downtime and secure steady returns.',
  },
  {
    id: 'news-home-3',
    title: 'Bono de Bienvenida de $1.00 USD para Nuevos Mineros',
    titleEn: 'Welcome Bonus of $1.00 USD for New Miners',
    category: 'Comunidad',
    categoryEn: 'Community',
    createdAt: new Date('2026-07-28'),
    summary: 'Obtén $1.00 USD en tu billetera al registrarte para comenzar a generar rentabilidad desde el primer día.',
    summaryEn: 'Get $1.00 USD in your wallet upon registration to start generating yield from day one.',
  }
];

const NewsSection = () => {
  const { t, language } = useLanguage();
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedNews = querySnapshot.docs.map(doc => {
          const data = doc.data();
          let dateObj = new Date();
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            dateObj = data.createdAt.toDate();
          } else if (data.createdAt) {
            dateObj = new Date(data.createdAt);
          }
          return {
            id: doc.id,
            title: data.title || 'Noticia de la Pool',
            titleEn: data.titleEn || data.title || 'Project News',
            category: data.category || 'Anuncio',
            categoryEn: data.categoryEn || data.category || 'Announcement',
            summary: data.summary || data.content?.substring(0, 100) + '...',
            summaryEn: data.summaryEn || data.summary || data.contentEn?.substring(0, 100) + '...',
            createdAt: dateObj,
          };
        });

        if (fetchedNews.length > 0) {
          setNews(fetchedNews.slice(0, 3));
        } else {
          setNews(DEFAULT_HOME_NEWS);
        }
      } catch (error) {
        console.error("Error fetching news from Firebase for NewsSection:", error);
        setNews(DEFAULT_HOME_NEWS);
      }
    };

    fetchNews();
  }, []);

  return (
    <section className="relative py-16 bg-[#0b0e14] text-white overflow-hidden">
      {/* Resplandor decorativo de fondo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-500/10 blur-[140px] rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            {t('Transparencia & Comunidad Sin Fines de Lucro', 'Non-Profit Transparency & Community')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
              {t('Últimas Noticias y Novedades', 'Latest News & Updates')}
            </span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            {t(
              'Mantente al día con los avances en la estabilización de nuestra red y las mejoras para todos los mineros.',
              'Stay up to date with network stabilization progress and enhancements for all miners.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {news.map(item => {
            const displayCategory = language === 'en' ? (item.categoryEn || item.category) : item.category;
            const displayTitle = language === 'en' ? (item.titleEn || item.title) : item.title;
            const displaySummary = language === 'en' ? (item.summaryEn || item.summary) : item.summary;

            return (
              <div
                key={item.id}
                className="group relative bg-[#131824]/80 backdrop-blur-xl p-6 rounded-3xl border border-[#1e2330] hover:border-orange-500/40 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between shadow-xl"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/15 transition-colors pointer-events-none"></div>
                
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/20">
                      {displayCategory || 'Anuncio'}
                    </span>
                    <span className="text-gray-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES') : ''}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-orange-400 transition-colors leading-snug">
                    {displayTitle}
                  </h3>

                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                    {displaySummary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1e2330] flex items-center justify-end">
                  <Link
                    to="/news"
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>{t('Leer Más', 'Read More')}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-600 to-yellow-500 rounded-full font-bold text-white text-sm shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_45px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <span>{t('Ver Todas las Noticias e Informes', 'View All News & Reports')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;

