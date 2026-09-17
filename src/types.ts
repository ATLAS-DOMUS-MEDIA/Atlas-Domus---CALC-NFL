export type NFLMarketCategory = 
  | 'player_anytime_td'
  | 'player_passing_yards'
  | 'player_passing_tds'
  | 'player_rushing_yards'
  | 'player_receiving_yards'
  | 'player_receptions'
  | 'player_interceptions'
  | 'game_spread'
  | 'game_moneyline'
  | 'game_total_points'
  | 'team_total_points'
  | 'custom';

export type OddsFormat = 'decimal' | 'american';

export interface NFLBetInput {
  name: string;             // ex: Patrick Mahomes
  eventName: string;        // ex: KC Chiefs vs BAL Ravens
  market: NFLMarketCategory;
  marketLabel: string;      // ex: Over 268.5 Jardas de Passe
  bookmaker: string;        // ex: Bet365, Betano, Stake, KTO
  oddsFormat: OddsFormat;
  decimalOdds: number;      // ex: 1.91
  americanOdds: number;     // ex: -110 or +150
  estimatedProbability: number; // 0 - 100% (probabilidade do jogador/time bater a aposta)
  stake: number;            // Valor apostado em R$
  bankroll: number;         // Tamanho total da banca em R$
}

export interface NFLBetAnalysis {
  impliedProbability: number;      // 1 / decimalOdds * 100
  fairOddsDecimal: number;         // 1 / (prob / 100)
  fairOddsAmerican: number;
  expectedValuePercent: number;    // ((prob/100 * odds) - 1) * 100
  isPositiveEV: boolean;
  edge: number;                    // estimatedProbability - impliedProbability
  oddsDifferential: number;        // decimalOdds - fairOddsDecimal
  potentialReturn: number;         // stake * decimalOdds
  potentialProfit: number;         // stake * (decimalOdds - 1)
  expectedProfitPerBet: number;    // stake * (expectedValuePercent / 100)
  
  // Kelly Criterion fractions (percentage of bankroll)
  kellyFullPercent: number;
  kellyHalfPercent: number;
  kellyQuarterPercent: number;
  
  // Suggested stake in currency
  suggestedStakeFull: number;
  suggestedStakeHalf: number;
  suggestedStakeQuarter: number;
  
  riskLevel: 'BAIXO' | 'MODERADO' | 'ALTO' | 'MUITO ALTO';
  verdict: 'EXCELENTE_VALOR' | 'BOM_VALOR' | 'VALOR_MARGINAL' | 'SEM_VALOR' | 'PREJUIZO_GRAVE';
}

export interface NFLStatEstimatorState {
  sampleGames: number;
  hits: number;
  venue: 'home' | 'neutral' | 'away';
  stadiumType: 'dome' | 'outdoor_fair' | 'outdoor_wind_rain';
  opponentDefenseRank: 'top5' | 'average' | 'bottom5'; // Defesa fraca ou forte contra a posição
  roleUsage: 'featured' | 'standard' | 'committee';   // Destaque principal, normal ou comitê/dividindo snaps
  gameScript: 'shootout' | 'balanced' | 'blowout_risk'; // Jogo equilibrado de muitos pontos ou risco de controle no relógio
}

export interface MultiLeg {
  id: string;
  title: string;
  target: string;
  odds: number;
  estimatedProbability: number;
}

export interface SavedBetRecord {
  id: string;
  createdAt: string;
  name: string;
  eventName: string;
  marketLabel: string;
  bookmaker: string;
  odds: number;
  americanOdds: number;
  estimatedProbability: number;
  impliedProbability: number;
  fairOdds: number;
  evPercent: number;
  isPositiveEV: boolean;
  stake: number;
  potentialProfit: number;
  status: 'pendente' | 'green' | 'red';
}

export interface Top10AIOpportunity {
  id: string;
  rank: number;
  playerName: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'DEF' | 'TEAM';
  team: string;
  teamFullName: string;
  opponent: string;
  opponentFullName: string;
  matchup: string;
  gameTime: string;
  stadium: string;
  isDome?: boolean;
  marketType: NFLMarketCategory;
  marketLabel: string;
  lineScore?: number;
  betType: 'Over' | 'Under' | 'Spread' | 'Total' | 'Moneyline' | 'Anytime TD';
  bookmaker: string;
  bookOdds: number;
  americanOdds: number;
  impliedProb: number;
  fairProb: number;
  fairOdds: number;
  expectedValue: number; // e.g. +14.2%
  edgePercent: number;    // e.g. +7.1%
  kellyPercent: number;   // e.g. 2.8%
  confidenceScore: number; // 0 - 100 (e.g. 94)
  hitRateRecent?: string; // e.g. "8/10 jogos"
  tacticalAdvantage: string; // Resumo tático do matchup
  keyReasons: string[]; // 2-3 razões analíticas
  riskLevel: 'BAIXO' | 'MODERADO' | 'EQUILIBRADO';
  engine: 'gemini_ai' | 'bayesian_quant_ai';
  verifiedRoster: boolean;
  injuryStatus: string;
}

