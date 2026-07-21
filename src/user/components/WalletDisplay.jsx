import React, { useState, useEffect, useContext } from 'react';
import { doc, onSnapshot, getFirestore, setDoc } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext'; // Importar ThemeContext
import { useError } from '../../context/ErrorContext'; // Importar useError para mostrar mensajes

const WalletDisplay = ({ currentUser }) => {
  const { theme, darkMode } = useContext(ThemeContext);
  const { showSuccess } = useError(); // Usar el contexto de errores
  const [userPortfolio, setUserPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    if (currentUser?.uid) {
      setLoading(true);
      const userDocRef = doc(db, `users/${currentUser.uid}`);
      const unsubscribe = onSnapshot(userDocRef, async (docSnap) => { // Ahora lee el documento principal del usuario
        if (docSnap.exists()) {
          const userData = docSnap.data();
          // Mapear los balances del documento de usuario a la estructura de portfolio
          const mappedPortfolio = {
            fiatBalanceUSD: userData.balanceUSD || 0, // Saldo Fiat USD
            fiatBalanceVES: userData.balanceVES || 0, // Saldo Fiat VES
            virtualBalanceUSD: userData.virtualBalanceUSD || 0, // Nuevo Saldo Virtual USD
            holdings: {
              BTC: userData.balanceBTC || 0,
              LTC: userData.balanceLTC || 0,
              DOGE: userData.balanceDOGE || 0,
              USDT: userData.balanceUSDT || 0, // Incluir USDT
            },
            updatedAt: new Date(),
          };
          setUserPortfolio(mappedPortfolio);
        } else {
          console.log("No se encontró el documento del usuario. Inicializando balances por defecto.");
          const defaultBalances = {
            balanceUSD: 0,
            balanceVES: 0, // Inicializar balanceVES
            virtualBalanceUSD: 0, // Inicializar saldo virtual
            balanceBTC: 0,
            balanceLTC: 0,
            balanceDOGE: 0,
            balanceUSDT: 0, // Incluir balanceUSDT en la inicialización
            role: 'user',
            email: currentUser.email,
            paymentAddresses: {},
            createdAt: new Date(),
          };
          try {
            await setDoc(userDocRef, defaultBalances, { merge: true });
            const mappedPortfolio = {
              fiatBalanceUSD: defaultBalances.balanceUSD,
              fiatBalanceVES: defaultBalances.balanceVES, // Mapear saldo VES
              virtualBalanceUSD: defaultBalances.virtualBalanceUSD, // Mapear saldo virtual
              holdings: {
                BTC: defaultBalances.balanceBTC,
                LTC: defaultBalances.balanceLTC,
                DOGE: defaultBalances.balanceDOGE,
                USDT: defaultBalances.balanceUSDT, // Incluir USDT
              },
              updatedAt: new Date(),
            };
            setUserPortfolio(mappedPortfolio);
            console.log("Balances por defecto creados exitosamente en el documento del usuario.");
          } catch (setDocError) {
            console.error("Error al inicializar balances por defecto:", setDocError);
            setError("Error al inicializar el saldo de la billetera.");
          }
        }
        setLoading(false);
      }, (err) => {
        console.error("Error al obtener balances de usuario en tiempo real:", err);
        setError("Error al cargar el saldo de la billetera.");
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setUserPortfolio(null);
      setLoading(false);
    }
  }, [currentUser, db]);

  const [usdToUsdtAmount, setUsdToUsdtAmount] = useState('');
  const [exchangeLoading, setExchangeLoading] = useState(false);

  const handleExchange = async () => {
    setError(null);
    if (!currentUser?.uid) {
      setError('Debes iniciar sesión para realizar intercambios.');
      return;
    }

    const amountToExchange = parseFloat(usdToUsdtAmount);
    if (isNaN(amountToExchange) || amountToExchange <= 0) {
      setError('Por favor, introduce una cantidad válida para intercambiar.');
      return;
    }

    if (userPortfolio.fiatBalanceUSD < amountToExchange) {
      setError('Fondos insuficientes en USD para realizar el intercambio.');
      return;
    }

    setExchangeLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const newFiatBalanceUSD = userPortfolio.fiatBalanceUSD - amountToExchange;
      const newBalanceUSDT = userPortfolio.holdings.USDT + amountToExchange; // Asumiendo 1:1

      await setDoc(userDocRef, {
        balanceUSD: newFiatBalanceUSD,
        balanceUSDT: newBalanceUSDT,
      }, { merge: true });

      setUsdToUsdtAmount('');
      showSuccess('Intercambio de USD a USDT realizado con éxito!');
    } catch (err) {
      console.error("Error al realizar el intercambio:", err);
      setError(`Fallo al realizar el intercambio: ${err.message}`);
    } finally {
      setExchangeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-lg shadow-xl max-w-4xl mx-auto my-8 ${theme.backgroundAlt} ${theme.text}`}>
        <p className="text-center text-gray-400">Cargando tu billetera...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-lg shadow-xl max-w-4xl mx-auto my-8 ${theme.backgroundAlt} ${theme.text}`}>
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }

  // Si userPortfolio es null aquí, significa que no hay currentUser o hubo un error en la inicialización
  if (!userPortfolio) {
    return (
      <div className={`p-6 rounded-lg shadow-xl max-w-4xl mx-auto my-8 ${theme.backgroundAlt} ${theme.text}`}>
        <p className="text-center text-gray-400">No se pudo cargar la información de tu billetera. Por favor, intenta de nuevo o contacta a soporte.</p>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg shadow-xl max-w-4xl mx-auto my-8 ${theme.backgroundAlt} ${theme.text}`}>
      <h2 className="text-3xl font-bold text-center mb-6">Mi Billetera</h2>

      {/* Sección de Saldos de Criptomonedas */}
      <div className="p-4 rounded-md border border-gray-300 dark:border-gray-600">
        <h3 className="text-2xl font-semibold mb-4 text-center">Saldos de Criptomonedas</h3>
        {userPortfolio.holdings && Object.keys(userPortfolio.holdings).length > 0 ? (
          <div className="overflow-x-auto">
            <table className={`min-w-full rounded-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <thead className={`${darkMode ? 'bg-gray-600' : 'bg-gray-200'} ${theme.text}`}>
                <tr>
                  <th className="py-3 px-4 text-left">Moneda</th>
                  <th className="py-3 px-4 text-left">Cantidad</th>
                </tr>
              </thead>
              <tbody className={`${theme.text}`}>
                {Object.entries(userPortfolio.holdings).map(([coin, qty]) => (
                  <tr key={coin} className={`${darkMode ? 'border-gray-600' : 'border-gray-300'} border-t`}>
                    <td className="py-3 px-4">{coin.toUpperCase()}</td>
                    <td className="py-3 px-4">{qty.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400">No tienes criptomonedas en tu billetera.</p>
        )}
      </div>
    </div>
  );
};

export default WalletDisplay;
