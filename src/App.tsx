import React, { useState, useEffect, useId } from 'react';
import {
  NFLBetInput,
  NFLBetAnalysis,
  NFLMarketCategory,
  OddsFormat,
  SavedBetRecord,
} from './types';
import {
  calculateNFLBetAnalysis,
  americanToDecimal,
  decimalToAmerican,
  formatCurrencyBRL,
  formatPercent,
  formatAmericanOdds,
} from './utils/betCalculations';
import { NFL_PRESETS, NFLPreset } from './data/presets';
import { NFLMarketSelector } from './components/NFLMarketSelector';
import { NFLStatEstimator } from './components/NFLStatEstimator';
import { ValueAnalysisCard } from './components/ValueAnalysisCard';
import { NFLParlayCalculator } from './components/NFLParlayCalculator';
import { SavedBetsManager } from './components/SavedBetsManager';
import { NFLGamesHub } from './components/NFLGamesHub';
import { NFLEVCalculator } from './components/NFLEVCalculator';
import { NFLDatabaseViewer } from './components/NFLDatabaseViewer';
import { PrizePicksPropsViewer } from './components/PrizePicksPropsViewer';
import { Top10AIOpportunities } from './components/Top10AIOpportunities';
import { NFL_ALL_TEAMS, NFL_STAR_PLAYERS } from './data/nflTeamsAndPlayers';
import { NFLDatabasePlayer } from './data/nflPlayersDatabase';
import {
  Calculator,
  Flame,
  Bookmark,
  Layers,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Check,
  TrendingUp,
  Calendar,
  Zap,
  Users,
  Database,
} from 'lucide-react';

