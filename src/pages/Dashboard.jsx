import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where, doc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { fetchMLBGames } from '../services/mlbApi';
import { syncUserPicks } from '../services/syncService';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import GameCard from '../components/GameCard';
import BetSlip from '../components/BetSlip';
import AiGuruDrawer from '../components/AiGuruDrawer';
import MatchupModal from '../components/MatchupModal';
import RecommendationModal from '../components/RecommendationModal';
import DepositModal from '../components/DepositModal';
import { GameSkeleton, WidgetSkeleton } from '../components/SkeletonLoaders';
import MissionWidget from '../components/MissionWidget';
import { FollowExpertsWidget } from '../components/FollowExpertsWidget';
import { 
  DailyRecommendation, 
  Top3Tipsters, 
  Top5Strikeouts 
} from '../components/DashboardWidgets';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Brain,
  Zap,
  Activity,
  Award,
  TrendingDown,
  Sparkles,
  Target,
  Clock,
  Wallet,
  LayoutDashboard,
  Calculator
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  console.log("Dashboard component rendering...");
  const { user, userData } = useAuth();
  const { theme } = useTheme();
  const [dateIndex, setDateIndex] = useState(0);
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [cart, setCart] = useState([]);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isMatchupOpen, setIsMatchupOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [dailyPicksCount, setDailyPicksCount] = useState(0);
  const [adminOdds, setAdminOdds] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [userWeeklyStats, setUserWeeklyStats] = useState({ profit: 0, winRate: 0, count: 0 });
  const [recommendation, setRecommendation] = useState(null);
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [usdtWallet, setUsdtWallet] = useState('');

  useEffect(() => {
    if (userData || (user && !userData)) setLoadingUser(false);
  }, [userData, user]);

  const generateDateLabels = () => {
    const labels = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(d);
      labels.push(`${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${d.getDate()}`);
    }
    return labels;
  };

  const dateLabels = generateDateLabels();
  const getDateForIndex = (idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    let isMounted = true;
    const loadGames = async () => {
      setLoadingGames(true);
      try {
        const dateStr = getDateForIndex(dateIndex);
        const fetched = await Promise.race([
          fetchMLBGames(dateStr),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de conexión a MLB API')), 10000))
        ]);
        if (isMounted) setGames(fetched || []);
      } catch (err) {
        console.error("Games fetch error:", err);
        if (isMounted) {
          setGames([]);
          toast.error("Error al cargar juegos: " + err.message);
        }
      } finally {
        if (isMounted) setLoadingGames(false);
      }
    };
    loadGames();
    return () => { isMounted = false; };
  }, [dateIndex]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'game_odds'), 
      (snap) => {
        const map = {};
        snap.forEach(doc => map[doc.id] = doc.data());
        setAdminOdds(map);
      },
      (err) => {
        console.error("Odds Snapshot Error:", err);
        toast.error("Error en tiempo real de cuotas.");
      }
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const unsubPicks = onSnapshot(query(collection(db, 'picks'), where('userId', '==', user.uid)), 
      (snap) => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        
        let todayCount = 0;
        let wins = 0, total = 0, profit = 0;

        snap.forEach(d => {
          const data = d.data();
          if (!data.createdAt) return;
          const pickDate = data.createdAt.toDate ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime();
          
          if (pickDate >= startOfToday) todayCount++;
          if (pickDate >= sevenDaysAgo) {
            total++;
            const p = data.status === 'ganado' ? (Number(data.potentialWin) - Number(data.stake)) : data.status === 'perdido' ? -Number(data.stake) : 0;
            profit += p;
            if (data.status === 'ganado') wins++;
          }
        });
        
        setDailyPicksCount(todayCount);
        setUserWeeklyStats({ profit: Number(profit.toFixed(2)), winRate: total > 0 ? Math.round((wins / total) * 100) : 0, count: total });
      },
      (err) => {
        console.error("Picks Snapshot Error:", err);
      }
    );

    return () => unsubPicks();
  }, [user]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'Users'), 
      (snap) => {
        setLeaderboard(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => (b.weeklyProfit || 0) - (a.weeklyProfit || 0)));
      },
      (err) => console.error("Users Snapshot Error:", err)
    );
    const unsubRec = onSnapshot(doc(db, 'settings', 'daily_recommendation'), s => s.exists() && setRecommendation(s.data()));
    const unsubWallet = onSnapshot(doc(db, 'settings', 'payment_info'), s => s.exists() && setUsdtWallet(s.data().usdt_wallet_address || ''));
    
    return () => { unsubUsers(); unsubRec(); unsubWallet(); };
  }, []);

  useEffect(() => { 
    if (user?.uid) {
      syncUserPicks(user.uid).catch(e => console.error("Sync error:", e)); 
    }
  }, [user]);

  const togglePick = async (gamePk, team, odds, side, guruMeta = null) => {
    setCart(prev => {
      const exists = prev.find(item => item.gamePk === gamePk);
      if (exists) {
        if (exists.team === team && !!exists.guruMeta === !!guruMeta) return prev.filter(i => i.gamePk !== gamePk);
        return prev.map(i => i.gamePk === gamePk ? { gamePk, team, odds, side, guruMeta } : i);
      }
      if (prev.length + dailyPicksCount >= 5) {
        toast.error('Límite alcanzado: Máximo 5 picks por día.');
        return prev;
      }
      return [...prev, { gamePk, team, odds, side, guruMeta }];
    });

    if (userData?.role === 'admin' && guruMeta) {
      try {
        const docId = `${gamePk}_${guruMeta.type}_${side || 'total'}`;
        const ref = doc(db, 'guru_picks', docId);
        
        await setDoc(ref, {
          gamePk: gamePk.toString(),
          gameDate: getDateForIndex(dateIndex),
          team: team,
          type: (guruMeta.type || 'unknown').toLowerCase(),
          side: side || 'total',
          pick: guruMeta.target || null,
          guruConfidence: guruMeta.conf,
          guruPropType: guruMeta.type,
          status: 'pendiente',
          createdAt: serverTimestamp()
        });
        toast.success("¡Pick publicado automáticamente en el Historial del Gurú!");
      } catch (err) {
        console.error("Error al publicar pick automático:", err);
      }
    }
  };

  const handlePlaceBets = async (finalBets) => {
    if (!user) return;
    setIsPlacing(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'Users', user.uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("¡El usuario no existe!");
        let currentBankroll = Number(userSnap.data().bankroll || 0);
        const totalStake = finalBets.reduce((acc, b) => acc + b.stake, 0);
        if (currentBankroll < totalStake) throw new Error("Fondos insuficientes");
        
        for (const bet of finalBets) {
          const pickRef = doc(collection(db, 'picks'));
          transaction.set(pickRef, {
            userId: user.uid, gamePk: bet.gamePk.toString(), team: bet.team, odds: bet.odds, stake: Number(bet.stake),
            potentialWin: Number(bet.toWin), status: 'pendiente', createdAt: serverTimestamp(),
            ...(bet.guruMeta && { isGuruPick: true, guruConfidence: bet.guruMeta.conf, guruPropType: bet.guruMeta.type, guruTarget: bet.guruMeta.target })
          });
          currentBankroll -= bet.stake;
        }
        transaction.update(userRef, { bankroll: Number(currentBankroll.toFixed(2)) });
      });
      toast.success('¡Picks realizados con éxito!');
      setCart([]);
      setIsSlipOpen(false);
    } catch (e) { toast.error('Error: ' + (e.message || e)); }
    finally { setIsPlacing(false); }
  };

  return (
    <div className={`min-h-screen transition-colors duration-700 ${theme === 'mlb' ? 'bg-[#001532]' : 'bg-[#050505]'} text-white pb-32`}>
      <Navbar />

      <div className="w-full flex justify-center mt-12 lg:mt-24">
        <main className="w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-16 mb-20">
          
          {/* BROADCAST HEADER - ELITE DESIGN */}
          <div className="relative group">
             <div className={`absolute -inset-1 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 ${theme === 'mlb' ? 'bg-gradient-to-r from-danger via-secondary to-primary' : 'bg-white'}`}></div>
             <div className={`relative rounded-2xl p-10 sm:p-16 border border-white/5 overflow-hidden transition-all duration-500 ${theme === 'mlb' ? 'bg-[#001E46]' : 'bg-[#111111]'}`}>
                <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
                   <LayoutDashboard size={250} />
                </div>
                <div className="relative z-10">
                   <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                      <div className="max-w-2xl">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="h-[1px] w-12 bg-secondary"></div>
                            <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">Operational Dashboard</span>
                         </div>
                         <h1 className="text-xl font-black text-white tracking-tighter mb-4 uppercase italic leading-none">
                            CONTROL <span className={`text-transparent bg-clip-text ${theme === 'mlb' ? 'bg-gradient-to-r from-secondary to-primary' : 'bg-gradient-to-r from-white to-white/40'}`}>PRINCIPAL</span>
                         </h1>
                         <div className="flex flex-wrap gap-4 mt-8">
                            <div className="bg-black/20 backdrop-blur-md px-6 py-3 rounded-xl border border-white/5">
                               <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Bankroll</p>
                               <div className="flex items-baseline gap-2">
                                  <span className="text-xl font-sport italic text-emerald-400">{userData?.bankroll || 0}</span>
                                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Units</span>
                               </div>
                            </div>
                            <div className="bg-black/20 backdrop-blur-md px-6 py-3 rounded-xl border border-white/5">
                               <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Weekly Profit</p>
                               <span className={`text-xl font-sport italic ${userWeeklyStats.profit >= 0 ? 'text-emerald-400' : 'text-danger'}`}>
                                  {userWeeklyStats.profit > 0 ? '+' : ''}{userWeeklyStats.profit}U
                               </span>
                            </div>
                            <div className="bg-black/20 backdrop-blur-md px-6 py-3 rounded-xl border border-white/5">
                               <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Daily Limit</p>
                               <span className="text-xl font-sport italic text-blue-400">
                                  {dailyPicksCount}/5
                               </span>
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full lg:w-auto">
                         <button 
                           onClick={() => setIsAiOpen(true)} 
                           className={`group relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl transition-all duration-500 shadow-2xl active:scale-95 border border-white/10 overflow-hidden ${theme === 'mlb' ? 'bg-secondary text-white' : 'bg-white text-black'}`}
                         >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <Brain size={24} className="mb-3 group-hover:scale-110 transition-transform" />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] italic text-center">Launch Guru</span>
                         </button>

                         <button 
                           onClick={() => setIsRecModalOpen(true)} 
                           className="group relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 text-white transition-all duration-500 hover:bg-white/10 hover:border-white/20 shadow-xl active:scale-95"
                         >
                            <Activity size={20} className="mb-3 text-secondary group-hover:rotate-12 transition-transform" />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] italic text-center">Analytics Pro</span>
                         </button>

                         <Link 
                           to="/calculator" 
                           className="group relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary transition-all duration-500 hover:bg-secondary/20 shadow-xl active:scale-95"
                         >
                            <Calculator size={20} className="mb-3 group-hover:-translate-y-1 transition-transform" />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] italic text-center">Calculadora</span>
                         </Link>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             {/* MAIN BOARD */}
             <div className="lg:col-span-9 flex flex-col gap-8">
                {/* DATE SELECTOR */}
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className={`flex items-center p-1 rounded-xl border border-white/5 transition-all duration-500 ${theme === 'mlb' ? 'bg-[#001E46]' : 'bg-[#111111]'}`}>
                         <button onClick={() => setDateIndex(prev => Math.max(0, prev - 1))} className="p-3 text-white/40 hover:text-white transition-colors"><ChevronLeft size={20} /></button>
                         <div className="px-6 text-xs font-black uppercase tracking-[0.2em] text-white italic">{dateLabels[dateIndex]}</div>
                         <button onClick={() => setDateIndex(prev => Math.min(4, prev + 1))} className="p-3 text-white/40 hover:text-white transition-colors"><ChevronRight size={20} /></button>
                      </div>
                      <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                         <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Live Feed Active</span>
                      </div>
                   </div>
                </div>

                <div className={`rounded-2xl border border-white/5 shadow-3xl overflow-hidden transition-all duration-500 ${theme === 'mlb' ? 'bg-[#001229]' : 'bg-[#111111]'}`}>
                   <div className="p-8 border-b border-white/5 bg-black/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Target size={18} className="text-secondary" />
                         <h3 className="font-sport text-lg text-white italic uppercase tracking-widest">Market Feed</h3>
                      </div>
                   </div>
                   <div className="flex flex-col">
                      {loadingGames ? <div className="p-12"><GameSkeleton /></div> : games.length === 0 ? <div className="p-20 text-center"><h3 className="font-sport text-xl text-white/20 uppercase italic">No se detectaron juegos para hoy</h3></div> : (
                         <div className="divide-y divide-white/[0.02]">
                            {games.map((game) => (
                              <GameCard 
                                key={game.gamePk} 
                                game={game} 
                                adminOdds={adminOdds[game.gamePk.toString()]} 
                                onPick={togglePick} 
                                selectedSide={cart.find(i => i.gamePk === game.gamePk)?.side} 
                                onOpenAnalysis={(g) => { setSelectedGame(g); setIsMatchupOpen(true); }} 
                                theme={theme}
                              />
                            ))}
                         </div>
                      )}
                   </div>
                </div>
             </div>

             {/* SIDEBAR WIDGETS */}
             <aside className="lg:col-span-3 flex flex-col gap-8">
                {loadingUser ? <WidgetSkeleton /> : (
                  <>
                    <MissionWidget theme={theme} />
                    <FollowExpertsWidget theme={theme} />
                    <DailyRecommendation recommendation={recommendation} onOpen={() => setIsRecModalOpen(true)} theme={theme} />
                    <Top3Tipsters leaderboardData={leaderboard} theme={theme} />
                    <Top5Strikeouts theme={theme} />
                  </>
                )}
             </aside>
          </div>
        </main>
      </div>

      {cart.length > 0 && (
        <button 
          onClick={() => setIsSlipOpen(true)} 
          className={`fixed bottom-28 md:bottom-10 right-6 md:right-10 w-14 h-14 md:w-16 md:h-16 rounded-full ${theme === 'mlb' ? 'bg-secondary' : 'bg-white text-black'} shadow-3xl flex items-center justify-center z-50 transition-all hover:scale-110 active:scale-95 group border-2 border-white/10`}
        >
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-white text-black rounded-full text-[10px] flex items-center justify-center font-black border-2 border-secondary group-hover:rotate-12 transition-transform">{cart.length}</div>
          <Zap size={24} className="md:size-[28px]" />
        </button>
      )}

      <BetSlip isOpen={isSlipOpen} onClose={() => setIsSlipOpen(false)} cart={cart} onRemove={(id) => setCart(prev => prev.filter(i => i.gamePk !== id))} onPlaceBets={handlePlaceBets} isPlacing={isPlacing} bankroll={userData?.bankroll || 0} />
      <AiGuruDrawer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} dateIndex={dateIndex} onAddPick={togglePick} adminOdds={adminOdds} cart={cart} theme={theme} />
      <MatchupModal isOpen={isMatchupOpen} onClose={() => setIsMatchupOpen(false)} game={selectedGame} date={getDateForIndex(dateIndex)} onAddPick={togglePick} adminOdds={adminOdds} cart={cart} theme={theme} />
      <RecommendationModal isOpen={isRecModalOpen} onClose={() => setIsRecModalOpen(false)} recommendation={recommendation} theme={theme} />
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} walletAddress={usdtWallet} user={user} theme={theme} />
    </div>
  );
};

export default Dashboard;
