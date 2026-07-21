import React, { useState, useEffect, useContext } from 'react'; // Importar useContext
import { db } from '../../services/firebase'; // Importar la instancia de Firebase Firestore
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext'; // Importar ThemeContext
import { useError } from '../../context/ErrorContext'; // Importar useError

const WithdrawalRequestsManagement = ({ onUnreadCountChange }) => { // Aceptar prop
  const { darkMode } = useContext(ThemeContext); // Usar ThemeContext
  const { showError, showSuccess } = useError(); // Usar el contexto de errores
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);


  useEffect(() => {
    const q = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(), // Convertir Timestamp a Date
        }));
        setWithdrawalRequests(requests);

        const pendingRequestsCount = requests.filter(req => req.status === 'Pendiente').length;
        if (onUnreadCountChange) {
          onUnreadCountChange(pendingRequestsCount);
        }
      } catch (fetchError) {
        console.error("Error fetching withdrawal requests from Firebase:", fetchError);
        showError('Error al cargar las solicitudes de retiro.');
        if (onUnreadCountChange) {
          onUnreadCountChange(0);
        }
      }
    }, (error) => {
      console.error("Error subscribing to withdrawal requests:", error);
      showError('Error al suscribirse a las solicitudes de retiro.');
    });

    return () => {
      unsubscribe();
    };
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

        if (!userSnap.exists()) {
          showError(`Error: No se pudo obtener el balance del usuario ${request.userId}.`);
          return;
        }

        const userData = userSnap.data();
        const balanceKey = `balance${request.currency}`;
        const currentBalance = userData[balanceKey] || 0;
        const newBalance = currentBalance - request.amount;

        await updateDoc(userRef, {
          [balanceKey]: newBalance >= 0 ? newBalance : 0,
        });

        showSuccess(`Estado de la solicitud ${request.id} actualizado a ${newStatus} y balance del usuario reducido.`);
      } else {
        showSuccess(`Estado de la solicitud ${request.id} actualizado a ${newStatus}.`);
      }
    } catch (err) {
      console.error("Error updating withdrawal status or user balance:", err);
      showError(`Fallo al actualizar el estado o el balance: ${err.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'Rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`${darkMode ? 'bg-[#0b0e14] border border-[#1e2330]' : 'bg-white border border-gray-200'} rounded-2xl p-6 shadow-xl`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V3a1 1 0 00-1-1H4a1 1 0 00-1 1v18a1 1 0 001 1h12a1 1 0 001-1v-5m-1-10v4m-4 0h4" />
            </svg>
            Gestión de Solicitudes de Retiro
          </h2>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            Revisa, aprueba o rechaza los retiros solicitados por los usuarios de la plataforma.
          </p>
        </div>
        <span className={`self-start sm:self-center px-3 py-1 rounded-full text-xs font-semibold ${darkMode ? 'bg-white/5 text-gray-300 border border-white/5' : 'bg-gray-100 text-gray-700'}`}>
          {withdrawalRequests.length} Solicitudes
        </span>
      </div>

      {withdrawalRequests.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-12 px-4 rounded-xl border-2 border-dashed ${darkMode ? 'border-white/5 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium">No hay solicitudes de retiro registradas.</p>
        </div>
      ) : (
        <div className={`overflow-x-auto rounded-xl border ${darkMode ? 'border-[#1e2330] bg-[#0b0e14]' : 'border-gray-200 bg-white'}`}>
          <table className="min-w-full divide-y divide-[#1e2330] text-sm">
            <thead className={darkMode ? 'bg-[#131824]' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fecha</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Usuario (Email)</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cantidad</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Moneda</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Método</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dirección / ID</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estado</th>
                <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-[#1e2330]' : 'divide-gray-200'}`}>
              {withdrawalRequests.map((request) => (
                <tr key={request.id} className={`transition-colors ${darkMode ? 'hover:bg-white/[0.01]' : 'hover:bg-gray-50'}`}>
                  <td className={`px-4 py-3 whitespace-nowrap font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {request.createdAt.toLocaleDateString()}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {request.userEmail}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap font-mono font-bold ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                    {request.amount.toFixed(request.currency === 'USDT' || request.currency === 'USD' ? 2 : 8)}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {request.currency}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      request.method === 'Binance Pay'
                        ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {request.method}
                    </span>
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap font-mono text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {request.addressOrId}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      request.status === 'Completado'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : request.status === 'Pendiente'
                        ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                    {request.status === 'Pendiente' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateStatus(request, 'Completado')}
                          className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-md transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(request, 'Rechazado')}
                          className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow-md transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 italic text-[11px]">Procesado</span>
                    )}
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

export default WithdrawalRequestsManagement;
