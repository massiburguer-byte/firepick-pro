import React, { useState, useEffect } from 'react';
import { X, Brain, Target, Flame, TrendingUp, Activity, Sparkles, ChevronRight, Loader2, Info } from 'lucide-react';
import { getAiInsights } from '../services/aiService';
import { toast } from 'sonner';

const AiGuruDrawer = ({ isOpen, onClose, onAddPick, adminOdds, cart, dateIndex }) => {
  const [activeTab, setActiveTab] = useState('ml');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        setLoading(true);
        // Calculate date based on dateIndex if provided
        let dateStr = new Date().toISOString().split('T')[0];
        if (typeof dateIndex === 'number') {
          const d = new Date();
          d.setDate(d.getDate() + dateIndex);
          dateStr = d.toISOString().split('T')[0];
        }
        const data = await getAiInsights(dateStr);
        setInsights(data);
        setLoading(false);
      };
      load();
    }
  }, [isOpen, dateIndex]);

  const handleAddPick = (item) => {
    if (!onAddPick) return;
    
    // Obtener cuotas si existen, si no, usar 100 por defecto para el Gurú
    const gameOdds = adminOdds ? adminOdds[item.gamePk.toString()] : null;
    let currentOdds = 100;
    
    if (gameOdds) {
      currentOdds = item.side === 'home' ? gameOdds.h_odds : gameOdds.a_odds;
      // Si la cuota específica es nula/0, mantenemos el 100 por defecto
      if (!currentOdds) currentOdds = 100;
    }

    // Pasar metadatos del Gurú para el historial
    const guruMeta = {
      conf: item.confidence,
      type: item.guruPropType || 'AI_PICK',
      target: item.target || item.pick
    };

    onAddPick(item.gamePk, item.team, currentOdds, item.side, guruMeta);
    toast.success(`${item.team} añadido al slip (Modo Gurú)`);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'ml', label: 'Ganador', icon: <Target size={18} /> },
    { id: 'strikeouts', label: 'Ponches', icon: <Flame size={18} /> },
    { id: 'totals', label: 'Totales A/B', icon: <Activity size={18} /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      {/* OVERLAY */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* DRAWER CONTENT */}
      <aside className="relative w-full max-w-md bg-[#0f172a] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-white/5">
        
        {/* HEADER: AI GLOW */}
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(30,64,175,0.4)]">
                <Brain size={24} className="text-white" />
              </div>
              <div>
                <h2 className="font-sport text-xl text-white tracking-tight uppercase">GURÚ AI <span className="text-secondary text-xs align-top">PRO</span></h2>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Análisis Estadístico Activo</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-[90%]">
             Nuestro motor procesa ERA, K/9 y Eficiencia del Bullpen para identificar ventajas matemáticas en tiempo real.
          </p>
        </div>

        {/* TABS */}
        <div className="flex px-4 border-b border-white/5 bg-slate-900/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${
                activeTab === tab.id 
                ? 'border-primary text-white' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
              <div className="relative">
                <Loader2 size={40} className="animate-spin text-primary" />
                <Sparkles size={16} className="absolute -top-1 -right-1 text-secondary animate-pulse" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 animate-pulse">Sincronizando Probabilidades...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {!insights?.[activeTab] || insights[activeTab].length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <Info size={32} className="mx-auto text-slate-700" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No se encontraron picks de alta confianza</p>
                </div>
              ) : (
                insights[activeTab].map((item, i) => {
                  const isInCart = cart?.some(c => c.gamePk === item.gamePk && c.side === item.side);
                  
                  return (
                    <div key={i} className="group relative bg-[#1e293b] rounded-xl p-5 border border-white/5 hover:border-primary/30 transition-all shadow-lg overflow-hidden">
                      {/* CONFIDENCE BADGE */}
                      {item.confidence && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-[10px] font-black text-white rounded-bl-lg uppercase tracking-tighter">
                          {item.confidence}% Match
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                            {activeTab === 'strikeouts' ? 'K-MASTER' : activeTab === 'totals' ? 'ALTA/BAJA' : 'VALUE PICK'}
                          </span>
                        </div>

                        <h3 className="font-sport text-lg text-white leading-tight">
                          {item.team || item.pitcher || item.matchup}
                        </h3>

                        {/* STATS BREAKDOWN FOR PRO FEEL */}
                        {item.details && (
                          <div className="grid grid-cols-2 gap-2 py-2 border-y border-white/5 my-1">
                            <div className="flex flex-col">
                              <span className="text-[8px] uppercase text-slate-500 font-bold">ERA Abridor</span>
                              <span className="text-[11px] font-sport text-white">
                                {typeof item.details.sp_era === 'number' ? item.details.sp_era.toFixed(2) : '---'}
                              </span>
                            </div>
                            <div className="flex flex-col border-l border-white/5 pl-2">
                              <span className="text-[8px] uppercase text-slate-500 font-bold">ERA Bullpen</span>
                              <span className="text-[11px] font-sport text-secondary">
                                {typeof item.details.bp_era === 'number' ? item.details.bp_era.toFixed(2) : '---'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* DISPLAY PICK / TARGET */}
                        {item.pick && (
                           <div className="flex items-center gap-2 mb-3">
                              <span className={`px-3 py-1 rounded text-[11px] font-black tracking-widest shadow-lg ${
                                (item.pick === 'OVER' || item.pick.includes('MÁS')) 
                                ? 'bg-success text-white shadow-success/20' 
                                : 'bg-secondary text-white'
                              }`}>
                                {item.pick === 'OVER' ? 'ALTA' : item.pick === 'UNDER' ? 'BAJA' : item.pick} 
                                {item.expectedTotal ? ` ${item.expectedTotal}` : ''}
                              </span>
                              {item.pitcher && (
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                                  {item.pitcher}
                                </span>
                              )}
                           </div>
                        )}

                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                          "{item.reason}"
                        </p>

                        <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between gap-4">
                          <div className="flex flex-col">
                             <span className="text-[9px] font-bold uppercase text-slate-500">Confianza Gurú</span>
                             <div className="flex items-center gap-1">
                               <span className="font-sport text-sm text-primary tracking-widest">
                                 {item.confidence ? `${item.confidence}%` : '☆☆☆☆☆'}
                               </span>
                             </div>
                          </div>
                          
                          {(activeTab === 'ml' || activeTab === 'strikeouts') && (
                            <button 
                              onClick={() => handleAddPick(item)}
                              className={`flex-1 py-2 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                isInCart 
                                ? 'bg-success text-white' 
                                : 'bg-white/5 hover:bg-primary text-white border border-white/10 hover:border-primary shadow-lg'
                              }`}
                            >
                              {isInCart ? 'EN EL SLIP ✓' : 'AÑADIR AL SLIP'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* FOOTER - CLEAN FOR OPEN VERSION */}
        <div className="p-6 bg-slate-900/80 border-t border-white/5 space-y-4">
           <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <Sparkles size={18} className="text-secondary shrink-0 animate-pulse" />
              <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                 <span className="block font-bold text-white mb-1 uppercase tracking-wider text-[9px]">Análisis Premium Activo</span>
                 Estás usando el motor estadístico de alta precisión. Los datos se actualizan cada 60 segundos desde la API oficial de la MLB.
              </p>
           </div>
        </div>
      </aside>
    </div>
  );
};

export default AiGuruDrawer;
