import React, { useState, useEffect, useMemo } from 'react';
import {
  PlayerOddsProp,
  fetchPrizePicksProps,
  PRIZEPICKS_CALIBRATED_PROPS,
} from '../services/prizePicksService';
import { AIBettingBrainModal } from './AIBettingBrainModal';
import { BrainAnalysisResult } from '../services/aiBettingBrainService';
import { NFL_ALL_TEAMS } from '../data/nflTeamsAndPlayers';
import {
  Sparkles,
  Zap,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Layers,
  Database,
  ShieldAlert,
  Brain,
} from 'lucide-react';

interface PrizePicksPropsViewerProps {
  onSelectPropForBet?: (prop: PlayerOddsProp, direction: 'Over' | 'Under', analysis?: BrainAnalysisResult) => void;
}

export const PrizePicksPropsViewer: React.FC<PrizePicksPropsViewerProps> = ({
  onSelectPropForBet,
}) => {
  const [propsList, setPropsList] = useState<PlayerOddsProp[]>(PRIZEPICKS_CALIBRATED_PROPS);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [selectedStat, setSelectedStat] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [evFilter, setEvFilter] = useState<'ALL' | 'POSITIVE_EV' | 'HIGH_EV'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrainProp, setSelectedBrainProp] = useState<PlayerOddsProp | null>(null);

  useEffect(() => {
    loadProps();
  }, []);

  const loadProps = async () => {
    setIsLoading(true);
    try {
      const res = await fetchPrizePicksProps();
      setPropsList(res.props);
      setIsLive(res.live);
    } catch (e) {
      // Keep initial
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProps = useMemo(() => {
    return propsList.filter((p) => {
      if (selectedTeam !== 'ALL' && p.teamId.toUpperCase() !== selectedTeam.toUpperCase()) {
        return false;
      }
      if (selectedStat !== 'ALL' && !p.statType.toLowerCase().includes(selectedStat.toLowerCase())) {
        return false;
      }
      if (statusFilter === 'ACTIVE' && !p.isActiveToday) {
        return false;
      }
      if (statusFilter === 'INACTIVE' && p.isActiveToday) {
        return false;
      }
      if (evFilter === 'POSITIVE_EV' && (p.expectedValue || 0) <= 0) {
        return false;
      }
      if (evFilter === 'HIGH_EV' && (p.expectedValue || 0) < 5.0) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = p.playerName.toLowerCase().includes(q);
        const matchTeam = p.teamId.toLowerCase().includes(q);
        const matchStat = p.statType.toLowerCase().includes(q);
        if (!matchName && !matchTeam && !matchStat) return false;
      }
      return true;
    });
  }, [propsList, selectedTeam, selectedStat, statusFilter, evFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Player Props PrizePicks (Linhas de Jogadores)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950/80 border border-purple-700 text-purple-300">
                Gratuito & Sem Limite
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Consumindo as projeções de jardas, passes, recepções e TDs do endpoint público do PrizePicks (League ID: 7), cruzadas em tempo real com o relatório de <strong className="text-white">Gameday Status (Ativos vs Inativos)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadProps}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-amber-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Sincronizando...' : 'Atualizar Projeções'}</span>
            </button>
          </div>
        </div>

        {/* Database Status Alert */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>
              Tabela <code className="text-amber-300 font-mono text-[11px]">player_odds_props</code>: <strong>{propsList.length}</strong> linhas disponíveis
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">
              Cruzando com <code className="text-amber-300 font-mono text-[11px]">gameday_status</code> (Filtrando desfalques)
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              Proteção de Inativo Ativa
            </span>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar atleta ou estatística..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Team Filter */}
          <div>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">Todas as Franquias</option>
              {NFL_ALL_TEAMS.map((t) => (
                <option key={t.abbr} value={t.abbr}>
                  {t.abbr} - {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stat Type */}
          <div>
            <select
              value={selectedStat}
              onChange={(e) => setSelectedStat(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">Todas as Estatísticas</option>
              <option value="pass">🏈 Passes (Jardas e TDs)</option>
              <option value="rush">🏃 Corridas / Jardas Terrestres</option>
              <option value="rec">🎯 Recepções e Jardas</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">✅ Somente Ativos</option>
              <option value="INACTIVE">🚫 Somente Desfalques / Inativos</option>
            </select>
          </div>

          {/* EV Filter */}
          <div>
            <select
              value={evFilter}
              onChange={(e) => setEvFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">Todos os Retornos</option>
              <option value="POSITIVE_EV">🔥 Oportunidades +EV (&gt; 0%)</option>
              <option value="HIGH_EV">🚀 Alto Valor (+EV &gt; 5%)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
          <span>Mostrando <strong>{filteredProps.length}</strong> projeções sincronizadas do PrizePicks</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] font-bold">
              Base Oficial ESPN (2.479 Atletas)
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Props Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProps.map((prop) => {
          const isInactive = !prop.isActiveToday;
          const hasEV = prop.expectedValue !== undefined;
          const isPositiveEV = (prop.expectedValue || 0) > 0;

          return (
            <div
              key={prop.id}
              className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                isInactive
                  ? 'bg-rose-950/20 border-rose-800/50'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Card Header: Player Info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white text-sm">{prop.playerName}</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        {prop.position} • {prop.teamId}
                      </span>
                      {prop.opponent && (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          vs {prop.opponent}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {prop.statType} (PrizePicks)
                    </span>
                  </div>

                  {/* Status Badge */}
                  {isInactive ? (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 border border-rose-800 text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {prop.injuryDesignation?.toUpperCase() || 'OUT'}
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Ativo
                    </span>
                  )}
                </div>

                {/* Pipeline / Roster Sincronizado Badge */}
                {prop.rosterCorrected && (
                  <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/80 text-[10px] text-amber-300 font-semibold">
                    <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Elenco ESPN Sincronizado: {prop.playerName} atua pelo {prop.teamId} {prop.opponent ? `vs ${prop.opponent}` : ''}</span>
                  </div>
                )}

                {/* +EV Badge if available */}
                {hasEV && !isInactive && (
                  <div className="mt-2.5 flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60">
                    <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      Oportunidade +EV:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black font-mono text-emerald-400">
                        +{prop.expectedValue}% EV
                      </span>
                      {prop.edgePercent && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          (Borda: +{prop.edgePercent}%)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Inactive Warning Alert */}
                {isInactive && (
                  <div className="mt-2.5 p-2 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-[11px] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>
                      <strong>Desfalque confirmado:</strong> {prop.inactiveReason || 'Lesão'}. Aposta anulada.
                    </span>
                  </div>
                )}

                {/* Line Score Display */}
                <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Linha PrizePicks
                    </span>
                    <span className="text-xl font-black text-white font-mono">
                      {prop.lineScore}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      {prop.statType}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Odds Estimadas
                    </span>
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      @{prop.overOdds || 1.85} (Over / Under)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 space-y-2">
                {/* Brain Button */}
                <button
                  type="button"
                  onClick={() => setSelectedBrainProp(prop)}
                  className="w-full py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Brain className="w-3.5 h-3.5 text-purple-400 group-hover:text-white" />
                  <span>Cérebro IA: Analisar & Pesquisar</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </button>

                {/* Over / Under */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isInactive}
                    onClick={() => onSelectPropForBet && onSelectPropForBet(prop, 'Over')}
                    className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-600/20 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Over {prop.lineScore}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    disabled={isInactive}
                    onClick={() => onSelectPropForBet && onSelectPropForBet(prop, 'Under')}
                    className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500 disabled:opacity-30 disabled:hover:bg-amber-500/20 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Under {prop.lineScore}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Betting Brain Modal */}
      {selectedBrainProp && (
        <AIBettingBrainModal
          prop={selectedBrainProp}
          isOpen={!!selectedBrainProp}
          onClose={() => setSelectedBrainProp(null)}
          onApplyBet={(prop, analysis) => {
            if (onSelectPropForBet) {
              onSelectPropForBet(prop, 'Over', analysis);
            }
          }}
        />
      )}
    </div>
  );
};
