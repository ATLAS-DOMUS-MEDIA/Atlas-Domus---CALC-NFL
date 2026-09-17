import { NFLBetInput, NFLBetAnalysis, OddsFormat } from '../types';

export function decimalToAmerican(decimal: number): number {
  if (decimal <= 1.0) return 0;
  if (decimal >= 2.0) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

export function americanToDecimal(american: number): number {
  if (american === 0) return 1.0;
  if (american > 0) {
    return Number(((american / 100) + 1).toFixed(3));
  } else {
    return Number(((100 / Math.abs(american)) + 1).toFixed(3));
  }
}

export function calculateNFLBetAnalysis(input: NFLBetInput): NFLBetAnalysis {
  let odds = input.decimalOdds;

  if (input.oddsFormat === 'american') {
    odds = americanToDecimal(input.americanOdds);
  }

  odds = Math.max(1.01, Number(odds) || 1.01);
  const prob = Math.min(99.9, Math.max(0.1, Number(input.estimatedProbability) || 0.1));
  const stake = Math.max(0, Number(input.stake) || 0);
  const bankroll = Math.max(0, Number(input.bankroll) || 0);

  // Probabilidade Implícita das Casas
  const impliedProbability = Number(((1 / odds) * 100).toFixed(2));
  
  // Odd Justa (Fair Odds)
  const fairOddsDecimal = Number((100 / prob).toFixed(3));
  const fairOddsAmerican = decimalToAmerican(fairOddsDecimal);

  // Valor Esperado (+EV)
  // EV% = ((Probabilidade * Odd Decimal) - 1) * 100
  const pDecimal = prob / 100;
  const rawEV = ((pDecimal * odds) - 1) * 100;
  const expectedValuePercent = Number(rawEV.toFixed(2));
  const isPositiveEV = expectedValuePercent > 0;
  
  // Edge (Vantagem percentual sobre a casa)
  const edge = Number((prob - impliedProbability).toFixed(2));
  const oddsDifferential = Number((odds - fairOddsDecimal).toFixed(3));

  // Retornos
  const potentialReturn = Number((stake * odds).toFixed(2));
  const potentialProfit = Number((stake * (odds - 1)).toFixed(2));
  const expectedProfitPerBet = Number((stake * (expectedValuePercent / 100)).toFixed(2));

  // Critério de Kelly:
  // f* = (p * (b) - q) / b onde b = odds - 1 e q = 1 - p
  // f* = (p * odds - 1) / (odds - 1)
  let kellyFullFraction = 0;
  if (odds > 1 && expectedValuePercent > 0) {
    kellyFullFraction = (pDecimal * odds - 1) / (odds - 1);
  }
  
  // Protegemos o apostador limitando a 20% da banca no máximo no full Kelly
  const rawKellyPercent = Math.min(20, Math.max(0, kellyFullFraction * 100));
  const kellyFullPercent = Number(rawKellyPercent.toFixed(2));
  const kellyHalfPercent = Number((kellyFullPercent / 2).toFixed(2));
  const kellyQuarterPercent = Number((kellyFullPercent / 4).toFixed(2));

  const suggestedStakeFull = Number(((bankroll * kellyFullPercent) / 100).toFixed(2));
  const suggestedStakeHalf = Number(((bankroll * kellyHalfPercent) / 100).toFixed(2));
  const suggestedStakeQuarter = Number(((bankroll * kellyQuarterPercent) / 100).toFixed(2));

  // Risco baseado na volatilidade da probabilidade
  let riskLevel: NFLBetAnalysis['riskLevel'] = 'MODERADO';
  if (prob >= 65) {
    riskLevel = 'BAIXO';
  } else if (prob >= 48) {
    riskLevel = 'MODERADO';
  } else if (prob >= 30) {
    riskLevel = 'ALTO';
  } else {
    riskLevel = 'MUITO ALTO';
  }

  // Veredito de Valor
  let verdict: NFLBetAnalysis['verdict'] = 'SEM_VALOR';
  if (expectedValuePercent >= 8) {
    verdict = 'EXCELENTE_VALOR';
  } else if (expectedValuePercent >= 3) {
    verdict = 'BOM_VALOR';
  } else if (expectedValuePercent > 0) {
    verdict = 'VALOR_MARGINAL';
  } else if (expectedValuePercent > -8) {
    verdict = 'SEM_VALOR';
  } else {
    verdict = 'PREJUIZO_GRAVE';
  }

  return {
    impliedProbability,
    fairOddsDecimal,
    fairOddsAmerican,
    expectedValuePercent,
    isPositiveEV,
    edge,
    oddsDifferential,
    potentialReturn,
    potentialProfit,
    expectedProfitPerBet,
    kellyFullPercent,
    kellyHalfPercent,
    kellyQuarterPercent,
    suggestedStakeFull,
    suggestedStakeHalf,
    suggestedStakeQuarter,
    riskLevel,
    verdict,
  };
}

export function formatCurrencyBRL(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

export function formatPercent(val: number, decimals: number = 1): string {
  return `${val >= 0 ? '+' : ''}${val.toFixed(decimals)}%`;
}

export function formatAmericanOdds(american: number): string {
  return american > 0 ? `+${american}` : `${american}`;
}

export interface DeviggedResult {
  rawProbA: number;
  rawProbB: number;
  overroundPercent: number;
  vigPercent: number;
  trueProbA: number;
  trueProbB: number;
  fairOddsDecimalA: number;
  fairOddsDecimalB: number;
  fairOddsAmericanA: number;
  fairOddsAmericanB: number;
}

/**
 * Multiplicative Devigging (Remoção de Margem)
 * Strips the juice/vig from a two-way market (e.g. Over vs Under, Spread Side A vs Side B)
 */
export function calculateDeviggedProbabilities(oddsA: number, oddsB: number): DeviggedResult {
  const safeA = Math.max(1.01, Number(oddsA) || 1.90);
  const safeB = Math.max(1.01, Number(oddsB) || 1.90);

  const rawProbA = (1 / safeA) * 100;
  const rawProbB = (1 / safeB) * 100;
  const totalRawProb = rawProbA + rawProbB;

  const overroundPercent = totalRawProb - 100;
  const vigPercent = (1 - (100 / totalRawProb)) * 100;

  const trueProbA = (rawProbA / totalRawProb) * 100;
  const trueProbB = (rawProbB / totalRawProb) * 100;

  const fairOddsDecimalA = Number((100 / trueProbA).toFixed(3));
  const fairOddsDecimalB = Number((100 / trueProbB).toFixed(3));

  return {
    rawProbA,
    rawProbB,
    overroundPercent,
    vigPercent,
    trueProbA,
    trueProbB,
    fairOddsDecimalA,
    fairOddsDecimalB,
    fairOddsAmericanA: decimalToAmerican(fairOddsDecimalA),
    fairOddsAmericanB: decimalToAmerican(fairOddsDecimalB),
  };
}

export interface SimulationResult {
  numBets: number;
  stake: number;
  totalTurnover: number;
  expectedProfit: number;
  expectedReturn: number;
  expectedWins: number;
  expectedLosses: number;
  roiPercent: number;
  breakEvenWinRate: number;
  standardDeviationProfit: number;
  confidenceInterval95: [number, number];
}

/**
 * Projects long-term sports betting mathematical outcome over N identical bets
 */
export function calculateSimulationMetrics(
  stake: number,
  bankroll: number,
  evPercent: number,
  probPercent: number,
  decimalOdds: number,
  numBets: number = 100
): SimulationResult {
  const safeStake = Math.max(1, stake);
  const safeOdds = Math.max(1.01, decimalOdds);
  const safeProb = Math.min(0.999, Math.max(0.001, probPercent / 100));
  const safeN = Math.max(1, numBets);

  const totalTurnover = safeN * safeStake;
  const expectedProfit = totalTurnover * (evPercent / 100);
  const expectedReturn = totalTurnover + expectedProfit;
  const expectedWins = Math.round(safeN * safeProb * 10) / 10;
  const expectedLosses = Math.round(safeN * (1 - safeProb) * 10) / 10;
  const roiPercent = (expectedProfit / totalTurnover) * 100;
  const breakEvenWinRate = (1 / safeOdds) * 100;

  // Standard deviation for binomial trial with outcome +net / -stake
  // Win profit = safeStake * (safeOdds - 1), Loss profit = -safeStake
  // Var per bet = p * (winProfit - mean)^2 + (1-p) * (-safeStake - mean)^2
  const meanPerBet = safeStake * (evPercent / 100);
  const winProfit = safeStake * (safeOdds - 1);
  const lossProfit = -safeStake;
  const variancePerBet =
    safeProb * Math.pow(winProfit - meanPerBet, 2) +
    (1 - safeProb) * Math.pow(lossProfit - meanPerBet, 2);
  const totalStdDev = Math.sqrt(safeN * variancePerBet);

  return {
    numBets: safeN,
    stake: safeStake,
    totalTurnover,
    expectedProfit,
    expectedReturn,
    expectedWins,
    expectedLosses,
    roiPercent,
    breakEvenWinRate,
    standardDeviationProfit: totalStdDev,
    confidenceInterval95: [
      expectedProfit - 1.96 * totalStdDev,
      expectedProfit + 1.96 * totalStdDev,
    ],
  };
}

export interface BookmakerComparison {
  name: string;
  odds: number;
  americanOdds: number;
  evPercent: number;
  isPositiveEV: boolean;
  profitOnWin: number;
  expectedProfit: number;
}

/**
 * Compares EV across benchmark bookmakers for line-shopping awareness
 */
export function calculateBookmakerBenchmark(
  baseOdd: number,
  estimatedProb: number,
  stake: number
): BookmakerComparison[] {
  const pDecimal = estimatedProb / 100;
  
  // Model benchmark variations around base odds
  const houses = [
    { name: 'Bet365 (Referência)', multiplier: 1.0 },
    { name: 'Betano', multiplier: 0.985 },
    { name: 'KTO', multiplier: 1.015 },
    { name: 'Novibet', multiplier: 0.99 },
    { name: 'Superbet', multiplier: 1.01 },
    { name: 'Mercado Justo (Sem Vig)', multiplier: (100 / estimatedProb) / baseOdd },
  ];

  return houses.map((house) => {
    let houseOdd = Math.max(1.01, Number((baseOdd * house.multiplier).toFixed(2)));
    if (house.name.includes('Sem Vig')) {
      houseOdd = Number((100 / Math.max(0.1, estimatedProb)).toFixed(2));
    }
    const evPercent = ((pDecimal * houseOdd) - 1) * 100;
    const profitOnWin = stake * (houseOdd - 1);
    const expectedProfit = stake * (evPercent / 100);

    return {
      name: house.name,
      odds: houseOdd,
      americanOdds: decimalToAmerican(houseOdd),
      evPercent,
      isPositiveEV: evPercent > 0,
      profitOnWin,
      expectedProfit,
    };
  });
}
