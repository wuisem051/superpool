import React, { useState, useEffect, useContext } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, setDoc, query, where, doc } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import { useError } from '../../context/ErrorContext';

const PoolConfiguration = () => {
  const { darkMode } = useContext(ThemeContext);
  const { showError, showSuccess } = useError();
  
  const [poolUrl, setPoolUrl] = useState('stratum+tcp://bitcoinpool.com:4444');
  const [poolPort, setPoolPort] = useState('4444');
  const [defaultWorkerName, setDefaultWorkerName] = useState('worker1');
  const [poolCommission, setPoolCommission] = useState(1);
  const [obsoletePrice, setObsoletePrice] = useState(0.05);
  const [bitcoinAddress, setBitcoinAddress] = useState('');
  const [minPaymentThresholdBTC, setMinPaymentThresholdBTC] = useState(0.001);
  const [minPaymentThresholdDOGE, setMinPaymentThresholdDOGE] = useState(100);
  const [minPaymentThresholdLTC, setMinPaymentThresholdLTC] = useState(0.01);
  const [minPaymentThresholdUSD, setMinPaymentThresholdUSD] = useState(10);
  const [minPaymentThresholdUSDT, setMinPaymentThresholdUSDT] = useState(10);
  const [paymentInterval, setPaymentInterval] = useState('Diario');
  const [supportedCurrencies, setSupportedCurrencies] = useState({
    bitcoin: true,
    dogecoin: true,
    litecoin: true,
  });
  const [enableBinancePay, setEnableBinancePay] = useState(false);

  const handleCurrencyChange = (currency) => {
    setSupportedCurrencies(prev => ({
      ...prev,
      [currency]: !prev[currency]
    }));
  };

  useEffect(() => {
    const fetchPoolConfig = async () => {
      try {
        const q = query(collection(db, 'settings'), where('key', '==', 'poolConfig'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          setPoolUrl(data.url || 'stratum+tcp://bitcoinpool.com:4444');
          setPoolPort(data.port || '4444');
          setDefaultWorkerName(data.defaultWorkerName || 'worker1');
          setObsoletePrice(data.obsoletePrice || 0.05);
        }
      } catch (err) {
        console.error(err);
        showError('Error al cargar la configuración del pool.');
      }
    };

    const fetchPaymentConfig = async () => {
      try {
        const q = query(collection(db, 'settings'), where('key', '==', 'paymentConfig'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          setBitcoinAddress(data.bitcoinAddress || '');
          setMinPaymentThresholdBTC(data.minPaymentThresholdBTC || 0.001);
          setMinPaymentThresholdDOGE(data.minPaymentThresholdDOGE || 100);
          setMinPaymentThresholdLTC(data.minPaymentThresholdLTC || 0.01);
          setMinPaymentThresholdUSD(data.minPaymentThresholdUSD || 10);
          setMinPaymentThresholdUSDT(data.minPaymentThresholdUSDT || data.minPaymentThresholdUSD || 10);
          setPaymentInterval(data.paymentInterval || 'Diario');
          setSupportedCurrencies(data.supportedCurrencies || { bitcoin: true, dogecoin: true, litecoin: true });
          setEnableBinancePay(data.enableBinancePay || false);
        }
      } catch (err) {
        console.error(err);
        showError('Error al cargar la configuración de pagos.');
      }
    };

    const fetchProfitabilitySettings = async () => {
      try {
        const q = query(collection(db, 'settings'), where('key', '==', 'profitability'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          setPoolCommission(data.fixedPoolCommission || 1);
        }
      } catch (err) {
        console.error(err);
        showError('Error al cargar la configuración de rentabilidad.');
      }
    };

    fetchPoolConfig();
    fetchPaymentConfig();
    fetchProfitabilitySettings();
  }, [showError]);

  const handleSaveConfig = async () => {
    try {
      await setDoc(doc(db, 'settings', 'poolConfig'), {
        key: 'poolConfig',
        url: poolUrl,
        port: poolPort,
        defaultWorkerName: defaultWorkerName,
        obsoletePrice: obsoletePrice,
        updatedAt: new Date(),
      }, { merge: true });

      await setDoc(doc(db, 'settings', 'paymentConfig'), {
        key: 'paymentConfig',
        bitcoinAddress,
        minPaymentThresholdBTC,
        minPaymentThresholdDOGE,
        minPaymentThresholdLTC,
        minPaymentThresholdUSD,
        minPaymentThresholdUSDT,
        paymentInterval,
        supportedCurrencies,
        enableBinancePay,
        updatedAt: new Date(),
      }, { merge: true });

      await setDoc(doc(db, 'settings', 'profitability'), {
        key: 'profitability',
        fixedPoolCommission: poolCommission,
        updatedAt: new Date(),
      }, { merge: true });

      showSuccess('Configuración de la Pool guardada exitosamente.');
    } catch (error) {
      console.error(error);
      showError('Error al guardar la configuración.');
    }
  };

  const inputClass = `w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm font-mono`;
  const labelClass = `block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ⚙️ Configuración Global del Pool
          </h2>
          <p className="text-xs text-gray-400 mt-1">Modifica parámetros de conexión, umbrales de pago mínimos y comisiones.</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all shadow-md">
          🏠 Ver Sitio Principal
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración de Pagos */}
        <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl space-y-4`}>
          <h3 className="text-md font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3">
            💰 Configuración de Pagos y Comisiones
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="poolCommission" className={labelClass}>Comisión del Pool (%)</label>
              <input type="number" id="poolCommission" value={poolCommission} onChange={(e) => setPoolCommission(parseFloat(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label htmlFor="obsoletePrice" className={labelClass}>Precio por TH/s (USD)</label>
              <input type="number" id="obsoletePrice" value={obsoletePrice} onChange={(e) => setObsoletePrice(parseFloat(e.target.value))} className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="bitcoinAddress" className={labelClass}>Dirección de Pago (Bitcoin)</label>
            <input type="text" id="bitcoinAddress" value={bitcoinAddress} onChange={(e) => setBitcoinAddress(e.target.value)} className={inputClass} placeholder="bc1q..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="minPaymentThresholdUSDT" className={labelClass}>Mínimo USDT</label>
              <input type="number" step="any" id="minPaymentThresholdUSDT" value={minPaymentThresholdUSDT} onChange={(e) => setMinPaymentThresholdUSDT(parseFloat(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label htmlFor="minPaymentThresholdLTC" className={labelClass}>Mínimo LTC</label>
              <input type="number" step="any" id="minPaymentThresholdLTC" value={minPaymentThresholdLTC} onChange={(e) => setMinPaymentThresholdLTC(parseFloat(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label htmlFor="minPaymentThresholdDOGE" className={labelClass}>Mínimo DOGE</label>
              <input type="number" step="any" id="minPaymentThresholdDOGE" value={minPaymentThresholdDOGE} onChange={(e) => setMinPaymentThresholdDOGE(parseFloat(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label htmlFor="minPaymentThresholdBTC" className={labelClass}>Mínimo BTC</label>
              <input type="number" step="any" id="minPaymentThresholdBTC" value={minPaymentThresholdBTC} onChange={(e) => setMinPaymentThresholdBTC(parseFloat(e.target.value))} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label htmlFor="paymentInterval" className={labelClass}>Frecuencia de Pago</label>
              <select id="paymentInterval" value={paymentInterval} onChange={(e) => setPaymentInterval(e.target.value)} className={inputClass}>
                <option value="Diario">Diario</option>
                <option value="Semanal">Semanal</option>
                <option value="Mensual">Mensual</option>
              </select>
            </div>
            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer bg-white/5 border border-white/5 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                <input type="checkbox" checked={enableBinancePay} onChange={(e) => setEnableBinancePay(e.target.checked)} className="form-checkbox h-4 w-4 text-yellow-500 rounded bg-[#131824] border-[#1e2330]" />
                <span className="text-xs font-semibold text-gray-300">Binance Pay</span>
              </label>
            </div>
          </div>

          <button onClick={handleSaveConfig} className="w-full mt-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl shadow-lg transition-all text-sm">
            Guardar Configuración de Pagos
          </button>
        </div>

        {/* Configuración de Minería */}
        <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl space-y-4`}>
          <h3 className="text-md font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3">
            ⚡ Configuración de Stratum / Conexión
          </h3>

          <div>
            <label htmlFor="poolUrl" className={labelClass}>URL del Pool Stratum</label>
            <input type="text" id="poolUrl" value={poolUrl} onChange={(e) => setPoolUrl(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="poolPort" className={labelClass}>Puerto Stratum</label>
            <input type="text" id="poolPort" value={poolPort} onChange={(e) => setPoolPort(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="defaultWorkerName" className={labelClass}>Worker Name por Defecto</label>
            <input type="text" id="defaultWorkerName" value={defaultWorkerName} onChange={(e) => setDefaultWorkerName(e.target.value)} className={inputClass} />
            <p className="text-[10px] text-gray-500 mt-1.5">Se mostrará como: <code className="text-yellow-500/80 font-mono">usuario.{defaultWorkerName}</code> en los paneles principales.</p>
          </div>

          <button onClick={handleSaveConfig} className="w-full mt-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl shadow-lg transition-all text-sm">
            Guardar Configuración Stratum
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoolConfiguration;
