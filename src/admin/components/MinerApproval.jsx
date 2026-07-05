import React, { useState, useEffect, useContext } from 'react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import { useError } from '../../context/ErrorContext';

/* ── STATUS BADGE ── */
const StatusBadge = ({ status }) => {
    const map = {
        pendiente: { dot: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Pendiente' },
        testing: { dot: 'bg-blue-400 animate-pulse', text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'En Prueba' },
        activo: { dot: 'bg-emerald-400 animate-pulse', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Activo' },
    };
    const s = map[status] || map.pendiente;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
};

/* ── APPROVAL MODAL ── */
const ApprovalModal = ({ miner, userEmail, onClose, onApprove }) => {
    const [workerName, setWorkerName] = useState(`worker-${miner.userId?.substring(0, 5) || 'user'}-01`);
    const [testingTime, setTestingTime] = useState('5 minutos');
    const [skipTesting, setSkipTesting] = useState(false);

    const handleApprove = () => {
        onApprove(miner.id, {
            workerName: workerName.trim() || `worker-${Math.random().toString(36).substring(2, 8)}`,
            status: skipTesting ? 'activo' : 'testing',
            testingTime: skipTesting ? '' : testingTime,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0b0e14] border border-emerald-500/20 rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
                {/* Glow */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-8 -mt-8" />

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Aprobar Minero</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Asigna un nombre de worker para activarlo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Info */}
                <div className="mb-5 p-4 bg-[#131824] border border-white/5 rounded-2xl space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Usuario</span>
                        <span className="text-white font-medium truncate max-w-[200px]">{userEmail}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Hashrate solicitado</span>
                        <span className="text-cyan-400 font-bold font-mono">{(miner.currentHashrate || 0).toFixed(2)} TH/s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Solicitado el</span>
                        <span className="text-gray-400">
                            {miner.createdAt?.toDate
                                ? miner.createdAt.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '—'}
                        </span>
                    </div>
                </div>

                {/* Fields */}
                <div className="space-y-4 mb-5">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                            Nombre del Worker (asignar)
                        </label>
                        <input
                            type="text"
                            value={workerName}
                            onChange={e => setWorkerName(e.target.value)}
                            placeholder="Ej: worker-juan-01"
                            className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600
                         focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors text-sm font-mono"
                        />
                    </div>

                    {!skipTesting && (
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                Tiempo de Prueba Estimado
                            </label>
                            <input
                                type="text"
                                value={testingTime}
                                onChange={e => setTestingTime(e.target.value)}
                                placeholder="Ej: 5 minutos, 1 hora"
                                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600
                           focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors text-sm"
                            />
                            <p className="text-xs text-gray-600 mt-1">El usuario verá este tiempo mientras el minero está en prueba</p>
                        </div>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#131824] border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                        <input
                            type="checkbox"
                            checked={skipTesting}
                            onChange={e => setSkipTesting(e.target.checked)}
                            className="rounded border-gray-600 accent-emerald-500 w-4 h-4"
                        />
                        <div>
                            <p className="text-sm text-white font-medium">Activar directamente sin prueba</p>
                            <p className="text-xs text-gray-500">El worker pasará a estado "Activo" inmediatamente</p>
                        </div>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold">
                        Cancelar
                    </button>
                    <button onClick={handleApprove}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all">
                        ✓ Aprobar & Asignar
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ── MAIN COMPONENT ── */
const MinerApproval = () => {
    const { darkMode } = useContext(ThemeContext);
    const { showError, showSuccess } = useError();

    const [pendingMiners, setPendingMiners] = useState([]);
    const [testingMiners, setTestingMiners] = useState([]);
    const [users, setUsers] = useState([]);
    const [approvingMiner, setApprovingMiner] = useState(null);

    /* ── SUBSCRIPTIONS ── */
    useEffect(() => {
        const qPending = query(collection(db, 'miners'), where('status', '==', 'pendiente'));
        const unsubPending = onSnapshot(qPending, snap => {
            setPendingMiners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, err => { console.error(err); showError('Error al cargar mineros pendientes.'); });

        const qTesting = query(collection(db, 'miners'), where('status', '==', 'testing'));
        const unsubTesting = onSnapshot(qTesting, snap => {
            setTestingMiners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, err => { console.error(err); });

        const fetchUsers = async () => {
            try {
                const snap = await getDocs(collection(db, 'users'));
                setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) { showError('Error al cargar usuarios.'); }
        };
        fetchUsers();

        return () => { unsubPending(); unsubTesting(); };
    }, [showError]);

    const getUserEmail = (userId) =>
        users.find(u => u.id === userId)?.email || userId?.substring(0, 12) + '…';

    const handleApprove = async (minerId, data) => {
        try {
            await updateDoc(doc(db, 'miners', minerId), data);
            showSuccess(`Worker "${data.workerName}" ${data.status === 'activo' ? 'activado' : 'en prueba'} exitosamente!`);
            setApprovingMiner(null);
        } catch (e) { showError(`Error al aprobar: ${e.message}`); }
    };

    const handleReject = async (minerId) => {
        try {
            await deleteDoc(doc(db, 'miners', minerId));
            showSuccess('Solicitud rechazada y eliminada.');
        } catch (e) { showError(`Error al rechazar: ${e.message}`); }
    };

    const handleActivate = async (minerId) => {
        try {
            await updateDoc(doc(db, 'miners', minerId), { status: 'activo', testingTime: '' });
            showSuccess('Minero activado exitosamente!');
        } catch (e) { showError(`Error al activar: ${e.message}`); }
    };

    const MinerCard = ({ miner, actions }) => (
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 bg-[#131824] border border-white/5 rounded-xl flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H7a2 2 0 00-2 2v2m14-4h-2a2 2 0 012 2v2M9 21H7a2 2 0 01-2-2v-2m14 4h-2a2 2 0 002-2v-2M3 9v6m18-6v6M9 9h6v6H9z" />
                    </svg>
                </div>
                <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{getUserEmail(miner.userId)}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                        <StatusBadge status={miner.status} />
                        <span className="text-cyan-400 font-mono font-bold text-xs bg-cyan-500/10 px-2 py-0.5 rounded-full">
                            {(miner.currentHashrate || 0).toFixed(2)} TH/s
                        </span>
                        {miner.status === 'testing' && miner.testingTime && (
                            <span className="text-blue-300 text-xs bg-blue-500/10 px-2 py-0.5 rounded-full">
                                ⏱ {miner.testingTime}
                            </span>
                        )}
                        {miner.workerName && miner.status !== 'pendiente' && (
                            <span className="text-gray-400 font-mono text-xs bg-white/5 px-2 py-0.5 rounded-full">
                                {miner.workerName}
                            </span>
                        )}
                    </div>
                    <p className="text-gray-600 text-xs mt-1">
                        Solicitado: {miner.createdAt?.toDate
                            ? miner.createdAt.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                {actions}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#06080d] text-gray-100 p-6 lg:p-8">
            {/* Modal */}
            {approvingMiner && (
                <ApprovalModal
                    miner={approvingMiner}
                    userEmail={getUserEmail(approvingMiner.userId)}
                    onClose={() => setApprovingMiner(null)}
                    onApprove={handleApprove}
                />
            )}

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-white">Aprobación de Mineros</h1>
                    <p className="text-gray-500 text-sm">Revisa y aprueba las solicitudes de mineros de los usuarios</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    {pendingMiners.length > 0 && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-sm font-bold">
                            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                            {pendingMiners.length} pendiente{pendingMiners.length !== 1 ? 's' : ''}
                        </span>
                    )}
                    {testingMiners.length > 0 && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-bold">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                            {testingMiners.length} en prueba
                        </span>
                    )}
                </div>
            </div>

            {/* Solicitudes Pendientes */}
            <div className="mb-8">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    Solicitudes Pendientes de Revisión
                </h2>
                {pendingMiners.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-white/5 rounded-2xl text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">No hay solicitudes pendientes</p>
                        <p className="text-xs mt-1">Cuando un usuario añada un minero, aparecerá aquí</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingMiners.map(miner => (
                            <MinerCard
                                key={miner.id}
                                miner={miner}
                                actions={
                                    <>
                                        <button
                                            onClick={() => handleReject(miner.id)}
                                            className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-semibold"
                                        >
                                            ✗ Rechazar
                                        </button>
                                        <button
                                            onClick={() => setApprovingMiner(miner)}
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
                                        >
                                            ✓ Aprobar
                                        </button>
                                    </>
                                }
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* En Prueba */}
            {testingMiners.length > 0 && (
                <div>
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                        Mineros en Prueba (Testing)
                    </h2>
                    <div className="space-y-3">
                        {testingMiners.map(miner => (
                            <MinerCard
                                key={miner.id}
                                miner={miner}
                                actions={
                                    <button
                                        onClick={() => handleActivate(miner.id)}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all"
                                    >
                                        ▶ Activar
                                    </button>
                                }
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MinerApproval;
