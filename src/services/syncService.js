import { db } from './firebase';
import { collection, query, where, getDocs, doc, runTransaction, updateDoc } from 'firebase/firestore';
import { fetchMLBGames } from './mlbApi';
import { updateStreak } from './winStreakService';

/**
 * Automáticamente verifica y liquida los picks pendientes del usuario.
 * @param {string} userId - ID del usuario actual.
 * @returns {Promise<{processed: number, wins: number, losses: number}>}
 */
export const syncUserPicks = async (userId) => {
  if (!userId) return { processed: 0, wins: 0, losses: 0 };

  let processedCount = 0;
  let winCount = 0;
  let loseCount = 0;

  try {
    // 1. Obtener picks pendientes del usuario
    const q = query(
      collection(db, 'picks'), 
      where('userId', '==', userId), 
      where('status', '==', 'pendiente')
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return { processed: 0, wins: 0, losses: 0 };

    // 2. Preparar fechas para consultar la API (Hoy, Ayer, Antier)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const dayBefore = new Date(Date.now() - (86400000 * 2)).toISOString().split('T')[0];

    const [todayGames, yesterdayGames, dayBeforeGames] = await Promise.all([
      fetchMLBGames(today),
      fetchMLBGames(yesterday),
      fetchMLBGames(dayBefore)
    ]);

    const gamesMap = {};
    [...todayGames, ...yesterdayGames, ...dayBeforeGames].forEach(g => {
      gamesMap[g.gamePk.toString()] = g;
    });

    // 3. Procesar cada pick pendiente
    for (const pickDoc of snapshot.docs) {
      const pick = { id: pickDoc.id, ...pickDoc.data() };
      const game = gamesMap[pick.gamePk];

      // Verificamos si el juego ha terminado
      if (game && (game.status.detailedState === 'Final' || game.status.detailedState === 'Game Over')) {
        const homeWin = game.teams.home.score > game.teams.away.score;
        const winnerTeam = homeWin ? game.teams.home.team.name : game.teams.away.team.name;
        const didWin = pick.team === winnerTeam;

        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'Users', userId);
          const userSnap = await transaction.get(userRef);
          if (!userSnap.exists()) return;

          const userData = userSnap.data();
          const pickRef = doc(db, 'picks', pick.id);
          
          let currentBankroll = Number(userData.bankroll || 0);

          if (didWin) {
            const potentialWin = Number(pick.potentialWin || 0);
            const stake = Number(pick.stake || 0);
            const totalReturn = stake + potentialWin;
            currentBankroll = Number((currentBankroll + totalReturn).toFixed(2));
            
            transaction.update(userRef, { 
              bankroll: currentBankroll
            });
            transaction.update(pickRef, { status: 'ganado' });
            winCount++;
          } else {
            transaction.update(pickRef, { status: 'perdido' });
            loseCount++;
          }
        });
        
        // Use centralized winStreakService to handle streaks and bonuses
        await updateStreak(userId, didWin ? 'ganado' : 'perdido');
        processedCount++;
      }
    }

    if (processedCount > 0) {
      console.log(`[Auto-Sync] ${processedCount} picks sincronizados: ${winCount} G - ${loseCount} P`);
    }

    return { processed: processedCount, wins: winCount, losses: loseCount };
  } catch (error) {
    console.error('[Auto-Sync Error]', error);
    return { processed: 0, wins: 0, losses: 0, error };
  }
};

/**
 * Sincroniza el historial global del Gurú AI.
 */
