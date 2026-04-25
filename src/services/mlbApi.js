const BASE_URL = 'https://statsapi.mlb.com/api/v1';

export const fetchMLBGames = async (date) => {
  // Format date as YYYY-MM-DD
  const formattedDate = date || new Date().toISOString().split('T')[0];
  try {
    const response = await fetch(`${BASE_URL}/schedule?sportId=1&date=${formattedDate}&hydrate=probablePitcher(stats),team(record),linescore,weather,venue`);
    if (!response.ok) throw new Error('Failed to fetch games');
    const data = await response.json();
    return data.dates[0]?.games || [];
  } catch (error) {
    console.error('MLB API Error:', error);
    return [];
  }
};

export const getTeamLogo = (teamId) => {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
};

export const fetchMLBStandings = async () => {
  try {
    let year = new Date().getFullYear();
    let response = await fetch(`${BASE_URL}/standings?leagueId=103,104&season=${year}&standingsTypes=regularSeason`);
    let data = await response.json();
    
    // If the current season standings haven't populated yet, fallback to last year
    if (!data.records || data.records.length === 0) {
      year = year - 1;
      response = await fetch(`${BASE_URL}/standings?leagueId=103,104&season=${year}&standingsTypes=regularSeason`);
      data = await response.json();
    }
    
    return data.records || [];
  } catch (error) {
    console.error('MLB Standings Error:', error);
    return [];
  }
};

export const fetchTopPitchersSO = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const response = await fetch(`${BASE_URL}/stats/leaders?leaderCategories=strikeOuts&statGroup=pitching&sportId=1&season=${currentYear}&limit=5&hydrate=person(stats(type=[season],group=[pitching]))`);
    if (!response.ok) throw new Error('Failed to fetch SO leaders');
    const data = await response.json();
    return data.leagueLeaders?.[0]?.leaders || [];
  } catch (error) {
    console.error('MLB SO Leaders Error:', error);
    return [];
  }
};

/**
 * Fetch live games data with detailed linescore
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of games with live scores if available
 */
export const fetchLiveGames = async (date) => {
  const formattedDate = date || new Date().toISOString().split('T')[0];
  try {
    const response = await fetch(`${BASE_URL}/schedule?sportId=1&date=${formattedDate}&hydrate=linescore,probablePitcher(stats),team(record),weather,venue`);
    if (!response.ok) throw new Error('Failed to fetch live games');
    const data = await response.json();
    const games = data.dates[0]?.games || [];
    
    // Filter for active/final games (not scheduled/pre-game)
    return games.filter(game => {
      const status = game.status?.detailedState || 'Scheduled';
      return ['In Progress', 'Delayed', 'Final', 'Game Over', 'Completed Early', 'Completed Early: Rain'].includes(status);
    });
  } catch (error) {
    console.error('MLB Live Games Error:', error);
    return [];
  }
};

/**
 * Get live score data for a specific game
 * @param {Object} game - Game object from MLB API
 * @returns {Object} Live score information
 */
export const getLiveScoreData = (game) => {
  if (!game) return null;
  
  const status = game.status?.detailedState || 'Unknown';
  const linescore = game.linescore || {};
  const homeScore = game.teams?.home?.score || 0;
  const awayScore = game.teams?.away?.score || 0;
  const currentInning = linescore.currentInning || 0;
  const inningState = linescore.inningState || '';
  
  let statusText = status;
  let statusColor = 'text-slate-400';
  let isActive = false;
  
  switch (status) {
    case 'In Progress':
      statusText = `Inning ${currentInning} ${inningState}`;
      statusColor = 'text-green-600';
      isActive = true;
      break;
    case 'Delayed':
      statusText = 'Retrasado';
      statusColor = 'text-yellow-600';
      isActive = true;
      break;
    case 'Final':
    case 'Game Over':
      statusText = 'Finalizado';
      statusColor = 'text-secondary';
      isActive = false;
      break;
    default:
      statusText = status;
  }
  
  return {
    homeScore,
    awayScore,
    currentInning,
    inningState,
    statusText,
    statusColor,
    isActive,
    hits: {
      home: linescore.teams?.home?.hits || 0,
      away: linescore.teams?.away?.hits || 0
    },
    errors: {
      home: linescore.teams?.home?.errors || 0,
      away: linescore.teams?.away?.errors || 0
    }
  };
};

