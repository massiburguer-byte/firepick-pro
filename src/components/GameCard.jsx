import React from 'react';
import { getTeamLogo } from '../services/mlbApi';
import { Info, Clock, Activity, ChevronRight, BarChart3, Zap } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const GameCard = ({ game, adminOdds, onPick, selectedSide, onOpenAnalysis, theme }) => {
  if (!game || !game.teams) return null;

  const { teams, gameDate, status } = game;
  const away = teams.away || { team: { name: 'Away' } };
  const home = teams.home || { team: { name: 'Home' } };

  const h_odds = adminOdds?.h_odds;
  const a_odds = adminOdds?.a_odds;
  
  const allowedStates = ['Scheduled', 'Pre-Game', 'Preview', 'Warmup'];
  const isStarted = !allowedStates.includes(status?.detailedState);
  const isPastTime = gameDate ? new Date(gameDate) <= new Date() : false;
  const isOpen = (h_odds !== undefined && a_odds !== undefined) && adminOdds?.status === 'open' && !isPastTime && !isStarted;

  const getPitcherName = (side) => {
    const p = side.probablePitcher;
    return p?.fullName?.split(' ').pop() || 'TBA';
  };

  const gameTime = new Date(gameDate).toLocaleTimeString('es-ES', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex flex-col md:flex-row items-center gap-6 p-6 transition-all duration-500 border-b border-white/[0.03] ${!isOpen ? 'opacity-40 grayscale-[0.5]' : 'hover:bg-white/[0.02]'}`}
    >
      {/* 2. TEAMS & TIME (CENTER - 3 COLUMNS) */}
      <div className="flex-1 flex flex-row items-center gap-1 md:gap-4 w-full overflow-hidden">
        {/* AWAY TEAM */}
        <div 
          onClick={() => isOpen && onPick(game.gamePk, away.team.name, a_odds, 'away')}
          className={`flex-1 relative overflow-hidden flex flex-col sm:flex-row items-center sm:justify-between p-2 md:p-4 rounded-xl cursor-pointer transition-all duration-300 border min-w-0 ${
            selectedSide === 'away' 
              ? `${theme === 'mlb' ? 'bg-secondary/20 border-secondary shadow-[0_0_20px_rgba(255,184,0,0.1)]' : 'bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'}` 
              : 'bg-black/20 border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-1 md:gap-3 relative z-10 min-w-0 text-center sm:text-left">
            <div className="w-6 h-6 md:w-10 md:h-10 rounded-lg bg-white/5 p-1 flex items-center justify-center border border-white/5 shadow-inner shrink-0">
               <img src={getTeamLogo(away.team.id)} alt="" className="w-full h-full object-contain filter drop-shadow-sm" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-[9px] md:text-sm font-black uppercase tracking-tight transition-colors truncate ${selectedSide === 'away' ? (theme === 'mlb' ? 'text-secondary' : 'text-white') : 'text-white/80'}`}>
                {away.team.name}
              </span>
              <span className="hidden sm:block text-[8px] font-black text-white/20 uppercase tracking-widest truncate">{getPitcherName(away)}</span>
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-end relative z-10 shrink-0">
             <span className={`text-[11px] md:text-base font-sport italic tracking-tighter ${selectedSide === 'away' ? 'text-white scale-110' : 'text-white/40'} transition-all`}>
               {isOpen ? (a_odds > 0 ? `+${a_odds}` : a_odds) : '---'}
             </span>
          </div>
          {selectedSide === 'away' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-secondary animate-pulse" />}
        </div>

        {/* TIME / VS COLUMN */}
        <div className="flex flex-col items-center justify-center gap-1 px-1 shrink-0 min-w-[50px] md:min-w-[80px]">
           <div className="h-px w-4 md:w-8 bg-white/5 hidden md:block" />
           <div className="flex flex-col items-center">
              <span className="text-[8px] md:text-xs font-sport italic text-secondary leading-none mb-0.5">{gameTime}</span>
              <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">vs</span>
           </div>
           <div className="h-px w-4 md:w-8 bg-white/5 hidden md:block" />
        </div>

        {/* HOME TEAM */}
        <div 
          onClick={() => isOpen && onPick(game.gamePk, home.team.name, h_odds, 'home')}
          className={`flex-1 relative overflow-hidden flex flex-col sm:flex-row items-center sm:justify-between p-2 md:p-4 rounded-xl cursor-pointer transition-all duration-300 border min-w-0 ${
            selectedSide === 'home' 
              ? `${theme === 'mlb' ? 'bg-secondary/20 border-secondary shadow-[0_0_20px_rgba(255,184,0,0.1)]' : 'bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'}` 
              : 'bg-black/20 border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-1 md:gap-3 relative z-10 min-w-0 text-center sm:text-left">
            <div className="w-6 h-6 md:w-10 md:h-10 rounded-lg bg-white/5 p-1 flex items-center justify-center border border-white/5 shadow-inner shrink-0">
               <img src={getTeamLogo(home.team.id)} alt="" className="w-full h-full object-contain filter drop-shadow-sm" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-[9px] md:text-sm font-black uppercase tracking-tight transition-colors truncate ${selectedSide === 'home' ? (theme === 'mlb' ? 'text-secondary' : 'text-white') : 'text-white/80'}`}>
                {home.team.name}
              </span>
              <span className="hidden sm:block text-[8px] font-black text-white/20 uppercase tracking-widest truncate">{getPitcherName(home)}</span>
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-end relative z-10 shrink-0">
             <span className={`text-[11px] md:text-base font-sport italic tracking-tighter ${selectedSide === 'home' ? 'text-white scale-110' : 'text-white/40'} transition-all`}>
               {isOpen ? (h_odds > 0 ? `+${h_odds}` : h_odds) : '---'}
             </span>
          </div>
          {selectedSide === 'home' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-secondary animate-pulse" />}
        </div>
      </div>

      {/* 3. ANALYSIS TRIGGER (RIGHT) */}
      <div className="flex items-center gap-4 w-full md:w-auto md:pl-8 md:border-l border-white/5">
        <button 
          onClick={() => onOpenAnalysis(game)}
          className={`h-12 flex-1 md:flex-none px-6 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl flex items-center justify-center gap-3 transition-all border border-white/10 group/btn shadow-lg`}
        >
          <BarChart3 size={16} className="group-hover/btn:text-secondary transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Análisis</span>
        </button>
        {adminOdds?.status === 'ai_guru' && (
          <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center border border-secondary/20 shadow-[0_0_15px_rgba(255,184,0,0.1)]" title="Guru Advisory">
            <Zap size={16} className="text-secondary" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GameCard;
