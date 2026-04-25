import { db } from './firebase';
import { doc, runTransaction, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

/**
 * Verifica y actualiza la racha diaria del usuario.
 * Premios: 3 días (+5U), 5 días (+10U), 7 días (+20U)
 */
export const checkDailyStreak = async (userId) => {
  if (!userId) return null;

  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'Users', userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) return null;

      const userData = userSnap.data();
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const lastActiveDate = userData.lastActiveDate || "";
      
      // Si ya entró hoy, no hacemos nada
      if (lastActiveDate === todayStr) return { streak: userData.streakCount, rewarded: 0 };

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      let reward = 0;

      // Si ayer estuvo activo, incrementamos. Si no, reiniciamos a 1.
      if (lastActiveDate === yesterdayStr) {
        newStreak = (userData.streakCount || 0) + 1;
      }

      // Cálculo de recompensas
      if (newStreak === 3) reward = 5;
      else if (newStreak === 5) reward = 10;
      else if (newStreak === 7) reward = 20;

      const updateData = {
        lastActiveDate: todayStr,
        streakCount: newStreak,
        bankroll: Number((Number(userData.bankroll || 0) + reward).toFixed(2))
      };

      // Reiniciamos racha después de los 7 días para empezar de nuevo el ciclo
      if (newStreak > 7) {
        updateData.streakCount = 1;
      }

      transaction.update(userRef, updateData);
      
      return { 
        streak: updateData.streakCount, 
        rewarded: reward,
        message: reward > 0 ? `¡Racha de ${newStreak} días! Ganaste ${reward}U` : null
      };
    });
  } catch (error) {
    console.error("Streak Error:", error);
    return null;
  }
};

/**
 * Valida si el usuario ha completado misiones diarias.
 * - Primer Pick: +2U
 * - Full Roster (5 picks): +5U
 */
export const checkDailyMissions = async (userId) => {
  if (!userId) return null;

  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Consultar los picks de hoy
    const q = query(
      collection(db, 'picks'),
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(startOfToday))
    );
    const snapshot = await getDocs(q);
    const picksCount = snapshot.size;

    if (picksCount === 0) return null;

    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'Users', userId);
      const userSnap = await transaction.get(userRef);
      const userData = userSnap.data();

      // Control de misiones ya pagadas hoy
      const lastMissionDate = userData.lastMissionDate || "";
      const completedMissions = lastMissionDate === todayStr ? (userData.completedMissions || []) : [];

      let reward = 0;
      let newMissions = [...completedMissions];

      // Misión 1: Primer Pick (+2U)
      if (picksCount >= 1 && !newMissions.includes('first_pick')) {
        reward += 2;
        newMissions.push('first_pick');
      }

      // Misión 2: Full Roster (+5U)
      if (picksCount >= 5 && !newMissions.includes('full_roster')) {
        reward += 5;
        newMissions.push('full_roster');
      }

      if (reward > 0) {
        transaction.update(userRef, {
          bankroll: Number((Number(userData.bankroll || 0) + reward).toFixed(2)),
          lastMissionDate: todayStr,
          completedMissions: newMissions
        });
        return { reward, missions: newMissions };
      }

      return null;
    });
  } catch (error) {
    console.error("Mission Error:", error);
    return null;
  }
};
