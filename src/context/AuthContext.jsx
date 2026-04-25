import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { AlertCircle, RefreshCw } from 'lucide-react';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

const LoadingScreen = ({ error }) => (
  <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-6 text-center">
    <div className="relative mb-8">
      <div className="w-16 h-16 border-4 border-[#161B22] border-t-[#10B981] rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
      </div>
    </div>
    
    <h2 className="font-sport text-2xl tracking-tighter mb-2 italic text-white uppercase">
      <span className="text-[#10B981]">FANTASY</span><span className="text-[#2563EB] font-black">SPORT</span>
    </h2>

    {error ? (
      <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-2 text-[#FF3B3B] mb-4 justify-center">
          <AlertCircle size={14} />
          <p className="text-[10px] font-black uppercase tracking-widest">Error de Sincronización</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#161B22] border border-white/10 rounded-xl text-white font-sport text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all shadow-lg active:scale-95"
        >
          <RefreshCw size={14} /> Forzar Reinicio
        </button>
      </div>
    ) : (
      <p className="text-[10px] font-black text-[#8B949E] uppercase tracking-[0.25em] animate-pulse">Sincronizando Terminal Obsidian...</p>
    )}
  </div>
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeUserDoc = null;

    // Safety timeout: 12 seconds
    const timer = setTimeout(() => {
      if (isMounted && loading) {
        setInitError("Sincronización demorada. Verifica tu conexión.");
      }
    }, 12000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (authenticatedUser) {
        if (isMounted) setUser(authenticatedUser);

        // Real-time user doc listener
        unsubscribeUserDoc = onSnapshot(
          doc(db, 'Users', authenticatedUser.uid), 
          (docSnap) => {
            if (isMounted) {
              if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData({
                  ...data,
                  bankroll: Number(data.bankroll || 0),
                  picksUsed: Number(data.picksUsed || 0)
                });
              } else {
                setUserData(null);
              }
              setLoading(false);
              clearTimeout(timer);
            }
          },
          (error) => {
            console.error("Firestore Auth Error:", error);
            if (isMounted) {
              setInitError(error.message);
              setLoading(false);
              clearTimeout(timer);
            }
          }
        );
      } else {
        if (isMounted) {
          setUser(null);
          setUserData(null);
          setLoading(false);
          clearTimeout(timer);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to prevent infinite loop

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const register = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    await setDoc(doc(db, 'Users', newUser.uid), {
      email: newUser.email,
      displayName: newUser.email.split('@')[0],
      bankroll: 0,
      picksUsed: 0,
      role: 'player',
      createdAt: new Date()
    });
    
    return userCredential;
  };
  const logout = () => signOut(auth);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const value = {
    user,
    userData,
    loading,
    login,
    register,
    logout,
    resetPassword,
    isAdmin: userData?.role === 'admin' || user?.email === 'adminp@fantasysport.com'
  };

  return (
    <AuthContext.Provider value={value}>
      {(loading || initError) ? <LoadingScreen error={initError} /> : children}
    </AuthContext.Provider>
  );
};
