export interface NFLTeamInfo {
  name: string;
  abbr: string;
  conference: 'AFC' | 'NFC';
  division: string;
}

export const NFL_ALL_TEAMS: NFLTeamInfo[] = [
  // AFC East
  { name: 'Buffalo Bills', abbr: 'BUF', conference: 'AFC', division: 'East' },
  { name: 'Miami Dolphins', abbr: 'MIA', conference: 'AFC', division: 'East' },
  { name: 'New York Jets', abbr: 'NYJ', conference: 'AFC', division: 'East' },
  { name: 'New England Patriots', abbr: 'NE', conference: 'AFC', division: 'East' },
  // AFC North
  { name: 'Baltimore Ravens', abbr: 'BAL', conference: 'AFC', division: 'North' },
  { name: 'Cincinnati Bengals', abbr: 'CIN', conference: 'AFC', division: 'North' },
  { name: 'Cleveland Browns', abbr: 'CLE', conference: 'AFC', division: 'North' },
  { name: 'Pittsburgh Steelers', abbr: 'PIT', conference: 'AFC', division: 'North' },
  // AFC South
  { name: 'Houston Texans', abbr: 'HOU', conference: 'AFC', division: 'South' },
  { name: 'Indianapolis Colts', abbr: 'IND', conference: 'AFC', division: 'South' },
  { name: 'Jacksonville Jaguars', abbr: 'JAX', conference: 'AFC', division: 'South' },
  { name: 'Tennessee Titans', abbr: 'TEN', conference: 'AFC', division: 'South' },
  // AFC West
  { name: 'Kansas City Chiefs', abbr: 'KC', conference: 'AFC', division: 'West' },
  { name: 'Los Angeles Chargers', abbr: 'LAC', conference: 'AFC', division: 'West' },
  { name: 'Denver Broncos', abbr: 'DEN', conference: 'AFC', division: 'West' },
  { name: 'Las Vegas Raiders', abbr: 'LV', conference: 'AFC', division: 'West' },
  // NFC East
  { name: 'Philadelphia Eagles', abbr: 'PHI', conference: 'NFC', division: 'East' },
  { name: 'Dallas Cowboys', abbr: 'DAL', conference: 'NFC', division: 'East' },
  { name: 'Washington Commanders', abbr: 'WAS', conference: 'NFC', division: 'East' },
  { name: 'New York Giants', abbr: 'NYG', conference: 'NFC', division: 'East' },
  // NFC North
  { name: 'Detroit Lions', abbr: 'DET', conference: 'NFC', division: 'North' },
  { name: 'Green Bay Packers', abbr: 'GB', conference: 'NFC', division: 'North' },
  { name: 'Minnesota Vikings', abbr: 'MIN', conference: 'NFC', division: 'North' },
  { name: 'Chicago Bears', abbr: 'CHI', conference: 'NFC', division: 'North' },
  // NFC South
  { name: 'Tampa Bay Buccaneers', abbr: 'TB', conference: 'NFC', division: 'South' },
  { name: 'Atlanta Falcons', abbr: 'ATL', conference: 'NFC', division: 'South' },
  { name: 'New Orleans Saints', abbr: 'NO', conference: 'NFC', division: 'South' },
  { name: 'Carolina Panthers', abbr: 'CAR', conference: 'NFC', division: 'South' },
  // NFC West
  { name: 'San Francisco 49ers', abbr: 'SF', conference: 'NFC', division: 'West' },
  { name: 'Los Angeles Rams', abbr: 'LAR', conference: 'NFC', division: 'West' },
  { name: 'Seattle Seahawks', abbr: 'SEA', conference: 'NFC', division: 'West' },
  { name: 'Arizona Cardinals', abbr: 'ARI', conference: 'NFC', division: 'West' },
];

export interface NFLStarPlayer {
  name: string;
  team: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  defaultMarket: string;
  defaultLine: string;
  status?: 'ACTIVE' | 'QUESTIONABLE' | 'OUT';
  injuryNote?: string;
}

