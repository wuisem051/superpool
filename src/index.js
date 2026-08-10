import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; // Importar ThemeProvider
import { GlobalStateProvider } from './context/GlobalStateContext'; // Importar GlobalStateProvider
import { ErrorProvider } from './context/ErrorContext'; // Importar ErrorProvider
import { LanguageProvider } from './context/LanguageContext'; // Importar LanguageProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorProvider> {/* Envolver con ErrorProvider */}
      <GlobalStateProvider> {/* Envolver con GlobalStateProvider */}
        <ThemeProvider> {/* Envolver con ThemeProvider */}
          <LanguageProvider> {/* Envolver con LanguageProvider */}
            <AuthProvider>
              <App />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </GlobalStateProvider>
    </ErrorProvider>
  </React.StrictMode>
);
