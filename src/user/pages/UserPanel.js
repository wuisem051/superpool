import React, { useState, useEffect, useRef, useContext, useMemo } from 'react'; // Importar useContext y useMemo
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext'; // Importar ThemeContext
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { countMinersByUser } from '../../utils/miners';
import { db, auth } from '../../services/firebase'; // Importar db y auth desde firebase.js
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, setDoc, addDoc, deleteDoc, getDocs, orderBy, getDocFromCache } from 'firebase/firestore';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import UserPoolArbitrage from '../components/UserPoolArbitrage'; // Importar UserPoolArbitrage
import WalletDisplay from '../components/WalletDisplay'; // Importar WalletDisplay
import MiningPortfolioContent from '../components/MiningPortfolioContent'; // Importar MiningPortfolioContent
import P2P_MarketplacePage from '../pages/P2P_MarketplacePage'; // Importar P2P_MarketplacePage
import CollectiveFundContent from '../components/CollectiveFundContent'; // Importar CollectiveFundContent
import BonusContent from '../components/BonusContent'; // Importar BonusContent
import Sidebar from '../../common/layout/Sidebar'; // Importar Sidebar
import Navbar from '../components/Navbar'; // Importar Navbar
import MainContent from '../components/MainContent'; // Importar MainContent
import ErrorMessage from '../components/ErrorMessage'; // Importar ErrorMessage
import StatsSection from '../components/StatsSection'; // Importar StatsSection
import PerformanceStatsSection from '../components/PerformanceStatsSection'; // Importar PerformanceStatsSection
import MinerDisplay from '../components/MinerDisplay'; // Importar MinerDisplay
import HomeMinersContent from '../components/HomeMinersContent'; // Importar HomeMinersContent
import styles from './UserPanel.module.css'; // Importar estilos CSS Modules
import useFormValidation from '../../hooks/useFormValidation'; // Importar useFormValidation
import { useError } from '../../context/ErrorContext'; // Importar useError
import minersData from '../../data/miners'; // Importar la lista de mineros

// Función de ayuda para evitar bloqueos si la red tiene mala conexión o está bloqueada por el ISP
const withTimeout = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout: La petición tomó demasiado tiempo."));
    }, ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
};

// Componentes de las sub-secciones

const MinersContent = ({ styles }) => {
  const { darkMode } = useContext(ThemeContext); // Usar ThemeContext

  // Esta función no necesita hacer nada específico aquí, ya que las suscripciones de Firestore
  // en UserPanel ya manejan la actualización de los balances y la lista de mineros.
  const handleMinerPurchased = () => {
    console.log("Minero comprado. Las suscripciones de Firestore se encargarán de las actualizaciones.");
  };

  return (
    <div className={`${styles.minersContent} ${darkMode ? styles.dark : styles.light}`}>
      <h1 className={styles.pageTitle}>Tienda de Mineros</h1>
      <p className={styles.developmentText}>Explora y adquiere los mineros más eficientes para potenciar tu ganancia.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {minersData.map(miner => (
          <MinerDisplay key={miner.id} miner={miner} onMinerPurchased={handleMinerPurchased} />
        ))}
      </div>
    </div>
  );
};

