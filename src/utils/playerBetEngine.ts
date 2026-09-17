import { NFLDatabasePlayer, findNFLPlayer } from '../data/nflPlayersDatabase';
import { NFLMarketCategory } from '../types';

export interface PlayerBetBaseline {
  defaultMarket: NFLMarketCategory;
  defaultLine: string;
  baselineHits: number;
  sampleGames: number;
  averageStat: number;
  projectedOdds: number;
}

/**
 * Retorna as linhas estatísticas de baseline para o jogador com base na sua posição
 */
export function getPlayerBetBaselines(player: NFLDatabasePlayer): PlayerBetBaseline {
  switch (player.position.toUpperCase()) {
    case 'QB':
      return {
        defaultMarket: 'player_passing_yards',
        defaultLine: 'Over 245.5 Jardas de Passe',
        baselineHits: 7,
        sampleGames: 10,
        averageStat: 262.4,
        projectedOdds: 1.86,
      };
    case 'RB':
      return {
        defaultMarket: 'player_rushing_yards',
        defaultLine: 'Over 62.5 Jardas Terrestres',
        baselineHits: 6,
        sampleGames: 10,
        averageStat: 68.9,
        projectedOdds: 1.83,
      };
    case 'WR':
      return {
        defaultMarket: 'player_receiving_yards',
        defaultLine: 'Over 58.5 Jardas Recebidas',
        baselineHits: 7,
        sampleGames: 10,
        averageStat: 64.2,
        projectedOdds: 1.85,
      };
    case 'TE':
      return {
        defaultMarket: 'player_receptions',
        defaultLine: 'Over 4.5 Recepções',
        baselineHits: 6,
        sampleGames: 10,
        averageStat: 4.8,
        projectedOdds: 1.80,
      };
    case 'K':
      return {
        defaultMarket: 'custom',
        defaultLine: 'Over 1.5 Field Goals Feitos',
        baselineHits: 7,
        sampleGames: 10,
        averageStat: 1.9,
        projectedOdds: 1.75,
      };
    default:
      return {
        defaultMarket: 'custom',
        defaultLine: 'Over 0.5 Tacos / Sacks',
        baselineHits: 5,
        sampleGames: 10,
        averageStat: 0.8,
        projectedOdds: 1.90,
      };
  }
}

/**
 * Calcula a probabilidade ajustada e flags de risco baseadas no status real do Gameday
 */
export function evaluatePlayerGamedayBetStatus(playerName: string) {
  const player = findNFLPlayer(playerName);

  if (!player) {
    return {
      found: false,
      isInactive: false,
      player: null,
      warningMessage: null,
      eligibleForBet: true,
      probabilityPenalty: 0,
    };
  }

  const isInactive = !player.is_active_today || ['Out', 'IR', 'Doubtful', 'PUP'].includes(player.injury_designation);

  let warningMessage: string | null = null;
  let probabilityPenalty = 0;

  if (isInactive) {
    warningMessage = `🚨 ATLETA DESFALQUE (INATIVO / ${player.injury_designation.toUpperCase()}): ${player.name} (${player.position} - ${player.team_id}) não está ativo para a partida (${player.inactive_reason || 'Lesão'}). Linhas de apostas para atletas inativos serão anuladas / reembolsadas pelas casas.`;
  } else if (player.injury_designation === 'Questionable') {
    warningMessage = `⚠️ ATLETA QUESTIONÁVEL (QUESTIONABLE): ${player.name} sentiu desconforto (${player.inactive_reason || 'Restrição física'}). Risco aumentado de snaps reduzidos. Penalidade matemática de -8% aplicada na projeção.`;
    probabilityPenalty = 8;
  }

  return {
    found: true,
    isInactive,
    player,
    warningMessage,
    eligibleForBet: !isInactive,
    probabilityPenalty,
  };
}
