import React, { useState, useEffect, useContext } from 'react';
import { db } from '../../services/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import { useError } from '../../context/ErrorContext';

const ProfitabilitySettings = () => {
  const { darkMode } = useContext(ThemeContext);
  const { showError, showSuccess } = useError();
  const [fixedRatePerTHs, setFixedRatePerTHs] = useState(0.06);
  const [fixedPoolCommission, setFixedPoolCommission] = useState(1);
  const [useFixedRate, setUseFixedRate] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'profitability');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFixedRatePerTHs(data.fixedRatePerTHs ?? 0.06);
        setFixedPoolCommission(data.fixedPoolCommission ?? 1);
        setUseFixedRate(data.useFixedRate ?? false);
      }
    }, (err) => {
      console.error("Error fetching profitability settings:", err);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveSettings = () => {
    const dataToSave = {
      fixedRatePerTHs: isNaN(fixedRatePerTHs) ? 0.05 : fixedRatePerTHs,
      fixedPoolCommission: isNaN(fixedPoolCommission) ? 1 : fixedPoolCommission,
      useFixedRate,
    };
    setDoc(doc(db, 'settings', 'profitability'), dataToSave, { merge: true }).catch(err => {
      console.error(err);
      showError('Error al guardar.');
    });
    showSuccess('Configuración guardada exitosamente!');
  };

  const inputClass = `w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-2.5 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm`;

  const preview1THs = isNaN(fixedRatePerTHs) ? 0 : fixedRatePerTHs;
  const preview10THs = preview1THs * 10;
  const previewCommission = isNaN(fixedPoolCommission) ? 0 : fixedPoolCommission;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">📈 Rentabilidad del Pool</h2>
        <p className="text-xs text-gray-500 mt-1">Configura la tasa de ganancia y comisión del pool que verán los usuarios en la calculadora.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config Form */}
        <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl space-y-5`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3">Parámetros de Cálculo</h3>

          <div>
            <label htmlFor="fixedRatePerTHs" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Tasa por TH/s (USD / día)</label>
            <input type="number" id="fixedRatePerTHs" step="0.0001"
              value={fixedRatePerTHs}
              onChange={(e) => setFixedRatePerTHs(parseFloat(e.target.value))}
              className={inputClass} placeholder="0.06" />
            <p className="text-[11px] text-gray-500 mt-1.5">Ejemplo: Si 10 TH/s = $0.60/día → poner <span className="text-yellow-500/80 font-mono">0.06</span></p>
          </div>

          <div>
            <label htmlFor="fixedPoolCommission" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Comisión Fija del Pool (%)</label>
            <input type="number" id="fixedPoolCommission" step="0.1"
              value={fixedPoolCommission}
              onChange={(e) => setFixedPoolCommission(parseFloat(e.target.value))}
              className={inputClass} placeholder="1" />
            <p className="text-[11px] text-gray-500 mt-1.5">Los usuarios no podrán editar esta comisión en la calculadora.</p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.06] transition-all">
            <input type="checkbox" id="useFixedRate" checked={useFixedRate}
              onChange={(e) => setUseFixedRate(e.target.checked)}
              className="form-checkbox h-4 w-4 text-yellow-500 rounded bg-[#131824] border-[#1e2330]" />
            <div>
              <p className="text-sm font-semibold text-white">Usar tasa fija</p>
              <p className="text-[11px] text-gray-500">Si está activo, ignora el cálculo dinámico de Bitcoin</p>
            </div>
          </label>

          <button onClick={handleSaveSettings}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl shadow-lg transition-all text-sm">
            Guardar Configuración
          </button>
        </div>

        {/* Vista Previa */}
        <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl space-y-4`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3">Vista Previa en Tiempo Real</h3>

          <div className="space-y-3">
            {[
              { label: '1 TH/s / día', value: `$${preview1THs.toFixed(4)} USD` },
              { label: '10 TH/s / día', value: `$${preview10THs.toFixed(4)} USD` },
              { label: '100 TH/s / día', value: `$${(preview1THs * 100).toFixed(2)} USD` },
              { label: 'Comisión del Pool', value: `${previewCommission.toFixed(1)}%` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-[#131824] border border-[#1e2330] rounded-xl">
                <span className="text-xs text-gray-400 font-semibold">{label}</span>
                <span className="text-sm font-bold font-mono text-yellow-400">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
            <p className="text-xs text-yellow-400/70 font-semibold">💡 Nota</p>
            <p className="text-[11px] text-gray-500 mt-1">Los cambios se aplican en tiempo real a la calculadora del panel de usuario una vez guardados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilitySettings;
