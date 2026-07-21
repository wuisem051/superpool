import React, { useState, useEffect, useContext } from 'react';
import { db } from '../../services/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import { useError } from '../../context/ErrorContext';

const statusMap = {
  Pendiente:  { dot: 'bg-yellow-400 animate-pulse', text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: '⏳' },
  Completado: { dot: 'bg-emerald-400',              text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: '✓' },
  Rechazado:  { dot: 'bg-red-400',                  text: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20', icon: '✕' },
};

const methodMap = {
  'Binance Pay': { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: '₿' },
  'USDT TRC20':  { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: '₮' },
};

const StatusBadge = ({ status }) => {
  const s = statusMap[status] || statusMap.Pendiente;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
};

const WithdrawalRequestsManagement = ({ onUnreadCountChange }) => {
  const { darkMode } = useContext(ThemeContext);
  const { showError, showSuccess } = useError();
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        }));
        setWithdrawalRequests(requests);
        const pendingCount = requests.filter(r => r.status === 'Pendiente').length;
        if (onUnreadCountChange) onUnreadCountChange(pendingCount);
      } catch (fetchError) {
        console.error(fetchError);
        showError('Error al cargar las solicitudes de retiro.');
        if (onUnreadCountChange) onUnreadCountChange(0);
      }
    }, (error) => {
      console.error(error);
      showError('Error al suscribirse a las solicitudes de retiro.');
    });
    return () => unsubscribe();
  }, [onUnreadCountChange, showError]);

  const handleUpdateStatus = async (request, newStatus) => {
    showSuccess(null);
    showError(null);
    try {
      const withdrawalRef = doc(db, 'withdrawals', request.id);
      await updateDoc(withdrawalRef, { status: newStatus });

      if (newStatus === 'Completado') {
        const userRef = doc(db, 'users', request.userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) { showError(`No se pudo obtener el balance del usuario.`); return; }
        const userData = userSnap.data();
        const balanceKey = `balance${request.currency}`;
        const currentBalance = userData[balanceKey] || 0;
        const newBalance = currentBalance - request.amount;
        await updateDoc(userRef, { [balanceKey]: newBalance >= 0 ? newBalance : 0 });
        showSuccess(`Solicitud aprobada y balance del usuario actualizado.`);
      } else {
        showSuccess(`Solicitud marcada como ${newStatus}.`);
      }
    } catch (err) {
      showError(`Error: ${err.message}`);
    }
  };

  const filtered = filter === 'all' ? withdrawalRequests : withdrawalRequests.filter(r => r.status === filter);
  const pendingCount = withdrawalRequests.filter(r => r.status === 'Pendiente').length;
  const completedCount = withdrawalRequests.filter(r => r.status === 'Completado').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            💸 Solicitudes de Pago
          </h2>
          <p className="text-xs text-gray-500 mt-1">Revisa y gestiona los retiros solicitados por los usuarios.</p>
        </div>

        {/* Stats strip */}
        <div className="flex gap-3 shrink-0">
          {[
            { label: 'Total', value: withdrawalRequests.length, color: 'text-gray-300' },
            { label: 'Pendientes', value: pendingCount, color: 'text-yellow-400' },
            { label: 'Completados', value: completedCount, color: 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="text-center px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl">
              <p className={`text-lg font-black font-mono ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'Pendiente', 'Completado', 'Rechazado'].map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === f
                ? 'bg-yellow-500 text-gray-950 shadow-md shadow-yellow-500/10'
                : 'bg-white/[0.04] text-gray-400 border border-white/5 hover:bg-white/[0.07]'
            }`}>
            {f === 'all' ? 'Todos' : f}
          </button>
        ))}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-white/5">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm font-semibold text-gray-400">No hay solicitudes {filter !== 'all' ? `con estado "${filter}"` : 'registradas'}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => {
            const method = methodMap[request.method] || methodMap['USDT TRC20'];
            const isExpanded = expandedId === request.id;
            const isPending = request.status === 'Pendiente';

            return (
              <div key={request.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isPending
                    ? 'bg-[#0b0e14] border-yellow-500/20 shadow-lg shadow-yellow-500/5'
                    : 'bg-[#0b0e14] border-[#1e2330]'
                }`}>

                {/* Main row — clickable to expand */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : request.id)}
                  className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">

                  {/* Status indicator */}
                  <StatusBadge status={request.status} />

                  {/* User */}
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Usuario</p>
                    <p className="text-sm font-bold text-white truncate max-w-[200px]">{request.userEmail}</p>
                  </div>

                  {/* Amount */}
                  <div className="min-w-[90px]">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Cantidad</p>
                    <p className="text-sm font-black font-mono text-yellow-400">
                      {request.amount?.toFixed(request.currency === 'USDT' ? 2 : 8)}
                      <span className="text-xs ml-1 text-yellow-500/60">{request.currency}</span>
                    </p>
                  </div>

                  {/* Method */}
                  <div className="min-w-[100px]">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Método</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${method.color}`}>
                      {method.icon} {request.method}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="min-w-[80px]">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Fecha</p>
                    <p className="text-xs text-gray-400">{request.createdAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>

                  {/* Chevron */}
                  <div className={`ml-auto text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-[#131824] border border-[#1e2330] rounded-xl p-4 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Dirección / ID de Pago</p>
                        <p className="text-sm font-mono text-white break-all">{request.addressOrId || '—'}</p>
                      </div>
                      <div className="bg-[#131824] border border-[#1e2330] rounded-xl p-4 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">ID de Solicitud</p>
                        <p className="text-xs font-mono text-gray-400 break-all">{request.id}</p>
                      </div>
                    </div>

                    {isPending && (
                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={() => handleUpdateStatus(request, 'Completado')}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/10">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Aprobar Retiro
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(request, 'Rechazado')}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-400 hover:text-red-300 font-bold rounded-xl text-sm transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WithdrawalRequestsManagement;
