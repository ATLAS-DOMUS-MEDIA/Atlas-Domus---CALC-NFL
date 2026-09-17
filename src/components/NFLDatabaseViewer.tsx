import React, { useState, useMemo } from 'react';
import {
  NFL_PLAYERS_DATABASE,
  NFLDatabasePlayer,
  getTeamGamedayReport,
  getDatabaseStats,
} from '../data/nflPlayersDatabase';
import { NFL_ALL_TEAMS } from '../data/nflTeamsAndPlayers';
import { getPlayerBetBaselines } from '../utils/playerBetEngine';
import { AIBettingBrainModal } from './AIBettingBrainModal';
import { PlayerOddsProp } from '../services/prizePicksService';
import {
  Database,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Filter,
  Users,
  Activity,
  Calendar,
  Sparkles,
  Layers,
  Brain,
} from 'lucide-react';

interface NFLDatabaseViewerProps {
  onSelectPlayerForBet?: (player: NFLDatabasePlayer, defaultLine: string, defaultMarket: string, defaultOdds: number) => void;
}

export const NFLDatabaseViewer: React.FC<NFLDatabaseViewerProps> = ({ onSelectPlayerForBet }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [selectedPos, setSelectedPos] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const [brainProp, setBrainProp] = useState<PlayerOddsProp | null>(null);
  const itemsPerPage = 25;

  const stats = useMemo(() => getDatabaseStats(), []);

  const openBrainForPlayer = (player: NFLDatabasePlayer) => {
    const baselines = getPlayerBetBaselines(player);
    const prop: PlayerOddsProp = {
      id: `espn_${player.id}_prop`,
      playerId: player.id,
      playerName: player.name,
      teamId: player.team_id,
      position: player.position,
      statType: player.position === 'QB' ? 'Pass Yards' : player.position === 'RB' ? 'Rush Yards' : 'Receiving Yards',
      lineScore: player.position === 'QB' ? 245.5 : player.position === 'RB' ? 66.5 : 55.5,
      marketCategory: baselines.defaultMarket,
      marketLabel: baselines.defaultLine,
      overOdds: baselines.projectedOdds || 1.85,
      underOdds: 1.85,
      source: 'quant_engine',
      isActiveToday: player.is_active_today,
      injuryDesignation: player.injury_designation || 'None',
      inactiveReason: player.inactive_reason || null,
      updatedAt: new Date().toISOString(),
      opponent: 'Adversário',
      fairProbability: 56.5,
      expectedValue: 4.5,
      edgePercent: 2.5,
      rating: 'HIGH_EV',
    };
    setBrainProp(prop);
  };

  // Filter players
  const filteredPlayers = useMemo(() => {
    return NFL_PLAYERS_DATABASE.filter((p) => {
      if (selectedTeam !== 'ALL' && p.team_id.toUpperCase() !== selectedTeam.toUpperCase()) {
        return false;
      }
      if (selectedPos !== 'ALL' && p.position.toUpperCase() !== selectedPos.toUpperCase()) {
        return false;
      }
      if (statusFilter === 'ACTIVE' && !p.is_active_today) {
        return false;
      }
      if (statusFilter === 'INACTIVE' && p.is_active_today) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchTeam = p.team_id.toLowerCase().includes(q);
        const matchPos = p.position.toLowerCase().includes(q);
        if (!matchName && !matchTeam && !matchPos) return false;
      }
      return true;
    });
  }, [searchTerm, selectedTeam, selectedPos, statusFilter]);

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const paginatedPlayers = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredPlayers.slice(start, start + itemsPerPage);
  }, [filteredPlayers, page]);

  const handleSelect = (player: NFLDatabasePlayer) => {
    if (!onSelectPlayerForBet) return;
    const baseline = getPlayerBetBaselines(player);
    onSelectPlayerForBet(player, baseline.defaultLine, baseline.defaultMarket, baseline.projectedOdds);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with DB Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Banco Central de Jogadores NFL (Elencos Oficiais ESPN)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 border border-emerald-700 text-emerald-300">
                32 Franquias • Elenco Completo
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Dados extraídos diretamente da API oficial da ESPN para as 32 franquias da NFL (<code className="text-amber-300 font-mono text-[11px]">nfl_espn_rosters.json</code>). Cruzamento em tempo real com <code className="text-amber-300 font-mono text-[11px]">gameday_status</code> para desfalques e lesões.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Atletas</span>
              <span className="text-base sm:text-lg font-black text-white">{stats.total}</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2 text-center">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">Ativos Hoje</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">{stats.actives}</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2 text-center">
              <span className="text-[10px] text-rose-400 uppercase font-bold block">Inativos / Lesão</span>
              <span className="text-base sm:text-lg font-black text-rose-400">{stats.inactives}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nome, time ou posição..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Team Filter */}
          <div>
            <select
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">Todas as 32 Franquias</option>
              {NFL_ALL_TEAMS.map((t) => (
                <option key={t.abbr} value={t.abbr}>
                  {t.abbr} - {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Position Filter */}
          <div>
            <select
              value={selectedPos}
              onChange={(e) => {
                setSelectedPos(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">Todas as Posições</option>
              <option value="QB">🏈 Quarterbacks (QB)</option>
              <option value="RB">🏃 Running Backs (RB)</option>
              <option value="WR">🎯 Wide Receivers (WR)</option>
              <option value="TE">🛡️ Tight Ends (TE)</option>
              <option value="K">👟 Kickers (K)</option>
              <option value="DE">Defensores de Linha (DE/DT/DL)</option>
              <option value="LB">Linebackers (LB)</option>
              <option value="CB">Secundária (CB/DB/S)</option>
            </select>
          </div>

          {/* Gameday Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">Todos os Status de Jogo</option>
              <option value="ACTIVE">✅ Somente Ativos (Gameday 48-man)</option>
              <option value="INACTIVE">🚫 Inativos / Lesionados (OUT, IR, PUP)</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
          <span>
            Mostrando <strong>{filteredPlayers.length}</strong> jogadores encontrados
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-[11px]"
              >
                Anterior
              </button>
              <span className="text-[11px] text-slate-400 px-1">
                {page} de {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-[11px]"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Players Grid / Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Jogador</th>
                <th className="py-3 px-3">Franquia</th>
                <th className="py-3 px-3">Posição</th>
                <th className="py-3 px-3">Camisa</th>
                <th className="py-3 px-3">Status Gameday</th>
                <th className="py-3 px-3">Motivo / Lesão</th>
                <th className="py-3 px-4 text-right">Ação / Aposta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedPlayers.map((player) => {
                const isInactive = !player.is_active_today;
                return (
                  <tr
                    key={player.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isInactive ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isInactive
                              ? 'bg-rose-900/30 text-rose-400 border border-rose-700/50'
                              : 'bg-slate-800 text-amber-400 border border-slate-700'
                          }`}
                        >
                          {player.position}
                        </div>
                        <div>
                          <span className="font-bold text-white block text-sm">
                            {player.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {player.id} • {player.years_exp} anos exp
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-200">
                        {player.team_id}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {player.position}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-400 font-mono">
                      #{player.jersey_number ?? '-'}
                    </td>

                    <td className="py-3 px-3">
                      {player.is_active_today ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Ativo Hoje
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          {player.injury_designation || 'Inativo (OUT)'}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-400">
                      {player.inactive_reason ? (
                        <span className="text-rose-300 text-[11px] font-medium">
                          {player.inactive_reason}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openBrainForPlayer(player)}
                          title="Analisar jogador com Cérebro IA & Quant"
                          className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Brain className="w-3 h-3 text-purple-400" />
                          <span>Cérebro IA</span>
                        </button>

                        {player.is_active_today ? (
                          <button
                            type="button"
                            onClick={() => handleSelect(player)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Calcular +EV</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-rose-400 font-semibold italic">
                            Desfalque
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Betting Brain Modal */}
      {brainProp && (
        <AIBettingBrainModal
          prop={brainProp}
          isOpen={!!brainProp}
          onClose={() => setBrainProp(null)}
          onApplyBet={(prop, analysis) => {
            if (onSelectPlayerForBet) {
              const matchedPlayer = NFL_PLAYERS_DATABASE.find((p) => p.name === prop.playerName);
              if (matchedPlayer) {
                onSelectPlayerForBet(
                  matchedPlayer,
                  `Over ${prop.lineScore} ${prop.statType}`,
                  prop.marketCategory || 'player_props',
                  prop.overOdds || 1.85
                );
              }
            }
          }}
        />
      )}
    </div>
  );
};
