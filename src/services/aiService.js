import { fetchMLBGames, fetchPitcherStats, fetchTeamHittingStats, fetchMLBStandings, fetchTeamBullpenStats, fetchTeamRecentGames } from './mlbApi';

/**
 * AI Guru Analysis Service - PRO VERSION v8.0
 * The most advanced predictive engine, incorporating Luck Factors (LOB%), 
 * Power Indices (ISO), and Situational Fatigue.
 */

// Global Park Factors (Simplified) - Impact on Totals
const PARK_FACTORS = {
  'Coors Field': 1.25,      // High Altitude (COL)
  'Great American': 1.15,   // Small Park (CIN)
  'Yankee Stadium': 1.10,
  'Chase Field': 1.08,
  'Petco Park': 0.85,       // Pitcher Friendly (SD)
  'Oracle Park': 0.88,      // Pitcher Friendly (SF)
  'Tropicana Field': 0.92
};

export const getAiInsights = async (date) => {
  try {
    const formattedDate = date || new Date().toISOString().split('T')[0];
    const [games, standings, hittingStats] = await Promise.all([
      fetchMLBGames(formattedDate),
      fetchMLBStandings(),
      fetchTeamHittingStats()
    ]);

    if (!games || games.length === 0) return { ml: [], underdog: [], strikeouts: [], totals: [], byGame: {} };

    const teamHittingMap = {};
    hittingStats.forEach(h => teamHittingMap[h.team.id] = h.stat);

    const teamRecordMap = {};
    standings.forEach(league => {
      league.teamRecords.forEach(teamRec => {
        teamRecordMap[teamRec.team.id] = {
          winPercent: teamRec.winningPercentage,
          streak: teamRec.streak?.streakCode,
          runsScored: teamRec.runsScored,
          runsAllowed: teamRec.runsAllowed
        };
      });
    });

    const insights = {
      ml: [],
      underdog: [],
      strikeouts: [],
      totals: [],
      byGame: {}
    };

    const analysisPromises = games.map(async (game) => {
      try {
        if (!game || !game.teams || !game.teams.home || !game.teams.away) {
          console.warn(`Skipping game ${game?.gamePk} due to missing structure`);
          return;
        }

        const homeTeam = game.teams.home;
        const awayTeam = game.teams.away;
        const homePitcherId = homeTeam?.probablePitcher?.id;
        const awayPitcherId = awayTeam?.probablePitcher?.id;

        // Fetch all data in parallel with fallbacks
        const [homePitcherRaw, awayPitcherRaw, homeBullpen, awayBullpen, hRecent, aRecent] = await Promise.all([
          homePitcherId ? fetchPitcherStats(homePitcherId) : Promise.resolve(null),
          awayPitcherId ? fetchPitcherStats(awayPitcherId) : Promise.resolve(null),
          fetchTeamBullpenStats(homeTeam?.team?.id).catch(() => null),
          fetchTeamBullpenStats(awayTeam?.team?.id).catch(() => null),
          fetchTeamRecentGames(homeTeam?.team?.id).catch(() => []),
          fetchTeamRecentGames(awayTeam?.team?.id).catch(() => [])
        ]);

        // SABERMETRIC METRICS
        const homeSP = calculatePitcherMetrics(homePitcherRaw);
        const awaySP = calculatePitcherMetrics(awayPitcherRaw);

        // BULLPEN FATIGUE LOGIC
        const hFatigue = calculateFatigue(hRecent) || 1.0;
        const aFatigue = calculateFatigue(aRecent) || 1.0;

        const homeBP = { era: Number(homeBullpen?.era) || 4.2, whip: Number(homeBullpen?.whip) || 1.3 };
        const awayBP = { era: Number(awayBullpen?.era) || 4.2, whip: Number(awayBullpen?.whip) || 1.3 };

        // HITTING POWER (ISO)
        const homeHitting = teamHittingMap[homeTeam?.team?.id] || { strikeOuts: 0, gamesPlayed: 162, runsScored: 700 };
        const awayHitting = teamHittingMap[awayTeam?.team?.id] || { strikeOuts: 0, gamesPlayed: 162, runsScored: 700 };
        
        const homeISO = calculateISO(homeHitting) || 0.150;
        const awayISO = calculateISO(awayHitting) || 0.150;
        const homeRec = teamRecordMap[homeTeam?.team?.id] || { winPercent: 0.5 };

        // --- 1. PRO MONEYLINE PROBABILITY ---
        const homePower = ((10 - (homeSP?.fip || 4.5)) * 0.3) + (homeISO * 20) + ((10 - (homeBP.era * hFatigue)) * 0.2) + ((homeSP?.lob || 72) * 0.1);
        const awayPower = ((10 - (awaySP?.fip || 4.5)) * 0.3) + (awayISO * 20) + ((10 - (awayBP.era * aFatigue)) * 0.2) + ((awaySP?.lob || 72) * 0.1);
        
        let hProb = (homePower / Math.max(0.1, homePower + awayPower)) * 100 + (Number(homeRec.winPercent || 0.5) - 0.5) * 15;
        if (!isFinite(hProb) || isNaN(hProb)) hProb = 50;
        hProb = Math.min(95, Math.max(5, hProb));
        const aProb = 100 - hProb;

        // --- 2. STRIKEOUTS ---
        const hKRate = Number(awayHitting?.strikeOuts || 0) / Math.max(1, Number(awayHitting?.gamesPlayed || 100));
        const aKRate = Number(homeHitting?.strikeOuts || 0) / Math.max(1, Number(homeHitting?.gamesPlayed || 100));
        const homeKExp = ((homeSP?.k9 || 7.5) * 0.55) + (hKRate * 0.45);
        const awayKExp = ((awaySP?.k9 || 7.5) * 0.55) + (aKRate * 0.45);
        const hKTarget = Math.max(0.5, Math.round(homeKExp) - 0.5);
        const aKTarget = Math.max(0.5, Math.round(awayKExp) - 0.5);
        const hKProb = isFinite(homeKExp / hKTarget) ? Math.min(99, (homeKExp / hKTarget) * 65) : 50;
        const aKProb = isFinite(awayKExp / aKTarget) ? Math.min(99, (awayKExp / aKTarget) * 65) : 50;

        // --- 3. TOTALS & ENVIRONMENT ---
        const hRPG = Number(homeHitting.runsScored || 450) / Math.max(1, Number(homeHitting.gamesPlayed || 100));
        const aRPG = Number(awayHitting.runsScored || 450) / Math.max(1, Number(awayHitting.gamesPlayed || 100));
        const venueName = game.venue?.name || 'MLB Stadium';
        const parkMult = PARK_FACTORS[venueName] || 1.0;
        const weather = game.weather || { temp: 70, condition: 'Clear' };

        const pitchingERA = ((homeSP?.era || 4.5) + (awaySP?.era || 4.5));
        const bullpenERA = (homeBP.era * hFatigue + awayBP.era * aFatigue);
        let rawTotal = (((hRPG + aRPG) * 0.4) + (pitchingERA * 0.4) + (bullpenERA * 0.2)) * parkMult;
        
        if (weather.condition?.toLowerCase().includes('rain') || (weather.temp || 70) < 50) rawTotal -= 0.5;
        if (weather.condition?.toLowerCase().includes('sunny') && (weather.temp || 70) > 85) rawTotal += 0.5;

        const expectedTotal = Math.min(12.5, Math.max(6.5, Number(rawTotal.toFixed(1)) || 8.5));
        const tProb = Math.min(82, 55 + (Math.abs(expectedTotal - 8.5) * 6));
        const nrfiProb = Math.min(85, Math.max(15, (100 - ((homeSP?.fip || 4.5) * 8 + (awaySP?.fip || 4.5) * 8 + (homeSP?.whip || 1.3) * 10))));

        // PUSH INSIGHTS
        if (hProb > 60) {
          insights.ml.push({
            gamePk: game.gamePk,
            team: homeTeam?.team?.name || 'Home',
            side: 'home',
            confidence: hProb.toFixed(1),
            reason: `Diferencial de WHIP y ventaja de bullpen sugieren victoria local.`,
            details: { sp_era: homeSP.era, bp_era: homeBP.era * hFatigue }
          });
        }
        if (aProb > 60) {
          insights.ml.push({
            gamePk: game.gamePk,
            team: awayTeam?.team?.name || 'Away',
            side: 'away',
            confidence: aProb.toFixed(1),
            reason: `La ofensiva visitante enfrenta a un bullpen fatigado.`,
            details: { sp_era: awaySP.era, bp_era: awayBP.era * aFatigue }
          });
        }
        if (hKProb > 72) {
          insights.strikeouts.push({
            gamePk: game.gamePk,
            pitcher: homeTeam?.probablePitcher?.fullName || 'Pitcher',
            team: homeTeam?.team?.name || 'Home',
            side: 'home',
            target: hKTarget,
            pick: `MÁS DE ${hKTarget}`,
            confidence: hKProb.toFixed(0)
          });
        }
        if (aKProb > 72) {
          insights.strikeouts.push({
            gamePk: game.gamePk,
            pitcher: awayTeam?.probablePitcher?.fullName || 'Pitcher',
            team: awayTeam?.team?.name || 'Away',
            side: 'away',
            target: aKTarget,
            pick: `MÁS DE ${aKTarget}`,
            confidence: aKProb.toFixed(0)
          });
        }
        if (tProb > 62) {
          insights.totals.push({
            gamePk: game.gamePk,
            matchup: `${awayTeam?.team?.name || 'Visitor'} @ ${homeTeam?.team?.name || 'Home'}`,
            pick: expectedTotal > 8.5 ? 'OVER' : 'UNDER',
            expectedTotal: expectedTotal,
            confidence: tProb.toFixed(1)
          });
        }

        insights.byGame[game.gamePk] = {
          ml: { home: hProb.toFixed(1), away: aProb.toFixed(1) },
          fip: { home: (homeSP.fip).toFixed(2), away: (awaySP.fip).toFixed(2) },
          k: {
            home: { pitcher: homeTeam?.probablePitcher?.fullName || 'TBD', target: hKTarget, probability: hKProb.toFixed(1), opponentKRate: (hKRate || 0).toFixed(1) },
            away: { pitcher: awayTeam?.probablePitcher?.fullName || 'TBD', target: aKTarget, probability: aKProb.toFixed(1), opponentKRate: (aKRate || 0).toFixed(1) }
          },
          totals: {
            recommendation: expectedTotal > 8.5 ? 'OVER' : 'UNDER',
            target: 8.5,
            probability: tProb.toFixed(1),
            expected: expectedTotal,
            nrfi: nrfiProb.toFixed(1)
          },
          advanced: {
            luck: { home: homeSP.luckBadge, away: awaySP.luckBadge },
            fatigue: { home: hFatigue > 1.1 ? 'Cansado' : 'Fresco', away: aFatigue > 1.1 ? 'Cansado' : 'Fresco' },
            iso: { home: homeISO.toFixed(3), away: awayISO.toFixed(3) },
            lob: { home: homeSP.lob.toFixed(1), away: awaySP.lob.toFixed(1) }
          },
          bullpen: {
            home: { era: (homeBP.era * hFatigue).toFixed(2), whip: (homeBP.whip).toFixed(2) },
            away: { era: (awayBP.era * aFatigue).toFixed(2), whip: (awayBP.whip).toFixed(2) }
          },
          environment: { weather, venue: venueName }
        };

      } catch (gameErr) {
        console.error(`Error analyzing game ${game?.gamePk}:`, gameErr);
      }
    });

    await Promise.all(analysisPromises);
    // Safety check for sorting
    insights.ml = insights.ml.filter(i => i.confidence).sort((a,b) => Number(b.confidence) - Number(a.confidence));
    insights.strikeouts = insights.strikeouts.filter(i => i.confidence).sort((a,b) => Number(b.confidence) - Number(a.confidence));
    insights.totals = insights.totals.filter(i => i.confidence).sort((a,b) => Number(b.confidence) - Number(a.confidence));
    
    return insights;

  } catch (err) {
    console.error('AI Insights Calculation Error:', err);
    return { ml: [], underdog: [], strikeouts: [], totals: [], byGame: {} };
  }
};

