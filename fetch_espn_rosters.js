// fetch_espn_rosters.js
import fs from 'fs';

// As 32 abreviações usadas pela ESPN
const NFL_TEAMS = [
  'ari', 'atl', 'bal', 'buf', 'car', 'chi', 'cin', 'cle',
  'dal', 'den', 'det', 'gb',  'hou', 'ind', 'jax', 'kc',
  'lv',  'lac', 'lar', 'mia', 'min', 'ne',  'no',  'nyg',
  'nyj', 'phi', 'pit', 'sf',  'sea', 'tb',  'ten', 'wsh'
];

async function fetchTeamRoster(team) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team}/roster`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const players = [];

    // A ESPN separa atletas por grupos: offense, defense, specialTeams
    if (data.athletes) {
      for (const group of data.athletes) {
        if (group.items) {
          for (const p of group.items) {
            const injuryStatus = p.injuries && p.injuries.length > 0 ? p.injuries[0].status : null;
            const isInactive = injuryStatus === 'Out' || injuryStatus === 'Injured Reserve';
            players.push({
              id: p.id || null,
              name: p.fullName,
              jersey: p.jersey || null,
              position: p.position?.abbreviation || 'N/A',
              team: team.toUpperCase() === 'WSH' ? 'WAS' : team.toUpperCase(),
              experience: p.experience?.years || 0,
              status: p.status?.type || 'active',
              injury: injuryStatus,
              is_active_today: !isInactive
            });
          }
        }
      }
    }

    return { team: team.toUpperCase() === 'WSH' ? 'WAS' : team.toUpperCase(), count: players.length, players };
  } catch (err) {
    console.error(`Erro ao buscar time ${team}:`, err.message);
    return { team: team.toUpperCase() === 'WSH' ? 'WAS' : team.toUpperCase(), count: 0, players: [] };
  }
}

async function run() {
  console.log('Iniciando extração dos elencos completos via ESPN...');
  const allRosters = {};

  for (const team of NFL_TEAMS) {
    process.stdout.write(`Buscando elenco: ${team.toUpperCase()}... `);
    const result = await fetchTeamRoster(team);
    allRosters[result.team] = result.players;
    console.log(`OK (${result.count} atletas)`);
    // Pausa breve de 150ms para evitar rate-limit
    await new Promise((r) => setTimeout(r, 150));
  }

  // Gera o arquivo nfl_espn_rosters.json no formato exato solicitado
  fs.writeFileSync('nfl_espn_rosters.json', JSON.stringify(allRosters, null, 2));
  
  if (!fs.existsSync('src/data')) {
    fs.mkdirSync('src/data', { recursive: true });
  }
  fs.writeFileSync('src/data/nfl_espn_rosters.json', JSON.stringify(allRosters, null, 2));

  // Substitui a base de jogadores da aplicação (nfl_players_full.json) com os elencos da ESPN
  const flatPlayers = [];
  for (const teamKey of Object.keys(allRosters)) {
    for (const p of allRosters[teamKey]) {
      const isOut = !p.is_active_today || p.status === 'practice-squad' || p.injury === 'Out' || p.injury === 'Injured Reserve';
      flatPlayers.push({
        id: p.id || `espn_${teamKey}_${p.jersey || Math.random().toString(36).slice(2, 6)}`,
        name: p.name,
        team_id: teamKey,
        position: p.position,
        jersey_number: p.jersey ? parseInt(p.jersey, 10) : null,
        years_exp: p.experience || 0,
        status: isOut ? (p.injury || 'Inactive') : 'Active',
        is_active_today: !isOut,
        injury_designation: p.injury ? (p.injury.includes('Reserve') ? 'IR' : p.injury) : (p.status === 'practice-squad' ? 'Questionable' : 'None'),
        inactive_reason: p.injury ? `Lesão: ${p.injury}` : (p.status === 'practice-squad' ? 'Practice Squad' : null)
      });
    }
  }

  fs.writeFileSync('src/data/nfl_players_full.json', JSON.stringify(flatPlayers, null, 2));

  console.log('\nConcluído com sucesso!');
  console.log('Arquivo "nfl_espn_rosters.json" gerado.');
  console.log(`Arquivo "src/data/nfl_players_full.json" atualizado com ${flatPlayers.length} atletas da ESPN.`);
}

run();
