import React, { useState, useEffect, useContext } from 'react'; // Importar useContext
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext'; // Importar ThemeContext
import { useLanguage } from '../../context/LanguageContext'; // Importar LanguageContext
import LanguageToggle from '../components/LanguageToggle'; // Importar LanguageToggle
import { db } from '../../services/firebase'; // Importar Firebase Firestore
import { doc, getDoc } from 'firebase/firestore';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const { darkMode, setDarkMode, theme } = useContext(ThemeContext); // Usar ThemeContext y theme
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation(); // Obtener la ubicación actual
  const [isOpen, setIsOpen] = useState(false); // Estado para el menú móvil
  const [siteName, setSiteName] = useState('MaxiOS Arbitraje Pool BTC'); // Estado para el nombre del sitio

  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        const docRef = doc(db, 'settings', 'siteConfig');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSiteName(data.siteName || 'MaxiOS Arbitraje Pool BTC');
        } else {
          setSiteName('MaxiOS Arbitraje Pool BTC');
        }
      } catch (err) {
        console.error("Error fetching site name for Header from Firebase:", err);
        setSiteName('MaxiOS Arbitraje Pool BTC'); // Fallback en caso de error
      }
    };
    fetchSiteName();
  }, []);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      console.error("Fallo al cerrar sesión");
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <header className={`shadow-md ${theme.backgroundAlt} ${theme.text}`}> {/* Aplicar clases de tema */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y botón de modo dev */}
          <div className="flex items-center">
            <Link to="/" className={`flex-shrink-0 text-xl font-bold mr-4 ${theme.text}`}> {/* Aplicar clases de tema */}
              <span className="text-accent">{siteName.charAt(0)}</span>{siteName.substring(1)}
            </Link>
          </div>

          {/* Navegación principal (Desktop) */}
          <nav className="hidden md:flex items-center space-x-2">
            {process.env.NODE_ENV === 'development' && (
              <>
                <Link
                  to="/admin"
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${location.pathname.startsWith('/admin')
                    ? 'bg-red-600 text-white' // Color distintivo para admin dev
                    : `text-red-400 hover:bg-red-800 hover:text-white`
                    }`}
                >
                  Admin (Dev)
                </Link>
                <Link
                  to="/user/dashboard"
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${location.pathname.startsWith('/user')
                    ? 'bg-blue-600 text-white' // Color distintivo para user dev
                    : `text-blue-400 hover:bg-blue-800 hover:text-white`
                    }`}
                >
                  Usuario (Dev)
                </Link>
              </>
            )}
            <Link
              to="/"
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${location.pathname === '/' && location.hash === ''
                ? 'bg-accent text-white'
                : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                }`}
            >
              {t('Inicio', 'Home')}
            </Link>
            <Link
              to="/calculator"
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${location.pathname === '/calculator'
                ? 'bg-accent text-white'
                : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                }`}
            >
              {t('Calculadora', 'Calculator')}
            </Link>
            <Link
              to="/pool-stats"
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${location.pathname === '/pool-stats'
                ? 'bg-accent text-white'
                : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                }`}
            >
              {t('Red Global', 'Global Network')}
            </Link>
            <Link
              to="/news"
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${location.pathname === '/news'
                ? 'bg-accent text-white'
                : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                }`}
            >
              {t('Noticias', 'News')}
            </Link>
            {currentUser ? (
              <>
                <Link
                  to="/user/dashboard"
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${location.pathname.startsWith('/user')
                    ? 'bg-accent text-white'
                    : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                    }`}
                >
                  {t('Panel de Usuario', 'User Dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${`${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                    }`}
                >
                  {t('Cerrar Sesión', 'Logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${location.pathname === '/signup'
                    ? 'bg-accent text-white'
                    : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                    }`}
                >
                  {t('Registrarse', 'Register')}
                </Link>
                <Link
                  to="/login"
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${location.pathname === '/login'
                    ? 'bg-accent text-white'
                    : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                    }`}
                >
                  {t('Iniciar Sesión', 'Login')}
                </Link>
              </>
            )}

            {/* Selector de idioma */}
            <div className="ml-2">
              <LanguageToggle compact={true} />
            </div>
          </nav>

          {/* Botón de menú móvil */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageToggle compact={true} />
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className={`inline-flex items-center justify-center p-2 rounded-md transition-colors duration-200 ${`${theme.textSoft} hover:${theme.backgroundAlt} focus:ring-${theme.text}`
                }`}
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menú principal</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isOpen && (
        <div className={`md:hidden ${theme.backgroundAlt}`} id="mobile-menu"> {/* Aplicar clases de tema */}
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {process.env.NODE_ENV === 'development' && (
              <>
                <Link
                  to="/admin"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${location.pathname.startsWith('/admin')
                    ? 'bg-red-600 text-white'
                    : `text-red-400 hover:bg-red-800 hover:text-white`
                    }`}
                >
                  Admin (Dev)
                </Link>
                <Link
                  to="/user/dashboard"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${location.pathname.startsWith('/user')
                    ? 'bg-blue-600 text-white'
                    : `text-blue-400 hover:bg-blue-800 hover:text-white`
                    }`}
                >
                  Usuario (Dev)
                </Link>
              </>
            )}
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${location.pathname === '/' && location.hash === ''
                ? 'bg-accent text-white'
                : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                }`}
            >
              {t('Inicio', 'Home')}
            </Link>
            <Link
              to="/calculator"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${location.pathname === '/calculator'
                ? 'bg-accent text-white'
                : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                }`}
            >
              {t('Calculadora', 'Calculator')}
            </Link>
            <Link
              to="/pool-stats"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${location.pathname === '/pool-stats'
                  ? 'bg-accent text-white'
                  : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                }`}
            >
              {t('Red Global', 'Global Network')}
            </Link>
            <Link
              to="/news"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${location.pathname === '/news'
                  ? 'bg-accent text-white'
                  : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                }`}
            >
              {t('Noticias', 'News')}
            </Link>
            {currentUser ? (
              <>
                <Link
                  to="/user/dashboard"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${location.pathname.startsWith('/user')
                    ? 'bg-accent text-white'
                    : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                    }`}
                >
                  {t('Panel de Usuario', 'User Dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${`${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                    }`}
                >
                  {t('Cerrar Sesión', 'Logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${location.pathname === '/signup'
                    ? 'bg-accent text-white'
                    : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                    }`}
                >
                  {t('Registrarse', 'Register')}
                </Link>
                <Link
                  to="/login"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${location.pathname === '/login'
                    ? 'bg-accent text-white'
                    : `${theme.textSoft} hover:${theme.backgroundAlt} hover:${theme.text}`
                    }`}
                >
                  {t('Iniciar Sesión', 'Login')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
