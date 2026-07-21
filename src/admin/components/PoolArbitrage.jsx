import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ThemeContext } from '../../context/ThemeContext';
import { useError } from '../../context/ErrorContext';

const cryptocurrencies = ['Bitcoin', 'Ethereum', 'Litecoin', 'Dogecoin', 'Monero'];

const defaultPool = {
  name: '', cryptocurrency: '', url: '', port: '',
  defaultWorkerName: '', commission: '', thsRate: '', description: '', isActive: true,
};

const PoolArbitrage = () => {
  const { darkMode } = useContext(ThemeContext);
  const { showError, showSuccess } = useError();
  const [pools, setPools] = useState([]);
  const [newPool, setNewPool] = useState({ ...defaultPool });

  const fetchPools = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'arbitragePools'));
      setPools(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      showError('Error al cargar las pools de arbitraje.');
    }
  };

  useEffect(() => { fetchPools(); }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPool(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddPool = async () => {
    if (!newPool.name || !newPool.url) { showError('El nombre y la URL son obligatorios.'); return; }
    try {
      await addDoc(collection(db, 'arbitragePools'), newPool);
      showSuccess('Pool agregada exitosamente!');
      setNewPool({ ...defaultPool });
      fetchPools();
    } catch (error) {
      showError('Error al agregar pool.');
    }
  };

  const handleDeletePool = async (id) => {
    if (window.confirm('¿Eliminar esta pool?')) {
      try {
        await deleteDoc(doc(db, 'arbitragePools', id));
        setPools(pools.filter(pool => pool.id !== id));
        showSuccess('Pool eliminada exitosamente!');
      } catch (error) {
        showError('Error al eliminar pool.');
      }
    }
  };

  const inputClass = `w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm`;
  const labelClass = `block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <h2 className="text-xl font-bold text-white">🔄 Arbitraje de Pools</h2>
          <p className="text-xs text-gray-500 mt-1">Configura pools alternativas para el arbitraje automático de hashrate.</p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
          {pools.length} pool{pools.length !== 1 ? 's' : ''} configurada{pools.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl space-y-4`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3">+ Agregar Nueva Pool</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="name" className={labelClass}>Nombre de la Pool</label>
              <input type="text" id="name" name="name" value={newPool.name} onChange={handleInputChange} className={inputClass} placeholder="DogecoinPool Pro" />
            </div>
            <div>
              <label htmlFor="cryptocurrency" className={labelClass}>Criptomoneda</label>
              <select id="cryptocurrency" name="cryptocurrency" value={newPool.cryptocurrency} onChange={handleInputChange} className={inputClass}>
                <option value="">Seleccionar...</option>
                {cryptocurrencies.map((coin) => <option key={coin} value={coin}>{coin}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="url" className={labelClass}>URL Stratum</label>
              <input type="text" id="url" name="url" value={newPool.url} onChange={handleInputChange} className={inputClass} placeholder="stratum+tcp://pool.com" />
            </div>
            <div>
              <label htmlFor="port" className={labelClass}>Puerto</label>
              <input type="text" id="port" name="port" value={newPool.port} onChange={handleInputChange} className={inputClass} placeholder="4444" />
            </div>
            <div>
              <label htmlFor="defaultWorkerName" className={labelClass}>Worker por Defecto</label>
              <input type="text" id="defaultWorkerName" name="defaultWorkerName" value={newPool.defaultWorkerName} onChange={handleInputChange} className={inputClass} placeholder="worker1" />
            </div>
            <div>
              <label htmlFor="commission" className={labelClass}>Comisión (%)</label>
              <input type="number" id="commission" name="commission" step="0.1" value={newPool.commission} onChange={handleInputChange} className={inputClass} placeholder="1.5" />
            </div>
            <div>
              <label htmlFor="thsRate" className={labelClass}>Tasa TH/s (USD)</label>
              <input type="number" id="thsRate" name="thsRate" step="0.01" value={newPool.thsRate} onChange={handleInputChange} className={inputClass} placeholder="0.05" />
            </div>
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>Descripción</label>
            <textarea id="description" name="description" rows="3" value={newPool.description} onChange={handleInputChange}
              className={`${inputClass} resize-none`} placeholder="Descripción de la pool y sus beneficios..." />
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.06] transition-all">
            <input type="checkbox" id="isActive" name="isActive" checked={newPool.isActive} onChange={handleInputChange}
              className="form-checkbox h-4 w-4 text-green-500 rounded bg-[#131824] border-[#1e2330]" />
            <div>
              <p className="text-sm font-semibold text-white">Pool activa</p>
              <p className="text-[11px] text-gray-500">Disponible para el sistema de arbitraje</p>
            </div>
          </label>

          <button onClick={handleAddPool}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl shadow-lg transition-all text-sm">
            + Agregar Pool
          </button>
        </div>

        {/* Lista */}
        <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3 mb-4">Pools Configuradas</h3>
          {pools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-3xl mb-2">🔗</div>
              <p className="text-xs text-gray-500">No hay pools configuradas aún.</p>
              <p className="text-[11px] text-gray-600 mt-1">Agrega la primera pool de arbitraje.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {pools.map((pool) => (
                <div key={pool.id} className="p-4 bg-[#131824] border border-[#1e2330] rounded-xl group hover:border-yellow-500/20 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{pool.name}</span>
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">{pool.cryptocurrency}</span>
                        {pool.isActive
                          ? <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">✓ Activa</span>
                          : <span className="text-[10px] font-bold text-gray-500 bg-gray-500/10 border border-gray-500/20 px-2 py-0.5 rounded-full">Inactiva</span>}
                      </div>
                      <p className="text-xs font-mono text-gray-500">{pool.url}:{pool.port}</p>
                    </div>
                    <button onClick={() => handleDeletePool(pool.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-4 text-xs font-mono text-gray-600">
                    <span>Comisión: <span className="text-gray-400">{pool.commission}%</span></span>
                    <span>TH/s: <span className="text-yellow-500">${pool.thsRate}</span></span>
                  </div>
                  {pool.description && <p className="text-[11px] text-gray-600 mt-2 line-clamp-1">{pool.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoolArbitrage;