const STORAGE_KEY_SAVED_BETS = 'nfl_saved_bets_v1';
const STORAGE_KEY_BANKROLL = 'nfl_user_bankroll_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'games' | 'top10' | 'prizepicks' | 'parlay' | 'saved' | 'database'>('top10');

  // Input State
  const [name, setName] = useState<string>('Christian McCaffrey');
  const [eventName, setEventName] = useState<string>('SF 49ers @ LA Rams');
  const [market, setMarket] = useState<NFLMarketCategory>('player_anytime_td');
  const [marketLabel, setMarketLabel] = useState<string>('Marcar Touchdown a qualquer momento');
  const [bookmaker, setBookmaker] = useState<string>('Bet365');
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('decimal');
  const [decimalOdds, setDecimalOdds] = useState<number>(1.75);
  const [americanOdds, setAmericanOdds] = useState<number>(-133);
  const [estimatedProbability, setEstimatedProbability] = useState<number>(66);
  const [stake, setStake] = useState<number>(50);
  const [bankroll, setBankroll] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BANKROLL);
    return saved ? Number(saved) : 1000;
  });

  // Saved bets state
  const [savedBets, setSavedBets] = useState<SavedBetRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAVED_BETS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [savedNotification, setSavedNotification] = useState<boolean>(false);

  // Sync bankroll
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BANKROLL, bankroll.toString());
  }, [bankroll]);

  // Sync saved bets
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SAVED_BETS, JSON.stringify(savedBets));
  }, [savedBets]);

  // Handle odds format conversion
  const handleDecimalChange = (val: number) => {
    const clean = Math.max(1.01, val || 1.01);
    setDecimalOdds(clean);
    setAmericanOdds(decimalToAmerican(clean));
  };

  const handleAmericanChange = (val: number) => {
    setAmericanOdds(val);
    const converted = americanToDecimal(val);
    setDecimalOdds(converted);
  };

  const loadPreset = (preset: NFLPreset) => {
    setName(preset.data.name);
    setEventName(preset.data.eventName);
    setMarket(preset.data.market);
    setMarketLabel(preset.data.marketLabel);
    setBookmaker(preset.data.bookmaker);
    setOddsFormat(preset.data.oddsFormat);
    setDecimalOdds(preset.data.decimalOdds);
    setAmericanOdds(preset.data.americanOdds);
    setEstimatedProbability(preset.data.estimatedProbability);
    setStake(preset.data.stake);
    setActiveTab('single');
  };

  const handleSelectPropFromHub = (propData: Partial<NFLBetInput>) => {
    if (propData.name) setName(propData.name);
    if (propData.eventName) setEventName(propData.eventName);
    if (propData.market) setMarket(propData.market);
    if (propData.marketLabel) setMarketLabel(propData.marketLabel);
    if (propData.bookmaker) setBookmaker(propData.bookmaker);
    if (propData.decimalOdds) {
      setDecimalOdds(propData.decimalOdds);
      setAmericanOdds(decimalToAmerican(propData.decimalOdds));
    }
    if (propData.estimatedProbability) setEstimatedProbability(propData.estimatedProbability);
    setActiveTab('single');
  };

  const currentInput: NFLBetInput = {
    name,
    eventName,
    market,
    marketLabel,
    bookmaker,
    oddsFormat,
    decimalOdds,
    americanOdds,
    estimatedProbability,
    stake,
    bankroll,
  };

  const analysis = calculateNFLBetAnalysis(currentInput);

  const handleSaveBet = (customAnalysis?: NFLBetAnalysis) => {
    const activeAnalysis = customAnalysis || analysis;
    const newBet: SavedBetRecord = {
      id: Date.now().toString(),
      createdAt: new Date().toLocaleDateString('pt-BR'),
      name: name || 'Aposta NFL',
      eventName: eventName || 'Semana 1 NFL',
      marketLabel: marketLabel || 'Mercado Geral',
      bookmaker,
      odds: decimalOdds,
      americanOdds,
      estimatedProbability,
      impliedProbability: activeAnalysis.impliedProbability,
      fairOdds: activeAnalysis.fairOddsDecimal,
      evPercent: activeAnalysis.expectedValuePercent,
      isPositiveEV: activeAnalysis.isPositiveEV,
      stake,
      potentialProfit: activeAnalysis.potentialProfit,
      status: 'pendente',
    };

    setSavedBets([newBet, ...savedBets]);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleUpdateBetStatus = (id: string, status: 'pendente' | 'green' | 'red') => {
    setSavedBets(
      savedBets.map((b) => (b.id === id ? { ...b, status } : b))
    );
  };

  const handleDeleteBet = (id: string) => {
    setSavedBets(savedBets.filter((b) => b.id !== id));
  };

  const handleClearAllBets = () => {
    if (window.confirm('Deseja realmente limpar todo o histórico de apostas salvas?')) {
      setSavedBets([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              🏈
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                  Calculadora de Apostas NFL
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  +EV & Props
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Probabilidade Real do Jogador/Time vs Odds das Casas de Apostas
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs gap-1 overflow-x-auto no-scrollbar max-w-full">
            <button
              type="button"
              id="tab-top10-ai-btn"
              onClick={() => setActiveTab('top10')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'top10'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Top 10 Picks IA</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                activeTab === 'top10' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                +EV
              </span>
            </button>

            <button
              type="button"
              id="tab-nfl-games-hub-btn"
              onClick={() => setActiveTab('games')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                activeTab === 'games'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Jogos da Semana 2 (16)
            </button>

            <button
              type="button"
              id="tab-single-calculator-btn"
              onClick={() => setActiveTab('single')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'single'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Calculadora (+EV)
            </button>

            <button
              type="button"
              id="tab-prizepicks-props-btn"
              onClick={() => setActiveTab('prizepicks')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'prizepicks'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              Props PrizePicks (API)
            </button>

            <button
              type="button"
              id="tab-parlay-calculator-btn"
              onClick={() => setActiveTab('parlay')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'parlay'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Múltipla / Parlay
            </button>

            <button
              type="button"
              id="tab-nfl-database-btn"
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'database'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Banco de Atletas (2.600+)
            </button>

            <button
              type="button"
              id="tab-saved-bets-btn"
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'saved'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Salvas ({savedBets.length})
            </button>
          </div>
        </div>
      </header>

      {/* Presets Bar */}
      <section className="bg-slate-900/40 border-b border-slate-800/60 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] uppercase font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Cenários NFL:
          </span>
          {NFL_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => loadPreset(p)}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shrink-0 flex items-center gap-1.5"
            >
              <span className="font-medium">{p.title.split('-')[0].trim()}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold font-mono-numbers ${
                  p.tag.includes('+EV Alto')
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : p.tag.includes('Armadilha')
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {p.tag}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6">
        {/* Tab: Top 10 Melhores Oportunidades do Dia (IA) */}
        {activeTab === 'top10' && (
          <Top10AIOpportunities
            onSelectPropToAnalyze={(propData) => {
              handleSelectPropFromHub(propData);
              setActiveTab('single');
            }}
            onSaveBet={(customBet) => {
              if (customBet) {
                setSavedBets((prev) => [customBet, ...prev]);
                setSavedNotification(true);
                setTimeout(() => setSavedNotification(false), 2500);
              }
            }}
            onNavigateToParlay={() => setActiveTab('parlay')}
          />
        )}

        {/* Tab: NFL Games & Props Hub */}
        {activeTab === 'games' && (
          <NFLGamesHub onSelectPropToAnalyze={handleSelectPropFromHub} />
        )}

        {/* Tab: Single Bet EV Calculator */}
        {activeTab === 'single' && (
          <NFLEVCalculator
            betInput={currentInput}
            onUpdateInput={(updates) => {
              if (updates.name !== undefined) setName(updates.name);
              if (updates.eventName !== undefined) setEventName(updates.eventName);
              if (updates.market !== undefined) setMarket(updates.market);
              if (updates.marketLabel !== undefined) setMarketLabel(updates.marketLabel);
              if (updates.bookmaker !== undefined) setBookmaker(updates.bookmaker);
              if (updates.oddsFormat !== undefined) setOddsFormat(updates.oddsFormat);
              if (updates.decimalOdds !== undefined) setDecimalOdds(updates.decimalOdds);
              if (updates.americanOdds !== undefined) setAmericanOdds(updates.americanOdds);
              if (updates.estimatedProbability !== undefined) setEstimatedProbability(updates.estimatedProbability);
              if (updates.stake !== undefined) setStake(updates.stake);
              if (updates.bankroll !== undefined) setBankroll(updates.bankroll);
            }}
            onSaveBet={(customAnalysis) => handleSaveBet(customAnalysis)}
            onNavigateToTab={setActiveTab}
            savedBetsCount={savedBets.length}
          />
        )}

        {/* Tab 2: NFL Parlay Calculator */}
        {activeTab === 'parlay' && <NFLParlayCalculator />}

        {/* Tab PrizePicks: Player Props Feed with Gameday Status */}
        {activeTab === 'prizepicks' && (
          <PrizePicksPropsViewer
            onSelectPropForBet={(prop, direction, analysis) => {
              const odds = direction === 'Over' ? prop.overOdds : prop.underOdds;
              setName(`${prop.playerName} (${prop.position} - ${prop.teamId})`);
              setEventName(`${prop.teamId} ${prop.opponent ? `vs ${prop.opponent}` : 'Jogo Oficial NFL'}`);
              setMarketLabel(`${direction} ${prop.lineScore} ${prop.statType}`);
              setMarket(prop.marketCategory);
              setBookmaker('PrizePicks');
              setDecimalOdds(odds);
              setAmericanOdds(decimalToAmerican(odds));
              setEstimatedProbability(analysis ? analysis.fairProb : (prop.fairProbability || 58));
              setActiveTab('single');
            }}
          />
        )}

        {/* Tab 3: Saved Bets Tracker */}
        {activeTab === 'saved' && (
          <SavedBetsManager
            savedBets={savedBets}
            onUpdateStatus={handleUpdateBetStatus}
            onDeleteBet={handleDeleteBet}
            onClearAll={handleClearAllBets}
          />
        )}

        {/* Tab 4: NFL Central Database */}
        {activeTab === 'database' && (
          <NFLDatabaseViewer
            onSelectPlayerForBet={(player, defaultLine, defaultMarket, defaultOdds) => {
              setName(`${player.name} (${player.position} - ${player.team_id})`);
              setMarketLabel(defaultLine);
              setMarket(defaultMarket as NFLMarketCategory);
              setDecimalOdds(defaultOdds);
              setAmericanOdds(decimalToAmerican(defaultOdds));
              setEstimatedProbability(60);
              setActiveTab('single');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <p>
          Calculadora Estatística de Apostas NFL (+EV) • Análise matemática baseada em probabilidade real, Break-Even Odds e Critério de Kelly.
        </p>
      </footer>
    </div>
  );
}
