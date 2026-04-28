import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import ExpertGuideModal from '../components/ExpertGuideModal';
import { 
  Calculator, 
  ArrowRightLeft, 
  Layers, 
  ShieldAlert, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Info,
  ChevronRight,
  Zap,
  Search,
  Activity,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

const BetCalculator = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('payout');
  
  // --- STATE FOR PAYOUT CALCULATOR (Using strings for better UX) ---
  const [stake, setStake] = useState('10');
  const [odds, setOdds] = useState('100');
  const [oddsFormat, setOddsFormat] = useState('american'); // american, decimal
  
  // --- STATE FOR PARLAY ---
  const [parlayLegs, setParlayLegs] = useState([
    { id: 1, odds: '100' },
    { id: 2, odds: '100' }
  ]);
  const [parlayStake, setParlayStake] = useState('10');

  // --- STATE FOR HEDGE ---
  const [originalStake, setOriginalStake] = useState('10');
  const [originalOdds, setOriginalOdds] = useState('200');
  const [hedgeOdds, setHedgeOdds] = useState('150');

  // --- STATE FOR VALUE ANALYZER ---
  const [guruProb, setGuruProb] = useState('55');

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // --- HELPERS ---
  const americanToDecimal = (americanStr) => {
    const american = parseFloat(americanStr);
    if (isNaN(american)) return 1;
    if (american >= 100) return (american / 100) + 1;
    if (american <= -100) return (100 / Math.abs(american)) + 1;
    return 1;
  };

  const decimalToAmerican = (decimal) => {
    if (decimal >= 2) return Math.round((decimal - 1) * 100);
    if (decimal > 1 && decimal < 2) return Math.round(-100 / (decimal - 1));
    return 100;
  };

  // --- VALUE ANALYSIS LOGIC ---
  const calculateValue = () => {
    const decimalOdds = oddsFormat === 'american' ? americanToDecimal(odds) : parseFloat(odds) || 1;
    const houseProb = (100 / decimalOdds);
    const gProb = parseFloat(guruProb) || 0;
    const edge = gProb - houseProb;

    let verdict = { label: 'VALOR JUSTO', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: Activity };
    if (edge >= 3) verdict = { label: 'VALOR DETECTADO', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: TrendingUp };
    if (edge <= -3) verdict = { label: 'TRAMPA (EVITAR)', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', icon: ShieldAlert };

    return { houseProb: houseProb.toFixed(1), edge: edge.toFixed(1), verdict };
  };



  // --- CALCULATIONS: PAYOUT ---
  const calculatePayout = () => {
    const s = parseFloat(stake) || 0;
    const decimalOdds = oddsFormat === 'american' ? americanToDecimal(odds) : parseFloat(odds) || 1;
    const payout = s * decimalOdds;
    const profit = payout - s;
    const probability = (100 / decimalOdds).toFixed(1);
    return { payout: payout.toFixed(2), profit: profit.toFixed(2), probability };
  };

  // --- CALCULATIONS: PARLAY ---
  const calculateParlay = () => {
    const s = parseFloat(parlayStake) || 0;
    const totalDecimal = parlayLegs.reduce((acc, leg) => acc * americanToDecimal(leg.odds), 1);
    const payout = s * totalDecimal;
    const profit = payout - s;
    const probability = (100 / totalDecimal).toFixed(2);
    return { 
      payout: payout.toFixed(2), 
      profit: profit.toFixed(2), 
      totalOdds: decimalToAmerican(totalDecimal),
      decimalOdds: totalDecimal.toFixed(3),
      probability
    };
  };

  // --- CALCULATIONS: HEDGE ---
  const calculateHedge = () => {
    const s = parseFloat(originalStake) || 0;
    const origDec = americanToDecimal(originalOdds);
    const hedgeDec = americanToDecimal(hedgeOdds);
    const potentialReturn = s * origDec;
    const recommendedHedge = potentialReturn / hedgeDec;
    const guaranteedProfit = potentialReturn - s - recommendedHedge;
    
    return {
      hedgeStake: recommendedHedge.toFixed(2),
      guaranteedProfit: guaranteedProfit.toFixed(2),
      totalInvestment: (s + recommendedHedge).toFixed(2)
    };
  };

  const addParlayLeg = () => {
    if (parlayLegs.length < 10) {
      setParlayLegs([...parlayLegs, { id: Date.now(), odds: '100' }]);
    }
  };

  const removeParlayLeg = (id) => {
    if (parlayLegs.length > 2) {
      setParlayLegs(parlayLegs.filter(leg => leg.id !== id));
    }
  };

  const updateParlayLeg = (id, newOdds) => {
    // Allow only numbers and minus sign
    if (newOdds === '' || newOdds === '-' || !isNaN(parseFloat(newOdds)) || (newOdds.startsWith('-') && !isNaN(parseFloat(newOdds.slice(1))))) {
       setParlayLegs(parlayLegs.map(leg => leg.id === id ? { ...leg, odds: newOdds } : leg));
    }
  };

  // Improved Input Handler to handle signs and leading zeros
  const handleInputChange = (setter) => (e) => {
    let val = e.target.value;
    if (val === '-') { setter(val); return; }
    if (val === '') { setter(''); return; }
    if (/^-?\d*\.?\d*$/.test(val)) {
      if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
        val = val.substring(1);
      }
      setter(val);
    }
  };

  const handleFocus = (e) => e.target.select();

  return (
    <div className={`min-h-screen transition-all duration-700 ${theme === 'mlb' ? 'bg-[#000B1C]' : 'bg-[#050505]'} text-white pb-32 relative overflow-hidden`}>
      {/* ATMOSPHERIC DECOR */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-[0.1] ${theme === 'mlb' ? 'bg-secondary' : 'bg-primary'}`} />
         <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-[0.08] ${theme === 'mlb' ? 'bg-primary' : 'bg-secondary'}`} />
      </div>

      <Navbar />

      <main className="w-full max-w-6xl mx-auto px-6 mt-12 lg:mt-20 relative z-10">
        {/* HEADER SECTION - ULTRA PREMIUM */}
        <div className="mb-16 relative">
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="relative">
                 <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex items-center gap-3 text-secondary font-black uppercase tracking-[0.4em] text-[9px] mb-6"
                 >
                    <div className="w-8 h-px bg-secondary/50" />
                    <Calculator size={12} className="text-secondary animate-pulse" /> LABORATORY PRO
                 </motion.div>
                 <h1 className="font-sport text-5xl lg:text-8xl text-white tracking-tighter uppercase italic leading-[0.85] mb-6">
                    CALCULADORA<br />
                    <span className={`text-transparent bg-clip-text ${theme === 'mlb' ? 'bg-gradient-to-r from-secondary via-white to-secondary' : 'bg-gradient-to-r from-white via-white/50 to-white'}`}>QUANTUM</span>
                 </h1>
                 <p className="max-w-md text-white/30 font-black uppercase tracking-[0.2em] text-[10px] leading-relaxed italic">
                    Algoritmos de precisión quirúrgica para el análisis de mercados deportivos. <span className="text-secondary/50 underline underline-offset-4">Maximiza cada unidad invertida.</span>
                 </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                 <button 
                   onClick={() => setIsGuideOpen(true)}
                   className="group relative px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-sport text-xs flex items-center justify-center gap-4 hover:bg-white/10 transition-all tracking-[0.2em] uppercase italic overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/10 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <Activity size={18} className="text-secondary group-hover:rotate-12 transition-transform" /> 
                    Estrategia Pro
                 </button>
              </div>
           </div>
        </div>

        {/* TABS SELECTOR - HUD STYLE */}
        <div className="flex items-center gap-2 p-2 bg-black/40 rounded-[2.5rem] border border-white/5 backdrop-blur-2xl mb-12 overflow-x-auto lg:overflow-visible no-scrollbar">
           {[
             { id: 'payout', label: 'PAYOUT', icon: TrendingUp },
             { id: 'parlay', label: 'PARLAY', icon: Layers },
             { id: 'hedge', label: 'HEDGE', icon: ShieldCheck },
             { id: 'value', label: 'VALUE', icon: Search },
             { id: 'converter', label: 'ODDS', icon: RefreshCw },
           ].map((tab) => (
              <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`relative flex items-center gap-3 px-8 py-4 rounded-[2rem] transition-all duration-700 whitespace-nowrap group ${activeTab === tab.id ? 'text-white' : 'text-white/20 hover:text-white/40'}`}
              >
                 {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTabHUD" 
                      className={`absolute inset-0 rounded-[2rem] shadow-2xl ${theme === 'mlb' ? 'bg-secondary/20 border border-secondary/30' : 'bg-white/10'}`} 
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    />
                 )}
                 <tab.icon size={16} className={`relative z-10 transition-colors ${activeTab === tab.id ? 'text-secondary' : 'text-white/10'}`} />
                 <span className="relative z-10 font-sport text-xs uppercase tracking-[0.2em] italic font-black">{tab.label}</span>
              </button>
           ))}
        </div>

        {/* CALCULATOR INTERFACE */}
        <AnimatePresence mode="wait">
           <motion.div
             key={activeTab}
             initial={{ opacity: 0, scale: 0.98 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 1.02 }}
             className={`rounded-[3rem] border border-white/5 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] ${theme === 'mlb' ? 'bg-[#00142D]' : 'bg-[#0A0A0A]'} relative`}
           >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              <div className="grid grid-cols-1 lg:grid-cols-12">
                 {/* INPUT SIDE */}
                 <div className="lg:col-span-7 p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-white/5 relative z-10">
                    {activeTab === 'payout' && (
                       <div className="space-y-8">
                          <div className="space-y-4">
                              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_10px_rgba(255,184,0,0.5)]" />
                                 Monto de Apuesta
                              </label>
                              <div className="relative group">
                                 <div className="absolute -inset-1 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                                 <input 
                                   type="text" 
                                   inputMode="decimal"
                                   value={stake} 
                                   onChange={handleInputChange(setStake)}
                                   onFocus={handleFocus}
                                   className="relative w-full bg-black/40 border border-white/10 rounded-3xl h-24 px-10 text-white font-sport text-5xl italic outline-none focus:border-secondary/50 focus:bg-black/60 transition-all shadow-inner"
                                 />
                                 <div className="absolute right-10 top-1/2 -translate-y-1/2 text-white/10 font-sport italic text-3xl group-focus-within:text-secondary transition-colors">UNITS</div>
                              </div>
                             <input 
                               type="range" 
                               min="1" 
                               max="100" 
                               step="1" 
                               value={parseFloat(stake) || 0} 
                               onChange={(e) => setStake(e.target.value)}
                               className="w-full accent-secondary"
                             />
                          </div>

                          <div className="space-y-4">
                             <div className="flex justify-between items-end ml-1">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                   Cuota de Apuesta
                                </label>
                                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                                   <button 
                                     onClick={() => setOddsFormat('american')}
                                     className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${oddsFormat === 'american' ? 'bg-secondary text-white' : 'text-white/20'}`}
                                   >US</button>
                                   <button 
                                     onClick={() => setOddsFormat('decimal')}
                                     className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${oddsFormat === 'decimal' ? 'bg-secondary text-white' : 'text-white/20'}`}
                                   >DEC</button>
                                </div>
                             </div>
                             <input 
                               type="text" 
                               inputMode="text"
                               value={odds} 
                               onChange={handleInputChange(setOdds)}
                               onFocus={handleFocus}
                               className="w-full bg-black/40 border border-white/10 rounded-3xl h-24 px-10 text-white font-sport text-5xl italic outline-none focus:border-secondary transition-all"
                               placeholder={oddsFormat === 'american' ? '+100' : '2.00'}
                             />
                          </div>
                       </div>
                    )}

                    {activeTab === 'parlay' && (
                       <div className="space-y-6">
                          <div className="flex items-center justify-between mb-2">
                             <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Tus Selecciones ({parlayLegs.length})</label>
                             <button 
                               onClick={addParlayLeg}
                               disabled={parlayLegs.length >= 10}
                               className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all disabled:opacity-50"
                             >
                                <Plus size={14} className="text-secondary" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Añadir Pata</span>
                             </button>
                          </div>
                          
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                             {parlayLegs.map((leg, index) => (
                               <div key={leg.id} className="flex items-center gap-3 group">
                                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center text-[10px] font-sport italic text-white/20 group-hover:text-secondary transition-colors">#{index + 1}</div>
                                  <div className="flex-1 relative">
                                     <input 
                                       type="text" 
                                       inputMode="text"
                                       value={leg.odds} 
                                       onChange={(e) => updateParlayLeg(leg.id, e.target.value)}
                                       onFocus={handleFocus}
                                       className="w-full bg-black/20 border border-white/10 rounded-xl h-14 px-5 text-white font-sport text-xl italic outline-none focus:border-secondary transition-all"
                                       placeholder="+100"
                                     />
                                     <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/10 uppercase tracking-widest">American</div>
                                  </div>
                                  <button 
                                    onClick={() => removeParlayLeg(leg.id)}
                                    className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                  >
                                     <Trash2 size={16} />
                                  </button>
                               </div>
                             ))}
                          </div>

                          <div className="pt-6 border-t border-white/5">
                             <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 block mb-4">Monto Total de la Combinada</label>
                             <div className="relative">
                                <input 
                                  type="text" 
                                  inputMode="decimal"
                                  value={parlayStake} 
                                  onChange={handleInputChange(setParlayStake)}
                                  onFocus={handleFocus}
                                  className="w-full bg-black/40 border border-white/10 rounded-2xl h-20 px-8 text-white font-sport text-4xl italic outline-none focus:border-secondary transition-all"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 font-sport italic text-2xl">U</div>
                             </div>
                          </div>
                       </div>
                    )}

                    {activeTab === 'hedge' && (
                       <div className="space-y-8">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Inversión Original (Stake)</label>
                             <div className="relative">
                                <input 
                                  type="text" 
                                  inputMode="decimal"
                                  value={originalStake} 
                                  onChange={handleInputChange(setOriginalStake)}
                                  onFocus={handleFocus}
                                  className="w-full bg-black/40 border border-white/10 rounded-2xl h-16 px-8 text-white font-sport text-3xl italic outline-none focus:border-secondary transition-all"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 font-sport italic text-xl">U</div>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Cuota Original (US)</label>
                                <input 
                                  type="text" 
                                  inputMode="text"
                                  value={originalOdds} 
                                  onChange={handleInputChange(setOriginalOdds)}
                                  onFocus={handleFocus}
                                  className="w-full bg-black/40 border border-white/10 rounded-2xl h-16 px-8 text-white font-sport text-2xl italic outline-none focus:border-secondary transition-all"
                                  placeholder="+200"
                                />
                             </div>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Cuota de Cobertura (US)</label>
                                <input 
                                  type="text" 
                                  inputMode="text"
                                  value={hedgeOdds} 
                                  onChange={handleInputChange(setHedgeOdds)}
                                  onFocus={handleFocus}
                                  className="w-full bg-black/40 border border-secondary/30 rounded-2xl h-16 px-8 text-white font-sport text-2xl italic outline-none focus:border-secondary transition-all"
                                  placeholder="+150"
                                />
                             </div>
                          </div>
                          
                          <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/10 flex flex-col gap-4">
                             <div className="flex gap-4">
                                <Info className="text-secondary shrink-0" size={20} />
                                <p className="text-[10px] text-white/50 leading-relaxed uppercase font-black tracking-widest">
                                   El "Hedging" permite apostar al resultado opuesto de tu apuesta original para asegurar una ganancia sin importar quién gane.
                                </p>
                             </div>
                             
                             <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                <div className="flex items-center gap-2 text-secondary">
                                   <Zap size={14} />
                                   <span className="text-[10px] font-bold uppercase tracking-tighter italic">Tip de Oro: Asegura tu Parley</span>
                                </div>
                                <p className="text-[11px] text-white/70 leading-relaxed italic">
                                   Si tienes un parley de varios juegos y ya ganaste todos excepto el último, ¡este es el momento de cubrirte! 
                                   Ingresa el monto total de tu parley y la cuota total del ticket. Luego pon la cuota del rival que te falta. 
                                   <span className="text-secondary"> La calculadora te dirá cuánto apostar al rival para cobrar dinero sí o sí, sin importar el resultado del último juego.</span>
                                </p>
                             </div>
                          </div>
                       </div>
                    )}

                    {activeTab === 'value' && (
                       <div className="space-y-10">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Confianza del Gurú (%)</label>
                             <div className="relative">
                                <input 
                                  type="text" 
                                  inputMode="decimal"
                                  value={guruProb} 
                                  onChange={handleInputChange(setGuruProb)}
                                  onFocus={handleFocus}
                                  className="w-full bg-black/40 border border-white/10 rounded-2xl h-16 px-8 text-white font-sport text-3xl italic outline-none focus:border-secondary transition-all"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 font-sport italic text-xl">%</div>
                             </div>
                             <input 
                               type="range" 
                               min="1" 
                               max="99" 
                               step="0.1" 
                               value={parseFloat(guruProb) || 0} 
                               onChange={(e) => setGuruProb(e.target.value)}
                               className="w-full accent-secondary"
                             />
                          </div>

                          <div className="space-y-4">
                             <div className="flex justify-between items-end ml-1">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Cuota de la Casa</label>
                                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                                   <button onClick={() => setOddsFormat('american')} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${oddsFormat === 'american' ? 'bg-secondary text-white' : 'text-white/20'}`}>US</button>
                                   <button onClick={() => setOddsFormat('decimal')} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${oddsFormat === 'decimal' ? 'bg-secondary text-white' : 'text-white/20'}`}>DEC</button>
                                </div>
                             </div>
                             <input 
                               type="text" 
                               inputMode="text"
                               value={odds} 
                               onChange={handleInputChange(setOdds)}
                               onFocus={handleFocus}
                               className="w-full bg-black/40 border border-white/10 rounded-2xl h-16 px-8 text-white font-sport text-3xl italic outline-none focus:border-secondary transition-all"
                             />
                          </div>

                          <div className="p-6 rounded-2xl bg-secondary/5 border border-white/5 flex gap-4">
                             <Search className="text-secondary shrink-0" size={18} />
                             <p className="text-[10px] text-white/50 leading-relaxed uppercase font-black tracking-widest">
                                Compara la probabilidad real estimada por la IA con la cuota ofrecida por la casa para detectar errores en el mercado.
                             </p>
                          </div>
                       </div>
                    )}

                    {activeTab === 'converter' && (
                       <div className="space-y-8">
                          <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-6">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Americana</label>
                                <input 
                                  type="text" 
                                  inputMode="text"
                                  value={odds} 
                                  onChange={handleInputChange(setOdds)}
                                  onFocus={handleFocus}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl h-14 px-6 text-white font-sport text-2xl italic outline-none focus:border-secondary transition-all"
                                />
                             </div>
                             <div className="flex justify-center">
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20"><ArrowRightLeft size={16} /></div>
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Decimal</label>
                                <div className="w-full bg-secondary/5 border border-secondary/20 rounded-xl h-14 px-6 text-secondary font-sport text-2xl italic flex items-center">
                                   {americanToDecimal(odds).toFixed(2)}
                                </div>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>

                 {/* RESULTS SIDE */}
                 <div className={`lg:col-span-5 p-8 lg:p-16 ${theme === 'mlb' ? 'bg-[#001E46]' : 'bg-[#111111]'} flex flex-col justify-center relative`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
                    <div className="relative z-10 w-full">
                       <div className="flex items-center gap-3 text-secondary font-black uppercase tracking-[0.4em] text-[10px] mb-12">
                          <Zap size={16} className="fill-current animate-bounce" /> RESULTADO FINAL
                       </div>

                       {activeTab === 'payout' && (
                          <div className="space-y-10">
                             <div className="space-y-2">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Ganancia Neta (Profit)</p>
                                <div className="text-6xl lg:text-7xl font-sport italic text-emerald-400 tracking-tighter">
                                   +{calculatePayout().profit}U
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Retorno Total</p>
                                   <div className="text-3xl font-sport italic text-white tracking-tighter">
                                      {calculatePayout().payout}U
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Prob. Éxito</p>
                                   <div className="text-3xl font-sport italic text-secondary tracking-tighter">
                                      {calculatePayout().probability}%
                                   </div>
                                </div>
                             </div>
                          </div>
                       )}

                       {activeTab === 'parlay' && (
                          <div className="space-y-10">
                             <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Cuota Total</p>
                                   <div className="text-3xl font-sport italic text-secondary tracking-tighter">
                                      {calculateParlay().totalOdds > 0 ? '+' : ''}{calculateParlay().totalOdds}
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Probabilidad</p>
                                   <div className="text-3xl font-sport italic text-white tracking-tighter">
                                      {calculateParlay().probability}%
                                   </div>
                                </div>
                             </div>
                             <div className="space-y-2 pt-8 border-t border-white/5">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Ganancia Potencial</p>
                                <div className="text-6xl lg:text-7xl font-sport italic text-emerald-400 tracking-tighter">
                                   +{calculateParlay().profit}U
                                </div>
                             </div>
                          </div>
                       )}

                       {activeTab === 'hedge' && (
                          <div className="space-y-10">
                             <div className="p-8 rounded-3xl bg-secondary border border-secondary text-white shadow-2xl shadow-secondary/20">
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Stake Sugerido</p>
                                <div className="text-6xl font-sport italic tracking-tighter mb-4">
                                   {calculateHedge().hedgeStake}U
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/60">
                                   <ChevronRight size={12} /> Apostar a Cuota {hedgeOdds}
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Ganancia Asegurada</p>
                                   <div className={`text-3xl font-sport italic tracking-tighter ${parseFloat(calculateHedge().guaranteedProfit) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {calculateHedge().guaranteedProfit}U
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Inversión Total</p>
                                   <div className="text-3xl font-sport italic text-white tracking-tighter">
                                      {calculateHedge().totalInvestment}U
                                   </div>
                                </div>
                             </div>
                          </div>
                       )}

                       {activeTab === 'value' && (() => {
                          const valueData = calculateValue();
                          const VerdictIcon = valueData.verdict.icon;
                          return (
                           <div className="space-y-10">
                              <div className={`p-8 rounded-3xl border ${valueData.verdict.border} ${valueData.verdict.bg} transition-all duration-500`}>
                                 <div className="flex items-center gap-3 mb-4">
                                    <VerdictIcon className={valueData.verdict.color} size={20} />
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${valueData.verdict.color}`}>
                                       Veredicto
                                    </span>
                                 </div>
                                 <div className={`text-4xl lg:text-5xl font-sport italic tracking-tighter mb-2 ${valueData.verdict.color}`}>
                                    {valueData.verdict.label}
                                 </div>
                                 <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">
                                    {parseFloat(valueData.edge) >= 0 ? 'Ventaja' : 'Desventaja'}: {valueData.edge}%
                                 </p>
                              </div>

                              <div className="grid grid-cols-2 gap-8 pt-6">
                                 <div className="space-y-2">
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Prob. Casa</p>
                                    <div className="text-3xl font-sport italic text-white tracking-tighter">
                                       {valueData.houseProb}%
                                    </div>
                                 </div>
                                 <div className="space-y-2">
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Prob. Gurú</p>
                                    <div className="text-3xl font-sport italic text-white tracking-tighter">
                                       {guruProb}%
                                    </div>
                                 </div>
                              </div>
                           </div>
                          );
                       })()}

                       {activeTab === 'converter' && (
                          <div className="space-y-10">
                             <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center text-white/20">
                                <p className="text-[10px] font-black uppercase tracking-widest mb-4">Probabilidad</p>
                                <div className="text-5xl font-sport italic tracking-tighter text-white">
                                   {(100 / americanToDecimal(odds)).toFixed(1)}%
                                </div>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </motion.div>
        </AnimatePresence>

        {/* INFO CARDS - EXPERT TIPS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
           {[
             { title: '¿Por qué usarla?', desc: 'Evita errores de cálculo y entiende exactamente cuánto estás arriesgando en cada ticket.' },
             { title: 'La Ventaja (Vig)', desc: 'Si sumas las probabilidades de ambos lados y superan el 100%, ese extra es la comisión de la casa.' },
             { title: 'Encontrar Valor', desc: 'Si crees que un equipo tiene 60% de ganar pero la casa solo le da 50% (+100), ¡ahí hay valor!' },
             { title: 'IA Guru', desc: 'Combina esta calculadora con los picks de la IA para optimizar tu estrategia de inversión.' }
           ].map((card, i) => (
             <div key={i} className="p-6 rounded-2xl border border-white/5 bg-black/20 hover:border-secondary/20 transition-colors group">
                <h4 className="text-white font-sport italic text-sm uppercase tracking-tighter mb-3 group-hover:text-secondary transition-colors">{card.title}</h4>
                <p className="text-[9px] text-white/40 uppercase font-black leading-relaxed tracking-widest">{card.desc}</p>
             </div>
           ))}
        </div>

        <AnimatePresence>
           {isGuideOpen && <ExpertGuideModal theme={theme} onClose={() => setIsGuideOpen(false)} />}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default BetCalculator;
