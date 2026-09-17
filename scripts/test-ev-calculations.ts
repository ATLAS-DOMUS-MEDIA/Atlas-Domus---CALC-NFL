import {
  decimalToAmerican,
  americanToDecimal,
  calculateNFLBetAnalysis,
  calculateDeviggedProbabilities,
  calculateSimulationMetrics,
  calculateBookmakerBenchmark,
  formatCurrencyBRL,
  formatPercent,
  formatAmericanOdds,
} from '../src/utils/betCalculations';

function runTests() {
  console.log('--- TEST SUITE: NFL EV CALCULATOR & QUANT ENGINE ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // Test 1: Odds Conversions
  assert(decimalToAmerican(2.0) === 100, 'decimalToAmerican(2.0) == +100');
  assert(decimalToAmerican(1.91) === -110, 'decimalToAmerican(1.91) == -110');
  assert(decimalToAmerican(2.50) === 150, 'decimalToAmerican(2.50) == +150');
  assert(decimalToAmerican(1.50) === -200, 'decimalToAmerican(1.50) == -200');

  assert(americanToDecimal(100) === 2.0, 'americanToDecimal(+100) == 2.0');
  assert(Math.abs(americanToDecimal(-110) - 1.909) < 0.01, 'americanToDecimal(-110) ~= 1.91');
  assert(americanToDecimal(150) === 2.5, 'americanToDecimal(+150) == 2.5');

  // Test 2: Standard EV Calculation
  // Aposta: Odd 2.00, Probabilidade 60%, Stake R$ 100, Banca R$ 1000
  // Break-even prob: 1 / 2.00 = 50%
  // Edge: 60% - 50% = +10%
  // Fair odds: 100 / 60 = 1.6667
  // EV%: ((0.60 * 2.00) - 1) * 100 = +20%
  // Potential Profit: 100 * (2.00 - 1) = R$ 100
  // Expected Profit per bet: 100 * 0.20 = R$ 20
  // Kelly: f = (0.60 * 2.00 - 1) / (2.00 - 1) = 0.20 (20% of bankroll = R$ 200)
  // Half Kelly: 10% (R$ 100)
  const analysis1 = calculateNFLBetAnalysis({
    name: 'Patrick Mahomes',
    eventName: 'KC @ BAL',
    market: 'player_passing_yards',
    marketLabel: 'Over 265.5 Jardas',
    bookmaker: 'Bet365',
    oddsFormat: 'decimal',
    decimalOdds: 2.0,
    americanOdds: 100,
    estimatedProbability: 60,
    stake: 100,
    bankroll: 1000,
  });

  assert(analysis1.impliedProbability === 50, 'Implied prob for 2.00 is 50%');
  assert(Math.abs(analysis1.fairOddsDecimal - 1.667) < 0.01, 'Fair odds for 60% is 1.67');
  assert(analysis1.expectedValuePercent === 20, 'EV is exactly +20%');
  assert(analysis1.isPositiveEV === true, 'isPositiveEV is true');
  assert(analysis1.edge === 10, 'Edge is +10%');
  assert(analysis1.potentialProfit === 100, 'Potential profit is R$ 100');
  assert(analysis1.expectedProfitPerBet === 20, 'Expected profit per bet is R$ 20');
  assert(analysis1.kellyFullPercent === 20, 'Full Kelly is 20%');
  assert(analysis1.suggestedStakeHalf === 100, 'Suggested Half Kelly stake is R$ 100 (10% of 1000)');
  assert(analysis1.verdict === 'EXCELENTE_VALOR', 'Verdict is EXCELENTE_VALOR');

  // Test 3: Negative EV (Trap) Calculation
  // Aposta: Odd 1.70, Probabilidade 50%, Stake R$ 50
  // Implied prob: 1 / 1.70 = 58.82%
  // Edge: 50% - 58.82% = -8.82%
  // EV%: (0.50 * 1.70 - 1) * 100 = -15%
  const analysisNegative = calculateNFLBetAnalysis({
    name: 'Travis Kelce',
    eventName: 'KC @ BAL',
    market: 'player_anytime_td',
    marketLabel: 'Marcar TD',
    bookmaker: 'Bet365',
    oddsFormat: 'decimal',
    decimalOdds: 1.7,
    americanOdds: -143,
    estimatedProbability: 50,
    stake: 50,
    bankroll: 1000,
  });

  assert(analysisNegative.isPositiveEV === false, 'Negative EV is detected');
  assert(analysisNegative.expectedValuePercent < 0, 'EV% is negative');
  assert(analysisNegative.suggestedStakeHalf === 0, 'Negative EV yields R$ 0 suggested stake');
  assert(analysisNegative.verdict === 'PREJUIZO_GRAVE', 'Verdict is PREJUIZO_GRAVE');

  // Test 4: Two-Way No-Vig Devigging
  // Over 1.90 / Under 1.90 (Total = 105.26% juice -> 50% true probability each)
  const devigStandard = calculateDeviggedProbabilities(1.90, 1.90);
  assert(Math.abs(devigStandard.trueProbA - 50.0) < 0.1, 'Balanced 1.90/1.90 yields 50% true prob');
  assert(Math.abs(devigStandard.fairOddsDecimalA - 2.0) < 0.01, 'Fair odds is 2.00');
  assert(Math.abs(devigStandard.overroundPercent - 5.26) < 0.1, 'Overround is 5.26%');

  // Asymmetric market: 1.75 / 2.10
  // 1/1.75 = 0.5714, 1/2.10 = 0.4762. Sum = 1.0476 (4.76% juice)
  // True A = 0.5714 / 1.0476 = 54.54%
  // True B = 0.4762 / 1.0476 = 45.46%
  const devigAsym = calculateDeviggedProbabilities(1.75, 2.10);
  assert(Math.abs(devigAsym.trueProbA - 54.55) < 0.1, 'Asymmetric 1.75 devigs to ~54.55%');
  assert(Math.abs(devigAsym.trueProbB - 45.45) < 0.1, 'Asymmetric 2.10 devigs to ~45.45%');

  // Test 5: Simulation Metrics
  const sim = calculateSimulationMetrics(50, 1000, 10, 55, 2.0, 100);
  assert(sim.totalTurnover === 5000, 'Turnover for 100 bets of R$ 50 is R$ 5000');
  assert(sim.expectedProfit === 500, 'Expected profit on 10% EV is R$ 500');
  assert(sim.roiPercent === 10, 'Expected ROI is 10%');
  assert(sim.expectedWins === 55, 'Expected wins for 55% prob is 55');

  // Test 6: Bookmaker Benchmarks
  const benchmarks = calculateBookmakerBenchmark(1.90, 55, 50);
  assert(benchmarks.length >= 5, 'Benchmark generated for multiple bookmakers');
  assert(benchmarks.some(b => b.name.includes('Bet365')), 'Bet365 benchmark included');

  // Test 7: Formatting
  assert(formatCurrencyBRL(100).includes('100,00'), 'formatCurrencyBRL handles 100');
  assert(formatPercent(5.5) === '+5.5%', 'formatPercent handles positive values');
  assert(formatPercent(-3.2) === '-3.2%', 'formatPercent handles negative values');
  assert(formatAmericanOdds(150) === '+150', 'formatAmericanOdds formats positive');
  assert(formatAmericanOdds(-110) === '-110', 'formatAmericanOdds formats negative');

  console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL MATH TESTS PASSED PERFECTLY!');
  }
}

runTests();
