import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Star, ChevronRight, Zap } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { getTeamLogo, fetchTopPitchersSO, fetchPitcherGameLog } from '../services/mlbApi';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, Timestamp, limit as fsLimit } from 'firebase/firestore';

export const Top3Tipsters = ({ leaderboardData = [], theme }) => {
  const top3 = (leaderboardData || []).slice(0, 3);
  
  if (top3.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-2xl p-6 md:p-8 shadow-3xl border transition-all duration-500 flex flex-col ${theme === 'mlb' ? 'bg-[#001E46] border-white/5' : 'bg-[#111111] border-white/5'}`}
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8">
        <h3 className="font-sport text-sm md:text-xl text-white flex items-center gap-3 italic uppercase tracking-tighter leading-none">
          <Award size={22} className="text-secondary" /> TOP 3 SEMANAL
        </h3>
        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] bg-white/5 px-3 py-1 rounded">PRO</span>
      </div>
      
      <div className="flex flex-col gap-4">
        {top3.map((u, i) => (
          <motion.div 
            key={u?.id || i} 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center justify-between group p-5 rounded-2xl transition-all duration-500 border border-transparent hover:bg-white/[0.03] ${i === 0 ? (theme === 'mlb' ? 'bg-white/5 border-secondary/20 shadow-xl' : 'bg-white/5 border-white/20 shadow-xl') : ''}`}
          >
            <div className="flex items-center gap-5 flex-1 min-w-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-sport text-lg shrink-0 border transition-all duration-500 ${
                i === 0 ? (theme === 'mlb' ? 'bg-secondary text-white border-secondary shadow-[0_0_15px_rgba(255,184,0,0.3)]' : 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]') : 
                'bg-black/40 text-white/20 border-white/5'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm md:text-base text-white leading-tight mb-1 truncate group-hover:text-secondary transition-colors italic uppercase tracking-tight">{u?.displayName || 'Usuario'}</p>
                <div className="flex items-center gap-2">
                   <span className={`text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-secondary' : 'text-white/20'}`}>+{u?.weeklyProfit || 0} UNITS</span>
                </div>
              </div>
            </div>
            <div className={`transition-all duration-500 ${i === 0 ? 'text-secondary opacity-100 scale-110' : 'text-white/10 opacity-40 group-hover:opacity-100 group-hover:text-secondary'}`}>
               <TrendingUp size={24} />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export const DailyRecommendation = ({ recommendation, onOpen, theme }) => {
  if (!recommendation || (typeof recommendation === 'string' && !recommendation) || (typeof recommendation === 'object' && !recommendation.pick)) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-2xl p-1 shadow-3xl group overflow-hidden transition-all duration-500 ${theme === 'mlb' ? 'bg-gradient-to-br from-secondary via-danger to-primary' : 'bg-gradient-to-br from-white/40 via-white/10 to-transparent'}`}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      
      <button 
        onClick={onOpen}
        className={`w-full relative rounded-xl p-8 flex flex-col gap-6 transition-all duration-500 border border-white/5 ${theme === 'mlb' ? 'bg-[#001E46]/90 group-hover:bg-[#001E46]/70' : 'bg-[#111111]/90 group-hover:bg-[#111111]/70'}`}
      >
        <div className="flex items-center justify-between w-full">
           <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 ${theme === 'mlb' ? 'bg-secondary text-white shadow-[0_0_15px_rgba(255,184,0,0.4)]' : 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'}`}>
                 <Star size={24} className="fill-current" />
              </div>
              <div className="text-left">
                 <h3 className="font-sport text-xl text-white tracking-tight uppercase leading-none mb-1 italic">Pick Maestro</h3>
                 <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Activity size={10} /> AI ANALYSIS ENGINE
                 </span>
              </div>
           </div>
           <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${theme === 'mlb' ? 'bg-white/5 text-white/40 group-hover:bg-secondary group-hover:text-white' : 'bg-white/5 text-white/40 group-hover:bg-white group-hover:text-black'}`}>
              <ChevronRight size={20} />
           </div>
        </div>

        <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col gap-1 items-center">
           <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">RECOMENDADO</span>
           <span className="text-2xl font-sport italic text-white tracking-tighter">{recommendation.pick}</span>
        </div>
      </button>
    </motion.div>
  );
};

export const Top5Strikeouts = ({ theme }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const topPitchers = await fetchTopPitchersSO();
        
        const hydrated = await Promise.all(
          topPitchers.map(async (p) => {
            const logs = await fetchPitcherGameLog(p.person.id);
            return {
              ...p,
              last5: logs.map(game => game.stat.strikeOuts)
            };
          })
        );
        
        setLeaders(hydrated);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !leaders || leaders.length === 0) {
    return (
      <motion.div className={`rounded-2xl p-8 shadow-3xl border animate-pulse min-h-[400px] flex items-center justify-center transition-all duration-500 ${theme === 'mlb' ? 'bg-[#001E46] border-white/5' : 'bg-[#111111] border-white/5'}`}>
         <div className="flex flex-col items-center gap-4 opacity-10">
            <Zap size={48} className="text-white" />
            <span className="text-[10px] font-black uppercase text-white tracking-[0.4em]">Sincronizando K-Log...</span>
         </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 shadow-3xl border transition-all duration-500 flex flex-col ${theme === 'mlb' ? 'bg-[#001E46] border-white/5' : 'bg-[#111111] border-white/5'}`}
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
        <h3 className="font-sport text-sm text-white flex items-center gap-3 uppercase tracking-tighter italic">
          <Zap size={18} className="text-secondary fill-secondary" /> Ponches por Pitcher
        </h3>
        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest bg-white/5 px-3 py-1 rounded">LAST 5</span>
      </div>
      
      <div className="flex flex-col gap-6">
        {leaders.map((pitcher, i) => {
          const fullName = pitcher?.person?.fullName || '';
          const lastName = fullName ? fullName.split(' ').pop() : '...';
          
          return (
            <div key={pitcher?.person?.id || i} className="flex flex-col gap-3 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center p-1.5 border border-white/5">
                       <img src={getTeamLogo(pitcher?.team?.id)} alt="" className="w-full h-full object-contain filter drop-shadow-sm" />
                    </div>
                    <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 text-white text-[10px] font-black rounded-lg flex items-center justify-center border border-white/10 shadow-xl transition-colors duration-500 ${i === 0 ? 'bg-secondary' : 'bg-black/40'}`}>
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex flex-col">
                     <span className="font-sport text-base text-white tracking-tighter uppercase group-hover:text-secondary transition-colors italic leading-none">{lastName}</span>
                     <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">Starting Pitcher</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Total K's</span>
                   <span className="font-sport text-xl text-secondary leading-none">{pitcher.value}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {pitcher.last5 && pitcher.last5.length > 0 ? (
                  pitcher.last5.map((k, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ y: -3 }}
                      className={`h-12 flex flex-col items-center justify-center rounded-xl border transition-all duration-500 ${
                        k >= 9 ? (theme === 'mlb' ? 'bg-secondary border-white/20 shadow-[0_0_15px_rgba(255,184,0,0.2)]' : 'bg-white border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]') : 
                        k >= 7 ? 'bg-white/10 border-white/10' : 
                        'bg-black/20 border-white/5'
                      }`}
                    >
                      <span className={`font-sport text-lg leading-none ${k >= 7 ? (k >= 9 && theme !== 'mlb' ? 'text-black' : 'text-white') : 'text-white/20'}`}>{k}</span>
                      <span className={`text-[6px] font-black uppercase tracking-widest mt-0.5 ${k >= 7 ? (k >= 9 && theme !== 'mlb' ? 'text-black/60' : 'text-white/40') : 'text-white/10'}`}>K's</span>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-5 h-12 bg-black/20 rounded-xl flex items-center justify-center border border-white/5">
                    <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">No Stats Available</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export const CommunityTopPicks = ({ theme }) => {
  const [topTeams, setTopTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunityTrends = async () => {
      try {
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const q = query(
          collection(db, 'picks'),
          where('createdAt', '>=', Timestamp.fromDate(last24h)),
          fsLimit(500)
        );

        const snapshot = await getDocs(q);
        const counts = {};
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.team) {
            counts[data.team] = (counts[data.team] || 0) + 1;
          }
        });

        const sorted = Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopTeams(sorted);
      } catch (error) {
        console.error("Community Trends Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityTrends();
  }, []);

  if (loading || topTeams.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-2xl p-6 md:p-8 shadow-3xl border transition-all duration-500 flex flex-col ${theme === 'mlb' ? 'bg-[#001E46] border-white/5' : 'bg-[#111111] border-white/5'}`}
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8">
        <h3 className="font-sport text-sm md:text-xl text-white flex items-center gap-3 uppercase tracking-tighter italic">
          <Star size={22} className="text-secondary fill-secondary" /> Tendencias Hoy
        </h3>
        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] bg-white/5 px-3 py-1 rounded">GLOBAL</span>
      </div>
      
      <div className="flex flex-col gap-6">
        {topTeams.map((team, i) => (
          <div key={team.name} className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 font-sport text-sm text-white/20 font-bold shrink-0 italic">
                #{i + 1}
              </div>
              <span className="font-black text-sm md:text-base text-white uppercase tracking-tight group-hover:text-secondary transition-colors duration-300 italic">
                {team.name}
              </span>
            </div>
            <div className="flex items-center gap-4">
               <div className="h-2 w-24 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(team.count / (topTeams[0]?.count || 1)) * 100}%` }}
                    className={`h-full transition-all duration-1000 ${theme === 'mlb' ? 'bg-secondary shadow-[0_0_12px_rgba(255,184,0,0.6)]' : 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'}`} 
                  />
               </div>
               <span className="text-[11px] font-sport italic text-white/40">{team.count}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-[10px] text-white/20 font-black uppercase tracking-[0.3em] leading-tight text-center">
        Audited by Guru <span className="text-secondary">500+ DAILY</span>
      </p>
    </motion.div>
  );
};
