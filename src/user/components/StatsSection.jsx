import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const REFRESH_INTERVAL = 30000;

const StatsSection = () => {
    const { t } = useLanguage();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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

    const fetchStats = useCallback(async () => {
        try {
            const url = 'https://btc.solopool.org/api/stats';
            const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);

            let data;
            try {
                const res = await fetch(proxyUrl, { cache: 'no-store' });
                if (!res.ok) throw new Error();
                data = await res.json();
            } catch {
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) throw new Error();
                data = await res.json();
            }
            setStats(data);
            setError(false);
        } catch (e) {
            console.error('Error fetching global stats in StatsSection:', e);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const poolHashrate = stats?.hashrate ?? 0;
    const networkHashrate = stats?.node?.hashrate ?? 0;
    const networkDifficulty = stats?.node?.difficulty ?? 0;
    const height = stats?.node?.height ?? 0;
    const totalMiners = stats?.totalMiners ?? 0;
    const totalWorkers = stats?.totalWorkers ?? 0;

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-[#131824]/60 border border-[#1e2330] rounded-2xl p-5 animate-pulse h-24"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="my-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    {t('Estado Global de la Red', 'Global Network Status')}
                </h3>
                <span className="text-xs text-gray-500 font-mono">
                    {t('Sincronizado en tiempo real', 'Real-time synced')}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Pool Hashrate */}
                <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4 shadow-lg hover:border-orange-500/30 transition-all">
                    <div>
                        <p className="text-xl sm:text-2xl font-bold font-mono text-white">{formatHashrate(poolHashrate)}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                            {t('POOL HASHRATE', 'POOL HASHRATE')}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                </div>

                {/* Miners Online */}
                <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4 shadow-lg hover:border-green-500/30 transition-all">
                    <div>
                        <p className="text-xl sm:text-2xl font-bold font-mono text-green-400">{totalMiners}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                            {t('MINEROS EN LÍNEA', 'MINERS ONLINE')}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                </div>

                {/* Network Hashrate */}
                <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4 shadow-lg hover:border-blue-500/30 transition-all">
                    <div>
                        <p className="text-xl sm:text-2xl font-bold font-mono text-white">{formatHashrate(networkHashrate)}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                            {t('HASHRATE DE LA RED', 'NETWORK HASHRATE')}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                    </div>
                </div>

                {/* Network Difficulty */}
                <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4 shadow-lg hover:border-purple-500/30 transition-all">
                    <div>
                        <p className="text-xl sm:text-2xl font-bold font-mono text-white">{formatHashrate(networkDifficulty).replace('/s', '')}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                            {t('DIFICULTAD DE LA RED', 'NETWORK DIFFICULTY')}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                    </div>
                </div>

                {/* Height */}
                <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4 shadow-lg hover:border-gray-500/30 transition-all">
                    <div>
                        <p className="text-xl sm:text-2xl font-bold font-mono text-white">{formatNumber(height)}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                            {t('ALTURA DEL BLOQUE', 'BLOCK HEIGHT')}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gray-500/10 border border-gray-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                    </div>
                </div>

                {/* Active Workers */}
                <div className="bg-[#131824]/90 backdrop-blur p-5 rounded-2xl border border-[#1e2330] flex items-center justify-between gap-4 shadow-lg hover:border-pink-500/30 transition-all">
                    <div>
                        <p className="text-xl sm:text-2xl font-bold font-mono text-white">{totalWorkers}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                            {t('WORKERS ACTIVOS', 'ACTIVE WORKERS')}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsSection;

