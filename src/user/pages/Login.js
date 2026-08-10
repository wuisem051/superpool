import React, { useRef, useState, useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useError } from '../../context/ErrorContext';
import sanitizeInput from '../../utils/sanitizeInput';
import { ThemeContext } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageToggle from '../../common/components/LanguageToggle';

const Login = () => {
  const identifierRef = useRef();
  const passwordRef = useRef();
  const { login } = useAuth();
  const { showError, error } = useError();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      showError(null);
      setLoading(true);
      const sanitizedIdentifier = sanitizeInput(identifierRef.current.value);
      const password = passwordRef.current.value;

      await login(sanitizedIdentifier, password);
      navigate('/user/dashboard');
    } catch (err) {
      if (err.message && err.message.includes('No se encontró el perfil')) {
        showError(err.message);
      } else {
        showError(t('Fallo al iniciar sesión: ', 'Login failed: ') + (err.code || err.message));
      }
      console.error("Error al iniciar sesión:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-500/30 ${
      darkMode ? 'bg-[#06080d] text-slate-100' : 'bg-slate-900 text-slate-100'
    }`}>
      {/* Botón superior de idioma */}
      <div className="absolute top-6 right-6 z-30">
        <LanguageToggle />
      </div>

      {/* Dynamic Background Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/15 via-orange-600/10 to-amber-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Futuristic Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Main Glass Card Container */}
      <div className="relative max-w-md w-full space-y-7 p-8 sm:p-10 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-10 transition-all duration-300">
        
        {/* Glow Line Header */}
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        {/* Top Brand Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] mb-1">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="inline-block px-3 py-1 text-[11px] font-semibold tracking-wider uppercase text-amber-400 bg-amber-500/10 rounded-full border border-amber-500/20 mb-2">
              MaxiOS Pool v2.0
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t('Bienvenido de nuevo', 'Welcome Back')}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              {t('Accede a tu panel de minería en tiempo real', 'Access your real-time mining dashboard')}
            </p>
          </div>
        </div>

        {/* Auth Mode Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs font-semibold">
          <button
            type="button"
            className="py-2.5 rounded-lg text-amber-400 bg-slate-800/90 shadow-sm border border-slate-700/60 transition-all text-center font-bold"
          >
            {t('Iniciar Sesión', 'Login')}
          </button>
          <Link
            to="/signup"
            className="py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all text-center"
          >
            {t('Crear Cuenta', 'Create Account')}
          </Link>
        </div>

        {/* Global Error Banner if present */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs sm:text-sm animate-fade-in-up">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Input 1: Identifier */}
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="block text-xs font-medium text-slate-300">
                {t('Correo Electrónico', 'Email Address')}
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  ref={identifierRef}
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                  placeholder={t('ejemplo@correo.com', 'example@email.com')}
                />
              </div>
            </div>

            {/* Input 2: Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-slate-300">
                  {t('Contraseña', 'Password')}
                </label>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-11 pr-11 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden py-3.5 px-4 rounded-xl text-slate-950 font-extrabold text-sm bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t('Iniciando sesión...', 'Logging in...')}</span>
                </>
              ) : (
                <>
                  <span>{t('Iniciar Sesión', 'Login')}</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </form>

        {/* Footer Info */}
        <div className="pt-2 text-center space-y-4">
          <p className="text-xs text-slate-400">
            {t('¿Aún no tienes cuenta?', "Don't have an account yet?")}{' '}
            <Link to="/signup" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors underline decoration-amber-500/30 underline-offset-4">
              {t('Regístrate ahora', 'Register now')}
            </Link>
          </p>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>{t('Conexión Encriptada SSL 256-bit', '256-bit SSL Encrypted Connection')}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
