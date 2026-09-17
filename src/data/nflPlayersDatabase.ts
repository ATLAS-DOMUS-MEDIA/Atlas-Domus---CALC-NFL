import nflPlayersRaw from './nfl_players_full.json';
import espnRostersRaw from './nfl_espn_rosters.json';
import { NFL_ALL_TEAMS } from './nflTeamsAndPlayers';

export interface ESPNRosterAthlete {
  name: string;
  jersey: string | null;
  position: string;
  team: string;
  experience?: number;
  status?: string;
  injury?: string | null;
  is_active_today?: boolean;
}

export const ESPN_ROSTERS_BY_TEAM: Record<string, ESPNRosterAthlete[]> = espnRostersRaw as Record<string, ESPNRosterAthlete[]>;

export function getTeamESPNRoster(teamId: string): ESPNRosterAthlete[] {
  const teamUpper = teamId.toUpperCase();
  return ESPN_ROSTERS_BY_TEAM[teamUpper] || [];
}

export interface NFLDatabasePlayer {
  id: string;
  name: string;
  team_id: string;
  position: string;
  jersey_number: number | null;
  years_exp: number;
  status: string;
  is_active_today: boolean;
  injury_designation: 'Out' | 'IR' | 'Questionable' | 'Doubtful' | 'PUP' | 'None' | string;
  inactive_reason: string | null;
}

export interface NFLGamedayReport {
  team: string;
  teamName: string;
  date: string;
  counts: {
    active: number;
    inactive: number;
    total: number;
  };
  actives: NFLDatabasePlayer[];
  inactives: NFLDatabasePlayer[];
}

// In-memory Database Store
export const NFL_PLAYERS_DATABASE: NFLDatabasePlayer[] = nflPlayersRaw as NFLDatabasePlayer[];

// Lookup map for fast player queries by ID or normalized name
const playerByIdMap = new Map<string, NFLDatabasePlayer>();
const playerByNameMap = new Map<string, NFLDatabasePlayer>();

NFL_PLAYERS_DATABASE.forEach((player) => {
  playerByIdMap.set(player.id, player);
  // Store lowercase normalized name
  const normName = player.name.toLowerCase().trim();
  if (!playerByNameMap.has(normName) || player.is_active_today) {
    playerByNameMap.set(normName, player);
  }
});

/**
 * Procura um jogador por nome (exato ou parcial)
 */
export function findNFLPlayer(nameQuery: string): NFLDatabasePlayer | undefined {
  if (!nameQuery) return undefined;
  const clean = nameQuery.toLowerCase().trim();
  
  // 1. Exact match
  if (playerByNameMap.has(clean)) {
    return playerByNameMap.get(clean);
  }

  // 2. Starts with / includes match
  for (const player of NFL_PLAYERS_DATABASE) {
    const pName = player.name.toLowerCase();
    if (clean.includes(pName) || pName.includes(clean)) {
      return player;
    }
  }

  return undefined;
}

/**
 * Retorna todos os jogadores filtrados conforme as rotas da API modelada
 * GET /api/players/gameday?team=KC&active=true&position=QB
 */
export function queryGamedayPlayers(filters?: {
  team?: string;
  active?: boolean;
  position?: string;
  search?: string;
}): NFLDatabasePlayer[] {
  return NFL_PLAYERS_DATABASE.filter((player) => {
    if (filters?.team && player.team_id.toUpperCase() !== filters.team.toUpperCase()) {
      return false;
    }
    if (filters?.active !== undefined && player.is_active_today !== filters.active) {
      return false;
    }
    if (filters?.position && player.position.toUpperCase() !== filters.position.toUpperCase()) {
      return false;
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      const matchName = player.name.toLowerCase().includes(q);
      const matchTeam = player.team_id.toLowerCase().includes(q);
      const matchPos = player.position.toLowerCase().includes(q);
      if (!matchName && !matchTeam && !matchPos) return false;
    }
    return true;
  });
}

/**
 * Retorna o relatório consolidado de jogo por franquia
 * GET /api/teams/:id/gameday-report
 */
export function getTeamGamedayReport(teamId: string, date = '2026-09-13'): NFLGamedayReport {
  const teamUpper = teamId.toUpperCase();
  const teamObj = NFL_ALL_TEAMS.find((t) => t.abbr.toUpperCase() === teamUpper);
  const teamName = teamObj ? teamObj.name : teamUpper;

  const teamPlayers = NFL_PLAYERS_DATABASE.filter(
    (p) => p.team_id.toUpperCase() === teamUpper
  );

  const actives = teamPlayers.filter((p) => p.is_active_today);
  const inactives = teamPlayers.filter((p) => !p.is_active_today);

  return {
    team: teamUpper,
    teamName,
    date,
    counts: {
      active: actives.length,
      inactive: inactives.length,
      total: teamPlayers.length,
    },
    actives,
    inactives,
  };
}

/**
 * Estatísticas gerais do banco de dados para os cálculos de apostas
 */
export function getDatabaseStats() {
  const total = NFL_PLAYERS_DATABASE.length;
  const actives = NFL_PLAYERS_DATABASE.filter((p) => p.is_active_today).length;
  const inactives = total - actives;
  const teamsCount = new Set(NFL_PLAYERS_DATABASE.map((p) => p.team_id)).size;
  return {
    total,
    actives,
    inactives,
    teamsCount,
  };
}
