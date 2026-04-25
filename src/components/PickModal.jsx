import React, { useState } from 'react';
import { X, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PickModal = ({ isOpen, onClose, teamName, odds, onConfirm }) => {
  const [stake, setStake] = useState(1);
  const { userData } = useAuth();
  const toWin = React.useMemo(() => {
    if (!odds) return 0;
    const numOdds = Number(odds);
    let winAmount = 0;
    
    if (numOdds > 0) {
      winAmount = stake * (numOdds / 100);
    } else {
      winAmount = stake / (Math.abs(numOdds) / 100);
    }
    return Number(winAmount.toFixed(2));
  }, [stake, odds]);

  if (!isOpen) return null;

  const canConfirm = stake > 0 && stake <= (userData?.bankroll || 0) && (userData?.picksUsed || 0) < 5;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade">
      <div className="glass glass-card max-w-sm w-full relative p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-white">
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold mb-6 text-primary font-outfit">New Pick</h3>

        <div className="flex flex-col gap-6">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Selection</p>
            <div className="flex justify-between items-center text-lg font-bold">
              <span>{teamName}</span>
              <span className="text-primary">{odds > 0 ? `+${odds}` : odds}</span>
            </div>
          </div>

          <div className="form-group">
            <label>Stake (Units)</label>
            <div className="relative">
              <input 
                type="number" 
                value={stake}
                onChange={(e) => setStake(Math.max(1, Number(e.target.value)))}
                className="form-control pr-12 text-lg font-bold"
                min="1"
                max={userData?.bankroll || 100}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">U</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white/5 rounded-lg text-center">
              <p className="text-[10px] text-text-muted font-bold uppercase mb-1">To Win</p>
              <p className="text-lg font-bold text-success">+{toWin}U</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg text-center">
              <p className="text-[10px] text-text-muted font-bold uppercase mb-1">Total Return</p>
              <p className="text-lg font-bold">{Number((stake + toWin).toFixed(2))}U</p>
            </div>
          </div>

          {(userData?.picksUsed || 0) >= 5 && (
            <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p>You have already used all your weekly picks (5/5).</p>
            </div>
          )}

          <button 
            disabled={!canConfirm}
            onClick={() => onConfirm(stake, toWin)}
            className="btn btn-primary w-full py-4 mt-2"
          >
            CONFIRM PICK
          </button>
        </div>
      </div>
    </div>
  );
};

export default PickModal;
