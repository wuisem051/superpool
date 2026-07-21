import React, { useContext, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';

const backupItems = [
  { key: 'miners', label: 'Datos de mineros', icon: '⛏️', desc: 'Configuración y estadísticas de mineros' },
  { key: 'settings', label: 'Configuraciones', icon: '⚙️', desc: 'Parámetros del pool y ajustes del sitio' },
  { key: 'users', label: 'Usuarios y pagos', icon: '👥', desc: 'Datos de usuarios, balances y retiros' },
  { key: 'content', label: 'Contenido del sitio', icon: '📝', desc: 'Noticias, textos y páginas informativas' },
];

const Backup = () => {
  const { darkMode } = useContext(ThemeContext);
  const [selected, setSelected] = useState({ miners: true, settings: true, users: true, content: true });
  const [restoreMode, setRestoreMode] = useState(false);

  const toggleItem = (key) => setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">🗄️ Respaldo de Datos</h2>
        <p className="text-xs text-gray-500 mt-1">Crea una copia de seguridad o restaura los datos del sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crear Respaldo */}
        <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl space-y-5`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3">⬇️ Crear Respaldo</h3>

          <p className="text-xs text-gray-400">Selecciona los módulos a incluir en la copia de seguridad:</p>

          <div className="space-y-2">
            {backupItems.map(item => (
              <label key={item.key}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                  selected[item.key]
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                }`}>
                <input type="checkbox" checked={selected[item.key]} onChange={() => toggleItem(item.key)}
                  className="form-checkbox h-4 w-4 text-yellow-500 rounded bg-[#131824] border-[#1e2330]" />
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${selected[item.key] ? 'text-yellow-300' : 'text-gray-300'}`}>{item.label}</p>
                  <p className="text-[11px] text-gray-500">{item.desc}</p>
                </div>
                {selected[item.key] && (
                  <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">✓</span>
                )}
              </label>
            ))}
          </div>

          <button
            disabled={selectedCount === 0}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl shadow-lg transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed">
            ⬇️ Crear y Descargar Respaldo ({selectedCount} módulo{selectedCount !== 1 ? 's' : ''})
          </button>
        </div>

        {/* Restaurar Respaldo */}
        <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl space-y-5`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3">⬆️ Restaurar Respaldo</h3>

          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
            <p className="text-xs font-bold text-amber-400">⚠️ Advertencia</p>
            <p className="text-[11px] text-gray-500 mt-1">Restaurar un respaldo puede sobrescribir datos actuales. Asegúrate de tener una copia reciente antes de continuar.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Archivo de Respaldo</label>
            <div className="w-full bg-[#131824] border-2 border-dashed border-[#1e2330] hover:border-yellow-500/30 rounded-xl px-4 py-8 text-center transition-colors cursor-pointer">
              <input type="file" className="hidden" id="backupFile" accept=".json,.zip" />
              <label htmlFor="backupFile" className="cursor-pointer">
                <div className="text-3xl mb-2">📂</div>
                <p className="text-xs text-gray-400">Arrastra un archivo aquí o <span className="text-yellow-500 hover:underline">haz clic para seleccionar</span></p>
                <p className="text-[10px] text-gray-600 mt-1">Formatos soportados: .json, .zip</p>
              </label>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all">
            <input type="checkbox" className="form-checkbox h-4 w-4 text-yellow-500 rounded bg-[#131824] border-[#1e2330]" />
            <div>
              <p className="text-sm font-semibold text-gray-300">Combinar con datos existentes</p>
              <p className="text-[11px] text-gray-500">Si no está marcado, se reemplazarán los datos actuales</p>
            </div>
          </label>

          <button className="w-full py-3 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 hover:text-red-300 font-bold rounded-xl text-sm transition-all">
            ⬆️ Restaurar Respaldo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Backup;
