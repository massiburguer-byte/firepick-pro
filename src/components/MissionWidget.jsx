import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';

const MissionWidget = ({ theme }) => {
  const { userData } = useAuth();
  
  const missionStats = React.useMemo(() => {
    if (!userData) return { firstPick: false, fullRoster: false };
    const todayStr = new Date().toISOString().split('T')[0];
    const items = userData.lastMissionDate === todayStr ? (userData.completedMissions || []) : [];
    return {
      firstPick: items.includes('first_pick'),
      fullRoster: items.includes('full_roster')
    };
  }, [userData]);

  const streak = userData?.winStreak || 0;

  return (
    <div className="flex flex-col gap-4">
      {/* STREAK BADGE */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className={`relative overflow-hidden flex items-center gap-4 p-5 rounded-2xl border transition-all duration-500 shadow-2xl ${theme === 'mlb' ? 'bg-[#001E46] border-white/5' : 'bg-[#111111] border-white/5'}`}
      >
         <div className={`absolute top-0 right-0 p-8 opacity-5 pointer-events-none ${theme === 'mlb' ? 'text-secondary' : 'text-white'}`}>
            <Award size={80} />
         </div>
         <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${streak > 0 ? (theme === 'mlb' ? 'bg-secondary text-white border-secondary shadow-[0_0_15px_rgba(255,184,0,0.3)]' : 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]') : 'bg-white/5 text-white/20 border-white/5'}`}>
            <Award size={24} className={streak > 0 ? "animate-bounce" : ""} />
         </div>
         <div className="flex flex-col relative z-10">
            <span className={`text-xl font-sport italic leading-none transition-all duration-500 ${streak > 0 ? 'text-white' : 'text-white/20'}`}>{streak} VICTORIAS</span>
            <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mt-1">Racha Actual</span>
         </div>
      </motion.div>

      {/* MISSIONS GRID */}
      <div className="grid grid-cols-1 gap-3">
         {/* MISSION 1: FIRST PICK */}
         <div className={`relative overflow-hidden flex items-center justify-between px-5 py-4 rounded-xl border transition-all duration-500 ${
           missionStats.firstPick ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'bg-black/20 border-white/5 opacity-50'
         }`}>
            <div className="flex items-center gap-3">
               <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-500 ${missionStats.firstPick ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-white/20'}`}>
                  {missionStats.firstPick ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-white/20" />}
               </div>
               <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest italic ${missionStats.firstPick ? 'text-white' : 'text-white/40'}`}>Primer Pick</span>
                  <span className="text-[8px] font-black uppercase text-white/20 tracking-tighter">Misión Diaria</span>
               </div>
            </div>
            {missionStats.firstPick ? (
               <span className="text-xs font-sport text-emerald-400 italic font-black">+2U</span>
            ) : (
               <span className="text-[9px] font-black text-white/20">RECOMPENSA</span>
            )}
         </div>

         {/* MISSION 2: FULL ROSTER */}
         <div className={`relative overflow-hidden flex items-center justify-between px-5 py-4 rounded-xl border transition-all duration-500 ${
           missionStats.fullRoster ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'bg-black/20 border-white/5 opacity-50'
         }`}>
            <div className="flex items-center gap-3">
               <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-500 ${missionStats.fullRoster ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-white/20'}`}>
                  {missionStats.fullRoster ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-white/20" />}
               </div>
               <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest italic ${missionStats.fullRoster ? 'text-white' : 'text-white/40'}`}>Roster Completo</span>
                  <span className="text-[8px] font-black uppercase text-white/20 tracking-tighter">Misión Diaria</span>
               </div>
            </div>
            {missionStats.fullRoster ? (
               <span className="text-xs font-sport text-emerald-400 italic font-black">+5U</span>
            ) : (
               <span className="text-[9px] font-black text-white/20">RECOMPENSA</span>
            )}
         </div>
      </div>
    </div>
  );
};

export default MissionWidget;
