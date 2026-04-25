import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Target, 
  Brain, 
  TrendingUp, 
  History, 
  Loader2, 
  ShieldCheck, 
  Zap, 
  Waves, 
  MapPin, 
  Clock,
  ChevronRight,
  Activity,
  Flame,
  Star,
  Info,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPitcherStats, fetchTeamRecentGames, fetchH2HHistory, getTeamLogo } from '../services/mlbApi';
import { getAiInsights } from '../services/aiService';
import { toast } from 'sonner';

const MatchupModal = ({ isOpen, onClose, game, date, onAddPick, adminOdds, cart }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    homeSP: null,
    awaySP: null,
    homeRecent: [],
    awayRecent: [],
    h2h: [],
    guru: null
  });
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (isOpen && game) {
      const loadData = async () => {
        setLoading(true);
        try {
          // --- FIX: Midnight UTC Mismatch ---
          // Many MLB games start after 00:00 UTC (Next Day). 
          // We subtract 7 hours to align with the official MLB Calendar Day (US Time).
          const gameDateObj = new Date(game.gameDate);
          gameDateObj.setHours(gameDateObj.getHours() - 7);
          const scheduleDay = gameDateObj.toISOString().split('T')[0];
          
          const homePitcherId = game.teams.home.probablePitcher?.id;
          const awayPitcherId = game.teams.away.probablePitcher?.id;

          const [hSP, aSP, hRec, aRec, h2hHistory, allGuru] = await Promise.all([
            homePitcherId ? fetchPitcherStats(homePitcherId) : null,
            awayPitcherId ? fetchPitcherStats(awayPitcherId) : null,
            fetchTeamRecentGames(game.teams.home.team.id),
            fetchTeamRecentGames(game.teams.away.team.id),
            fetchH2HHistory(game.teams.home.team.id, game.teams.away.team.id),
            getAiInsights(scheduleDay)
          ]);

          const guruData = allGuru.byGame?.[game.gamePk] || allGuru.byGame?.[game.gamePk.toString()] || null;

          setData({
            homeSP: hSP || null,
            awaySP: aSP || null,
            homeRecent: Array.isArray(hRec) ? hRec.slice(-5).reverse() : [],
            awayRecent: Array.isArray(aRec) ? aRec.slice(-5).reverse() : [],
            h2h: Array.isArray(h2hHistory) ? h2hHistory.slice(0, 10) : [],
            guru: guruData || null
          });
        } catch (error) {
          console.error("Matchup Data Error:", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [isOpen, game, date]);

  const handleAddBet = (type, side, guruMeta = null) => {
    if (!onAddPick) return;
    
    // Obtener cuotas si existen, si no, usar 100 por defecto para el Gurú
    const gameOdds = adminOdds ? adminOdds[game.gamePk.toString()] : null;
    let odds = 100;
    
    if (gameOdds) {
      odds = side === 'home' ? gameOdds.h_odds : gameOdds.a_odds;
      if (!odds) odds = 100;
    }

    let teamName = side === 'home' ? game.teams.home.team.name : game.teams.away.team.name;
    
    if (guruMeta?.type === 'NRFI') {
       teamName = `NRFI: ${game.teams.away.team.name} vs ${game.teams.home.team.name}`;
    } else if (guruMeta?.type === 'O/U') {
       teamName = `${guruMeta.target} (${game.teams.away.team.name} vs ${game.teams.home.team.name})`;
    } else if (guruMeta?.type === 'K-PRO') {
       const pitcher = side === 'home' ? data.guru?.k?.home?.pitcher : data.guru?.k?.away?.pitcher;
       teamName = `K-PRO: ${pitcher?.split(' ').pop() || 'Pitcher'} (${guruMeta.target})`;
    }

    onAddPick(game.gamePk, teamName, odds, side, guruMeta);
    toast.success(`${teamName} añadido al slip (Modo Gurú)`);
  };

  if (!isOpen || !game) return null;

  const homeTeam = game.teams.home.team;
  const awayTeam = game.teams.away.team;
  const env = data.guru?.environment || {};
  const weather = env.weather || {};

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#0D1117]/95 backdrop-blur-xl" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full max-w-5xl bg-[#0D1117] rounded-lg shadow-[0_32px_120px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden flex flex-col max-h-[96vh]"
      >
        {/* HEADER: ELITE BROADCAST STYLE */}
        <header className="p-4 sm:p-6 bg-[#161B22] border-b border-white/5 relative overflow-hidden">
          {/* BACKGROUND DECORATION */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#10B981]/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#2563EB]/5 to-transparent pointer-events-none" />

          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#8B949E] hover:text-white transition-all z-20">
            <X size={20} />
          </button>

          <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
            {/* VENUE & WEATHER */}
            <div className="flex items-center gap-6 px-4 py-1.5 bg-black/40 rounded-full border border-white/5">
                <div className="flex items-center gap-2">
                   <Clock size={12} className="text-[#8B949E]" />
                   <span className="text-[10px] font-black uppercase text-white/90 tracking-widest">{new Date(game.gameDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-2">
                   <MapPin size={12} className="text-[#2563EB]" />
                   <span className="text-[10px] font-black uppercase text-white/90 tracking-widest">{env.venue || 'STADIUM'}</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-2">
                   <TrendingUp size={12} className="text-[#10B981]" />
                   <span className="text-[10px] font-black uppercase text-white/90 tracking-widest">{weather.temp || '--'}°F</span>
                </div>
            </div>

            {/* TEAM BATTLE */}
            <div className="flex items-center justify-between w-full gap-4 sm:gap-12">
               <div className="flex-1 flex flex-col items-center gap-2 text-center">
                  <motion.div whileHover={{ scale: 1.05 }} className="relative">
                    <img src={getTeamLogo(awayTeam.id)} alt="" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
                    {data.guru?.ml && (
                       <button onClick={() => handleAddBet('ml', 'away', { isGuru: true, conf: data.guru.ml.away, type: 'ML' })} className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-2xl">
                          <span className="text-[9px] font-sport text-white italic">{data.guru.ml.away}%</span>
                       </button>
                    )}
                  </motion.div>
                  <div className="space-y-0.5">
                    <h2 className="font-sport text-lg sm:text-xl text-white italic truncate w-full">{awayTeam.name}</h2>
                    <p className="text-[9px] font-black text-[#8B949E] uppercase tracking-[0.4em]">VISITANTE</p>
                  </div>
               </div>

               <div className="flex flex-col items-center pt-4">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/5 relative">
                     <span className="font-sport text-lg text-white/20 italic">VS</span>
                     <div className="absolute inset-0 bg-[#2563EB]/10 rounded-full blur-xl" />
                  </div>
               </div>

               <div className="flex-1 flex flex-col items-center gap-2 text-center">
                  <motion.div whileHover={{ scale: 1.05 }} className="relative">
                    <img src={getTeamLogo(homeTeam.id)} alt="" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
                    {data.guru?.ml && (
                       <button onClick={() => handleAddBet('ml', 'home', { isGuru: true, conf: data.guru.ml.home, type: 'ML' })} className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-2xl">
                          <span className="text-[9px] font-sport text-white italic">{data.guru.ml.home}%</span>
                       </button>
                    )}
                  </motion.div>
                  <div className="space-y-0.5">
                    <h2 className="font-sport text-lg sm:text-xl text-white italic truncate w-full">{homeTeam.name}</h2>
                    <p className="text-[9px] font-black text-[#8B949E] uppercase tracking-[0.4em]">LOCAL</p>
                  </div>
               </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-6 custom-scrollbar bg-[#0D1117]">
          {loading ? (
             <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-50 capitalize">
                <Loader2 size={32} className="animate-spin text-[#10B981]" />
                <span className="text-[10px] font-black tracking-widest text-[#8B949E]">Sincronizando Terminal...</span>
             </div>
          ) : (
            <>
               {!data.guru && (
                  <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-4">
                     <Brain size={18} className="text-yellow-500 animate-pulse" />
                     <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Aviso: Pitchers no confirmados. El Gurú está operando con promedios proyectados de equipo.</p>
                  </div>
               )}
              {/* PRO CARDS GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <ProCard 
                    title={`K-PRO: ${data.guru?.k?.home?.pitcher?.split(' ')[1] || 'SP'}`}
                    probability={data.guru?.k?.home?.probability || '0'}
                    target={`OVER ${data.guru?.k?.home?.target || '0.0'}`}
                    icon={<Activity size={14} />}
                    onClick={() => handleAddBet('ml', 'home', { isGuru: true, conf: data.guru?.k?.home?.probability, type: 'K-PRO', target: `OVER ${data.guru?.k?.home?.target}` })}
                    alreadyAdded={cart?.some(c => c.gamePk === game.gamePk && c.side === 'home' && c.guruMeta?.type === 'K-PRO')}
                    accent="#10B981"
                 />
                 <ProCard 
                    title={`K-PRO: ${data.guru?.k?.away?.pitcher?.split(' ')[1] || 'SP'}`}
                    probability={data.guru?.k?.away?.probability || '0'}
                    target={`OVER ${data.guru?.k?.away?.target || '0.0'}`}
                    icon={<Activity size={14} />}
                    onClick={() => handleAddBet('ml', 'away', { isGuru: true, conf: data.guru?.k?.away?.probability, type: 'K-PRO', target: `OVER ${data.guru?.k?.away?.target}` })}
                    alreadyAdded={cart?.some(c => c.gamePk === game.gamePk && c.side === 'away' && c.guruMeta?.type === 'K-PRO')}
                    accent="#2563EB"
                 />
                 <ProCard 
                    title="PROP NRFI"
                    probability={data.guru?.totals?.nrfi || '0'}
                    target="0-0 PRIMER INNING"
                    icon={<ShieldCheck size={14} />}
                    onClick={() => handleAddBet('ml', 'home', { isGuru: true, conf: data.guru?.totals?.nrfi, type: 'NRFI', target: 'NO RUN 1ST' })}
                    alreadyAdded={cart?.some(c => c.gamePk === game.gamePk && c.guruMeta?.type === 'NRFI')}
                 />
                 <ProCard 
                    title="PREDICCIÓN TOTALES"
                    probability={data.guru?.totals?.probability || '0'}
                    target={`${data.guru?.totals?.recommendation} ${data.guru?.totals?.target || '8.5'}`}
                    icon={<Waves size={14} />}
                    onClick={() => handleAddBet('ml', 'home', { isGuru: true, conf: data.guru?.totals?.probability, type: 'O/U', target: `${data.guru?.totals?.recommendation} ${data.guru?.totals?.target}` })}
                    alreadyAdded={cart?.some(c => c.gamePk === game.gamePk && c.guruMeta?.type === 'O/U')}
                    highlight
                 />
              </div>

              {/* THE PITCHER BATTLE: HIGH-FIDELITY COMPARISON */}
              <section className="bg-[#161B22] rounded-xl border border-white/5 overflow-hidden shadow-2xl">
                 <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Target size={18} className="text-[#10B981]" />
                       <h3 className="font-sport text-sm text-white italic uppercase tracking-widest text-[#10B981]">SABERMETRIC TERMINAL</h3>
                       <button 
                        onClick={() => setShowGuide(!showGuide)}
                        className="p-1 px-2 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center gap-1 hover:bg-[#10B981]/20 transition-all border border-[#10B981]/20"
                       >
                          <Info size={12} />
                          <span className="text-[9px] font-black uppercase tracking-tighter">Guía</span>
                       </button>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                       <span className="text-[9px] font-black text-[#8B949E] uppercase tracking-widest">Estadísticas 2026</span>
                    </div>
                 </div>

                 <AnimatePresence>
                    {showGuide && (
                       <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-[#10B981]/5 border-b border-white/5"
                       >
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[#10B981]">
                                   <Target size={14} />
                                   <span className="text-[10px] font-black uppercase tracking-widest">FIP & LOB%</span>
                                </div>
                                <p className="text-[9px] text-[#8B949E] font-bold uppercase leading-relaxed tracking-widest">
                                   Detectan la suerte del pitcher. Un FIP bajo con LOB% bajo significa que el pitcher ha sido MUY desafortunado y es un gran Pick para ganar hoy.
                                </p>
                             </div>
                             <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[#2563EB]">
                                   <Activity size={14} />
                                   <span className="text-[10px] font-black uppercase tracking-widest">ISO (Power Index)</span>
                                </div>
                                <p className="text-[9px] text-[#8B949E] font-bold uppercase leading-relaxed tracking-widest">
                                   Mide el poder bruto del bateo. Si el ISO es alto (&gt; .180), el equipo tiene alta probabilidad de dar Jonrones.
                                </p>
                             </div>
                             <div className="space-y-2">
                                <div className="flex items-center gap-2 text-red-500">
                                   <Flame size={14} />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Bullpen Fatigue</span>
                                </div>
                                <p className="text-[9px] text-[#8B949E] font-bold uppercase leading-relaxed tracking-widest">
                                   Analiza el estrés de los relevistas. Un relevo 'Cansado' suele regalar el juego en las entradas finales.
                                </p>
                             </div>
                             <div className="space-y-2">
                                <div className="flex items-center gap-2 text-white">
                                   <TrendingUp size={14} />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Park Factors</span>
                                </div>
                                <p className="text-[9px] text-[#8B949E] font-bold uppercase leading-relaxed tracking-widest">
                                   El Gurú ajusta los totales basándose en si el estadio es 'Hitter Friendly' (más carreras) o 'Pitcher Friendly'.
                                </p>
                             </div>
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>

                 <div className="p-8 space-y-10">
                    <div className="flex justify-between items-center px-4">
                       <div className="flex flex-col items-start gap-1">
                          <span className="font-sport text-lg text-white italic">{data.awaySP?.playerName || 'VISITANTE'}</span>
                          <div className="flex gap-1">
                             {[...Array(5)].map((_, i) => <div key={i} className="w-3 h-1 rounded bg-[#2563EB]/20" />)}
                             <div className="text-[8px] font-black text-[#2563EB] uppercase ml-1">LHP</div>
                          </div>
                       </div>
                       <div className="flex flex-col items-end gap-1">
                          <span className="font-sport text-lg text-white italic">{data.homeSP?.playerName || 'LOCAL'}</span>
                          <div className="flex gap-1">
                             <div className="text-[8px] font-black text-[#10B981] uppercase mr-1">RHP</div>
                             {[...Array(5)].map((_, i) => <div key={i} className="w-3 h-1 rounded bg-[#10B981]/20" />)}
                          </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className={`p-4 rounded-xl border flex flex-col gap-1 ${data.guru?.advanced?.fatigue?.away === 'Cansado' ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                             <span className="text-[8px] font-black uppercase text-white/40 tracking-widest leading-none">Relieve Visitante</span>
                             <div className="flex items-center gap-2">
                                <Activity size={10} className={data.guru?.advanced?.fatigue?.away === 'Cansado' ? 'text-red-500' : 'text-green-500'} />
                                <span className={`text-[10px] font-sport italic ${data.guru?.advanced?.fatigue?.away === 'Cansado' ? 'text-red-500' : 'text-green-500'}`}>{data.guru?.advanced?.fatigue?.away}</span>
                             </div>
                          </div>
                          <div className={`p-4 rounded-xl border flex flex-col gap-1 items-end text-right ${data.guru?.advanced?.fatigue?.home === 'Cansado' ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                             <span className="text-[8px] font-black uppercase text-white/40 tracking-widest leading-none">Relieve Local</span>
                             <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-sport italic ${data.guru?.advanced?.fatigue?.home === 'Cansado' ? 'text-red-500' : 'text-green-500'}`}>{data.guru?.advanced?.fatigue?.home}</span>
                                <Activity size={10} className={data.guru?.advanced?.fatigue?.home === 'Cansado' ? 'text-red-500' : 'text-green-500'} />
                             </div>
                          </div>
                       </div>

                       <BattleRow label="ERA" away={data.awaySP?.era} home={data.homeSP?.era} better="lower" />
                       <BattleRow label="FIP (True ERA)" away={data.guru?.byGame?.[game.gamePk]?.fip?.away || data.awaySP?.fip || 4.2} home={data.guru?.byGame?.[game.gamePk]?.fip?.home || data.homeSP?.fip || 4.2} better="lower" isGuru />
                       <div className="grid grid-cols-2 gap-4 px-1 py-1">
                          <LuckBadge luck={data.guru?.advanced?.luck?.away} side="away" />
                          <LuckBadge luck={data.guru?.advanced?.luck?.home} side="home" />
                       </div>
                       <BattleRow 
                          label="K/BB Ratio" 
                          away={data.awaySP ? (Number(data.awaySP.strikeOuts) / Math.max(1, Number(data.awaySP.baseOnBalls))) : null} 
                          home={data.homeSP ? (Number(data.homeSP.strikeOuts) / Math.max(1, Number(data.homeSP.baseOnBalls))) : null} 
                          better="higher" 
                       />
                       <BattleRow label="ISO (Poder)" away={data.guru?.advanced?.iso?.away} home={data.guru?.advanced?.iso?.home} better="higher" isGuru />
                       <BattleRow label="WHIP" away={data.awaySP?.whip} home={data.homeSP?.whip} better="lower" />
                       <BattleRow label="LOB % (Suerte)" away={data.guru?.advanced?.lob?.away} home={data.guru?.advanced?.lob?.home} better="higher" />
                    </div>
                 </div>
              </section>

              {/* RECENT FORM & H2H */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
                 <div className="lg:col-span-8 bg-[#161B22] rounded-xl border border-white/5 p-8 space-y-8">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <History size={18} className="text-[#8B949E]" />
                          <h3 className="font-sport text-sm text-white italic uppercase tracking-widest">Historial Directo (H2H)</h3>
                       </div>
                       <span className="text-[9px] font-black text-[#8B949E] uppercase tracking-widest">{data.h2h.length} Juegos</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {data.h2h.slice(0, 6).map((g, i) => {
                          const homeWin = g.teams.home.score > g.teams.away.score;
                          const winner = homeWin ? g.teams.home : g.teams.away;
                          const loser = homeWin ? g.teams.away : g.teams.home;
                          return (
                            <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                               <div className="flex items-center gap-3">
                                  <img src={getTeamLogo(winner.team.id)} alt="" className="w-7 h-7 object-contain" />
                                  <div className="flex flex-col">
                                     <span className="text-[10px] font-sport text-white italic truncate">{winner.team.name.split(' ').pop()}</span>
                                     <span className="text-[7px] font-black text-[#10B981] uppercase">Ganó</span>
                                  </div>
                               </div>
                               <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                                  <div className="text-sm font-sport text-white leading-none">{winner.score} - {loser.score}</div>
                                  <div className="text-[8px] font-black text-white/10 uppercase tracking-widest">FINAL</div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>

                 <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-[#2563EB]/10 rounded-xl border border-[#2563EB]/20 p-6 flex flex-col justify-between h-full relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                          <Flame size={60} />
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-4">
                             <TrendingUp size={16} className="text-[#2563EB]" />
                             <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest">Análisis de Alerta</span>
                          </div>
                          <h4 className="font-sport text-lg text-white mb-2 italic">Diferencial Pro</h4>
                          <p className="text-[10px] font-black text-[#8B949E] uppercase leading-relaxed tracking-widest">El bullpen de {homeTeam.name.split(' ').pop()} tiene un WHIP promedio de {data.guru?.bullpen?.home?.whip || '1.12'} en las últimas 3 series.</p>
                       </div>
                       <div className="mt-8 pt-4 border-t border-[#2563EB]/20 flex items-center justify-between">
                          <span className="text-[9px] font-black text-[#2563EB] uppercase tracking-[0.3em]">PRO RATING</span>
                          <span className="font-sport text-xl text-white italic">AA+</span>
                       </div>
                    </div>
                 </div>
              </div>
            </>
          )}
        </div>

        <footer className="p-4 sm:p-6 bg-[#161B22] border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center border border-[#10B981]/20 relative">
                 <Zap size={18} className="text-[#10B981] animate-pulse" />
                 <div className="absolute inset-0 bg-[#10B981]/20 blur-lg rounded-full" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">FANTASYSPORT AI Terminal</span>
                 <p className="text-[8px] text-[#8B949E] font-bold uppercase tracking-widest mt-1 italic">Predicción de Alta Fidelidad v6.0</p>
              </div>
           </div>
           <button onClick={onClose} className="w-full sm:w-auto px-12 py-3.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-sport text-xs tracking-widest shadow-2xl transition-all uppercase active:scale-95 italic">
              Cerrar Análisis
           </button>
        </footer>
      </motion.div>
    </div>
  );
};

const ProCard = ({ title, probability, target, onClick, alreadyAdded, highlight }) => (
  <motion.button 
    whileHover={{ y: -4, scale: 1.02 }}
    onClick={onClick}
    disabled={alreadyAdded}
    className={`relative overflow-hidden rounded-xl p-5 transition-all text-left group ${
      highlight ? 'bg-[#10B981] text-white shadow-xl shadow-[#10B981]/20' : 'bg-[#161B22] border border-white/5 hover:border-white/10'
    }`}
  >
     <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${highlight ? 'bg-black/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
           <Star size={12} className={highlight ? 'text-white' : 'text-[#8B949E]'} />
        </div>
        <div className="text-[8px] font-black uppercase tracking-widest opacity-40">{alreadyAdded ? 'Agregado' : 'AI Pick'}</div>
     </div>
     <div className="space-y-1">
        <h4 className={`text-[10px] font-black uppercase tracking-widest ${highlight ? 'text-white/80' : 'text-[#8B949E]'}`}>{title}</h4>
        <div className="flex items-baseline gap-1.5">
           <span className="font-sport text-2xl tracking-tighter italic">{probability}%</span>
           <span className={`text-[8px] font-black uppercase tracking-widest ${highlight ? 'text-white/40' : 'text-white/10'}`}>Conf.</span>
        </div>
        <p className={`text-[9px] font-sport leading-tight mt-1 truncate ${highlight ? 'text-white font-black' : 'text-white/80 italic'}`}>{target}</p>
     </div>
  </motion.button>
);

const BattleRow = ({ label, away, home, better, isGuru }) => {
  // Use realistic league averages as fallbacks instead of 0
  const defaults = { 
    ERA: 4.50, 
    'FIP (True ERA)': 4.20, 
    'K/BB Ratio': 2.5, 
    'ISO (Poder)': 0.160, 
    WHIP: 1.35, 
    'LOB % (Suerte)': 72.0 
  };
  const defaultVal = defaults[label] || 0;
  
  const awayVal = Number(away || defaultVal);
  const homeVal = Number(home || defaultVal);
  
  const isAwayBetter = better === 'lower' ? awayVal < homeVal : awayVal > homeVal;
  const isHomeBetter = better === 'lower' ? homeVal < awayVal : homeVal > awayVal;

  return (
    <div className="space-y-2">
       <div className="flex justify-between items-end px-1">
          <span className={`font-sport text-sm italic ${isAwayBetter ? 'text-[#2563EB]' : 'text-[#8B949E]'}`}>{awayVal.toFixed(better === 'lower' ? 2 : 1)}</span>
          <div className="flex items-center gap-2 mb-1">
             {isGuru && <Brain size={10} className="text-[#10B981] mb-0.5" />}
             <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">{label}</span>
          </div>
          <span className={`font-sport text-sm italic ${isHomeBetter ? 'text-[#10B981]' : 'text-[#8B949E]'}`}>{homeVal.toFixed(better === 'lower' ? 2 : 1)}</span>
       </div>
       <div className="h-1.5 w-full flex gap-1 items-center">
          <div className="flex-1 h-full bg-white/5 rounded-full overflow-hidden flex justify-end">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: isAwayBetter ? '100%' : '60%' }}
               className={`h-full ${isAwayBetter ? 'bg-[#2563EB]' : 'bg-white/10'}`} 
             />
          </div>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <div className="flex-1 h-full bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: isHomeBetter ? '100%' : '60%' }}
               className={`h-full ${isHomeBetter ? 'bg-[#10B981]' : 'bg-white/10'}`} 
             />
          </div>
       </div>
    </div>
  );
};

const LuckBadge = ({ luck, side }) => {
  const isLucky = luck === 'Suertudo';
  const isUnlucky = luck === 'Mala Suerte';
  
  return (
    <div className={`p-2 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
      isLucky ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
      isUnlucky ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
      'bg-white/5 border-white/5 text-white/40'
    } ${side === 'home' ? 'justify-end' : 'justify-start'}`}>
      {side === 'away' && <Zap size={10} />}
      {luck || 'Normal'}
      {side === 'home' && <Zap size={10} />}
    </div>
  );
};

export default MatchupModal;
