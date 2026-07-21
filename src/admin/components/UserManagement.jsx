import React, { useState, useEffect, useContext } from 'react';
import { db, auth } from '../../services/firebase';
import { collection, query, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateEmail, updatePassword } from 'firebase/auth';
import { ThemeContext } from '../../context/ThemeContext';
import { useError } from '../../context/ErrorContext';

const UserManagement = () => {
  const { darkMode } = useContext(ThemeContext);
  const { showError, showSuccess } = useError();
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [editingUser, setEditingUser] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');
  
  // Balances
  const [editBalanceUSDT, setEditBalanceUSDT] = useState(0);
  const [editBalanceBTC, setEditBalanceBTC] = useState(0);
  const [editBalanceLTC, setEditBalanceLTC] = useState(0);
  const [editBalanceDOGE, setEditBalanceDOGE] = useState(0);
  
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching users: ", error);
      showError(`Error al cargar usuarios: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchUsers();
    const unsubscribe = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error subscribing to users:", error);
      showError('Error al suscribirse a los usuarios.');
    });
    return () => unsubscribe();
  }, [showError]);

  const handleSelectUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = (e) => {
    setSelectedUserIds(e.target.checked ? users.map(u => u.id) : []);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    showError(null);
    showSuccess(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newUserEmail, newUserPassword);
      const firebaseUser = userCredential.user;

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email: newUserEmail,
        role: newUserRole,
        balanceUSDT: 0,
        balanceBTC: 0,
        balanceLTC: 0,
        balanceDOGE: 0,
        createdAt: new Date(),
      });

      showSuccess(`Usuario ${newUserEmail} creado con éxito.`);
      setNewUserEmail('');
      setNewUserPassword('');
      fetchUsers();
    } catch (error) {
      console.error("Error adding user: ", error);
      showError(`Fallo al añadir usuario: ${error.message}`);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditEmail(user.email || '');
    setEditRole(user.role || 'user');
    setEditPassword('');
    setEditBalanceUSDT(user.balanceUSDT || 0);
    setEditBalanceBTC(user.balanceBTC || 0);
    setEditBalanceLTC(user.balanceLTC || 0);
    setEditBalanceDOGE(user.balanceDOGE || 0);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    showError(null);
    showSuccess(null);
    try {
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        email: editEmail,
        role: editRole,
        balanceUSDT: parseFloat(editBalanceUSDT) || 0,
        balanceBTC: parseFloat(editBalanceBTC) || 0,
        balanceLTC: parseFloat(editBalanceLTC) || 0,
        balanceDOGE: parseFloat(editBalanceDOGE) || 0,
      });

      showSuccess(`Usuario ${editEmail} actualizado exitosamente.`);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user: ", error);
      showError(`Error al actualizar usuario: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${userToDelete.email}?`)) {
      showSuccess(null);
      showError(null);
      try {
        await deleteDoc(doc(db, 'users', userToDelete.id));
        await deleteDoc(doc(db, 'miners', userToDelete.id));
        showSuccess("Usuario y mineros asociados eliminados.");
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user: ", error);
        showError(`Error al eliminar usuario: ${error.message}`);
      }
    }
  };

  const handleMassDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;
    if (window.confirm(`¿Eliminar los ${selectedUserIds.length} usuarios seleccionados?`)) {
      showSuccess(null);
      showError(null);
      try {
        for (const userId of selectedUserIds) {
          await deleteDoc(doc(db, 'users', userId));
          await deleteDoc(doc(db, 'miners', userId));
        }
        showSuccess("Eliminación masiva completada.");
        setSelectedUserIds([]);
        fetchUsers();
      } catch (error) {
        showError(`Error en eliminación masiva: ${error.message}`);
      }
    }
  };

  const inputClass = `w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm`;
  const labelClass = `block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5`;

  return (
    <div className="space-y-6">
      {/* Añadir Usuario y Operaciones Masivas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 rounded-2xl p-6 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl`}>
          <h3 className={`text-md font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Añadir Nuevo Usuario</h3>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="newUserEmail" className={labelClass}>Email</label>
              <input type="email" id="newUserEmail" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required className={inputClass} placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label htmlFor="newUserPassword" className={labelClass}>Contraseña</label>
              <input type="password" id="newUserPassword" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required className={inputClass} placeholder="••••••••" />
            </div>
            <button type="submit" className="py-2.5 px-6 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-xl shadow-lg transition-colors text-sm">
              Añadir Usuario
            </button>
          </form>
        </div>

        <div className={`rounded-2xl p-6 border flex flex-col justify-between ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl`}>
          <div>
            <h3 className={`text-md font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Acciones Masivas</h3>
            <p className="text-xs text-gray-500 mb-4">Aplica acciones masivas a los usuarios seleccionados en la tabla inferior.</p>
          </div>
          <div className="flex items-center justify-between gap-3 bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
            <span className="text-xs font-bold text-red-400 font-mono">{selectedUserIds.length} Seleccionados</span>
            <button onClick={handleMassDeleteUsers} disabled={selectedUserIds.length === 0}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed shadow transition-colors">
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Usuarios */}
      <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl`}>
        <h3 className={`text-md font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Usuarios Registrados</h3>
        
        <div className="overflow-x-auto rounded-xl border border-[#1e2330] bg-[#06080c]">
          <table className="min-w-full divide-y divide-[#1e2330] text-sm">
            <thead className={darkMode ? 'bg-[#131824]' : 'bg-gray-100'}>
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-yellow-500 rounded bg-[#131824] border-[#1e2330]"
                    onChange={handleSelectAllUsers} checked={selectedUserIds.length === users.length && users.length > 0} />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">UID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Rol</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2330]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="form-checkbox h-4 w-4 text-yellow-500 rounded bg-[#131824] border-[#1e2330]"
                      checked={selectedUserIds.includes(user.id)} onChange={() => handleSelectUser(user.id)} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{user.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{user.id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'admin' 
                        ? 'bg-yellow-500/15 text-yellow-500 border border-yellow-500/20' 
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/10'
                    }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-medium space-x-2">
                    <button onClick={() => handleEditClick(user)}
                      className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold rounded-lg shadow-sm transition-all">
                      Editar
                    </button>
                    <button onClick={() => handleDeleteUser(user)}
                      className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 font-bold rounded-lg border border-red-500/20 transition-all">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editar Usuario Modal / Panel flotante */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`relative w-full max-w-lg rounded-2xl border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-2xl overflow-hidden`}>
            <div className="p-6 border-b border-[#1e2330] flex items-center justify-between">
              <div>
                <h3 className="text-md font-bold text-white uppercase tracking-wider">Editar Usuario</h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">{editingUser.email}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editEmail" className={labelClass}>Email</label>
                  <input type="email" id="editEmail" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="editRole" className={labelClass}>Rol</label>
                  <select id="editRole" value={editRole} onChange={(e) => setEditRole(e.target.value)} className={inputClass}>
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              {/* Grid de balances cripto */}
              <div className="p-4 bg-[#06080c] border border-[#1e2330] rounded-xl space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Balances del Usuario</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Saldo USDT</label>
                    <input type="number" step="any" value={editBalanceUSDT} onChange={(e) => setEditBalanceUSDT(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Saldo BTC</label>
                    <input type="number" step="any" value={editBalanceBTC} onChange={(e) => setEditBalanceBTC(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Saldo LTC</label>
                    <input type="number" step="any" value={editBalanceLTC} onChange={(e) => setEditBalanceLTC(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Saldo DOGE</label>
                    <input type="number" step="any" value={editBalanceDOGE} onChange={(e) => setEditBalanceDOGE(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1e2330]">
                <button type="button" onClick={() => setEditingUser(null)}
                  className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl text-sm transition-all">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-yellow-500/10">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
