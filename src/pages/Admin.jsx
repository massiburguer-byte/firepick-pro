import React, { useState, useEffect } from 'react';
import { initializeApp, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, firebaseConfig } from '../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, writeBatch, runTransaction, where, setDoc, Timestamp, limit, serverTimestamp, orderBy, increment } from 'firebase/firestore';
import { fetchMLBGames, getTeamLogo } from '../services/mlbApi';
import { updateStreak } from '../services/winStreakService';
import { getAiInsights } from '../services/aiService';
import { syncGuruPicks } from '../services/syncService';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';
import { 
  ShieldCheck, 
  Calendar, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  TrendingUp, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Users,
  Plus,
  Star,
  Wallet,
  Activity,
  History,
  Trophy,
  Brain,
  Target,
  UserPlus,
  Mail,
  Lock,
  Zap,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Admin = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('lines');
  const [initialBankroll, setInitialBankroll] = useState(750);
  const [dailyHitRate, setDailyHitRate] = useState(60);
  const [dailyGames, setDailyGames] = useState(15);
  const [dailyStake, setDailyStake] = useState(3);
  const [dailyJournal, setDailyJournal] = useState([]);
  const [inverseGoal, setInverseGoal] = useState(100);
  const [inverseHitRate, setInverseHitRate] = useState(60);
  const [inverseGames, setInverseGames] = useState(105);
  const [inverseResults, setInverseResults] = useState({ bankroll: 0, stake: 0 });
  const [games, setGames] = useState([]);
  const [adminOdds, setAdminOdds] = useState({});
  const [tempOdds, setTempOdds] = useState({});
  const [users, setUsers] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({});
  const [lineHistory, setLineHistory] = useState([]);
  
  const [recommendation, setRecommendation] = useState({
    team: '',
    pick: '',
    tipster: '',
    analysis: '',
    updatedAt: null
  });
  const [usdtWallet, setUsdtWallet] = useState('');
  const [depositRequests, setDepositRequests] = useState([]);
  const [pendingPicks, setPendingPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      const mlbGames = await fetchMLBGames(selectedDate);
      setGames(mlbGames);
      setLoading(false);
    };
    loadGames();

    const unsubscribeOdds = onSnapshot(collection(db, 'game_odds'), (snaps) => {
      const oddsMap = {};
      snaps.forEach(d => oddsMap[d.id] = d.data());
      setAdminOdds(oddsMap);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'Users'), (snaps) => {
      const usersData = [];
      snaps.forEach(d => {
        const data = d.data();
        usersData.push({ 
          id: d.id, 
          ...data,
          bankroll: Number(data.bankroll || 0),
          picksUsed: Number(data.picksUsed || 0)
        });
      });
      setUsers(usersData);
    });

    const qPicks = query(collection(db, 'picks'), where('status', '==', 'pendiente'));
    const unsubscribePicks = onSnapshot(qPicks, (snaps) => {
      const picksData = [];
      snaps.forEach(d => picksData.push({ id: d.id, ...d.data() }));
      setPendingPicks(picksData);
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const qPerf = query(
      collection(db, 'picks'),
      where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo))
    );
    const unsubscribePerf = onSnapshot(qPerf, (snaps) => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      // START OF CURRENT WEEK (MONDAY 00:00)
      const monday = new Date(now);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      const startOfWeekTime = monday.getTime();

      const stats = {};
      
      snaps.forEach(doc => {
        const pick = doc.data();
        if (pick.status === 'pendiente') return;
        
        if (!stats[pick.userId]) stats[pick.userId] = { daily: 0, weekly: 0, monthly: 0, pending: 0 };
        
        const pickDate = pick.createdAt?.toDate ? pick.createdAt.toDate().getTime() : (pick.createdAt?.seconds ? pick.createdAt.seconds * 1000 : 0);
        const profit = pick.status === 'ganado' ? Number(pick.potentialWin || 0) : -Number(pick.stake || 0);
        
        if (!isNaN(profit)) {
          if (pickDate >= startOfWeekTime) stats[pick.userId].weekly += profit;
          if (pickDate >= startOfToday) stats[pick.userId].daily += profit;
        }
      });
      setWeeklyStats(stats);
    });

    const qHistory = query(collection(db, 'line_history'), orderBy('updatedAt', 'desc'), limit(100));
    const unsubscribeHistory = onSnapshot(qHistory, (snaps) => {
      const historyList = [];
      snaps.forEach(d => historyList.push({ id: d.id, ...d.data() }));
      setLineHistory(historyList);
    });

    const unsubscribeRec = onSnapshot(doc(db, 'settings', 'daily_recommendation'), (snap) => {
      if (snap.exists()) setRecommendation(prev => ({ ...prev, ...snap.data() }));
    });

    const unsubscribeWallet = onSnapshot(doc(db, 'settings', 'payment_info'), (snap) => {
      if (snap.exists()) setUsdtWallet(snap.data().usdt_wallet_address || '');
    });

    const unsubscribeJournal = onSnapshot(doc(db, 'settings', 'admin_journal'), (snap) => {
      if (snap.exists()) setDailyJournal(snap.data().entries || []);
    });

    const qRequests = query(collection(db, 'deposit_requests'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeRequests = onSnapshot(qRequests, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setDepositRequests(list);
    });

    return () => {
      unsubscribeOdds();
      unsubscribeUsers();
      unsubscribePicks();
      unsubscribePerf();
      unsubscribeHistory();
      unsubscribeRec();
      unsubscribeWallet();
      unsubscribeRequests();
    };
  }, [selectedDate]);

  const saveRecommendation = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'daily_recommendation'), {
        ...recommendation,
        updatedAt: serverTimestamp()
      });
      toast.success('¡Pick Maestro actualizado!');
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
    setLoading(false);
  };

  const saveWallet = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'payment_info'), {
        usdt_wallet_address: usdtWallet,
        updatedAt: serverTimestamp()
      });
      toast.success('¡Billetera USDT actualizada!');
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
    setLoading(false);
  };

  const approveDeposit = async (request) => {
    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const requestRef = doc(db, 'deposit_requests', request.id);
        const userRef = doc(db, 'Users', request.userId);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) throw new Error("Usuario no encontrado");

        transaction.update(requestRef, {
          status: 'completado',
          updatedAt: serverTimestamp()
        });

        transaction.update(userRef, {
          bankroll: increment(100),
          picksUsed: 0
        });
      });
      toast.success('Solicitud completada. Se han recargado 100U automáticamente.');
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
    setLoading(false);
  };

  const handleTempOddChange = (gamePk, type, value) => {
    setTempOdds(prev => ({
      ...prev,
      [gamePk]: {
        ...(prev[gamePk] || { 
          h: adminOdds[gamePk.toString()]?.h_odds || '', 
          a: adminOdds[gamePk.toString()]?.a_odds || '' 
        }),
        [type]: value
      }
    }));
  };

  const saveAllOdds = async () => {
    setLoading(true);
    const batch = writeBatch(db);
    let count = 0;
    
    Object.entries(tempOdds).forEach(([gamePk, odds]) => {
      if (odds.h !== '' && odds.a !== '') {
        const game = games.find(g => g.gamePk.toString() === gamePk);
        const ref = doc(db, 'game_odds', gamePk.toString());
        batch.set(ref, {
          h_odds: Number(odds.h),
          a_odds: Number(odds.a),
          status: 'open',
          updatedAt: serverTimestamp()
        });

        const historyRef = doc(collection(db, 'line_history'));
        batch.set(historyRef, {
          gamePk: gamePk.toString(),
          h_team: game?.teams.home.team.name || 'Unknown',
          a_team: game?.teams.away.team.name || 'Unknown',
          h_odds: Number(odds.h),
          a_odds: Number(odds.a),
          gameDate: game?.gameDate || 'TBA',
          updatedAt: serverTimestamp()
        });

        count++;
      }
    });

    if (count === 0) {
      setLoading(false);
      return toast.info('No hay líneas para guardar.');
    }
    
    try {
      await batch.commit();
      setTempOdds({});
      toast.success(`¡${count} líneas registradas con éxito!`);
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
    setLoading(false);
  };

  const settlePick = async (pick, result) => {
    try {
      await runTransaction(db, async (transaction) => {
        const pickRef = doc(db, 'picks', pick.id);
        const userRef = doc(db, 'Users', pick.userId);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) throw "User not found";
        const userData = userSnap.data();
        const currentBankroll = Number(userData.bankroll || 0);

        if (result === 'ganado') {
          const totalReturn = Number(pick.stake) + Number(pick.potentialWin);
          transaction.update(userRef, {
            bankroll: Number((currentBankroll + totalReturn).toFixed(2))
          });
        }
        transaction.update(pickRef, { status: result });
      });
      
      await updateStreak(pick.userId, result);
      
      toast.success(`Pick marcado como ${result}`);
    } catch (e) {
      toast.error('Error en liquidación: ' + e.message);
    }
  };

  const syncResults = async () => {
    setLoading(true);
    let processedCount = 0;
    let winCount = 0;
    let loseCount = 0;

    try {
      if (pendingPicks.length === 0) {
        toast.info('No hay picks pendientes para sincronizar.');
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      const [selGames, todayGames, yesterdayGames] = await Promise.all([
        fetchMLBGames(selectedDate),
        fetchMLBGames(today),
        fetchMLBGames(yesterday)
      ]);
      
      const allGamesList = [...selGames, ...todayGames, ...yesterdayGames];
      const gamesMap = {};
      allGamesList.forEach(g => {
        gamesMap[g.gamePk.toString()] = g;
      });

      for (const pick of pendingPicks) {
        const game = gamesMap[pick.gamePk];

        if (game && (game.status.detailedState === 'Final' || game.status.detailedState === 'Game Over')) {
          const homeWin = game.teams.home.score > game.teams.away.score;
          const winnerTeam = homeWin ? game.teams.home.team.name : game.teams.away.team.name;
          const didWin = pick.team === winnerTeam;
          
          await runTransaction(db, async (transaction) => {
            const userRef = doc(db, 'Users', pick.userId);
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) return;

            const userData = userSnap.data();
            const pickRef = doc(db, 'picks', pick.id);

            if (didWin) {
              const profit = Number(pick.potentialWin);
              const stake = Number(pick.stake);
              const newBankroll = Number(userData.bankroll || 0) + stake + profit;
              transaction.update(userRef, { bankroll: Number(newBankroll.toFixed(2)) });
              transaction.update(pickRef, { status: 'ganado' });
              winCount++;
            } else {
              transaction.update(pickRef, { status: 'perdido' });
              loseCount++;
            }
          });
          
          await updateStreak(pick.userId, didWin ? 'ganado' : 'perdido');
          processedCount++;
        }
      }

      toast.success(`🚀 Sincronización Completada!\n\nJuegos Procesados: ${processedCount}\nGanadores Pagados: ${winCount}\nPerdedores Marcados: ${loseCount}`);
      await syncGuruPicks();
    } catch (e) {
      console.error(e);
      toast.error('Error de Sincronización: ' + e.message);
    }
    setLoading(false);
  };

  const publishGuruPicks = async () => {
    setLoading(true);
    try {
      const insights = await getAiInsights(selectedDate);
      const batch = writeBatch(db);
      let count = 0;

      const allInsights = [
        ...insights.ml.map(i => ({ ...i, type: 'ml' })),
        ...insights.strikeouts.map(i => ({ ...i, type: 'strikeouts' })),
        ...insights.totals.map(i => ({ ...i, type: 'totals' }))
      ];

      for (const pick of allInsights) {
        const docId = `${pick.gamePk}_${pick.type}_${pick.side || 'total'}`;
        const ref = doc(db, 'guru_picks', docId);
        
        batch.set(ref, {
          gamePk: pick.gamePk.toString(),
          gameDate: selectedDate,
          team: pick.team || pick.pitcher || pick.matchup,
          type: pick.type,
          side: pick.side || 'total',
          pick: pick.pick || null,
          expectedTotal: pick.expectedTotal || null,
          guruConfidence: pick.confidence,
          guruPropType: pick.type === 'ml' ? 'MONEYLINE' : pick.type === 'strikeouts' ? 'STRIKEOUTS' : 'TOTALS',
          status: 'pendiente',
          createdAt: serverTimestamp()
        });
        count++;
      }

      if (count === 0) {
        toast.error('No hay recomendaciones de la IA para esta fecha para publicar.');
        setLoading(false);
        return;
      }

      await batch.commit();
      toast.success(`¡${count} picks del Gurú publicados en el historial oficial!`);
    } catch (e) {
      toast.error('Error al publicar picks: ' + e.message);
    }
    setLoading(false);
  };

  const handleRecharge = async (userId, displayName) => {
    if (!window.confirm(`¿Estás seguro de recargar 100U a ${displayName}?`)) return;
    try {
      const userRef = doc(db, 'Users', userId);
      await updateDoc(userRef, {
        bankroll: increment(100),
        picksUsed: 0
      });
      toast.success(`¡Recarga de 100U exitosa para ${displayName}!`);
    } catch (err) {
      toast.error('Error en recarga: ' + err.message);
    }
  };

  const registerUser = async (e) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    setCreatingUser(true);
    try {
      let secondaryApp;
      try {
        secondaryApp = getApp("SecondaryApp");
      } catch {
        secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      }
      
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      const newUser = userCredential.user;

      await setDoc(doc(db, 'Users', newUser.uid), {
        email: newEmail,
        displayName: newEmail.split('@')[0],
        bankroll: 0,
        picksUsed: 0,
        role: 'player',
        createdAt: new Date()
      });

      await signOut(secondaryAuth);
      toast.success('¡Jugador autorizado con éxito!');
      setNewEmail('');
      setNewPassword('');
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
    setCreatingUser(false);
  };

  const changeDate = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const addJournalEntry = async (w, l, date) => {
    try {
      const newEntries = [{ date, w, l, createdAt: new Date() }, ...dailyJournal].slice(0, 30);
      await setDoc(doc(db, 'settings', 'admin_journal'), { entries: newEntries });
      toast.success("Día registrado en la nube");
    } catch (e) {
      toast.error("Error al guardar: " + e.message);
    }
  };

  const deleteJournalEntry = async (index) => {
    try {
      const newEntries = dailyJournal.filter((_, i) => i !== index);
      await setDoc(doc(db, 'settings', 'admin_journal'), { entries: newEntries });
      toast.success("Registro eliminado");
    } catch (e) {
      toast.error("Error al eliminar: " + e.message);
    }
  };

  const calculateInverseGoal = () => {
    const rate = inverseHitRate / 100;
    const profitPerUnit = (rate * 0.91) - (1 - rate);
    
    if (profitPerUnit > 0 && inverseGames > 0) {
      const totalUnitsNeeded = inverseGoal / profitPerUnit;
      const stakePerGame = totalUnitsNeeded / inverseGames;
      const bankrollNeeded = stakePerGame / 0.03;
      setInverseResults({ bankroll: bankrollNeeded, stake: stakePerGame });
      toast.success("Estrategia calculada con éxito");
    } else {
      toast.error("La efectividad debe ser mayor al 52.4% para ser rentable");
    }
  };

  const prepareChartData = () => {
    const data = [];
    const winRate = dailyHitRate / 100;
    const growthPerBet = (winRate * 0.91) - (1 - winRate);
    const dailyGrowthFactor = 1 + (dailyGames * (dailyStake / 100) * growthPerBet);
    
    let realBankroll = initialBankroll;
    
    for (let i = 0; i < 30; i++) {
      const projBankroll = initialBankroll * Math.pow(dailyGrowthFactor, i);
      const journalEntry = [...dailyJournal].reverse()[i];
      
      if (journalEntry) {
         const stake = realBankroll * (dailyStake / 100);
         const profit = (journalEntry.w * stake * 0.91) - (journalEntry.l * stake);
         realBankroll += profit;
      }

      data.push({
        name: `Día ${i + 1}`,
        proyectado: Math.round(projBankroll),
        real: journalEntry ? Math.round(realBankroll) : null
      });
    }
    return data;
  };

  return (
    <div className={`min-h-screen font-sans transition-all duration-700 pb-40 ${theme === 'mlb' ? 'bg-[#001E46]' : 'bg-[#0A0A0A]'}`}>
      <Navbar />
      
      <div className="w-full flex justify-center mt-12">
        <main className="w-[94%] max-w-7xl lg:px-8">
          
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden mb-12 flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-2xl border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-secondary rotate-12">
               <ShieldCheck size={160} />
            </div>

            <div className="flex flex-col relative z-10">
              <div className="flex items-center gap-3 text-secondary font-black uppercase tracking-[0.3em] text-[10px] mb-3">
                <ShieldCheck size={14} className="fill-current" /> Admin Control Center
              </div>
              <h1 className="font-sport text-4xl md:text-5xl text-white tracking-tighter mb-2 uppercase italic leading-none">
                Elite Admin
              </h1>
              <p className="text-white/40 font-black flex items-center gap-2 text-[10px] uppercase tracking-widest">
                <Activity size={14} className="text-secondary" /> 
                Live Operations • Guru AI Enabled
              </p>
            </div>
            
            <div className="flex items-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/5 backdrop-blur-xl relative z-10 overflow-x-auto no-scrollbar max-w-full">
              {[
                { id: 'lines', label: 'Líneas', icon: Save },
                { id: 'payments', label: 'Pagos', icon: Wallet },
                { id: 'picks', label: 'Picks', icon: RefreshCw },
                { id: 'users', label: 'Usuarios', icon: Users },
                { id: 'recomendaciones', label: 'Guru', icon: Star },
                { id: 'planner', label: 'Planner', icon: TrendingUp },
                { id: 'history', label: 'Audit', icon: History },
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-sport text-[10px] tracking-widest transition-all duration-500 whitespace-nowrap border italic ${
                    activeTab === tab.id 
                    ? (theme === 'mlb' ? 'bg-secondary border-secondary text-white shadow-2xl shadow-secondary/20 scale-105' : 'bg-white border-white text-black shadow-2xl shadow-white/10 scale-105') 
                    : 'text-white/20 border-transparent hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label.toUpperCase()}
                </button>
              ))}
            </div>
          </motion.header>

          <AnimatePresence mode="wait">
            {activeTab === 'lines' && (
              <motion.div 
                key="lines"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className={`p-8 flex flex-col md:flex-row items-center justify-between gap-8 rounded-2xl border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary border border-secondary/20 shadow-inner">
                      <Calendar size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">PROGRAMACIÓN MLB</p>
                      <div className="flex items-center gap-3 mt-1">
                        <button onClick={() => changeDate(-1)} className="p-1 hover:text-secondary transition-colors text-white/40"><ChevronLeft size={24} /></button>
                        <input 
                          type="date" 
                          value={selectedDate} 
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-transparent text-3xl font-sport border-none focus:ring-0 p-0 text-white cursor-pointer w-[200px] text-center italic tracking-tighter"
                        />
                        <button onClick={() => changeDate(1)} className="p-1 hover:text-secondary transition-colors text-white/40"><ChevronRight size={24} /></button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                      className={`px-8 py-3.5 rounded-2xl font-sport text-xs tracking-widest transition-all duration-500 border italic ${theme === 'mlb' ? 'bg-white/5 text-white/40 border-white/10 hover:text-white' : 'bg-white/5 text-white/40 border-white/10 hover:text-white'}`}
                    >HOY</button>
                    <button 
                      onClick={saveAllOdds}
                      disabled={loading}
                      className={`h-14 px-10 flex items-center gap-3 rounded-2xl font-sport text-xs tracking-[0.2em] transition-all duration-500 shadow-2xl italic ${theme === 'mlb' ? 'bg-secondary text-white shadow-secondary/20' : 'bg-white text-black shadow-white/10'}`}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                      GUARDAR LÍNEAS
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center py-40 gap-6">
                    <div className="relative">
                       <div className="w-20 h-20 border-4 border-white/5 border-t-secondary rounded-full animate-spin" />
                       <Zap size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-secondary animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] animate-pulse">Sincronizando Mallas...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {games.map(game => {
                      const gamePk = game.gamePk.toString();
                      const currentOdds = adminOdds[gamePk] || {};
                      const editingOdds = tempOdds[gamePk] || { h: currentOdds.h_odds ?? '', a: currentOdds.a_odds ?? '' };
                      const isReady = currentOdds.h_odds !== undefined && currentOdds.a_odds !== undefined;
                      return (
                        <div key={gamePk} className={`relative overflow-hidden rounded-2xl p-8 border transition-all duration-500 shadow-3xl group ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'} ${isReady ? 'ring-1 ring-emerald-500/30' : ''}`}>
                          {isReady && (
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                               <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">LIVE DATA</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center mb-8">
                            <div className="flex flex-col items-center gap-3 flex-1">
                               <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5 p-3 shadow-inner group-hover:scale-110 transition-transform">
                                 <img src={getTeamLogo(game.teams.away.team.id)} className="w-full h-full object-contain filter drop-shadow-sm" alt="" />
                               </div>
                               <span className="font-sport text-[10px] text-white/40 text-center leading-tight truncate w-full uppercase tracking-widest">{game.teams.away.team.name.split(' ').pop()}</span>
                            </div>
                            <div className="flex flex-col items-center mx-4">
                               <span className="font-sport italic text-white/5 text-4xl">VS</span>
                            </div>
                            <div className="flex flex-col items-center gap-3 flex-1">
                               <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5 p-3 shadow-inner group-hover:scale-110 transition-transform">
                                 <img src={getTeamLogo(game.teams.home.team.id)} className="w-full h-full object-contain filter drop-shadow-sm" alt="" />
                               </div>
                               <span className="font-sport text-[10px] text-white/40 text-center leading-tight truncate w-full uppercase tracking-widest">{game.teams.home.team.name.split(' ').pop()}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-white/20 uppercase block text-center tracking-[0.2em]">VISITANTE</label>
                               <input 
                                 type="number" 
                                 placeholder="+000"
                                 value={editingOdds.a}
                                 onChange={(e) => handleTempOddChange(gamePk, 'a', e.target.value)}
                                 className={`w-full bg-black/40 border border-white/10 rounded-2xl h-16 text-center font-sport italic text-2xl transition-all focus:border-secondary outline-none ${theme === 'mlb' ? 'text-white' : 'text-primary'}`}
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-white/20 uppercase block text-center tracking-[0.2em]">LOCAL</label>
                               <input 
                                 type="number" 
                                 placeholder="+000"
                                 value={editingOdds.h}
                                 onChange={(e) => handleTempOddChange(gamePk, 'h', e.target.value)}
                                 className={`w-full bg-black/40 border border-white/10 rounded-2xl h-16 text-center font-sport italic text-2xl transition-all focus:border-secondary outline-none ${theme === 'mlb' ? 'text-white' : 'text-primary'}`}
                               />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {games.length === 0 && !loading && (
                   <div className={`p-20 text-center rounded-2xl border border-dashed border-white/10 text-white/20 font-sport italic text-xl ${theme === 'mlb' ? 'bg-[#00142D]' : 'bg-[#111111]'}`}>
                     No se detectaron juegos oficiales para esta fecha satelital.
                   </div>
                )}
              </motion.div>
            )}

            {activeTab === 'picks' && (
              <motion.div 
                key="picks"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                 <div className={`p-8 flex flex-col md:flex-row items-center justify-between gap-8 rounded-2xl border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary border border-secondary/20 shadow-inner">
                          <RefreshCw className={loading ? 'animate-spin' : ''} size={28} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">PAGOS AUTOMÁTICOS</p>
                          <h3 className="text-3xl font-sport text-white uppercase italic tracking-tighter mt-1">{pendingPicks.length} PICKS PENDIENTES</h3>
                       </div>
                    </div>
                    
                    <button 
                      onClick={syncResults}
                      disabled={loading}
                      className={`h-14 px-10 flex items-center gap-3 rounded-2xl font-sport text-xs tracking-[0.2em] transition-all duration-500 shadow-2xl italic ${theme === 'mlb' ? 'bg-secondary text-white shadow-secondary/20' : 'bg-white text-black shadow-white/10'}`}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />}
                      SINCRONIZAR RESULTADOS
                    </button>
                 </div>

                 <div className={`rounded-2xl overflow-hidden border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="bg-black/20 text-white/20 font-black text-[10px] tracking-[0.4em] uppercase border-b border-white/5">
                               <th className="px-10 py-6 text-center">STAKE</th>
                               <th className="px-10 py-6">PLAYER ELITE</th>
                               <th className="px-10 py-6">SELECCIÓN OPERATIVA</th>
                               <th className="px-10 py-6 text-right">ACCIÓN</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-white/[0.03]">
                            {pendingPicks.map(pick => (
                              <tr key={pick.id} className="hover:bg-white/[0.01] transition-all duration-300 group">
                                 <td className="px-10 py-8 text-center">
                                    <div className="inline-flex bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-6 py-3 rounded-2xl font-sport italic text-xl shadow-xl shadow-emerald-500/5">
                                      {pick.stake}U
                                    </div>
                                 </td>
                                 <td className="px-10 py-8">
                                    <p className="font-sport text-white text-2xl italic tracking-tighter leading-none mb-2">{users.find(u => u.id === pick.userId)?.displayName || 'Player'}</p>
                                    <p className="text-[10px] text-white/20 uppercase font-black tracking-widest font-mono">UID: {pick.userId.substring(0, 12)}...</p>
                                 </td>
                                 <td className="px-10 py-8">
                                    <div className="flex flex-col">
                                       <span className={`font-sport italic text-2xl leading-none mb-2 uppercase tracking-tighter ${theme === 'mlb' ? 'text-white' : 'text-primary'}`}>{pick.team}</span>
                                       <div className="flex items-center gap-3">
                                          <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.2em]">CUOTA SATELITAL:</span>
                                          <span className="text-xs font-sport italic text-secondary tracking-widest">{pick.odds > 0 ? `+${pick.odds}` : pick.odds}</span>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-10 py-8 text-right space-x-3">
                                    <button onClick={() => settlePick(pick, 'ganado')} className="w-14 h-14 rounded-2xl bg-emerald-500 text-white hover:scale-110 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={24} /></button>
                                    <button onClick={() => settlePick(pick, 'perdido')} className="w-14 h-14 rounded-2xl bg-red-500 text-white hover:scale-110 active:scale-95 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center"><XCircle size={24} /></button>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'recomendaciones' && (
              <motion.div 
                key="guru"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className={`relative overflow-hidden rounded-2xl p-12 border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                   <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none text-secondary rotate-12">
                      <Star size={160} className="fill-current" />
                   </div>

                   <div className="flex items-center gap-8 mb-12 relative z-10">
                     <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary border border-secondary/20 shadow-2xl">
                        <Star className="fill-current" size={40} />
                     </div>
                     <div>
                        <h2 className="text-4xl font-sport text-white italic uppercase tracking-tighter leading-none mb-2">Editor Pick Maestro</h2>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Algoritmo de Inteligencia Artificial Gurú</p>
                     </div>
                   </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 relative z-10">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">EQUIPO DEL DÍA</label>
                        <input 
                          type="text" 
                          value={recommendation.team || ''} 
                          onChange={(e) => setRecommendation(prev => ({ ...prev, team: e.target.value }))}
                          placeholder="Ej: NY Yankees"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl h-20 px-8 text-white font-sport uppercase tracking-tighter text-3xl italic outline-none focus:border-secondary transition-all"
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">PICK RECOMENDADO</label>
                        <input 
                          type="text" 
                          value={recommendation.pick || ''} 
                          onChange={(e) => setRecommendation(prev => ({ ...prev, pick: e.target.value }))}
                          placeholder="Ej: Gana Yankees (-150)"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl h-20 px-8 text-white font-sport uppercase tracking-tighter text-3xl italic outline-none focus:border-secondary transition-all"
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">FIRMA DEL TIPSTER</label>
                        <input 
                          type="text" 
                          value={recommendation.tipster || ''} 
                          onChange={(e) => setRecommendation(prev => ({ ...prev, tipster: e.target.value }))}
                          placeholder="Nombre del Experto"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl h-20 px-8 text-white font-sport uppercase tracking-tighter text-3xl italic outline-none focus:border-secondary transition-all"
                        />
                     </div>
                  </div>

                  <div className="space-y-3 mb-12 relative z-10">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">ANÁLISIS ESTRATÉGICO</label>
                    <textarea 
                      value={recommendation.analysis || ''} 
                      onChange={(e) => setRecommendation(prev => ({ ...prev, analysis: e.target.value }))}
                      placeholder="Despliega el análisis técnico aquí..."
                      className="w-full bg-black/40 border border-white/10 rounded-[2rem] px-8 py-8 text-white font-medium text-lg min-h-[250px] outline-none focus:border-secondary transition-all leading-relaxed shadow-inner"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end items-center gap-6 pt-10 border-t border-white/5 relative z-10">
                    <button 
                      onClick={publishGuruPicks}
                      disabled={loading}
                      className={`h-16 px-10 rounded-2xl font-sport text-[10px] tracking-[0.3em] transition-all duration-500 border italic flex items-center gap-3 ${theme === 'mlb' ? 'bg-white/5 text-secondary border-secondary/30 hover:bg-secondary/10' : 'bg-white/5 text-primary border-primary/30 hover:bg-primary/10'}`}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <Trophy size={18} />}
                      PUBLICAR EN HISTORIAL GURÚ
                    </button>
                    <button 
                      onClick={saveRecommendation}
                      disabled={loading}
                      className={`h-16 px-12 rounded-2xl font-sport text-[10px] tracking-[0.3em] transition-all duration-500 shadow-2xl italic ${theme === 'mlb' ? 'bg-secondary text-white shadow-secondary/20' : 'bg-white text-black shadow-white/10'}`}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : 'ACTUALIZAR PANEL'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div 
                key="payments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className={`p-10 rounded-2xl border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                  <div className="flex items-center gap-6 mb-10">
                    <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary border border-secondary/20 shadow-inner">
                      <Wallet size={32} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">CONFIGURACIÓN FINANCIERA</p>
                      <h3 className="text-3xl font-sport text-white italic uppercase tracking-tighter mt-1">Billetera USDT (TRC-20)</h3>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 mb-4">
                    <input 
                      type="text" 
                      value={usdtWallet} 
                      onChange={(e) => setUsdtWallet(e.target.value)}
                      placeholder="Dirección de la Billetera..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-2xl h-16 px-8 text-white font-mono text-lg outline-none focus:border-secondary transition-all"
                    />
                    <button 
                      onClick={saveWallet}
                      disabled={loading}
                      className={`h-16 px-12 rounded-2xl font-sport text-[10px] tracking-[0.3em] transition-all duration-500 shadow-2xl italic ${theme === 'mlb' ? 'bg-secondary text-white shadow-secondary/20' : 'bg-white text-black shadow-white/10'}`}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : 'ACTUALIZAR BILLETERA'}
                    </button>
                  </div>
                </div>

                <div className={`rounded-2xl overflow-hidden border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                   <div className="bg-black/20 px-10 py-6 border-b border-white/5 flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">SOLICITUDES DE RECARGA</h4>
                   </div>
                   <div className="overflow-x-auto no-scrollbar">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-black/10 text-white/10 font-black text-[9px] tracking-[0.4em] uppercase border-b border-white/5">
                              <th className="px-10 py-6">FECHA</th>
                              <th className="px-10 py-6">PLAYER</th>
                              <th className="px-10 py-6 text-center">MONTO</th>
                              <th className="px-10 py-6 text-right">ACCIÓN</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                           {depositRequests.filter(r => r.status === 'pendiente').map(request => (
                             <tr key={request.id} className="hover:bg-white/[0.01] transition-all duration-300">
                                <td className="px-10 py-8">
                                   <span className="text-white/40 font-mono text-xs">{request.createdAt?.toDate ? request.createdAt.toDate().toLocaleString() : 'N/A'}</span>
                                </td>
                                <td className="px-10 py-8">
                                   <p className="font-sport text-white text-xl italic tracking-tighter leading-none mb-1">{request.userEmail}</p>
                                   <p className="text-[9px] text-white/20 uppercase font-black tracking-widest truncate max-w-[200px]">{request.txId || 'Sin TXID'}</p>
                                </td>
                                <td className="px-10 py-8 text-center">
                                   <div className="inline-flex bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-6 py-2 rounded-xl font-sport italic text-xl shadow-xl shadow-emerald-500/5">
                                     100U
                                   </div>
                                </td>
                                <td className="px-10 py-8 text-right">
                                   <button 
                                     onClick={() => approveDeposit(request)}
                                     className="h-12 px-6 rounded-xl bg-emerald-500 text-white font-sport italic text-sm tracking-tight hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                                   >
                                     APROBAR
                                   </button>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className={`rounded-2xl overflow-hidden border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                   <div className="bg-black/20 px-10 py-8 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                          <History size={20} />
                        </div>
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">AUDITORÍA DE LÍNEAS</h4>
                      </div>
                   </div>
                   <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-black/10 text-white/10 font-black text-[9px] tracking-[0.4em] uppercase border-b border-white/5">
                            <th className="px-10 py-6">FECHA</th>
                            <th className="px-10 py-6">ENCUENTRO</th>
                            <th className="px-10 py-6 text-center">CUOTAS</th>
                            <th className="px-10 py-6 text-right">ADMIN</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                         {lineHistory.map((log, i) => (
                           <tr key={i} className="hover:bg-white/[0.01] transition-all duration-300">
                              <td className="px-10 py-8">
                                 <div className="flex flex-col">
                                    <span className="text-white text-xs font-bold">{log.updatedAt?.toDate ? log.updatedAt.toDate().toLocaleDateString() : 'Saving...'}</span>
                                    <span className="text-[10px] text-white/40 font-black">{log.updatedAt?.toDate ? log.updatedAt.toDate().toLocaleTimeString() : ''}</span>
                                 </div>
                              </td>
                              <td className="px-10 py-8">
                                 <div className="flex flex-col">
                                    <span className="font-sport italic text-white text-xl leading-none mb-1">{log.a_team} vs {log.h_team}</span>
                                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">ID: {log.gamePk}</span>
                                 </div>
                              </td>
                              <td className="px-10 py-8 text-center">
                                 <div className="inline-flex gap-4 px-5 py-2 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex flex-col items-center"><span className="text-[8px] uppercase text-white/40 font-black">Vis</span><span className="font-sport italic text-primary">{log.a_odds > 0 ? `+${log.a_odds}` : log.a_odds}</span></div>
                                    <div className="w-[1px] bg-white/10 self-stretch my-1" />
                                    <div className="flex flex-col items-center"><span className="text-[8px] uppercase text-white/40 font-black">Loc</span><span className="font-sport italic text-primary">{log.h_odds > 0 ? `+${log.h_odds}` : log.h_odds}</span></div>
                                 </div>
                              </td>
                              <td className="px-10 py-8 text-right">
                                 <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Master Admin</span>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'planner' && (
              <motion.div 
                key="planner"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* INVERSE GOAL CALCULATOR */}
                <div className={`p-6 md:p-10 rounded-2xl border border-secondary/20 transition-all duration-500 shadow-3xl bg-gradient-to-br from-secondary/5 to-transparent ${theme === 'mlb' ? 'bg-[#00142D]' : 'bg-[#111111]'}`}>
                   <div className="flex items-center gap-3 mb-6">
                      <Target className="text-secondary" size={20} />
                      <h2 className="text-xl md:text-3xl font-sport text-white uppercase italic tracking-tighter">Meta Inversa</h2>
                   </div>

                   <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-secondary uppercase tracking-tighter ml-1">Meta (U)</label>
                         <input 
                           type="number" 
                           value={inverseGoal}
                           onChange={(e) => setInverseGoal(Number(e.target.value))}
                           className="w-full bg-black/40 border border-white/10 rounded-xl h-12 md:h-20 px-3 md:px-8 text-white font-sport text-base md:text-4xl italic outline-none focus:border-secondary transition-all text-center"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-white/20 uppercase tracking-tighter ml-1">Efec. (%)</label>
                         <input 
                           type="number" 
                           value={inverseHitRate}
                           onChange={(e) => setInverseHitRate(Number(e.target.value))}
                           className="w-full bg-black/40 border border-white/10 rounded-xl h-12 md:h-20 px-3 md:px-8 text-white font-sport text-base md:text-4xl italic outline-none focus:border-secondary transition-all text-center"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-white/20 uppercase tracking-tighter ml-1">Juegos</label>
                         <input 
                           type="number" 
                           value={inverseGames}
                           onChange={(e) => setInverseGames(Number(e.target.value))}
                           className="w-full bg-black/40 border border-white/10 rounded-xl h-12 md:h-20 px-3 md:px-8 text-white font-sport text-base md:text-4xl italic outline-none focus:border-secondary transition-all text-center"
                         />
                      </div>
                   </div>

                   <button 
                     onClick={calculateInverseGoal}
                     className="w-full mb-6 h-12 bg-white text-black font-sport italic uppercase tracking-widest rounded-xl text-[10px] shadow-2xl shadow-white/5 transition-all"
                   >
                     Calcular Estrategia
                   </button>

                   <div className="grid grid-cols-2 gap-4 p-4 md:p-8 rounded-2xl bg-black/40 border border-white/5">
                      <div className="space-y-1">
                         <p className="text-[8px] font-black text-white/20 uppercase tracking-tighter">Banca Requerida</p>
                         <div className="text-xl md:text-5xl font-sport italic text-secondary tracking-tighter">
                            {inverseResults.bankroll > 0 ? inverseResults.bankroll.toFixed(2) : '0.00'}U
                         </div>
                      </div>
                      <div className="space-y-1 text-right">
                         <p className="text-[8px] font-black text-white/20 uppercase tracking-tighter">Apuesta x Juego</p>
                         <div className="text-xl md:text-5xl font-sport italic text-white tracking-tighter">
                            {inverseResults.stake > 0 ? inverseResults.stake.toFixed(2) : '0.00'}U
                         </div>
                      </div>
                   </div>
                </div>

                {/* SIMULATOR INPUTS */}
                <div className={`p-6 md:p-10 rounded-2xl border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                   <div className="flex items-center gap-3 mb-6">
                      <TrendingUp className="text-secondary" size={20} />
                      <h2 className="text-xl md:text-3xl font-sport text-white uppercase italic tracking-tighter">Simulador Pro</h2>
                   </div>

                   <div className="grid grid-cols-4 gap-2 md:gap-6">
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-white/20 uppercase tracking-tighter ml-1">Banca</label>
                         <input 
                           type="number" 
                           value={initialBankroll} 
                           onChange={(e) => setInitialBankroll(Number(e.target.value))}
                           className="w-full bg-black/40 border border-white/10 rounded-lg h-10 md:h-14 px-2 md:px-6 text-white font-sport text-xs md:text-xl italic outline-none focus:border-secondary text-center"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-white/20 uppercase tracking-tighter ml-1">Efec. (%)</label>
                         <input 
                           type="number" 
                           value={dailyHitRate} 
                           onChange={(e) => setDailyHitRate(Number(e.target.value))}
                           className="w-full bg-black/40 border border-white/10 rounded-lg h-10 md:h-14 px-2 md:px-6 text-white font-sport text-xs md:text-xl italic outline-none focus:border-secondary text-center"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-white/20 uppercase tracking-tighter ml-1">Juegos</label>
                         <input 
                           type="number" 
                           value={dailyGames} 
                           onChange={(e) => setDailyGames(Number(e.target.value))}
                           className="w-full bg-black/40 border border-white/10 rounded-lg h-10 md:h-14 px-2 md:px-6 text-white font-sport text-xs md:text-xl italic outline-none focus:border-secondary text-center"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-white/20 uppercase tracking-tighter ml-1">Stake (%)</label>
                         <input 
                           type="number" 
                           value={dailyStake} 
                           onChange={(e) => setDailyStake(Number(e.target.value))}
                           className="w-full bg-black/40 border border-white/10 rounded-lg h-10 md:h-14 px-2 md:px-6 text-white font-sport text-xs md:text-xl italic outline-none focus:border-secondary text-center"
                         />
                      </div>
                   </div>
                </div>

                {/* PERFORMANCE CHART */}
                <div className={`p-6 md:p-10 rounded-2xl border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                   <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                         <Activity className="text-secondary" size={20} />
                         <h2 className="text-xl md:text-3xl font-sport text-white uppercase italic tracking-tighter">Gráfica de Rendimiento</h2>
                      </div>
                      <div className="flex gap-4">
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-white/20" />
                            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Proyección</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_10px_rgba(255,51,102,0.5)]" />
                            <span className="text-[8px] font-black text-secondary uppercase tracking-widest">Real</span>
                         </div>
                      </div>
                   </div>

                   <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={prepareChartData()}>
                            <defs>
                               <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.05}/>
                                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                               </linearGradient>
                               <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ff3366" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#ff3366" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis 
                              dataKey="name" 
                              stroke="#ffffff20" 
                              fontSize={8} 
                              tickLine={false} 
                              axisLine={false}
                              interval={4}
                            />
                            <YAxis 
                              stroke="#ffffff20" 
                              fontSize={8} 
                              tickLine={false} 
                              axisLine={false}
                              tickFormatter={(value) => `${value}U`}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#111', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontFamily: 'inherit'
                              }}
                              itemStyle={{ padding: '2px 0' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="proyectado" 
                              stroke="#ffffff30" 
                              strokeWidth={2}
                              fillOpacity={1} 
                              fill="url(#colorProj)" 
                              strokeDasharray="5 5"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="real" 
                              stroke="#ff3366" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorReal)" 
                              dot={{ fill: '#ff3366', strokeWidth: 2, r: 4, stroke: '#111' }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* PROJECTION TABLE */}
                <div className={`rounded-2xl border transition-all duration-500 shadow-3xl overflow-hidden ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                   <div className="p-6 bg-black/20 border-b border-white/5 flex justify-between items-center">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Proyección Estratégica a 30 Días</span>
                      <div className="text-secondary font-sport italic text-sm">
                         Meta Final: {(() => {
                           let b = initialBankroll;
                           const winRate = dailyHitRate / 100;
                           const growthPerBet = (winRate * 0.91) - (1 - winRate);
                           const dailyGrowthFactor = 1 + (dailyGames * (dailyStake / 100) * growthPerBet);
                           return (b * Math.pow(dailyGrowthFactor, 30)).toFixed(2);
                         })()}U
                      </div>
                   </div>
                   <div className="overflow-x-auto max-h-[500px] no-scrollbar">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="bg-black/10 text-white/20 font-black text-[8px] tracking-[0.3em] uppercase border-b border-white/5">
                               <th className="px-8 py-4">Día</th>
                               <th className="px-8 py-4">Banca (U)</th>
                               <th className="px-8 py-4">Apuesta (U)</th>
                               <th className="px-8 py-4">Ganancia Diaria</th>
                               <th className="px-8 py-4 text-right">Acumulado</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-white/[0.03]">
                            {Array.from({ length: 30 }).map((_, i) => {
                               const winRate = dailyHitRate / 100;
                               const growthPerBet = (winRate * 0.91) - (1 - winRate);
                               const dailyGrowthFactor = 1 + (dailyGames * (dailyStake / 100) * growthPerBet);
                               const bankrollAtStart = initialBankroll * Math.pow(dailyGrowthFactor, i);
                               const dailyProfit = bankrollAtStart * (dailyGrowthFactor - 1);
                               
                               return (
                                 <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                                    <td className="px-8 py-4 font-sport italic text-white/40">#{i + 1}</td>
                                    <td className="px-8 py-4 font-sport italic text-white">{bankrollAtStart.toFixed(2)}U</td>
                                    <td className="px-8 py-4 text-secondary font-sport italic text-xs">{(bankrollAtStart * (dailyStake / 100)).toFixed(2)}U</td>
                                    <td className="px-8 py-4 text-emerald-400 font-sport italic text-xs">+{dailyProfit.toFixed(2)}U</td>
                                    <td className="px-8 py-4 text-right font-sport italic text-white/20">{(bankrollAtStart + dailyProfit).toFixed(2)}U</td>
                                 </tr>
                               );
                            })}
                         </tbody>
                      </table>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* DAILY TRACKER */}
                   <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <Target className="text-secondary" size={16} />
                            <h3 className="text-sm font-sport text-white uppercase italic tracking-tighter">Mi Registro Real</h3>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Total Ganado</span>
                            <span className={`text-base font-sport italic tracking-tighter ${dailyJournal.length > 0 ? 'text-emerald-400' : 'text-white/20'}`}>
                               {(() => {
                                 let profit = 0;
                                 let currentB = initialBankroll;
                                 [...dailyJournal].reverse().forEach(entry => {
                                    const stake = currentB * (dailyStake / 100);
                                    const p = (entry.w * stake * 0.91) - (entry.l * stake);
                                    profit += p;
                                    currentB += p;
                                 });
                                 return profit > 0 ? `+${profit.toFixed(2)}` : profit.toFixed(2);
                               })()}U
                            </span>
                         </div>
                      </div>

                      {/* STATS MINI-GRID */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                         <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-white/20 uppercase mb-0.5">Efectividad Real</p>
                            <p className="text-base font-sport text-white italic">
                               {(() => {
                                 const tw = dailyJournal.reduce((acc, curr) => acc + Number(curr.w), 0);
                                 const tl = dailyJournal.reduce((acc, curr) => acc + Number(curr.l), 0);
                                 return tw + tl > 0 ? ((tw / (tw + tl)) * 100).toFixed(1) : '0.0';
                               })}%
                            </p>
                         </div>
                         <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-right">
                            <p className="text-[7px] font-black text-white/20 uppercase mb-0.5 text-right">Racha (W/L)</p>
                            <p className="text-base font-sport text-white italic">
                               {dailyJournal.reduce((acc, curr) => acc + Number(curr.w), 0)} / {dailyJournal.reduce((acc, curr) => acc + Number(curr.l), 0)}
                            </p>
                         </div>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                         <div className="space-y-1">
                            <label className="text-[7px] font-black text-white/20 uppercase tracking-widest ml-1">Fecha</label>
                            <input 
                              type="date" 
                              id="journalDate"
                              defaultValue={new Date().toISOString().split('T')[0]}
                              className="w-full bg-black/40 border border-white/10 rounded-lg h-9 px-3 text-white font-sport text-xs italic outline-none focus:border-secondary"
                            />
                         </div>
                         <div className="flex gap-2">
                            <input 
                              type="number" 
                              placeholder="W" 
                              id="dailyWins"
                              className="flex-1 bg-black/40 border border-white/10 rounded-lg h-10 text-center text-emerald-400 font-sport text-lg italic outline-none focus:border-emerald-500"
                            />
                            <input 
                              type="number" 
                              placeholder="L" 
                              id="dailyLosses"
                              className="flex-1 bg-black/40 border border-white/10 rounded-lg h-10 text-center text-red-400 font-sport text-lg italic outline-none focus:border-red-500"
                            />
                         </div>
                         <button 
                           onClick={() => {
                             const w = Number(document.getElementById('dailyWins').value);
                             const l = Number(document.getElementById('dailyLosses').value);
                             const d = document.getElementById('journalDate').value;
                             if ((w > 0 || l > 0) && d) {
                               addJournalEntry(w, l, d);
                               document.getElementById('dailyWins').value = '';
                               document.getElementById('dailyLosses').value = '';
                             }
                           }}
                           className="w-full h-10 bg-secondary text-white font-sport italic uppercase tracking-widest rounded-lg text-[9px] shadow-xl shadow-secondary/20"
                         >
                           Registrar Día
                         </button>
                      </div>

                      {/* HISTORY LIST */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                         <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-4">Últimos 30 días registrados</p>
                         {dailyJournal.map((entry, idx) => (
                           <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 group">
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-sport italic text-white/40">{entry.date}</span>
                                 <div className="flex gap-2 mt-0.5">
                                    <span className="text-xs font-sport text-emerald-400 italic">{entry.w}W</span>
                                    <span className="text-xs font-sport text-red-400 italic">{entry.l}L</span>
                                 </div>
                              </div>
                              <button 
                                onClick={() => deleteJournalEntry(idx)}
                                className="p-2 text-white/10 hover:text-secondary transition-colors"
                              >
                                 <Trash2 size={14} />
                              </button>
                           </div>
                         ))}
                         {dailyJournal.length === 0 && (
                           <div className="text-center py-8 text-[10px] text-white/10 uppercase font-black italic tracking-widest">Sin registros previos</div>
                         )}
                      </div>
                   </div>

                   {/* TIPS */}
                   <div className={`p-8 rounded-2xl border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                      <div className="flex items-center gap-4 mb-6">
                         <Brain className="text-secondary" size={20} />
                         <h3 className="text-xl font-sport text-white uppercase italic tracking-tighter">Reglas de Oro</h3>
                      </div>
                      <ul className="space-y-4">
                         {[
                           "No persigas pérdidas subiendo el stake.",
                           "Si el Gurú tiene un día malo, mantén la calma.",
                           "El interés compuesto requiere meses, no días.",
                           "Retira tu inversión inicial apenas dupliques la banca."
                         ].map((tip, i) => (
                           <li key={i} className="flex items-start gap-3 text-[10px] text-white/50 uppercase font-black tracking-widest leading-relaxed">
                              <Zap size={14} className="text-secondary mt-0.5" />
                              {tip}
                           </li>
                         ))}
                      </ul>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="animate-fade space-y-12"
              >
                <div className={`p-10 rounded-2xl border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                  <div className="flex items-center gap-6 mb-10">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                      <UserPlus size={32} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">AUTORIZACIÓN DE ACCESO</p>
                      <h3 className="text-3xl font-sport text-white italic uppercase tracking-tighter mt-1">Registrar Nuevo Player</h3>
                    </div>
                  </div>

                  <form onSubmit={registerUser} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase ml-2 flex items-center gap-2">
                        <Mail size={12} /> Email Identidad
                      </label>
                      <input 
                        type="email" 
                        value={newEmail} 
                        onChange={(e) => setNewEmail(e.target.value)} 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 h-16 text-white font-sport uppercase tracking-widest focus:border-primary transition-all outline-none" 
                        placeholder="player@fantasysport.com" 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase ml-2 flex items-center gap-2">
                        <Lock size={12} /> Gateway Seguro
                      </label>
                      <input 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 h-16 text-white font-sport uppercase tracking-widest focus:border-primary transition-all outline-none" 
                        placeholder="••••••••" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={creatingUser} 
                      className={`h-16 rounded-2xl font-sport text-[10px] tracking-[0.3em] transition-all duration-500 shadow-2xl italic ${theme === 'mlb' ? 'bg-primary text-white shadow-primary/20' : 'bg-white text-black shadow-white/10'}`}
                    >
                      {creatingUser ? <Loader2 className="animate-spin mx-auto" /> : 'AUTORIZAR JUGADOR'}
                    </button>
                  </form>
                </div>

                <div className={`rounded-[2.5rem] overflow-hidden border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
                  <div className="bg-black/20 px-10 py-8 border-b border-white/5">
                     <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">BASE DE DATOS DE PLAYERS</h4>
                  </div>
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-black/10 text-white/10 uppercase text-[9px] font-black tracking-[0.4em] border-b border-white/5">
                        <tr>
                          <th className="px-10 py-6">USUARIO</th>
                          <th className="px-10 py-6 text-center">HOY (U)</th>
                          <th className="px-10 py-6 text-center">SEMANA (U)</th>
                          <th className="px-10 py-6 text-right">SALDO</th>
                          <th className="px-10 py-6 text-center">STATUS</th>
                          <th className="px-10 py-6 text-center">RECARGA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {users && users.map(u => {
                          const stats = weeklyStats[u.id] || { daily: 0, weekly: 0, monthly: 0, pending: 0 };
                          const getProfStyle = (p) => p > 0 ? 'text-emerald-400' : p < 0 ? 'text-secondary' : 'text-white/20';
                          return (
                            <tr key={u.id} className="hover:bg-white/[0.01] transition-all duration-300 group">
                              <td className="px-10 py-8">
                                 <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-105 transition-transform overflow-hidden p-1">
                                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} className="w-full h-full object-cover rounded-xl" alt="avatar" />
                                    </div>
                                    <div className="flex flex-col">
                                       <p className="font-sport text-2xl leading-none text-white italic tracking-tighter group-hover:text-primary transition-colors">{u.displayName}</p>
                                       <p className="text-[10px] text-white/20 font-black tracking-[0.2em] uppercase mt-2">{u.email}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className={`px-10 py-8 text-center font-sport italic text-3xl tracking-tighter ${getProfStyle(stats.daily)}`}>
                                {stats.daily > 0 ? '+' : ''}{stats.daily.toFixed(1)}
                              </td>
                              <td className={`px-10 py-8 text-center font-sport italic text-3xl tracking-tighter ${getProfStyle(stats.weekly)}`}>
                                {stats.weekly > 0 ? '+' : ''}{stats.weekly.toFixed(1)}
                              </td>
                              <td className="px-10 py-8 text-right">
                                 <div className="flex flex-col items-end">
                                    <span className="font-sport italic text-3xl text-white tracking-tighter">{u.bankroll || 0}U</span>
                                    <span className="text-[8px] font-black text-white/10 uppercase tracking-widest mt-1">Saldo Activo</span>
                                 </div>
                              </td>
                              <td className="px-10 py-8 text-center">
                                 <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-2xl ${u.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-white/40 border-white/5'}`}>
                                    {u.role}
                                 </span>
                              </td>
                              <td className="px-10 py-8 text-center">
                                 <button 
                                   onClick={() => handleRecharge(u.id, u.displayName)}
                                   className="p-4 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-2xl transition-all border border-secondary/20 group/btn shadow-xl shadow-secondary/5"
                                   title="Recargar 100U"
                                 >
                                    <RefreshCw size={20} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                                 </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Admin;
