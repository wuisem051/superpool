import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, getDocs, where, Timestamp } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import StatsSection from '../../user/components/StatsSection';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const AdminDashboard = () => {
  const [totalHashrate, setTotalHashrate] = useState(0);
  const [activeMiners, setActiveMiners] = useState(0);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const minersSnap = await getDocs(collection(db, 'miners'));
        let hashSum = 0;
        let minerCount = 0;
        const today = new Date();
        const labels = [];
        const dailyHash = {};

        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          labels.push(label);
          dailyHash[label] = 0;
        }

        minersSnap.forEach(doc => {
          const m = doc.data();
          const h = m.currentHashrate || 0;
          hashSum += h;
          minerCount++;

          // Spread miner hashrate across last 7 days (simulated variation per day)
          labels.forEach((label, idx) => {
            const variation = 0.88 + Math.random() * 0.24;
            dailyHash[label] += h * variation;
          });
        });

        setTotalHashrate(hashSum);
        setActiveMiners(minerCount);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Total Pool Hashrate (TH/s)',
              data: labels.map(l => +dailyHash[l].toFixed(2)),
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59,130,246,0.15)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#60A5FA',
              pointRadius: 3,
            }
          ]
        });
      } catch (e) {
        console.error('AdminDashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#9ca3af', font: { size: 12 } } },
      title: {
        display: true,
        text: 'Total Hashrate Performance (Last 7 Days)',
        color: '#e5e7eb',
        font: { size: 13, weight: 'bold' },
      },
    },
    scales: {
      x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Real-time pool & network overview</p>
        </div>
        <span className="flex items-center gap-2 text-xs text-green-400 font-semibold bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          Live
        </span>
      </div>

      {/* Pool Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Pool Hashrate */}
        <div className="relative overflow-hidden bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl hover:border-blue-500/30 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">TOTAL POOL HASHRATE</p>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-40 bg-[#1e2330] rounded-lg animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              {totalHashrate.toFixed(2)} <span className="text-xl">TH/s</span>
            </p>
          )}
        </div>

        {/* Miners in Network */}
        <div className="relative overflow-hidden bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl hover:border-green-500/30 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-green-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">MINERS IN NETWORK</p>
            <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-20 bg-[#1e2330] rounded-lg animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              {activeMiners}
            </p>
          )}
        </div>
      </div>

      {/* Hashrate Chart */}
      <div className="bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl">
        <div className="h-72">
          {!loading && chartData.labels.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span className="text-sm">Loading chart...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Network Status */}
      <StatsSection />
    </div>
  );
};

export default AdminDashboard;
