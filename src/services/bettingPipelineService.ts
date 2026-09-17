import { findNFLPlayer, NFLDatabasePlayer, NFL_PLAYERS_DATABASE } from '../data/nflPlayersDatabase';
import { NFL_ALL_TEAMS } from '../data/nflTeamsAndPlayers';

export interface RosterVerificationResult {
  checked: boolean;
  playerName: string;
  foundInDatabase: boolean;
  playerId?: string;
  originalTeam?: string;
  currentTeam: string;
  teamFullName: string;
  position: string;
  jerseyNumber?: string | null;
  isActiveToday: boolean;
  injuryDesignation?: string | null;
  inactiveReason?: string | null;
  teamCorrected: boolean;
  correctionNotice?: string;
}

export interface GamedayMatchupResult {
  checked: boolean;
  hasGameToday: boolean;
  gameId?: string;
  teamAbbr: string;
  opponentAbbr: string;
  opponentName: string;
  isHome: boolean;
  kickoffTime?: string;
  stadium?: string;
  city?: string;
  weather?: string;
  spread?: string;
  totalOverUnder?: number;
  tacticalSummary?: string;
  notice?: string;
}

export interface PipelineVerificationOutput {
  step1Roster: RosterVerificationResult;
  step2Matchup: GamedayMatchupResult;
  step3Ready: boolean;
  summaryBadge: string;
}

// Mapa de jogos oficiais da rodada de hoje
export const TODAY_SCHEDULED_GAMES = [
  { id: 'game_det_no', home: 'NO', away: 'DET', time: '14:00', stadium: 'Caesars Superdome (Domo)', weather: 'Clima controlado, 21°C', total: 51.5, spread: 'DET -3.5' },
  { id: 'game_cin_tb', home: 'TB', away: 'CIN', time: '14:00', stadium: 'Raymond James Stadium', weather: 'Céu aberto, 28°C', total: 47.5, spread: 'CIN -2.5' },
  { id: 'game_ind_bal', home: 'BAL', away: 'IND', time: '14:00', stadium: 'M&T Bank Stadium', weather: 'Parcialmente nublado, 22°C', total: 46.0, spread: 'BAL -6.5' },
  { id: 'game_jax_cle', home: 'CLE', away: 'JAX', time: '14:00', stadium: 'Huntington Bank Field', weather: 'Vento vindo do Lago Erie (13mph), 19°C', total: 41.5, spread: 'CLE -3.0' },
  { id: 'game_ten_nyj', home: 'NYJ', away: 'TEN', time: '14:00', stadium: 'MetLife Stadium', weather: 'Aberto, 23°C', total: 40.0, spread: 'NYJ -4.0' },
  { id: 'game_hou_buf', home: 'BUF', away: 'HOU', time: '14:00', stadium: 'Highmark Stadium', weather: 'Ventos moderados (11mph), 18°C', total: 48.5, spread: 'BUF -2.0' },
  { id: 'game_pit_atl', home: 'ATL', away: 'PIT', time: '14:00', stadium: 'Mercedes-Benz Stadium (Domo)', weather: 'Domo fechado, 21°C', total: 42.0, spread: 'ATL -2.5' },
  { id: 'game_car_chi', home: 'CHI', away: 'CAR', time: '14:00', stadium: 'Soldier Field', weather: 'Vento soprando do lago (14mph), 17°C', total: 43.5, spread: 'CHI -4.0' },
  { id: 'game_min_gb', home: 'GB', away: 'MIN', time: '17:00', stadium: 'Lambeau Field', weather: 'Céu limpo, 16°C', total: 44.5, spread: 'GB -3.0' },
  { id: 'game_lv_mia', home: 'MIA', away: 'LV', time: '17:00', stadium: 'Hard Rock Stadium', weather: 'Calor e umidade alta, 29°C', total: 44.0, spread: 'MIA -7.0' },
  { id: 'game_lac_ari', home: 'ARI', away: 'LAC', time: '17:00', stadium: 'State Farm Stadium (Domo)', weather: 'Teto retrátil fechado, 22°C', total: 49.0, spread: 'LAC -2.0' },
  { id: 'game_phi_was', home: 'WAS', away: 'PHI', time: '17:00', stadium: 'Northwest Stadium', weather: 'Brisa leve, 21°C', total: 47.0, spread: 'PHI -5.5' },
  { id: 'game_kc_den', home: 'KC', away: 'DEN', time: '21:20', stadium: 'GEHA Field at Arrowhead', weather: 'Frio ameno, 18°C', total: 43.0, spread: 'KC -7.5' },
  { id: 'game_sf_lar', home: 'SF', away: 'LAR', time: '21:15', stadium: "Levi's Stadium", weather: 'Noite limpa, 19°C', total: 45.5, spread: 'SF -4.5' },
];

/**
 * Converte abreviação em nome legível da franquia
 */
export function getTeamFullName(teamAbbr: string): string {
  const found = NFL_ALL_TEAMS.find((t) => t.abbr.toUpperCase() === teamAbbr.toUpperCase());
  return found ? found.name : teamAbbr;
}

/**
 * ETAPA 1: Checagem de Elenco Oficial ESPN
 * Verifica o jogador no banco de 53 atletas e detecta se ele trocou de franquia
 */
