import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';

const DEFAULT_PROJECT_NEWS = [
  {
    id: 'project-manifesto-1',
    title: 'Manifiesto Colectivo: Minería 100% Sin Fines de Lucro para Todos los Mineros',
    category: 'Manifiesto & Misión',
    createdAt: new Date('2026-08-10'),
    author: 'Colectivo MaxiOS',
    summary: 'Somos un grupo colaborativo de mineros sin fines de lucro dedicado a eliminar comisiones corporativas y redistribuir el 100% del rendimiento a la comunidad.',
    content: `MaxiOS Pool nació como una iniciativa colectiva libre de afán de lucro corporativo. Creemos firmemente que el futuro de la minería de Bitcoin pertenece a los mineros independientes y no a intermediarios que cobran elevadas comisiones.

Nuestra estructura está diseñada para que cada satoshi obtenido a través de los bloques minados sea distribuido equitativamente entre todos los participantes en función de su aporte de trabajo. Al operar como una organización sin fines de lucro, reutilizamos cualquier excedente operativo exclusivamente en mantener y optimizar los servidores comunitarios, ofrecer bonos de bienvenida para nuevos mineros y garantizar una plataforma segura y accesible para todos.`
  },
  {
    id: 'project-stabilization-2',
    title: 'Estabilización del Hashrate y Mitigación de Varianza en la Red',
    category: 'Estabilidad & Hashrate',
    createdAt: new Date('2026-08-05'),
    author: 'Equipo Técnico de Hashrate',
    summary: 'Implementamos un nuevo protocolo de balance de carga computacional para estabilizar la tasa de recompensa diaria y proteger a los mineros pequeños y medianos.',
    content: `La alta varianza de dificultad en la red Bitcoin puede ocasionar largos períodos sin encontrar bloques, afectando de manera desproporcionada a los pequeños y medianos mineros. 

Para resolver este desafío, nuestro equipo técnico ha desplegado un sistema de agregación y balanceo dinámico de tasa de minería. Este mecanismo estabiliza la tasa efectiva recibida por la pool, suavizando las curvas de recompensa y garantizando rendimientos más estables, continuos y predecibles día a día.`
  },
  {
    id: 'project-community-3',
    title: 'Incentivo de Inclusión Comunitario: Bono de $1.00 USD para Nuevos Mineros',
    category: 'Comunidad',
    createdAt: new Date('2026-07-28'),
    author: 'Soporte Comunitario',
    summary: 'Lanzamos el programa de estímulo inicial que otorga $1.00 USD en el registro para fomentar el inicio de nuevos nodos y mineros en la red.',
    content: `Como parte de nuestro compromiso de democratizar el acceso a la minería de Bitcoin, hemos establecido un fondo comunitario destinado a incentivar la llegada de nuevos mineros.

Cada nuevo usuario que se registra en MaxiOS Pool recibe automáticamente un bono de $1.00 USD directo en su billetera interna para comenzar a generar rentabilidad desde el primer segundo. Este beneficio busca romper barreras de entrada y permitir que cualquier persona experimente el poder de la minería en un entorno seguro y transparente.`
  },
  {
    id: 'project-transparency-4',
    title: 'Compromiso de Transparencia Operativa y Trazabilidad On-Chain',
    category: 'Protocolo & Seguridad',
    createdAt: new Date('2026-07-15'),
    author: 'Comité de Auditoría',
    summary: 'Todas las operaciones, recompensas de bloque y pagos se pueden verificar públicamente en la cadena de bloques con cero comisiones ocultas.',
    content: `La confianza de nuestros usuarios se sostiene sobre la transparencia absoluta. En MaxiOS Pool, cada bloque minado, cada distribución de recompensas y cada retiro procesado es totalmente trazable on-chain.

No existen tarifas ocultas ni retenciones sorpresa. Ponemos a disposición de la comunidad herramientas de monitoreo en tiempo real, estadísticas globales del estado de la red y registros contables auditables para que cada minero verifique que recibe exactamente la parte que le corresponde.`
  }
];