const calculatePitcherMetrics = (stat) => {
  const defaults = { era: 4.5, whip: 1.3, k9: 7.5, fip: 4.5, lob: 72, luckBadge: 'Normal' };
  if (!stat || typeof stat !== 'object') return defaults;

  const era = Number(stat.era) || defaults.era;
  const whip = Number(stat.whip) || defaults.whip;
  const so = Number(stat.strikeOuts) || 0;
  const bb = Number(stat.baseOnBalls) || 0;
  const hr = Number(stat.homeRuns) || 0;
  const ip = Number(stat.inningsPitched) || 1;
  const h = Number(stat.hits) || 0;
  const r = Number(stat.runs) || 0;

  const fip = ((13 * hr + 3 * bb - 2 * so) / Math.max(0.1, ip)) + 3.10;
  const lob = ((h + bb - r) / Math.max(0.1, (h + bb - (1.4 * hr)))) * 100;
  
  let luckBadge = 'Realista';
  if (lob > 82) luckBadge = 'Suertudo';
  if (lob < 68) luckBadge = 'Mala Suerte';

  return { 
    era, 
    whip, 
    k9: (so * 9) / Math.max(0.1, ip), 
    fip: Math.min(9, Math.max(1.5, Number(fip) || 4.5)),
    lob: Math.min(100, Math.max(0, Number(lob) || 72)),
    luckBadge 
  };
};

const calculateISO = (hitting) => {
  const doubles = Number(hitting.doubles || 0);
  const triples = Number(hitting.triples || 0);
  const hr = Number(hitting.homeRuns || 0);
  const ab = Number(hitting.atBats || 1);
  return (doubles + (2 * triples) + (3 * hr)) / ab;
};

const calculateFatigue = (recentGames) => {
  if (!Array.isArray(recentGames) || recentGames.length === 0) return 1.0;
  const last3 = recentGames.slice(0, 3);
  let totalRuns = 0;
  last3.forEach(g => {
    if (g && g.teams) {
      totalRuns += (Number(g.teams?.home?.score || 0) + Number(g.teams?.away?.score || 0));
    }
  });
  
  if (totalRuns > 30) return 1.25;
  if (totalRuns > 20) return 1.10;
  return 1.0;
};
