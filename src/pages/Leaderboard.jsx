import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createLeague, joinLeague, getUserLeagues } from '../services/leaguesService';
import { 
  Award, 
  TrendingUp, 
  User, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Star,
  Users,
  Plus,
  ArrowRight,
  Clipboard,
  X,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Leaderboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeLeagueId, setActiveLeagueId] = useState('global');
  const [userLeagues, setUserLeagues] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0); 
  const [weekRangeLabel, setWeekRangeLabel] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (user) {
      getUserLeagues(user.uid).then(setUserLeagues);
    }
  }, [user, activeLeagueId]);

  const [picksData, setPicksData] = useState([]);
  const [usersData, setUsersData] = useState([]);

  useEffect(() => {
    const q = collection(db, 'Users');
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsersData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Users sync error:", err));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = collection(db, 'picks');
    const unsubscribe = onSnapshot(q, (snap) => {
      setPicksData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Picks sync error:", err));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!usersData.length || !picksData.length) {
      if (loading && usersData.length > 0) {
        // We have users but maybe no picks yet? 
        // Let's not block forever if picksData is empty (might be no picks in DB)
      }
      if (usersData.length > 0 && !loading) {
        // already loaded once
      } else if (usersData.length > 0) {
        // loading state handled below
      }
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // START OF SELECTED WEEK (MONDAY 00:00)
    const targetMonday = new Date(now);
    const day = targetMonday.getDay();
    const diff = targetMonday.getDate() - day + (day === 0 ? -6 : 1) - (weekOffset * 7);
    targetMonday.setDate(diff);
    targetMonday.setHours(0, 0, 0, 0);
    const startOfWeekTime = targetMonday.getTime();

    // END OF SELECTED WEEK (SUNDAY 23:59)
    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);
    targetSunday.setHours(23, 59, 59, 999);
    const endOfWeekTime = targetSunday.getTime();

    // START OF CURRENT MONTH (ROLLING 30 DAYS)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTime = thirtyDaysAgo.getTime();
    
    const picksByUser = {};
    picksData.forEach(pick => {
      if (!pick.userId) return;
      if (!picksByUser[pick.userId]) {
        picksByUser[pick.userId] = { daily: 0, weekly: 0, monthly: 0, pending: 0 };
      }

      if (pick.status === 'pendiente') {
        picksByUser[pick.userId].pending += 1;
        return;
      }

      const pickDate = pick.createdAt?.toDate ? pick.createdAt.toDate().getTime() : (pick.createdAt?.seconds ? pick.createdAt.seconds * 1000 : 0);
      const isToday = pickDate >= startOfToday;
      const profit = pick.status === 'ganado' ? Number(pick.potentialWin || 0) : -Number(pick.stake || 0);

      if (!isNaN(profit)) {
        if (pickDate >= startOfWeekTime && pickDate <= endOfWeekTime) picksByUser[pick.userId].weekly += profit;
        if (pickDate >= thirtyDaysAgoTime) picksByUser[pick.userId].monthly += profit;
        if (isToday) picksByUser[pick.userId].daily += profit;
      }
    });

    const currentLeague = activeLeagueId !== 'global' ? userLeagues.find(l => l.id === activeLeagueId) : null;
    const membersToShow = currentLeague ? currentLeague.members : null;

    const finalData = [];
    usersData.forEach(u => {
      if (membersToShow && !membersToShow.includes(u.id)) return;

      const stats = picksByUser[u.id] || { daily: 0, weekly: 0, monthly: 0, pending: 0 };
      const safeEmail = u.email || 'user@anonymous.com';
      
      finalData.push({
        id: u.id,
        displayName: u.displayName || safeEmail.split('@')[0],
        role: u.role,
        bankroll: Number(u.bankroll || 0),
        dailyProfit: Number((stats.daily || 0).toFixed(2)),
        weeklyProfit: Number((stats.weekly || 0).toFixed(2)),
        monthlyProfit: Number((stats.monthly || 0).toFixed(2)),
        pendingPicks: stats.pending || 0
      });
    });

    setLeaderboardData(finalData);

    // Update Label
    const mondayLabel = new Date(targetMonday);
    const sundayLabel = new Date(targetSunday);
    const options = { month: 'short', day: 'numeric' };
    setWeekRangeLabel(`${mondayLabel.toLocaleDateString('es-ES', options)} - ${sundayLabel.toLocaleDateString('es-ES', options)}`);

    if (loading && usersData.length > 0) setLoading(false);
  }, [usersData, picksData, activeLeagueId, userLeagues, weekOffset]);

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    if (!newLeagueName || !user) return;
    try {
      await createLeague(user.uid, newLeagueName);
      setNewLeagueName('');
      setShowCreateModal(false);
    } catch (err) { alert(err.message); }
  };

  const handleJoinLeague = async (e) => {
    e.preventDefault();
    if (!joinCode || !user) return;
    try {
      await joinLeague(user.uid, joinCode);
      setJoinCode('');
      setShowJoinModal(false);
    } catch (err) { alert(err.message); }
  };

  return (
    <div className={`min-h-screen transition-all duration-700 pb-40 ${theme === 'mlb' ? 'bg-[#001E46]' : 'bg-[#0A0A0A]'}`}>
      <Navbar />
      
      <div className="w-full flex justify-center mt-8 lg:mt-12 pb-32">
        <main className="w-full px-4 max-w-7xl lg:px-8">
          
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden mb-12 flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-3xl border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-secondary rotate-12">
               <Award size={160} />
            </div>

            <div className="flex flex-col relative z-10">
              <div className="flex items-center justify-center md:justify-start gap-3 text-secondary font-black uppercase tracking-[0.3em] text-[8px] md:text-[10px] mb-3">
                <ShieldCheck size={14} className="fill-current" /> Official Pro Rankings
              </div>
              <h1 className="font-sport text-3xl md:text-6xl text-white tracking-tighter mb-2 uppercase italic leading-none text-center md:text-left">
                Hall of Fame
              </h1>
              <p className="text-white/40 font-black flex items-center justify-center md:justify-start gap-2 text-[8px] md:text-[10px] uppercase tracking-widest">
                <Calendar size={14} className="text-secondary" /> 
                Auditoría en Vivo • Últimos 7 Días
              </p>
            </div>
            
            <div className="flex gap-4 relative z-10">
               <button 
                 onClick={() => setShowJoinModal(true)}
                 className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border ${theme === 'mlb' ? 'bg-white/5 text-white hover:bg-white/10 border-white/10' : 'bg-white/5 text-white hover:bg-white/10 border-white/10'}`}
               >
                 <Plus size={16} /> Unirme a Liga
               </button>
               <button 
                 onClick={() => setShowCreateModal(true)}
                 className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl ${theme === 'mlb' ? 'bg-secondary text-white border-secondary shadow-secondary/20' : 'bg-white text-black border-white shadow-white/10'}`}
               >
                 <Users size={16} /> Crear Liga
               </button>
            </div>
          </motion.header>

          {/* LEAGUE SELECTOR */}
          <div className="flex items-center gap-4 mb-12 overflow-x-auto no-scrollbar pb-2">
             <button 
               onClick={() => setActiveLeagueId('global')}
               className={`px-8 py-3.5 rounded-2xl font-sport text-xs tracking-[0.2em] transition-all duration-500 whitespace-nowrap border italic ${
                 activeLeagueId === 'global' 
                 ? (theme === 'mlb' ? 'bg-secondary border-secondary text-white shadow-2xl shadow-secondary/20' : 'bg-white border-white text-black shadow-2xl shadow-white/10') 
                 : 'bg-black/20 text-white/20 border-white/5 hover:border-white/20'
               }`}
             >
               RANKING GLOBAL
             </button>
             
             {userLeagues.map(league => (
               <button 
                 key={league.id}
                 onClick={() => setActiveLeagueId(league.id)}
                 className={`px-8 py-3.5 rounded-2xl font-sport text-xs tracking-[0.2em] transition-all duration-500 whitespace-nowrap flex items-center gap-3 border italic ${
                   activeLeagueId === league.id 
                   ? (theme === 'mlb' ? 'bg-secondary/20 border-secondary text-secondary shadow-2xl' : 'bg-white/10 border-white text-white shadow-2xl') 
                   : 'bg-black/20 text-white/20 border-white/5 hover:border-white/20'
                 }`}
               >
                 <Users size={16} /> {league.name.toUpperCase()}
               </button>
             ))}
          </div>

          <AnimatePresence mode="wait">
            {activeLeagueId !== 'global' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`border p-6 rounded-3xl mb-12 flex flex-col sm:flex-row justify-between items-center gap-6 transition-all duration-500 ${theme === 'mlb' ? 'bg-[#00142D] border-secondary/20' : 'bg-[#111111] border-white/10'}`}
              >
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary border border-secondary/20 shadow-inner">
                       <Clipboard size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">CÓDIGO DE INVITACIÓN</p>
                       <p className="text-3xl font-sport text-white italic leading-none mt-1 tracking-tighter">
                         {userLeagues.find(l => l.id === activeLeagueId)?.code}
                       </p>
                    </div>
                 </div>
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(userLeagues.find(l => l.id === activeLeagueId)?.code);
                     alert('¡Código copiado!');
                   }}
                   className={`h-14 px-10 rounded-2xl text-[10px] font-black tracking-[0.3em] transition-all duration-500 ${theme === 'mlb' ? 'bg-secondary text-white' : 'bg-white text-black'}`}
                 >
                   COPIAR CÓDIGO
                 </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
            {/* WEEKLY TABLE */}
            <div className="flex flex-col gap-6">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                       <TrendingUp size={16} className="text-emerald-400" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-sport text-xl text-white italic uppercase tracking-tighter">Ranking Semanal</h3>
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{weekRangeLabel}</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
                     <button 
                       onClick={() => setWeekOffset(prev => prev + 1)}
                       className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
                       title="Semana Anterior"
                     >
                        <ArrowRight size={14} className="rotate-180" />
                     </button>
                     <span className="px-3 text-[9px] font-black text-secondary uppercase tracking-widest min-w-[100px] text-center">
                        {weekOffset === 0 ? 'SEMANA ACTUAL' : `HACE ${weekOffset} SEMANAS`}
                     </span>
                     <button 
                       disabled={weekOffset === 0}
                       onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                       className={`p-2 rounded-lg transition-all ${weekOffset === 0 ? 'opacity-0' : 'hover:bg-white/5 text-white/40 hover:text-white'}`}
                       title="Semana Siguiente"
                     >
                        <ArrowRight size={14} />
                     </button>
                  </div>
               </div>

               <div className="space-y-4">
                  {[...leaderboardData].sort((a, b) => b.weeklyProfit - a.weeklyProfit).map((u, index) => (
                    <motion.div 
                      key={`weekly-${u.id}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`grid grid-cols-12 items-center gap-3 px-4 py-4 rounded-2xl border transition-all duration-500 ${
                        index === 0 ? 'bg-secondary/10 border-secondary/30 shadow-lg' : 'bg-black/20 border-white/[0.03]'
                      }`}
                    >
                      <div className="col-span-1 font-sport text-xs text-white/40">{index + 1}</div>
                      <div className="col-span-5 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt="" className="w-full h-full object-cover" />
                         </div>
                         <div className="flex flex-col min-w-0">
                            <span className="font-sport text-sm text-white italic truncate uppercase leading-none mb-1">{u.displayName}</span>
                            <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">{u.role || 'PRO'}</span>
                         </div>
                      </div>
                      <div className="col-span-3 text-center">
                         <span className={`font-sport text-base italic ${u.weeklyProfit > 0 ? 'text-emerald-400' : 'text-white/20'}`}>
                           {u.weeklyProfit > 0 ? `+${u.weeklyProfit}` : u.weeklyProfit}U
                         </span>
                      </div>
                      <div className="col-span-3 text-right">
                         <span className="font-sport text-sm text-white/60 italic">{u.bankroll}U</span>
                      </div>
                    </motion.div>
                  ))}
               </div>
            </div>

            {/* MONTHLY TABLE */}
            <div className="flex flex-col gap-6">
               <div className="flex items-center gap-4 px-4">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                     <Calendar size={16} className="text-blue-400" />
                  </div>
                  <h3 className="font-sport text-xl text-white italic uppercase tracking-tighter">Ranking Mensual</h3>
               </div>

               <div className="space-y-4">
                  {[...leaderboardData].sort((a, b) => b.monthlyProfit - a.monthlyProfit).map((u, index) => (
                    <motion.div 
                      key={`monthly-${u.id}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`grid grid-cols-12 items-center gap-3 px-4 py-4 rounded-2xl border transition-all duration-500 ${
                        index === 0 ? 'bg-blue-500/10 border-blue-500/30 shadow-lg' : 'bg-black/20 border-white/[0.03]'
                      }`}
                    >
                      <div className="col-span-1 font-sport text-xs text-white/40">{index + 1}</div>
                      <div className="col-span-5 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt="" className="w-full h-full object-cover" />
                         </div>
                         <div className="flex flex-col min-w-0">
                            <span className="font-sport text-sm text-white italic truncate uppercase leading-none mb-1">{u.displayName}</span>
                            <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">{u.role || 'PRO'}</span>
                         </div>
                      </div>
                      <div className="col-span-3 text-center">
                         <span className={`font-sport text-base italic ${u.monthlyProfit > 0 ? 'text-blue-400' : 'text-white/20'}`}>
                           {u.monthlyProfit > 0 ? `+${u.monthlyProfit}` : u.monthlyProfit}U
                         </span>
                      </div>
                      <div className="col-span-3 text-right">
                         <span className="font-sport text-sm text-white/60 italic">{u.bankroll}U</span>
                      </div>
                    </motion.div>
                  ))}
               </div>
            </div>
          </div>

          {loading && (
             <div className="py-40 flex flex-col items-center gap-6">
               <div className="relative">
                  <div className="w-20 h-20 border-4 border-white/5 border-t-secondary rounded-full animate-spin" />
                  <Activity size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-secondary animate-pulse" />
               </div>
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] animate-pulse">Sincronizando Ranking Elite...</p>
             </div>
          )}
        </main>
      </div>

      {/* MODALS (Simplified for Elite Look) */}
      <AnimatePresence>
        {(showCreateModal || showJoinModal) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
             <motion.div 
               initial={{ scale: 0.95, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.95, y: 20 }}
               className={`rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-3xl border border-white/5 ${theme === 'mlb' ? 'bg-[#00142D]' : 'bg-[#111111]'}`}
             >
                <div className={`p-8 flex justify-between items-center border-b border-white/[0.05] ${theme === 'mlb' ? 'bg-secondary text-white' : 'bg-white text-black'}`}>
                   <h3 className="font-sport text-xl uppercase tracking-tighter italic">{showCreateModal ? 'Crear Nueva Liga Elite' : 'Unirme a una Liga'}</h3>
                   <button onClick={() => { setShowCreateModal(false); setShowJoinModal(false); }} className="hover:rotate-90 transition-all duration-300"><X size={28} /></button>
                </div>
                
                <form onSubmit={showCreateModal ? handleCreateLeague : handleJoinLeague} className="p-10 space-y-8">
                   <div>
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 block">{showCreateModal ? 'NOMBRE DE LA LIGA' : 'CÓDIGO DE INVITACIÓN'}</label>
                      <input 
                        autoFocus
                        type="text" 
                        value={showCreateModal ? newLeagueName : joinCode}
                        onChange={(e) => showCreateModal ? setNewLeagueName(e.target.value) : setJoinCode(e.target.value)}
                        placeholder={showCreateModal ? "Ej: LOS EXPERTOS" : "FS-XXXXX"}
                        className={`w-full bg-black/40 border border-white/10 rounded-2xl h-20 px-8 font-sport text-3xl tracking-tighter text-white placeholder:text-white/5 focus:border-secondary transition-all outline-none ${!showCreateModal && 'text-center tracking-[0.3em] uppercase'}`}
                      />
                   </div>
                   <button className={`h-20 w-full rounded-2xl text-[12px] font-black tracking-[0.4em] shadow-2xl transition-all duration-500 ${theme === 'mlb' ? 'bg-secondary text-white' : 'bg-white text-black'}`}>
                      {showCreateModal ? 'CREAR Y GENERAR ACCESO' : 'VALIDAR Y UNIRME'}
                   </button>
                </form>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Leaderboard;
