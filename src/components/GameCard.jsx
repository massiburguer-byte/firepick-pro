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
      {/* 1. TIME & STATUS (LEFT) */}
      <div className="w-full md:w-24 flex md:flex-col items-center justify-center md:border-r border-white/5 md:pr-8 gap-2">
        <span className="text-sm font-sport italic text-white leading-none">{gameTime}</span>
        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Hoy</span>
      </div>

      {/* 2. TEAMS & ODDS (CENTER) */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {/* AWAY TEAM */}
        <div 
          onClick={() => isOpen && onPick(game.gamePk, away.team.name, a_odds, 'away')}
          className={`relative overflow-hidden flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
            selectedSide === 'away' 
              ? `${theme === 'mlb' ? 'bg-secondary/20 border-secondary shadow-[0_0_20px_rgba(255,184,0,0.1)]' : 'bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'}` 
              : 'bg-black/20 border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-white/5 p-1.5 flex items-center justify-center border border-white/5 shadow-inner">
               <img src={getTeamLogo(away.team.id)} alt="" className="w-full h-full object-contain filter drop-shadow-sm" />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-black uppercase tracking-tight transition-colors ${selectedSide === 'away' ? (theme === 'mlb' ? 'text-secondary' : 'text-white') : 'text-white/80'}`}>
                {away.team.name}
              </span>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{getPitcherName(away)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end relative z-10">
             <span className={`text-base font-sport italic tracking-tighter ${selectedSide === 'away' ? 'text-white scale-110' : 'text-white/40'} transition-all`}>
               {isOpen ? (a_odds > 0 ? `+${a_odds}` : a_odds) : '---'}
             </span>
          </div>
          
          {selectedSide === 'away' && (
             <div className="absolute right-0 top-0 bottom-0 w-1 bg-secondary animate-pulse" />
          )}
        </div>

        {/* HOME TEAM */}
        <div 
          onClick={() => isOpen && onPick(game.gamePk, home.team.name, h_odds, 'home')}
          className={`relative overflow-hidden flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
            selectedSide === 'home' 
              ? `${theme === 'mlb' ? 'bg-secondary/20 border-secondary shadow-[0_0_20px_rgba(255,184,0,0.1)]' : 'bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'}` 
              : 'bg-black/20 border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-white/5 p-1.5 flex items-center justify-center border border-white/5 shadow-inner">
               <img src={getTeamLogo(home.team.id)} alt="" className="w-full h-full object-contain filter drop-shadow-sm" />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-black uppercase tracking-tight transition-colors ${selectedSide === 'home' ? (theme === 'mlb' ? 'text-secondary' : 'text-white') : 'text-white/80'}`}>
                {home.team.name}
              </span>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{getPitcherName(home)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end relative z-10">
             <span className={`text-base font-sport italic tracking-tighter ${selectedSide === 'home' ? 'text-white scale-110' : 'text-white/40'} transition-all`}>
               {isOpen ? (h_odds > 0 ? `+${h_odds}` : h_odds) : '---'}
             </span>
          </div>

          {selectedSide === 'home' && (
             <div className="absolute right-0 top-0 bottom-0 w-1 bg-secondary animate-pulse" />
          )}
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
