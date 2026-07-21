import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useTheme } from '../../context/ThemeContext';
import { useError } from '../../context/ErrorContext';

const CURRENCIES = ['USDT', 'LTC', 'DOGE', 'BTC'];

const currencyConfig = {
  USDT: { icon: '₮', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', decimals: 2 },
  LTC:  { icon: 'Ł', color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',    decimals: 8 },
  DOGE: { icon: 'Ð', color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20', decimals: 8 },
  BTC:  { icon: '₿', color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20', decimals: 8 },
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

  const handleSelectUser = (userId) =>
    setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);

  const handleSelectAllUsers = (e) =>
    setSelectedUserIds(e.target.checked ? filteredUsers.map(u => u.id) : []);

  const getStep = (c) => (c === 'USDT') ? '0.01' : '0.00000001';
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

  const selectedUser = users.find(u => u.id === selectedUserId);
  const filteredUsers = searchTerm
    ? users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    : users;

  const inputClass = `w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm`;
  const labelClass = `block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">💰 Gestión de Balance</h2>
        <p className="text-xs text-gray-500 mt-1">Añade o resta saldo a los usuarios de la plataforma.</p>
      </div>

      {/* Quick Balance Editor */}
      <div className="rounded-2xl border bg-[#0b0e14] border-[#1e2330] shadow-xl p-6 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3">
          ⚡ Ajuste Rápido de Balance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="userSelectAdd" className={labelClass}>Usuario</label>
            <select id="userSelectAdd" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className={inputClass}>
              <option value="">Selecciona un usuario...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="currencySelectAdd" className={labelClass}>Moneda</label>
            <div className="flex gap-2">
              {CURRENCIES.map(c => {
                const cfg = currencyConfig[c];
                return (
                  <button key={c} type="button" onClick={() => setSelectedCurrency(c)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
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

        {/* Preview balance card */}
        {selectedUser && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        )}

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
      </div>

      {/* Bulk Operations */}
      <div className="rounded-2xl border bg-[#0b0e14] border-[#1e2330] shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">🔁 Operaciones Masivas</h3>
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

      {/* Users Table */}
      <div className="rounded-2xl border bg-[#0b0e14] border-[#1e2330] shadow-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#1e2330] pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            👥 Balances Actuales ({users.length} usuarios)
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
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2330]">
                {filteredUsers.map((user) => (
                  <tr key={user.id}
                    className={`transition-all ${
                      selectedUserIds.includes(user.id)
                        ? 'bg-yellow-500/[0.04] border-l-2 border-l-yellow-500'
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceManagement;
