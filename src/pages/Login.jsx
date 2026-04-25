import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Zap, ArrowRight, UserPlus, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { user, login, register, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (isRegistering) {
        await register(email, password);
        toast.success('¡Bienvenido a la división Elite!');
      } else {
        await login(email, password);
        toast.success('Acceso concedido. Bienvenido.');
      }
    } catch (err) {
      if (isRegistering) {
        setError('Error en registro. Verifica los datos.');
        toast.error('Error de registro');
      } else {
        setError('Acceso denegado. Credenciales inválidas.');
        toast.error('Acceso denegado');
      }
      console.error(err);
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Ingresa tu correo para la recuperación.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await resetPassword(email);
      toast.success('Enlace de recuperación enviado.');
      setMessage('Revisa tu bandeja de entrada.');
    } catch (err) {
      setError('No se pudo enviar el enlace.');
      toast.error('Error de recuperación');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* ATMOSPHERIC BACKGROUND ELEMENTS */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6"
          >
            <ShieldCheck size={14} className="text-secondary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Secure Terminal Access</span>
          </motion.div>
          
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-sport text-5xl md:text-6xl text-white tracking-tighter italic uppercase leading-none mb-2"
          >
            Elite <span className="text-secondary">PRO</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/20 font-black uppercase tracking-[0.4em] text-[10px]"
          >
            Powered by GURÚ AI Algorithm
          </motion.p>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-secondary/20 via-primary/20 to-secondary/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000" />
          
          <div className="relative bg-[#111111]/80 backdrop-blur-2xl border border-white/5 p-10 sm:p-12 rounded-[2.5rem] shadow-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={isRegistering ? 'reg' : 'log'}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="mb-8">
                  <h2 className="text-xl font-sport text-white italic uppercase tracking-tight mb-1">
                    {isRegistering ? 'Unirse a la Elite' : 'Acceso Oficial'}
                  </h2>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                    {isRegistering ? 'Crea tu cuenta profesional' : 'Introduce tus credenciales autorizadas'}
                  </p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 p-4 bg-secondary/10 border border-secondary/20 rounded-2xl text-secondary text-[11px] font-bold mb-6 overflow-hidden"
                    >
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </motion.div>
                  )}
                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-[11px] font-bold mb-6 overflow-hidden"
                    >
                      <CheckCircle2 size={16} />
                      <span>{message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <label className="text-[9px] font-black tracking-[0.2em] text-white/20 uppercase flex items-center gap-2">
                        <Mail size={10} /> Correo Electrónico
                      </label>
                    </div>
                    <div className="relative group/input">
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-14 px-6 bg-black/40 border border-white/5 rounded-2xl text-white text-sm focus:border-secondary transition-all outline-none"
                        placeholder="admin@elitesport.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <label className="text-[9px] font-black tracking-[0.2em] text-white/20 uppercase flex items-center gap-2">
                        <Lock size={10} /> Clave de Seguridad
                      </label>
                      {!isRegistering && (
                        <button 
                          type="button"
                          onClick={handleResetPassword}
                          className="text-[9px] font-black text-secondary/40 hover:text-secondary uppercase tracking-widest transition-colors"
                        >
                          ¿Olvidaste?
                        </button>
                      )}
                    </div>
                    <div className="relative group/input">
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-14 px-6 bg-black/40 border border-white/5 rounded-2xl text-white text-sm focus:border-secondary transition-all outline-none"
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="group relative w-full h-14 overflow-hidden rounded-2xl transition-all"
                    >
                      <div className="absolute inset-0 bg-white transition-all group-hover:scale-105" />
                      <div className="relative h-full flex items-center justify-center gap-3 text-black font-sport italic text-sm tracking-widest">
                        {loading ? (
                           <Loader2 className="animate-spin" size={20} />
                        ) : (
                           <>
                             <span>{isRegistering ? 'CREAR CUENTA' : 'AUTORIZAR ACCESO'}</span>
                             <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                           </>
                        )}
                      </div>
                    </button>
                    
                    <div className="mt-8 flex flex-col gap-4 text-center">
                      <button 
                        type="button"
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-[10px] font-black text-white/20 hover:text-white transition-colors uppercase tracking-[0.3em]"
                      >
                        {isRegistering ? (
                          <>¿Ya tienes cuenta? <span className="text-secondary italic">Loguear</span></>
                        ) : (
                          <>¿No tienes acceso? <span className="text-secondary italic">Registrarse</span></>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="flex items-center justify-center gap-6 opacity-20 mb-6">
             <div className="h-px w-12 bg-white" />
             <div className="flex gap-4">
                <Fingerprint size={16} className="text-white" />
                <Zap size={16} className="text-white" />
             </div>
             <div className="h-px w-12 bg-white" />
          </div>
          <p className="text-white/10 text-[9px] font-black uppercase tracking-[0.5em]">
            Consola Oficial FantasySport <br/>
            <span className="text-white/20">Protocolo de Cifrado Obsidian v5.0</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
