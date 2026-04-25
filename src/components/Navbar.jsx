import React, { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, Trophy, Settings, Wallet, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const Navbar = () => {
  const { user, userData, logout, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const [dailyPicksCount, setDailyPicksCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let unsubscribePicks;
    if (user) {
      const qPicks = query(
        collection(db, 'picks'),
        where('userId', '==', user.uid)
      );
      
      unsubscribePicks = onSnapshot(qPicks, (snapshot) => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const count = snapshot.docs.filter(d => {
          const data = d.data();
          if (!data.createdAt) return false;
          const pickDate = data.createdAt.toDate ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime();
          return pickDate >= startOfToday;
        }).length;
        setDailyPicksCount(count);
      });
    }
    return () => {
      if (unsubscribePicks) unsubscribePicks();
    };
  }, [user]);

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/history', label: 'Historial' },
    { path: '/guru-history', label: 'Gurú' },
    { path: '/standings', label: 'Posiciones' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/calculator', label: 'Calculadora' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', label: 'Admin' });
  }

  return (
    <header className="sticky top-0 left-0 right-0 z-50 transition-all border-b border-white/5">
      {/* SLIM TOP HUD (DESKTOP ONLY) */}
      <div className={`hidden lg:flex transition-colors duration-500 ${theme === 'mlb' ? 'bg-[#001E46]' : 'bg-[#111111]'} border-b border-white/5 py-1 px-8 justify-end items-center gap-6`}>
        <div className="flex items-center gap-5 text-[9px] font-black tracking-[0.15em] uppercase text-white/40">
          <div className="flex items-center gap-2">
            <Wallet size={10} className="text-secondary" />
            <span className="text-white">{userData?.bankroll || 0} UNITS</span>
          </div>
          <div className="w-[1px] h-3 bg-white/10" />
          <div className="flex items-center gap-2">
            <Trophy size={10} className="text-primary" />
            <span className={dailyPicksCount >= 5 ? 'text-danger' : 'text-primary'}>
              LIMIT: {dailyPicksCount}/5
            </span>
          </div>
        </div>
      </div>

      {/* MAIN NAVBAR */}
      <nav className={`transition-colors duration-500 ${theme === 'mlb' ? 'bg-[#001E46]' : 'bg-[#111111]'} flex justify-center h-14 lg:h-16 w-full relative`}>
        <div className="container mx-auto flex items-center justify-between gap-4 px-6 lg:px-12 max-w-7xl h-full">
          {/* PROFILE (LEFT ON MOBILE) */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden lg:hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            
            {/* LOGO */}
            <Link to="/" className="group flex items-center gap-2 py-1">
              <span className="font-sport text-xl md:text-2xl tracking-tighter text-white italic uppercase">
                Fantasy<span className="text-secondary">Sport</span>
              </span>
            </Link>
          </div>

          {/* NAV LINKS (DESKTOP ONLY) */}
          <div className="hidden lg:flex items-stretch h-full gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-4 flex items-center h-full transition-all group ${
                  location.pathname === item.path ? 'bg-white/5 text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <span className="font-sport text-[10px] tracking-[0.2em] relative z-10 transition-transform uppercase">
                  {item.label}
                </span>
                
                {location.pathname === item.path && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary" />
                )}
              </Link>
            ))}
          </div>

          {/* MOBILE HUD / DESKTOP SETTINGS / THEME SWITCHER */}
          <div className="flex items-center gap-3 lg:gap-4">
             {/* THEME SWITCHER */}
             <div className="flex bg-black/20 p-1 rounded-full border border-white/5">
                <button 
                  onClick={() => setTheme('mlb')}
                  className={`p-1.5 rounded-full transition-all ${theme === 'mlb' ? 'bg-secondary text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                  title="MLB Style"
                >
                  <Sun size={14} />
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-black/60'}`}
                  title="Midnight Mode"
                >
                  <Moon size={14} />
                </button>
             </div>

             {/* Mobile Units Badge */}
             <div className="lg:hidden flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                <Wallet size={12} className="text-warning" />
                <span className="text-[10px] font-black text-white">{userData?.bankroll || 0}U</span>
             </div>

             <div className="hidden lg:flex w-8 h-8 rounded-full border border-white/10 bg-white/5 items-center justify-center text-white/50 hover:text-white hover:bg-white/10 cursor-pointer transition-all">
                <Settings size={16} />
             </div>
             <div className="hidden lg:block w-9 h-9 rounded-full border-2 border-secondary overflow-hidden shadow-sm">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="avatar" className="w-full h-full object-cover" />
             </div>
             
             <button onClick={logout} className="lg:hidden text-white/40 p-1">
                <LogOut size={16} />
             </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
