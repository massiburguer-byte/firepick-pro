import React from 'react';
import { X, Star, TrendingUp, Brain, CheckCircle2, Award } from 'lucide-react';

const COLORS = {
  NAVY: '#002D72',
  RED: '#BA0C2F',
  BACKGROUND: '#001532',
  SURFACE: '#001E46',
  WHITE: '#FFFFFF',
  SECONDARY: '#BA0C2F'
};

const RecommendationModal = ({ isOpen, onClose, recommendation }) => {
  if (!isOpen || !recommendation) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#001532] rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header Decoration */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all z-10"
        >
          <X size={20} />
        </button>

        <div className="relative p-8 md:p-12">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="bg-secondary px-6 py-2 rounded-full shadow-lg shadow-secondary/20 flex items-center gap-2 border border-rose-500/30">
              <Star size={16} className="text-white fill-white" />
              <span className="font-sport text-sm text-white tracking-widest uppercase">Pick Maestro Élite</span>
            </div>
          </div>

          {/* Main Info */}
          <div className="text-center mb-10">
            <h2 className="font-sport text-4xl md:text-5xl text-white mb-4 tracking-tight leading-none uppercase italic italic-gradient-text">
              {recommendation.team || recommendation.pickTeam || 'Sin Selección'}
            </h2>
            <div className="inline-flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
              <TrendingUp size={18} className="text-success" />
              <span className="font-sport text-xl text-primary tracking-widest uppercase">
                {recommendation.pick || recommendation.type || 'Analizando...'}
              </span>
            </div>
          </div>

          {/* Analysis Content */}
          <div className="bg-white/[0.02] rounded-3xl p-6 md:p-8 border border-white/5 mb-8 relative group">
             <div className="absolute -top-4 left-8 bg-[#001532] px-4 flex items-center gap-2">
                <Brain size={16} className="text-primary" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Análisis Pro</span>
             </div>
             
             <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium italic">
                {recommendation.analysis ? `"${recommendation.analysis}"` : "El análisis detallado para esta recomendación se está procesando o no está disponible actualmente."}
             </p>
          </div>

          {/* Expert Info */}
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                   <Award size={24} className="text-black" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Pronosticador</p>
                   <p className="font-sport text-white text-lg leading-none uppercase">{recommendation.tipster || 'Sistema AI'}</p>
                </div>
             </div>

             <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verificado</span>
             </div>
          </div>
        </div>

        {/* Footer Accent */}
        <div className="h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
      </div>
    </div>
  );
};

export default RecommendationModal;
