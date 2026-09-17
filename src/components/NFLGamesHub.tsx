import React, { useState, useMemo, useEffect } from 'react';
import { ALL_TODAYS_NFL_GAMES, NFLMatchupStudy, NFLGameProp } from '../data/nflGamesSchedule';
import { NFL_CURRENT_TEAM_ROSTERS, TeamRosterProfile } from '../data/nflTeamRosters';
import { getTeamESPNRoster, ESPNRosterAthlete } from '../data/nflPlayersDatabase';
import { fetchLiveESPNOdds, OddsSyncResult, calculateEVAndEdge, formatAmericanOdds } from '../services/nflOddsService';
import { TheOddsApiBar } from './TheOddsApiBar';
import { TheOddsApiResponse } from '../services/theOddsApiService';
import { mergeTheOddsApiIntoSchedule } from '../services/theOddsApiMapper';
import { NFLBetInput } from '../types';
import {
  Calendar,
  Shield,
  TrendingUp,
  Zap,
  Search,
  AlertTriangle,
  Flame,
  Wind,
  Layers,
  Sparkles,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  RefreshCw,
  Users,
  Swords,
  Activity,
  Award,
  BookOpen,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface NFLGamesHubProps {
  onSelectPropToAnalyze: (data: Partial<NFLBetInput>) => void;
}

export const NFLGamesHub: React.FC<NFLGamesHubProps> = ({ onSelectPropToAnalyze }) => {
  const [activeView, setActiveView] = useState<'matchups' | 'rosters' | 'scanner' | 'insights'>('matchups');
  const [selectedGameId, setSelectedGameId] = useState<string>(ALL_TODAYS_NFL_GAMES[0].id);
  const [activeGameTab, setActiveGameTab] = useState<'props' | 'rosters' | 'tactics' | 'model'>('props');
  const [timeFilter, setTimeFilter] = useState<'all' | '14:00' | '17:00' | 'primetime'>('all');
  const [propCategoryFilter, setPropCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRosterTeamId, setSelectedRosterTeamId] = useState<string>('DET');
  const [rosterConferenceFilter, setRosterConferenceFilter] = useState<'ALL' | 'AFC' | 'NFC'>('ALL');
  const [espnRosterSearch, setEspnRosterSearch] = useState<string>('');
  const [espnRosterPosFilter, setEspnRosterPosFilter] = useState<string>('ALL');

  // API Sync State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<OddsSyncResult>({
    source: 'BET365_QUANT_ENGINE',
    status: 'online',
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    latencyMs: 38,
    gamesCount: 12,
    message: 'Odds Bet365 calibradas com margem real e dados atuais de elenco',
  });

  const handleSyncOdds = async () => {
    setIsSyncing(true);
    try {
      const res = await fetchLiveESPNOdds();
      setSyncResult(res.syncResult);
    } catch (e) {
      // Fallback
    } finally {
      setTimeout(() => setIsSyncing(false), 400);
    }
  };

  // Active schedule state (dynamically updated with live odds from The Odds API)
  const [currentSchedule, setCurrentSchedule] = useState<NFLMatchupStudy[]>(ALL_TODAYS_NFL_GAMES);
  const [oddsApiInfo, setOddsApiInfo] = useState<{
    matchedCount: number;
    bookmakers: string[];
    timestamp?: string;
  }>({
    matchedCount: 0,
    bookmakers: ['Bet365', 'Pinnacle'],
  });

  const handleOddsApiDataReceived = (oddsApiResponse: TheOddsApiResponse) => {
    if (Array.isArray(oddsApiResponse.data) && oddsApiResponse.data.length > 0) {
      const { mergedSchedule, matchedCount, featuredBookmakers } = mergeTheOddsApiIntoSchedule(
        ALL_TODAYS_NFL_GAMES,
        oddsApiResponse.data
      );
      setCurrentSchedule(mergedSchedule);
      setOddsApiInfo({
        matchedCount,
        bookmakers: featuredBookmakers,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      });
      setSyncResult({
        source: 'BET365_QUANT_ENGINE',
        status: 'online',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        latencyMs: 42,
        gamesCount: matchedCount || 12,
        message: `Sincronizado com The Odds API (${featuredBookmakers.join(', ') || 'Bet365, Pinnacle, DraftKings'})`,
      });
    }
  };

  // Filtered games based on time slot and search
  const filteredGames = useMemo(() => {
    return currentSchedule.filter((game) => {
      const matchesTime = timeFilter === 'all' || game.timeSlot === timeFilter;
      const matchesSearch =
        searchTerm === '' ||
        game.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.homeAbbr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.awayAbbr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.availableProps.some((p) => p.playerName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesTime && matchesSearch;
    });
  }, [currentSchedule, timeFilter, searchTerm]);

  // Active game for deep dive
  const activeGame = useMemo(() => {
    return currentSchedule.find((g) => g.id === selectedGameId) || filteredGames[0] || currentSchedule[0];
  }, [currentSchedule, selectedGameId, filteredGames]);

  // Consolidate all props from all games for the Master +EV Scanner
  const allSlateProps = useMemo(() => {
    const list: {
      game: NFLMatchupStudy;
      prop: NFLGameProp;
      impliedProb: number;
      fairOdds: number;
      evPercent: number;
      isPositiveEV: boolean;
      edge: number;
    }[] = [];

    currentSchedule.forEach((game) => {
      game.availableProps.forEach((prop) => {
        const stats = calculateEVAndEdge(prop.odds, prop.estimatedProb);
        list.push({
          game,
          prop,
          impliedProb: stats.impliedProb,
          fairOdds: stats.fairOdds,
          evPercent: stats.evPercent,
          isPositiveEV: stats.isPositiveEV,
          edge: stats.edge,
        });
      });
    });

    // Sort by EV descending
    return list.sort((a, b) => b.evPercent - a.evPercent);
  }, [currentSchedule]);

  // Filtered props in the scanner
  const filteredScannerProps = useMemo(() => {
    return allSlateProps.filter((item) => {
      const matchesCategory =
        propCategoryFilter === 'all' ||
        (propCategoryFilter === 'td' && item.prop.market.includes('td')) ||
        (propCategoryFilter === 'pass' && item.prop.market.includes('passing')) ||
        (propCategoryFilter === 'rush' && item.prop.market.includes('rushing')) ||
        (propCategoryFilter === 'rec' && (item.prop.market.includes('receiving') || item.prop.market.includes('receptions')));

      const matchesSearch =
        searchTerm === '' ||
        item.prop.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.prop.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.prop.marketLabel.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [allSlateProps, propCategoryFilter, searchTerm]);

  // Roster profiles list
  const allRostersList = useMemo(() => {
    return Object.values(NFL_CURRENT_TEAM_ROSTERS).filter((team) => {
      if (rosterConferenceFilter === 'ALL') return true;
      return team.conference === rosterConferenceFilter;
    });
  }, [rosterConferenceFilter]);

  const activeRosterProfile = useMemo(() => {
    return NFL_CURRENT_TEAM_ROSTERS[selectedRosterTeamId] || NFL_CURRENT_TEAM_ROSTERS.DET;
  }, [selectedRosterTeamId]);

  return (
    <div className="space-y-6">
      {/* Top Banner with API & Odds Sync status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-amber-950/40 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Calendar className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-300">Semana 2 da NFL • Grade Oficial</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {oddsApiInfo.matchedCount > 0
                ? `The Odds API: ${oddsApiInfo.bookmakers.join(', ') || 'Ao Vivo'}`
                : 'Odds Bet365 / The Odds API'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
              16 Jogos • Todos os 32 Elencos
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Grade oficial completa da Semana 2 da NFL (1 jogo no TNF, 10 jogos no domingo às 14:00, 3 jogos às 17:05/17:25, SNF e MNF). Análise com elo quantitativo, lesões da lista oficial de 53 jogadores da ESPN, estatísticas de trincheiras (Pass Rush vs O-Line) e cotações ao vivo com cálculo de Valor Esperado (+EV).
          </p>
        </div>

        {/* Sync Controls & View Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          {/* API Sync Button */}
          <button
            type="button"
            onClick={handleSyncOdds}
            disabled={isSyncing}
            className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            title="Sincronizar com a API Pública da ESPN / Motor Bet365"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Atualizar Odds'}</span>
            <span className="text-[10px] text-slate-500 font-mono-numbers">({syncResult.timestamp})</span>
          </button>

          {/* View Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              id="btn-view-matchups"
              onClick={() => setActiveView('matchups')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeView === 'matchups'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Confrontos (16)
            </button>

            <button
              type="button"
              id="btn-view-rosters"
              onClick={() => setActiveView('rosters')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeView === 'rosters'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Elencos (32)
            </button>

            <button
              type="button"
              id="btn-view-scanner"
              onClick={() => setActiveView('scanner')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeView === 'scanner'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Scanner +EV ({allSlateProps.length})
            </button>

            <button
              type="button"
              id="btn-view-insights"
              onClick={() => setActiveView('insights')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeView === 'insights'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Clima & Trincheiras
            </button>
          </div>
        </div>
      </div>

      {/* The Odds API Multi-Bookmaker Control Bar */}
      <TheOddsApiBar onLiveOddsReceived={handleOddsApiDataReceived} />

      {/* VIEW 1: MATCHUPS & DEEP DIVE */}
      {activeView === 'matchups' && (
        <div className="space-y-6">
          {/* Controls Bar: Time Filter and Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <span className="text-[11px] font-bold text-slate-400 mr-2 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Horário:
              </span>
              <button
                type="button"
                onClick={() => setTimeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  timeFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Todos ({ALL_TODAYS_NFL_GAMES.length})
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('14:00')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  timeFilter === '14:00'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                14:00 (10 Jogos)
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('17:00')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  timeFilter === '17:00'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                17:05 / 17:25 (3 Jogos)
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('primetime')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  timeFilter === 'primetime'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Primetime (3 Jogos)
              </button>
            </div>

            {/* Quick search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar time, jogador ou prop..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Quick Matchup Selector Grid (12 Games Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredGames.map((game) => {
              const isSelected = game.id === activeGame.id;
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => setSelectedGameId(game.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                    <span className="font-bold text-amber-400">{game.kickoffTime.split('•')[0].trim()}</span>
                    <span className="font-mono-numbers px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      {game.spread}
                    </span>
                  </div>

                  <div className="py-1">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                      <span>{game.awayTeam}</span>
                      <span className="text-[10px] text-slate-400 font-mono-numbers">ML {game.moneyline.away.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-extrabold text-white">
                      <span>@ {game.homeTeam}</span>
                      <span className="text-[10px] text-slate-400 font-mono-numbers">ML {game.moneyline.home.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      {game.isDome ? '🏟️ Domo' : game.windMph >= 12 ? '⚠️ Vento' : '☀️ Aberto'}
                    </span>
                    <span className="text-amber-400 font-bold">
                      O/U {game.totalOverUnder}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ACTIVE GAME DEEP DIVE STUDY DOSSIER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
            {/* Matchup Header Bar with Records, Kickoff & Stadium */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {activeGame.week}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {activeGame.kickoffTime}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap">
                  <span>{activeGame.awayTeam}</span>
                  <span className="text-slate-500 font-light">@</span>
                  <span>{activeGame.homeTeam}</span>
                </h3>
                <div className="text-xs text-slate-400 flex items-center gap-3 mt-1.5 flex-wrap">
                  <span>📍 {activeGame.stadium} ({activeGame.city})</span>
                  <span>•</span>
                  <span>
                    {activeGame.isDome ? '🏟️ Estádio Coberto / Domo Climatizado' : `🌤️ ${activeGame.weatherForecast}`}
                  </span>
                </div>
              </div>

              {/* Spread, Over/Under & Bet365 Moneylines */}
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 shrink-0 flex-wrap">
                <div className="text-center px-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Moneyline Bet365</span>
                  <span className="text-xs font-bold text-slate-200 font-mono-numbers">
                    {activeGame.awayAbbr} {activeGame.moneyline.away.toFixed(2)} • {activeGame.homeAbbr} {activeGame.moneyline.home.toFixed(2)}
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center px-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Spread Bet365</span>
                  <span className="text-sm font-extrabold text-amber-400 font-mono-numbers">
                    {activeGame.spread} (1.90)
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center px-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total (O/U)</span>
                  <span className="text-sm font-extrabold text-white font-mono-numbers">
                    {activeGame.totalOverUnder} pts (1.90)
                  </span>
                </div>
              </div>
            </div>

            {/* Official Injury Report Callout */}
            {activeGame.keyInjuries && (
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                activeGame.keyInjuries.includes('DESFALQUE') || activeGame.keyInjuries.includes('Lesionado') || activeGame.keyInjuries.includes('OUT')
                  ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  activeGame.keyInjuries.includes('DESFALQUE') || activeGame.keyInjuries.includes('Lesionado') || activeGame.keyInjuries.includes('OUT')
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`} />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-200 block text-[11px] uppercase tracking-wider">
                    📋 Relatório Oficial de Lesões & Desfalques (Injury Report):
                  </span>
                  <p className="text-[11px] text-slate-300/90 leading-relaxed">
                    {activeGame.keyInjuries}
                  </p>
                </div>
              </div>
            )}

            {/* Active Game Internal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveGameTab('props')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeGameTab === 'props'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Odds Bet365 & Props ({activeGame.availableProps.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveGameTab('rosters')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeGameTab === 'rosters'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Elencos Atuais & Duelo 1x1
              </button>

              <button
                type="button"
                onClick={() => setActiveGameTab('tactics')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeGameTab === 'tactics'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                Trincheiras & Tática
              </button>

              <button
                type="button"
                onClick={() => setActiveGameTab('model')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeGameTab === 'model'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Projeção Quantitativa
              </button>
            </div>

            {/* TAB 1: PLAYER PROPS & MARKET ODDS */}
            {activeGameTab === 'props' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Props de Jogadores com Cotações Bet365 & Valor Esperado (+EV)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Clique em <span className="text-amber-400 font-bold">"Calcular EV"</span> para carregar na calculadora
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeGame.availableProps.map((prop, idx) => {
                    const stats = calculateEVAndEdge(prop.odds, prop.estimatedProb);
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                          stats.isPositiveEV
                            ? 'bg-slate-950/90 border-emerald-500/40 hover:border-emerald-500'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300">
                              {prop.position} • {prop.team}
                            </span>
                            {stats.isPositiveEV ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <Flame className="w-3 h-3 text-emerald-400" />
                                +{stats.evPercent.toFixed(1)}% EV
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                {stats.evPercent.toFixed(1)}% EV
                              </span>
                            )}
                          </div>

                          <h5 className="font-extrabold text-white text-sm">{prop.playerName}</h5>
                          <p className="text-xs text-amber-400 font-bold mt-0.5">{prop.marketLabel}</p>

                          <div className="mt-3 grid grid-cols-3 gap-1 bg-slate-900/80 p-2 rounded-lg text-center font-mono-numbers">
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase">Odd Bet365</span>
                              <span className="text-xs font-bold text-white">{prop.odds.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase">Prob. Real</span>
                              <span className="text-xs font-bold text-emerald-400">{prop.estimatedProb}%</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase">Odd Justa</span>
                              <span className="text-xs font-bold text-amber-400">{stats.fairOdds.toFixed(2)}</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed italic">
                            "{prop.recommendedReason}"
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            onSelectPropToAnalyze({
                              name: `${prop.playerName} (${prop.team})`,
                              eventName: `${activeGame.awayAbbr} @ ${activeGame.homeAbbr} (${activeGame.timeSlot})`,
                              market: prop.market,
                              marketLabel: prop.marketLabel,
                              bookmaker: prop.sportsbook,
                              decimalOdds: prop.odds,
                              americanOdds: prop.americanOdds,
                              estimatedProbability: prop.estimatedProb,
                              stake: 50,
                            })
                          }
                          className="mt-3 w-full py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Calcular EV & Kelly
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: COMPLETE CURRENT ROSTERS & 1-ON-1 DUEL */}
            {activeGameTab === 'rosters' && (
              <div className="space-y-6">
                {/* 1-on-1 Highlight Box */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Duelo Individual Crucial da Partida
                    </h5>
                    <p className="text-sm font-semibold text-white mt-1 leading-relaxed">
                      {activeGame.deepTactical.keyOneOnOne}
                    </p>
                  </div>
                </div>

                {/* Side-by-side Roster Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Away Team Roster */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visitante</span>
                        <h4 className="text-lg font-black text-white">{activeGame.awayRoster.name}</h4>
                        <span className="text-xs text-slate-400">
                          HC: {activeGame.awayRoster.headCoach} • OC: {activeGame.awayRoster.offensiveCoordinator}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 border border-slate-800 text-amber-400">
                        O-Line #{activeGame.awayRoster.offensiveLine.rank}
                      </span>
                    </div>

                    {/* QB Profile */}
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-400 uppercase">Quarterback Titular</span>
                        <span className="text-[10px] text-slate-400 font-mono-numbers">Rating: {activeGame.awayRoster.quarterback.passerRating}</span>
                      </div>
                      <h5 className="font-extrabold text-white text-sm">{activeGame.awayRoster.quarterback.name}</h5>
                      <p className="text-[11px] text-slate-300">{activeGame.awayRoster.quarterback.style}</p>
                      <p className="text-[11px] text-emerald-400 mt-1">✓ {activeGame.awayRoster.quarterback.strengths}</p>
                      <p className="text-[11px] text-rose-400">✗ {activeGame.awayRoster.quarterback.vulnerabilities}</p>
                    </div>

                    {/* Skill Players Depth Chart */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Armas Ofensivas Titulares</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Running Backs</span>
                          <span className="font-bold text-white block">{activeGame.awayRoster.skillPlayers.rbStarter}</span>
                          <span className="text-[10px] text-slate-400">Reserva: {activeGame.awayRoster.skillPlayers.rbBackup}</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Tight End</span>
                          <span className="font-bold text-white block">{activeGame.awayRoster.skillPlayers.te1}</span>
                          <span className="text-[10px] text-slate-400">{activeGame.awayRoster.skillPlayers.te2 || 'Opção secundária'}</span>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-xs">
                        <span className="text-[10px] text-slate-500 block">Corpo de Recebedores (WRs)</span>
                        <span className="font-bold text-amber-400">WR1: {activeGame.awayRoster.skillPlayers.wr1}</span>
                        <span className="text-slate-300 ml-2">WR2: {activeGame.awayRoster.skillPlayers.wr2}</span>
                        <span className="text-slate-400 ml-2">WR3: {activeGame.awayRoster.skillPlayers.wr3}</span>
                      </div>
                    </div>

                    {/* Offensive Line & Defense Unit */}
                    <div className="space-y-2">
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Linha Ofensiva</span>
                          <span className="text-[10px] text-amber-400 font-bold">{activeGame.awayRoster.offensiveLine.passBlockWinRate}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-tight">{activeGame.awayRoster.offensiveLine.assessment}</p>
                      </div>

                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Defesa (Pass Rush #{activeGame.awayRoster.defenseUnit.passRushRank})</span>
                          <span className="text-[10px] text-sky-400">Secundária #{activeGame.awayRoster.defenseUnit.secondaryRank}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium">
                          Destaques: {activeGame.awayRoster.defenseUnit.keyStars.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Home Team Roster */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mandante</span>
                        <h4 className="text-lg font-black text-white">{activeGame.homeRoster.name}</h4>
                        <span className="text-xs text-slate-400">
                          HC: {activeGame.homeRoster.headCoach} • OC: {activeGame.homeRoster.offensiveCoordinator}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 border border-slate-800 text-amber-400">
                        O-Line #{activeGame.homeRoster.offensiveLine.rank}
                      </span>
                    </div>

                    {/* QB Profile */}
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-400 uppercase">Quarterback Titular</span>
                        <span className="text-[10px] text-slate-400 font-mono-numbers">Rating: {activeGame.homeRoster.quarterback.passerRating}</span>
                      </div>
                      <h5 className="font-extrabold text-white text-sm">{activeGame.homeRoster.quarterback.name}</h5>
                      <p className="text-[11px] text-slate-300">{activeGame.homeRoster.quarterback.style}</p>
                      <p className="text-[11px] text-emerald-400 mt-1">✓ {activeGame.homeRoster.quarterback.strengths}</p>
                      <p className="text-[11px] text-rose-400">✗ {activeGame.homeRoster.quarterback.vulnerabilities}</p>
                    </div>

                    {/* Skill Players Depth Chart */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Armas Ofensivas Titulares</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Running Backs</span>
                          <span className="font-bold text-white block">{activeGame.homeRoster.skillPlayers.rbStarter}</span>
                          <span className="text-[10px] text-slate-400">Reserva: {activeGame.homeRoster.skillPlayers.rbBackup}</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Tight End</span>
                          <span className="font-bold text-white block">{activeGame.homeRoster.skillPlayers.te1}</span>
                          <span className="text-[10px] text-slate-400">{activeGame.homeRoster.skillPlayers.te2 || 'Opção secundária'}</span>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-xs">
                        <span className="text-[10px] text-slate-500 block">Corpo de Recebedores (WRs)</span>
                        <span className="font-bold text-amber-400">WR1: {activeGame.homeRoster.skillPlayers.wr1}</span>
                        <span className="text-slate-300 ml-2">WR2: {activeGame.homeRoster.skillPlayers.wr2}</span>
                        <span className="text-slate-400 ml-2">WR3: {activeGame.homeRoster.skillPlayers.wr3}</span>
                      </div>
                    </div>

                    {/* Offensive Line & Defense Unit */}
                    <div className="space-y-2">
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Linha Ofensiva</span>
                          <span className="text-[10px] text-amber-400 font-bold">{activeGame.homeRoster.offensiveLine.passBlockWinRate}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-tight">{activeGame.homeRoster.offensiveLine.assessment}</p>
                      </div>

                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Defesa (Pass Rush #{activeGame.homeRoster.defenseUnit.passRushRank})</span>
                          <span className="text-[10px] text-sky-400">Secundária #{activeGame.homeRoster.defenseUnit.secondaryRank}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium">
                          Destaques: {activeGame.homeRoster.defenseUnit.keyStars.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TACTICAL & TRENCH ADVANTAGE */}
            {activeGameTab === 'tactics' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Batalha das Trincheiras (O-Line vs D-Line)
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeGame.deepTactical.trenchBattle}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Duelo de Quarterbacks e Estilos de Jogo
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeGame.deepTactical.quarterbackDuel}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Projeção de Roteiro de Jogo (Game Script)
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeGame.deepTactical.projectedGameScript}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: QUANTITATIVE MODEL PROJECTION */}
            {activeGameTab === 'model' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Placar Projetado</span>
                    <span className="text-xl font-extrabold text-white font-mono-numbers block mt-1">
                      {activeGame.awayAbbr} {activeGame.modelScore.away} x {activeGame.modelScore.home} {activeGame.homeAbbr}
                    </span>
                    <span className="text-[11px] text-amber-400 font-medium">
                      Spread Calculado: {activeGame.spread}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Probabilidade de Vitória</span>
                    <span className="text-xl font-extrabold text-emerald-400 font-mono-numbers block mt-1">
                      {activeGame.deepTactical.modelConfidence.winnerProbAway}% {activeGame.awayAbbr} • {activeGame.deepTactical.modelConfidence.winnerProbHome}% {activeGame.homeAbbr}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Confiança no Spread: {activeGame.deepTactical.modelConfidence.spreadCoverageProb}%
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Tendência de Pontuação (O/U)</span>
                    <span className="text-xl font-extrabold text-amber-400 font-mono-numbers block mt-1">
                      {activeGame.deepTactical.modelConfidence.overProb}% Over • {activeGame.deepTactical.modelConfidence.underProb}% Under
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Linha de Mercado: {activeGame.totalOverUnder} pontos
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: ROSTERS EXPLORER (24 TEAMS COMPLETE DIRECTORY) */}
      {activeView === 'rosters' && (
        <div className="space-y-6">
          {/* Controls Bar for Rosters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <span className="text-[11px] font-bold text-slate-400 mr-2 uppercase tracking-wider">Conferência:</span>
              <button
                type="button"
                onClick={() => setRosterConferenceFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  rosterConferenceFilter === 'ALL'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Todas (24 Times)
              </button>
              <button
                type="button"
                onClick={() => setRosterConferenceFilter('AFC')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  rosterConferenceFilter === 'AFC'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                AFC (12 Times)
              </button>
              <button
                type="button"
                onClick={() => setRosterConferenceFilter('NFC')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  rosterConferenceFilter === 'NFC'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                NFC (12 Times)
              </button>
            </div>
          </div>

          {/* Quick Team Chips */}
          <div className="flex flex-wrap gap-2">
            {allRostersList.map((team) => {
              const isSelected = team.id === activeRosterProfile.id;
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setSelectedRosterTeamId(team.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {team.id} • {team.name.split(' ').pop()}
                </button>
              );
            })}
          </div>

          {/* Selected Team Complete Profile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  {activeRosterProfile.division} • {activeRosterProfile.conference}
                </span>
                <h3 className="text-2xl font-black text-white">{activeRosterProfile.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Comandado por <strong className="text-slate-200">{activeRosterProfile.headCoach}</strong> (HC) e <strong className="text-slate-200">{activeRosterProfile.offensiveCoordinator}</strong> (OC)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[9px] text-slate-500 uppercase block">Ranking O-Line</span>
                  <span className="text-xs font-bold text-amber-400 font-mono-numbers">#{activeRosterProfile.offensiveLine.rank} da NFL</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[9px] text-slate-500 uppercase block">Pass Rush</span>
                  <span className="text-xs font-bold text-sky-400 font-mono-numbers">#{activeRosterProfile.defenseUnit.passRushRank} da NFL</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[9px] text-slate-500 uppercase block">Secundária</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono-numbers">#{activeRosterProfile.defenseUnit.secondaryRank} da NFL</span>
                </div>
              </div>
            </div>

            {/* In-depth Team Analysis Text */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                Análise Geral do Elenco
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeRosterProfile.teamOverview}
              </p>
            </div>

            {/* Position by Position Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* QB Profile */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Quarterback Titular</span>
                <h4 className="font-extrabold text-white text-base">{activeRosterProfile.quarterback.name}</h4>
                <p className="text-xs text-slate-300">{activeRosterProfile.quarterback.style}</p>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
                  <p className="text-emerald-400 font-medium">✓ {activeRosterProfile.quarterback.strengths}</p>
                  <p className="text-rose-400 font-medium">✗ {activeRosterProfile.quarterback.vulnerabilities}</p>
                </div>
              </div>

              {/* Playmakers Skill Positions */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Armas de Passe e Corrida</span>
                <div className="text-xs space-y-1.5">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Running Backs</span>
                    <span className="font-bold text-white">{activeRosterProfile.skillPlayers.rbStarter}</span>
                    <span className="text-slate-400 text-[11px] ml-2">(Reserva: {activeRosterProfile.skillPlayers.rbBackup})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Recebedores Principais</span>
                    <span className="font-bold text-amber-400">WR1: {activeRosterProfile.skillPlayers.wr1}</span>
                    <p className="text-slate-300 text-[11px]">WR2: {activeRosterProfile.skillPlayers.wr2} • WR3: {activeRosterProfile.skillPlayers.wr3}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Tight End</span>
                    <span className="font-bold text-white">{activeRosterProfile.skillPlayers.te1}</span>
                  </div>
                </div>
              </div>

              {/* Trench & Defense Profile */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Trincheira & Defesa</span>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-slate-400 font-bold block">Linha Ofensiva ({activeRosterProfile.offensiveLine.passBlockWinRate}):</span>
                    <p className="text-[11px] text-slate-300">{activeRosterProfile.offensiveLine.assessment}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Destaques Defensivos:</span>
                    <p className="text-[11px] text-slate-300">{activeRosterProfile.defenseUnit.keyStars.join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Base Oficial ESPN - Elenco Completo de Atletas */}
            {(() => {
              const teamEspnAthletes = getTeamESPNRoster(activeRosterProfile.id);
              const filteredEspnAthletes = teamEspnAthletes.filter((a) => {
                if (espnRosterPosFilter !== 'ALL') {
                  const p = a.position.toUpperCase();
                  if (espnRosterPosFilter === 'QB' && p !== 'QB') return false;
                  if (espnRosterPosFilter === 'RB' && p !== 'RB' && p !== 'FB') return false;
                  if (espnRosterPosFilter === 'WR' && p !== 'WR') return false;
                  if (espnRosterPosFilter === 'TE' && p !== 'TE') return false;
                  if (espnRosterPosFilter === 'OL' && !['OT', 'G', 'C', 'OL', 'OG', 'T'].includes(p)) return false;
                  if (espnRosterPosFilter === 'DEF' && !['DE', 'DT', 'DL', 'LB', 'CB', 'S', 'DB'].includes(p)) return false;
                  if (espnRosterPosFilter === 'ST' && !['K', 'P', 'LS'].includes(p)) return false;
                }
                if (espnRosterSearch.trim()) {
                  const q = espnRosterSearch.toLowerCase();
                  return (
                    a.name.toLowerCase().includes(q) ||
                    a.position.toLowerCase().includes(q) ||
                    (a.jersey && a.jersey.includes(q))
                  );
                }
                return true;
              });

              return (
                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-400" />
                        <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                          Elenco Oficial ESPN • {activeRosterProfile.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
                          {teamEspnAthletes.length} Atletas Sincronizados
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Base autoritativa da ESPN atualizada para 2026. Clique em qualquer atleta para gerar projeção ou prop personalizada.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Buscar atleta (ex: Mendoza)..."
                          value={espnRosterSearch}
                          onChange={(e) => setEspnRosterSearch(e.target.value)}
                          className="pl-8 pr-3 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-52"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Position Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {(['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DEF', 'ST'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setEspnRosterPosFilter(pos)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          espnRosterPosFilter === pos
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {pos === 'ALL' ? 'Todos os Atletas' : pos}
                      </button>
                    ))}
                  </div>

                  {/* Roster Athletes Table/Grid */}
                  <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/60">
                    {filteredEspnAthletes.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        Nenhum atleta encontrado com os filtros selecionados.
                      </div>
                    ) : (
                      filteredEspnAthletes.map((athlete) => {
                        const isHighlight =
                          athlete.name.toLowerCase().includes('mendoza') ||
                          athlete.name.toLowerCase().includes('bowers') ||
                          athlete.name.toLowerCase().includes('jeanty') ||
                          athlete.name.toLowerCase().includes('crosby');

                        return (
                          <div
                            key={athlete.name + (athlete.jersey || '')}
                            className={`flex items-center justify-between px-3.5 py-2 text-xs transition-colors hover:bg-slate-900/80 ${
                              isHighlight ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 font-mono text-slate-400 font-bold text-center">
                                {athlete.jersey ? `#${athlete.jersey}` : '-'}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-xs">
                                    {athlete.name}
                                  </span>
                                  {isHighlight && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      Destaque
                                    </span>
                                  )}
                                  {athlete.injury && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                      {athlete.injury}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {athlete.position} • {athlete.experience !== undefined ? (athlete.experience === 0 ? 'Calouro (Rookie)' : `${athlete.experience} anos exp`) : 'NFL'} • {athlete.status || 'Ativo'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const statType =
                                  athlete.position === 'QB'
                                    ? 'Pass Yards'
                                    : athlete.position === 'RB'
                                    ? 'Rush Yards'
                                    : 'Receiving Yards';
                                const line =
                                  athlete.position === 'QB' ? 224.5 : athlete.position === 'RB' ? 62.5 : 54.5;
                                onSelectPropToAnalyze({
                                  name: `${athlete.name} (${athlete.position} - ${activeRosterProfile.id})`,
                                  market: athlete.position === 'QB' ? 'player_passing_yards' : 'player_receiving_yards',
                                  marketLabel: `Over ${line} ${statType}`,
                                  bookmaker: 'Bet365',
                                  oddsFormat: 'decimal',
                                  decimalOdds: 1.86,
                                  americanOdds: -116,
                                  estimatedProbability: 60,
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-300 border border-slate-700 transition-all"
                            >
                              Analisar Prop
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* VIEW 3: +EV SCANNER */}
      {activeView === 'scanner' && (
        <div className="space-y-4">
          {/* Controls Bar for Scanner */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <span className="text-[11px] font-bold text-slate-400 mr-2 uppercase tracking-wider">Mercado:</span>
              <button
                type="button"
                onClick={() => setPropCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  propCategoryFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Todas as Props ({allSlateProps.length})
              </button>
              <button
                type="button"
                onClick={() => setPropCategoryFilter('rec')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  propCategoryFilter === 'rec'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Recepções & Jardas
              </button>
              <button
                type="button"
                onClick={() => setPropCategoryFilter('rush')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  propCategoryFilter === 'rush'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Corridas
              </button>
              <button
                type="button"
                onClick={() => setPropCategoryFilter('td')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  propCategoryFilter === 'td'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Touchdowns
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por jogador..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Scanner Props Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Jogador / Time</th>
                    <th className="p-3.5">Jogo (Horário)</th>
                    <th className="p-3.5">Mercado</th>
                    <th className="p-3.5 text-center">Odd Bet365</th>
                    <th className="p-3.5 text-center">Prob. Est.</th>
                    <th className="p-3.5 text-center">Odd Justa</th>
                    <th className="p-3.5 text-center">Valor (+EV)</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
                  {filteredScannerProps.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-sans">
                        <div className="font-extrabold text-white">{item.prop.playerName}</div>
                        <div className="text-[10px] text-slate-400">{item.prop.position} • {item.prop.team}</div>
                      </td>
                      <td className="p-3.5 font-sans text-slate-300">
                        {item.game.awayAbbr} @ {item.game.homeAbbr}
                        <span className="text-[10px] text-slate-500 block">{item.game.timeSlot}</span>
                      </td>
                      <td className="p-3.5 font-sans font-bold text-amber-400">
                        {item.prop.marketLabel}
                      </td>
                      <td className="p-3.5 text-center font-bold text-white">
                        {item.prop.odds.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-400">
                        {item.prop.estimatedProb}%
                      </td>
                      <td className="p-3.5 text-center text-slate-300">
                        {item.fairOdds.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-400">
                        +{item.evPercent.toFixed(1)}%
                      </td>
                      <td className="p-3.5 text-right font-sans">
                        <button
                          type="button"
                          onClick={() =>
                            onSelectPropToAnalyze({
                              name: `${item.prop.playerName} (${item.prop.team})`,
                              eventName: `${item.game.awayAbbr} @ ${item.game.homeAbbr}`,
                              market: item.prop.market,
                              marketLabel: item.prop.marketLabel,
                              bookmaker: item.prop.sportsbook,
                              decimalOdds: item.prop.odds,
                              americanOdds: item.prop.americanOdds,
                              estimatedProbability: item.prop.estimatedProb,
                              stake: 50,
                            })
                          }
                          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-all"
                        >
                          Calcular
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: WEATHER & TRENCHES INSIGHTS */}
      {activeView === 'insights' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Wind className="w-4 h-4 text-sky-400" />
              Impacto Climático na Rodada (Abertos vs Domos)
            </h4>
            <div className="space-y-2 text-xs">
              {ALL_TODAYS_NFL_GAMES.map((g) => (
                <div key={g.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{g.awayAbbr} @ {g.homeAbbr}</span>
                    <span className="text-slate-400 text-[11px] block">{g.stadium}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    g.isDome ? 'bg-indigo-500/20 text-indigo-300' : g.windMph >= 12 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {g.isDome ? '🏟️ Domo Fechado' : `${g.tempC}°C • Vento ${g.windMph} mph`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-amber-400" />
              Vantagem nas Trincheiras (O-Line vs D-Line)
            </h4>
            <div className="space-y-2 text-xs">
              {ALL_TODAYS_NFL_GAMES.map((g) => (
                <div key={g.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{g.awayAbbr} @ {g.homeAbbr}</span>
                    <span className="text-slate-400 text-[11px] block">Ritmo: {g.paceTrend}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {g.trenchAdvantage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
