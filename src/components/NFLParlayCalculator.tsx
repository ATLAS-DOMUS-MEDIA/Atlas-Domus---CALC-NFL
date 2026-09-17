import React, { useState } from 'react';
import { MultiLeg } from '../types';
import { Plus, Trash2, Layers, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { formatCurrencyBRL, formatPercent } from '../utils/betCalculations';

export const NFLParlayCalculator: React.FC = () => {
  const [legs, setLegs] = useState<MultiLeg[]>([
    {
      id: '1',
      title: 'Patrick Mahomes Over 250+ Jardas de Passe',
      target: 'QB - Chiefs',
      odds: 1.65,
      estimatedProbability: 65,
    },
    {
      id: '2',
      title: 'Travis Kelce Qualquer Momento TD',
      target: 'TE - Chiefs',
      odds: 2.10,
      estimatedProbability: 52,
    },
    {
      id: '3',
      title: 'KC Chiefs Vitória (Moneyline)',
      target: 'KC Chiefs',
      odds: 1.55,
      estimatedProbability: 70,
    },
  ]);

  const [parlayStake, setParlayStake] = useState<number>(30);

  const addLeg = () => {
    const newId = Date.now().toString();
    setLegs([
      ...legs,
      {
        id: newId,
        title: 'Nova Seleção NFL (Player Prop / Jogo)',
        target: 'Jogador ou Time',
        odds: 1.85,
        estimatedProbability: 55,
      },
    ]);
  };

  const removeLeg = (id: string) => {
    if (legs.length <= 1) return;
    setLegs(legs.filter((l) => l.id !== id));
  };

  const updateLeg = (id: string, field: keyof MultiLeg, value: string | number) => {
    setLegs(
      legs.map((l) => {
        if (l.id === id) {
          return { ...l, [field]: value };
        }
        return l;
      })
    );
  };

  // Calculations:
  // Sportsbook parlay odds: product of individual odds (without factoring correlation)
  const combinedBookmakerOdds = legs.reduce((acc, leg) => acc * Math.max(1.01, leg.odds), 1);
  
  // Real joint probability assuming independent approximation (p1 * p2 * p3)
  const combinedRealProbDecimal = legs.reduce(
    (acc, leg) => acc * (Math.min(99, Math.max(1, leg.estimatedProbability)) / 100),
    1
  );
  const combinedRealProbPercent = combinedRealProbDecimal * 100;
  
  // Fair parlay odds
  const fairParlayOdds = combinedRealProbDecimal > 0 ? 1 / combinedRealProbDecimal : 0;
  
  // Parlay EV
  const parlayEV = (combinedRealProbDecimal * combinedBookmakerOdds - 1) * 100;
  const potentialProfit = parlayStake * (combinedBookmakerOdds - 1);
  const isPositiveEV = parlayEV > 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base">
              Calculadora de Múltipla / Same Game Parlay NFL
            </h3>
            <p className="text-xs text-slate-400">
              Descubra se a sua combinada da NFL tem valor real (+EV) ou se a margem da casa destrói sua chance
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={addLeg}
          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar Seleção
        </button>
      </div>

      {/* Legs list */}
      <div className="space-y-2.5">
        {legs.map((leg, index) => {
          const legImplied = (1 / Math.max(1.01, leg.odds)) * 100;
          const legEdge = leg.estimatedProbability - legImplied;

          return (
            <div
              key={leg.id}
              className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0 font-mono-numbers">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={leg.title}
                    onChange={(e) => updateLeg(leg.id, 'title', e.target.value)}
                    placeholder="Ex: Mahomes 250+ yds ou Derrick Henry TD"
                    className="w-full bg-transparent font-semibold text-slate-200 focus:outline-none focus:border-b border-purple-500 text-xs"
                  />
                  <input
                    type="text"
                    value={leg.target}
                    onChange={(e) => updateLeg(leg.id, 'target', e.target.value)}
                    placeholder="Posição / Time"
                    className="w-full bg-transparent text-slate-500 text-[11px] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto">
                <div>
                  <label className="text-[10px] text-slate-400 block">Odd Paga</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={leg.odds}
                    onChange={(e) => updateLeg(leg.id, 'odds', parseFloat(e.target.value) || 1.01)}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono-numbers text-white font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block">Chance Real</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="99"
                      value={leg.estimatedProbability}
                      onChange={(e) =>
                        updateLeg(leg.id, 'estimatedProbability', parseFloat(e.target.value) || 50)
                      }
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono-numbers text-amber-400 font-bold text-xs"
                    />
                    <span className="text-slate-500 ml-1">%</span>
                  </div>
                </div>

                <div className="hidden sm:block min-w-[4rem] text-right">
                  <span className="text-[10px] text-slate-500 block">Edge</span>
                  <span
                    className={`font-mono-numbers font-semibold text-xs ${
                      legEdge >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatPercent(legEdge, 1)}
                  </span>
                </div>

                {legs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLeg(leg.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Parlay Outcome Summary */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Odd Total da Casa</span>
            <span className="text-lg font-bold font-mono-numbers text-purple-400">
              {combinedBookmakerOdds.toFixed(2)}
            </span>
          </div>

          <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Chance Real Combinada</span>
            <span className="text-lg font-bold font-mono-numbers text-amber-400">
              {combinedRealProbPercent.toFixed(1)}%
            </span>
          </div>

          <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Odd Justa Teórica</span>
            <span className="text-lg font-bold font-mono-numbers text-slate-200">
              {fairParlayOdds.toFixed(2)}
            </span>
          </div>

          <div
            className={`p-2.5 rounded-lg border ${
              isPositiveEV
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-400'
                : 'bg-rose-950/30 border-rose-800/60 text-rose-400'
            }`}
          >
            <span className="text-[11px] block opacity-80">Valor Esperado (+EV)</span>
            <span className="text-lg font-bold font-mono-numbers">
              {formatPercent(parlayEV, 1)}
            </span>
          </div>
        </div>

        {/* Stake & Potential Return */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-slate-300 whitespace-nowrap">Valor da Aposta (R$):</span>
            <input
              type="number"
              min="1"
              value={parlayStake}
              onChange={(e) => setParlayStake(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-24 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-sm font-mono-numbers text-white font-bold"
            />
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400">
              Lucro Possível:{' '}
              <strong className="text-emerald-400 font-mono-numbers text-sm">
                {formatCurrencyBRL(potentialProfit)}
              </strong>
            </span>
            <span className="text-slate-400">
              Retorno Total:{' '}
              <strong className="text-white font-mono-numbers text-sm">
                {formatCurrencyBRL(potentialProfit + parlayStake)}
              </strong>
            </span>
          </div>
        </div>

        {/* Parlay Insight */}
        <div className="text-xs p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 leading-relaxed flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <strong>Dica de Especialista NFL:</strong> Múltiplas combinadas acumulam a margem da casa em cada perna. Para ter valor real, você precisa selecionar pernas onde a sua vantagem (edge) individual seja alta o suficiente para superar a taxa de comissão do bookmaker.
          </div>
        </div>
      </div>
    </div>
  );
};