const AllNewsPage = () => {
  const { t, language } = useLanguage();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [activeNewsModal, setActiveNewsModal] = useState(null);

  useEffect(() => {
    const fetchAllNews = async () => {
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
            category: data.category || 'Anuncio',
            author: data.author || 'Equipo MaxiOS',
            summary: data.summary || data.content?.substring(0, 150) + '...',
            content: data.content || '',
            createdAt: dateObj,
          };
        });

        // Combinar noticias de Firebase con las noticias institucionales por defecto
        // Evitar duplicados si ya existen en Firebase
        const combined = [...fetchedNews];
        DEFAULT_PROJECT_NEWS.forEach(defItem => {
          if (!combined.some(item => item.id === defItem.id || item.title === defItem.title)) {
            combined.push(defItem);
          }
        });

        setNews(combined);
      } catch (err) {
        console.error("Error fetching all news from Firebase, using default trust news:", err);
        setNews(DEFAULT_PROJECT_NEWS);
      } finally {
        setLoading(false);
      }
    };

    fetchAllNews();
  }, []);

  const categories = [
    'Todas',
    'Manifiesto & Misión',
    'Estabilidad & Hashrate',
    'Comunidad',
    'Protocolo & Seguridad'
  ];

  const filteredNews = news.filter(item => {
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.summary && item.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative min-h-screen bg-[#0b0e14] text-white overflow-hidden pt-20 pb-24">
      {/* Elementos decorativos de fondo al estilo FuturisticHome */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-orange-500/10 blur-[130px] rounded-full mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[160px] rounded-full mix-blend-screen"></div>
        <div className="absolute top-2/3 left-1/3 w-[400px] h-[400px] bg-emerald-500/10 blur-[140px] rounded-full mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50 z-0"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">

        {/* Insignia y Encabezado Principal */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 mb-6 text-sm font-semibold shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            {t('🛡️ Proyecto Sin Fines de Lucro • Estabilización de Minería', '🛡️ Non-Profit Project • Mining Stabilization')}
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-300 to-emerald-400">
              {t('Noticias y Novedades del Proyecto', 'Project News & Updates')}
            </span>
          </h1>

          <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
            {t(
              'Transparencia total para nuestra comunidad. Descubre cómo trabajamos de forma sin fines de lucro para estabilizar la tasa de minería, eliminar tarifas abusivas y mejorar el rendimiento de todos los mineros.',
              'Total transparency for our community. Discover how we work on a non-profit basis to stabilize the mining rate, eliminate unfair fees, and boost returns for all miners.'
            )}
          </p>
        </div>

        {/* Tarjeta de Garantía y Misión del Proyecto (Trust Banner) */}
        <div className="relative bg-[#131824]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-orange-500/30 shadow-[0_0_35px_rgba(249,115,22,0.15)] mb-14 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 via-yellow-500/10 to-emerald-500/20 flex items-center justify-center border border-orange-500/30 shadow-inner flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center lg:justify-start gap-2">
                <span>{t('Nuestra Promesa Colectiva', 'Our Collective Promise')}</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-1 rounded-full border border-emerald-500/30">
                  {t('100% Transparente', '100% Transparent')}
                </span>
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4">
                {t(
                  'No cobramos comisiones corporativas. Toda la potencia minera conectada a MaxiOS Pool contribuye a un fondo común de equilibrio que minimiza la varianza de bloques, estabilizando los ingresos diarios para que pequeños y grandes mineros prosperen juntos.',
                  'We charge no corporate fees. All mining power connected to MaxiOS Pool contributes to a collective balancing fund that minimizes block variance, stabilizing daily payouts so both small and large miners thrive together.'
                )}
              </p>

              {/* 4 Pilares de Confianza */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs sm:text-sm font-semibold pt-2">
                <div className="flex items-center justify-center lg:justify-start gap-2 bg-[#0b0e14]/60 p-2.5 rounded-xl border border-[#1e2330] text-emerald-400">
                  <span>⚖️</span>
                  <span>{t('Sin Comisiones Ocultas', 'Zero Hidden Fees')}</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2 bg-[#0b0e14]/60 p-2.5 rounded-xl border border-[#1e2330] text-orange-400">
                  <span>⚡</span>
                  <span>{t('Hashrate Estable', 'Stable Hashrate')}</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2 bg-[#0b0e14]/60 p-2.5 rounded-xl border border-[#1e2330] text-yellow-400">
                  <span>🎁</span>
                  <span>{t('Bono $1.00 USD Gratis', 'Free $1.00 USD Bonus')}</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2 bg-[#0b0e14]/60 p-2.5 rounded-xl border border-[#1e2330] text-blue-400">
                  <span>🔍</span>
                  <span>{t('Auditoría On-Chain', 'On-Chain Audit')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buscador y Filtros por Categoría */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          
          {/* Tabs de Categorías */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                    : 'bg-[#131824]/80 border border-[#1e2330] text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                {t(cat, cat)}
              </button>
            ))}
          </div>

          {/* Campo de Búsqueda */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder={t('Buscar noticias...', 'Search news...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#131824]/80 border border-[#1e2330] focus:border-orange-500 rounded-full text-sm text-white placeholder-gray-500 outline-none transition-colors"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Renderizado de Tarjetas de Noticias */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 animate-pulse">{t('Cargando noticias y actualizaciones...', 'Loading news and updates...')}</p>
          </div>
        ) : filteredNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item) => (
              <div
                key={item.id}
                className="group relative bg-[#131824]/80 backdrop-blur-xl p-6 rounded-3xl border border-[#1e2330] hover:border-orange-500/40 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between shadow-xl overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/15 transition-colors pointer-events-none"></div>

                <div>
                  {/* Categoría y Fecha */}
                  <div className="flex items-center justify-between mb-4 text-xs">
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-semibold">
                      {item.category || 'Anuncio'}
                    </span>
                    <span className="text-gray-400 font-medium">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>

                  {/* Título */}
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-orange-400 transition-colors leading-snug">
                    {item.title}
                  </h3>

                  {/* Resumen */}
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
                    {item.summary || item.content}
                  </p>
                </div>

                {/* Pie de tarjeta y Acción */}
                <div className="pt-4 border-t border-[#1e2330]/80 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {item.author || 'Equipo MaxiOS'}
                  </span>

                  <button
                    onClick={() => setActiveNewsModal(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors group-hover:translate-x-0.5"
                  >
                    <span>{t('Leer Noticia', 'Read News')}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#131824]/60 backdrop-blur-xl p-12 rounded-3xl border border-[#1e2330] text-center max-w-lg mx-auto my-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-gray-300 font-semibold mb-2">{t('No se encontraron noticias', 'No news found')}</p>
            <p className="text-gray-500 text-sm mb-6">{t('Prueba ajustando el término de búsqueda o seleccionando otra categoría.', 'Try adjusting your search term or selecting another category.')}</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('Todas'); }}
              className="px-6 py-2 bg-gradient-to-r from-orange-600 to-yellow-500 text-white rounded-full text-xs font-bold shadow-lg"
            >
              {t('Ver Todas las Noticias', 'View All News')}
            </button>
          </div>
        )}

        {/* Sección de Llamado a la Acción para Unirse al Colectivo */}
        <div className="mt-20 bg-gradient-to-r from-orange-950/40 via-[#131824] to-emerald-950/40 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-orange-500/30 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-40"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white mb-4">
              {t('¿Listo para minar en una pool justa y transparente?', 'Ready to mine on a fair & transparent pool?')}
            </h2>
            <p className="text-gray-300 text-sm sm:text-base mb-8 leading-relaxed">
              {t(
                'Únete a nuestro colectivo sin fines de lucro hoy. Recibe tu bono de bienvenida de $1.00 USD al registrarte y forma parte del cambio en la estabilización de la minería de Bitcoin.',
                'Join our non-profit collective today. Get your $1.00 USD welcome bonus upon registering and be part of the shift in Bitcoin mining stabilization.'
              )}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/signup"
                className="px-8 py-4 bg-gradient-to-r from-orange-600 to-yellow-500 rounded-full font-bold text-white shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 transform hover:-translate-y-1 text-center"
              >
                {t('Registrarme y Obten $1 Gratis', 'Register & Get $1 Free')}
              </Link>
              <Link
                to="/calculator"
                className="px-8 py-4 bg-[#131824] border border-[#1e2330] hover:border-gray-500 rounded-full font-bold text-gray-300 hover:text-white transition-all text-center"
              >
                {t('Calcular Rentabilidad', 'Calculate Profitability')}
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Modal de Lectura de Noticia Completa */}
      {activeNewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative bg-[#131824] border border-orange-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setActiveNewsModal(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#0b0e14] border border-[#1e2330] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold">
                {activeNewsModal.category || 'Anuncio'}
              </span>
              <span className="text-xs text-gray-400">
                {activeNewsModal.createdAt ? new Date(activeNewsModal.createdAt).toLocaleDateString() : ''}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-snug">
              {activeNewsModal.title}
            </h2>

            <div className="flex items-center gap-2 pb-6 border-b border-[#1e2330] mb-6 text-xs text-emerald-400 font-semibold">
              <span>🛡️ {t('Publicado por', 'Published by')}: {activeNewsModal.author || 'Equipo MaxiOS'}</span>
              <span>•</span>
              <span>{t('Garantía Sin Fines de Lucro', 'Non-Profit Guarantee')}</span>
            </div>

            <div className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-4">
              {activeNewsModal.content}
            </div>

            <div className="mt-8 pt-6 border-t border-[#1e2330] flex justify-end">
              <button
                onClick={() => setActiveNewsModal(null)}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 text-white font-bold rounded-full text-xs shadow-lg"
              >
                {t('Cerrar Lectura', 'Close Article')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllNewsPage;

