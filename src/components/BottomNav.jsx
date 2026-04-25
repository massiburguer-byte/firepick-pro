import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { 
  Home, 
  History, 
  Brain, 
  Trophy, 
  LayoutGrid
} from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const { theme } = useTheme();

  const navItems = [
    { path: '/', label: 'Board', icon: Home },
    { path: '/history', label: 'Picks', icon: History },
    { path: '/guru-history', label: 'Gurú', icon: Brain, highlighted: true },
    { path: '/leaderboard', label: 'Estatus', icon: LayoutGrid },
    { path: '/standings', label: 'MLB', icon: Trophy },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6">
      <div className={`backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden transition-all duration-500 ${theme === 'mlb' ? 'bg-[#002D72]/90' : 'bg-[#111111]/90'}`}>
        <nav className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative h-full flex flex-col items-center justify-center flex-1"
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className={`absolute inset-x-1 inset-y-1 rounded-2xl z-0 ${theme === 'mlb' ? 'bg-white/10' : 'bg-white/5'}`}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                  />
                )}
                
                <div className={`relative z-10 flex flex-col items-center gap-1 ${isActive ? 'text-white' : 'text-white/40'}`}>
                  <div className={`relative ${item.highlighted && isActive ? 'animate-pulse' : ''}`}>
                    <Icon size={20} />
                    {isActive && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full border ${theme === 'mlb' ? 'bg-secondary border-primary' : 'bg-white border-black'}`} 
                      />
                    )}
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default BottomNav;
