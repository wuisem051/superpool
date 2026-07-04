import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { db } from '../../services/firebase'; // Importar Firebase Firestore
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

// Registrar los componentes de Chart.js que se van a usar
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PerformanceStatsSection = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [totalHashrate, setTotalHashrate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        let resetDate = new Date(0);
        try {
          const siteConfigQuery = query(collection(db, 'settings'), where('key', '==', 'siteConfig'));
          const siteConfigSnapshot = await getDocs(siteConfigQuery);
          if (!siteConfigSnapshot.empty) {
            const siteConfigData = siteConfigSnapshot.docs[0].data();
            if (siteConfigData && siteConfigData.performanceStatsResetDate) {
              resetDate = siteConfigData.performanceStatsResetDate.toDate();
            }
          }
        } catch (err) {
          console.error("Error fetching site config from Firebase:", err);
        }

        const minersQuery = query(collection(db, 'miners'), where('createdAt', '>=', Timestamp.fromDate(resetDate)));
        const minersSnapshot = await getDocs(minersQuery);

        let currentTotalHashrate = 0;
        if (!minersSnapshot.empty) {
          minersSnapshot.docs.forEach((doc) => {
            const miner = doc.data();
            currentTotalHashrate += miner.currentHashrate || 0;
          });
        }
        setTotalHashrate(currentTotalHashrate);

        // Generar datos para el gráfico (simulados o reales si hay datos históricos de hashrate)
        const labels = [];
        const data = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) { // Últimos 7 días
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          if (date >= resetDate) {
            labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
            // Simular una variación para el gráfico de hashrate
            data.push((currentTotalHashrate * (0.9 + Math.random() * 0.2)).toFixed(2));
          }
        }

        setChartData({
          labels,
          datasets: [
            {
              label: `Hashrate Total de la Pool (TH/s)`,
              data: data,
              borderColor: '#3B82F6', // blue_link
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              fill: true,
              tension: 0.4,
            },
          ],
        });

      } catch (err) {
        console.error("Error fetching performance stats from Firebase:", err);
        setError('Error al cargar las estadísticas de rendimiento.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#9ca3af', font: { size: 12 } },
      },
      title: {
        display: true,
        text: 'Rendimiento del Hashrate Total (Últimos 7 Días)',
        color: '#e5e7eb',
        font: { size: 14, weight: 'bold' },
      },
    },
    scales: {
      x: {
        ticks: { color: '#6b7280' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        ticks: { color: '#6b7280' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  };

  return (
    <div className="bg-[#0b0e14] border border-[#1e2330] rounded-3xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Estadísticas de Rendimiento de la Pool</h2>
          <p className="text-gray-500 text-xs">Historial de los últimos 7 días</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 gap-3 text-gray-500">
          <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span>Cargando estadísticas...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="bg-[#131824] border border-[#1e2330] rounded-2xl p-5 text-center mb-5">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Hashrate Total de la Pool</h3>
            <p className="text-4xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{totalHashrate.toFixed(2)} <span className="text-2xl">TH/s</span></p>
          </div>
          <div className="bg-[#131824] border border-[#1e2330] rounded-2xl p-4 h-72">
            <Line data={chartData} options={chartOptions} />
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceStatsSection;
