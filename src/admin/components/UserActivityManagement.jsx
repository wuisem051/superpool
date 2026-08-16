import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ThemeContext } from '../../context/ThemeContext';

/* ── Error Boundary para evitar pantalla en blanco ── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <p className="text-red-400 font-bold text-sm">Error al cargar la sección</p>
              <p className="text-red-400/70 text-xs mt-0.5">{String(this.state.error)}</p>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Helpers de formato ── */
const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(iso));
  } catch (e) {
    return String(iso);
  }
};

const timeSince = (iso) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'hace unos segundos';
  if (diff < 3600000) return `hace ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `hace ${Math.floor(diff / 3600000)} h`;
  return `hace ${Math.floor(diff / 86400000)} días`;
};

/* ── Badge online / offline ── */
const OnlineBadge = ({ isOnline }) =>
  isOnline ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/15 border border-green-500/30 text-green-400">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      En línea
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-500/10 border border-gray-600/30 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
      Desconectado
    </span>
  );

/* ── Fila de historial de sesión ── */
const SessionRow = ({ s, idx }) => (
  <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
    <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
      <span className="text-[9px] font-bold text-blue-400">{idx + 1}</span>
    </div>
    <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
      <div>
        <p className="text-gray-500 uppercase tracking-wider text-[9px] mb-0.5">Login</p>
        <p className="text-gray-300 font-mono">{fmtDate(s.loginAt)}</p>
      </div>
      <div>
        <p className="text-gray-500 uppercase tracking-wider text-[9px] mb-0.5">Logout</p>
        <p className="text-gray-300 font-mono">
          {s.logoutAt ? fmtDate(s.logoutAt) : <span className="text-green-400">Activa</span>}
        </p>
      </div>
      <div>
        <p className="text-gray-500 uppercase tracking-wider text-[9px] mb-0.5">IP</p>
        <p className="text-blue-400 font-mono">{s.ip || '—'}</p>
      </div>
      <div className="col-span-2">
        <p className="text-gray-500 uppercase tracking-wider text-[9px] mb-0.5">Dispositivo</p>
        <p className="text-gray-400 truncate">{s.deviceInfo || '—'}</p>
      </div>
    </div>
  </div>
);

const UserActivityManagementInner = () => {
  const { darkMode } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState({});
  const [expandedUid, setExpandedUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'online' | 'offline'

  /* Cargar usuarios de Firestore */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        setUsers(list);
      } catch (e) {
        console.error('Error cargando usuarios:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  /* Suscripción en tiempo real a userSessions */
  useEffect(() => {
    if (users.length === 0) return;
    const unsubs = users.map(u => {
      const ref = doc(db, 'userSessions', u.uid);
      return onSnapshot(ref, snap => {
        setSessions(prev => ({
          ...prev,
          [u.uid]: snap.exists() ? snap.data() : null,
        }));
      });
    });
    return () => unsubs.forEach(fn => fn());
  }, [users]);

  /* Filtrar y buscar */
  const visible = users.filter(u => {
    const sess = sessions[u.uid];
    const matchSearch =
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (sess?.lastIp || '').includes(search);
    const matchFilter =
      filter === 'all' ||
      (filter === 'online' && sess?.isOnline) ||
      (filter === 'offline' && !sess?.isOnline);
    return matchSearch && matchFilter;
  });

  const onlineCount = users.filter(u => sessions[u.uid]?.isOnline).length;

  return (
    <div className={`space-y-6 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Actividad de Usuarios
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Registros de acceso, IPs y estado en tiempo real</p>
        </div>
        {/* Stats rápidas */}
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <p className="text-[11px] text-green-400 font-semibold uppercase tracking-wider">En línea</p>
            <p className="text-xl font-extrabold text-green-400">{onlineCount}</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
            <p className="text-[11px] text-yellow-400 font-semibold uppercase tracking-wider">Total</p>
            <p className="text-xl font-extrabold text-yellow-400">{users.length}</p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por email, usuario o IP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${
              darkMode
                ? 'bg-[#131824] border-[#1e2330] text-gray-200 placeholder-gray-600 focus:border-yellow-500/50'
                : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-yellow-400'
            }`}
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-[#1e2330]">
          {[['all', 'Todos'], ['online', 'En línea'], ['offline', 'Offline']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-2 text-xs font-bold transition-all ${
                filter === val
                  ? 'bg-yellow-500 text-gray-950'
                  : darkMode
                    ? 'bg-[#131824] text-gray-400 hover:text-white hover:bg-white/5'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-gray-500">Cargando actividad...</p>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className={`rounded-2xl border ${darkMode ? 'border-[#1e2330] bg-[#0d1017]' : 'border-gray-200 bg-gray-50'} p-12 text-center`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 font-medium">No se encontraron usuarios</p>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-[#1e2330]' : 'border-gray-200'}`}>
          {/* Cabecera tabla */}
          <div className={`grid grid-cols-[1fr_140px_130px_120px_90px_60px] gap-3 px-5 py-3 text-[10px] font-bold uppercase tracking-wider border-b ${
            darkMode ? 'bg-[#0d1017] border-[#1e2330] text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400'
          }`}>
            <span>Usuario</span>
            <span>Registro</span>
            <span>Último Login</span>
            <span>IP Actual</span>
            <span>Estado</span>
            <span className="text-center">Ses.</span>
          </div>

          {/* Filas */}
          <div className={darkMode ? 'bg-[#0b0e14]' : 'bg-white'}>
            {visible.map((u) => {
              const sess = sessions[u.uid];
              const isExpanded = expandedUid === u.uid;
              const sessionList = sess?.sessions || [];
              const isOnline = sess?.isOnline || false;

              return (
                <div key={u.uid} className={`border-b last:border-0 ${darkMode ? 'border-[#1e2330]' : 'border-gray-100'}`}>
                  {/* Fila principal */}
                  <div
                    className={`grid grid-cols-[1fr_140px_130px_120px_90px_60px] gap-3 px-5 py-4 items-center cursor-pointer transition-colors ${
                      darkMode
                        ? isExpanded ? 'bg-yellow-500/5' : 'hover:bg-white/[0.02]'
                        : isExpanded ? 'bg-yellow-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setExpandedUid(isExpanded ? null : u.uid)}
                  >
                    {/* Usuario */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                        isOnline
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/10 text-gray-500'
                      }`}>
                        {(u.username || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {u.username || '—'}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">{u.email || '—'}</p>
                      </div>
                    </div>

                    {/* Fecha de registro */}
                    <div>
                      <p className="text-xs text-gray-400">{u.createdAt ? fmtDate(u.createdAt).split(',')[0] : '—'}</p>
                      {u.registrationIp && (
                        <p className="text-[10px] text-gray-600 font-mono mt-0.5">IP: {u.registrationIp}</p>
                      )}
                    </div>

                    {/* Último login */}
                    <div>
                      <p className="text-xs text-gray-400">{sess?.lastLogin ? timeSince(sess.lastLogin) : '—'}</p>
                      <p className="text-[10px] text-gray-600">{sess?.lastLogin ? fmtDate(sess.lastLogin).split(',')[0] : ''}</p>
                    </div>

                    {/* IP actual */}
                    <p className="text-xs font-mono text-blue-400">{sess?.lastIp || '—'}</p>

                    {/* Estado */}
                    <OnlineBadge isOnline={isOnline} />

                    {/* # Sesiones + chevron */}
                    <div className="flex items-center justify-center gap-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                        darkMode ? 'bg-[#1e2330] text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {sessionList.length}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Panel expandido: historial de sesiones */}
                  {isExpanded && (
                    <div className={`px-5 pb-5 pt-2 ${darkMode ? 'bg-[#0d1017]' : 'bg-gray-50'}`}>
                      <div className={`rounded-xl border p-4 ${darkMode ? 'border-[#1e2330] bg-[#0b0e14]' : 'border-gray-200 bg-white'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider">
                            Historial de Sesiones — {sessionList.length} registro(s)
                          </h4>
                        </div>
                        {sessionList.length === 0 ? (
                          <p className="text-xs text-gray-500 py-2">Sin sesiones registradas aún.</p>
                        ) : (
                          <div className="space-y-0 max-h-64 overflow-y-auto custom-scrollbar">
                            {[...sessionList].reverse().map((s, i) => (
                              <SessionRow key={i} s={s} idx={sessionList.length - 1 - i} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Componente principal con Error Boundary ── */
const UserActivityManagement = () => (
  <ErrorBoundary>
    <UserActivityManagementInner />
  </ErrorBoundary>
);

export default UserActivityManagement;
