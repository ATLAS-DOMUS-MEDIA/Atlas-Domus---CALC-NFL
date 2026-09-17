import React, { useState, useEffect, useMemo } from 'react';
import { Top10AIOpportunity, NFLBetInput, SavedBetRecord } from '../types';
import { fetchTop10Opportunities, Top10ApiResponse } from '../services/aiTop10Service';
import { decimalToAmerican } from '../utils/betCalculations';
import {
  Sparkles,
  Flame,
  Trophy,
  TrendingUp,
  Target,
  ShieldCheck,
  Layers,
  Calculator,
  Bookmark,
  Copy,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Calendar,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Zap,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Top10AIOpportunitiesProps {
  onSelectPropToAnalyze: (data: Partial<NFLBetInput>) => void;
  onSaveBet: (customBet?: any) => void;
  onNavigateToParlay?: () => void;
}

export const Top10AIOpportunities: React.FC<Top10AIOpportunitiesProps> = ({
  onSelectPropToAnalyze,
  onSaveBet,
  onNavigateToParlay,
}) => {
  const [data, setData] = useState<Top10ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'player_props' | 'game_lines' | 'touchdowns'>('all');
  const [sortBy, setSortBy] = useState<'ev' | 'edge' | 'confidence' | 'prob'>('ev');
  const [customFocus, setCustomFocus] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadOpportunities = async (focusText?: string) => {
    setLoading(true);
    try {
      const response = await fetchTop10Opportunities({
        categoryFilter,
        customFocus: focusText !== undefined ? focusText : customFocus,
      });
      setData(response);
    } catch (e) {
      console.error('Falha ao carregar oportunidades:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, [categoryFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOpportunities(customFocus);
  };

  const handleCopyAnalysis = (item: Top10AIOpportunity) => {
    const text = `🏈 NFL Pick IA #${item.rank}: ${item.playerName} (${item.team} vs ${item.opponent})
🎯 Mercado: ${item.marketLabel} @ ${item.bookOdds} (${item.bookmaker})
📊 Probabilidade Justa: ${item.fairProb}% | Odd Justa: @${item.fairOdds}
🔥 Valor Esperado (+EV): +${item.expectedValue}% | Borda: +${item.edgePercent}%
🧠 Análise Tática IA: ${item.tacticalAdvantage}
Estádio: ${item.stadium} • Horário: ${item.gameTime}`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendToCalculator = (item: Top10AIOpportunity) => {
    onSelectPropToAnalyze({
      name: `${item.playerName} (${item.position} - ${item.team})`,
      eventName: item.matchup,
      market: item.marketType,
      marketLabel: item.marketLabel,
      bookmaker: item.bookmaker,
      decimalOdds: item.bookOdds,
      americanOdds: item.americanOdds || decimalToAmerican(item.bookOdds),
      estimatedProbability: item.fairProb,
      stake: 50,
    });
  };

  const handleSaveDirectly = (item: Top10AIOpportunity) => {
    const newBet: SavedBetRecord = {
      id: Date.now().toString(),
      createdAt: new Date().toLocaleDateString('pt-BR'),
      name: `${item.playerName} (${item.position})`,
      eventName: item.matchup,
      marketLabel: item.marketLabel,
      bookmaker: item.bookmaker,
      odds: item.bookOdds,
      americanOdds: item.americanOdds || decimalToAmerican(item.bookOdds),
      estimatedProbability: item.fairProb,
      impliedProbability: item.impliedProb,
      fairOdds: item.fairOdds,
      evPercent: item.expectedValue,
      isPositiveEV: item.expectedValue > 0,
      stake: 50,
      potentialProfit: Number((50 * (item.bookOdds - 1)).toFixed(2)),
      status: 'pendente',
    };

    onSaveBet(newBet);
    setSavedId(item.id);
    setTimeout(() => setSavedId(null), 2500);
  };

  // Ordenação
  const sortedOpportunities = useMemo(() => {
    if (!data?.opportunities) return [];
    const list = [...data.opportunities];
    if (sortBy === 'ev') {
      return list.sort((a, b) => b.expectedValue - a.expectedValue);
    }
    if (sortBy === 'edge') {
      return list.sort((a, b) => b.edgePercent - a.edgePercent);
    }
    if (sortBy === 'confidence') {
      return list.sort((a, b) => b.confidenceScore - a.confidenceScore);
    }
    if (sortBy === 'prob') {
      return list.sort((a, b) => b.fairProb - a.fairProb);
    }
    return list;
  }, [data, sortBy]);

  // Estatísticas do Top 10
  const stats = useMemo(() => {
    if (!sortedOpportunities.length) return null;
    const avgEV = sortedOpportunities.reduce((acc, o) => acc + o.expectedValue, 0) / sortedOpportunities.length;
    const avgEdge = sortedOpportunities.reduce((acc, o) => acc + o.edgePercent, 0) / sortedOpportunities.length;
    const topPick = sortedOpportunities[0];
    const top3Picks = sortedOpportunities.slice(0, 3);
    const parlayOdds = top3Picks.reduce((acc, o) => acc * o.bookOdds, 1);
    return {
      avgEV: avgEV.toFixed(1),
      avgEdge: avgEdge.toFixed(1),
      topPick,
      top3Picks,
      parlayOdds: parlayOdds.toFixed(2),
    };
  }, [sortedOpportunities]);

  return (
    <div className="space-y-6">
      {/* Header Banner com IA Engine */}
      <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-6 backdrop-blur relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1.5 shadow-sm">
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                Semana 2 da NFL • Top 10 Picks
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                {data?.source === 'gemini_ai_quant' ? 'IA Gemini + Quant' : 'Motor Bayesiano Quantitativo (+EV)'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 hidden sm:flex">
                <ShieldCheck className="w-3 h-3" />
                Elencos ESPN Verificados
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              As 10 Melhores Oportunidades da Semana 2 da NFL
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
              Descobertas pelo cruzamento contínuo de odds da rodada (Bet365, DraftKings, Pinnacle),
              projeção matemática bayesiana, relatórios oficiais de lesões da ESPN e análise tática por inteligência artificial.
            </p>
          </div>

          {/* Botão de Atualização com IA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="refresh-ai-top10-btn"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing || loading ? 'animate-spin' : ''}`} />
              {refreshing || loading ? 'Escanear com IA...' : 'Descobrir com IA'}
            </button>
          </div>
        </div>

        {/* Campo de Busca / Foco Personalizado para a IA */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              id="ai-focus-prompt-input"
              value={customFocus}
              onChange={(e) => setCustomFocus(e.target.value)}
              placeholder="Ex: Foco em Wide Receivers jogando em domos, ou Touchdowns de RBs favoritos..."
              className="w-full px-3.5 py-2 pl-9 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRefresh();
              }}
            />
            <Sparkles className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-2.5" />
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            Filtrar com IA
          </button>
        </div>
      </div>

      {/* Resumo Executivo e Métricas Globais */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              +EV Médio do Top 10
            </span>
            <div className="text-xl font-black text-emerald-400 mt-1 font-mono-numbers">
              +{stats.avgEV}%
            </div>
            <span className="text-[10px] text-slate-500">Expectativa matemática favorável</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Borda Média s/ a Casa
            </span>
            <div className="text-xl font-black text-amber-400 mt-1 font-mono-numbers">
              +{stats.avgEdge}%
            </div>
            <span className="text-[10px] text-slate-500">Diferencial sobre prob. implícita</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              Melhor Oportunidade (#1)
            </span>
            <div className="text-sm font-bold text-white mt-1 truncate">
              {stats.topPick.playerName}
            </div>
            <span className="text-[10px] text-emerald-400 font-bold font-mono-numbers">
              +EV {stats.topPick.expectedValue}% @ {stats.topPick.bookOdds}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Trinca Top 3 (+EV)
            </span>
            <div className="text-xl font-black text-indigo-400 mt-1 font-mono-numbers">
              @{stats.parlayOdds}
            </div>
            <button
              type="button"
              onClick={onNavigateToParlay}
              className="text-[10px] text-indigo-300 hover:text-indigo-200 underline font-medium flex items-center gap-0.5 mt-0.5"
            >
              Simular Parlay <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* Controles de Filtros e Ordenação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
        {/* Filtro de Categoria */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              categoryFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            Todas as 10
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('player_props')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              categoryFilter === 'player_props'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            Player Props (Jardas & Recepções)
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('touchdowns')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              categoryFilter === 'touchdowns'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            Touchdowns (Anytime TD)
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('game_lines')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              categoryFilter === 'game_lines'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            Linhas de Jogo (Spread / Totais)
          </button>
        </div>

        {/* Ordenação */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            Ordenar por:
          </span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="ev">Maior +EV (Valor Esperado)</option>
            <option value="edge">Maior Borda vs Casa (%)</option>
            <option value="confidence">Maior Confiança IA</option>
            <option value="prob">Maior Probabilidade Real</option>
          </select>
        </div>
      </div>

      {/* Lista das 10 Oportunidades */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-base font-bold text-white">IA analisando os confrontos de hoje...</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Cruzando dados dos 32 elencos da ESPN, condições meteorológicas dos estádios e linhas ao vivo de casas de apostas.
          </p>
        </div>
      ) : sortedOpportunities.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Info className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhuma oportunidade para o filtro selecionado</h3>
          <p className="text-xs text-slate-400">
            Tente alternar para "Todas as 10" ou redefinir a busca personalizada.
          </p>
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Ver Todas
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {sortedOpportunities.map((item, index) => {
            const isTop3 = index < 3;
            const rankBadgeColor =
              index === 0
                ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-400/40'
                : index === 1
                ? 'bg-slate-300 text-slate-950 font-black ring-2 ring-slate-300/40'
                : index === 2
                ? 'bg-amber-700 text-amber-100 font-black ring-2 ring-amber-700/40'
                : 'bg-slate-800 text-slate-300 font-bold';

            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                id={`ai-opportunity-card-${item.id}`}
                className={`bg-slate-900/80 border rounded-2xl transition-all duration-200 hover:border-slate-700 p-4 sm:p-5 ${
                  isTop3
                    ? 'border-amber-500/30 shadow-lg shadow-amber-500/5 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/10'
                    : 'border-slate-800'
                }`}
              >
                {/* Linha Superior: Rank, Jogador, Confronto e Badges */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Rank Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-sm ${rankBadgeColor}`}
                    >
                      #{index + 1}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                          {item.playerName}
                        </h3>
                        {item.position !== 'TEAM' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                            {item.position} • {item.team}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-medium">
                          {item.matchup}
                        </span>
                        {item.isDome && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Domo Fechado
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Hoje às {item.gameTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {item.stadium}
                        </span>
                        {item.hitRateRecent && (
                          <span className="text-amber-400/90 font-medium">
                            ★ {item.hitRateRecent}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mercado, Odd e +EV */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                    <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Mercado
                        </span>
                        <span className="text-xs font-bold text-amber-400">
                          {item.marketLabel}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-800" />
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          {item.bookmaker}
                        </span>
                        <span className="text-xs font-black text-white font-mono-numbers">
                          @{item.bookOdds}
                        </span>
                      </div>
                    </div>

                    <div className="bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-xl text-center">
                      <span className="text-[10px] text-emerald-400/80 uppercase font-bold block">
                        Valor Esperado
                      </span>
                      <span className="text-sm font-black text-emerald-400 font-mono-numbers">
                        +{item.expectedValue}%
                      </span>
                    </div>

                    <div className="bg-purple-950/40 border border-purple-800/60 px-2.5 py-1.5 rounded-xl text-center hidden sm:block">
                      <span className="text-[10px] text-purple-300/80 uppercase font-bold block">
                        Confiança IA
                      </span>
                      <span className="text-xs font-black text-purple-300 font-mono-numbers">
                        {item.confidenceScore}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barra de Probabilidade e Edge Comparativa */}
                <div className="mt-3.5 pt-3 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-8 space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-400">
                      <span>
                        Probabilidade Justa da IA:{' '}
                        <strong className="text-emerald-400 font-mono-numbers">{item.fairProb}%</strong> (Odd Justa:{' '}
                        <span className="font-mono-numbers">@{item.fairOdds}</span>)
                      </span>
                      <span>
                        Implícita da Casa:{' '}
                        <span className="font-mono-numbers text-slate-300">{item.impliedProb}%</span> | Borda:{' '}
                        <strong className="text-amber-400 font-mono-numbers">+{item.edgePercent}%</strong>
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                      <div
                        className="bg-amber-500/60 h-full transition-all"
                        style={{ width: `${Math.min(100, item.impliedProb)}%` }}
                        title={`Implícita: ${item.impliedProb}%`}
                      />
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, item.edgePercent))}%` }}
                        title={`Borda +EV: +${item.edgePercent}%`}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-4 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSendToCalculator(item)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Abrir aposta na calculadora para simular gestão de banca"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      Calculadora (+EV)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveDirectly(item)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                        savedId === item.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Salvar no rastreador de apostas"
                    >
                      {savedId === item.id ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyAnalysis(item)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                        copiedId === item.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Copiar texto da análise tática"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs transition-colors"
                      title={isExpanded ? 'Recolher detalhes' : 'Ver justificativa tática completa'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Justificativa Tática da IA (Expandida ou Destaque) */}
                <div className="mt-3 bg-slate-950/60 rounded-xl p-3 border border-slate-800/70 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-slate-300 leading-relaxed font-normal">
                      <strong className="text-amber-300 font-semibold">Análise Tática da IA: </strong>
                      {item.tacticalAdvantage}
                    </p>
                  </div>

                  {/* Detalhes extras se expandido */}
                  {isExpanded && item.keyReasons && item.keyReasons.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5 mt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Pilares Quantitativos & Matchup:
                      </span>
                      {item.keyReasons.map((reason, rIdx) => (
                        <div key={rIdx} className="flex items-start gap-1.5 text-slate-400 text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </div>
                      ))}
                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono-numbers">
                        <span>Status de Elenco: {item.injuryStatus}</span>
                        <span>Gestão Fracionária (Kelly): {item.kellyPercent}% da banca</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cartão de Bilhete Recomendado para Parlay */}
      {stats && stats.top3Picks.length >= 3 && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Bilhete Recomendado pela IA (Trinca de Ouro +EV)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Alta Correlação
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Combinação dos 3 picks com maior valor esperado da rodada:
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {stats.top3Picks.map((pick, pIdx) => (
                  <span
                    key={pIdx}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200"
                  >
                    #{pIdx + 1} {pick.playerName}: <strong className="text-amber-400">{pick.marketLabel}</strong> (@{pick.bookOdds})
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Odd Combinada
                </span>
                <span className="text-2xl font-black text-indigo-400 font-mono-numbers">
                  @{stats.parlayOdds}
                </span>
              </div>
              <button
                type="button"
                onClick={onNavigateToParlay}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                Abrir na Calculadora Parlay
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
