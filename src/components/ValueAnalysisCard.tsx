import React from 'react';
import { NFLBetAnalysis, NFLBetInput } from '../types';
import { formatCurrencyBRL, formatPercent, formatAmericanOdds } from '../utils/betCalculations';
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, DollarSign, Scale, Percent, Zap } from 'lucide-react';

interface ValueAnalysisCardProps {
  analysis: NFLBetAnalysis;
  input: NFLBetInput;
  onApplyStake?: (amount: number) => void;
}

export const ValueAnalysisCard: React.FC<ValueAnalysisCardProps> = ({ analysis, input, onApplyStake }) => {
  const {
    impliedProbability,
    fairOddsDecimal,
    fairOddsAmerican,
    expectedValuePercent,
    isPositiveEV,
    edge,
    potentialProfit,
    expectedProfitPerBet,
    suggestedStakeHalf,
    suggestedStakeQuarter,
    kellyHalfPercent,
    riskLevel,
    verdict,
  } = analysis;

  // Visual verdict styling
  const verdictConfig = {
    EXCELENTE_VALOR: {
      badge: '+EV ALTO (Excelente Oportunidade)',
      bg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
      desc: 'A probabilidade do jogador/time bater a linha é consideravelmente superior ao que a casa está pagando. Aposta matematicamente vantajosa no longo prazo.',
    },
    BOM_VALOR: {
      badge: '+EV (Boa Aposta de Valor)',
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
      desc: 'Há valor esperado positivo. Você tem margem de vantagem estatística sobre as odds oferecidas pelo bookmaker.',
    },
    VALOR_MARGINAL: {
      badge: '+EV Marginal (Valor Leve)',
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      desc: 'A aposta possui pequeno valor (+0% a +3%), mas uma margem estreita. Se optar por apostar, utilize stakes conservadoras.',
    },
    SEM_VALOR: {
      badge: '-EV (Sem Valor Esperado)',
      bg: 'bg-slate-800 border-slate-700 text-slate-300',
      icon: <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0" />,
      desc: 'A odd que a casa paga é inferior à probabilidade real estimada do evento ocorrer. No longo prazo, esta aposta tem expectativa de perda para a banca.',
    },
    PREJUIZO_GRAVE: {
      badge: '-EV SEVERO (Armadilha de Odd Esmagada)',
      bg: 'bg-rose-500/10 border-rose-500/40 text-rose-400',
      icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      desc: 'A casa está pagando um valor extremamente baixo em relação ao risco do jogador/time não bater a aposta. Alto perigo de queimar a banca.',
    },
  }[verdict];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
      {/* Top Banner with Verdict */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${verdictConfig.bg}`}>
        <div className="flex items-start gap-3">
          {verdictConfig.icon}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base tracking-wide uppercase">
                {verdictConfig.badge}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900/60 font-mono-numbers font-bold border border-slate-700">
                EV: {formatPercent(expectedValuePercent, 2)}
              </span>
            </div>
            <p className="text-xs mt-1 text-slate-300 leading-relaxed max-w-xl">
              {verdictConfig.desc}
            </p>
          </div>
        </div>

        <div className="text-right sm:shrink-0 pl-8 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80">
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Vantagem Real (Edge)</span>
          <span className={`text-xl sm:text-2xl font-bold font-mono-numbers ${edge >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatPercent(edge, 1)}
          </span>
        </div>
      </div>

      {/* Probability Duel: Player/Team vs Sportsbook */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-400" />
            Confronto de Probabilidades: Jogador/Time vs Casa
          </span>
          <span className="text-[11px] text-slate-500">Quanto maior sua chance sobre a casa, maior o valor</span>
        </div>

        {/* Dual Bars */}
        <div className="space-y-2.5 pt-1">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">
                Chance Real Estimada (Jogador/Time bater):
              </span>
              <span className="font-bold font-mono-numbers text-amber-400">
                {input.estimatedProbability.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(2, input.estimatedProbability))}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">
                Probabilidade Implícita das Odds ({input.decimalOdds.toFixed(2)}):
              </span>
              <span className="font-mono-numbers text-slate-300">
                {impliedProbability.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  input.estimatedProbability >= impliedProbability ? 'bg-slate-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(2, impliedProbability))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-1 flex justify-between border-t border-slate-800/60">
          <span>
            {isPositiveEV ? (
              <span className="text-emerald-400 font-medium">
                ✓ Você estima {edge.toFixed(1)}% a mais de chance que o exigido pela odd.
              </span>
            ) : (
              <span className="text-rose-400 font-medium">
                ✗ A casa exige {Math.abs(edge).toFixed(1)}% a mais do que sua estimativa real.
              </span>
            )}
          </span>
          <span className="text-slate-500">Break-even: {impliedProbability.toFixed(1)}%</span>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Odd Paga */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Odd Ofertada</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono-numbers text-white">
              {input.decimalOdds.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-500 font-mono-numbers">
              ({formatAmericanOdds(input.americanOdds)})
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">{input.bookmaker || 'Casa de Aposta'}</span>
        </div>

        {/* Odd Justa */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Odd Justa (Fair)</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono-numbers text-amber-400">
              {fairOddsDecimal.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-500 font-mono-numbers">
              ({formatAmericanOdds(fairOddsAmerican)})
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {input.decimalOdds > fairOddsDecimal ? 'Paga acima do justo (+)' : 'Paga abaixo do justo (-)'}
          </span>
        </div>

        {/* Lucro Potencial */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Lucro no Green</span>
          <div className="mt-1">
            <span className="text-lg sm:text-xl font-bold font-mono-numbers text-emerald-400">
              {formatCurrencyBRL(potentialProfit)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Retorno: {formatCurrencyBRL(potentialProfit + input.stake)}
          </span>
        </div>

        {/* Expectativa Matemática por aposta */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block uppercase font-medium">EV por Aposta</span>
          <div className="mt-1">
            <span className={`text-lg sm:text-xl font-bold font-mono-numbers ${expectedProfitPerBet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {expectedProfitPerBet >= 0 ? '+' : ''}{formatCurrencyBRL(expectedProfitPerBet)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Média esperada a cada R$ {input.stake}
          </span>
        </div>
      </div>

      {/* Bankroll Management (Kelly Criterion) */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Gestão de Banca (Critério de Kelly Recomendado para NFL)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Banca Atual: <strong className="text-white font-mono-numbers">{formatCurrencyBRL(input.bankroll)}</strong>
          </span>
        </div>

        {isPositiveEV ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300">
                  Meio Kelly (Padrão Ouro NFL)
                </span>
                <span className="text-xs font-mono-numbers font-bold text-emerald-400">
                  {kellyHalfPercent.toFixed(1)}% da banca
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-lg font-bold font-mono-numbers text-white">
                  {formatCurrencyBRL(suggestedStakeHalf)}
                </div>
                {onApplyStake && (
                  <button
                    type="button"
                    onClick={() => onApplyStake(suggestedStakeHalf)}
                    className="text-[11px] font-semibold text-emerald-300 bg-emerald-900/60 hover:bg-emerald-800/80 px-2.5 py-1 rounded border border-emerald-700/50 transition-colors"
                  >
                    Usar na Stake
                  </button>
                )}
              </div>
              <p className="text-[11px] text-emerald-200/80">
                Padrão recomendado em apostas esportivas de NFL para mitigar a variância e proteger a banca.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  1/4 Kelly (Ultra Conservador)
                </span>
                <span className="text-xs font-mono-numbers font-medium text-slate-400">
                  {analysis.kellyQuarterPercent.toFixed(1)}% da banca
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-lg font-bold font-mono-numbers text-slate-200">
                  {formatCurrencyBRL(suggestedStakeQuarter)}
                </div>
                {onApplyStake && (
                  <button
                    type="button"
                    onClick={() => onApplyStake(suggestedStakeQuarter)}
                    className="text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded border border-slate-700 transition-colors"
                  >
                    Usar na Stake
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Ideal para Player Props de maior volatilidade ou odds acima de 2.40.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Critério de Kelly indica Stake R$ 0,00:</strong> O valor esperado é negativo. A matemática não recomenda apostar nada nesta odd.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