export function verifyPlayerRoster(
  playerName: string,
  providedTeam?: string
): RosterVerificationResult {
  const cleanName = playerName.replace(/\(.*\)/, '').trim();
  const dbPlayer = findNFLPlayer(cleanName);

  if (!dbPlayer) {
    // Fallback se não encontrar por nome exato
    const currentTeam = providedTeam ? providedTeam.toUpperCase() : 'NFL';
    return {
      checked: true,
      playerName,
      foundInDatabase: false,
      originalTeam: providedTeam,
      currentTeam,
      teamFullName: getTeamFullName(currentTeam),
      position: 'Player',
      isActiveToday: true,
      injuryDesignation: 'None',
      inactiveReason: null,
      teamCorrected: false,
    };
  }

  const dbTeam = dbPlayer.team_id.toUpperCase();
  const originalTeamUpper = providedTeam ? providedTeam.toUpperCase() : '';
  
  // Detecção de troca de elenco (ex: Jakobi Meyers no JAX e não mais no Raiders/LV)
  const isMismatch = !!originalTeamUpper && originalTeamUpper !== dbTeam;

  let correctionNotice: string | undefined;
  if (isMismatch) {
    correctionNotice = `Aviso de Elenco ESPN: ${dbPlayer.name} atua pelo ${getTeamFullName(dbTeam)} (${dbTeam}) e não pelo ${getTeamFullName(originalTeamUpper)} (${originalTeamUpper}). Elenco corrigido automaticamente.`;
  }

  return {
    checked: true,
    playerName: dbPlayer.name,
    foundInDatabase: true,
    playerId: dbPlayer.id,
    originalTeam: providedTeam,
    currentTeam: dbTeam,
    teamFullName: getTeamFullName(dbTeam),
    position: dbPlayer.position,
    jerseyNumber: dbPlayer.jersey_number != null ? String(dbPlayer.jersey_number) : null,
    isActiveToday: dbPlayer.is_active_today,
    injuryDesignation: dbPlayer.injury_designation,
    inactiveReason: dbPlayer.inactive_reason,
    teamCorrected: isMismatch,
    correctionNotice,
  };
}

/**
 * ETAPA 2: Checagem dos Confrontos do Dia
 * Consulta o schedule e identifica o confronto e adversário real do time
 */
export function resolveGamedayMatchup(teamAbbr: string): GamedayMatchupResult {
  const teamUpper = teamAbbr.toUpperCase();
  const game = TODAY_SCHEDULED_GAMES.find(
    (g) => g.home.toUpperCase() === teamUpper || g.away.toUpperCase() === teamUpper
  );

  if (!game) {
    return {
      checked: true,
      hasGameToday: false,
      teamAbbr: teamUpper,
      opponentAbbr: 'BYE',
      opponentName: 'Sem Jogo Hoje (Semana de Bye)',
      isHome: false,
      notice: `O time ${getTeamFullName(teamUpper)} (${teamUpper}) não possui jogo registrado na rodada de hoje.`,
    };
  }

  const isHome = game.home.toUpperCase() === teamUpper;
  const opponentAbbr = isHome ? game.away.toUpperCase() : game.home.toUpperCase();

  return {
    checked: true,
    hasGameToday: true,
    gameId: game.id,
    teamAbbr: teamUpper,
    opponentAbbr,
    opponentName: getTeamFullName(opponentAbbr),
    isHome,
    kickoffTime: game.time,
    stadium: game.stadium,
    weather: game.weather,
    spread: game.spread,
    totalOverUnder: game.total,
  };
}

/**
 * PIPELINE COMPLETO EM 3 ETAPAS
 * 1. Checa o jogador no elenco da ESPN
 * 2. Checa o confronto do dia para o time verificado
 * 3. Valida se os dados estão prontos para a pesquisa do Cérebro IA
 */
export function runBettingPipeline(
  playerName: string,
  providedTeam?: string
): PipelineVerificationOutput {
  // ETAPA 1: Checar Elenco do Jogador
  const step1Roster = verifyPlayerRoster(playerName, providedTeam);

  // ETAPA 2: Checar Confronto do Dia para o Time Atual
  const step2Matchup = resolveGamedayMatchup(step1Roster.currentTeam);

  // ETAPA 3: Validação Final para Pesquisa
  const step3Ready = step1Roster.isActiveToday && step2Matchup.hasGameToday;

  let summaryBadge = '';
  if (!step1Roster.isActiveToday) {
    summaryBadge = '🚫 Desfalque Confirmado (Aposta Bloqueada)';
  } else if (!step2Matchup.hasGameToday) {
    summaryBadge = '⚠️ Sem Jogo Hoje (Bye Week)';
  } else if (step1Roster.teamCorrected) {
    summaryBadge = `⚡ Elenco Atualizado via ESPN: ${step1Roster.currentTeam} vs ${step2Matchup.opponentAbbr}`;
  } else {
    summaryBadge = `✅ 100% Sincronizado: ${step1Roster.currentTeam} vs ${step2Matchup.opponentAbbr}`;
  }

  return {
    step1Roster,
    step2Matchup,
    step3Ready,
    summaryBadge,
  };
}
