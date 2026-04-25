// src/components/WinStreakBadge.jsx

import React from 'react';
import { Crown } from 'lucide-react';

/**
 * Displays the current win streak as a badge.
 * Props:
 *   streak (number) – current consecutive wins.
 */
export const WinStreakBadge = ({ streak }) => {
  if (!streak || streak <= 0) return null;
  return (
    <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full shadow-sm">
      <Crown size={16} className="text-primary" />
      <span className="font-sport text-sm">{streak}️⃣ Streak</span>
    </div>
  );
};
