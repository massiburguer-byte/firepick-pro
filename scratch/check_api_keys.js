
const fetch = require('node-fetch');

async function checkStats() {
    const BASE_URL = 'https://statsapi.mlb.com/api/v1';
    
    // Check Team Hitting Stats
    console.log("Checking Team Hitting Stats...");
    const teamResponse = await fetch(`${BASE_URL}/teams/stats?season=2024&sportId=1&stats=season&group=hitting`);
    const teamData = await teamResponse.json();
    const firstTeam = teamData.stats[0]?.splits[0];
    console.log("Team Stat Keys:", Object.keys(firstTeam.stat));
    console.log("Example Team Stat (NYY):", firstTeam.stat);

    // Check Pitcher Stats
    console.log("\nChecking Pitcher Stats (Gerrit Cole - 543037)...");
    const pResponse = await fetch(`${BASE_URL}/people/543037?hydrate=stats(group=[pitching],type=[season])`);
    const pData = await pResponse.json();
    const pStat = pData.people[0]?.stats[0]?.splits[0]?.stat;
    console.log("Pitcher Stat Keys:", Object.keys(pStat));
    console.log("Example Pitcher Stat:", pStat);
}

checkStats();
