import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext'; // Importar useAuth

const UserPoolArbitrage = () => {
  const { currentUser } = useAuth(); // Obtener el usuario actual
  const [availablePools, setAvailablePools] = useState([]);
  const [userActivePools, setUserActivePools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para las estadísticas de arbitraje
  const [activePoolsCount, setActivePoolsCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [bestRate, setBestRate] = useState(0);
  const [poolToJoin, setPoolToJoin] = useState(null); // Nuevo estado para la pool a unirse
  const [poolToLeave, setPoolToLeave] = useState(null); // Nuevo estado para la pool a desconectarse

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      console.log("UserPoolArbitrage: No hay usuario autenticado.");
      return;
    }
    console.log("UserPoolArbitrage: currentUser", currentUser);
    console.log("UserPoolArbitrage: availablePools (antes de fetch)", availablePools);
    console.log("UserPoolArbitrage: userActivePools (antes de fetch)", userActivePools);

    const fetchPools = async () => {
      try {
        // Suscripción a pools de arbitraje disponibles
        const availablePoolsQuery = query(collection(db, 'arbitragePools'));
        const unsubscribeAvailable = onSnapshot(availablePoolsQuery, (snapshot) => {
          const poolsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            thsRate: parseFloat(doc.data().thsRate || 0), // Asegurar que thsRate sea un número
            commission: parseFloat(doc.data().commission || 0), // Asegurar que commission sea un número
            url: doc.data().url || '', // Asegurar que url esté presente
            port: doc.data().port || '', // Asegurar que port esté presente
            defaultWorkerName: doc.data().defaultWorkerName || '', // Asegurar que defaultWorkerName esté presente
          }));
          setAvailablePools(poolsList);
        }, (err) => {
          console.error("Error subscribing to available arbitrage pools:", err);
          setError('Error al cargar las pools de arbitraje disponibles.');
        });

        // Suscripción a las pools activas del usuario
        const userActivePoolsQuery = query(
          collection(db, 'userArbitragePools'),
          where('userId', '==', currentUser.uid)
        );
        const unsubscribeUserActive = onSnapshot(userActivePoolsQuery, (snapshot) => {
          const activeList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            earnings: parseFloat(doc.data().earnings || 0), // Asegurar que earnings sea un número
            thsRate: parseFloat(doc.data().thsRate || 0), // Asegurar que thsRate sea un número para las estadísticas
            url: doc.data().url || '', // Asegurar que url esté presente
            port: doc.data().port || '', // Asegurar que port esté presente
            defaultWorkerName: doc.data().defaultWorkerName || '', // Asegurar que defaultWorkerName esté presente
          }));
          setUserActivePools(activeList);
          setActivePoolsCount(activeList.length); // Actualizar el contador de pools activas
          console.log("UserPoolArbitrage: userActivePools (después de fetch)", JSON.stringify(activeList, null, 2)); // Log para depuración detallado

          // Calcular ganancias totales y mejor tasa (ejemplo simplificado)
          let totalEarn = 0;
          let highestRate = 0;
          activeList.forEach(pool => {
            totalEarn += pool.earnings;
            if (pool.thsRate > highestRate) {
              highestRate = pool.thsRate;
            }
          });
          setTotalEarnings(totalEarn);
          setBestRate(highestRate);

          setLoading(false);
        }, (err) => {
          console.error("Error subscribing to user's active arbitrage pools:", err);
          setError('Error al cargar tus pools de arbitraje activas.');
          setLoading(false);
        });

        return () => {
          unsubscribeAvailable();
          unsubscribeUserActive();
        };
      } catch (fetchError) {
        console.error("Error fetching arbitrage pools:", fetchError);
        setError('Error al cargar las pools de arbitraje.');
        setLoading(false);
      }
    };

    fetchPools();
  }, [currentUser]);

  const handleJoinPool = async (pool) => {
    if (!currentUser) {
      setError('Debes iniciar sesión para unirte a una pool.');
      return;
    }
    setPoolToJoin(pool); // Establecer la pool seleccionada para confirmación
    console.log("handleJoinPool: pool seleccionada para unirse", pool);
  };

  const confirmJoinPool = async () => {
    console.log("confirmJoinPool: poolToJoin (antes de guardar)", JSON.stringify(poolToJoin, null, 2)); // Log detallado
    if (!currentUser || !poolToJoin) {
      setError('No se ha seleccionado ninguna pool o no hay usuario autenticado.');
      return;
    }
    try {
      // Verificar si el usuario ya está unido a esta pool
      const existingPoolQuery = query(
        collection(db, 'userArbitragePools'),
        where('userId', '==', currentUser.uid),
        where('poolId', '==', poolToJoin.id)
      );
      const existingPoolSnapshot = await addDoc(collection(db, 'userArbitragePools'), {
        userId: currentUser.uid,
        poolId: poolToJoin.id,
        poolName: poolToJoin.name,
        cryptocurrency: poolToJoin.cryptocurrency,
        thsRate: poolToJoin.thsRate,
        commission: poolToJoin.commission,
        url: poolToJoin.url, // Guardar URL de la pool
        port: poolToJoin.port, // Guardar Puerto de la pool
        defaultWorkerName: poolToJoin.defaultWorkerName, // Guardar Nombre de Worker por Defecto
        status: 'Activa', // O 'Pendiente', dependiendo de la lógica de negocio
        earnings: 0, // Inicializar ganancias
        joinedAt: new Date(),
      });
      setError('');
      alert(`Te has unido a la pool ${poolToJoin.name} exitosamente!`);
      setPoolToJoin(null); // Cerrar el modal de confirmación
    } catch (err) {
      console.error("Error al unirse a la pool:", err);
      setError('Fallo al unirse a la pool de arbitraje.');
    }
  };

  const cancelJoinPool = () => {
    console.log("cancelJoinPool: Cancelando unión a pool.");
    setPoolToJoin(null); // Cerrar el modal de confirmación sin unirse
    setError(''); // Limpiar cualquier error previo
  };

  const handleLeavePool = async (pool) => {
    setPoolToLeave(pool); // Establecer la pool seleccionada para confirmación de desconexión
  };

  const confirmLeavePool = async () => {
    if (!currentUser || !poolToLeave) {
      setError('No se ha seleccionado ninguna pool para desconectar o no hay usuario autenticado.');
      return;
    }
    try {
      console.log("Intentando eliminar documento con ID:", poolToLeave.id); // Log para depuración
      await deleteDoc(doc(db, 'userArbitragePools', poolToLeave.id));
      setError('');
      alert(`Te has desconectado de la pool ${poolToLeave.poolName} exitosamente!`);
      setPoolToLeave(null); // Cerrar el modal de confirmación
    } catch (err) {
      console.error("Error detallado al desconectarse de la pool:", err); // Log para depuración
      setError('Fallo al desconectarse de la pool de arbitraje. Consulta la consola para más detalles.');
    }
  };

  const cancelLeavePool = () => {
    setPoolToLeave(null); // Cerrar el modal de confirmación sin desconectarse
    setError(''); // Limpiar cualquier error previo
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <svg className="animate-spin h-10 w-10 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-400 font-medium">Cargando panel de arbitraje...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-6 text-center max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-yellow-500/10 rounded-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Pools de Arbitraje</h1>
          <p className="text-gray-400 text-sm">Maximiza tus ganancias conectándote a las mejores pools</p>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pools Activas', value: activePoolsCount, icon: '⚡', color: 'from-blue-400 to-cyan-300', bg: 'bg-blue-500/10' },
          { label: 'Ganancias Totales', value: `$${totalEarnings.toFixed(2)}`, icon: '💰', color: 'from-green-400 to-emerald-300', bg: 'bg-green-500/10' },
          { label: 'Mejor Tasa', value: `${bestRate.toFixed(2)}%`, icon: '📈', color: 'from-purple-400 to-violet-300', bg: 'bg-purple-500/10' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="relative overflow-hidden bg-[#0b0e14] border border-[#1e2330] rounded-2xl p-6 shadow-xl hover:-translate-y-1 transition-transform duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 ${bg} rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none`}></div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm font-semibold">{label}</p>
              <span className={`text-sm ${bg} w-7 h-7 flex items-center justify-center rounded-lg`}>{icon}</span>
            </div>
            <p className={`text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pools de Arbitraje Disponibles */}
      <div className="bg-[#0b0e14] border border-[#1e2330] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-yellow-500/10 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Pools Disponibles</h2>
            <p className="text-gray-500 text-xs">Únete a una pool para comenzar a generar rendimientos</p>
          </div>
          <span className="ml-auto text-xs bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full font-bold">{availablePools.length} disponibles</span>
        </div>

        <div className="mt-5">
          {availablePools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-[#1e2330] rounded-2xl text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              <p className="font-semibold mb-1">Sin pools disponibles</p>
              <p className="text-sm">Vuelve más tarde para ver nuevas oportunidades.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePools.map((pool) => (
                <div key={pool.id} className="group bg-[#131824] border border-[#1e2330] hover:border-yellow-500/30 rounded-2xl p-5 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-xl font-bold text-yellow-400 flex-shrink-0">
                      {pool.cryptocurrency?.[0] || '?'}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base leading-tight">{pool.name}</h3>
                      <span className="text-xs text-yellow-400 font-mono bg-yellow-500/10 px-2 py-0.5 rounded-full">{pool.cryptocurrency}</span>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">💵 ${pool.thsRate.toFixed(3)} /TH/s</span>
                        <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">🏷️ {pool.commission.toFixed(1)}% comisión</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinPool(pool)}
                    className="ml-4 flex-shrink-0 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/20 transition-all text-sm"
                  >
                    Unirse
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mis Pools Activas */}
      <div className="bg-[#0b0e14] border border-[#1e2330] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-green-500/10 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mis Pools Activas</h2>
            <p className="text-gray-500 text-xs">Pools a las que actualmente estás conectado</p>
          </div>
          <span className="ml-auto text-xs bg-green-500/10 text-green-400 px-3 py-1 rounded-full font-bold">{userActivePools.length} activas</span>
        </div>

        {userActivePools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-[#1e2330] rounded-2xl text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="font-semibold mb-1">Ninguna pool activa</p>
            <p className="text-sm">Únete a una pool arriba para comenzar a generar ganancias.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userActivePools.map((pool) => (
              <div key={pool.id} className="bg-[#131824] border border-green-500/20 rounded-2xl p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-xl font-bold text-green-400 flex-shrink-0">
                    {pool.cryptocurrency?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-base truncate">{pool.poolName}</h3>
                    <span className="text-xs text-green-400 font-mono bg-green-500/10 px-2 py-0.5 rounded-full">{pool.cryptocurrency}</span>
                    <div className="mt-2 space-y-1">
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pool.status === 'Activa' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>● {pool.status}</span>
                        <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">💵 ${pool.earnings.toFixed(2)} ganados</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">📊 ${pool.thsRate.toFixed(3)} /TH/s</span>
                        <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">🏷️ {pool.commission.toFixed(1)}%</span>
                      </div>
                      {pool.url && pool.port && (
                        <p className="text-xs text-gray-500 font-mono truncate">🔗 {pool.url}:{pool.port} | {pool.defaultWorkerName}</p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleLeavePool(pool)}
                  className="flex-shrink-0 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold rounded-xl border border-red-500/20 transition-all text-sm"
                >
                  Desconectar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Confirmar Unión */}
      {poolToJoin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b0e14] border border-[#1e2330] rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Confirmar Unión</h3>
              <p className="text-gray-400 text-sm">¿Unirte a la siguiente pool de arbitraje?</p>
            </div>
            <div className="bg-[#131824] border border-[#1e2330] rounded-2xl p-5 mb-6 space-y-2">
              <p className="text-white font-bold text-lg">{poolToJoin.name} <span className="text-yellow-400 text-base font-mono">({poolToJoin.cryptocurrency})</span></p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs text-gray-300 bg-white/5 px-3 py-1 rounded-lg">💵 ${poolToJoin.thsRate.toFixed(3)} / TH/s</span>
                <span className="text-xs text-gray-300 bg-white/5 px-3 py-1 rounded-lg">🏷️ {poolToJoin.commission.toFixed(1)}% comisión</span>
              </div>
              {poolToJoin.url && poolToJoin.port && (
                <p className="text-xs text-gray-500 font-mono mt-1">🔗 {poolToJoin.url}:{poolToJoin.port} | Worker: {poolToJoin.defaultWorkerName}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={confirmJoinPool} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all">
                ✓ Confirmar
              </button>
              <button onClick={cancelJoinPool} className="flex-1 py-3 bg-[#131824] hover:bg-white/5 text-gray-400 hover:text-white font-bold rounded-xl border border-[#1e2330] transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Desconexión */}
      {poolToLeave && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b0e14] border border-[#1e2330] rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Confirmar Desconexión</h3>
              <p className="text-gray-400 text-sm">Esta acción marcará la pool como inactiva.</p>
            </div>
            <div className="bg-[#131824] border border-red-500/20 rounded-2xl p-5 mb-6">
              <p className="text-white font-bold text-lg">{poolToLeave.poolName} <span className="text-red-400 text-base font-mono">({poolToLeave.cryptocurrency})</span></p>
            </div>
            <div className="flex gap-3">
              <button onClick={confirmLeavePool} className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all">
                Desconectar
              </button>
              <button onClick={cancelLeavePool} className="flex-1 py-3 bg-[#131824] hover:bg-white/5 text-gray-400 hover:text-white font-bold rounded-xl border border-[#1e2330] transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserPoolArbitrage;
