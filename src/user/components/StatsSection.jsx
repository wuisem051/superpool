import React from 'react';

const StatsSection = ({ totalHashrate, activeMiners, pricePerTHs }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
                { label: 'Hashrate Total Pool', value: `${totalHashrate.toFixed(2)} TH/s`, color: 'from-blue-400 to-cyan-300', bg: 'bg-blue-500/10', icon: '⚡' },
                { label: 'Mineros en la Red', value: activeMiners, color: 'from-green-400 to-emerald-300', bg: 'bg-green-500/10', icon: '🖥️' },
                { label: 'Precio por TH/s (USD)', value: `$${pricePerTHs.toFixed(2)}`, color: 'from-orange-400 to-yellow-300', bg: 'bg-orange-500/10', icon: '💲' },
            ].map(({ label, value, color, bg, icon }) => (
                <div key={label} className="relative overflow-hidden bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl hover:-translate-y-1 transition-transform duration-300">
                    <div className={`absolute top-0 right-0 w-28 h-28 ${bg} rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none`}></div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
                        <span className={`text-sm ${bg} w-7 h-7 flex items-center justify-center rounded-lg`}>{icon}</span>
                    </div>
                    <p className={`text-2xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r ${color}`}>{value}</p>
                </div>
            ))}
        </div>
    );
};

export default StatsSection;
