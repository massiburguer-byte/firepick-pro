import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTopExperts, followExpert, unfollowExpert, isFollowing } from '../services/expertsService';
import { 
  Award, 
  TrendingUp, 
  Users, 
  Star, 
  CheckCircle2, 
  Flame,
  UserPlus,
  UserMinus,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const FollowExpertsWidget = () => {
  const { user } = useAuth();
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('top');
  const [followStatus, setFollowStatus] = useState({});

  useEffect(() => {
    const loadExperts = async () => {
      setLoading(true);
      try {
        const topExperts = await getTopExperts('winRate', 5);
        setExperts(topExperts);

        if (user) {
          const statusMap = {};
          for (const expert of topExperts) {
            const isFollowed = await isFollowing(user.uid, expert.id);
            statusMap[expert.id] = isFollowed;
          }
          setFollowStatus(statusMap);
        }
      } catch (error) {
        console.error('Error loading experts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExperts();
  }, [user]);

  const handleFollowToggle = async (expertId) => {
    if (!user) {
      toast.error('Registrate para seguir expertos');
      return;
    }

    try {
      const isCurrentlyFollowing = followStatus[expertId];
      if (isCurrentlyFollowing) {
        await unfollowExpert(user.uid, expertId);
        setFollowStatus(prev => ({ ...prev, [expertId]: false }));
      } else {
        await followExpert(user.uid, expertId);
        setFollowStatus(prev => ({ ...prev, [expertId]: true }));
      }

      const updatedExperts = await getTopExperts('winRate', 5);
      setExperts(updatedExperts);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const getExpertBadge = (expert) => {
    const winRate = expert.winRate;
    if (winRate >= 65) return { label: 'ELITE', color: 'bg-amber-600/20 text-amber-500', icon: <Award size={10} /> };
    if (winRate >= 60) return { label: 'PRO', color: 'bg-[#2563EB]/20 text-[#2563EB]', icon: <Star size={10} /> };
    if (winRate >= 55) return { label: 'HOT', color: 'bg-[#10B981]/20 text-[#10B981]', icon: <Flame size={10} /> };
    return { label: 'EXP', color: 'bg-white/5 text-[#8B949E]', icon: <CheckCircle2 size={10} /> };
  };

  if (loading) return (
    <div className="bg-[#161B22] rounded-2xl p-6 border border-white/5 animate-pulse min-h-[200px] flex items-center justify-center">
       <Users size={24} className="text-white/5" />
    </div>
  );

  if (experts.length === 0) return null;

  return (
    <div className="bg-[#161B22] rounded-2xl p-5 border border-white/5 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-[#2563EB]" />
          <h3 className="font-sport text-[10px] text-white uppercase tracking-widest italic">Expertos Élite</h3>
        </div>
        
        <div className="flex gap-1.5">
          <button 
            onClick={() => setActiveTab('top')}
            className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all ${
              activeTab === 'top' ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-[#8B949E]'
            }`}
          >
            TOP
          </button>
          {user && (
            <button 
              onClick={() => setActiveTab('following')}
              className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all ${
                activeTab === 'following' ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-[#8B949E]'
              }`}
            >
              SIGUIENDO
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        {experts.map((expert, index) => {
          const badge = getExpertBadge(expert);
          const isFollowed = followStatus[expert.id] || false;
          return (
            <div key={expert.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                <div className="relative">
                   <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-sport text-xs shrink-0 bg-white/5 border border-white/5 text-white/40`}>
                    {index + 1}
                  </div>
                  <div className={`absolute -top-1.5 -right-1.5 ${badge.color} px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-tighter flex items-center gap-0.5 border border-black/20`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-sport text-sm text-white leading-tight truncate italic mb-1">
                    {expert.displayName}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-[#10B981] uppercase tracking-tighter">
                      {expert.winRate}% WR
                    </span>
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">
                      {expert.completedPicks} PICKS
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleFollowToggle(expert.id)}
                className={`p-2 rounded-xl transition-all active:scale-90 ${
                  user && expert.id !== user.uid
                    ? isFollowed
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white/5 text-[#2563EB] border border-[#2563EB]/20 hover:bg-[#2563EB] hover:text-white'
                    : 'hidden'
                }`}
              >
                {isFollowed ? <UserMinus size={14} /> : <UserPlus size={14} />}
              </button>
            </div>
          );
        })}
      </div>

      <button className="mt-5 text-[8px] font-black text-[#2563EB] hover:text-white uppercase tracking-[0.2em] transition-colors flex items-center gap-1 mx-auto bg-white/5 px-4 py-2 rounded-xl border border-white/5">
        VER RANKING GLOBAL <ChevronRight size={10} />
      </button>
    </div>
  );
};