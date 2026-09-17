import { NFL_PLAYERS_DATABASE, NFLDatabasePlayer, findNFLPlayer } from '../data/nflPlayersDatabase';
import { NFLMarketCategory } from '../types';
import { americanToDecimal, decimalToAmerican } from '../utils/betCalculations';
import { runBettingPipeline } from './bettingPipelineService';

export interface PlayerOddsProp {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  position: string;
  statType: string; // 'Pass Yards' | 'Rush Yards' | 'Receiving Yards' | 'Pass TDs' | 'Receptions' | 'Anytime TD'
  lineScore: number; // Ex: 265.5, 62.5
  marketCategory: NFLMarketCategory;
  marketLabel: string; // Ex: "Over 265.5 Jardas de Passe"
  overOdds: number;
  underOdds: number;
  source: 'prizepicks' | 'quant_engine';
  isActiveToday: boolean;
  injuryDesignation: string;
  inactiveReason: string | null;
  updatedAt: string;
  opponent?: string;
  fairProbability?: number;
  expectedValue?: number;
  edgePercent?: number;
  rating?: 'HIGH_EV' | 'MEDIUM_EV' | 'FAIR' | 'INACTIVE';
  pipelineVerified?: boolean;
  rosterCorrected?: boolean;
  correctionNotice?: string;
  matchupGameId?: string;
  hasGameToday?: boolean;
}

/**
 * Mapeia stat_type do PrizePicks para as categorias de mercado do app
 */
export function mapPrizePicksStatTypeToMarket(statType: string): {
  marketCategory: NFLMarketCategory;
  formattedStat: string;
  unit: string;
} {
  const norm = statType.toLowerCase();

  if (norm.includes('pass yard') || norm.includes('passing yard')) {
    return { marketCategory: 'player_passing_yards', formattedStat: 'Jardas de Passe', unit: 'yds' };
  }
  if (norm.includes('rush yard') || norm.includes('rushing yard')) {
    return { marketCategory: 'player_rushing_yards', formattedStat: 'Jardas Terrestres', unit: 'yds' };
  }
  if (norm.includes('rec yard') || norm.includes('receiving yard')) {
    return { marketCategory: 'player_receiving_yards', formattedStat: 'Jardas Recebidas', unit: 'yds' };
  }
  if (norm.includes('pass td') || norm.includes('passing touch')) {
    return { marketCategory: 'player_passing_tds', formattedStat: 'Passes para TD', unit: 'TDs' };
  }
  if (norm.includes('reception') || norm.includes('rec')) {
    return { marketCategory: 'player_receptions', formattedStat: 'Recepções', unit: 'rec' };
  }
  if (norm.includes('touchdown') || norm.includes('anytime') || norm.includes('rush td')) {
    return { marketCategory: 'player_anytime_td', formattedStat: 'Touchdown a Qualquer Momento', unit: 'TD' };
  }
  return { marketCategory: 'custom', formattedStat: statType, unit: '' };
}

/**
 * Normaliza projeções brutas vindas do payload JSON público do PrizePicks
 * (https://api.prizepicks.com/projections?league_id=7)
 */
