import React, { useState, useEffect, useContext } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, onSnapshot, doc, updateDoc, query, orderBy, where, deleteDoc } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import { useError } from '../../context/ErrorContext';

const statusConfig = {
  'Abierto':    { dot: 'bg-blue-400 animate-pulse',   text: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  'Pendiente':  { dot: 'bg-yellow-400',                text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'Respondido': { dot: 'bg-purple-400',                text: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  'Cerrado':    { dot: 'bg-gray-500',                  text: 'text-gray-500',   bg: 'bg-gray-500/10 border-gray-500/20' },
};

const StatusBadge = ({ status }) => {
  const s = statusConfig[status] || statusConfig['Abierto'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
};

const ContactRequestsManagement = ({ onUnreadCountChange }) => {
  const { darkMode } = useContext(ThemeContext);
  const { showError, showSuccess } = useError();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminReply, setAdminReply] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'contactRequests'), orderBy('createdAt', 'desc'));
    const safeToDate = (val) => {
      if (!val) return new Date();
      if (val.toDate && typeof val.toDate === 'function') return val.toDate();
      if (val instanceof Date) return val;
      return new Date(val);
    };

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(),
        createdAt: safeToDate(doc.data().createdAt),
        updatedAt: safeToDate(doc.data().updatedAt),
      }));
      setRequests(fetched);
      const unreadCount = fetched.filter(r => r.status === 'Abierto' || r.status === 'Pendiente').length;
      if (onUnreadCountChange) onUnreadCountChange(unreadCount);
      if (selectedRequest) {
        setSelectedRequest(fetched.find(r => r.id === selectedRequest.id) || null);
      }
    }, (error) => {
      console.error(error);
      showError('Error al cargar las solicitudes.');
    });
    return () => unsubscribe();
  }, [selectedRequest, onUnreadCountChange, showError]);

  const handleSendReply = async () => {
    if (!adminReply.trim() || !selectedRequest) { showError('El mensaje no puede estar vacío.'); return; }
    try {
      const newConversation = [...selectedRequest.conversation, { sender: 'admin', text: adminReply, timestamp: new Date().toISOString() }];
      await updateDoc(doc(db, 'contactRequests', selectedRequest.id), { conversation: newConversation, status: 'Respondido', updatedAt: new Date() });
      setAdminReply('');
      showSuccess('Respuesta enviada.');
    } catch (error) { showError(`Error: ${error.message}`); }
  };

  const handleCloseRequest = async () => {
    if (!selectedRequest) return;
    try {
      await updateDoc(doc(db, 'contactRequests', selectedRequest.id), { status: 'Cerrado', updatedAt: new Date() });
      showSuccess('Solicitud cerrada.');
    } catch (error) { showError(`Error: ${error.message}`); }
  };

  const handleDeleteClosed = async () => {
    if (!window.confirm('¿Eliminar TODAS las solicitudes cerradas?')) return;
    try {
      const snapshot = await getDocs(query(collection(db, 'contactRequests'), where('status', '==', 'Cerrado')));
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'contactRequests', d.id))));
      setRequests(prev => prev.filter(r => r.status !== 'Cerrado'));
      showSuccess('Solicitudes cerradas eliminadas.');
      setSelectedRequest(null);
    } catch (error) { showError(`Error: ${error.message}`); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <h2 className="text-xl font-bold text-white">💬 Solicitudes de Contacto</h2>
          <p className="text-xs text-gray-500 mt-1">{requests.filter(r => r.status !== 'Cerrado').length} solicitudes activas</p>
        </div>
        <button onClick={handleDeleteClosed}
          className="px-4 py-2 text-xs font-bold bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 hover:text-red-300 rounded-xl transition-all">
          Eliminar Cerradas
        </button>
      </div>

      <div className={`flex h-[640px] rounded-2xl border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl overflow-hidden`}>
        {/* Lista */}
        <div className={`w-80 shrink-0 border-r border-[#1e2330] flex flex-col ${darkMode ? 'bg-[#06080c]' : 'bg-gray-50'}`}>
          <div className="p-4 border-b border-[#1e2330]">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Bandeja de entrada</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-xs text-gray-500">No hay solicitudes de contacto.</p>
              </div>
            ) : (
              requests.map(req => (
                <button
                  key={req.id}
                  onClick={() => { setSelectedRequest(req); setAdminReply(''); }}
                  className={`w-full text-left p-4 border-b border-[#1e2330] transition-all ${
                    selectedRequest?.id === req.id ? 'bg-yellow-500/10 border-l-2 border-l-yellow-500' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-sm font-bold truncate flex-1 ${req.status === 'Cerrado' ? 'text-gray-500' : 'text-white'}`}>{req.subject}</p>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-1">{req.userEmail}</p>
                  <p className="text-[11px] text-gray-600 line-clamp-1">{req.conversation?.[req.conversation.length - 1]?.text}</p>
                  <p className="text-[10px] text-gray-700 mt-1">{req.createdAt?.toLocaleDateString('es-ES')}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detalle */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedRequest ? (
            <>
              {/* Header */}
              <div className="p-5 border-b border-[#1e2330] flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedRequest.subject}</h3>
                  <p className="text-xs text-gray-400 mt-1">De: <span className="text-gray-300">{selectedRequest.userEmail}</span> — {selectedRequest.createdAt?.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <StatusBadge status={selectedRequest.status} />
              </div>

              {/* Conversación */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {selectedRequest.conversation?.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'admin'
                        ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-100'
                        : 'bg-[#131824] border border-[#1e2330] text-gray-200'
                    }`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1.5 ${msg.sender === 'admin' ? 'text-yellow-500/50' : 'text-gray-600'}`}>
                        {(() => { try { const t = msg.timestamp; if (!t) return ''; if (t.toDate) return t.toDate().toLocaleString('es-ES'); return new Date(t).toLocaleString('es-ES'); } catch { return ''; } })()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              {selectedRequest.status !== 'Cerrado' && (
                <div className="p-4 border-t border-[#1e2330] bg-[#06080c] space-y-3">
                  <textarea
                    rows="3"
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/40 resize-none transition-colors"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={handleCloseRequest}
                      className="px-4 py-2 bg-green-600/10 border border-green-500/20 text-green-400 hover:bg-green-600/20 text-xs font-bold rounded-xl transition-all">
                      ✓ Cerrar Solicitud
                    </button>
                    <button onClick={handleSendReply}
                      className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-yellow-500/10">
                      Enviar Respuesta
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-3xl mb-4">💬</div>
              <h4 className="text-white font-semibold mb-1">Selecciona una conversación</h4>
              <p className="text-xs text-gray-500">Elige una solicitud de la lista para ver los detalles y responder.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactRequestsManagement;
