import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, onSnapshot, doc, updateDoc, setDoc, query, where } from 'firebase/firestore';
import { useTheme } from '../../context/ThemeContext';
import { useError } from '../../context/ErrorContext';

const CURRENCIES = ['USDT', 'LTC', 'DOGE', 'BTC', 'USD'];

const currencyConfig = {
  USDT: { icon: '₮', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', decimals: 2 },
  LTC:  { icon: 'Ł', color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',    decimals: 8 },
  DOGE: { icon: 'Ð', color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20', decimals: 8 },
  BTC:  { icon: '₿', color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20', decimals: 8 },
  USD:  { icon: '$', color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20',   decimals: 2 },
};

const BalanceManagement = () => {
  const { theme } = useTheme();
  const { showError, showSuccess } = useError();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [massAmount, setMassAmount] = useState('');
  const [massCurrency, setMassCurrency] = useState('USDT');
  const [massOperation, setMassOperation] = useState('add');
  const [searchTerm, setSearchTerm] = useState('');

  const [globalMinThresholds, setGlobalMinThresholds] = useState({
    USDT: 5,
    LTC: 0.01,
    DOGE: 100,
    BTC: 0.001,
    USD: 5,
  });
  const [savingGlobalMins, setSavingGlobalMins] = useState(false);

  const [userCustomMins, setUserCustomMins] = useState({
    USDT: '',
    LTC: '',
    DOGE: '',
    BTC: '',
    USD: '',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        showError('Error al cargar la lista de usuarios.');
      }
    };
    fetchUsers();

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      showError('Error al suscribirse a los cambios de usuarios.');
    });
    return () => unsubscribe();
  }, [showError]);

  useEffect(() => {
    const q = query(collection(db, 'settings'), where('key', '==', 'paymentConfig'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setGlobalMinThresholds({
          USDT: data.minPaymentThresholdUSDT ?? data.minPaymentThresholdUSD ?? 5,
          LTC: data.minPaymentThresholdLTC ?? 0.01,
          DOGE: data.minPaymentThresholdDOGE ?? 100,
          BTC: data.minPaymentThresholdBTC ?? 0.001,
          USD: data.minPaymentThresholdUSD ?? 5,
        });
      }
    }, (err) => {
      console.error(err);
      showError('Error al suscribirse a los mínimos globales.');
    });
    return () => unsubscribe();
  }, [showError]);

  const selectedUser = users.find(u => u.id === selectedUserId);

  useEffect(() => {
    if (selectedUser && selectedUser.customMinPaymentThresholds) {
      setUserCustomMins({
        USDT: selectedUser.customMinPaymentThresholds.USDT !== undefined ? selectedUser.customMinPaymentThresholds.USDT : '',
        LTC: selectedUser.customMinPaymentThresholds.LTC !== undefined ? selectedUser.customMinPaymentThresholds.LTC : '',
        DOGE: selectedUser.customMinPaymentThresholds.DOGE !== undefined ? selectedUser.customMinPaymentThresholds.DOGE : '',
        BTC: selectedUser.customMinPaymentThresholds.BTC !== undefined ? selectedUser.customMinPaymentThresholds.BTC : '',
        USD: selectedUser.customMinPaymentThresholds.USD !== undefined ? selectedUser.customMinPaymentThresholds.USD : '',
      });
    } else {
      setUserCustomMins({ USDT: '', LTC: '', DOGE: '', BTC: '', USD: '' });
    }
  }, [selectedUserId, selectedUser]);

  const handleSelectUser = (userId) =>
    setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);

  const handleSelectAllUsers = (e) =>
    setSelectedUserIds(e.target.checked ? filteredUsers.map(u => u.id) : []);

  const getStep = (c) => (c === 'USDT' || c === 'USD') ? '0.01' : '0.00000001';
  const getDecimals = (c) => currencyConfig[c]?.decimals || 2;

  const handleAddBalance = async (e) => {
    e.preventDefault();
    if (!selectedUserId) { showError('Selecciona un usuario.'); return; }
    const amount = parseFloat(amountToAdd);
    if (isNaN(amount) || amount <= 0) { showError('Introduce una cantidad válida y positiva.'); return; }
    try {
      const user = users.find(u => u.id === selectedUserId);
      if (!user) { showError('Usuario no encontrado.'); return; }
      const field = `balance${selectedCurrency}`;
      const newBalance = (user[field] || 0) + amount;
      await updateDoc(doc(db, 'users', selectedUserId), { [field]: newBalance });
      showSuccess(`+${amount.toFixed(getDecimals(selectedCurrency))} ${selectedCurrency} añadidos a ${user.email}`);
      setAmountToAdd('');
    } catch (err) { showError(`Error: ${err.message}`); }
  };

  const handleSubtractBalance = async (e) => {
    e.preventDefault();
    if (!selectedUserId) { showError('Selecciona un usuario.'); return; }
    const amount = parseFloat(amountToAdd);
    if (isNaN(amount) || amount <= 0) { showError('Introduce una cantidad válida y positiva.'); return; }
    try {
      const user = users.find(u => u.id === selectedUserId);
      if (!user) { showError('Usuario no encontrado.'); return; }
      const field = `balance${selectedCurrency}`;
      const currentBalance = user[field] || 0;
      if (currentBalance < amount) { showError(`Balance insuficiente en ${selectedCurrency}.`); return; }
      const newBalance = currentBalance - amount;
      await updateDoc(doc(db, 'users', selectedUserId), { [field]: newBalance });
      showSuccess(`-${amount.toFixed(getDecimals(selectedCurrency))} ${selectedCurrency} restados de ${user.email}`);
      setAmountToAdd('');
    } catch (err) { showError(`Error: ${err.message}`); }
  };

  const handleMassBalanceUpdate = async () => {
    if (selectedUserIds.length === 0) { showError('Selecciona al menos un usuario.'); return; }
    const amount = parseFloat(massAmount);
    if (massOperation !== 'reset' && (isNaN(amount) || amount <= 0)) { showError('Introduce una cantidad válida.'); return; }
    try {
      const field = `balance${massCurrency}`;
      let ok = 0, fail = 0;
      for (const userId of selectedUserIds) {
        const user = users.find(u => u.id === userId);
        if (!user) { fail++; continue; }
        let newBalance = 0;
        if (massOperation === 'add') newBalance = (user[field] || 0) + amount;
        else if (massOperation === 'subtract') {
          const cur = user[field] || 0;
          if (cur < amount) { fail++; continue; }
          newBalance = cur - amount;
        } else { newBalance = 0; }
        try {
          await updateDoc(doc(db, 'users', userId), { [field]: newBalance });
          ok++;
        } catch { fail++; }
      }
      showSuccess(`Operación masiva: ${ok} actualizados, ${fail} fallidos.`);
      setSelectedUserIds([]);
      setMassAmount('');
    } catch (err) { showError(`Error: ${err.message}`); }
  };

  const handleSaveGlobalMinThresholds = async () => {
    setSavingGlobalMins(true);
    try {
      await setDoc(doc(db, 'settings', 'paymentConfig'), {
        key: 'paymentConfig',
        minPaymentThresholdUSDT: parseFloat(globalMinThresholds.USDT) || 0,
        minPaymentThresholdLTC: parseFloat(globalMinThresholds.LTC) || 0,
        minPaymentThresholdDOGE: parseFloat(globalMinThresholds.DOGE) || 0,
        minPaymentThresholdBTC: parseFloat(globalMinThresholds.BTC) || 0,
        minPaymentThresholdUSD: parseFloat(globalMinThresholds.USD) || 0,
        updatedAt: new Date(),
      }, { merge: true });
      showSuccess('Mínimos de retiro globales guardados exitosamente.');
    } catch (err) {
      showError(`Error al guardar mínimos globales: ${err.message}`);
    } finally {
      setSavingGlobalMins(false);
    }
  };

  const handleSaveUserCustomMins = async () => {
    if (!selectedUserId || !selectedUser) { showError('Selecciona un usuario.'); return; }
    try {
      const customObj = {};
      let hasValue = false;
      CURRENCIES.forEach(c => {
        const rawVal = userCustomMins[c];
        if (rawVal !== '' && rawVal !== null && rawVal !== undefined) {
          const parsed = parseFloat(rawVal);
          if (!isNaN(parsed) && parsed >= 0) {
            customObj[c] = parsed;
            hasValue = true;
          }
        }
      });

      await updateDoc(doc(db, 'users', selectedUserId), {
        customMinPaymentThresholds: hasValue ? customObj : null,
      });

      showSuccess(`Mínimos de retiro personalizados actualizados para ${selectedUser.email}`);
    } catch (err) {
      showError(`Error al actualizar mínimos del usuario: ${err.message}`);
    }
  };

  const handleClearUserCustomMins = async () => {
    if (!selectedUserId || !selectedUser) return;
    try {
      await updateDoc(doc(db, 'users', selectedUserId), {
        customMinPaymentThresholds: null,
      });
      setUserCustomMins({ USDT: '', LTC: '', DOGE: '', BTC: '', USD: '' });
      showSuccess(`Mínimos personalizados de ${selectedUser.email} eliminados. Ahora usa los mínimos globales.`);
    } catch (err) {
      showError(`Error al eliminar mínimos personalizados: ${err.message}`);
    }
  };

  const filteredUsers = searchTerm
    ? users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    : users;

  const inputClass = `w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm`;
  const labelClass = `block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">💰 Gestión de Balance y Mínimos de Retiro</h2>
        <p className="text-xs text-gray-500 mt-1">Administra los saldos y configura los límites mínimos de retiro por tipo de pago (globales o por usuario).</p>
      </div>

      <div className="rounded-2xl border bg-[#0b0e14] border-[#1e2330] shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              🌐 Mínimos de Retiro Globales (Por Tipo de Pago)
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Establece el monto mínimo por defecto que se requerirá a los usuarios para solicitar retiros por moneda.</p>
          </div>
          <button
            onClick={handleSaveGlobalMinThresholds}
            disabled={savingGlobalMins}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
          >
            {savingGlobalMins ? 'Guardando...' : 'Guardar Mínimos Globales'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {CURRENCIES.map(c => {
            const cfg = currencyConfig[c];
            return (
              <div key={c} className="space-y-1.5">
                <label htmlFor={`global-min-${c}`} className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <span className={cfg.color}>{cfg.icon}</span> Mínimo {c}
                </label>
                <input
                  id={`global-min-${c}`}
                  type="number"
                  step={getStep(c)}
                  value={globalMinThresholds[c] ?? ''}
                  onChange={(e) => setGlobalMinThresholds({ ...globalMinThresholds, [c]: e.target.value })}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border bg-[#0b0e14] border-[#1e2330] shadow-xl p-6 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3">
          ⚡ Ajuste de Balance y Mínimos Personalizados por Usuario
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="userSelectAdd" className={labelClass}>Seleccionar Usuario</label>
            <select id="userSelectAdd" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className={inputClass}>
              <option value="">Selecciona un usuario...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="currencySelectAdd" className={labelClass}>Moneda de Ajuste</label>
            <div className="flex gap-1.5 overflow-x-auto">
              {CURRENCIES.map(c => {
                const cfg = currencyConfig[c];
                return (
                  <button key={c} type="button" onClick={() => setSelectedCurrency(c)}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedCurrency === c ? `${cfg.bg} ${cfg.color}` : 'bg-white/[0.02] border-white/5 text-gray-500 hover:text-gray-300'
                    }`}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label htmlFor="amountToAdd" className={labelClass}>Cantidad ({selectedCurrency})</label>
            <input type="number" id="amountToAdd" value={amountToAdd} onChange={(e) => setAmountToAdd(e.target.value)}
              step={getStep(selectedCurrency)} className={inputClass} placeholder="0.00" />
          </div>
        </div>

        {selectedUser && (
          <div className="space-y-4 pt-2 border-t border-[#1e2330]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Saldos Actuales de: <span className="text-white">{selectedUser.email}</span>
              </span>
              {selectedUser.customMinPaymentThresholds && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  ⚠️ Tiene Mínimos Personalizados
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {CURRENCIES.map(c => {
                const cfg = currencyConfig[c];
                const bal = selectedUser[`balance${c}`] || 0;
                return (
                  <div key={c} className={`rounded-xl p-3 border ${selectedCurrency === c ? cfg.bg : 'bg-white/[0.02] border-white/5'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${selectedCurrency === c ? cfg.color : 'text-gray-600'}`}>{c}</p>
                    <p className={`text-sm font-black font-mono mt-1 ${selectedCurrency === c ? cfg.color : 'text-gray-400'}`}>
                      {bal.toFixed(cfg.decimals)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={handleAddBalance}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Añadir Balance
              </button>
              <button onClick={handleSubtractBalance}
                className="flex-1 py-2.5 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-400 hover:text-red-300 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
                Restar Balance
              </button>
            </div>

            <div className="bg-[#131824] border border-[#1e2330] rounded-xl p-4 space-y-3 mt-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#1e2330] pb-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                    🎯 Editar Mínimo de Retiro Personalizado para este Usuario
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Si dejas un campo vacío, se aplicará el mínimo global por defecto.
                  </p>
                </div>
                {selectedUser.customMinPaymentThresholds && (
                  <button
                    onClick={handleClearUserCustomMins}
                    className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold transition-all"
                  >
                    Restablecer a Globales
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {CURRENCIES.map(c => {
                  const cfg = currencyConfig[c];
                  const globalVal = globalMinThresholds[c] ?? 0;
                  const currentCustom = selectedUser.customMinPaymentThresholds?.[c];

                  return (
                    <div key={c} className="space-y-1">
                      <label htmlFor={`user-custom-${c}`} className="block text-[10px] font-bold uppercase text-gray-400">
                        Mín. {c} <span className="text-[9px] font-mono text-gray-500">(Global: {globalVal})</span>
                      </label>
                      <input
                        id={`user-custom-${c}`}
                        type="number"
                        step={getStep(c)}
                        value={userCustomMins[c] ?? ''}
                        onChange={(e) => setUserCustomMins({ ...userCustomMins, [c]: e.target.value })}
                        placeholder={globalVal.toString()}
                        className="w-full bg-[#0b0e14] border border-[#1e2330] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-500/50"
                      />
                      {currentCustom !== undefined && (
                        <p className="text-[9px] text-yellow-500/80 font-mono">Personalizado: {currentCustom}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveUserCustomMins}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold rounded-xl text-xs shadow-md transition-all"
                >
                  Guardar Mínimos de {selectedUser.email.split('@')[0]}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-[#0b0e14] border-[#1e2330] shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">🔁 Operaciones Masivas de Balance</h3>
          {selectedUserIds.length > 0 && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
              {selectedUserIds.length} usuario{selectedUserIds.length > 1 ? 's' : ''} seleccionado{selectedUserIds.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="massOperation" className={labelClass}>Operación</label>
            <select id="massOperation" value={massOperation} onChange={(e) => setMassOperation(e.target.value)} className={inputClass}>
              <option value="add">Añadir</option>
              <option value="subtract">Restar</option>
              <option value="reset">Resetear a 0</option>
            </select>
          </div>
          <div>
            <label htmlFor="massCurrency" className={labelClass}>Moneda</label>
            <select id="massCurrency" value={massCurrency} onChange={(e) => setMassCurrency(e.target.value)} className={inputClass} disabled={massOperation === 'reset'}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="massAmount" className={labelClass}>Cantidad</label>
            <input type="number" id="massAmount" value={massAmount} onChange={(e) => setMassAmount(e.target.value)}
              step={getStep(massCurrency)} className={inputClass} placeholder="0.00" disabled={massOperation === 'reset'} />
          </div>
          <button onClick={handleMassBalanceUpdate} disabled={selectedUserIds.length === 0}
            className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl text-sm shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Aplicar a {selectedUserIds.length} Usuarios
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-[#0b0e14] border-[#1e2330] shadow-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#1e2330] pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            👥 Balances y Mínimos de Usuarios ({users.length} usuarios)
          </h3>
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por email..."
              className="pl-9 pr-4 py-2 bg-[#131824] border border-[#1e2330] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-xs w-56" />
          </div>
        </div>

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm text-gray-500">No hay usuarios registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#1e2330] bg-[#06080c]">
            <table className="min-w-full divide-y divide-[#1e2330] text-sm">
              <thead className="bg-[#131824]">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <input type="checkbox" className="form-checkbox h-4 w-4 text-yellow-500 rounded bg-[#131824] border-[#1e2330]"
                      onChange={handleSelectAllUsers}
                      checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0} />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Email</th>
                  {CURRENCIES.map(c => {
                    const cfg = currencyConfig[c];
                    return (
                      <th key={c} className={`px-4 py-3 text-right text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                        {cfg.icon} {c}
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400">Mínimos Retiro</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2330]">
                {filteredUsers.map((user) => {
                  const hasCustomMins = !!user.customMinPaymentThresholds;
                  return (
                    <tr key={user.id}
                      className={`transition-all ${
                        selectedUserId === user.id
                          ? 'bg-yellow-500/[0.08] border-l-2 border-l-yellow-500'
                          : selectedUserIds.includes(user.id)
                          ? 'bg-white/[0.03]'
                          : 'hover:bg-white/[0.01]'
                      }`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" className="form-checkbox h-4 w-4 text-yellow-500 rounded bg-[#131824] border-[#1e2330]"
                          checked={selectedUserIds.includes(user.id)} onChange={() => handleSelectUser(user.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-white text-sm">{user.email}</p>
                          <p className="text-[10px] font-mono text-gray-600">{user.id}</p>
                        </div>
                      </td>
                      {CURRENCIES.map(c => {
                        const cfg = currencyConfig[c];
                        const bal = user[`balance${c}`] || 0;
                        return (
                          <td key={c} className="px-4 py-3 text-right">
                            <span className={`font-mono text-xs font-bold ${bal > 0 ? cfg.color : 'text-gray-600'}`}>
                              {bal.toFixed(cfg.decimals)}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          hasCustomMins
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {hasCustomMins ? 'Custom' : 'Global'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedUserId(user.id)}
                          className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-yellow-400 font-bold rounded-lg text-xs transition-all"
                        >
                          Gestionar Mínimos
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceManagement;