export function parsePrizePicksResponse(json: any): PlayerOddsProp[] {
  if (!json || !json.data || !Array.isArray(json.data)) {
    return [];
  }

  const projections = json.data;
  const included = Array.isArray(json.included) ? json.included : [];

  // Mapeia jogadores incluídos (item.type === 'new_player')
  const playerMap = new Map<string, { name: string; team: string; position?: string }>();
  included.forEach((item: any) => {
    if (item.type === 'new_player' && item.attributes) {
      playerMap.set(item.id, {
        name: item.attributes.name,
        team: item.attributes.team,
        position: item.attributes.position,
      });
    }
  });

  const parsedProps: PlayerOddsProp[] = [];

  for (const proj of projections) {
    const playerIdRef = proj.relationships?.new_player?.data?.id;
    const playerInfo = playerMap.get(playerIdRef);
    if (!playerInfo || !proj.attributes) continue;

    const statType = proj.attributes.stat_type;
    const lineScore = Number(proj.attributes.line_score);
    if (isNaN(lineScore)) continue;

    const matchedDbPlayer = findNFLPlayer(playerInfo.name);
    const { marketCategory, formattedStat } = mapPrizePicksStatTypeToMarket(statType);

    const isActive = matchedDbPlayer ? matchedDbPlayer.is_active_today : true;
    const injuryDesignation = matchedDbPlayer ? matchedDbPlayer.injury_designation : 'None';
    const inactiveReason = matchedDbPlayer ? matchedDbPlayer.inactive_reason : null;

    parsedProps.push({
      id: `prizepicks_${proj.id}`,
      playerId: matchedDbPlayer?.id || `pp_${playerIdRef}`,
      playerName: playerInfo.name,
      teamId: matchedDbPlayer?.team_id || playerInfo.team || 'NFL',
      position: matchedDbPlayer?.position || playerInfo.position || 'FLEX',
      statType,
      lineScore,
      marketCategory,
      marketLabel: `Over/Under ${lineScore} ${formattedStat}`,
      overOdds: 1.85,
      underOdds: 1.85,
      source: 'prizepicks',
      isActiveToday: isActive,
      injuryDesignation,
      inactiveReason,
      updatedAt: new Date().toISOString(),
    });
  }

  return parsedProps;
}

/**
 * Mock robusto e calibrado de linhas do PrizePicks para os principais jogadores da rodada
 * (usado como fallback de alta fidelidade caso o IP do container sofra restrição de Cloudflare do PrizePicks)
 */
