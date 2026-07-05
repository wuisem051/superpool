import React, { lazy, Suspense, useContext, useEffect } from 'react'; // Importar lazy y Suspense
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Header from './common/layout/Header';
import Footer from './common/layout/Footer';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import { db } from './services/firebase'; // Importar db desde firebase.js
import { doc, getDoc } from 'firebase/firestore';
import { ThemeContext } from './context/ThemeContext'; // Importar ThemeContext

// Carga perezosa de componentes de página
const Home = lazy(() => import('./user/pages/Home')); // Mantener el Home original por ahora, pero no se usará en la ruta principal
const FuturisticHome = lazy(() => import('./user/pages/FuturisticHome')); // Nuevo Home futurista
const Login = lazy(() => import('./user/pages/Login'));
const Signup = lazy(() => import('./user/pages/Signup'));
const UserPanel = lazy(() => import('./user/pages/UserPanel'));
const AdminPanel = lazy(() => import('./admin/pages/AdminPanel'));
const AdminLogin = lazy(() => import('./admin/pages/AdminLogin'));
const AllNewsPage = lazy(() => import('./user/pages/AllNewsPage')); // Nueva página para todas las noticias
const ProfitabilityCalculatorPage = lazy(() => import('./user/pages/ProfitabilityCalculatorPage')); // Página de la calculadora de rentabilidad

// Componente interno que puede usar useLocation (debe estar dentro del Router)
function AppContent() {
  const { darkMode, theme } = useContext(ThemeContext);
  const location = useLocation();

  // El footer NO aparece dentro del panel de usuario
  const hideFooter = location.pathname.startsWith('/user') ||
    location.pathname.startsWith('/test-user-settings') ||
    location.pathname.startsWith('/admin');

  // Efecto para cargar el favicon dinámicamente
  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'siteConfig');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Actualizar favicon
          if (data.faviconUrl) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = data.faviconUrl;
          }
          // Actualizar título del documento
          if (data.siteName) {
            document.title = data.siteName;
          } else {
            document.title = 'MaxiOS Pool';
          }
        } else {
          document.title = 'MaxiOS Pool';
        }
      } catch (err) {
        console.error("Error fetching site settings for App component from Firebase:", err);
        document.title = 'MaxiOS Pool';
      }
    };
    fetchSiteSettings();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <AuthProvider>
          <Suspense fallback={<div>Cargando...</div>}>
            <Routes>
              <Route path="/" element={<FuturisticHome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/test-user-settings/*"
                element={
                  <ProtectedRoute>
                    <UserPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/*"
                element={
                  <ProtectedRoute>
                    <UserPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={<AdminPanel />}
              />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/news" element={<AllNewsPage />} />
              <Route path="/calculator" element={<ProfitabilityCalculatorPage />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default App;
