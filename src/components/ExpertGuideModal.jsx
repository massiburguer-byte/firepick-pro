import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp,
  Trash2,
  Zap,
  ShieldAlert,
  Activity
} from 'lucide-react';

const ExpertGuideModal = ({ theme, onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 p-8 shadow-3xl ${theme === 'mlb' ? 'bg-[#001E46]' : 'bg-[#111111]'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
           <div>
              <h3 className="text-2xl font-sport italic text-white uppercase tracking-tighter">Guía: ¿Cómo ganar dinero?</h3>
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Domina el mercado con la IA</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40"><Trash2 size={20} /></button>
        </div>

        <div className="space-y-8">
           {/* EXAMPLE 1: VALUE ON FAVORITE */}
           <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center gap-2 text-emerald-400 mb-4">
                 <TrendingUp size={16} />
                 <span className="text-xs font-black uppercase tracking-widest italic">Caso 1: Valor Detectado (Favorito)</span>
              </div>
              <p className="text-[11px] text-white/60 mb-4 uppercase font-black leading-relaxed">Baltimore (-112) vs Boston (+102)</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                    <p className="text-[8px] text-white/30 uppercase mb-1">Prob. Casa</p>
                    <p className="text-xl font-sport text-white italic">52.8%</p>
                 </div>
                 <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/20 text-center">
                    <p className="text-[8px] text-emerald-400 uppercase mb-1">Prob. Gurú AI</p>
                    <p className="text-xl font-sport text-emerald-400 italic">57.3%</p>
                 </div>
              </div>
              <p className="text-[10px] text-emerald-400/80 italic leading-relaxed">
                 <span className="font-bold text-white">ANÁLISIS:</span> El Gurú tiene un % mayor al de la casa. Estás comprando una jugada de 57% a precio de 52%. **¡VALOR REAL DETECTADO!** ✅
              </p>
           </div>

           {/* EXAMPLE 2: VALUE ON UNDERDOG */}
           <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/10 shadow-lg shadow-secondary/5">
              <div className="flex items-center gap-2 text-secondary mb-4">
                 <Zap size={16} />
                 <span className="text-xs font-black uppercase tracking-widest italic">Caso 2: Valor en el Underdog</span>
              </div>
              <p className="text-[11px] text-white/60 mb-4 uppercase font-black leading-relaxed">Dodgers (-200) vs Rockies (+170)</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                    <p className="text-[8px] text-white/30 uppercase mb-1">Prob. Casa</p>
                    <p className="text-xl font-sport text-white italic">37.0%</p>
                 </div>
                 <div className="bg-secondary/20 p-3 rounded-xl border border-secondary/20 text-center">
                    <p className="text-[8px] text-secondary uppercase mb-1">Prob. Gurú AI</p>
                    <p className="text-xl font-sport text-secondary italic">42.0%</p>
                 </div>
              </div>
              <p className="text-[10px] text-secondary/80 italic leading-relaxed">
                 <span className="font-bold text-white">ANÁLISIS:</span> Aunque Rockies no es favorito, la cuota paga demasiado bien (+170) para su probabilidad real (42%). Es una inversión de alto retorno. ✅
              </p>
           </div>

           {/* EXAMPLE 3: THE TRAP */}
           <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 shadow-lg shadow-red-500/5">
              <div className="flex items-center gap-2 text-red-400 mb-4">
                 <ShieldAlert size={16} />
                 <span className="text-xs font-black uppercase tracking-widest italic">Caso 3: La Trampa (Evitar)</span>
              </div>
              <p className="text-[11px] text-white/60 mb-4 uppercase font-black leading-relaxed">Braves (-139) vs Mets (+120)</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                    <p className="text-[8px] text-white/30 uppercase mb-1">Prob. Casa</p>
                    <p className="text-xl font-sport text-white italic">58.2%</p>
                 </div>
                 <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/20 text-center">
                    <p className="text-[8px] text-red-400 uppercase mb-1">Prob. Gurú AI</p>
                    <p className="text-xl font-sport text-red-400 italic">48.3%</p>
                 </div>
              </div>
              <p className="text-[10px] text-red-400/80 italic leading-relaxed">
                 <span className="font-bold text-white">ANÁLISIS:</span> ¡CUIDADO! Estás pagando por una probabilidad de 58%, pero el equipo solo tiene 48% de ganar según la IA. **¡ESTO ES REGALARLE DINERO A LA CASA!** ❌
              </p>
           </div>
        </div>

        <div className="mt-8 p-6 rounded-3xl bg-black/40 border border-white/5">
           <h4 className="text-secondary font-sport italic text-sm uppercase mb-2">El Secreto de los Profesionales</h4>
           <p className="text-[9px] text-white/40 uppercase font-black leading-relaxed tracking-widest">
              No se trata de quién crees que va a ganar. Se trata de encontrar errores en el precio de la casa. Si el Gurú AI te da una probabilidad mayor a la de la casa, tienes un ticket premiado a largo plazo.
           </p>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-6 py-4 bg-secondary text-white font-sport italic uppercase tracking-widest rounded-2xl shadow-xl shadow-secondary/20"
        >
          ¡Listo para ganar!
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ExpertGuideModal;