export const PRIZEPICKS_CALIBRATED_PROPS: PlayerOddsProp[] = [
  // Patrick Mahomes (KC)
  {
    id: 'prizepicks_mahomes_pass_yds',
    playerId: 'mahomes_pat',
    playerName: 'Patrick Mahomes',
    teamId: 'KC',
    position: 'QB',
    statType: 'Pass Yards',
    lineScore: 265.5,
    marketCategory: 'player_passing_yards',
    marketLabel: 'Over 265.5 Jardas de Passe',
    overOdds: 1.87,
    underOdds: 1.87,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prizepicks_mahomes_pass_td',
    playerId: 'mahomes_pat',
    playerName: 'Patrick Mahomes',
    teamId: 'KC',
    position: 'QB',
    statType: 'Pass TDs',
    lineScore: 1.5,
    marketCategory: 'player_passing_tds',
    marketLabel: 'Over 1.5 Passes para Touchdown',
    overOdds: 1.72,
    underOdds: 2.05,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  // Travis Kelce (KC)
  {
    id: 'prizepicks_kelce_rec_yds',
    playerId: 'kelce_trav',
    playerName: 'Travis Kelce',
    teamId: 'KC',
    position: 'TE',
    statType: 'Receiving Yards',
    lineScore: 56.5,
    marketCategory: 'player_receiving_yards',
    marketLabel: 'Over 56.5 Jardas Recebidas',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prizepicks_kelce_receptions',
    playerId: 'kelce_trav',
    playerName: 'Travis Kelce',
    teamId: 'KC',
    position: 'TE',
    statType: 'Receptions',
    lineScore: 5.5,
    marketCategory: 'player_receptions',
    marketLabel: 'Over 5.5 Recepções',
    overOdds: 1.91,
    underOdds: 1.80,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  // Lamar Jackson (BAL)
  {
    id: 'prizepicks_lamar_rush_yds',
    playerId: 'lamar_jack',
    playerName: 'Lamar Jackson',
    teamId: 'BAL',
    position: 'QB',
    statType: 'Rush Yards',
    lineScore: 52.5,
    marketCategory: 'player_rushing_yards',
    marketLabel: 'Over 52.5 Jardas Terrestres',
    overOdds: 1.87,
    underOdds: 1.87,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  // Derrick Henry (BAL)
  {
    id: 'prizepicks_henry_rush_yds',
    playerId: 'henry_der',
    playerName: 'Derrick Henry',
    teamId: 'BAL',
    position: 'RB',
    statType: 'Rush Yards',
    lineScore: 78.5,
    marketCategory: 'player_rushing_yards',
    marketLabel: 'Over 78.5 Jardas Terrestres',
    overOdds: 1.83,
    underOdds: 1.91,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  // Justin Jefferson (MIN)
  {
    id: 'prizepicks_jefferson_rec_yds',
    playerId: 'jefferson_just',
    playerName: 'Justin Jefferson',
    teamId: 'MIN',
    position: 'WR',
    statType: 'Receiving Yards',
    lineScore: 84.5,
    marketCategory: 'player_receiving_yards',
    marketLabel: 'Over 84.5 Jardas Recebidas',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  // Amon-Ra St. Brown (DET)
  {
    id: 'prizepicks_amonra_rec_yds',
    playerId: 'amonra_stb',
    playerName: 'Amon-Ra St. Brown',
    teamId: 'DET',
    position: 'WR',
    statType: 'Receiving Yards',
    lineScore: 74.5,
    marketCategory: 'player_receiving_yards',
    marketLabel: 'Over 74.5 Jardas Recebidas',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prizepicks_amonra_receptions',
    playerId: 'amonra_stb',
    playerName: 'Amon-Ra St. Brown',
    teamId: 'DET',
    position: 'WR',
    statType: 'Receptions',
    lineScore: 6.5,
    marketCategory: 'player_receptions',
    marketLabel: 'Over 6.5 Recepções',
    overOdds: 1.78,
    underOdds: 1.95,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  // Jahmyr Gibbs (DET)
  {
    id: 'prizepicks_gibbs_rush_yds',
    playerId: 'gibbs_jah',
    playerName: 'Jahmyr Gibbs',
    teamId: 'DET',
    position: 'RB',
    statType: 'Rush Yards',
    lineScore: 63.5,
    marketCategory: 'player_rushing_yards',
    marketLabel: 'Over 63.5 Jardas Terrestres',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  // CeeDee Lamb (DAL)
  {
    id: 'prizepicks_lamb_rec_yds',
    playerId: 'lamb_cee',
    playerName: 'CeeDee Lamb',
    teamId: 'DAL',
    position: 'WR',
    statType: 'Receiving Yards',
    lineScore: 82.5,
    marketCategory: 'player_receiving_yards',
    marketLabel: 'Over 82.5 Jardas Recebidas',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  // Saquon Barkley (PHI)
  {
    id: 'prizepicks_saquon_rush_yds',
    playerId: 'saquon_bark',
    playerName: 'Saquon Barkley',
    teamId: 'PHI',
    position: 'RB',
    statType: 'Rush Yards',
    lineScore: 76.5,
    marketCategory: 'player_rushing_yards',
    marketLabel: 'Over 76.5 Jardas Terrestres',
    overOdds: 1.87,
    underOdds: 1.87,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  // Brock Purdy (SF)
  {
    id: 'prizepicks_purdy_pass_yds',
    playerId: 'purdy_brock',
    playerName: 'Brock Purdy',
    teamId: 'SF',
    position: 'QB',
    statType: 'Pass Yards',
    lineScore: 248.5,
    marketCategory: 'player_passing_yards',
    marketLabel: 'Over 248.5 Jardas de Passe',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  // Christian McCaffrey (SF)
  {
    id: 'prizepicks_cmc_rush_rec',
    playerId: 'cmc_chr',
    playerName: 'Christian McCaffrey',
    teamId: 'SF',
    position: 'RB',
    statType: 'Rush Yards',
    lineScore: 72.5,
    marketCategory: 'player_rushing_yards',
    marketLabel: 'Over 72.5 Jardas Terrestres',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
  },
  // Brock Bowers (LV) - DESFALQUE CONFIRMADO (OUT)
  {
    id: 'prizepicks_bowers_rec_yds',
    playerId: 'bowers_brk',
    playerName: 'Brock Bowers',
    teamId: 'LV',
    position: 'TE',
    statType: 'Receiving Yards',
    lineScore: 48.5,
    marketCategory: 'player_receiving_yards',
    marketLabel: 'Over 48.5 Jardas Recebidas',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'prizepicks',
    isActiveToday: false,
    injuryDesignation: 'Out',
    inactiveReason: 'Lesão no Joelho / OUT',
    updatedAt: new Date().toISOString(),
  },
  // Jakobi Meyers (JAX - Transferido/Atualizado via ESPN)
  {
    id: 'prizepicks_meyers_receptions',
    playerId: 'meyers_jak',
    playerName: 'Jakobi Meyers',
    teamId: 'JAX',
    position: 'WR',
    statType: 'Receptions',
    lineScore: 4.5,
    marketCategory: 'player_receptions',
    marketLabel: 'Over 4.5 Recepções',
    overOdds: 1.83,
    underOdds: 1.91,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
    opponent: 'CLE',
    fairProbability: 65.0,
    expectedValue: 18.9,
    edgePercent: 10.4,
    rating: 'HIGH_EV',
    rosterCorrected: true,
    correctionNotice: 'Elenco atualizado via ESPN: Atleta atua pelo Jacksonville Jaguars (JAX) vs Cleveland Browns (CLE).',
  },
  // Tre Tucker (LV Raiders)
  {
    id: 'prizepicks_tucker_rec_yds',
    playerId: 'espn_tucker_lv',
    playerName: 'Tre Tucker',
    teamId: 'LV',
    position: 'WR',
    statType: 'Receiving Yards',
    lineScore: 42.5,
    marketCategory: 'player_receiving_yards',
    marketLabel: 'Over 42.5 Jardas Recebidas',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'prizepicks',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
    opponent: 'MIA',
    fairProbability: 57.0,
    expectedValue: 5.5,
    edgePercent: 2.9,
    rating: 'HIGH_EV',
  },
  // Saquon Barkley (PHI)
  {
    id: 'prop_barkley_rush_yds',
    playerId: 'espn_barkley',
    playerName: 'Saquon Barkley',
    teamId: 'PHI',
    position: 'RB',
    statType: 'Rush Yards',
    lineScore: 76.5,
    marketCategory: 'player_rushing_yards',
    marketLabel: 'Over 76.5 Jardas Terrestres',
    overOdds: 1.87,
    underOdds: 1.87,
    source: 'quant_engine',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
    opponent: 'ATL',
    fairProbability: 58.5,
    expectedValue: 9.4,
    edgePercent: 5.0,
    rating: 'HIGH_EV',
  },
  // Jalen Hurts (PHI)
  {
    id: 'prop_hurts_pass_yds',
    playerId: 'espn_hurts',
    playerName: 'Jalen Hurts',
    teamId: 'PHI',
    position: 'QB',
    statType: 'Pass Yards',
    lineScore: 232.5,
    marketCategory: 'player_passing_yards',
    marketLabel: 'Over 232.5 Jardas de Passe',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'quant_engine',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
    opponent: 'ATL',
    fairProbability: 56.0,
    expectedValue: 3.6,
    edgePercent: 1.9,
    rating: 'MEDIUM_EV',
  },
  // Bijan Robinson (ATL)
  {
    id: 'prop_bijan_rush_yds',
    playerId: 'espn_bijan',
    playerName: 'Bijan Robinson',
    teamId: 'ATL',
    position: 'RB',
    statType: 'Rush Yards',
    lineScore: 72.5,
    marketCategory: 'player_rushing_yards',
    marketLabel: 'Over 72.5 Jardas Terrestres',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'quant_engine',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
    opponent: 'PHI',
    fairProbability: 57.2,
    expectedValue: 5.8,
    edgePercent: 3.1,
    rating: 'HIGH_EV',
  },
  // C.J. Stroud (HOU)
  {
    id: 'prop_stroud_pass_yds',
    playerId: 'espn_stroud',
    playerName: 'C.J. Stroud',
    teamId: 'HOU',
    position: 'QB',
    statType: 'Pass Yards',
    lineScore: 260.5,
    marketCategory: 'player_passing_yards',
    marketLabel: 'Over 260.5 Jardas de Passe',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'quant_engine',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
    opponent: 'CHI',
    fairProbability: 57.0,
    expectedValue: 5.5,
    edgePercent: 2.9,
    rating: 'HIGH_EV',
  },
  // Nico Collins (HOU)
  {
    id: 'prop_collins_rec_yds',
    playerId: 'espn_collins',
    playerName: 'Nico Collins',
    teamId: 'HOU',
    position: 'WR',
    statType: 'Receiving Yards',
    lineScore: 76.5,
    marketCategory: 'player_receiving_yards',
    marketLabel: 'Over 76.5 Jardas Recebidas',
    overOdds: 1.87,
    underOdds: 1.87,
    source: 'quant_engine',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
    opponent: 'CHI',
    fairProbability: 58.5,
    expectedValue: 9.4,
    edgePercent: 5.0,
    rating: 'HIGH_EV',
  },
  // Josh Allen (BUF)
  {
    id: 'prop_allen_pass_yds',
    playerId: 'espn_allen',
    playerName: 'Josh Allen',
    teamId: 'BUF',
    position: 'QB',
    statType: 'Pass Yards',
    lineScore: 248.5,
    marketCategory: 'player_passing_yards',
    marketLabel: 'Over 248.5 Jardas de Passe',
    overOdds: 1.87,
    underOdds: 1.87,
    source: 'quant_engine',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
    opponent: 'MIA',
    fairProbability: 57.5,
    expectedValue: 7.5,
    edgePercent: 4.0,
    rating: 'HIGH_EV',
  },
  // CeeDee Lamb (DAL)
  {
    id: 'prop_lamb_rec_yds',
    playerId: 'espn_lamb',
    playerName: 'CeeDee Lamb',
    teamId: 'DAL',
    position: 'WR',
    statType: 'Receiving Yards',
    lineScore: 84.5,
    marketCategory: 'player_receiving_yards',
    marketLabel: 'Over 84.5 Jardas Recebidas',
    overOdds: 1.87,
    underOdds: 1.87,
    source: 'quant_engine',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
    opponent: 'NO',
    fairProbability: 58.8,
    expectedValue: 10.0,
    edgePercent: 5.3,
    rating: 'HIGH_EV',
  },
  // Joe Burrow (CIN)
  {
    id: 'prop_burrow_pass_yds',
    playerId: 'espn_burrow',
    playerName: 'Joe Burrow',
    teamId: 'CIN',
    position: 'QB',
    statType: 'Pass Yards',
    lineScore: 258.5,
    marketCategory: 'player_passing_yards',
    marketLabel: 'Over 258.5 Jardas de Passe',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'quant_engine',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
    opponent: 'KC',
    fairProbability: 55.5,
    expectedValue: 2.7,
    edgePercent: 1.4,
    rating: 'MEDIUM_EV',
  },
  // Ja'Marr Chase (CIN)
  {
    id: 'prop_chase_rec_yds',
    playerId: 'espn_chase',
    playerName: "Ja'Marr Chase",
    teamId: 'CIN',
    position: 'WR',
    statType: 'Receiving Yards',
    lineScore: 78.5,
    marketCategory: 'player_receiving_yards',
    marketLabel: 'Over 78.5 Jardas Recebidas',
    overOdds: 1.85,
    underOdds: 1.85,
    source: 'quant_engine',
    isActiveToday: true,
    injuryDesignation: 'None',
    inactiveReason: null,
    updatedAt: new Date().toISOString(),
    opponent: 'KC',
    fairProbability: 58.2,
    expectedValue: 7.7,
    edgePercent: 4.1,
    rating: 'HIGH_EV',
  },
];

/**
 * Retorna as oportunidades sincronizadas com filtros flexíveis (+EV, posição, status)
 */
export function getSynchronizedOpportunities(filters?: {
  team?: string;
  minEV?: number;
  onlyActive?: boolean;
  position?: string;
}): PlayerOddsProp[] {
  return PRIZEPICKS_CALIBRATED_PROPS.filter((prop) => {
    if (filters?.team && filters.team !== 'ALL' && prop.teamId.toUpperCase() !== filters.team.toUpperCase()) {
      return false;
    }
    if (filters?.onlyActive && !prop.isActiveToday) {
      return false;
    }
    if (filters?.position && filters.position !== 'ALL' && prop.position.toUpperCase() !== filters.position.toUpperCase()) {
      return false;
    }
    if (filters?.minEV !== undefined && (prop.expectedValue || 0) < filters.minEV) {
      return false;
    }
    return true;
  });
}

/**
 * Consulta props de jogadores com cruzamento de status Ativo/Inativo por time
 * Equivalente à rota: GET /api/players/:team/props
 */
export function getTeamPlayerPropsWithStatus(teamId: string): PlayerOddsProp[] {
  const teamUpper = teamId.toUpperCase();
  return PRIZEPICKS_CALIBRATED_PROPS.filter((p) => p.teamId.toUpperCase() === teamUpper);
}

/**
 * Busca linhas de jogadores diretamente da rota do PrizePicks ou fallback calibrado
 */
export async function fetchPrizePicksProps(): Promise<{
  props: PlayerOddsProp[];
  live: boolean;
  totalCount: number;
}> {
  try {
    const res = await fetch('/api/prizepicks/nfl');
    if (res.ok) {
      const json = await res.json();
      if (json.live && Array.isArray(json.data) && json.data.length > 0) {
        const liveProps = parsePrizePicksResponse(json);
        if (liveProps.length > 0) {
          return {
            props: liveProps,
            live: true,
            totalCount: liveProps.length,
          };
        }
      }
    }
  } catch (e) {
    console.warn('PrizePicks live fetch failed, using synchronized props store.');
  }

  // Enriquece através do Pipeline em 3 Etapas:
  // 1. Elenco Oficial ESPN (Checagem de Time e Trocas)
  // 2. Confrontos do Dia (Tabela e Adversário Real)
  // 3. Status de Prontidão para Pesquisa de Apostas
  const enriched = PRIZEPICKS_CALIBRATED_PROPS.map((prop) => {
    const pipeline = runBettingPipeline(prop.playerName, prop.teamId);

    return {
      ...prop,
      teamId: pipeline.step1Roster.currentTeam, // Garante que Jakobi Meyers seja JAX, etc.
      position: pipeline.step1Roster.position !== 'Player' ? pipeline.step1Roster.position : prop.position,
      opponent: pipeline.step2Matchup.hasGameToday ? pipeline.step2Matchup.opponentAbbr : (prop.opponent || 'BYE'),
      isActiveToday: pipeline.step1Roster.isActiveToday,
      injuryDesignation: pipeline.step1Roster.injuryDesignation || prop.injuryDesignation,
      inactiveReason: pipeline.step1Roster.inactiveReason || prop.inactiveReason,
      pipelineVerified: true,
      rosterCorrected: pipeline.step1Roster.teamCorrected,
      correctionNotice: pipeline.step1Roster.correctionNotice,
      matchupGameId: pipeline.step2Matchup.gameId,
      hasGameToday: pipeline.step2Matchup.hasGameToday,
    };
  });

  return {
    props: enriched,
    live: false,
    totalCount: enriched.length,
  };
}

