// src/services/winStreakService.js

import { db } from './firebase';
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

/**
 * Get the current win streak for a user.
 * Returns an object { streak: number, lastResult: 'ganado'|'perdido'|null }
 */
export const getUserStreak = async (userId) => {
  if (!userId) throw new Error('Missing userId');
  const ref = doc(db, 'Users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { streak: 0, lastResult: null };
  const data = snap.data();
  return {
    streak: data.winStreak ?? 0,
    lastResult: data.lastResult ?? null,
  };
};

/**
 * Update the win streak after a bet result.
 * `result` should be either 'ganado' or 'perdido'.
 * Returns the new streak count.
 */
export const updateStreak = async (userId, result) => {
  if (!userId) throw new Error('Missing userId');
  if (!['ganado', 'perdido'].includes(result)) throw new Error('Invalid result');

  const userRef = doc(db, 'Users', userId);
  const snap = await getDoc(userRef);
  const data = snap.data() || {};
  let newStreak = 0;
  if (result === 'ganado') {
    // Continue streak if previous result was also a win
    newStreak = (data.lastResult === 'ganado' ? (data.winStreak ?? 0) + 1 : 1);
  } else {
    // Reset streak on loss
    newStreak = 0;
  }

  await updateDoc(userRef, {
    winStreak: newStreak,
    lastResult: result,
    streakUpdatedAt: serverTimestamp(),
  });

  // Award bonus units at milestones
  const bonuses = { 3: 5, 5: 10 }; // streak: bonus units
  if (bonuses[newStreak]) {
    // Increment bankroll safely using a transaction
    await updateDoc(userRef, {
      bankroll: increment(bonuses[newStreak]),
    });
  }

  return newStreak;
};

/**
 * Helper to get the bonus for a given streak (used by UI).
 */
export const getStreakBonus = (streak) => {
  const bonuses = { 3: 5, 5: 10 };
  return bonuses[streak] || 0;
};
