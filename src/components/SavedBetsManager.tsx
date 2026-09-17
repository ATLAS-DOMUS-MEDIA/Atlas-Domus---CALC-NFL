import React from 'react';
import { SavedBetRecord } from '../types';
import { formatCurrencyBRL, formatPercent } from '../utils/betCalculations';
import { Bookmark, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';

interface SavedBetsManagerProps {
  savedBets: SavedBetRecord[];
  onUpdateStatus: (id: string, status: 'pendente' | 'green' | 'red') => void;
  onDeleteBet: (id: string) => void;
  onClearAll: () => void;
}

export const SavedBetsManager: React.FC<SavedBetsManagerProps> = ({
  savedBets,
  onUpdateStatus,
  onDeleteBet,
  onClearAll,
}) => {
  if (savedBets.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl space-y-2">
        <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
        <h4 className="text-sm font-semibold text-slate-300">Nenhuma aposta salva no momento</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Ao analisar um jogador ou franquia da NFL na calculadora principal, clique em "Salvar Aposta" para acompanhar seus resultados de +EV ao longo da rodada.
        </p>
      </div>
    );
  }

  // Summary Metrics
  const totalStaked = savedBets.reduce((acc, b) => acc + b.stake, 0);
  const settledBets = savedBets.filter((b) => b.status !== 'pendente');
  const greenBets = savedBets.filter((b) => b.status === 'green');
  const winRate = settledBets.length > 0 ? (greenBets.length / settledBets.length) * 100 : 0;
  
  // Realized profit
  const realizedProfit = savedBets.reduce((acc, b) => {
    if (b.status === 'green') return acc + b.potentialProfit;
    if (b.status === 'red') return acc - b.stake;
    return acc;
  }, 0);

  const averageEV = savedBets.reduce((acc, b) => acc + b.evPercent, 0) / savedBets.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Header and summary stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-400" />
            Caderno de Apostas de Valor Salvas ({savedBets.length})
          </h3>
          <p className="text-xs text-slate-400">
            Acompanhe o desempenho de longo prazo das suas apostas de valor na NFL
          </p>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-slate-500 hover:text-rose-400 transition-colors self-start sm:self-auto"
        >
          Limpar Todas
        </button>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">
            Total Apostado
          </span>
          <span className="text-sm sm:text-base font-bold font-mono-numbers text-slate-200">
            {formatCurrencyBRL(totalStaked)}
          </span>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">
            Lucro Realizado
          </span>
          <span
            className={`text-sm sm:text-base font-bold font-mono-numbers ${
              realizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {realizedProfit >= 0 ? '+' : ''}
            {formatCurrencyBRL(realizedProfit)}
          </span>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">
            Taxa de Acerto
          </span>
          <span className="text-sm sm:text-base font-bold font-mono-numbers text-amber-400">
            {winRate.toFixed(1)}%
            <span className="text-[10px] font-normal text-slate-500 ml-1">
              ({greenBets.length}/{settledBets.length})
            </span>
          </span>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">
            EV Médio
          </span>
          <span
            className={`text-sm sm:text-base font-bold font-mono-numbers ${
              averageEV >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatPercent(averageEV, 1)}
          </span>
        </div>
      </div>

      {/* Bets list */}
      <div className="divide-y divide-slate-800/80">
        {savedBets.map((bet) => (
          <div
            key={bet.id}
            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-800/20 px-2 rounded-lg transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-100 text-sm">{bet.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-numbers bg-slate-800 text-slate-300 border border-slate-700">
                  Odd: {bet.odds.toFixed(2)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-numbers ${
                    bet.isPositiveEV
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                  }`}
                >
                  EV {formatPercent(bet.evPercent, 1)}
                </span>
                <span className="text-[10px] text-slate-500">{bet.bookmaker}</span>
              </div>

              <div className="text-slate-400 flex items-center gap-3 text-[11px]">
                <span>{bet.marketLabel}</span>
                <span>•</span>
                <span>{bet.eventName}</span>
                <span>•</span>
                <span>
                  Chance: <strong className="text-slate-300 font-mono-numbers">{bet.estimatedProbability}%</strong>
                </span>
                <span>•</span>
                <span>
                  Stake: <strong className="text-slate-300 font-mono-numbers">{formatCurrencyBRL(bet.stake)}</strong>
                </span>
              </div>
            </div>

            {/* Status and actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onUpdateStatus(bet.id, 'pendente')}
                  className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    bet.status === 'pendente'
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Pendente
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(bet.id, 'green')}
                  className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    bet.status === 'green'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-slate-500 hover:text-emerald-400'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Green
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(bet.id, 'red')}
                  className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    bet.status === 'red'
                      ? 'bg-rose-500/20 text-rose-300 font-bold'
                      : 'text-slate-500 hover:text-rose-400'
                  }`}
                >
                  <XCircle className="w-3 h-3" />
                  Red
                </button>
              </div>

              <button
                type="button"
                onClick={() => onDeleteBet(bet.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded hover:bg-slate-800"
                title="Excluir aposta"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
