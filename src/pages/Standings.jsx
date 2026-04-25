import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { fetchMLBStandings, getTeamLogo } from '../services/mlbApi';
import { Trophy, Flame, Snowflake, Loader2, Star, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const Standings = () => {
  const { theme } = useTheme();
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMLBStandings();
        setStandings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Standings UI Error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allTeams = [];
  standings.forEach(division => {
    if (division?.teamRecords) {
      division.teamRecords.forEach(team => {
        allTeams.push(team);
      });
    }
  });

  const hotTeams = allTeams
    .filter(t => t.streak && t.streak.streakType === 'wins')
    .sort((a, b) => b.streak.streakNumber - a.streak.streakNumber)
    .slice(0, 5);

  const coldTeams = allTeams
    .filter(t => t.streak && t.streak.streakType === 'losses')
    .sort((a, b) => b.streak.streakNumber - a.streak.streakNumber)
    .slice(0, 5);

  return (
    <div className={`min-h-screen font-sans transition-all duration-700 ${theme === 'mlb' ? 'bg-[#001E46]' : 'bg-[#0A0A0A]'}`}>
      <Navbar />

      <div className="w-full flex justify-center mt-8 lg:mt-12 pb-32">
        <main className="w-full px-4 max-w-7xl lg:px-8">
          
          {/* HEADER SECTION */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xl transition-all duration-500 ${theme === 'mlb' ? 'bg-secondary border-secondary/20 text-white' : 'bg-white border-white/10 text-black'}`}>
                 <Trophy size={20} />
              </div>
              <div className="flex flex-col">
                 <h1 className="font-sport text-xl md:text-2xl text-white tracking-tighter uppercase italic leading-none">Posiciones</h1>
                 <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">MLB Official Standings • Live Feed</span>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
              <div className="relative">
                 <div className="w-16 h-16 border-4 border-white/5 border-t-secondary rounded-full animate-spin" />
                 <Star size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-secondary animate-pulse" />
              </div>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] animate-pulse">Sincronizando Data Satelital...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              
              {/* STREAKS HIGHLIGHTS */}
              <section className="grid grid-cols-2 gap-3 md:gap-8">
                {/* HOT TEAMS */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`relative overflow-hidden p-3 md:p-8 border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}
                >
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-danger rotate-12">
                     <Flame size={120} />
                  </div>
                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-3 mb-4 relative z-10">
                      <h3 className="font-sport text-xs md:text-xl text-danger flex items-center gap-1 md:gap-3 italic uppercase tracking-tighter">
                        <Flame size={14} className="animate-pulse md:size-[24px]" /> CALIENTES
                      </h3>
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] bg-white/5 px-3 py-1 rounded">HOT STREAK</span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 relative z-10">
                    {hotTeams.map((team, idx) => (
                      <div key={team?.team?.id || idx} className="flex items-center justify-between group py-1.5 px-2 md:py-4 md:px-6 hover:bg-white/[0.03] rounded-xl transition-all duration-300 border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-2 md:gap-5 flex-1 min-w-0 mr-2 md:mr-4">
                          <div className={`w-5 h-5 md:w-8 md:h-8 rounded flex items-center justify-center font-sport text-[8px] md:text-xs shrink-0 border transition-all ${
                            idx === 0 ? 'bg-danger border-danger text-white shadow-lg shadow-danger/20' : 'bg-black/40 border-white/5 text-white/40'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="w-6 h-6 md:w-10 md:h-10 rounded-lg bg-white p-1 md:p-1.5 border border-white/10 shadow-lg flex items-center justify-center shrink-0">
                             <img src={getTeamLogo(team?.team?.id)} className="w-full h-full object-contain filter drop-shadow-sm" alt="" />
                          </div>
                           <span className="font-sport font-normal text-[8px] md:text-base text-white truncate group-hover:text-danger transition-colors italic uppercase tracking-tight leading-none" title={team?.team?.name}>{team?.team?.name.split(' ').pop()}</span>
                        </div>
                        <div className="flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-5 shrink-0">
                          <span className="text-[7px] md:text-xs font-black text-white/10 md:text-white/20 uppercase tracking-widest">{team?.wins}-{team?.losses}</span>
                           <div className="bg-emerald-500/10 text-emerald-400 font-sport italic px-1.5 md:px-4 py-0.5 md:py-1 rounded-lg md:rounded-xl text-[8px] md:text-sm border border-emerald-500/20 min-w-[35px] md:min-w-[60px] text-center">
                             {team?.streak?.streakCode || `W${team?.streak?.streakNumber}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* COLD TEAMS */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`relative overflow-hidden p-3 md:p-8 border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}
                >
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-primary -rotate-12">
                     <Snowflake size={120} />
                  </div>
                  <div className="flex items-center justify-between border-b border-white/[0.05] pb-6 mb-8 relative z-10">
                    <h3 className={`font-sport text-xs md:text-xl flex items-center gap-1 md:gap-3 italic uppercase tracking-tighter ${theme === 'mlb' ? 'text-white' : 'text-primary'}`}>
                      <Snowflake size={14} className="animate-pulse md:size-[24px]" /> FRÍOS
                    </h3>
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] bg-white/5 px-3 py-1 rounded">COLD STREAK</span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 relative z-10">
                    {coldTeams.map((team, idx) => (
                      <div key={team?.team?.id || idx} className="flex items-center justify-between group py-1.5 px-2 md:py-4 md:px-6 hover:bg-white/[0.03] rounded-xl transition-all duration-300 border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-2 md:gap-5 flex-1 min-w-0 mr-4">
                          <div className={`w-5 h-5 md:w-8 md:h-8 rounded flex items-center justify-center font-sport text-[8px] md:text-xs shrink-0 border transition-all ${
                            idx === 0 ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-black/40 border-white/5 text-white/40'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="w-6 h-6 md:w-10 md:h-10 rounded-lg bg-white p-1 md:p-1.5 border border-white/10 shadow-lg flex items-center justify-center shrink-0">
                             <img src={getTeamLogo(team?.team?.id)} className="w-full h-full object-contain filter drop-shadow-sm" alt="" />
                          </div>
                           <span className="font-sport font-normal text-[8px] md:text-base text-white truncate group-hover:text-primary transition-colors italic uppercase tracking-tight leading-none" title={team?.team?.name}>{team?.team?.name.split(' ').pop()}</span>
                        </div>
                        <div className="flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-5 shrink-0">
                          <span className="text-[7px] md:text-xs font-black text-white/10 md:text-white/20 uppercase tracking-widest">{team?.wins}-{team?.losses}</span>
                           <div className="bg-rose-500/10 text-secondary font-sport italic px-1.5 md:px-4 py-0.5 md:py-1 rounded-lg md:rounded-xl text-[8px] md:text-sm border border-rose-500/20 min-w-[35px] md:min-w-[60px] text-center">
                             {team?.streak?.streakCode || `L${team?.streak?.streakNumber}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </section>

              {/* FULL STANDINGS GRID */}
              <section className={`rounded-3xl p-4 md:p-8 border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-8 mb-12">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center border border-secondary/20">
                         <Activity size={20} className="text-secondary" />
                      </div>
                      <h3 className="font-sport text-xl md:text-2xl text-white tracking-tighter uppercase italic leading-none">MLB Divisions Standings</h3>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                  {standings.map((division, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.03] bg-black/20 shadow-2xl"
                    >
                      <div className="bg-white/5 px-6 py-4 border-b border-white/[0.03]">
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] truncate">
                          {(division?.division?.name || 'MLB').replace('American League', 'AL').replace('National League', 'NL')}
                        </h4>
                      </div>
                      <div className="flex flex-col p-4">
                        {/* HEADER ROW */}
                        <div className="grid grid-cols-12 gap-2 px-4 py-2 mb-4 border-b border-white/[0.03]">
                          <span className="col-span-6 text-[9px] font-black text-white/20 uppercase tracking-widest">Equipo</span>
                          <span className="col-span-2 text-[9px] font-black text-white/20 uppercase tracking-widest text-center">W</span>
                          <span className="col-span-2 text-[9px] font-black text-white/20 uppercase tracking-widest text-center">L</span>
                          <span className="col-span-2 text-[9px] font-black text-white/20 uppercase tracking-widest text-center">PCT</span>
                        </div>
                        
                        {/* TEAM ROWS */}
                        {(division?.teamRecords || []).map((team, tIdx) => (
                          <div key={team?.team?.id || tIdx} className="grid grid-cols-12 items-center gap-2 py-3 px-4 hover:bg-white/[0.03] rounded-xl group transition-all duration-300">
                            <div className="col-span-6 flex items-center gap-3 min-w-0">
                              <div className={`w-6 h-6 rounded flex items-center justify-center font-sport text-[10px] shrink-0 border transition-all ${
                                tIdx === 0 ? 'bg-secondary border-secondary/20 text-white shadow-[0_0_10px_rgba(255,184,0,0.2)]' : 'bg-black/40 border-white/5 text-white/20'
                              }`}>
                                {tIdx + 1}
                              </div>
                              <img src={getTeamLogo(team?.team?.id)} className="w-5 h-5 shrink-0 object-contain filter drop-shadow-sm opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                               <span className="font-sport font-normal text-[10px] md:text-sm text-white/80 truncate group-hover:text-secondary transition-colors italic uppercase tracking-tight leading-none" title={team?.team?.name}>{team?.team?.name.split(' ').pop()}</span>
                            </div>
                            <div className="col-span-2 text-center">
                               <span className="font-sport italic text-sm text-white/60 group-hover:text-white transition-colors">{team?.wins || 0}</span>
                            </div>
                            <div className="col-span-2 text-center">
                               <span className="font-sport italic text-sm text-white/20 group-hover:text-white/40 transition-colors">{team?.losses || 0}</span>
                            </div>
                            <div className="col-span-2 text-center">
                               <span className="font-sport italic text-xs text-secondary">{team?.winningPercentage || '.000'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Standings;