export const fetchPitcherGameLog = async (personId) => {
  try {
    const year = new Date().getFullYear();
    const response = await fetch(`${BASE_URL}/people/${personId}/stats?stats=gameLog&group=pitching&season=${year}`);
    if (!response.ok) throw new Error('Failed to fetch pitcher log');
    const data = await response.json();
    // Return only the last 5 games
    return data.stats?.[0]?.splits?.slice(0, 5) || [];
  } catch (error) {
    console.error('Pitcher Game Log Error:', error);
    return [];
  }
};
export const fetchPitcherStats = async (personId) => {
  if (!personId) return null;
  try {
    let year = new Date().getFullYear();
    let response = await fetch(`${BASE_URL}/people/${personId}?hydrate=stats(group=[pitching],type=[season])`);
    if (!response.ok) {
      console.warn(`Pitcher Stats API failed for ${personId}: ${response.status}`);
      return null;
    }
    let data = await response.json();
    let stats = data.people?.[0]?.stats?.[0]?.splits?.[0]?.stat;

    // Fallback to previous year if current year is empty
    if (!stats) {
      const prevYear = year - 1;
      response = await fetch(`${BASE_URL}/people/${personId}?hydrate=stats(group=[pitching],type=[season],season=${prevYear})`);
      if (response.ok) {
        data = await response.json();
        stats = data.people?.[0]?.stats?.[0]?.splits?.[0]?.stat;
      }
    }
    
    return stats || null;
  } catch (error) {
    console.error(`Pitcher Stats Error for ID ${personId}:`, error);
    return null;
  }
};

export const fetchTeamHittingStats = async () => {
  try {
    let year = new Date().getFullYear();
    let response = await fetch(`${BASE_URL}/teams/stats?season=${year}&sportId=1&stats=season&group=hitting`);
    let data = await response.json();
    
    // Fallback if current season is empty
    if (!data.stats?.[0]?.splits || data.stats[0].splits.length === 0) {
      year = year - 1;
      response = await fetch(`${BASE_URL}/teams/stats?season=${year}&sportId=1&stats=season&group=hitting`);
      data = await response.json();
    }
    
    return data.stats?.[0]?.splits || [];
  } catch (error) {
    console.error('Team Hitting Stats Error:', error);
    return [];
  }
};
export const fetchTeamBullpenStats = async (teamId) => {
  try {
    const currentYear = new Date().getFullYear();
    const response = await fetch(`${BASE_URL}/teams/${teamId}/stats?stats=statSplits&group=pitching&season=${currentYear}&sitCodes=rp`);
    if (!response.ok) throw new Error('Failed to fetch bullpen stats');
    const data = await response.json();
    return data.stats?.[0]?.splits?.[0]?.stat || null;
  } catch (error) {
    console.error('Bullpen Stats Error:', error);
    return null;
  }
};
export const fetchTeamRecentGames = async (teamId) => {
  try {
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);
    const start = tenDaysAgo.toISOString().split('T')[0];
    const end = today.toISOString().split('T')[0];
    const response = await fetch(`${BASE_URL}/schedule?teamId=${teamId}&startDate=${start}&endDate=${end}&sportId=1&eventTypes=primary&scheduleTypes=games`);
    if (!response.ok) throw new Error('Failed to fetch recent games');
    const data = await response.json();
    return data.dates?.flatMap(d => d.games) || [];
  } catch (error) {
    console.error('Recent Games Error:', error);
    return [];
  }
};

export const fetchH2HHistory = async (team1, team2) => {
  try {
    const year = new Date().getFullYear();
    const response = await fetch(`${BASE_URL}/schedule?sportId=1&teamId=${team1}&opponentId=${team2}&season=${year}&gameType=R`);
    if (!response.ok) throw new Error('Failed to fetch H2H history');
    const data = await response.json();
    return data.dates?.flatMap(d => d.games) || [];
  } catch (error) {
    console.error('H2H Error:', error);
    return [];
  }
};
