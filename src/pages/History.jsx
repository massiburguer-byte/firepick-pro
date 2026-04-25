import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { syncUserPicks } from '../services/syncService';
import Navbar from '../components/Navbar';
import { 
  History as HistoryIcon, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  Filter,
  Sparkles,
  Target,
  Zap,
  Award,
  RefreshCw,
  Flame,
  Activity,
  ShieldCheck,
  Search,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const History = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'picks'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const picksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      picksData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      setPicks(picksData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore history error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      syncUserPicks(user.uid);
    }
  }, [user]);

  const filteredPicks = picks.filter(pick => {
    if (filter === 'all') return true;
    return pick.status === filter;
  });

  const stats = {
    total: picks.length,
    won: picks.filter(p => p.status === 'ganado').length,
    lost: picks.filter(p => p.status === 'perdido').length,
    pending: picks.filter(p => p.status === 'pendiente').length,
    winRate: picks.length > 0 ? ((picks.filter(p => p.status === 'ganado').length / (picks.filter(p => p.status !== 'pendiente').length || 1)) * 100).toFixed(1) : 0,
    profit: picks.reduce((acc, p) => {
      if (p.status === 'ganado') return acc + (Number(p.potentialWin) - Number(p.stake));
      if (p.status === 'perdido') return acc - Number(p.stake);
      return acc;
    }, 0).toFixed(2)
  };

  const teamPerformance = picks.reduce((acc, pick) => {
    if (pick.status === 'pendiente') return acc;
    const team = pick.team;
    if (!acc[team]) acc[team] = { name: team, wins: 0, losses: 0, profit: 0 };
    
    const pWin = Number(pick.potentialWin || 0);
    const pStake = Number(pick.stake || 0);
    
    if (pick.status === 'ganado') {
      acc[team].wins += 1;
      acc[team].profit += (pWin - pStake);
    } else if (pick.status === 'perdido') {
      acc[team].losses += 1;
      acc[team].profit -= pStake;
    }
    return acc;
  }, {});

  const sortedTeams = Object.values(teamPerformance).sort((a, b) => b.profit - a.profit);
  const talisman = sortedTeams.length > 0 && sortedTeams[0].profit > 0 ? sortedTeams[0] : null;
  const villano = sortedTeams.length > 0 ? [...sortedTeams].sort((a, b) => a.profit - b.profit)[0] : null;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ganado':
        return {
          bg: 'bg-green-500/10',
          text: 'text-green-400',
          border: 'border-green-500/20',
          icon: <CheckCircle2 size={16} />,
          label: 'GANADO'
        };
      case 'perdido':
        return {
          bg: 'bg-danger/10',
          text: 'text-danger',
          border: 'border-danger/20',
          icon: <XCircle size={16} />,
          label: 'PERDIDO'
        };
      case 'pendiente':
      default:
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          border: 'border-blue-500/20',
          icon: <Clock size={16} />,
          label: 'PENDIENTE'
        };
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ${theme === 'mlb' ? 'bg-[#000B1C]' : 'bg-[#050505]'} text-white pb-32 relative overflow-hidden`}>
      {/* ATMOSPHERIC DECOR */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-[0.07] ${theme === 'mlb' ? 'bg-secondary' : 'bg-primary'}`} />
         <div className={`absolute top-[40%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-[0.05] ${theme === 'mlb' ? 'bg-primary' : 'bg-secondary'}`} />
         <div className={`absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full blur-[120px] opacity-[0.03] ${theme === 'mlb' ? 'bg-secondary' : 'bg-white'}`} />
      </div>

      <Navbar />

      <div className="w-full flex justify-center mt-12 lg:mt-24 relative z-10">
        <main className="w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-10 md:gap-16 mb-20">
          
          {/* BROADCAST HEADER - ELITE DESIGN */}
          <div className="relative group">
             <div className={`absolute -inset-1 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 ${theme === 'mlb' ? 'bg-gradient-to-r from-danger via-secondary to-primary' : 'bg-white'}`}></div>
             <div className={`relative rounded-2xl p-8 sm:p-12 border border-white/10 overflow-hidden transition-all duration-500 ${theme === 'mlb' ? 'bg-gradient-to-br from-[#001E46] to-[#000B1C]' : 'bg-[#111111]'}`}>
                <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
                   <HistoryIcon size={250} />
                </div>
                <div className="relative z-10">
                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                      <div className="max-w-2xl">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="h-[1px] w-12 bg-secondary"></div>
                            <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">Performance Tracking</span>
                         </div>
                         <h1 className="text-xl font-black text-white tracking-tighter mb-4 uppercase italic leading-none">
                            HISTORIAL <span className={`text-transparent bg-clip-text ${theme === 'mlb' ? 'bg-gradient-to-r from-secondary to-primary' : 'bg-gradient-to-r from-white to-white/40'}`}>PERSONAL</span>
                         </h1>
                         <p className="text-[#A2AAAD] font-bold uppercase tracking-widest text-xs flex items-center gap-3">
                            <Calendar size={18} className="text-secondary" /> 
                            Registro completo de todas tus predicciones activas y finalizadas.
                         </p>
                      </div>

                      <div className="flex gap-8 border-t md:border-t-0 md:border-l border-white/10 pt-8 md:pt-0 md:pl-12">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Total Profit</span>
                            <span className={`text-xl font-sport italic tracking-tighter ${Number(stats.profit) >= 0 ? 'text-green-400' : 'text-danger'}`}>
                               {Number(stats.profit) >= 0 ? `+${stats.profit}` : stats.profit}U
                            </span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Accuracy</span>
                            <span className="text-xl font-sport italic tracking-tighter text-white">
                               {stats.winRate}%
                            </span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* PERFORMANCE CARDS: TALISMAN & VILLANO */}
          {(talisman || (villano && villano.profit < 0)) && (
            <div className="grid grid-cols-2 gap-3 md:gap-8">
                {talisman && (
                  <div className="relative group">
                     <div className={`absolute -inset-0.5 rounded-xl opacity-20 ${theme === 'mlb' ? 'bg-gradient-to-b from-green-500 to-transparent' : 'bg-gradient-to-b from-white/20 to-transparent'}`}></div>
                     <div className={`relative border border-white/10 rounded-xl p-5 overflow-hidden backdrop-blur-2xl transition-all duration-500 ${theme === 'mlb' ? 'bg-[#001229]/60' : 'bg-[#111111]/80'}`}>
                        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 rotate-12">
                           <Flame size={120} />
                        </div>
                        <div className="relative z-10 flex flex-col justify-between h-full min-h-[80px]">
                           <div>
                              <div className="flex items-center gap-3 mb-4">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${theme === 'mlb' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white border-white/10'}`}>
                                    <Award size={16} />
                                 </div>
                                 <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Tu Talismán</span>
                              </div>
                              <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-tighter mb-1 font-sport italic">
                                 {talisman.name}
                              </h3>
                           </div>
                           <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                              <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">+{Number(talisman.profit || 0).toFixed(1)}U Profit</span>
                              <div className="flex items-center gap-2">
                                 <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Victorias:</span>
                                 <span className="text-lg font-sport text-white">{talisman.wins}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

               {villano && villano.profit < 0 && (
                  <div className="relative group">
                     <div className={`absolute -inset-0.5 rounded-xl opacity-20 ${theme === 'mlb' ? 'bg-gradient-to-b from-danger to-transparent' : 'bg-gradient-to-b from-white/20 to-transparent'}`}></div>
                     <div className={`relative border border-white/10 rounded-xl p-5 overflow-hidden backdrop-blur-2xl transition-all duration-500 ${theme === 'mlb' ? 'bg-[#001229]/60' : 'bg-[#111111]/80'}`}>
                        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 rotate-12">
                           <TrendingDown size={120} />
                        </div>
                        <div className="relative z-10 flex flex-col justify-between h-full min-h-[80px]">
                           <div>
                              <div className="flex items-center gap-3 mb-4">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${theme === 'mlb' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-white/5 text-white border-white/10'}`}>
                                    <Zap size={16} />
                                 </div>
                                 <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Tu Villano</span>
                              </div>
                              <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-tighter mb-1 font-sport italic">
                                 {villano.name}
                              </h3>
                           </div>
                           <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                              <span className="text-[9px] font-black text-danger uppercase tracking-widest">{Number(villano.profit || 0).toFixed(1)}U Profit</span>
                              <div className="flex items-center gap-2">
                                 <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Derrotas:</span>
                                 <span className="text-lg font-sport text-white">{villano.losses}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
            </div>
          )}

          {/* LIST SECTION - ELITE CONTAINER */}
          <div className={`rounded-2xl border border-white/5 shadow-3xl overflow-hidden transition-all duration-500 ${theme === 'mlb' ? 'bg-[#001229]' : 'bg-[#111111]'}`}>
            <div className="px-10 py-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-black/10">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <Filter size={14} className="text-white/20" />
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Estado:</span>
                  </div>
                  <div className="flex gap-2">
                    {['all', 'ganado', 'perdido', 'pendiente'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${
                          filter === f 
                          ? `bg-white ${theme === 'mlb' ? 'text-[#002D72]' : 'text-black'}` 
                           : 'text-white/40 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {f === 'all' ? 'TODOS' : f}
                      </button>
                    ))}
                  </div>
               </div>
               
               <div className="flex items-center gap-6 pr-4">
                  <div className="flex flex-col items-end">
                     <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Total Picks</span>
                     <span className="text-xl font-sport text-white tracking-tighter leading-none">{stats.total}</span>
                  </div>
                  <div className="w-px h-8 bg-white/5" />
                  <div className="flex flex-col items-end">
                     <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Strike Rate</span>
                     <span className="text-xl font-sport text-emerald-400 tracking-tighter leading-none">{stats.winRate}%</span>
                  </div>
               </div>
            </div>

            <div className="overflow-x-auto overflow-y-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-black/20 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] border-b border-white/5">
                        <th className="px-10 py-6">Date</th>
                        <th className="px-10 py-6">Selection</th>
                        <th className="px-10 py-6 text-center">Odds</th>
                        <th className="px-10 py-6 text-center">Stake</th>
                        <th className="px-10 py-6 text-center">Outcome</th>
                        <th className="px-10 py-6 text-right">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                     {loading ? (
                        <tr>
                           <td colSpan="6" className="py-32">
                              <div className="flex flex-col items-center gap-6">
                                 <div className="w-12 h-12 border-2 border-white/5 border-t-secondary rounded-full animate-spin" />
                                 <p className="font-black uppercase tracking-[0.4em] text-white/20 text-[10px] animate-pulse">Syncing Blockchain Data...</p>
                              </div>
                           </td>
                        </tr>
                     ) : filteredPicks.length === 0 ? (
                        <tr>
                           <td colSpan="6" className="py-32 text-center">
                              <h3 className="font-sport text-xl text-white/20 uppercase italic">No se encontraron registros</h3>
                           </td>
                        </tr>
                     ) : (
                        filteredPicks.map((pick) => {
                           const style = getStatusStyle(pick.status);
                           const rawDate = pick.createdAt?.toDate ? pick.createdAt.toDate() : pick.createdAt;
                           const date = rawDate ? new Date(rawDate) : new Date(0);
                           
                           return (
                              <tr key={pick.id} className="group hover:bg-white/[0.02] transition-colors duration-300">
                                 <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                       <span className="font-sport text-white text-xs italic uppercase tracking-tighter">
                                          {date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                       </span>
                                       <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
                                          {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                       </span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                       <div className={`w-1 h-8 ${theme === 'mlb' ? 'bg-secondary' : 'bg-white/20'} group-hover:scale-y-125 transition-transform duration-500`} />
                                       <div className="flex flex-col">
                                          <span className="font-bold text-white text-[9px] uppercase tracking-tight group-hover:text-secondary transition-colors duration-300">
                                             {pick.team}
                                          </span>
                                          <span className="text-[8px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
                                             {pick.side === 'home' ? 'Local' : 'Visitante'}
                                          </span>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6 text-center">
                                    <span className="font-sport text-white text-xs italic">{pick.odds}</span>
                                 </td>
                                 <td className="px-8 py-6 text-center">
                                    <div className="flex flex-col items-center">
                                       <span className="font-bold text-white text-xs tracking-tighter">{pick.stake}U</span>
                                       <span className="text-[8px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Capital</span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6 text-center">
                                    <div className="flex flex-col items-center">
                                       {pick.status === 'ganado' ? (
                                          <span className="font-sport text-emerald-400 text-[10px] italic">+{pick.potentialWin}U</span>
                                       ) : pick.status === 'perdido' ? (
                                          <span className="font-sport text-danger text-[10px] italic">-{pick.stake}U</span>
                                       ) : (
                                          <span className="font-sport text-blue-400 text-[10px] italic">+{pick.potentialWin}U</span>
                                       )}
                                       <span className="text-[7px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
                                          {pick.status === 'pendiente' ? 'POTENCIAL' : 'FINAL'}
                                       </span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6 text-right">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border ${style.bg} ${style.border} ${style.text} transition-all duration-500 group-hover:scale-105`}>
                                       {style.icon}
                                       <span className="text-[9px] font-black tracking-widest uppercase">{style.label}</span>
                                    </div>
                                 </td>
                              </tr>
                           );
                        })
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default History;

