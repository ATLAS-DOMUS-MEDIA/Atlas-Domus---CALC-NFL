import React, { useState } from 'react';
import { NFLBetInput, NFLBetAnalysis, OddsFormat, NFLMarketCategory } from '../types';
import {
  calculateNFLBetAnalysis,
  calculateDeviggedProbabilities,
  calculateSimulationMetrics,
  calculateBookmakerBenchmark,
  formatCurrencyBRL,
  formatPercent,
  formatAmericanOdds,
  decimalToAmerican,
  americanToDecimal,
} from '../utils/betCalculations';
import { ValueAnalysisCard } from './ValueAnalysisCard';
import { NFLMarketSelector } from './NFLMarketSelector';
import { NFLStatEstimator } from './NFLStatEstimator';
import { ALL_TODAYS_NFL_GAMES } from '../data/nflGamesSchedule';
import { NFL_STAR_PLAYERS } from '../data/nflTeamsAndPlayers';
import { evaluatePlayerGamedayBetStatus } from '../utils/playerBetEngine';
import {
  Calculator,
  Percent,
  TrendingUp,
  DollarSign,
  BookmarkPlus,
  ArrowRight,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Scale,
  BarChart3,
  Sliders,
  Layers,
  Sparkles,
  Info,
  ShieldAlert,
  AlertTriangle,
  Database,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface NFLEVCalculatorProps {
  betInput: NFLBetInput;
  onUpdateInput: (updates: Partial<NFLBetInput>) => void;
  onSaveBet: (analysis: NFLBetAnalysis) => void;
  onNavigateToTab: (tab: 'games' | 'parlay' | 'saved' | 'database') => void;
  savedBetsCount: number;
}

export const NFLEVCalculator: React.FC<NFLEVCalculatorProps> = ({
  betInput,
  onUpdateInput,
  onSaveBet,
  onNavigateToTab,
  savedBetsCount,
}) => {
  // Local state for interactive tools
  const [showDevigger, setShowDevigger] = useState(false);
  const [devigOddsA, setDevigOddsA] = useState<number>(betInput.decimalOdds || 1.90);
  const [devigOddsB, setDevigOddsB] = useState<number>(1.90);

  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationBets, setSimulationBets] = useState<number>(100);

  const [showBookBenchmark, setShowBookBenchmark] = useState(true);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Calculate live EV analysis
  const analysis = calculateNFLBetAnalysis(betInput);

  // Devigger calculation
  const devigResult = calculateDeviggedProbabilities(devigOddsA, devigOddsB);

  // Simulation calculation
  const simulationResult = calculateSimulationMetrics(
    betInput.stake,
    betInput.bankroll,
    analysis.expectedValuePercent,
    betInput.estimatedProbability,
    betInput.decimalOdds,
    simulationBets
  );

  // Bookmaker comparison
  const bookBenchmarks = calculateBookmakerBenchmark(
    betInput.decimalOdds,
    betInput.estimatedProbability,
    betInput.stake
  );

  // Handlers for odds changes
  const handleDecimalOddsChange = (val: number) => {
    const clean = Math.max(1.01, val || 1.01);
    onUpdateInput({
      decimalOdds: clean,
      americanOdds: decimalToAmerican(clean),
    });
    setDevigOddsA(clean);
  };

  const handleAmericanOddsChange = (val: number) => {
    const cleanDecimal = americanToDecimal(val);
    onUpdateInput({
      americanOdds: val,
      decimalOdds: cleanDecimal,
    });
    setDevigOddsA(cleanDecimal);
  };

  const handleProbabilityChange = (prob: number) => {
    const clean = Math.min(99.9, Math.max(0.1, prob || 50));
    onUpdateInput({ estimatedProbability: clean });
  };

  const handleApplyStake = (amount: number) => {
    const clean = Math.max(1, Number(amount.toFixed(2)));
    onUpdateInput({ stake: clean });
  };

  const handleSaveWithToast = () => {
    onSaveBet(analysis);
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3000);
  };

  const handleCopySummary = () => {
    const text = `🏈 ANÁLISE +EV NFL - ${betInput.name || 'Seleção'}
Jogo: ${betInput.eventName || 'NFL Matchup'}
Mercado: ${betInput.marketLabel || 'Mercado'}
Odd: ${betInput.decimalOdds.toFixed(2)} (${formatAmericanOdds(betInput.americanOdds)}) | Casa: ${betInput.bookmaker}
Probabilidade Real Estimada: ${betInput.estimatedProbability.toFixed(1)}% (Break-even: ${analysis.impliedProbability.toFixed(1)}%)
Veredito: ${analysis.verdict} | EV: ${formatPercent(analysis.expectedValuePercent, 2)}
Edge (Vantagem): ${formatPercent(analysis.edge, 1)}
Odd Justa: ${analysis.fairOddsDecimal.toFixed(2)}
Stake Sugerida (Meio Kelly): ${formatCurrencyBRL(analysis.suggestedStakeHalf)}
Calculado via NFL +EV Pro Scanner`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Quick Preset Scenarios
  const PRESETS = [
    {
      label: '🔥 McCaffrey TD (+14.2% EV)',
      name: 'Christian McCaffrey (49ers)',
      event: 'SF @ LAR (17:05)',
      market: 'player_anytime_td' as NFLMarketCategory,
      marketLabel: 'Anotar Touchdown a Qualquer Momento',
      odds: 1.80,
      prob: 63.5,
      bookmaker: 'Bet365',
    },
    {
      label: '🎯 Mahomes Over Jardas (+16.5% EV)',
      name: 'Patrick Mahomes (Chiefs)',
      event: 'KC @ BAL (17:25)',
      market: 'player_passing_yards' as NFLMarketCategory,
      marketLabel: 'Over 264.5 Jardas de Passe',
      odds: 1.95,
      prob: 59.8,
      bookmaker: 'Bet365',
    },
    {
      label: '⚡ Chiefs Spread -3.0 (+8.6% EV)',
      name: 'Kansas City Chiefs',
      event: 'KC @ BAL (17:25)',
      market: 'game_spread' as NFLMarketCategory,
      marketLabel: 'Chiefs -3.0 Spread Pontos',
      odds: 1.91,
      prob: 56.8,
      bookmaker: 'Bet365',
    },
    {
      label: '⚠️ Armadilha Odd Esmagada (-14.3% EV)',
      name: 'Travis Kelce (Chiefs)',
      event: 'KC @ BAL (17:25)',
      market: 'player_anytime_td' as NFLMarketCategory,
      marketLabel: 'Anotar Touchdown',
      odds: 1.62,
      prob: 52.0,
      bookmaker: 'Bet365',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {saveSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <div>
            <p className="font-bold text-sm">Aposta Salva com Sucesso!</p>
            <p className="text-xs text-emerald-100">Disponível no seu Caderno de Apostas (+EV).</p>
          </div>
          <button
            onClick={() => onNavigateToTab('saved')}
            className="ml-2 text-xs bg-white text-emerald-800 font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            Ver Salvas ({savedBetsCount + 1})
          </button>
        </div>
      )}

      {/* Top Banner: Quick Importer from Today's 12 NFL Slate */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Semana 1 NFL • 13/09/2026
              </span>
              <span className="text-xs text-slate-400">12 Jogos & Odds Bet365</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" />
              Calculadora de Valor Esperado (+EV) & Kelly Staking
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Compare as odds da casa com a probabilidade real de bater a meta. Identifique apostas matematicamente lucrativas no longo prazo e aplique a gestão de banca recomendada.
            </p>
          </div>

          {/* Quick Select from Today's Live Games */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <select
                id="nfl-slate-quick-importer"
                aria-label="Carregar Prop dos Jogos de Hoje"
                className="w-full sm:w-72 bg-slate-950 border border-amber-500/40 text-xs text-amber-300 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                defaultValue=""
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) return;

                  // Find in today's games props
                  for (const game of ALL_TODAYS_NFL_GAMES) {
                    const prop = game.availableProps?.find((p) => `${game.id}_${p.playerName}_${p.market}` === selectedId);
                    if (prop) {
                      onUpdateInput({
                        name: `${prop.playerName} (${prop.team})`,
                        eventName: `${game.awayAbbr} @ ${game.homeAbbr} (${game.kickoffTime})`,
                        market: prop.market,
                        marketLabel: prop.marketLabel,
                        bookmaker: prop.sportsbook || 'Bet365',
                        decimalOdds: prop.odds,
                        americanOdds: prop.americanOdds,
                        estimatedProbability: prop.estimatedProb,
                      });
                      break;
                    }
                  }
                  e.target.value = '';
                }}
              >
                <option value="" disabled>
                  ⚡ Carregar dos 12 Jogos de Hoje...
                </option>
                {ALL_TODAYS_NFL_GAMES.map((game) => (
                  <optgroup key={game.id} label={`🏈 ${game.awayAbbr} @ ${game.homeAbbr} (${game.kickoffTime})`}>
                    {game.availableProps?.map((p) => (
                      <option
                        key={`${game.id}_${p.playerName}_${p.market}`}
                        value={`${game.id}_${p.playerName}_${p.market}`}
                      >
                        {p.playerName} ({p.team}): {p.marketLabel} @ {p.odds.toFixed(2)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <button
              type="button"
              id="view-all-games-hub-btn"
              onClick={() => onNavigateToTab('games')}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              <span>Ver Hub dos Jogos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Scenario Preset Chips */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Cenários Rápidos:
          </span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onUpdateInput({
                  name: p.name,
                  eventName: p.event,
                  market: p.market,
                  marketLabel: p.marketLabel,
                  decimalOdds: p.odds,
                  americanOdds: decimalToAmerican(p.odds),
                  estimatedProbability: p.prob,
                  bookmaker: p.bookmaker,
                });
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-amber-500/40 transition-all shrink-0 font-medium text-[11px]"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Inputs (Left 7 Cols) & Value Output (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Config & Parameters */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Section 1: Bet Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                1. Detalhes da Seleção NFL
              </h3>
              <span className="text-xs text-slate-400">Dados do Confronto</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Jogador ou Time */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Jogador ou Time Alvo
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onNavigateToTab('database')}
                      className="text-[11px] bg-emerald-950/80 text-emerald-300 hover:text-white border border-emerald-700/60 rounded px-1.5 py-0.5 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Explorar todos os 2.600+ jogadores"
                    >
                      <Database className="w-3 h-3" />
                      <span>Banco (2.600+)</span>
                    </button>
                    <select
                      id="star-player-quick-picker"
                      aria-label="Atletas da NFL"
                      onChange={(e) => {
                        const selected = NFL_STAR_PLAYERS.find((p) => p.name === e.target.value);
                        if (selected) {
                          onUpdateInput({
                            name: `${selected.name} (${selected.position} - ${selected.team})`,
                            marketLabel: selected.defaultLine,
                          });
                        }
                        e.target.value = '';
                      }}
                      className="text-[11px] bg-slate-800 text-amber-300 border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>⚡ Atletas Titulares...</option>
                      <optgroup label="🏈 Quarterbacks (QB)">
                        {NFL_STAR_PLAYERS.filter((p) => p.position === 'QB' && p.status !== 'OUT').map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name} ({p.team})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🏃 Running Backs (RB)">
                        {NFL_STAR_PLAYERS.filter((p) => p.position === 'RB' && p.status !== 'OUT').map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name} ({p.team})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🎯 Wide Receivers (WR)">
                        {NFL_STAR_PLAYERS.filter((p) => p.position === 'WR' && p.status !== 'OUT').map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name} ({p.team})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🛡️ Tight Ends (TE)">
                        {NFL_STAR_PLAYERS.filter((p) => p.position === 'TE' && p.status !== 'OUT').map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name} ({p.team})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🚫 Lesionados / Desfalques (OUT)">
                        {NFL_STAR_PLAYERS.filter((p) => p.status === 'OUT').map((p) => (
                          <option key={p.name} value={p.name} disabled className="text-rose-400">
                            🚫 {p.name} ({p.team}) - LESIONADO / OUT
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
                <input
                  type="text"
                  id="bet-player-input"
                  value={betInput.name}
                  onChange={(e) => onUpdateInput({ name: e.target.value })}
                  placeholder="Ex: Patrick Mahomes, McCaffrey, Chiefs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Jogo / Partida */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Jogo / Partida
                </label>
                <input
                  type="text"
                  id="bet-event-input"
                  value={betInput.eventName}
                  onChange={(e) => onUpdateInput({ eventName: e.target.value })}
                  placeholder="Ex: KC Chiefs @ BAL Ravens (17:25)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* DYNAMIC GAMEDAY STATUS EVALUATION (from Central Database of 2,600+ players) */}
            {(() => {
              const statusCheck = evaluatePlayerGamedayBetStatus(betInput.name || '');
              if (statusCheck.found && !statusCheck.eligibleForBet) {
                return (
                  <div className="bg-rose-950/80 border border-rose-500/60 rounded-xl p-3.5 flex items-start gap-3 text-xs text-rose-200 shadow-xl shadow-rose-950/50">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-rose-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                          🚨 Desfalque Confirmado: {statusCheck.player?.name} ({statusCheck.player?.position} - {statusCheck.player?.team_id})
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-900 text-rose-300 font-bold border border-rose-700">
                          {statusCheck.player?.injury_designation?.toUpperCase() || 'OUT'}
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-200/90 leading-relaxed">
                        {statusCheck.warningMessage}
                      </p>
                      {statusCheck.player?.name.toLowerCase().includes('bowers') && (
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-slate-300 font-semibold">
                            Alvo principal restante nos Raiders:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateInput({
                                name: 'Tre Tucker (WR - Raiders)',
                                eventName: 'LV Raiders @ MIA Dolphins (17:00)',
                                market: 'player_receiving_yards',
                                marketLabel: 'Over 38.5 Jardas Recebidas',
                                bookmaker: 'Bet365',
                                decimalOdds: 1.87,
                                americanOdds: -115,
                                estimatedProbability: 61,
                              });
                            }}
                            className="text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow"
                          >
                            <span>Aplicar Tre Tucker (Over 38.5 Jardas @ 1.87)</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (statusCheck.found && statusCheck.player?.injury_designation === 'Questionable') {
                return (
                  <div className="bg-amber-950/60 border border-amber-500/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-amber-300 block">
                        ⚠️ Alerta Gameday: Atleta Questionável no Relatório Oficial
                      </span>
                      <p className="text-[11px] text-amber-200/90">
                        {statusCheck.warningMessage}
                      </p>
                    </div>
                  </div>
                );
              }

              if (statusCheck.found && statusCheck.eligibleForBet) {
                return (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-[11px]">
                        <strong>{statusCheck.player?.name}</strong> confirmado e <strong>ATIVO</strong> no banco da NFL (Time: {statusCheck.player?.team_id} • Pos: {statusCheck.player?.position} • #{statusCheck.player?.jersey_number ?? '-'})
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
                      Gameday OK
                    </span>
                  </div>
                );
              }

              return null;
            })()}

            {/* Mercado Selector */}
            <NFLMarketSelector
              selectedMarket={betInput.market}
              onSelectMarket={(market, label) => {
                onUpdateInput({
                  market,
                  marketLabel: `${label} (${betInput.name || 'Alvo'})`,
                });
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Linha / Descrição da Aposta */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Linha Específica da Casa
                </label>
                <input
                  type="text"
                  id="bet-market-label-input"
                  value={betInput.marketLabel}
                  onChange={(e) => onUpdateInput({ marketLabel: e.target.value })}
                  placeholder="Ex: Over 264.5 Jardas, TD Sim, Chiefs -3.5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Casa de Aposta */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Casa de Aposta
                </label>
                <div className="flex gap-1.5">
                  {['Bet365', 'PrizePicks', 'Pinnacle', 'DraftKings', 'FanDuel', 'Betano'].map((book) => (
                    <button
                      key={book}
                      type="button"
                      onClick={() => onUpdateInput({ bookmaker: book })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        betInput.bookmaker === book
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {book}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Odds Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                2. Odds Ofertadas pela Casa
              </h3>
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => onUpdateInput({ oddsFormat: 'decimal' })}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    betInput.oddsFormat === 'decimal'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Decimal (1.90)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateInput({ oddsFormat: 'american' })}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    betInput.oddsFormat === 'american'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Americana (-110)
                </button>
              </div>
            </div>

            {/* Odds Inputs & Converter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>Odd Decimal</span>
                  <span className="text-[11px] text-slate-500">Padrão Brasil / Bet365</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    id="bet-decimal-odds-input"
                    value={betInput.decimalOdds || ''}
                    onChange={(e) => handleDecimalOddsChange(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base font-bold font-mono-numbers text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">
                    Break-even: {analysis.impliedProbability.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>Odd Americana (Moneyline)</span>
                  <span className="text-[11px] text-slate-500">Formato EUA</span>
                </label>
                <input
                  type="number"
                  step="1"
                  id="bet-american-odds-input"
                  value={betInput.americanOdds || ''}
                  onChange={(e) => handleAmericanOddsChange(parseInt(e.target.value, 10))}
                  placeholder="-110 ou +150"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base font-bold font-mono-numbers text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Quick Odds Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 block font-medium">Odds Comuns da NFL:</span>
              <div className="flex flex-wrap gap-1.5">
                {[1.60, 1.72, 1.83, 1.90, 1.95, 2.00, 2.15, 2.50, 3.20].map((quickOdd) => (
                  <button
                    key={quickOdd}
                    type="button"
                    onClick={() => handleDecimalOddsChange(quickOdd)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono-numbers font-semibold transition-all ${
                      Math.abs(betInput.decimalOdds - quickOdd) < 0.01
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {quickOdd.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            {/* Devigging Tool Accordion / Toggle */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                id="toggle-no-vig-tool-btn"
                onClick={() => setShowDevigger(!showDevigger)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span>🔬 Removedor de Vig (Extrair Probabilidade Real de 2 Pontas)</span>
                </div>
                <span className="text-[11px] text-amber-400 font-normal">
                  {showDevigger ? 'Ocultar' : 'Calcular Probabilidade Sem Margem'}
                </span>
              </button>

              {showDevigger && (
                <div className="mt-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-2 text-slate-300 text-xs leading-relaxed">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p>
                      Insira as odds das duas pontas do mercado (ex: Over 1.88 e Under 1.92) para que o algoritmo remova matematicamente a margem da casa (juice) e revele a probabilidade pura.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-medium">Odd Lado A (Sua Escolha)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1.01"
                        value={devigOddsA || ''}
                        onChange={(e) => setDevigOddsA(parseFloat(e.target.value) || 1.90)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-numbers"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-medium">Odd Lado Oposto (Under/Contrário)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1.01"
                        value={devigOddsB || ''}
                        onChange={(e) => setDevigOddsB(parseFloat(e.target.value) || 1.90)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-numbers"
                      />
                    </div>
                  </div>

                  {/* Devig Stats */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Margem (Juice)</span>
                      <span className="text-xs font-bold font-mono-numbers text-amber-400">
                        {devigResult.vigPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Prob. Real Lado A</span>
                      <span className="text-xs font-bold font-mono-numbers text-emerald-400">
                        {devigResult.trueProbA.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Odd Justa Lado A</span>
                      <span className="text-xs font-bold font-mono-numbers text-slate-200">
                        {devigResult.fairOddsDecimalA.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="apply-devig-prob-btn"
                    onClick={() => {
                      handleProbabilityChange(Number(devigResult.trueProbA.toFixed(1)));
                      handleDecimalOddsChange(devigOddsA);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aplicar {devigResult.trueProbA.toFixed(1)}% e Odd {devigOddsA.toFixed(2)} à Calculadora
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Probability Estimator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                3. Probabilidade Real Estimada (%)
              </h3>
              <span className="text-xs font-mono-numbers text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded font-bold">
                {betInput.estimatedProbability.toFixed(1)}%
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Esta é a chance estimada do jogador ou time bater a linha, baseada no histórico recente, matchup e clima.
            </p>

            {/* Direct Slider & Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="99"
                  step="0.5"
                  id="bet-prob-slider"
                  value={betInput.estimatedProbability}
                  onChange={(e) => handleProbabilityChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="99"
                    id="bet-prob-number-input"
                    value={betInput.estimatedProbability}
                    onChange={(e) => handleProbabilityChange(parseFloat(e.target.value))}
                    className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold font-mono-numbers text-center text-white"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>

              {/* Quick Probability Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-500">Atalhos:</span>
                {[45, 50, 55, 60, 65, 70, 80].map((quickProb) => (
                  <button
                    key={quickProb}
                    type="button"
                    onClick={() => handleProbabilityChange(quickProb)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono-numbers font-medium transition-colors ${
                      Math.abs(betInput.estimatedProbability - quickProb) < 1
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {quickProb}%
                  </button>
                ))}
              </div>
            </div>

            {/* NFL Stat Estimator Integration */}
            <div className="pt-2">
              <NFLStatEstimator
                onApplyProbability={(prob) => handleProbabilityChange(prob)}
                currentProbability={betInput.estimatedProbability}
                currentMarket={betInput.market}
                playerNameOrTeam={betInput.name}
              />
            </div>
          </div>

          {/* Section 4: Bankroll & Stake Management */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                4. Gestão de Banca & Stake da Aposta
              </h3>
              <span className="text-xs text-slate-400">Proteção de Capital</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Banca Total */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>Tamanho Total da Banca (R$)</span>
                  <span className="text-[11px] text-slate-500">Salvo no Navegador</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="50"
                    min="10"
                    id="bet-bankroll-input"
                    value={betInput.bankroll || ''}
                    onChange={(e) => onUpdateInput({ bankroll: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold font-mono-numbers text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Stake */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>Valor a Apostar (Stake R$)</span>
                  <span className="text-[11px] text-slate-500">
                    {betInput.bankroll > 0
                      ? `${((betInput.stake / betInput.bankroll) * 100).toFixed(1)}% da banca`
                      : ''}
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="5"
                    min="1"
                    id="bet-stake-input"
                    value={betInput.stake || ''}
                    onChange={(e) => handleApplyStake(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold font-mono-numbers text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Stake Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 block font-medium">Ajuste Rápido de Stake:</span>
              <div className="flex flex-wrap gap-1.5">
                {/* 1% and 2% bankroll chips */}
                {betInput.bankroll > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApplyStake(betInput.bankroll * 0.01)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800"
                    >
                      1% ({formatCurrencyBRL(betInput.bankroll * 0.01)})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyStake(betInput.bankroll * 0.02)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800"
                    >
                      2% ({formatCurrencyBRL(betInput.bankroll * 0.02)})
                    </button>
                  </>
                )}

                {[25, 50, 100, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleApplyStake(val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono-numbers font-medium transition-colors ${
                      betInput.stake === val
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    R$ {val}
                  </button>
                ))}

                {/* Direct Meio Kelly button if +EV */}
                {analysis.isPositiveEV && analysis.suggestedStakeHalf > 0 && (
                  <button
                    type="button"
                    onClick={() => handleApplyStake(analysis.suggestedStakeHalf)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                  >
                    ⭐ Usar Meio Kelly: {formatCurrencyBRL(analysis.suggestedStakeHalf)}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Analysis Visualizer */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* 1. The Core Value Analysis Card */}
          <ValueAnalysisCard
            analysis={analysis}
            input={betInput}
            onApplyStake={handleApplyStake}
          />

          {/* 2. Action Bar: Save Bet & Copy Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <button
              type="button"
              id="save-bet-journal-btn"
              onClick={handleSaveWithToast}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                analysis.isPositiveEV
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/30'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/30'
              }`}
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>Salvar no Caderno de Apostas</span>
              <span className="text-xs opacity-80 font-mono-numbers">
                ({formatPercent(analysis.expectedValuePercent, 1)} EV)
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex-1 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado para Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copiar Análise</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigateToTab('parlay')}
                className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-400 flex items-center justify-center gap-1 transition-colors"
                title="Criar Parlay / Múltipla com esta aposta"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Montar Múltipla</span>
              </button>
            </div>
          </div>

          {/* 3. Multi-Book Odds Benchmark Table (Line Shopping) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Comparativo de Odds (Line Shopping)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">Variação no Mercado</span>
            </div>

            <div className="space-y-1.5">
              {bookBenchmarks.map((b) => (
                <div
                  key={b.name}
                  className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    b.isPositiveEV
                      ? 'bg-slate-950/70 border-emerald-900/30 text-slate-200'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{b.name}</span>
                  </div>

                  <div className="flex items-center gap-3 font-mono-numbers">
                    <span className="font-bold text-slate-100">{b.odds.toFixed(2)}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        b.isPositiveEV
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {formatPercent(b.evPercent, 1)} EV
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Dica Pro: Apostar sempre na casa com a maior odd multiplica seu lucro no longo prazo e reduz drasticamente o risco de perda da banca.
            </p>
          </div>

          {/* 4. Long-Term Projection & 100-Bet Simulation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Simulação de Longo Prazo ({simulationBets} Apostas)
                </h4>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                {[50, 100, 250].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSimulationBets(n)}
                    className={`px-2 py-0.5 rounded font-mono-numbers ${
                      simulationBets === n
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Volume Movimentado</span>
                <span className="text-sm font-bold font-mono-numbers text-white">
                  {formatCurrencyBRL(simulationResult.totalTurnover)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Lucro Líquido Projetado</span>
                <span
                  className={`text-sm font-bold font-mono-numbers ${
                    simulationResult.expectedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {simulationResult.expectedProfit >= 0 ? '+' : ''}
                  {formatCurrencyBRL(simulationResult.expectedProfit)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Acertos Esperados</span>
                <span className="text-sm font-bold font-mono-numbers text-slate-200">
                  {simulationResult.expectedWins} greens / {simulationResult.expectedLosses} reds
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">ROI Projetado</span>
                <span
                  className={`text-sm font-bold font-mono-numbers ${
                    simulationResult.roiPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatPercent(simulationResult.roiPercent, 1)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              * A variância natural na NFL exige uma amostra mínima de 100+ apostas para convergir ao valor esperado matemático.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
