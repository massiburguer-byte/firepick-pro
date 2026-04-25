import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Shield, ArrowRight, CheckCircle2, AlertCircle, Loader2, Lock, Cpu, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const EmergencyAdmin = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleElevate = async () => {
    if (!user) {
      setError('Debes estar logueado para elevar tu cuenta.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await setDoc(doc(db, 'Users', user.uid), {
        role: 'admin',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/admin';
      }, 2000);
    } catch (err) {
      console.error(err);
      setError('Error al elevar la cuenta. Verifica los permisos de Firestore.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white relative overflow-hidden">
      {/* ATMOSPHERIC BACKGROUND */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-white/5 to-primary/20 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000" />
          
          <div className="relative bg-[#111111]/80 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-12 shadow-3xl text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-primary/20 relative">
              <Shield className="text-primary" size={48} />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full flex items-center justify-center border-2 border-[#111111] animate-pulse">
                <Lock size={12} className="text-white" />
              </div>
            </div>

            <div className="mb-10">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <Cpu size={12} className="text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">System Override</span>
               </div>
               <h1 className="font-sport text-5xl mb-2 italic tracking-tighter uppercase leading-none">
                RECUPERACIÓN <br/><span className="text-primary">ADMIN</span>
               </h1>
               <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed px-4">
                Elevación inmediata de privilegios de seguridad.
               </p>
            </div>

            {user ? (
              <div className="space-y-6">
                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 text-left relative overflow-hidden group/card">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/card:opacity-10 transition-opacity">
                     <Fingerprint size={60} />
                  </div>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Authenticated Identity</p>
                  <p className="font-bold text-white truncate text-sm mb-3 tracking-tight">{user.email}</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${userData?.role === 'admin' ? 'bg-emerald-400 animate-pulse' : 'bg-primary'}`} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      CURRENT ROLE: <span className={userData?.role === 'admin' ? 'text-emerald-400' : 'text-primary'}>{userData?.role || 'user'}</span>
                    </p>
                  </div>
                </div>

                {success ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-6 py-4"
                  >
                    <div className="flex items-center gap-4 px-8 py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl w-full justify-center font-sport italic text-xl tracking-tight">
                      <CheckCircle2 size={24} />
                      <span>ACCESO CONCEDIDO</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Loader2 className="animate-spin text-white/20" size={16} />
                       <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">Redirigiendo a Consola Pro...</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    {error && (
                      <div className="flex items-center gap-3 p-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-left">
                        <AlertCircle size={20} className="shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={handleElevate}
                      disabled={loading}
                      className="group relative w-full h-20 overflow-hidden rounded-[1.5rem] transition-all active:scale-95"
                    >
                      <div className="absolute inset-0 bg-primary transition-all group-hover:scale-105" />
                      <div className="relative h-full flex items-center justify-center gap-4 text-white font-sport text-2xl italic tracking-tighter">
                        {loading ? (
                          <Loader2 className="animate-spin" size={32} />
                        ) : (
                          <>
                            OVERRIDE TO ADMIN
                            <ArrowRight size={24} className="transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-primary/5 p-10 rounded-[2rem] border border-primary/10">
                <p className="text-primary font-black uppercase tracking-widest text-[11px] mb-8 leading-relaxed">
                  Terminal bloqueada. <br/>Debes iniciar sesión con tu nueva cuenta primero.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full h-16 bg-white text-black rounded-2xl font-sport text-xl italic tracking-tight hover:bg-white/90 transition-all flex items-center justify-center gap-3"
                >
                  IR AL LOGIN
                  <ArrowRight size={20} />
                </button>
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-white/5">
              <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] leading-relaxed">
                ADVERTENCIA: Esta herramienta elude protocolos de seguridad estándar. <br/>Eliminar componente tras la recuperación.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmergencyAdmin;