export const syncGuruPicks = async () => {
  try {
    const q = query(collection(db, 'guru_picks'), where('status', '==', 'pendiente'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    // 1. Obtener calendario de los últimos 7 días para un barrido inicial
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const allSchedules = await Promise.all(dates.map(date => fetchMLBGames(date)));
    const gamesMap = {};
    allSchedules.flat().forEach(g => { 
      if (g && g.gamePk) gamesMap[g.gamePk.toString()] = g; 
    });

    for (const pickDoc of snapshot.docs) {
      const pick = { id: pickDoc.id, ...pickDoc.data() };
      let game = gamesMap[pick.gamePk];

      // 2. Si no aparece en el calendario general, buscar el juego individualmente
      if (!game) {
        try {
          const res = await fetch(`https://statsapi.mlb.com/api/v1/game/${pick.gamePk}/feed/live`);
          const data = await res.json();
          if (data && data.gameData) {
            game = {
              gamePk: pick.gamePk,
              status: data.gameData.status,
              teams: data.gameData.teams
            };
            if (data.liveData?.linescore?.teams) {
               game.teams.home.score = data.liveData.linescore.teams.home.runs;
               game.teams.away.score = data.liveData.linescore.teams.away.runs;
            }
          }
        } catch (e) { console.error(`[Sync] Error buscando juego individual ${pick.gamePk}:`, e); }
      }

      if (game && (game.status.detailedState === 'Final' || game.status.detailedState === 'Game Over' || game.status.abstractGameState === 'Final' || game.status.codedGameState === 'F')) {
        let didWin = false;
        let isReady = false;
        const hScore = Number(game.teams.home.score || 0);
        const aScore = Number(game.teams.away.score || 0);

        console.log(`[Sync] JUEGO FINALIZADO: ${pick.team} | Score: ${aScore}-${hScore}`);

        if (pick.type === 'ml' || pick.guruPropType === 'MONEYLINE') {
          const winner = hScore > aScore ? game.teams.home.team.name : game.teams.away.team.name;
          didWin = winner.includes(pick.team) || pick.team.includes(winner);
          isReady = true;
        } else if (pick.type === 'totals' || pick.guruPropType === 'TOTALS') {
          const total = hScore + aScore;
          const isOver = pick.pick?.toUpperCase().includes('OVER') || pick.guruPropType?.includes('OVER') || pick.pick?.toUpperCase().includes('MAS');
          const target = pick.expectedTotal || parseFloat(pick.pick?.replace(/[^\d.]/g, '')) || 0;
          
          if (target > 0) {
            didWin = isOver ? total > target : total < target;
            isReady = true;
          }
        } else if (pick.type?.includes('nrfi') || pick.guruPropType === 'NRFI') {
          try {
            const res = await fetch(`https://statsapi.mlb.com/api/v1/game/${pick.gamePk}/linescore`);
            const linescore = await res.json();
            const firstInning = linescore.innings?.[0];
            if (firstInning) {
              const runs = (firstInning.home.runs || 0) + (firstInning.away.runs || 0);
              didWin = runs === 0;
              isReady = true;
              console.log(`[Sync] NRFI Check: Inning 1 Runs: ${runs} -> ${didWin ? 'G' : 'P'}`);
            }
          } catch (e) { console.error("Error NRFI:", e); }
        } else if (pick.type?.includes('k-pro') || pick.type?.includes('strikeouts') || pick.guruPropType === 'STRIKEOUTS' || pick.guruPropType === 'K-PRO') {
          try {
            const res = await fetch(`https://statsapi.mlb.com/api/v1/game/${pick.gamePk}/boxscore`);
            const box = await res.json();
            const players = { ...box.teams.home.players, ...box.teams.away.players };
            
            const searchName = (pick.team || '').replace('K-PRO:', '').split('(')[0].trim().toUpperCase();
            const pitcherStats = Object.values(players).find(p => {
               const fullName = p.person.fullName.toUpperCase();
               return fullName.includes(searchName) || searchName.includes(fullName.split(' ').pop());
            });

            if (pitcherStats?.stats?.pitching) {
              const actualK = pitcherStats.stats.pitching.strikeOuts || 0;
              const pickStr = pick.pick || '0.5';
              const target = parseFloat(pickStr.replace(/[^\d.]/g, '')) || 0.5;
              didWin = actualK > target;
              isReady = true;
              console.log(`[Sync] K-PRO: ${searchName} hizo ${actualK} K (Meta: ${target}) -> ${didWin ? 'G' : 'P'}`);
            }
          } catch (e) { console.error("Error ponches:", e); }
        }

        if (isReady) {
          try {
            await updateDoc(doc(db, 'guru_picks', pick.id), { 
              status: didWin ? 'ganado' : 'perdido',
              lastAudit: new Date().toISOString()
            });
            console.log(`[Sync] OK: ${pick.team} actualizado a ${didWin ? 'GANADO' : 'PERDIDO'}`);
          } catch (err) {
             console.error("[Sync] Error escribiendo en DB:", err);
          }
        }
      }
    }
  } catch (error) {
    console.error('[Guru-Sync Error]', error);
  }
};