export const NFL_STAR_PLAYERS: NFLStarPlayer[] = [
  { name: 'Patrick Mahomes', team: 'KC Chiefs', position: 'QB', defaultMarket: 'player_passing_yards', defaultLine: 'Over 265.5 Jardas de Passe', status: 'ACTIVE' },
  { name: 'Lamar Jackson', team: 'BAL Ravens', position: 'QB', defaultMarket: 'player_rushing_yards', defaultLine: 'Over 48.5 Jardas Terrestres', status: 'ACTIVE' },
  { name: 'Josh Allen', team: 'BUF Bills', position: 'QB', defaultMarket: 'player_passing_tds', defaultLine: 'Over 1.5 Passes para Touchdown', status: 'ACTIVE' },
  { name: 'Jalen Hurts', team: 'PHI Eagles', position: 'QB', defaultMarket: 'player_anytime_td', defaultLine: 'Anotar Touchdown (Tush Push)', status: 'ACTIVE' },
  { name: 'Joe Burrow', team: 'CIN Bengals', position: 'QB', defaultMarket: 'player_passing_yards', defaultLine: 'Over 270.5 Jardas de Passe', status: 'ACTIVE' },
  { name: 'C.J. Stroud', team: 'HOU Texans', position: 'QB', defaultMarket: 'player_passing_yards', defaultLine: 'Over 260.5 Jardas de Passe', status: 'ACTIVE' },
  { name: 'Jordan Love', team: 'GB Packers', position: 'QB', defaultMarket: 'player_passing_yards', defaultLine: 'Over 255.5 Jardas de Passe', status: 'ACTIVE' },
  { name: 'Brock Purdy', team: 'SF 49ers', position: 'QB', defaultMarket: 'player_passing_tds', defaultLine: 'Over 1.5 Passes para Touchdown', status: 'ACTIVE' },
  { name: 'Christian McCaffrey', team: 'SF 49ers', position: 'RB', defaultMarket: 'player_anytime_td', defaultLine: 'Marcar Touchdown a qualquer momento', status: 'ACTIVE' },
  { name: 'Derrick Henry', team: 'BAL Ravens', position: 'RB', defaultMarket: 'player_rushing_yards', defaultLine: 'Over 75.5 Jardas Corridas', status: 'ACTIVE' },
  { name: 'Saquon Barkley', team: 'PHI Eagles', position: 'RB', defaultMarket: 'player_rushing_yards', defaultLine: 'Over 78.5 Jardas Corridas', status: 'ACTIVE' },
  { name: 'Jahmyr Gibbs', team: 'DET Lions', position: 'RB', defaultMarket: 'player_rushing_yards', defaultLine: 'Over 64.5 Jardas Corridas', status: 'ACTIVE' },
  { name: 'Kyren Williams', team: 'LA Rams', position: 'RB', defaultMarket: 'player_anytime_td', defaultLine: 'Marcar Touchdown a qualquer momento', status: 'ACTIVE' },
  { name: 'Breece Hall', team: 'NY Jets', position: 'RB', defaultMarket: 'player_rushing_yards', defaultLine: 'Over 68.5 Jardas Corridas', status: 'ACTIVE' },
  { name: 'Justin Jefferson', team: 'MIN Vikings', position: 'WR', defaultMarket: 'player_receiving_yards', defaultLine: 'Over 82.5 Jardas Recebidas', status: 'ACTIVE' },
  { name: 'CeeDee Lamb', team: 'DAL Cowboys', position: 'WR', defaultMarket: 'player_receptions', defaultLine: 'Over 6.5 Recepções', status: 'ACTIVE' },
  { name: 'Amon-Ra St. Brown', team: 'DET Lions', position: 'WR', defaultMarket: 'player_receptions', defaultLine: 'Over 6.5 Recepções', status: 'ACTIVE' },
  { name: 'Ja\'Marr Chase', team: 'CIN Bengals', position: 'WR', defaultMarket: 'player_receiving_yards', defaultLine: 'Over 79.5 Jardas Recebidas', status: 'ACTIVE' },
  { name: 'Tyreek Hill', team: 'MIA Dolphins', position: 'WR', defaultMarket: 'player_receiving_yards', defaultLine: 'Over 84.5 Jardas Recebidas', status: 'ACTIVE' },
  { name: 'Puka Nacua', team: 'LA Rams', position: 'WR', defaultMarket: 'player_receiving_yards', defaultLine: 'Over 74.5 Jardas Recebidas', status: 'ACTIVE' },
  { name: 'Nico Collins', team: 'HOU Texans', position: 'WR', defaultMarket: 'player_receiving_yards', defaultLine: 'Over 72.5 Jardas Recebidas', status: 'ACTIVE' },
  { name: 'A.J. Brown', team: 'PHI Eagles', position: 'WR', defaultMarket: 'player_receiving_yards', defaultLine: 'Over 76.5 Jardas Recebidas', status: 'ACTIVE' },
  { name: 'Travis Kelce', team: 'KC Chiefs', position: 'TE', defaultMarket: 'player_receptions', defaultLine: 'Over 5.5 Recepções', status: 'ACTIVE' },
  { name: 'George Kittle', team: 'SF 49ers', position: 'TE', defaultMarket: 'player_receiving_yards', defaultLine: 'Over 54.5 Jardas Recebidas', status: 'ACTIVE' },
  { name: 'Sam LaPorta', team: 'DET Lions', position: 'TE', defaultMarket: 'player_receiving_yards', defaultLine: 'Over 49.5 Jardas Recebidas', status: 'ACTIVE' },
  { name: 'Trey McBride', team: 'ARI Cardinals', position: 'TE', defaultMarket: 'player_receptions', defaultLine: 'Over 5.5 Recepções', status: 'ACTIVE' },
  { name: 'Jakobi Meyers', team: 'JAX Jaguars', position: 'WR', defaultMarket: 'player_receptions', defaultLine: 'Over 4.5 Recepções', status: 'ACTIVE' },
  { name: 'Tre Tucker', team: 'LV Raiders', position: 'WR', defaultMarket: 'player_receiving_yards', defaultLine: 'Over 42.5 Jardas Recebidas', status: 'ACTIVE' },
  { name: 'Michael Mayer', team: 'LV Raiders', position: 'TE', defaultMarket: 'player_receiving_yards', defaultLine: 'Over 34.5 Jardas Recebidas', status: 'ACTIVE' },
  { name: 'Brock Bowers', team: 'LV Raiders', position: 'TE', defaultMarket: 'player_receptions', defaultLine: 'Over 5.5 Recepções', status: 'OUT', injuryNote: 'Desfalque Confirmado - Lesionado (OUT)' },
];
