import React, { useState } from 'react';
import { X, Trash2, TrendingUp, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BaseballIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
  </svg>
);

const BetSlip = ({ isOpen, onClose, cart, onRemove, onPlaceBets, isPlacing, bankroll }) => {
  const [stakes, setStakes] = useState({}); // { [gamePk]: stake }

  const handleStakeChange = (gamePk, value) => {
    setStakes(prev => ({ ...prev, [gamePk]: value }));
  };

  const calculateTotalRisk = () => {
    return Object.values(stakes).reduce((acc, s) => acc + Number(s || 0), 0);
  };

  const calculateWin = (odds, stake) => {
    const s = Number(stake || 0);
    const o = Number(odds);
    if (o > 0) return (s * (o / 100)).toFixed(2);
    if (o < 0) return (s / (Math.abs(o) / 100)).toFixed(2);
    return (s).toFixed(2);
  };

  const handleConfirm = () => {
    const finalBets = cart.map(item => ({
      ...item,
      stake: Number(stakes[item.gamePk] || 0),
      toWin: calculateWin(item.odds, stakes[item.gamePk])
    }));
    
    // Validate Limits: 5U - 20U
    const invalidAmount = finalBets.find(b => b.stake < 5 || b.stake > 20);
    if (invalidAmount) return toast.error('La inversión debe estar entre 5U y 20U por selección.');
    
    if (calculateTotalRisk() > bankroll) return toast.error('Bankroll insuficiente para todas las selecciones.');
    
    onPlaceBets(finalBets);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[380px] bg-white z-[100] border-l border-slate-200 flex flex-col shadow-2xl animate-fade-right">
      <header className="p-5 border-b border-white/10 flex justify-between items-center bg-primary text-white">
        <div>
          <h2 className="text-lg font-bold font-outfit tracking-tight uppercase">MI TICKET</h2>
          <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">{cart.length} Selecciones</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded transition-all text-white"><X size={20} /></button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {cart.map(item => {
          const currentStake = Number(stakes[item.gamePk] || 0);
          const isInvalid = currentStake > 0 && (currentStake < 5 || currentStake > 20);
          
          return (
            <div key={item.gamePk} className={`p-4 border rounded shadow-sm relative group transition-all ${isInvalid ? 'border-secondary/50 bg-secondary/[0.02]' : 'bg-white border-slate-200'}`}>
              <button 
                onClick={() => onRemove(item.gamePk)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform shadow-md z-10"
              >
                <X size={12} />
              </button>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[9px] font-bold uppercase text-secondary tracking-wider mb-0.5">Selección {item.side === 'home' ? 'Local' : 'Visitante'}</p>
                  <h4 className="font-bold text-sm tracking-tight text-primary uppercase">{item.team}</h4>
                </div>
                <span className={`font-bold text-xs px-2 py-1 rounded border ${item.odds >= 0 ? 'text-green-700 bg-green-50 border-green-100' : 'text-primary bg-slate-50 border-slate-100'}`}>
                  {item.odds > 0 ? `+${item.odds}` : item.odds}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="number" 
                    placeholder="Inversión (U)"
                    className={`h-10 w-full px-3 pr-10 text-base font-bold bg-slate-50 border rounded outline-none transition-all ${isInvalid ? 'border-secondary focus:ring-1 focus:ring-secondary/20' : 'border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/10'}`}
                    value={stakes[item.gamePk] || ''}
                    onChange={(e) => handleStakeChange(item.gamePk, e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase">U</span>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Ganancia</p>
                  <p className="text-green-600 font-bold text-lg leading-none">+{calculateWin(item.odds, stakes[item.gamePk])}U</p>
                </div>
              </div>
              {isInvalid && (
                <p className="text-[9px] text-secondary font-bold uppercase tracking-tight mt-2">Requerido: 5U - 20U</p>
              )}
            </div>
          );
        })}
        {cart.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted border-2 border-dashed border-white/5 rounded-3xl">
            <BaseballIcon size={48} className="mb-4 opacity-20" />
            <p className="font-bold">El ticket está vacío</p>
            <p className="text-xs uppercase tracking-widest mt-2">Selecciona un equipo para empezar</p>
          </div>
        )}
      </div>

      <footer className="p-6 bg-slate-50 border-t border-slate-200 space-y-4 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 uppercase font-bold tracking-wider">Total Inversión</span>
            <span className="font-bold text-primary">{calculateTotalRisk()}U</span>
          </div>
          <div className="flex justify-between text-xl font-bold font-outfit uppercase tracking-tight">
            <span className="text-slate-500">A Ganar</span>
            <span className="text-secondary font-black">
              {cart.reduce((acc, item) => acc + Number(calculateWin(item.odds, stakes[item.gamePk])), 0).toFixed(2)}U
            </span>
          </div>
        </div>

        <button 
          onClick={handleConfirm}
          disabled={cart.length === 0 || isPlacing}
          className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded shadow-md disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-3 transition-colors uppercase tracking-wider text-sm"
        >
          {isPlacing ? <Loader2 className="animate-spin" /> : 'Confirmar Selecciones'}
        </button>
        
        <div className="flex flex-col items-center gap-1 mt-2">
           <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
             <Info size={10} className="text-primary" /> Máximo: 5 Picks por Usuario
           </div>
           <div className="text-[10px] text-secondary font-bold uppercase tracking-wider">
             Límites: 5U Min - 20U Max
           </div>
        </div>
      </footer>
    </div>
  );
};

export default BetSlip;
