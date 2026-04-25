import React from 'react';

export const GameSkeleton = () => (
  <div className="flex items-center gap-4 bg-[#161B22] border-b border-white/5 p-3 animate-pulse">
    <div className="w-16 h-8 bg-white/5 rounded-lg pr-4" />
    <div className="flex-1 grid grid-cols-2 gap-4">
      <div className="h-10 bg-white/5 rounded-xl border border-white/5" />
      <div className="h-10 bg-white/5 rounded-xl border border-white/5" />
    </div>
    <div className="w-24 h-8 bg-white/5 rounded-lg ml-4" />
  </div>
);

export const WidgetSkeleton = () => (
  <div className="bg-[#161B22] rounded-2xl p-5 border border-white/5 animate-pulse space-y-5">
    <div className="flex justify-between items-center border-b border-white/5 pb-3">
      <div className="h-4 w-24 bg-white/5 rounded" />
      <div className="h-4 w-10 bg-white/5 rounded" />
    </div>
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-full bg-white/5 rounded" />
            <div className="h-2 w-1/2 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const StatisticsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-pulse">
    <div className="md:col-span-1 bg-[#161B22] rounded-2xl border border-white/5 p-5 h-24" />
    <div className="md:col-span-3 bg-[#161B22] rounded-2xl border border-white/5 p-5 h-24" />
  </div>
);