const DashboardContent = ({ userMiners, chartData, userBalances, paymentRate, btcToUsdRate, totalHashratePool, poolCommission, paymentsHistory, withdrawalsHistory, styles, totalHashrate, estimatedDailyUSD, activeMinersAllUsers, pricePerTHs }) => {
  const { darkMode } = useContext(ThemeContext); // Usar ThemeContext

  console.log("DashboardContent: Renderizando con props:", { userMiners, chartData, userBalances, paymentRate, btcToUsdRate, totalHashratePool, poolCommission, paymentsHistory, withdrawalsHistory, totalHashrate, estimatedDailyUSD });

  const estimatedDailyBTC = useMemo(() => {
    return btcToUsdRate > 0 ? estimatedDailyUSD / btcToUsdRate : 0;
  }, [estimatedDailyUSD, btcToUsdRate]);

  const userPercentageOfPool = useMemo(() => {
    return totalHashratePool > 0 ? (totalHashrate / totalHashratePool) * 100 : 0;
  }, [totalHashrate, totalHashratePool]);

  // Obtener el último pago o retiro
  const lastPayment = paymentsHistory.length > 0 ? paymentsHistory[0] : null;
  const lastWithdrawal = withdrawalsHistory.length > 0 ? withdrawalsHistory[0] : null;

  let lastTransactionInfo = "No hay historial";
  if (lastPayment && lastWithdrawal) {
    if (lastPayment.createdAt > lastWithdrawal.createdAt) {
      lastTransactionInfo = `Pago: ${lastPayment.amount.toFixed(8)} ${lastPayment.currency} (${lastPayment.createdAt.toLocaleDateString()})`;
    } else {
      lastTransactionInfo = `Retiro: ${lastWithdrawal.amount.toFixed(8)} ${lastWithdrawal.currency} (${lastWithdrawal.createdAt.toLocaleDateString()})`;
    }
  } else if (lastPayment) {
    lastTransactionInfo = `Pago: ${lastPayment.amount.toFixed(8)} ${lastPayment.currency} (${lastPayment.createdAt.toLocaleDateString()})`;
  } else if (lastWithdrawal) {
    lastTransactionInfo = `Retiro: ${lastWithdrawal.amount.toFixed(8)} ${lastWithdrawal.currency} (${lastWithdrawal.createdAt.toLocaleDateString()})`;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tu Hashrate */}
        <div className="relative overflow-hidden bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl transition-transform hover:-translate-y-1 duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <h3 className="text-gray-400 font-semibold text-sm mb-2">Tu Hashrate</h3>
          <p className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            {totalHashrate.toFixed(2)} TH/s
          </p>
          <div className="absolute top-6 right-6 p-3 bg-blue-500/10 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
        </div>

        {/* Ganancia Estimada Diaria */}
        <div className="relative overflow-hidden bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl transition-transform hover:-translate-y-1 duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <h3 className="text-gray-400 font-semibold text-sm mb-2">Ganancia Estimada Diaria</h3>
          <p className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
            ${estimatedDailyUSD.toFixed(2)}
          </p>
          <div className="absolute top-6 right-6 p-3 bg-green-500/10 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V3a1 1 0 00-1-1H4a1 1 0 00-1 1v18a1 1 0 001 1h12a1 1 0 001-1v-5m-1-10v4m-4 0h4" /></svg>
          </div>
        </div>

        {/* Tasa de Pago */}
        <div className="relative overflow-hidden bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl transition-transform hover:-translate-y-1 duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <h3 className="text-gray-400 font-semibold text-sm mb-2">Tasa de Pago</h3>
          <p className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
            ${paymentRate.toFixed(2)}<span className="text-lg text-gray-500">/TH/s</span>
          </p>
          <div className="absolute top-6 right-6 p-3 bg-orange-500/10 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
        </div>
      </div>

      <PerformanceStatsSection /> {/* Añadir PerformanceStatsSection */}
      <StatsSection totalHashrate={totalHashratePool} activeMiners={activeMinersAllUsers} pricePerTHs={pricePerTHs} /> {/* Añadir StatsSection */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rendimiento Histórico */}
        <div className="lg:col-span-2 bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
            Rendimiento Histórico
          </h3>
          <div className="w-full h-72">
            {userMiners.length > 0 ? (
              <Bar data={chartData} options={{ maintainAspectRatio: false, color: '#9ca3af' }} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-[#1e2330] rounded-xl text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <p>No hay datos de rendimiento disponibles.</p>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas de la Pool */}
        <div className="bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl flex flex-col">
          <h3 className="text-white font-bold text-lg mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Estadísticas de la Pool
          </h3>
          <div className="space-y-6 flex-1 flex flex-col justify-center">
            <div className="bg-[#131824] p-4 rounded-xl border border-[#1e2330] flex items-center justify-between">
              <span className="text-gray-400 font-medium text-sm">Comisión de la Pool</span>
              <span className="text-red-400 font-bold bg-red-500/10 px-3 py-1 rounded-lg">{poolCommission.toFixed(1)}%</span>
            </div>

            <div className="bg-[#131824] p-4 rounded-xl border border-[#1e2330] flex flex-col gap-2">
              <span className="text-gray-400 font-medium text-sm">Última Transacción</span>
              <span className="text-green-400 font-semibold font-mono text-sm break-words leading-relaxed text-right">
                {lastTransactionInfo}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiningInfoContent = ({ currentUser, userMiners, setUserMiners, styles }) => {
  const { darkMode } = useContext(ThemeContext); // Usar ThemeContext
  const { showError, showSuccess } = useError(); // Usar el contexto de errores
  const [poolUrl, setPoolUrl] = useState('stratum+tcp://bitcoinpool.com:4444');
  const [port, setPort] = useState('4444');
  const [defaultWorkerName, setDefaultWorkerName] = useState('worker1');
  const miningPassword = 'x';
  const [isLoading, setIsLoading] = useState(false); // Estado de carga

  const initialMinerState = {
    newMinerThs: '',
  };

  const validateMinerForm = (values) => {
    const errors = {};
    if (!values.newMinerThs) {
      errors.newMinerThs = 'El poder de minado es requerido.';
    } else if (isNaN(parseFloat(values.newMinerThs)) || parseFloat(values.newMinerThs) <= 0) {
      errors.newMinerThs = 'Por favor, introduce una cantidad válida de TH/s.';
    }
    return errors;
  };

  const {
    values: minerValues,
    handleChange: handleMinerChange,
    handleSubmit: handleMinerSubmit,
    errors: minerErrors,
    isSubmitting: isMinerSubmitting,
    setValues: setMinerValues,
    setErrors: setMinerErrors,
    setSubmitting: setMinerSubmitting,
  } = useFormValidation(initialMinerState, validateMinerForm);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copiado al portapapeles!');
  };

  useEffect(() => {
    const fetchPoolConfigAndMiners = async () => {
      try {
        // Cargar configuración del Pool desde Firebase
        const poolConfigRef = doc(db, 'settings', 'poolConfig');
        let poolConfigSnap;
        try {
          // Intentar obtener desde la caché local primero
          poolConfigSnap = await getDocFromCache(poolConfigRef);
        } catch (cacheError) {
          // Fallback al servidor Firebase con un timeout de 3 segundos
          console.warn("Configuración de pool no encontrada en caché, consultando servidor...");
          poolConfigSnap = await withTimeout(getDoc(poolConfigRef), 3000);
        }

        if (poolConfigSnap.exists()) {
          const poolConfigData = poolConfigSnap.data();
          setPoolUrl(poolConfigData.url || 'stratum+tcp://bitcoinpool.com:4444');
          setPort(poolConfigData.port || '4444');
          setDefaultWorkerName(poolConfigData.defaultWorkerName || 'worker1');
        }

        // Escuchar cambios en los mineros del usuario
        if (currentUser && currentUser.uid) {
          const q = query(collection(db, 'miners'), where('userId', '==', currentUser.uid));
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMiners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUserMiners(fetchedMiners);
          }, (err) => {
            console.error("Error fetching mining info from Firebase:", err);
            if (err.code !== 'unavailable') {
              showError('Fallo al cargar la información de minería.');
            }
          });

          return () => {
            unsubscribe();
          };
        } else {
          setUserMiners([]);
        }
      } catch (err) {
        console.error("Error fetching mining info:", err);
        if (err.message && !err.message.includes("offline")) {
          showError('Fallo al cargar la información de minería.');
        }
      }
    };
    fetchPoolConfigAndMiners();
  }, [currentUser, setUserMiners, showError]);

  useEffect(() => {
    if (isMinerSubmitting) {
      if (Object.keys(minerErrors).length === 0) {
        handleAddMinerSubmit();
      }
      setMinerSubmitting(false);
    }
  }, [isMinerSubmitting, minerErrors]);

  const handleAddMinerSubmit = async () => {
    setIsLoading(true);

    if (!currentUser || !currentUser.uid) {
      showError('Debes iniciar sesión para añadir un minero.');
      setIsLoading(false);
      return;
    }

    try {
      try {
        // Enviar con timeout corto de 2.5 segundos. Si se pasa del tiempo (offline), se sincronizará en segundo plano.
        await withTimeout(addDoc(collection(db, 'miners'), {
          userId: currentUser.uid,
          workerName: defaultWorkerName || `worker-${Math.random().toString(36).substring(2, 8)}`,
          currentHashrate: parseFloat(minerValues.newMinerThs),
          status: 'activo',
          createdAt: new Date(),
        }), 2500);
        showSuccess('Minero añadido exitosamente!');
      } catch (timeoutOrError) {
        console.warn("Fallo temporal de conexión. El minero se agregará y sincronizará en segundo plano:", timeoutOrError);
        showSuccess('Minero configurado. Se sincronizará en segundo plano.');
      }

      setMinerValues(initialMinerState); // Limpiar el formulario
      setMinerErrors({}); // Limpiar errores
    } catch (err) {
      console.error("Error al añadir minero:", err);
      showError(`Fallo al añadir minero: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMiner = async (minerId) => {
    if (!currentUser || !currentUser.uid) {
      showError('Debes iniciar sesión para eliminar un minero.');
      return;
    }
    if (window.confirm('¿Estás seguro de que quieres eliminar este minero?')) {
      setIsLoading(true);
      try {
        try {
          await withTimeout(deleteDoc(doc(db, 'miners', minerId)), 2500);
          showSuccess('Minero eliminado exitosamente.');
        } catch (timeoutOrError) {
          console.warn("Sincronizando la eliminación del minero en segundo plano:", timeoutOrError);
          showSuccess('Minero removido localmente. Sincronizando en segundo plano.');
        }
      } catch (err) {
        console.error("Error al eliminar minero:", err);
        showError(`Fallo al eliminar minero: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-8 flex items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-white font-semibold text-lg">Procesando...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-orange-500/10 rounded-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Configurar Pool de Minería</h1>
          <p className="text-gray-400 text-sm">Conecta y gestiona tus workers de minería</p>
        </div>
      </div>

      {/* Instrucciones de Conexión */}
      <div className="bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl">
        <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Datos de Conexión al Pool
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* URL */}
          <div className="bg-[#131824] border border-[#1e2330] rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">URL del Pool</p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-orange-400 font-mono text-sm truncate">{poolUrl}</code>
              <button
                onClick={() => handleCopy(poolUrl)}
                className="flex-shrink-0 p-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors"
                title="Copiar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
          </div>
          {/* Puerto */}
          <div className="bg-[#131824] border border-[#1e2330] rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Puerto</p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-cyan-400 font-mono text-sm">{port}</code>
              <button
                onClick={() => handleCopy(port)}
                className="flex-shrink-0 p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors"
                title="Copiar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
          </div>
          {/* Contraseña */}
          <div className="bg-[#131824] border border-[#1e2330] rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Contraseña</p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-green-400 font-mono text-sm">{miningPassword}</code>
              <button
                onClick={() => handleCopy(miningPassword)}
                className="flex-shrink-0 p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                title="Copiar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bloque de código de configuración */}
        <div className="bg-[#060a10] border border-[#1e2330] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e2330] bg-[#0b0e14]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
            </div>
            <span className="text-gray-500 text-xs font-mono">mining.conf</span>
            <button
              onClick={() => handleCopy(`URL: ${poolUrl}\nUsuario: ${defaultWorkerName}\nContraseña: ${miningPassword}`)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Copiar todo
            </button>
          </div>
          <pre className="p-4 text-sm font-mono leading-relaxed">
            <span className="text-gray-500"># Configuración del Worker</span>{`\n`}
            <span className="text-blue-400">URL</span><span className="text-gray-400">: </span><span className="text-green-400">{poolUrl}</span>{`\n`}
            <span className="text-blue-400">USUARIO</span><span className="text-gray-400">: </span><span className="text-yellow-400">{defaultWorkerName}</span>{`\n`}
            <span className="text-blue-400">CONTRASEÑA</span><span className="text-gray-400">: </span><span className="text-orange-400">{miningPassword}</span>
          </pre>
        </div>
      </div>

      {/* Grid: Añadir Minero + Mineros Activos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Añadir Nuevo Minero */}
        <div className="bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl">
          <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Añadir Nuevo Minero
          </h2>
          <form onSubmit={handleMinerSubmit} className="space-y-4">
            <div>
              <label htmlFor="newMinerThs" className="block text-sm font-semibold text-gray-400 mb-2">Poder de Minado (TH/s)</label>
              <input
                type="number"
                id="newMinerThs"
                name="newMinerThs"
                value={minerValues.newMinerThs}
                onChange={handleMinerChange}
                step="0.01"
                className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-colors font-mono"
                placeholder="Ej: 100.5"
                required
              />
              {minerErrors.newMinerThs && <p className="mt-1.5 text-sm text-red-400">{minerErrors.newMinerThs}</p>}
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || isMinerSubmitting}
            >
              {isLoading || isMinerSubmitting ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              )}
              {isLoading || isMinerSubmitting ? 'Añadiendo...' : 'Añadir Minero'}
            </button>
          </form>
        </div>

        {/* Mis Mineros Activos */}
        <div className="bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl">
          <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
            Mis Workers Activos
            <span className="ml-auto text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full font-bold">{userMiners.length} activo{userMiners.length !== 1 ? 's' : ''}</span>
          </h2>
          {userMiners.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-[#1e2330] rounded-xl text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
              <p className="text-sm">No tienes workers activos.</p>
              <p className="text-xs mt-1">¡Añade uno para comenzar!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {userMiners.map((miner) => (
                <div key={miner.id} className="flex items-center justify-between gap-3 bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse"></div>
                    <code className="text-gray-300 font-mono text-sm truncate">{miner.workerName}</code>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-cyan-400 font-mono font-bold text-sm">{(miner.currentHashrate || 0).toFixed(2)} TH/s</span>
                    <button
                      onClick={() => handleCopy(miner.workerName)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                      title="Copiar nombre"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDeleteMiner(miner.id)}
                      disabled={isLoading}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar worker"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================
// SECCIÓN UNIFICADA: MI BILLETERA + RETIROS
// =============================================
const WalletSection = ({ minPaymentThresholds, userPaymentAddresses, currentUser, styles }) => {
  const { showError, showSuccess } = useError();
  // --- Estado de Balances (de WalletDisplay) ---
  const [userPortfolio, setUserPortfolio] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [usdToUsdtAmount, setUsdToUsdtAmount] = useState('');
  const [exchangeLoading, setExchangeLoading] = useState(false);

  // --- Estado de Retiros (de WithdrawalsContent) ---
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BTC');
  const [walletAddress, setWalletAddress] = useState('');
  const [binanceId, setBinanceId] = useState('');
  const [useBinancePay, setUseBinancePay] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [userBalances, setUserBalances] = useState({ balanceUSD: 0, balanceBTC: 0, balanceLTC: 0, balanceDOGE: 0, balanceVES: 0 });
  const [withdrawalsHistory, setWithdrawalsHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('new');

  // Cargar balances + portfolio
  useEffect(() => {
    if (!currentUser?.uid) { setWalletLoading(false); return; }
    setWalletLoading(true);
    const userDocRef = doc(db, `users/${currentUser.uid}`);
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setUserPortfolio({
          fiatBalanceUSD: d.balanceUSD || 0,
          fiatBalanceVES: d.balanceVES || 0,
          virtualBalanceUSD: d.virtualBalanceUSD || 0,
          holdings: { BTC: d.balanceBTC || 0, LTC: d.balanceLTC || 0, DOGE: d.balanceDOGE || 0, USDT: d.balanceUSDT || 0 },
        });
        setUserBalances({ balanceUSD: d.balanceUSD || 0, balanceBTC: d.balanceBTC || 0, balanceLTC: d.balanceLTC || 0, balanceDOGE: d.balanceDOGE || 0, balanceVES: d.balanceVES || 0 });
      } else {
        setUserPortfolio({
          fiatBalanceUSD: 0,
          fiatBalanceVES: 0,
          virtualBalanceUSD: 0,
          holdings: { BTC: 0, LTC: 0, DOGE: 0, USDT: 0 },
        });
        setUserBalances({ balanceUSD: 0, balanceBTC: 0, balanceLTC: 0, balanceDOGE: 0, balanceVES: 0 });
      }
      setWalletLoading(false);
    }, (err) => { console.error(err); setWalletLoading(false); });
    return () => unsubscribe();
  }, [currentUser]);

  // Cargar historial de retiros
  useEffect(() => {
    if (!currentUser?.uid) { setWithdrawalsHistory([]); return; }
    const q = query(collection(db, 'withdrawals'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setWithdrawalsHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt.toDate() })));
    }, (err) => showError('Error al cargar retiros.'));
    return () => unsub();
  }, [currentUser]);

  // Sincronizar balance disponible al cambiar moneda
  useEffect(() => {
    setAvailableBalance(userBalances[`balance${currency}`] || 0);
    const saved = userPaymentAddresses[currency];
    if (!saved) { setSelectedAddress('new'); setWalletAddress(''); setBinanceId(''); setUseBinancePay(currency === 'USD'); }
    else { setSelectedAddress(saved); }
  }, [currency, userBalances, userPaymentAddresses]);

  // Intercambio USD -> USDT
  const handleExchange = async () => {
    const amt = parseFloat(usdToUsdtAmount);
    if (isNaN(amt) || amt <= 0) { showError('Cantidad inválida.'); return; }
    if (!userPortfolio || userPortfolio.fiatBalanceUSD < amt) { showError('Fondos insuficientes en USD.'); return; }
    setExchangeLoading(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { balanceUSD: userPortfolio.fiatBalanceUSD - amt, balanceUSDT: userPortfolio.holdings.USDT + amt }, { merge: true });
      setUsdToUsdtAmount('');
      showSuccess('Intercambio realizado con éxito!');
    } catch (err) { showError(`Error: ${err.message}`); }
    finally { setExchangeLoading(false); }
  };

  // Enviar retiro
  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault(); setIsLoading(true);
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) { showError('Cantidad inválida.'); setIsLoading(false); return; }
    const threshold = minPaymentThresholds[currency] || 0;
    if (withdrawalAmount < threshold) { showError(`Mínimo: ${threshold.toFixed(currency === 'USD' ? 2 : 8)} ${currency}.`); setIsLoading(false); return; }
    const currentBal = userBalances[`balance${currency}`] || 0;
    if (withdrawalAmount > currentBal) { showError('Fondos insuficientes.'); setIsLoading(false); return; }
    let method = 'Wallet', addressOrId = '';
    if (selectedAddress && selectedAddress !== 'new') {
      addressOrId = selectedAddress;
      method = (currency === 'USD' && useBinancePay) ? 'Binance Pay' : 'Wallet';
    } else if (useBinancePay) {
      if (!binanceId.trim()) { showError('Introduce tu ID de Binance.'); setIsLoading(false); return; }
      method = 'Binance Pay'; addressOrId = binanceId.trim();
    } else {
      if (!walletAddress.trim()) { showError('Introduce tu dirección de Wallet.'); setIsLoading(false); return; }
      addressOrId = walletAddress.trim();
    }
    try {
      await addDoc(collection(db, 'withdrawals'), { userId: currentUser.uid, userEmail: currentUser.email, amount: withdrawalAmount, currency, method, addressOrId, status: 'Pendiente', createdAt: new Date() });
      await updateDoc(doc(db, 'users', currentUser.uid), { [`balance${currency}`]: currentBal - withdrawalAmount });
      showSuccess('Solicitud de retiro enviada.');
      setAmount(''); setWalletAddress(''); setBinanceId('');
    } catch (err) { showError(`Error: ${err.message}`); }
    finally { setIsLoading(false); }
  };

  const coinIcons = { BTC: '₿', LTC: 'Ł', DOGE: 'Ð', USDT: '₮' };
  const coinColors = { BTC: 'text-orange-400', LTC: 'text-gray-300', DOGE: 'text-yellow-400', USDT: 'text-green-400' };
  const coinBg = { BTC: 'bg-orange-500/10', LTC: 'bg-gray-500/10', DOGE: 'bg-yellow-500/10', USDT: 'bg-green-500/10' };

  const statusStyle = (s) => s === 'Completado' ? 'bg-green-500/10 text-green-400' : s === 'Pendiente' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-500/10 rounded-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Billetera</h1>
          <p className="text-gray-400 text-sm">Balance, criptomonedas y retiros en un solo lugar</p>
        </div>
      </div>

      {walletLoading ? (
        <div className="flex items-center justify-center h-48">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      ) : (
        <>
          {/* --- Balances Fiat --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'USD (Fiat)', value: `$${(userPortfolio?.fiatBalanceUSD || 0).toFixed(2)}`, color: 'from-green-400 to-emerald-300', bg: 'bg-green-500/10', icon: '💵' },
              { label: 'VES (Fiat)', value: `Bs.${(userPortfolio?.fiatBalanceVES || 0).toFixed(2)}`, color: 'from-purple-400 to-violet-300', bg: 'bg-purple-500/10', icon: '🇻🇪' },
              { label: 'USD Virtual', value: `$${(userPortfolio?.virtualBalanceUSD || 0).toFixed(2)}`, color: 'from-blue-400 to-cyan-300', bg: 'bg-blue-500/10', icon: '🔵' },
            ].map(({ label, value, color, bg, icon }) => (
              <div key={label} className="relative overflow-hidden bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl hover:-translate-y-1 transition-transform duration-300">
                <div className={`absolute top-0 right-0 w-32 h-32 ${bg} rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none`}></div>
                <p className="text-gray-400 text-sm font-semibold mb-2">{label}</p>
                <p className={`text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r ${color}`}>{value}</p>
                <div className={`absolute top-6 right-6 text-2xl ${bg} w-12 h-12 flex items-center justify-center rounded-2xl`}>{icon}</div>
              </div>
            ))}
          </div>

          {/* --- Balances Cripto --- */}
          <div className="bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl">
            <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V3a1 1 0 00-1-1H4a1 1 0 00-1 1v18a1 1 0 001 1h12a1 1 0 001-1v-5m-1-10v4m-4 0h4" /></svg>
              Saldos de Criptomonedas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userPortfolio && Object.entries(userPortfolio.holdings).map(([coin, qty]) => (
                <div key={coin} className={`${coinBg[coin] || 'bg-white/5'} border border-[#1e2330] rounded-xl p-4 flex items-center gap-3`}>
                  <div className={`text-2xl font-bold ${coinColors[coin] || 'text-gray-300'} w-10 h-10 flex items-center justify-center rounded-xl bg-[#0b0e14]`}>
                    {coinIcons[coin] || coin[0]}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">{coin}</p>
                    <p className={`font-mono font-bold text-sm ${coinColors[coin] || 'text-gray-300'}`}>{qty.toFixed(coin === 'USDT' ? 2 : 8)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Intercambio USD -> USDT */}
            <div className="mt-6 pt-5 border-t border-[#1e2330]">
              <h4 className="text-gray-300 font-semibold text-sm mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                Intercambiar USD → USDT (1:1)
              </h4>
              <div className="flex gap-3">
                <input
                  type="number" step="0.01" min="0"
                  value={usdToUsdtAmount}
                  onChange={(e) => setUsdToUsdtAmount(e.target.value)}
                  placeholder="Cantidad en USD"
                  disabled={exchangeLoading}
                  className="flex-1 bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors font-mono text-sm"
                />
                <button onClick={handleExchange} disabled={exchangeLoading}
                  className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 whitespace-nowrap">
                  {exchangeLoading ? 'Cambiando...' : 'Cambiar'}
                </button>
              </div>
            </div>
          </div>

          {/* --- Solicitar Retiro --- */}
          <div className="bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl">
            <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Solicitar Retiro
              <span className="ml-auto text-xs text-gray-500">Balance: <span className="text-white font-mono font-bold">{availableBalance.toFixed(currency === 'USD' ? 2 : 8)} {currency}</span></span>
            </h3>
            <form onSubmit={handleSubmitWithdrawal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Cantidad</label>
                <input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required
                  className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors font-mono" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Moneda</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-colors">
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="DOGE">Dogecoin (DOGE)</option>
                  <option value="LTC">Litecoin (LTC)</option>
                  <option value="USD">USD</option>
                  <option value="VES">Bolívar (VES)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Dirección Guardada</label>
                <select value={selectedAddress} onChange={(e) => setSelectedAddress(e.target.value)} disabled={isLoading}
                  className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-colors">
                  {userPaymentAddresses[currency] && <option value={userPaymentAddresses[currency]}>{userPaymentAddresses[currency]} (Guardada)</option>}
                  <option value="new">Ingresar nueva dirección</option>
                </select>
              </div>
              {selectedAddress === 'new' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Dirección Wallet</label>
                    <input type="text" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} disabled={isLoading || useBinancePay}
                      required={!useBinancePay}
                      placeholder={currency === 'BTC' ? 'bc1q...' : currency === 'LTC' ? 'ltc1q...' : 'D...'}
                      className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors font-mono disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Email / ID Binance</label>
                    <input type="text" value={binanceId} onChange={(e) => setBinanceId(e.target.value)} disabled={isLoading || !useBinancePay}
                      required={useBinancePay}
                      placeholder="ejemplo@binance.com"
                      className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors disabled:opacity-50" />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={useBinancePay} disabled={isLoading}
                        onChange={(e) => { setUseBinancePay(e.target.checked); if (e.target.checked) setWalletAddress(''); else setBinanceId(''); }}
                        className="sr-only peer" />
                      <div className="w-11 h-6 bg-[#1e2330] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                    <span className="text-gray-400 text-sm">Usar Binance Pay</span>
                    <span className="ml-auto text-xs text-gray-600">Mín: {(minPaymentThresholds[currency] || 0).toFixed(currency === 'USD' ? 2 : 8)} {currency}</span>
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <button type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50">
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                  )}
                  {isLoading ? 'Procesando...' : 'Solicitar Retiro'}
                </button>
              </div>
            </form>
          </div>

          {/* --- Historial de Retiros --- */}
          <div className="bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl">
            <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Historial de Retiros
              <span className="ml-auto text-xs bg-white/5 px-3 py-1 rounded-full text-gray-400">{withdrawalsHistory.length} registros</span>
            </h3>
            {withdrawalsHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#1e2330] rounded-xl text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
                <p className="text-sm">No hay retiros registrados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e2330]">
                      {['Fecha', 'Cantidad', 'Método', 'Estado'].map(h => (
                        <th key={h} className="pb-3 px-2 text-left text-xs text-gray-500 uppercase tracking-wider font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2330]">
                    {withdrawalsHistory.map((w) => (
                      <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-2 text-gray-400">{w.createdAt.toLocaleDateString()}</td>
                        <td className="py-3 px-2 font-mono text-white">{w.amount.toFixed(w.currency === 'USD' ? 2 : 8)} {w.currency}</td>
                        <td className="py-3 px-2 text-gray-400">{w.method}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusStyle(w.status)}`}>{w.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};





const ContactSupportContent = ({ onUnreadCountChange, styles }) => {
  const { darkMode } = useContext(ThemeContext); // Usar ThemeContext
  const { showError, showSuccess } = useError(); // Usar el contexto de errores
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [subject, setSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Estado de carga

  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      setTickets([]);
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
      return;
    }

    const q = query(
      collection(db, 'contactRequests'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const fetchedTickets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
        }));
        setTickets(fetchedTickets);

        const unreadCount = fetchedTickets.filter(ticket =>
          ticket.status === 'Respondido' &&
          ticket.conversation.some(msg => msg.sender === 'admin' && !msg.readByUser)
        ).length;
        if (onUnreadCountChange) {
          onUnreadCountChange(unreadCount);
        }

        if (selectedTicket) {
          const updatedSelected = fetchedTickets.find(t => t.id === selectedTicket.id);
          setSelectedTicket(updatedSelected || null);
        }
      } catch (fetchError) {
        console.error("Error al cargar tickets desde Firebase:", fetchError);
        showError('Error al cargar tus solicitudes de soporte.');
      }
    }, (err) => {
      console.error("Error subscribing to contact requests:", err);
      showError('Error al suscribirse a las solicitudes de soporte.');
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, selectedTicket, onUnreadCountChange, showError]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!messageContent.trim()) {
      showError('El mensaje no puede estar vacío.');
      setIsLoading(false);
      return;
    }

    if (!currentUser || !currentUser.uid || !currentUser.email) {
      showError('Debes iniciar sesión para enviar un mensaje.');
      setIsLoading(false);
      return;
    }

    try {
      if (selectedTicket) {
        const newConversation = [...selectedTicket.conversation, { // Corregido: eliminar el conflicto aquí
          sender: 'user',
          text: messageContent,
          timestamp: new Date(),
        }];
        const ticketRef = doc(db, 'contactRequests', selectedTicket.id);
        await updateDoc(ticketRef, {
          conversation: newConversation,
          status: 'Pendiente',
          updatedAt: new Date(),
        });
        showSuccess('Tu respuesta ha sido enviada.');
      } else {
        if (!subject.trim()) {
          showError('Por favor, introduce un asunto para tu nueva consulta.');
          setIsLoading(false);
          return;
        }
        await addDoc(collection(db, 'contactRequests'), {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          subject: subject,
          status: 'Abierto',
          createdAt: new Date(),
          updatedAt: new Date(),
          conversation: [{
            sender: 'user',
            text: messageContent,
            timestamp: new Date(),
          }],
        });
        showSuccess('Tu nueva consulta ha sido enviada. Te responderemos a la brevedad.');
        setSubject('');
      }
      setMessageContent('');
    } catch (err) {
      console.error("Error al enviar mensaje a Firebase:", err);
      showError(`Fallo al enviar mensaje: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setSubject(ticket.subject);
    setMessageContent('');
    // Limpiar mensajes de error/éxito al seleccionar un nuevo ticket
    showError(null);
    showSuccess(null);

    if (ticket.status === 'Respondido' && ticket.conversation.some(msg => msg.sender === 'admin' && !msg.readByUser)) {
      const updatedConversation = ticket.conversation.map(msg =>
        msg.sender === 'admin' ? { ...msg, readByUser: true } : msg
      );
      try {
        const ticketRef = doc(db, 'contactRequests', ticket.id);
        await updateDoc(ticketRef, { conversation: updatedConversation });
      } catch (fetchError) {
        console.error("Error al marcar mensajes como leídos en Firebase:", fetchError);
        showError('Error al actualizar el estado de lectura del ticket.');
      }
    }
  };

  const handleNewTicket = () => {
    setSelectedTicket(null);
    setSubject('');
    setMessageContent('');
    // Limpiar mensajes de error/éxito al crear un nuevo ticket
    showError(null);
    showSuccess(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Abierto': return styles.statusOpen;
      case 'Pendiente': return styles.statusPending;
      case 'Respondido': return styles.statusResponded;
      case 'Cerrado': return styles.statusClosed;
      default: return styles.statusDefault;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-500/10 rounded-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Soporte Técnico</h1>
          <p className="text-gray-400 text-sm">Gestiona tus consultas y solicitudes</p>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#131824] border border-[#1e2330] p-6 rounded-2xl flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-white font-medium">Procesando...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Tickets */}
        <div className="bg-[#0b0e14] border border-[#1e2330] rounded-3xl p-5 shadow-xl flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-bold text-lg">Mis Solicitudes</h2>
            <button
              onClick={handleNewTicket}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all"
              disabled={isLoading}
            >
              + Nueva
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {tickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <p>No tienes solicitudes.</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <div
                  key={ticket.id}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedTicket?.id === ticket.id ? 'bg-blue-500/10 border-blue-500/50' : 'bg-[#131824] border-[#1e2330] hover:border-gray-600'}`}
                  onClick={() => handleSelectTicket(ticket)}
                >
                  <p className="text-white font-semibold mb-1 truncate">{ticket.subject}</p>
                  <p className="text-gray-400 text-xs truncate mb-3">{ticket.conversation[ticket.conversation.length - 1]?.text}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{ticket.createdAt.toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full font-bold ${ticket.status === 'Abierto' ? 'bg-green-500/10 text-green-400' :
                        ticket.status === 'Pendiente' ? 'bg-yellow-500/10 text-yellow-400' :
                          ticket.status === 'Respondido' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-gray-500/10 text-gray-400'
                        }`}>
                        {ticket.status}
                      </span>
                      {ticket.status === 'Respondido' && ticket.conversation.some(msg => msg.sender === 'admin' && !msg.readByUser) && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" title="Nuevo mensaje"></span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detalles de la Solicitud y Formulario de Respuesta */}
        <div className="lg:col-span-2 bg-[#0b0e14] border border-[#1e2330] rounded-3xl p-6 shadow-xl flex flex-col h-[700px]">
          {selectedTicket ? (
            <div className="flex-1 flex flex-col">
              <div className="border-b border-[#1e2330] pb-4 mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{selectedTicket.subject}</h2>
                  <p className="text-xs text-gray-500">Enviado el {selectedTicket.createdAt.toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedTicket.status === 'Abierto' ? 'bg-green-500/10 text-green-400' :
                  selectedTicket.status === 'Pendiente' ? 'bg-yellow-500/10 text-yellow-400' :
                    selectedTicket.status === 'Respondido' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-gray-500/10 text-gray-400'
                  }`}>
                  {selectedTicket.status}
                </span>
              </div>

              {/* Historial de Conversación */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar flex flex-col">
                {selectedTicket.conversation.map((msg, index) => (
                  <div key={index} className={`flex flex-col max-w-[80%] ${msg.sender === 'admin' ? 'self-start' : 'self-end'}`}>
                    <div className={`p-4 rounded-2xl ${msg.sender === 'admin' ? 'bg-[#1e2330] text-gray-200 rounded-bl-none' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-none'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 px-1">
                      {msg.sender === 'admin' ? 'Admin' : 'Tú'} - {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Área de Respuesta del Usuario */}
              <div className="pt-4 border-t border-[#1e2330]">
                <textarea
                  rows="3"
                  className="w-full bg-[#131824] border border-[#1e2330] rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors mb-3 resize-none"
                  placeholder="Escribe tu respuesta aquí..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  required
                  disabled={isLoading}
                ></textarea>
                <button
                  onClick={handleSendMessage}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Enviar Respuesta'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Envía una Nueva Consulta</h2>
                <p className="text-gray-400 text-sm">Nuestro equipo de soporte te responderá a la brevedad posible.</p>
              </div>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Asunto</label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Ej. Problema con mi retiro"
                  />
                </div>
                <div>
                  <label htmlFor="messageContent" className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Mensaje</label>
                  <textarea
                    id="messageContent"
                    rows="5"
                    className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Describe detalladamente tu problema o consulta..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Enviar Consulta'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ReferralsContent = ({ styles }) => {
  const { darkMode } = useContext(ThemeContext); // Usar ThemeContext
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-[#0b0e14] border border-[#1e2330] rounded-3xl p-8 shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

        <div className="w-20 h-20 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Referidos</h2>
        <span className="inline-block px-4 py-1.5 bg-yellow-500/10 text-yellow-400 text-sm font-bold uppercase tracking-wider rounded-full mb-4">
          En Desarrollo
        </span>
        <p className="text-gray-400 max-w-md mx-auto">
          Pronto podrás invitar a tus amigos, gestionar tus referidos y obtener comisiones por su rendimiento en la plataforma. ¡Mantente atento!
        </p>
      </div>
    </div>
  );
};

const SettingsContent = ({ styles }) => {
  const { darkMode } = useContext(ThemeContext); // Usar ThemeContext
  const { showError, showSuccess } = useError(); // Usar el contexto de errores
  const { currentUser } = useAuth();
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [paymentAddresses, setPaymentAddresses] = useState({
    BTC: '',
    DOGE: '',
    LTC: '',
    USD: '', // Añadir USD si se permite guardar direcciones para USD
    VES: '', // Añadir VES
  });
  const [receivePaymentNotifications, setReceivePaymentNotifications] = useState(false);
  const [receiveLoginAlerts, setReceiveLoginAlerts] = useState(false);
  const [twoFactorAuthEnabled, setTwoFactorAuthEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Estado de carga

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (currentUser && currentUser.uid) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setPaymentAddresses(userData.paymentAddresses || { BTC: '', DOGE: '', LTC: '', USD: '', VES: '' });
            setReceivePaymentNotifications(userData.receivePaymentNotifications || false);
            setReceiveLoginAlerts(userData.receiveLoginAlerts || false);
            setTwoFactorAuthEnabled(userData.twoFactorAuthEnabled || false);
          }
        } catch (userError) {
          console.error("Error fetching user settings from Firebase:", userError);
          showError('Error al cargar la configuración del usuario.');
        }
      }
    };
    fetchUserSettings();
  }, [currentUser, showError]);

  const handlePaymentAddressChange = (currency, address) => {
    setPaymentAddresses(prev => ({
      ...prev,
      [currency]: address
    }));
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!currentUser || !currentUser.uid) {
      showError('No hay usuario autenticado.');
      setIsLoading(false);
      return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      showError('Las nuevas contraseñas no coinciden.');
      setIsLoading(false);
      return;
    }

    try {
      // Reautenticar al usuario si se va a cambiar la contraseña o el email
      if (currentPassword && (newPassword || contactEmail !== currentUser.email)) {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
      }

      if (contactEmail !== currentUser.email) {
        await updateEmail(currentUser, contactEmail);
        showSuccess('Email actualizado exitosamente.');
      }

      if (newPassword) {
        await updatePassword(currentUser, newPassword);
        showSuccess('Contraseña actualizada exitosamente.');
        setNewPassword('');
        setConfirmNewPassword('');
        setCurrentPassword('');
      }

      if (!newPassword && contactEmail === currentUser.email) {
        showSuccess('Configuración de cuenta actualizada exitosamente.');
      }

    } catch (err) {
      console.error("Error al actualizar la cuenta:", err);
      showError(`Fallo al actualizar la cuenta: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAddresses = async () => {
    setIsLoading(true);
    if (!currentUser || !currentUser.uid) {
      showError('No hay usuario autenticado.');
      setIsLoading(false);
      return;
    }
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        paymentAddresses: paymentAddresses,
      });
      showSuccess('Direcciones de pago guardadas exitosamente.');
    } catch (err) {
      console.error("Error al guardar direcciones en Firebase:", err);
      showError(`Fallo al guardar direcciones: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    if (!currentUser || !currentUser.uid) {
      showError('No hay usuario autenticado.');
      setIsLoading(false);
      return;
    }
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        receivePaymentNotifications: receivePaymentNotifications,
        receiveLoginAlerts: receiveLoginAlerts,
      });
      showSuccess('Preferencias de notificación guardadas exitosamente.');
    } catch (err) {
      console.error("Error al guardar preferencias de notificación en Firebase:", err);
      showError(`Fallo al guardar preferencias de notificación: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTwoFactorAuth = async () => {
    setIsLoading(true);
    if (!currentUser || !currentUser.uid) {
      showError('No hay usuario autenticado.');
      setIsLoading(false);
      return;
    }
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        twoFactorAuthEnabled: !twoFactorAuthEnabled,
      });
      setTwoFactorAuthEnabled(prev => !prev);
      showSuccess(`Autenticación de dos factores ${!twoFactorAuthEnabled ? 'activada' : 'desactivada'} exitosamente.`);
    } catch (err) {
      console.error("Error al cambiar 2FA en Firebase:", err);
      showError(`Fallo al cambiar autenticación de dos factores: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-500/10 rounded-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración</h1>
          <p className="text-gray-400 text-sm">Gestiona tu cuenta, seguridad y preferencias</p>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#131824] border border-[#1e2330] p-6 rounded-2xl flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-white font-medium">Guardando cambios...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración de Cuenta */}
        <div className="bg-[#0b0e14] border border-[#1e2330] rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Perfil de Usuario
          </h2>
          <form onSubmit={handleUpdateAccount} className="space-y-4">
            <div>
              <label htmlFor="contact-email" className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Email de Contacto</label>
              <input type="email" id="contact-email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} disabled={isLoading}
                className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors" />
            </div>
            <div>
              <label htmlFor="current-password" className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Contraseña Actual <span className="text-[10px] lowercase normal-case">(Requerida para cambios)</span></label>
              <input type="password" id="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={isLoading}
                className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="new-password" className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Nueva Contraseña</label>
                <input type="password" id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isLoading}
                  className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              <div>
                <label htmlFor="confirm-new-password" className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Confirmar Contraseña</label>
                <input type="password" id="confirm-new-password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} disabled={isLoading}
                  className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
              Actualizar Perfil
            </button>
          </form>

          {/* Seguridad 2FA */}
          <div className="mt-8 pt-6 border-t border-[#1e2330]">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Seguridad Adicional
            </h2>
            <div className="flex items-center justify-between bg-[#131824] border border-[#1e2330] p-4 rounded-xl">
              <div>
                <p className="text-white font-semibold">Autenticación de Dos Factores (2FA)</p>
                <p className="text-gray-500 text-xs">Añade una capa extra de seguridad a tu cuenta.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-gray-500/10 text-gray-400 px-2 py-1 rounded-md">En Desarrollo</span>
                <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                  <input type="checkbox" className="sr-only peer" disabled={true} />
                  <div className="w-11 h-6 bg-[#1e2330] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Direcciones de Pago y Notificaciones */}
        <div className="bg-[#0b0e14] border border-[#1e2330] rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Billeteras Predeterminadas
          </h2>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bitcoin-address" className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Bitcoin (BTC)</label>
                <input type="text" id="bitcoin-address" value={paymentAddresses.BTC} onChange={(e) => handlePaymentAddressChange('BTC', e.target.value)} disabled={isLoading} placeholder="bc1q..."
                  className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors font-mono" />
              </div>
              <div>
                <label htmlFor="dogecoin-address" className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Dogecoin (DOGE)</label>
                <input type="text" id="dogecoin-address" value={paymentAddresses.DOGE} onChange={(e) => handlePaymentAddressChange('DOGE', e.target.value)} disabled={isLoading} placeholder="D..."
                  className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors font-mono" />
              </div>
              <div>
                <label htmlFor="litecoin-address" className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Litecoin (LTC)</label>
                <input type="text" id="litecoin-address" value={paymentAddresses.LTC} onChange={(e) => handlePaymentAddressChange('LTC', e.target.value)} disabled={isLoading} placeholder="ltc1q..."
                  className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors font-mono" />
              </div>
              <div>
                <label htmlFor="usd-address" className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">USD (Binance Pay)</label>
                <input type="text" id="usd-address" value={paymentAddresses.USD} onChange={(e) => handlePaymentAddressChange('USD', e.target.value)} disabled={isLoading} placeholder="Email / ID"
                  className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors font-mono" />
              </div>
            </div>
            <div>
              <label htmlFor="ves-address" className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Bolívar (VES) (Binance Pay / Pago Móvil)</label>
              <input type="text" id="ves-address" value={paymentAddresses.VES} onChange={(e) => handlePaymentAddressChange('VES', e.target.value)} disabled={isLoading} placeholder="Datos para VES"
                className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors font-mono" />
            </div>
            <button onClick={handleSaveAddresses} disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 mt-2">
              Guardar Billeteras
            </button>
          </div>

          <div className="mt-auto pt-6 border-t border-[#1e2330]">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Preferencias de Notificación
            </h2>
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 p-3 bg-[#131824] border border-[#1e2330] rounded-xl cursor-not-allowed opacity-60">
                <input type="checkbox" className="rounded bg-[#1e2330] border-gray-600 text-purple-500 focus:ring-purple-500" disabled />
                <div className="flex-1">
                  <span className="text-white text-sm font-medium">Recibir notificaciones por email</span>
                  <p className="text-xs text-gray-500">Avisos sobre retiros y pagos.</p>
                </div>
                <span className="text-[10px] bg-gray-500/10 text-gray-400 px-2 py-1 rounded-md">En Desarrollo</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-[#131824] border border-[#1e2330] rounded-xl cursor-not-allowed opacity-60">
                <input type="checkbox" className="rounded bg-[#1e2330] border-gray-600 text-purple-500 focus:ring-purple-500" disabled />
                <div className="flex-1">
                  <span className="text-white text-sm font-medium">Alertas de Inicio de Sesión</span>
                  <p className="text-xs text-gray-500">Recibe una alerta si detectamos un nuevo dispositivo.</p>
                </div>
                <span className="text-[10px] bg-gray-500/10 text-gray-400 px-2 py-1 rounded-md">En Desarrollo</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const UserPanel = () => {
  const { currentUser, logout } = useAuth();
  const { darkMode } = useContext(ThemeContext); // Usar ThemeContext
  const navigate = useNavigate();
  const [userMiners, setUserMiners] = useState([]);
  const [unreadTicketsCount, setUnreadTicketsCount] = useState(0);
  const [userBalances, setUserBalances] = useState({
    balanceUSD: 0,
    balanceBTC: 0,
    balanceLTC: 0,
    balanceDOGE: 0,
    balanceVES: 0, // Añadir balanceVES
  });
  const [profitabilitySettings, setProfitabilitySettings] = useState({
    fixedRatePerTHs: 0.05,
    fixedPoolCommission: 1,
    useFixedRate: false
  });
  const [btcToUsdRate, setBtcToUsdRate] = useState(20000); // Nuevo estado para la tasa de BTC a USD, valor por defecto
  const [minPaymentThresholds, setMinPaymentThresholds] = useState({ // Nuevo estado para los umbrales mínimos de retiro por moneda
    BTC: 0.001,
    DOGE: 100,
    LTC: 0.01,
    USD: 10,
    VES: 1, // Añadir umbral para VES
  });
  const [totalHashratePool, setTotalHashratePool] = useState(0); // Nuevo estado para el hashrate total de la pool
  const [activeMinersAllUsers, setActiveMinersAllUsers] = useState(0); // Nuevo estado para mineros activos de la pool
  const [paymentsHistory, setPaymentsHistory] = useState([]); // Estado para el historial de pagos
  const [withdrawalsHistory, setWithdrawalsHistory] = useState([]); // Estado para el historial de retiros
  const [userPaymentAddresses, setUserPaymentAddresses] = useState({}); // Nuevo estado para las direcciones de pago del usuario


  const handleUnreadCountChange = (count) => {
    setUnreadTicketsCount(count);
  };

  const demoUser = { email: 'demo@example.com' };
  const displayUser = currentUser || demoUser;

  console.log("UserPanel: currentUser", currentUser);
  console.log("UserPanel: userMiners", userMiners);
  console.log("UserPanel: userBalances", userBalances);
  console.log("UserPanel: paymentRate", paymentRate);
  console.log("UserPanel: btcToUsdRate", btcToUsdRate);
  console.log("UserPanel: totalHashratePool", totalHashratePool);
  console.log("UserPanel: poolCommission", poolCommission);
  console.log("UserPanel: paymentsHistory", paymentsHistory);
  console.log("UserPanel: withdrawalsHistory", withdrawalsHistory);
  console.log("UserPanel: userPaymentAddresses", userPaymentAddresses);


  const paymentRate = useMemo(() => {
    if (profitabilitySettings.useFixedRate) {
      return profitabilitySettings.fixedRatePerTHs;
    } else {
      const difficulty = 73197634206448;
      const btcPrice = btcToUsdRate || 121692;
      const btcPerTHsPerDay = (60 * 60 * 24 * 1 * 10 ** 12) / (difficulty * 2 ** 32);
      const calculatedDailyBtcGain = btcPerTHsPerDay * (1 - profitabilitySettings.fixedPoolCommission / 100);
      return calculatedDailyBtcGain * btcPrice;
    }
  }, [profitabilitySettings, btcToUsdRate]);

  const poolCommission = useMemo(() => {
    return profitabilitySettings.fixedPoolCommission;
  }, [profitabilitySettings]);

  const totalHashrate = useMemo(() => {
    return userMiners.reduce((sum, miner) => sum + (miner.currentHashrate || 0), 0);
  }, [userMiners]);

  const estimatedDailyUSD = useMemo(() => {
    return totalHashrate * paymentRate;
  }, [totalHashrate, paymentRate]);

  const chartData = useMemo(() => ({
    labels: ['Hashrate Total (TH/s)', 'Ganancia Diaria Estimada (USD)'],
    datasets: [{
      label: 'Rendimiento Actual',
      data: [totalHashrate, estimatedDailyUSD],
      backgroundColor: [
        'rgba(54, 162, 235, 0.5)', // Color para Hashrate
        'rgba(75, 192, 192, 0.5)'  // Color para Ganancia
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)'
      ],
      borderWidth: 1
    }]
  }), [totalHashrate, estimatedDailyUSD]);

  // Suscripción para mineros del usuario
  useEffect(() => {
    if (!currentUser?.uid) {
      setUserMiners([]);
      return;
    }
    console.log("UserPanel: Configurando suscripción para mineros del usuario:", currentUser.uid);
    const minersQuery = query(collection(db, "miners"), where("userId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(minersQuery, (snapshot) => {
      const fetchedMiners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserMiners(fetchedMiners);
    }, (error) => {
      console.error("UserPanel: Error en la suscripción de mineros:", error);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Suscripción para todos los mineros (para hashrate total de la pool)
  useEffect(() => {
    console.log("UserPanel: Configurando suscripción para todos los mineros.");
    const allMinersQuery = collection(db, "miners");
    const unsubscribe = onSnapshot(allMinersQuery, (snapshot) => {
      let totalHash = 0;
      let activeCount = 0;
      snapshot.docs.forEach(doc => {
        const miner = doc.data();
        totalHash += miner.currentHashrate || 0;
        activeCount += 1; // Asumimos que todos los mineros en la colección son activos para este conteo
      });
      setTotalHashratePool(totalHash);
      setActiveMinersAllUsers(activeCount);
    }, (error) => {
      console.error("UserPanel: Error en la suscripción de todos los mineros:", error);
    });
    return () => unsubscribe();
  }, []); // No depende de currentUser, ya que es para todos los mineros

  // Suscripción para balances del usuario
  useEffect(() => {
    if (!currentUser?.uid) {
      setUserBalances({
        balanceUSD: 0,
        balanceBTC: 0,
        balanceLTC: 0,
        balanceDOGE: 0,
        balanceVES: 0,
      });
      return;
    }
    console.log("UserPanel: Configurando suscripción para balances del usuario:", currentUser.uid);
    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, async (docSnapshot) => { // <-- Hacemos la función async aquí
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        setUserBalances({
          balanceUSD: userData.balanceUSD || 0,
          balanceBTC: userData.balanceBTC || 0,
          balanceLTC: userData.balanceLTC || 0,
          balanceDOGE: userData.balanceDOGE || 0,
          balanceVES: userData.balanceVES || 0, // Añadir balanceVES
        });
        setUserPaymentAddresses(userData.paymentAddresses || {}); // Actualizar direcciones de pago
        console.log(`UserPanel: Datos de usuario y direcciones de pago cargados para ${currentUser.uid}.`);
      } else {
        console.log(`UserPanel: Documento de usuario no existe en Firestore (${currentUser.uid}). Creando uno nuevo...`);
        try { // Añadimos el bloque try-catch completo
          await setDoc(userDocRef, {
            balanceUSD: 0,
            balanceBTC: 0,
            balanceLTC: 0,
            balanceDOGE: 0,
            balanceVES: 0, // Añadir balanceVES
            role: 'user',
            email: currentUser.email,
            paymentAddresses: {}, // Inicializar paymentAddresses
          });

          console.log(`UserPanel: Documento de usuario creado exitosamente en Firestore para ${currentUser.uid}.`);
          setUserBalances({
            balanceUSD: 0,
            balanceBTC: 0,
            balanceLTC: 0,
            balanceDOGE: 0,
            balanceVES: 0, // Añadir balanceVES
          });
          setUserPaymentAddresses({});
        } catch (insertError) {
          console.error(`UserPanel: Error al crear el documento de usuario en Firestore para ${currentUser.uid}:`, insertError);
        }
      }
    }, (error) => {
      console.error(`UserPanel: Error en la suscripción de balances del usuario para ${currentUser.uid}:`, error);
    });
    return () => unsubscribe();
  }, [currentUser, db]);

  // Suscripción para configuración de la pool
  useEffect(() => {
    console.log("UserPanel: Configurando suscripción para poolConfig.");
    const poolConfigQuery = query(collection(db, "settings"), where("key", "==", "poolConfig"));
    const unsubscribe = onSnapshot(poolConfigQuery, (snapshot) => {
      const settingsData = snapshot.docs.length > 0 ? snapshot.docs[0].data() : {};
      setBtcToUsdRate(settingsData.btcToUsdRate || 20000);
    }, (error) => {
      console.error("UserPanel: Error en la suscripción de poolConfig:", error);
    });
    return () => unsubscribe();
  }, []);

  // Suscripción para configuración de rentabilidad
  useEffect(() => {
    console.log("UserPanel: Configurando suscripción para settings/profitability.");
    const docRef = doc(db, "settings", "profitability");
    const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setProfitabilitySettings({
          fixedRatePerTHs: data.fixedRatePerTHs ?? 0.05,
          fixedPoolCommission: data.fixedPoolCommission ?? 1,
          useFixedRate: data.useFixedRate ?? false
        });
      }
    }, (error) => {
      console.error("UserPanel: Error en la suscripción de profitability:", error);
    });
    return () => unsubscribe();
  }, []);

  // Suscripción para configuración de pagos
  useEffect(() => {
    console.log("UserPanel: Configurando suscripción para paymentConfig.");
    const paymentConfigQuery = query(collection(db, "settings"), where("key", "==", "paymentConfig"));
    const unsubscribe = onSnapshot(paymentConfigQuery, (snapshot) => {
      const settingsData = snapshot.docs.length > 0 ? snapshot.docs[0].data() : {};
      setMinPaymentThresholds({
        BTC: settingsData.minPaymentThresholdBTC || 0.00000001,
        DOGE: settingsData.minPaymentThresholdDOGE || 100,
        LTC: settingsData.minPaymentThresholdLTC || 0.01,
        USD: settingsData.minPaymentThresholdUSD || 10,
        VES: settingsData.minPaymentThresholdVES || 1, // Añadir VES
      });
    }, (error) => {
      console.error("UserPanel: Error en la suscripción de paymentConfig:", error);
    });
    return () => unsubscribe();
  }, []);

  // Suscripción para historial de pagos
  useEffect(() => {
    if (!currentUser?.uid) {
      setPaymentsHistory([]);
      return;
    }
    console.log("UserPanel: Configurando suscripción para historial de pagos.");
    const paymentsQuery = query(collection(db, "payments"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      const fetchedPayments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt.toDate() }));
      setPaymentsHistory(fetchedPayments);
    }, (error) => {
      console.error("UserPanel: Error en la suscripción de pagos:", error);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Efecto para actualizar lastSeen del usuario
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userDocRef = doc(db, 'users', currentUser.uid);

    // Función para actualizar lastSeen
    const updateLastSeen = async () => {
      try {
        await updateDoc(userDocRef, {
          lastSeen: new Date(), // Usar un objeto Date estándar o serverTimestamp
        });
        console.log("lastSeen actualizado para:", currentUser.uid);
      } catch (error) {
        console.error("Error al actualizar lastSeen:", error);
      }
    };

    // Actualizar lastSeen inmediatamente al cargar el componente
    updateLastSeen();

    // Establecer un intervalo para actualizar lastSeen periódicamente (ej. cada 5 minutos)
    const intervalId = setInterval(updateLastSeen, 5 * 60 * 1000); // 5 minutos

    // Limpiar el intervalo al desmontar el componente
    return () => clearInterval(intervalId);
  }, [currentUser?.uid, db]);

  // Efecto para manejar la actualización de lastSeen cuando el usuario cierra la pestaña o navega fuera
  useEffect(() => {
    if (!currentUser?.uid) return;
    const userDocRef = doc(db, 'users', currentUser.uid);

    const handleBeforeUnload = async () => {
      // Intentar actualizar lastSeen justo antes de que la página se descargue
      // Nota: Esto es un "best effort" y no siempre funciona de forma confiable en todos los navegadores.
      // Firebase serverTimestamp es más robusto para estados de sesión.
      try {
        await updateDoc(userDocRef, {
          lastSeen: new Date(), // Se enviará con la hora de cierre
        });
        console.log("lastSeen actualizado al cerrar/navegar para:", currentUser.uid);
      } catch (error) {
        console.error("Error al actualizar lastSeen en beforeunload:", error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser?.uid, db]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      console.error("Fallo al cerrar sesión");
    }
  }

  const showNavbar = false;

  return (
    <div className="flex bg-[#06080d] min-h-screen text-slate-200 selection:bg-orange-500/30 font-sans">
      <Sidebar
        unreadTicketsCount={unreadTicketsCount}
        displayUser={displayUser}
      />
      <MainContent>
        {showNavbar && <Navbar />} {/* Renderizar el Navbar condicionalmente */}

        <Routes>
          <Route path="dashboard/*" element={<DashboardContent userMiners={userMiners} chartData={chartData} userBalances={userBalances} paymentRate={paymentRate} btcToUsdRate={btcToUsdRate} totalHashratePool={totalHashratePool} poolCommission={poolCommission} paymentsHistory={paymentsHistory} withdrawalsHistory={withdrawalsHistory} styles={styles} totalHashrate={totalHashrate} estimatedDailyUSD={estimatedDailyUSD} activeMinersAllUsers={activeMinersAllUsers} pricePerTHs={paymentRate} />} />

          <Route path="mining-info/*" element={<MiningInfoContent currentUser={currentUser} userMiners={userMiners} setUserMiners={setUserMiners} styles={styles} />} />
          <Route path="contact-support/*" element={<ContactSupportContent onUnreadCountChange={handleUnreadCountChange} styles={styles} />} />
          <Route path="referrals/*" element={<ReferralsContent styles={styles} />} />
          <Route path="pool-arbitrage/*" element={<UserPoolArbitrage />} />
          <Route path="mining-portfolio/*" element={<MiningPortfolioContent />} />
          <Route path="my-wallet/*" element={<WalletSection currentUser={currentUser} minPaymentThresholds={minPaymentThresholds} userPaymentAddresses={userPaymentAddresses} styles={styles} />} />
          <Route path="withdrawals/*" element={<WalletSection currentUser={currentUser} minPaymentThresholds={minPaymentThresholds} userPaymentAddresses={userPaymentAddresses} styles={styles} />} />
          <Route path="settings/*" element={<SettingsContent styles={styles} />} />
          {/* Ruta por defecto */}
          <Route path="/*" element={<DashboardContent userMiners={userMiners} chartData={chartData} userBalances={userBalances} paymentRate={paymentRate} btcToUsdRate={btcToUsdRate} totalHashratePool={totalHashratePool} poolCommission={poolCommission} paymentsHistory={paymentsHistory} withdrawalsHistory={withdrawalsHistory} styles={styles} totalHashrate={totalHashrate} estimatedDailyUSD={estimatedDailyUSD} activeMinersAllUsers={activeMinersAllUsers} pricePerTHs={paymentRate} />} />
        </Routes>
      </MainContent>
    </div>
  );
};

export default UserPanel;
