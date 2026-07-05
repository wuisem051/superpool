import React, { useState, useEffect, useRef, useContext } from 'react';
import { db } from '../../services/firebase';
import {
  collection, getDocs, onSnapshot, doc,
  addDoc, updateDoc, deleteDoc, query, where
} from 'firebase/firestore';
import { useError } from '../../context/ErrorContext';

/* ════════════════════════════════════════════
   HELPERS / MINI-COMPONENTS
════════════════════════════════════════════ */

const StatusBadge = ({ status }) => {
  const map = {
    activo: { dot: 'bg-emerald-400 animate-pulse', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    inactivo: { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    offline: { dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    pendiente: { dot: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    testing: { dot: 'bg-blue-400 animate-pulse', text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  };
  const s = map[status] || map.offline;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
};

const InputField = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
      {label}
    </label>
    <input
      id={id}
      {...props}
      className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600
                 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors text-sm"
    />
  </div>
);

const SelectField = ({ label, id, children, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
      {label}
    </label>
    <select
      id={id}
      {...props}
      className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-white
                 focus:outline-none focus:border-blue-500/50 transition-colors text-sm appearance-none"
    >
      {children}
    </select>
  </div>
);

/* ════════════════════════════════════════════
   MODAL DE EDICIÓN
════════════════════════════════════════════ */
const EditModal = ({ miner, users, onClose, onSave }) => {
  const userEmail = users.find(u => u.id === miner.userId)?.email || miner.userId;
  const [workerName, setWorkerName] = useState(miner.workerName || '');
  const [hashrate, setHashrate] = useState(miner.currentHashrate || 0);
  const [status, setStatus] = useState(miner.status || 'inactivo');
  const [testingTime, setTestingTime] = useState(miner.testingTime || '');

  const handleSave = () => {
    let finalWorkerName = workerName;
    if (status !== 'pendiente' && (!workerName || workerName.toLowerCase().includes('pendiente'))) {
      finalWorkerName = `worker-${Math.random().toString(36).substring(2, 8)}`;
    }
    onSave(miner.id, { workerName: finalWorkerName, currentHashrate: parseFloat(hashrate) || 0, status, testingTime });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0b0e14] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Editar Minero</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{miner.id}</p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Usuario (solo lectura) */}
        <div className="mb-5 p-4 bg-[#131824] border border-white/5 rounded-2xl">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Usuario propietario</p>
          <p className="text-white font-medium text-sm truncate">{userEmail}</p>
          <p className="text-gray-600 font-mono text-xs mt-0.5">{miner.userId}</p>
        </div>

        {/* Campos editables */}
        <div className="space-y-4 mb-6">
          <InputField
            label="Nombre del Worker"
            id="edit-worker"
            type="text"
            value={workerName}
            onChange={e => setWorkerName(e.target.value)}
            placeholder="Ej: worker01"
          />
          <InputField
            label="Hashrate (TH/s)"
            id="edit-hashrate"
            type="number"
            step="0.01"
            value={hashrate}
            onChange={e => setHashrate(e.target.value)}
          />
          <SelectField label="Estado" id="edit-status" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="pendiente">Pendiente (En Revisión)</option>
            <option value="testing">En Prueba (Testing)</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="offline">Offline</option>
          </SelectField>
          {status === 'testing' && (
            <InputField
              label="Tiempo estimado de prueba"
              id="edit-testing-time"
              type="text"
              value={testingTime}
              onChange={e => setTestingTime(e.target.value)}
              placeholder="Ej: 5 minutos"
            />
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold">
            Cancelar
          </button>
          <button onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   MODAL CONFIRMAR ELIMINACIÓN
════════════════════════════════════════════ */
const ConfirmModal = ({ count, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div className="bg-[#0b0e14] border border-red-500/20 rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">¿Eliminar {count > 1 ? `${count} mineros` : 'este minero'}?</h3>
      <p className="text-gray-500 text-sm mb-6">Esta acción no se puede deshacer.</p>
      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold">
          Cancelar
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all">
          Eliminar
        </button>
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
const MinerManagement = ({ onNewMinerAdded }) => {
  const { showError, showSuccess } = useError();

  /* ── STATE ── */
  const [miners, setMiners] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const MINERS_PER_PAGE = 12;

  const [selectedIds, setSelectedIds] = useState([]);
  const [editingMiner, setEditingMiner] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // null | 'selected' | minerId

  /* form — add miner */
  const [formUserId, setFormUserId] = useState('');
  const [formWorker, setFormWorker] = useState('');
  const [formHashrate, setFormHashrate] = useState('');
  const [formStatus, setFormStatus] = useState('activo');
  const [showAddForm, setShowAddForm] = useState(false);

  const prevCount = useRef(null);

  /* ── SUBSCRIPTIONS ── */
  useEffect(() => {
    const unsubMiners = onSnapshot(collection(db, 'miners'), snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // solo mineros de usuario (type === 'user' o sin type != 'store')
      const userMiners = all.filter(m => m.type !== 'store');
      setMiners(userMiners);

      if (prevCount.current !== null && userMiners.length > prevCount.current && onNewMinerAdded) {
        onNewMinerAdded(userMiners.length - prevCount.current);
      }
      prevCount.current = userMiners.length;
    }, err => { console.error(err); showError('Error al cargar mineros.'); });

    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { showError('Error al cargar usuarios.'); }
    };
    fetchUsers();

    return () => unsubMiners();
  }, [onNewMinerAdded, showError]);

  /* ── FILTER + PAGINATE ── */
  const filtered = miners.filter(m => {
    const userEmail = users.find(u => u.id === m.userId)?.email || '';
    const matchSearch = !searchTerm ||
      m.workerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.userId?.includes(searchTerm) ||
      m.id?.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / MINERS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * MINERS_PER_PAGE, currentPage * MINERS_PER_PAGE);

  /* ── STATS ── */
  const totalHashrate = miners.reduce((s, m) => s + (m.currentHashrate || 0), 0);
  const activeCount = miners.filter(m => m.status === 'activo').length;
  const offlineCount = miners.filter(m => m.status === 'offline').length;

  /* ── HANDLERS ── */
  const handleAddMiner = async () => {
    if (!formUserId || !formWorker.trim()) {
      showError('Selecciona un usuario e ingresa el nombre del worker.');
      return;
    }
    try {
      await addDoc(collection(db, 'miners'), {
        userId: formUserId,
        workerName: formWorker.trim(),
        currentHashrate: parseFloat(formHashrate) || 0,
        status: formStatus,
        type: 'user',
        createdAt: new Date(),
      });
      showSuccess('Minero añadido exitosamente.');
      setFormUserId(''); setFormWorker(''); setFormHashrate(''); setFormStatus('activo');
      setShowAddForm(false);
    } catch (e) { showError(`Error al añadir minero: ${e.message}`); }
  };

  const handleSaveEdit = async (id, data) => {
    try {
      await updateDoc(doc(db, 'miners', id), data);
      showSuccess('Minero actualizado.');
      setEditingMiner(null);
    } catch (e) { showError(`Error al actualizar: ${e.message}`); }
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteTarget === 'selected') {
        await Promise.all(selectedIds.map(id => deleteDoc(doc(db, 'miners', id))));
        showSuccess(`${selectedIds.length} minero(s) eliminado(s).`);
        setSelectedIds([]);
      } else {
        await deleteDoc(doc(db, 'miners', deleteTarget));
        showSuccess('Minero eliminado.');
        setSelectedIds(prev => prev.filter(id => id !== deleteTarget));
      }
    } catch (e) { showError(`Error al eliminar: ${e.message}`); }
    setDeleteTarget(null);
  };

  const toggleSelect = id =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(m => m.id));

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#06080d] text-gray-100 p-6 lg:p-8">
      {/* ── MODALS ── */}
      {editingMiner && (
        <EditModal
          miner={editingMiner}
          users={users}
          onClose={() => setEditingMiner(null)}
          onSave={handleSaveEdit}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          count={deleteTarget === 'selected' ? selectedIds.length : 1}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H7a2 2 0 00-2 2v2m14-4h-2a2 2 0 012 2v2M9 21H7a2 2 0 01-2-2v-2m14 4h-2a2 2 0 002-2v-2M3 9v6m18-6v6M9 9h6v6H9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Gestión de Mineros</h1>
            <p className="text-gray-500 text-sm">Mineros activos de todos los usuarios</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500
                     text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showAddForm ? 'Cancelar' : 'Añadir Minero'}
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Mineros', value: miners.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Activos', value: activeCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Offline', value: offlineCount, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Hashrate Total', value: `${totalHashrate.toFixed(1)} TH/s`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border border-white/5 rounded-2xl p-4`}>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── ADD MINER FORM ── */}
      {showAddForm && (
        <div className="mb-8 bg-[#0d1117] border border-white/5 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Añadir nuevo minero de usuario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SelectField label="Usuario" id="add-user" value={formUserId} onChange={e => setFormUserId(e.target.value)}>
              <option value="">Seleccionar usuario...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </SelectField>
            <InputField label="Worker Name" id="add-worker" type="text" value={formWorker}
              onChange={e => setFormWorker(e.target.value)} placeholder="Ej: worker01" />
            <InputField label="Hashrate (TH/s)" id="add-hashrate" type="number" step="0.01"
              value={formHashrate} onChange={e => setFormHashrate(e.target.value)} placeholder="0.00" />
            <SelectField label="Estado" id="add-status" value={formStatus} onChange={e => setFormStatus(e.target.value)}>
              <option value="activo">Activo</option>
              <option value="testing">En Prueba</option>
              <option value="pendiente">Pendiente</option>
              <option value="inactivo">Inactivo</option>
              <option value="offline">Offline</option>
            </SelectField>
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={handleAddMiner}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500
                         text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all">
              Crear Minero
            </button>
          </div>
        </div>
      )}

      {/* ── SEARCH + FILTER ── */}
      <div className="bg-[#0d1117] border border-white/5 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-white/5">
          {/* search */}
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Buscar por email, worker, ID usuario o ID minero..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#131824] border border-white/5 rounded-xl text-sm text-white
                         placeholder-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors"
            />
          </div>
          {/* filter */}
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="bg-[#131824] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white
                       focus:outline-none focus:border-blue-500/40 transition-colors appearance-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="testing">En Prueba</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="offline">Offline</option>
          </select>
          {/* bulk delete */}
          {selectedIds.length > 0 && (
            <button onClick={() => setDeleteTarget('selected')}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400
                         hover:bg-red-500/20 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar ({selectedIds.length})
            </button>
          )}
        </div>

        {/* ── TABLE ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#0a0d12]">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox"
                    checked={paginated.length > 0 && selectedIds.length === paginated.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-600 bg-[#1a2035] accent-blue-500 cursor-pointer" />
                </th>
                {['ID Minero', 'Usuario (Email)', 'ID Usuario', 'Worker Name', 'Hashrate', 'Estado', 'Creado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3H7a2 2 0 00-2 2v2m14-4h-2a2 2 0 012 2v2M9 21H7a2 2 0 01-2-2v-2m14 4h-2a2 2 0 002-2v-2M3 9v6m18-6v6M9 9h6v6H9z" />
                    </svg>
                    No se encontraron mineros
                  </td>
                </tr>
              ) : (
                paginated.map((miner, idx) => {
                  const userEmail = users.find(u => u.id === miner.userId)?.email || '—';
                  const isSelected = selectedIds.includes(miner.id);
                  return (
                    <tr key={miner.id}
                      className={`border-b border-white/[0.03] transition-colors duration-150 hover:bg-white/[0.02]
                        ${isSelected ? 'bg-blue-500/[0.04]' : idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                    >
                      {/* checkbox */}
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(miner.id)}
                          className="rounded border-gray-600 bg-[#1a2035] accent-blue-500 cursor-pointer" />
                      </td>

                      {/* ID Minero */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-[#1a2035] px-2 py-1 rounded-lg text-gray-400">
                          {miner.id.substring(0, 10)}…
                        </span>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-white font-medium max-w-[180px] truncate">{userEmail}</td>

                      {/* ID Usuario */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-[#1a2035] px-2 py-1 rounded-lg text-gray-500">
                          {miner.userId?.substring(0, 10)}…
                        </span>
                      </td>

                      {/* Worker */}
                      <td className="px-4 py-3 text-blue-300 font-mono text-xs font-semibold">{miner.workerName || '—'}</td>

                      {/* Hashrate */}
                      <td className="px-4 py-3">
                        <span className="text-orange-400 font-bold">{(miner.currentHashrate || 0).toFixed(2)}</span>
                        <span className="text-gray-600 text-xs ml-1">TH/s</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={miner.status || 'inactivo'} />
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {miner.createdAt?.toDate
                          ? miner.createdAt.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingMiner(miner)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                            title="Editar">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteTarget(miner.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-white/5 bg-[#0a0d12]">
            <p className="text-xs text-gray-500">
              Mostrando {(currentPage - 1) * MINERS_PER_PAGE + 1}–{Math.min(currentPage * MINERS_PER_PAGE, filtered.length)} de {filtered.length}
            </p>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-[#131824] border border-white/5 text-gray-400 hover:text-white
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-semibold">
                ← Anterior
              </button>
              <span className="px-3 py-1.5 text-xs text-gray-400">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-[#131824] border border-white/5 text-gray-400 hover:text-white
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-semibold">
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* footer note */}
      <p className="mt-4 text-xs text-gray-700 text-center">
        {filtered.length} minero{filtered.length !== 1 ? 's' : ''} registrado{filtered.length !== 1 ? 's' : ''} en total
      </p>
    </div>
  );
};

export default MinerManagement;
