import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../../context/LanguageContext';

const REFRESH_INTERVAL = 30000; // 30 segundos

const PoolStatsPage = () => {
    const { t } = useLanguage();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const formatHashrate = (hashValue) => {
        if (!hashValue && hashValue !== 0) return "0 H/s";
        const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s'];
        let i = 0;
        while (hashValue >= 1000 && i < units.length - 1) {
            hashValue /= 1000;
            i++;
        }
        return hashValue.toFixed(2) + ' ' + units[i];
    };

    const formatNumber = (num) => {
        if (!num && num !== 0) return '—';
        return new Intl.NumberFormat().format(num);
    };

    const fetchStats = useCallback(async (isInitial = false) => {
        if (!isInitial) setIsRefreshing(true);
        setError(false);
        try {
            const url = 'https://btc.solopool.org/api/stats';
            const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);

            let data;
            try {
                const res = await fetch(proxyUrl, { cache: 'no-store' });
                if (!res.ok) throw new Error();
                data = await res.json();
            } catch {
                // Fallback directo
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) throw new Error();
                data = await res.json();
            }

            setStats(data);
            setLastUpdated(new Date());
            setCountdown(REFRESH_INTERVAL / 1000);
        } catch (e) {
            console.error('Error fetching pool stats:', e);
            setError(true);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Fetch inicial y cada 30s
    useEffect(() => {
        fetchStats(true);
        const interval = setInterval(() => fetchStats(false), REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchStats]);

    // Countdown visual hasta próximo refresh
    useEffect(() => {
        if (!lastUpdated) return;
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) return REFRESH_INTERVAL / 1000;
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [lastUpdated]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                <p className="text-orange-400 font-mono tracking-widest text-sm">
                    {t('CONECTANDO CON LA RED...', 'CONNECTING TO NETWORK...')}
                </p>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center gap-4">
                <p className="text-red-400 font-mono">
                    {t('Error de conexión a la red de minería.', 'Mining network connection error.')}
                </p>
                <button onClick={() => { setLoading(true); fetchStats(true); }}
                    className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30 hover:bg-orange-500/30 transition-colors text-sm">
                    {t('Reintentar', 'Retry')}
                </button>
            </div>
        );
    }

    // Chart data — API devuelve los más recientes primero, hay que invertirlo
    const chartData = stats?.charts
        ? [...stats.charts].reverse().map(point => {
            const date = new Date(point.x * 1000);
            const hh = date.getHours().toString().padStart(2, '0');
            const mm = date.getMinutes().toString().padStart(2, '0');
            return {
                time: hh + ':' + mm,
                hashrateRaw: point.y,
                hashrateDisplay: +(point.y / 1e15).toFixed(2), // PH/s
            };
        })
        : [];

    const poolHashrate = stats?.hashrate ?? 0;
    const networkHashrate = stats?.node?.hashrate ?? 0;
    const networkDifficulty = stats?.node?.difficulty ?? 0;
    const height = stats?.node?.height ?? 0;
    const totalMiners = stats?.totalMiners ?? 0;
    const totalWorkers = stats?.totalWorkers ?? 0;
    const totalBlocks = stats?.totalBlocks ?? 0;
    const lastBlockTime = stats?.lastBlockTime;

    const timeAgo = lastUpdated
        ? `${lastUpdated.getHours().toString().padStart(2, '0')}:${lastUpdated.getMinutes().toString().padStart(2, '0')}:${lastUpdated.getSeconds().toString().padStart(2, '0')}`
        : '—';

    return (
        <div className="min-h-screen bg-[#0b0e14] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Decorators */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 blur-[150px] rounded-full opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full opacity-50"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)] ${isRefreshing ? 'bg-yellow-400 animate-ping' : 'bg-green-500 animate-pulse'}`}></span>
                            {t('Estado Global de la Red', 'Global Network Status')}
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm">
                            {t('Datos sincronizados en tiempo real con la red de minería.', 'Real-time data synchronized with the mining network.')}
                        </p>
                    </div>

                    {/* Live indicator + refresh */}
                    <div className="flex items-center gap-4">
                        <div className="bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-2 flex items-center gap-3 text-xs text-gray-500 font-mono">
                            <span className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-yellow-400 animate-ping' : 'bg-green-500'}`}></span>
                            <span>{t('Actualizado:', 'Updated:')} <span className="text-green-400">{timeAgo}</span></span>
                            <span>·</span>
                            <span>{t('Refresca en', 'Refreshes in')} <span className="text-orange-400">{countdown}s</span></span>
                        </div>
                        <button
                            onClick={() => fetchStats(false)}
                            disabled={isRefreshing}
                            className="p-2 bg-[#131824] border border-[#1e2330] rounded-xl hover:border-orange-500/40 transition-colors disabled:opacity-50"
                            title={t('Actualizar ahora', 'Refresh now')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Stats Banner superiores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4">
                        <div>
                            <p className="text-2xl font-bold font-mono text-white">{formatHashrate(poolHashrate)}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                {t('POOL HASHRATE', 'POOL HASHRATE')}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                    </div>

                    <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4">
                        <div>
                            <p className="text-2xl font-bold font-mono text-white">{totalMiners}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                {t('MINEROS EN LÍNEA', 'MINERS ONLINE')}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                    </div>

                    <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4">
                        <div>
                            <p className="text-2xl font-bold font-mono text-white">{formatHashrate(networkHashrate)}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                {t('HASHRATE DE LA RED', 'NETWORK HASHRATE')}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                        </div>
                    </div>

                    <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4">
                        <div>
                            <p className="text-2xl font-bold font-mono text-white">{formatHashrate(networkDifficulty).replace('/s', '')}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                {t('DIFICULTAD DE LA RED', 'NETWORK DIFFICULTY')}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Stats Banner inferiores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4">
                        <div>
                            <p className="text-2xl font-bold font-mono text-white">{formatNumber(height)}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                {t('ALTURA DEL BLOQUE', 'BLOCK HEIGHT')}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gray-500/10 border border-gray-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                        </div>
                    </div>

                    <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4">
                        <div>
                            <p className="text-2xl font-bold font-mono text-gray-400">{lastBlockTime ? new Date(lastBlockTime * 1000).toLocaleTimeString() : 'N/A'}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                {t('ÚLTIMO BLOQUE', 'LAST BLOCK')}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>

                    <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4">
                        <div>
                            <p className="text-2xl font-bold font-mono text-white">{formatNumber(totalBlocks)}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                {t('BLOQUES TOTALES', 'TOTAL BLOCKS')}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                    </div>

                    <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4">
                        <div>
                            <p className="text-2xl font-bold font-mono text-white">{totalWorkers}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                {t('WORKERS ACTIVOS', 'ACTIVE WORKERS')}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Gráfico de Hashrate */}
                <div className="bg-[#131824]/90 backdrop-blur p-6 md:p-8 rounded-3xl border border-[#1e2330] shadow-2xl mb-8">
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                {t('Gráficos de Pool y Red', 'Pool & Network Charts')}
                            </h3>
                            <p className="text-gray-500 text-sm mt-1">
                                {t('Hashrate de la pool durante las últimas 24 horas.', 'Pool hashrate over the last 24 hours.')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1.5 text-orange-400">
                                <span className="w-3 h-0.5 bg-orange-400 rounded inline-block"></span>
                                {t('Pool Hashrate', 'Pool Hashrate')}
                            </span>
                        </div>
                    </div>

                    {chartData.length > 0 ? (
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorHash" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" vertical={false} />
                                    <XAxis
                                        dataKey="time"
                                        stroke="#374151"
                                        tick={{ fill: '#6b7280', fontSize: 11 }}
                                        dy={8}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        stroke="#374151"
                                        tick={{ fill: '#6b7280', fontSize: 11 }}
                                        tickFormatter={(v) => v.toFixed(0) + ' P'}
                                        width={55}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e2330', borderColor: '#374151', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                        itemStyle={{ color: '#f97316' }}
                                        labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                                        formatter={(value, name, props) => [formatHashrate(props.payload.hashrateRaw), t('Hashrate', 'Hashrate')]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="hashrateDisplay"
                                        stroke="#f97316"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#colorHash)"
                                        dot={false}
                                        activeDot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[350px] flex items-center justify-center text-gray-500">
                            {t('Sin datos de gráfica disponibles.', 'No chart data available.')}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PoolStatsPage;

