import React, { useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, getDocFromCache, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

/* ── Obtener IP pública del usuario ── */
const getPublicIp = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    return data.ip || 'Desconocida';
  } catch {
    return 'Desconocida';
  }
};

/* ── Registrar sesión en Firestore ── */
const recordSession = async (uid, ip) => {
  try {
    const sessionRef = doc(db, 'userSessions', uid);
    const now = new Date().toISOString();
    await setDoc(sessionRef, {
      isOnline: true,
      lastLogin: now,
      lastIp: ip,
      lastUpdated: now,
      sessions: arrayUnion({
        loginAt: now,
        logoutAt: null,
        ip,
        deviceInfo: navigator.userAgent.slice(0, 120),
      }),
    }, { merge: true });
  } catch (e) {
    console.warn('recordSession error:', e);
  }
};

/* ── Marcar sesión cerrada ── */
const markOffline = async (uid) => {
  try {
    const sessionRef = doc(db, 'userSessions', uid);
    await updateDoc(sessionRef, {
      isOnline: false,
      lastLogout: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('markOffline error:', e);
  }
};

const AuthContext = React.createContext();

// Función de ayuda para evitar bloqueos perpetuos si el cliente está offline o tiene mala conexión
const withTimeout = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout: La petición de datos tomó demasiado tiempo."));
    }, ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
};

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function signup(email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const ip = await getPublicIp();
    // Crear documento de usuario en Firestore después del registro con email/password
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: userCredential.user.email,
      role: 'user',
      welcomeBonusClaimed: false,
      createdAt: new Date().toISOString(),
      registrationIp: ip,
    });
    await recordSession(userCredential.user.uid, ip);
    return userCredential;
  }

  async function signupWithPayeer(email, password, payeerAccount) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const ip = await getPublicIp();
    // Crear documento de usuario en Firestore después del registro con Payeer
    await setDoc(doc(db, "users", userCredential.user.uid), {
      payeerAccount: payeerAccount,
      email: email,
      role: 'user',
      welcomeBonusClaimed: false,
      createdAt: new Date().toISOString(),
      registrationIp: ip,
    });
    await recordSession(userCredential.user.uid, ip);
    return userCredential;
  }

  async function login(identifier, password) {
    let emailToSignIn = identifier;

    // Check if the identifier is a Payeer account number
    const isPayeerAccount = /^P\d{8}$/.test(identifier);
    if (isPayeerAccount) {
      emailToSignIn = `${identifier}@payeer.com`;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailToSignIn, password);
      const user = userCredential.user;

      // Verify if the user exists in Firestore (important for consistency with onAuthStateChanged)
      const userDocRef = doc(db, "users", user.uid);
      let userDoc;
      try {
        userDoc = await getDocFromCache(userDocRef);
      } catch (cacheError) {
        userDoc = await withTimeout(getDoc(userDocRef), 3500);
      }

      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error('No se encontró el perfil de usuario. Por favor, regístrate.');
      }

      // Registrar sesión con IP
      const ip = await getPublicIp();
      await recordSession(user.uid, ip);

      return userCredential;
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  }

  async function logout() {
    if (auth.currentUser) {
      await markOffline(auth.currentUser.uid);
    }
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      if (user) {
        // Obtener el rol del usuario desde Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          let userDoc;
          try {
            // Intentar primero obtener desde la caché local (instantáneo)
            userDoc = await getDocFromCache(userDocRef);
            console.log("Rol de usuario obtenido desde la caché local para UID:", user.uid);
          } catch (cacheError) {
            // Si no está en caché, traer del servidor con timeout de 3.5s
            console.warn("Rol no encontrado en caché, solicitando al servidor de Firestore...");
            userDoc = await withTimeout(getDoc(userDocRef), 3500);
          }

          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User data from Firestore for UID:", user.uid, ":", userData);
            if (user.email === 'wuisem051@gmail.com' && userData.role !== 'admin') {
              console.log("Promocionando usuario a admin automáticamente en Firestore...");
              await updateDoc(userDocRef, { role: 'admin' });
              setIsAdmin(true);
              console.log("Is Admin: true (promocionado)");
            } else {
              setIsAdmin(userData.role === 'admin');
              console.log("Is Admin:", userData.role === 'admin');
            }
          } else {
            console.log("User document does not exist for UID:", user.uid);
            if (user.email === 'wuisem051@gmail.com') {
              console.log("Creando documento de administrador automáticamente...");
              await setDoc(userDocRef, {
                email: user.email,
                role: 'admin'
              });
              setIsAdmin(true);
              console.log("Is Admin: true (creado nuevo admin)");
            } else {
              setIsAdmin(false);
              console.log("Is Admin: false (user document not found)");
            }
          }
        } catch (error) {
          console.error("Error fetching user role from Firestore:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        console.log("User is not authenticated. Is Admin: false");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginAdmin = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Obtener el rol del usuario desde Firestore
      const userDocRef = doc(db, "users", user.uid);
      let userDoc;
      try {
        userDoc = await getDocFromCache(userDocRef);
        console.log("Admin login - Rol obtenido desde caché local");
      } catch (cacheError) {
        console.warn("Admin login - Rol no disponible en caché, consultando servidor...");
        userDoc = await withTimeout(getDoc(userDocRef), 3500);
      }

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("Admin login - User data from Firestore:", userData);
        if (userData.role === 'admin') {
          return { user };
        } else {
          await signOut(auth); // Cerrar sesión si no es administrador
          throw new Error('Acceso denegado: No eres administrador.');
        }
      } else {
        console.log("Admin login - User document does not exist for UID:", user.uid);
        await signOut(auth); // Cerrar sesión si no se encuentra el documento
        throw new Error('Acceso denegado: No se encontró el perfil de usuario.');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false); // Asegurarse de que loading se establezca en false después de un intento de inicio de sesión
    }
  };

  const value = {
    currentUser,
    isAdmin,
    login,
    signup,
    signupWithPayeer, // Exportar la nueva función
    logout,
    loginAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="fixed inset-0 bg-[#090d16] z-50 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <svg className="animate-spin h-10 w-10 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-[#a0aec0] font-sans font-medium text-sm tracking-wide">Cargando MaxiOS Pool...</span>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}
