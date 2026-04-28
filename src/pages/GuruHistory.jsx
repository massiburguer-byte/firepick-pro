import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';
import { syncGuruPicks } from '../services/syncService';
import { toast } from 'sonner';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Filter,
  Sparkles,
  Activity,
  Target,
  Zap,
  Award,
  RefreshCw,
  Flame,
  ChevronRight,
  ShieldCheck,
  Search,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GuruHistory = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, yesterday, week
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'guru_picks'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const picksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      picksData.sort((a, b) => {
        const dateGameA = a.gameDate || '';
        const dateGameB = b.gameDate || '';
        if (dateGameA !== dateGameB) return dateGameB.localeCompare(dateGameA);
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      setPicks(picksData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore guru history error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    syncGuruPicks();
  }, []);

  const filteredPicks = picks.filter(p => {
    const matchesStatus = filter === 'all' || p.status === filter;
    const pType = (p.type || p.guruPropType || '').toLowerCase();
    const matchesType = typeFilter === 'all' || 
                       (typeFilter === 'ml' && (pType === 'ml' || pType.includes('moneyline'))) ||
                       (typeFilter === 'totals' && pType.includes('totals')) ||
                       (typeFilter === 'k-pro' && (pType.includes('k-pro') || pType.includes('strikeouts')));
    
    // Date Filtering Logic
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    
    let matchesDate = true;
    if (dateFilter === 'today') matchesDate = p.gameDate === today;
    else if (dateFilter === 'yesterday') matchesDate = p.gameDate === yesterday;
    else if (dateFilter === 'week') matchesDate = p.gameDate >= weekAgo;

    return matchesStatus && matchesType && matchesDate;
  });

  // Reset to first page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, typeFilter, dateFilter]);

  const totalPages = Math.ceil(filteredPicks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPicks = filteredPicks.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: filteredPicks.length,
    won: filteredPicks.filter(p => p.status === 'ganado').length,
    lost: filteredPicks.filter(p => p.status === 'perdido').length,
    pending: filteredPicks.filter(p => p.status === 'pendiente').length,
    winRate: filteredPicks.length > 0 ? ((filteredPicks.filter(p => p.status === 'ganado').length / (filteredPicks.filter(p => p.status !== 'pendiente').length || 1)) * 100).toFixed(1) : 0,
  };

  const getInsights = () => {
    if (picks.length < 5) return null;
    const teamPerformance = {};
    const marketPerformance = {};
    const finishedPicks = picks.filter(p => p.status !== 'pendiente');
    
    finishedPicks.forEach(p => {
      const team = p.team?.split(' vs ')[0].replace('K-PRO:', '').trim();
      if (!teamPerformance[team]) teamPerformance[team] = { wins: 0, total: 0 };
      teamPerformance[team].total++;
      if (p.status === 'ganado') teamPerformance[team].wins++;

      const market = p.guruPropType || p.type?.toUpperCase() || 'OTROS';
      if (!marketPerformance[market]) marketPerformance[market] = { wins: 0, total: 0 };
      marketPerformance[market].total++;
      if (p.status === 'ganado') marketPerformance[market].wins++;
    });

    const bestTeam = Object.entries(teamPerformance)
      .filter(([_, data]) => data.total >= 2)
      .sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0];

    const bestMarket = Object.entries(marketPerformance)
      .sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0];

    const recentTrend = finishedPicks.slice(0, 10);
    const trendRate = recentTrend.length > 0 
      ? (recentTrend.filter(p => p.status === 'ganado').length / recentTrend.length) * 100 
      : 0;

    const teamRate = bestTeam ? ((bestTeam[1].wins / (bestTeam[1].total || 1)) * 100) : 0;
    const marketRate = bestMarket ? ((bestMarket[1].wins / (bestMarket[1].total || 1)) * 100) : 0;

    return {
      team: bestTeam ? { name: bestTeam[0], rate: Number(teamRate || 0).toFixed(0) } : null,
      market: bestMarket ? { name: bestMarket[0], rate: Number(marketRate || 0).toFixed(0) } : null,
      trend: Number(trendRate || 0).toFixed(0)
    };
  };

  const insights = getInsights();

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ganado':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
          icon: <CheckCircle2 size={14} />,
          label: 'GANADO'
        };
      case 'perdido':
        return {
          bg: 'bg-danger/10',
          text: 'text-danger',
          border: 'border-danger/20',
          icon: <XCircle size={14} />,
          label: 'PERDIDO'
        };
      default:
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          border: 'border-blue-500/20',
          icon: <Clock size={14} />,
          label: 'PENDIENTE'
        };
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-700 pb-40 ${theme === 'mlb' ? 'bg-[#001E46]' : 'bg-[#0A0A0A]'}`}>
      <Navbar />

      <div className="w-full flex justify-center mt-12 lg:mt-16">
        <main className="w-full px-4 max-w-7xl lg:px-8">
          
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden mb-8 md:mb-12 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 p-8 md:p-16 lg:p-20 rounded-2xl border transition-all duration-500 shadow-3xl ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}
          >
            <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none text-secondary rotate-12">
               <Brain size={250} />
            </div>

            <div className="flex flex-col relative z-10">
              <div className="flex items-center gap-3 text-secondary font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                <Sparkles size={14} className="fill-current" /> AI Audit Console v3.0
              </div>
               <h1 className="font-sport text-2xl md:text-5xl text-white tracking-tighter mb-2 uppercase italic leading-none">
                GURÚ <span className="text-secondary">HISTORY</span>
              </h1>
              <div className="flex items-center gap-6">
                 <p className="text-white/40 font-black flex items-center gap-2 text-[10px] uppercase tracking-widest">
                   <Activity size={14} className="text-secondary" /> StatCast Performance
                 </p>
                 <div className="h-4 w-px bg-white/10" />
                 <p className="text-white/40 font-black flex items-center gap-2 text-[10px] uppercase tracking-widest">
                   <ShieldCheck size={14} className="text-secondary" /> Official Audit
                 </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 md:gap-10 relative z-10 bg-black/40 p-6 md:p-8 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
              <div className="text-center">
                 <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-1">Win Rate</p>
                 <p className="text-2xl md:text-4xl font-sport text-white italic tracking-tighter">{stats.winRate}<span className="text-lg text-white/20">%</span></p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                 <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-1">W - L - P</p>
                 <p className="text-2xl md:text-4xl font-sport italic tracking-tighter">
                    <span className="text-emerald-400">{stats.won}</span>
                    <span className="text-white/20 mx-2">-</span>
                    <span className="text-danger">{stats.lost}</span>
                    <span className="text-white/20 mx-2">-</span>
                    <span className="text-blue-400">{stats.pending}</span>
                 </p>
              </div>
              <div className="w-px h-12 bg-white/10 hidden sm:block" />
              <div className="text-center hidden sm:block">
                 <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-1">Total Analyzed</p>
                 <p className="text-2xl md:text-4xl font-sport text-secondary italic tracking-tighter">{stats.total}</p>
              </div>
            </div>
          </motion.header>

          <div className="grid grid-cols-3 gap-4 md:gap-10 mb-8 md:mb-12">
             <AnimatePresence>
              {insights && [
                { id: 'team', label: 'Equipo Rey', value: insights.team?.name, sub: `${insights.team?.rate}% Win Rate`, icon: Award, color: 'text-emerald-400' },
                { id: 'market', label: 'Mercado Hot', value: insights.market?.name, sub: `${insights.market?.rate}% Eficacia`, icon: Flame, color: 'text-secondary' },
                { id: 'trend', label: 'Tendencia AI', value: `+${insights.trend}%`, sub: 'Últimos 10 Picks', icon: Activity, color: 'text-primary' }
              ].map((card, i) => (
                <motion.div 
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative overflow-hidden px-8 py-6 md:px-12 md:py-8 lg:px-16 lg:py-12 rounded-2xl border transition-all duration-500 shadow-2xl group ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}
                >
                   <div className="absolute top-0 right-0 p-2 md:p-8 opacity-5 text-white rotate-12 transition-transform group-hover:scale-110">
                      <card.icon size={30} className="md:size-[120px]" />
                   </div>
                   <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="flex items-center gap-1.5 md:gap-3 mb-4 md:mb-6">
                        <card.icon size={12} className={`md:size-[18px] ${card.color}`} />
                        <span className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/40">{card.label}</span>
                      </div>
                      <h3 className="text-[11px] md:text-3xl font-sport text-white italic uppercase tracking-tighter mb-0.5 md:mb-1 truncate leading-none">{card.value}</h3>
                      <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${card.color}`}>{card.sub}</p>
                   </div>
                </motion.div>
              ))}
             </AnimatePresence>
          </div>

          <div className={`rounded-2xl border transition-all duration-500 shadow-3xl overflow-hidden ${theme === 'mlb' ? 'bg-[#00142D] border-white/5' : 'bg-[#111111] border-white/5'}`}>
             <div className="px-6 py-6 lg:px-10 lg:py-10 border-b border-white/5 flex flex-col xl:flex-row justify-between items-center gap-6 lg:gap-10 bg-black/20">
                <div className="flex flex-wrap items-center gap-4 md:gap-8">
                   {/* STATUS FILTERS */}
                   <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                      {[
                        { id: 'all', label: 'TODOS', icon: Filter },
                        { id: 'ganado', label: 'GANADOS', icon: CheckCircle2 },
                        { id: 'perdido', label: 'FALLIDOS', icon: XCircle },
                        { id: 'pendiente', label: 'EN CURSO', icon: Clock }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setFilter(f.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${filter === f.id ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                          <f.icon size={12} className={filter === f.id ? 'text-black' : 'text-white/20'} />
                          {f.label}
                        </button>
                      ))}
                   </div>

                   {/* DATE FILTERS */}
                   <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                      {[
                        { id: 'all', label: 'TODO TIEMPO' },
                        { id: 'today', label: 'HOY' },
                        { id: 'yesterday', label: 'AYER' },
                        { id: 'week', label: '7 DÍAS' }
                      ].map(d => (
                        <button
                          key={d.id}
                          onClick={() => setDateFilter(d.id)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${dateFilter === d.id ? 'bg-secondary text-white shadow-xl shadow-secondary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                          {d.label}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 md:gap-8">
                   <div className="flex items-center gap-2">
                     {[
                       { id: 'all', label: 'MERCADOS' },
                       { id: 'ml', label: 'MONEYLINE' },
                       { id: 'totals', label: 'TOTALS' },
                       { id: 'k-pro', label: 'K-PRO' }
                     ].map(t => (
                       <button
                         key={t.id}
                         onClick={() => setTypeFilter(t.id)}
                         className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${typeFilter === t.id ? 'bg-primary border-primary text-white' : 'text-white/20 border-white/5 hover:border-white/20 hover:text-white'}`}
                       >
                         {t.label}
                       </button>
                     ))}
                   </div>

                   <div className="h-10 w-px bg-white/10 hidden xl:block" />

                   <button 
                     onClick={() => {
                       toast.promise(syncGuruPicks(), {
                          loading: 'Auditoría en curso...',
                          success: 'Historial Actualizado',
                          error: 'Error de Sincronización'
                       });
                     }}
                     className="flex items-center gap-3 px-6 py-3 rounded-2xl font-sport text-[10px] uppercase tracking-widest transition-all duration-500 border italic bg-white/5 text-white/40 border-white/10 hover:text-white hover:border-white/20"
                   >
                     <RefreshCw size={14} />
                     FORCE SYNC
                   </button>
                </div>
             </div>

             <div className="overflow-x-auto no-scrollbar">
               {loading ? (
                 <div className="py-40 flex flex-col items-center gap-6">
                    <div className="relative">
                       <div className="w-16 h-16 border-4 border-white/5 border-t-secondary rounded-full animate-spin" />
                       <Zap size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-secondary animate-pulse" />
                    </div>
                    <p className="font-black uppercase tracking-[0.5em] text-white/20 text-[9px]">Sincronizando Auditoría...</p>
                 </div>
               ) : filteredPicks.length === 0 ? (
                 <div className="py-40 text-center flex flex-col items-center">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5 border-dashed">
                       <Search size={40} className="text-white/10" />
                    </div>
                    <h3 className="font-sport text-3xl text-white/20 uppercase tracking-tighter italic">No records found</h3>
                    <p className="text-white/10 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Ajusta los filtros para ver otros picks históricos</p>
                 </div>
               ) : (
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-black/20 text-[10px] font-black text-white/10 uppercase tracking-[0.4em] border-b border-white/5">
                       <th className="px-4 lg:px-16 py-4 lg:py-8">AI SELECTION</th>
                       <th className="hidden md:table-cell px-10 py-8 text-center">MODE</th>
                       <th className="px-4 lg:px-10 py-4 lg:py-8 text-center text-[8px] md:text-[10px]"><span className="md:hidden">CONF.</span><span className="hidden md:inline">CONFIDENCE</span></th>
                       <th className="hidden">STATUS</th>
                       <th className="px-4 lg:px-16 py-4 lg:py-8 text-right">TARGET</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/[0.03]">
                     {paginatedPicks.map((pick) => {
                       const style = getStatusStyle(pick.status);
                       return (
                         <tr key={pick.id} className="group hover:bg-white/[0.01] transition-all duration-300">
                           <td className="px-4 lg:px-16 py-4 lg:py-10">
                              <div className="flex items-center gap-2 md:gap-4">
                                 <div className="hidden md:flex w-14 h-14 rounded-2xl bg-black/40 items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform shrink-0">
                                    <Brain size={20} className="text-secondary/40" />
                                 </div>
                                 <div className="flex flex-col min-w-0">
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="font-sport font-normal text-[10px] md:text-[15px] text-white uppercase tracking-tighter italic leading-none truncate">
                                        {pick.team}
                                      </span>
                                      <div className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border shrink-0 ${style.bg} ${style.border} ${style.text}`}>
                                         {style.icon} {style.label}
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-2">
                                      <div className="w-1 h-1 rounded-full bg-secondary shrink-0" />
                                      <span className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-widest truncate">
                                        EVENT: {pick.gameDate || 'TBD'}
                                      </span>
                                   </div>
                                 </div>
                              </div>
                           </td>

                           <td className="hidden md:table-cell px-4 lg:px-16 py-6 lg:py-10 text-center">
                              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.03] rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-lg group-hover:bg-white/[0.08] transition-colors">
                                 <Target size={12} className="text-secondary" /> {pick.guruPropType || 'AI PICK'}
                              </div>
                           </td>

                           <td className="px-4 lg:px-16 py-6 lg:py-10 text-center">
                              <div className="flex flex-col items-center">
                                 <span className="font-sport text-[10px] md:text-sm text-white italic leading-none mb-1">{pick.guruConfidence || '??'}%</span>
                                 <div className="w-10 md:w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pick.guruConfidence}%` }}
                                      className="h-full bg-gradient-to-r from-secondary to-primary shadow-[0_0_10px_rgba(255,59,59,0.5)]" 
                                    />
                                 </div>
                              </div>
                           </td>

                           <td className="hidden">
                              <div className="flex justify-center">
                                 <div className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border ${style.bg} ${style.border} ${style.text} shadow-2xl`}>
                                    {style.icon}
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{style.label}</span>
                                 </div>
                              </div>
                           </td>

                           <td className="px-4 lg:px-16 py-6 lg:py-10 text-right">
                              <div className="flex flex-col items-end">
                                 {pick.type === 'totals' ? (
                                   <span className="font-sport text-[10px] md:text-sm text-white/40 italic tracking-tighter leading-none">{pick.pick} {pick.expectedTotal}</span>
                                 ) : pick.type === 'strikeouts' ? (
                                   <span className="font-sport text-[10px] md:text-sm text-white/40 italic tracking-tighter leading-none">{pick.target} K</span>
                                 ) : (
                                   <div className="flex items-center gap-1 md:gap-2">
                                      <span className="font-sport text-[10px] md:text-sm text-white/40 italic tracking-tighter leading-none">WIN</span>
                                      <ChevronRight size={14} className="text-white/10" />
                                   </div>
                                 )}
                                 <span className="text-[7px] md:text-[8px] font-black text-white/10 uppercase tracking-[0.3em] mt-1">AI Target</span>
                              </div>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               )}

               {totalPages > 1 && (
                  <div className="px-6 py-6 border-t border-white/5 flex items-center justify-between bg-black/40">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/5 text-white/60 hover:text-white"
                    >
                      <ChevronRight className="rotate-180" size={14} /> ANTERIOR
                    </button>
                    
                    <div className="flex items-center gap-2">
                       {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (totalPages <= 5) return true;
                          return Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages;
                        })
                        .map((page, i, arr) => (
                          <React.Fragment key={page}>
                            {i > 0 && arr[i-1] !== page - 1 && <span className="text-white/20">...</span>}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all duration-300 ${currentPage === page ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/5 text-white/60 hover:text-white"
                    >
                      SIGUIENTE <ChevronRight size={14} />
                    </button>
                  </div>
                )}
             </div>
          </div>

          <div className="mt-16 text-center">
             <div className="flex items-center justify-center gap-6 opacity-20 mb-6">
                <div className="h-px w-20 bg-white" />
                <p className="text-[10px] font-black text-white uppercase tracking-[0.5em]">AUDIT CONSOLE COMPLETE</p>
                <div className="h-px w-20 bg-white" />
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GuruHistory;
