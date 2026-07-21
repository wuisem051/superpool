import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase'; // Importar Firebase Firestore
import { collection, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useTheme } from '../../context/ThemeContext';
import { useError } from '../../context/ErrorContext'; // Importar useError

const CURRENCIES = ['USDT', 'LTC', 'DOGE', 'BTC'];

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(records);
      } catch (error) {
        console.error("Error fetching users from Firebase:", error);
        showError('Error al cargar la lista de usuarios.');
      }
    };

    fetchUsers();

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const updatedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(updatedUsers);
    }, (error) => {
      console.error("Error subscribing to users collection:", error);
      showError('Error al suscribirse a los cambios de usuarios.');
    });

    return () => { unsubscribe(); };
  }, [showError]);

  const handleSelectUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = (e) => {
    setSelectedUserIds(e.target.checked ? users.map(u => u.id) : []);
  };

  const getStep = (currency) => (currency === 'USDT' || currency === 'USD') ? '0.01' : '0.00000001';
  const getPlaceholder = (currency) => (currency === 'USDT' || currency === 'USD') ? '100.00' : '0.001';
  const getDecimals = (currency) => (currency === 'USDT' || currency === 'USD') ? 2 : 8;

  const handleAddBalance = async (e) => {
    e.preventDefault();
    showSuccess(null);
    showError(null);

    if (!selectedUserId) { showError('Por favor, selecciona un usuario.'); return; }
    const amount = parseFloat(amountToAdd);
    if (isNaN(amount) || amount <= 0) { showError('Por favor, introduce una cantidad válida y positiva.'); return; }

    try {
      const selectedUser = users.find(u => u.id === selectedUserId);
      if (!selectedUser) { showError('Usuario no encontrado.'); return; }

      const field = `balance${selectedCurrency}`;
      const currentBalance = selectedUser[field] || 0;
      const newBalance = currentBalance + amount;

      await updateDoc(doc(db, 'users', selectedUserId), { [field]: newBalance });
      showSuccess(`Se han añadido ${amount.toFixed(getDecimals(selectedCurrency))} ${selectedCurrency} a ${selectedUser.email}. Nuevo balance: ${newBalance.toFixed(getDecimals(selectedCurrency))} ${selectedCurrency}`);
      setAmountToAdd('');
    } catch (err) {
      console.error("Error adding balance:", err);
      showError(`Fallo al añadir balance: ${err.message}`);
    }
  };

  const handleSubtractBalance = async (e) => {
    e.preventDefault();
    showSuccess(null);
    showError(null);

    if (!selectedUserId) { showError('Por favor, selecciona un usuario.'); return; }
    const amount = parseFloat(amountToAdd);
    if (isNaN(amount) || amount <= 0) { showError('Por favor, introduce una cantidad válida y positiva.'); return; }

    try {
      const selectedUser = users.find(u => u.id === selectedUserId);
      if (!selectedUser) { showError('Usuario no encontrado.'); return; }

      const field = `balance${selectedCurrency}`;
      const currentBalance = selectedUser[field] || 0;
      if (currentBalance < amount) { showError(`Balance insuficiente en ${selectedCurrency}.`); return; }
      const newBalance = currentBalance - amount;

      await updateDoc(doc(db, 'users', selectedUserId), { [field]: newBalance });
      showSuccess(`Se han restado ${amount.toFixed(getDecimals(selectedCurrency))} ${selectedCurrency} de ${selectedUser.email}. Nuevo balance: ${newBalance.toFixed(getDecimals(selectedCurrency))} ${selectedCurrency}`);
      setAmountToAdd('');
    } catch (err) {
      console.error("Error subtracting balance:", err);
      showError(`Fallo al restar balance: ${err.message}`);
    }
  };

  const handleMassBalanceUpdate = async () => {
    showSuccess(null);
    showError(null);

    if (selectedUserIds.length === 0) { showError('Por favor, selecciona al menos un usuario.'); return; }
    const amount = parseFloat(massAmount);
    if (massOperation !== 'reset' && (isNaN(amount) || amount <= 0)) { showError('Por favor, introduce una cantidad válida.'); return; }

    try {
      let successfulUpdates = 0;
      let failedUpdates = 0;
      const field = `balance${massCurrency}`;

      for (const userId of selectedUserIds) {
        const userDoc = users.find(u => u.id === userId);
        if (!userDoc) { failedUpdates++; continue; }

        let newBalance = 0;
        if (massOperation === 'reset') {
          newBalance = 0;
        } else {
          const currentBalance = userDoc[field] || 0;
          if (massOperation === 'add') {
            newBalance = currentBalance + amount;
          } else if (massOperation === 'subtract') {
            if (currentBalance < amount) { failedUpdates++; continue; }
            newBalance = currentBalance - amount;
          }
        }

        try {
          await updateDoc(doc(db, 'users', userId), { [field]: newBalance });
          successfulUpdates++;
        } catch (err) {
          console.error(`Error updating user ${userId}:`, err);
          failedUpdates++;
        }
      }

      showSuccess(`Operación masiva completada: ${successfulUpdates} usuarios actualizados, ${failedUpdates} fallidos.`);
      setSelectedUserIds([]);
      setMassAmount('');
    } catch (err) {
      console.error("Error mass update:", err);
      showError(`Fallo al realizar la operación masiva: ${err.message}`);
    }
  };

  const selectClass = `${theme.inputBackground} ${theme.text} border-gray-600 rounded-md shadow-sm sm:text-sm p-2 w-full`;
  const inputClass = `${theme.inputBackground} ${theme.text} border-gray-600 rounded-md shadow-sm sm:text-sm p-2 w-full`;
  const thClass = `px-6 py-3 text-left text-xs font-medium ${theme.textSoft} uppercase tracking-wider`;

  return (
    <div className={`${theme.background} ${theme.text} p-6 rounded-lg shadow-md`}>
      <h2 className="text-2xl font-semibold mb-4">Gestión de Balance de Usuarios</h2>

      {/* --- Añadir Balance --- */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Añadir Balance</h3>
        <form onSubmit={handleAddBalance} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="userSelectAdd" className="block text-sm font-medium mb-1">Seleccionar Usuario:</label>
            <select id="userSelectAdd" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className={selectClass}>
              <option value="">Selecciona un usuario</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="currencySelectAdd" className="block text-sm font-medium mb-1">Moneda:</label>
            <select id="currencySelectAdd" value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} className={selectClass}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="amountToAdd" className="block text-sm font-medium mb-1">Cantidad a Añadir ({selectedCurrency}):</label>
            <input type="number" id="amountToAdd" value={amountToAdd} onChange={(e) => setAmountToAdd(e.target.value)}
              step={getStep(selectedCurrency)} className={inputClass} placeholder={`Ej: ${getPlaceholder(selectedCurrency)}`} required />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold">
              Añadir Balance
            </button>
          </div>
        </form>
      </div>

      {/* --- Restar Balance --- */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Restar Balance</h3>
        <form onSubmit={handleSubtractBalance} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="userSelectSubtract" className="block text-sm font-medium mb-1">Seleccionar Usuario:</label>
            <select id="userSelectSubtract" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className={selectClass}>
              <option value="">Selecciona un usuario</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="currencySelectSubtract" className="block text-sm font-medium mb-1">Moneda:</label>
            <select id="currencySelectSubtract" value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} className={selectClass}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="amountToSubtract" className="block text-sm font-medium mb-1">Cantidad a Restar ({selectedCurrency}):</label>
            <input type="number" id="amountToSubtract" value={amountToAdd} onChange={(e) => setAmountToAdd(e.target.value)}
              step={getStep(selectedCurrency)} className={inputClass} placeholder={`Ej: ${getPlaceholder(selectedCurrency)}`} required />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold">
              Restar Balance
            </button>
          </div>
        </form>
      </div>

      {/* --- Operaciones Masivas --- */}
      <div className={`mb-6 p-4 ${theme.backgroundAlt} rounded-lg shadow-inner`}>
        <h3 className="text-xl font-semibold mb-3">Operaciones Masivas de Balance</h3>
        <p className={`${theme.textSoft} text-sm mb-4`}>Aplica cambios de balance a los usuarios seleccionados en la tabla de abajo.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="massOperation" className="block text-sm font-medium mb-1">Operación:</label>
            <select id="massOperation" value={massOperation} onChange={(e) => setMassOperation(e.target.value)} className={selectClass}>
              <option value="add">Añadir</option>
              <option value="subtract">Restar</option>
              <option value="reset">Resetear a 0</option>
            </select>
          </div>
          <div>
            <label htmlFor="massCurrency" className="block text-sm font-medium mb-1">Moneda:</label>
            <select id="massCurrency" value={massCurrency} onChange={(e) => setMassCurrency(e.target.value)} className={selectClass} disabled={massOperation === 'reset'}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="massAmount" className="block text-sm font-medium mb-1">Cantidad ({massCurrency}):</label>
            <input type="number" id="massAmount" value={massAmount} onChange={(e) => setMassAmount(e.target.value)}
              step={getStep(massCurrency)} className={inputClass} placeholder={`Ej: ${getPlaceholder(massCurrency)}`}
              disabled={massOperation === 'reset'} required={massOperation !== 'reset'} />
          </div>
          <div>
            <button onClick={handleMassBalanceUpdate}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed font-semibold"
              disabled={selectedUserIds.length === 0}>
              Aplicar a {selectedUserIds.length} Usuarios
            </button>
          </div>
        </div>
        {selectedUserIds.length > 0 && (
          <p className={`${theme.textSoft} text-sm mt-3`}>Usuarios seleccionados: {selectedUserIds.length}</p>
        )}
      </div>

      {/* --- Tabla de Balances --- */}
      <h3 className="text-xl font-semibold mb-3">Balances Actuales de Usuarios</h3>
      {users.length === 0 ? (
        <p className={`${theme.textSoft} text-center py-8`}>No hay usuarios registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${theme.borderColor}`}>
            <thead className={`${theme.tableHeaderBackground}`}>
              <tr>
                <th className={thClass}>
                  <input type="checkbox" className={`form-checkbox h-4 w-4 text-yellow-500 ${theme.inputBackground} ${theme.borderColor} rounded`}
                    onChange={handleSelectAllUsers} checked={selectedUserIds.length === users.length && users.length > 0} />
                </th>
                <th className={thClass}>Email</th>
                <th className={thClass}>UID</th>
                <th className={thClass}>USDT</th>
                <th className={thClass}>LTC</th>
                <th className={thClass}>DOGE</th>
                <th className={thClass}>BTC</th>
              </tr>
            </thead>
            <tbody className={`${theme.background} divide-y ${theme.borderColor}`}>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textSoft}`}>
                    <input type="checkbox" className={`form-checkbox h-4 w-4 text-yellow-500 ${theme.inputBackground} ${theme.borderColor} rounded`}
                      checked={selectedUserIds.includes(user.id)} onChange={() => handleSelectUser(user.id)} />
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textSoft}`}>{user.email}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textSoft} font-mono text-xs`}>{user.id}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textSoft}`}>
                    {(user.balanceUSDT || 0).toFixed(2)} USDT
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textSoft}`}>
                    {(user.balanceLTC || 0).toFixed(8)} LTC
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textSoft}`}>
                    {(user.balanceDOGE || 0).toFixed(8)} DOGE
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textSoft}`}>
                    {(user.balanceBTC || 0).toFixed(8)} BTC
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BalanceManagement;
