import React, { useContext, useState, useEffect, useMemo } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';

/* ─────────────────────────────────────────
   ÍCONOS  (inline SVG)
───────────────────────────────────────── */
const IconBolt = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const IconCoin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconPie = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
  </svg>
);
const IconCpu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H7a2 2 0 00-2 2v2m14-4h-2a2 2 0 012 2v2M9 21H7a2 2 0 01-2-2v-2m14 4h-2a2 2 0 002-2v-2M3 9v6m18-6v6M9 9h6v6H9z" />
  </svg>
);

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, gradient, glow }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-white/5 bg-[#0d1117] p-6 shadow-xl group transition-transform duration-300 hover:-translate-y-1`}>
    {/* glow blob */}
    <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${glow}`} />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">{label}</p>
        <p className={`text-3xl font-extrabold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
          {value}
        </p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-10 text-white shadow-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const isActive = status === 'activo';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isActive
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
      {status}
    </span>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const MiningPortfolioContent = () => {
  const { currentUser } = useAuth();
  const [userMiners, setUserMiners] = useState([]);
  const [totalHashratePool, setTotalHashratePool] = useState(0);
  const [paymentRate, setPaymentRate] = useState(0);
  const [btcToUsdRate, setBtcToUsdRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setError('Debes iniciar sesión para ver tu portafolio.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubMiners = onSnapshot(
      query(collection(db, 'miners'), where('userId', '==', currentUser.uid)),
      (snap) => setUserMiners(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => { console.error(err); setError('Error al cargar tus mineros.'); setLoading(false); }
    );

    const unsubPool = onSnapshot(
      doc(db, 'settings', 'poolConfig'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setBtcToUsdRate(d.btcToUsdRate || 0);
        }
      },
      (err) => { console.error(err); }
    );

    const unsubProfitability = onSnapshot(
      doc(db, 'settings', 'profitability'),
      (snap) => {
        if (snap.exists()) {
          setPaymentRate(snap.data().fixedRatePerTHs || 0);
        }
      },
      (err) => { console.error(err); }
    );

    const unsubAll = onSnapshot(
      collection(db, 'miners'),
      (snap) => {
        setTotalHashratePool(snap.docs.reduce((s, d) => s + (d.data().currentHashrate || 0), 0));
        setLoading(false);
      },
      (err) => { console.error(err); setLoading(false); }
    );

    return () => { unsubMiners(); unsubPool(); unsubProfitability(); unsubAll(); };
  }, [currentUser]);

  const totalUserHashrate = useMemo(() =>
    userMiners.reduce((s, m) => s + (m.currentHashrate || 0), 0), [userMiners]);

  const estimatedDailyUSD = useMemo(() =>
    totalUserHashrate * paymentRate, [totalUserHashrate, paymentRate]);

  const userPct = useMemo(() =>
    totalHashratePool > 0 ? (totalUserHashrate / totalHashratePool) * 100 : 0,
    [totalUserHashrate, totalHashratePool]);

  /* ── LOADING ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#06080d]">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-12 w-12 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-gray-400 text-sm font-medium animate-pulse">Cargando portafolio...</p>
      </div>
    </div>
  );

  /* ── ERROR ── */
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#06080d] p-6">
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-md">
        <p className="text-red-400 font-semibold">{error}</p>
      </div>
    </div>
  );

  /* ── MAIN ── */
  return (
    <div className="min-h-screen bg-[#06080d] text-gray-100 p-6 lg:p-8">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/10 border border-orange-500/20">
          <IconCpu />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Mi Portafolio de Minería
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Resumen en tiempo real de tu actividad en la pool</p>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        <StatCard
          icon={<IconBolt />}
          label="Tu Hashrate Total"
          value={`${totalUserHashrate.toFixed(2)} TH/s`}
          sub="Potencia de cómputo activa"
          gradient="from-blue-400 to-cyan-400"
          glow="bg-blue-500"
        />
        <StatCard
          icon={<IconCoin />}
          label="Ganancia Diaria Est."
          value={`$${estimatedDailyUSD.toFixed(4)}`}
          sub="USD estimados por día"
          gradient="from-emerald-400 to-green-300"
          glow="bg-emerald-500"
        />
        <StatCard
          icon={<IconPie />}
          label="Participación en Pool"
          value={`${userPct.toFixed(4)}%`}
          sub={`Pool total: ${totalHashratePool.toFixed(2)} TH/s`}
          gradient="from-orange-400 to-amber-300"
          glow="bg-orange-500"
        />
      </div>

      {/* ── POOL PROGRESS BAR ── */}
      <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-400">Tu contribución al hashrate global</span>
          <span className="text-sm font-bold text-orange-400">{userPct.toFixed(4)}%</span>
        </div>
        <div className="w-full h-3 bg-[#1a2035] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700 shadow-lg shadow-orange-500/30"
            style={{ width: `${Math.min(userPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* ── MINERS TABLE ── */}
      <div className="bg-[#0d1117] border border-white/5 rounded-2xl shadow-xl overflow-hidden">
        {/* Header de la tabla */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10">
              <IconCpu />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Mineros Adquiridos</h2>
              <p className="text-xs text-gray-500">{userMiners.length} minero{userMiners.length !== 1 ? 's' : ''} registrado{userMiners.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            En vivo
          </span>
        </div>

        {userMiners.length === 0 ? (
          /* ── EMPTY STATE ── */
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 flex items-center justify-center mb-5">
              <IconCpu />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Sin mineros aún</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              Aún no tienes mineros en tu portafolio. Conecta o adquiere un minero para comenzar a generar ganancias.
            </p>
          </div>
        ) : (
          /* ── TABLE ── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#0a0d12]">
                  {['ID Minero', 'Worker Name', 'Hashrate (TH/s)', 'Estado', 'Fecha Adquisición'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userMiners.map((miner, idx) => (
                  <tr
                    key={miner.id}
                    className={`border-b border-white/[0.03] transition-colors duration-200 hover:bg-white/[0.02] ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]'
                      }`}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">
                      <span className="bg-[#1a2035] px-2 py-1 rounded-lg">{miner.id.substring(0, 8)}...</span>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{miner.workerName || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="text-blue-400 font-bold">{(miner.currentHashrate || 0).toFixed(2)}</span>
                      <span className="text-gray-600 text-xs ml-1">TH/s</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={miner.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {miner.createdAt?.toDate
                        ? miner.createdAt.toDate().toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── RATE INFO ── */}
      {btcToUsdRate > 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-orange-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tasa BTC/USD de referencia: <span className="text-gray-500 font-semibold">${btcToUsdRate.toLocaleString()}</span>
        </div>
      )}

    </div>
  );
};

export default MiningPortfolioContent;
