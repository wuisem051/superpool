import React, { useState, useEffect, useContext } from 'react'; // Importar useContext
import { db } from '../../services/firebase'; // Importar Firebase Firestore
import { doc, getDoc } from 'firebase/firestore'; // Importar doc y getDoc
import { ThemeContext } from '../../context/ThemeContext'; // Importar ThemeContext

const ProfitabilityCalculator = () => {
  const [hashrate, setHashrate] = useState(10);
  // const [consumption, setConsumption] = useState(3000); // Eliminado
  // const [costPerKWH, setCostPerKWH] = useState(0.12); // Eliminado

  // Valores de configuración obtenidos del administrador (ahora de Firebase)
  const [fixedRatePerTHs, setFixedRatePerTHs] = useState(0.06);
  const [fixedPoolCommission, setFixedPoolCommission] = useState(1);
  const [useFixedRate, setUseFixedRate] = useState(false);

  // Valores dinámicos de BTC y dificultad (si no se usa tasa fija)
  const [btcPrice, setBtcPrice] = useState(121692);
  const [difficulty, setDifficulty] = useState(73197634206448);

  // const [dailyElectricCost, setDailyElectricCost] = useState(0); // Eliminado
  const [dailyBtcGain, setDailyBtcGain] = useState(0);
  const [dailyUsdGain, setDailyUsdGain] = useState(0);
  const [weeklyBtcGain, setWeeklyBtcGain] = useState(0);
  const [weeklyUsdGain, setWeeklyUsdGain] = useState(0);
  const [monthlyBtcGain, setMonthlyBtcGain] = useState(0);
  const [monthlyUsdGain, setMonthlyUsdGain] = useState(0);
  const [annualBtcGain, setAnnualBtcGain] = useState(0);
  const [annualUsdGain, setAnnualUsdGain] = useState(0);
  const [netDailyGain, setNetDailyGain] = useState(0);

  // Función para obtener el precio de BTC y la dificultad de una API externa
  const fetchDynamicData = async () => {
    try {
      // Aquí iría la llamada a una API real para obtener el precio de BTC y la dificultad
      // Por ahora, usaremos valores estáticos para la simulación
      // const response = await fetch('API_URL_PARA_BTC_Y_DIFICULTAD');
      // const data = await response.json();
      // setBtcPrice(data.btcPrice);
      // setDifficulty(data.difficulty);
    } catch (error) {
      console.error('Error al obtener datos dinámicos:', error);
    }
  };

  // Calcular vista previa para mostrar los valores de configuración
  const preview1THs = fixedRatePerTHs;
  const preview10THs = fixedRatePerTHs * 10;
  const previewCommission = fixedPoolCommission;

  const calculateProfitability = () => {
    // const dailyConsumptionKWH = (consumption * 24) / 1000; // Eliminado
    // const calculatedDailyElectricCost = dailyConsumptionKWH * costPerKWH; // Eliminado
    // setDailyElectricCost(calculatedDailyElectricCost); // Eliminado

    let calculatedDailyBtcGain = 0;
    let calculatedDailyUsdGain = 0;

    if (useFixedRate) {
      calculatedDailyUsdGain = hashrate * fixedRatePerTHs;
      calculatedDailyBtcGain = calculatedDailyUsdGain / btcPrice;
    } else {
      const btcPerTHsPerDay = (60 * 60 * 24 * hashrate * 10 ** 12) / (difficulty * 2 ** 32);
      calculatedDailyBtcGain = btcPerTHsPerDay * (1 - fixedPoolCommission / 100);
      calculatedDailyUsdGain = calculatedDailyBtcGain * btcPrice;
    }

    setDailyBtcGain(calculatedDailyBtcGain);
    setDailyUsdGain(calculatedDailyUsdGain);

    setWeeklyBtcGain(calculatedDailyBtcGain * 7);
    setWeeklyUsdGain(calculatedDailyUsdGain * 7);
    setMonthlyBtcGain(calculatedDailyBtcGain * 30);
    setMonthlyUsdGain(calculatedDailyUsdGain * 30);
    setAnnualBtcGain(calculatedDailyBtcGain * 365);
    setAnnualUsdGain(calculatedDailyUsdGain * 365);

    // const calculatedNetDailyGain = calculatedDailyUsdGain - calculatedDailyElectricCost; // Modificado
    const calculatedNetDailyGain = calculatedDailyUsdGain; // Modificado
    setNetDailyGain(calculatedNetDailyGain);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'profitability'); // Referencia al documento profitability
        const docSnap = await getDoc(docRef); // Obtener el documento

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFixedRatePerTHs(data.fixedRatePerTHs || 0.06);
          setFixedPoolCommission(data.fixedPoolCommission || 1);
          setUseFixedRate(data.useFixedRate || false);
        } else {
          // Si no existe, establecer valores por defecto
          setFixedRatePerTHs(0.06);
          setFixedPoolCommission(1);
          setUseFixedRate(false);
        }
      } catch (err) {
        console.error("Error fetching profitability settings from Firebase:", err);
      }
    };

    fetchSettings();
    // Si no se usa tasa fija, también obtenemos datos dinámicos
    if (!useFixedRate) {
      fetchDynamicData();
    }

    calculateProfitability();
  }, [hashrate, fixedPoolCommission, fixedRatePerTHs, useFixedRate, btcPrice, difficulty]);

  const { theme } = useContext(ThemeContext); // Usar ThemeContext

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-orange-500/20 to-yellow-500/10 rounded-2xl border border-orange-500/20 shadow-lg shadow-orange-500/20 hidden md:block">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Calculadora de Rentabilidad</h2>
          <p className="text-gray-400 text-sm mt-1">Simula tus ganancias potenciales según tu hashrate y la configuración actual.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Datos de Entrada */}
        <div className="bg-[#0b0e14] p-6 rounded-3xl border border-[#1e2330] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-500/20 transition-colors"></div>
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            Datos de Entrada
          </h3>
          <div className="flex-1">
            <label htmlFor="hashrate" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Hashrate
            </label>
            <div className="relative">
              <input
                type="number"
                id="hashrate"
                value={hashrate}
                onChange={(e) => setHashrate(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white font-mono text-lg placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                min="0"
                step="any"
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-semibold text-sm">TH/s</span>
              </div>
            </div>
          </div>
          <button
            onClick={calculateProfitability}
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Recalcular
          </button>
        </div>

        {/* Configuración de Rentabilidad Actual */}
        <div className="bg-[#0b0e14] p-6 rounded-3xl border border-[#1e2330] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-purple-500/20 transition-colors"></div>
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
            Configuración Actual
          </h3>
          <div className="space-y-4">
            <div className="bg-[#131824] p-4 rounded-xl border border-[#1e2330]">
              <p className="text-xs text-gray-500 font-semibold mb-1">Tasa Fija por TH/s</p>
              <p className="text-xl font-bold font-mono text-purple-400">${fixedRatePerTHs.toFixed(4)} <span className="text-sm text-gray-500">USD/día</span></p>
            </div>
            <div className="bg-[#131824] p-4 rounded-xl border border-[#1e2330] flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">Comisión Pool</p>
                <p className="text-lg font-bold text-white">{fixedPoolCommission.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-semibold mb-1">Tasa Fija Activa</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${useFixedRate ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {useFixedRate ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ganancias a Corto Plazo */}
        <div className="bg-[#0b0e14] p-6 rounded-3xl border border-[#1e2330] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-green-500/20 transition-colors"></div>
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Corto Plazo
          </h3>
          <div className="space-y-4">
            <div className="relative p-4 rounded-xl border border-green-500/20 bg-green-500/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-green-500/80 mb-2">Diario</p>
              <p className="text-lg font-bold font-mono text-white mb-1">{dailyBtcGain.toFixed(8)} <span className="text-sm text-gray-500">BTC</span></p>
              <p className="text-sm font-medium text-green-400">${dailyUsdGain.toFixed(2)} USD</p>
            </div>
            <div className="relative p-4 rounded-xl border border-[#1e2330] bg-[#131824]">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Semanal</p>
              <p className="text-lg font-bold font-mono text-white mb-1">{weeklyBtcGain.toFixed(8)} <span className="text-sm text-gray-500">BTC</span></p>
              <p className="text-sm font-medium text-gray-400">${weeklyUsdGain.toFixed(2)} USD</p>
            </div>
          </div>
        </div>

        {/* Ganancias a Largo Plazo */}
        <div className="bg-[#0b0e14] p-6 rounded-3xl border border-[#1e2330] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-orange-500/20 transition-colors"></div>
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Largo Plazo
          </h3>
          <div className="space-y-4 flex-1">
            <div className="relative p-4 rounded-xl border border-[#1e2330] bg-[#131824]">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Mensual</p>
              <p className="text-lg font-bold font-mono text-white mb-1">{monthlyBtcGain.toFixed(8)} <span className="text-sm text-gray-500">BTC</span></p>
              <p className="text-sm font-medium text-gray-400">${monthlyUsdGain.toFixed(2)} USD</p>
            </div>
            <div className="relative p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-500/80 mb-2">Anual</p>
              <p className="text-lg font-bold font-mono text-orange-400 mb-1">{annualBtcGain.toFixed(8)} <span className="text-sm text-gray-500">BTC</span></p>
              <p className="text-sm font-medium text-orange-300">${annualUsdGain.toFixed(2)} USD</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#1e2330]">
            <p className="text-xs text-gray-500 font-semibold mb-1">Ganancia Neta Diaria</p>
            <p className="text-2xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
              ${netDailyGain.toFixed(2)} <span className="text-sm font-sans text-gray-500">USD</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityCalculator;
