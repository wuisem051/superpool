import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const PoolStatsPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Obtenemos los datos desde la API pública de solopool (con un proxy por si bloquean CORS)
                const response = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://btc.solopool.org/api/stats'));

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                setStats(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching pool stats:', err);
                // Fallback al intento directo si el proxy falla
                try {
                    const directResponse = await fetch('https://btc.solopool.org/api/stats');
                    const data = await directResponse.json();
                    setStats(data);
                    setLoading(false);
                } catch (e) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        fetchStats();

        // Auto-actualizar cada 60 segundos
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    // Formateadores para la UI
    const formatHashrate = (hashValue) => {
        if (!hashValue) return "0 H/s";
        let i = 0;
        const byteUnits = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s'];
        while (hashValue > 1000 && i < byteUnits.length - 1) {
            hashValue = hashValue / 1000;
            i++;
        }
        return Math.max(hashValue, 0.1).toFixed(2) + ' ' + byteUnits[i];
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-orange-400 font-mono tracking-widest">SINCRONIZANDO NODOS...</p>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center p-4">
                <p className="text-red-500 font-mono">Error de conexión a la red de minería principal.</p>
            </div>
        );
    }

    // Preparar datos de gráfico
    const chartData = stats.charts ? stats.charts.map(point => {
        const date = new Date(point.x * 1000);
        return {
            time: date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(),
            hashrateNumber: point.y / 1000000000000000, // PH/s
            hashrate: point.y
        };
    }) : [];

    return (
        <div className="min-h-screen bg-[#0b0e14] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Decorators */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 blur-[150px] rounded-full mix-blend-screen opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full mix-blend-screen opacity-50"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
                            Estado Global de la Red
                        </h1>
                        <p className="text-gray-400 mt-2">Monitorea el rendimiento en vivo de todos nuestros servidores de minería.</p>
                    </div>
                    <div className="bg-[#131824] border border-[#1e2330] rounded-xl p-4 shadow-lg flex gap-8">
                        <div className="text-center">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Mineros Online</p>
                            <p className="text-2xl font-mono text-white font-bold">{stats.totalMiners}</p>
                        </div>
                        <div className="w-px bg-[#1e2330]"></div>
                        <div className="text-center">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Workers Activos</p>
                            <p className="text-2xl font-mono text-orange-400 font-bold">{stats.totalWorkers}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Altura de Bloque */}
                    <div className="bg-[#131824]/60 backdrop-blur-xl p-6 rounded-3xl border border-[#1e2330] hover:border-gray-500/30 transition-colors shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center border border-gray-700">
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Height</span>
                        </div>
                        <p className="text-3xl font-bold text-white font-mono">{formatNumber(stats.node?.height)}</p>
                    </div>

                    {/* Hashrate de la Red */}
                    <div className="bg-[#131824]/60 backdrop-blur-xl p-6 rounded-3xl border border-[#1e2330] hover:border-orange-500/30 transition-colors shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-500/20 transition-colors -mr-8 -mt-8"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Pool Hashrate</span>
                        </div>
                        <p className="text-2xl font-bold text-white font-mono relative z-10">{formatHashrate(stats.hashrate)}</p>
                    </div>

                    {/* Dificultad */}
                    <div className="bg-[#131824]/60 backdrop-blur-xl p-6 rounded-3xl border border-[#1e2330] hover:border-blue-500/30 transition-colors shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/20 transition-colors -mr-8 -mt-8"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                            </div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Network Diff</span>
                        </div>
                        <p className="text-xl font-bold text-white font-mono relative z-10">{formatHashrate(stats.node?.difficulty).replace('/s', '')}</p>
                    </div>

                    {/* Bloques Totales */}
                    <div className="bg-[#131824]/60 backdrop-blur-xl p-6 rounded-3xl border border-[#1e2330] hover:border-purple-500/30 transition-colors shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-colors -mr-8 -mt-8"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Total Blocks</span>
                        </div>
                        <p className="text-3xl font-bold text-white font-mono relative z-10">{formatNumber(stats.totalBlocks)}</p>
                    </div>
                </div>

                {/* Gráfico de Hashrate */}
                <div className="bg-[#131824]/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-[#1e2330] shadow-2xl mb-8">
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Pool & Network Charts</h3>
                            <p className="text-gray-500 text-sm">Flujo de Hashrate de la piscina en las últimas 24 horas.</p>
                        </div>
                    </div>

                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorHash" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a3040" vertical={false} />
                                <XAxis dataKey="time" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => value + ' P'} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e2330', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#f97316' }}
                                    labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                                    formatter={(value, name, props) => [formatHashrate(props.payload.hashrate), 'Hashrate']}
                                />
                                <Area type="monotone" dataKey="hashrateNumber" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorHash)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PoolStatsPage;
