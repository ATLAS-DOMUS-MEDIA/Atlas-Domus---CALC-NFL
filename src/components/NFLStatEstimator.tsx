import React, { useState } from 'react';
import { Sliders, CheckCircle2, ChevronDown, ChevronUp, Info, CloudRain, Shield, Trophy } from 'lucide-react';
import { NFLMarketCategory } from '../types';

interface NFLStatEstimatorProps {
  onApplyProbability: (prob: number) => void;
  currentProbability: number;
  currentMarket: NFLMarketCategory;
  playerNameOrTeam: string;
}

export const NFLStatEstimator: React.FC<NFLStatEstimatorProps> = ({
  onApplyProbability,
  currentMarket,
  playerNameOrTeam,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sampleGames, setSampleGames] = useState<number>(10);
  const [hits, setHits] = useState<number>(6);
  
  // NFL Specific modifiers
  const [weatherCondition, setWeatherCondition] = useState<'dome' | 'fair' | 'bad_weather'>('fair');
  const [opponentDefRank, setOpponentDefRank] = useState<'bottom5' | 'average' | 'top5'>('average');
  const [snapShare, setSnapShare] = useState<'featured' | 'rotation' | 'limited'>('featured');
  const [gameScript, setGameScript] = useState<'shootout' | 'balanced' | 'run_heavy'>('balanced');

  const safeSample = Math.max(1, sampleGames);
  const safeHits = Math.min(safeSample, Math.max(0, hits));
  const baseRate = (safeHits / safeSample) * 100;

  // Calculate intelligent NFL adjustments
  let weatherMod = 0;
  if (weatherCondition === 'dome') {
    weatherMod = +2.5; // Dome improves passing efficiency and kick accuracy
  } else if (weatherCondition === 'bad_weather') {
    // If passing/kicking, heavy penalty; if rushing, slight boost
    if (currentMarket === 'player_passing_yards' || currentMarket === 'player_passing_tds') {
      weatherMod = -7.5;
    } else if (currentMarket === 'player_rushing_yards') {
      weatherMod = +3.0;
    } else {
      weatherMod = -4.0;
    }
  }

  let defMod = 0;
  if (opponentDefRank === 'bottom5') {
    defMod = +6.0; // Facing a weak defense against this position
  } else if (opponentDefRank === 'top5') {
    defMod = -6.5; // Facing an elite defense
  }

  let snapMod = 0;
  if (snapShare === 'featured') {
    snapMod = +2.0; // 80%+ snap share / primary option
  } else if (snapShare === 'rotation') {
    snapMod = -5.0; // Commitee or timeshare
  } else if (snapShare === 'limited') {
    snapMod = -12.0; // Backup / gadget player
  }

  let scriptMod = 0;
  if (gameScript === 'shootout') {
    if (currentMarket === 'player_rushing_yards') {
      scriptMod = +1.0;
    } else {
      scriptMod = +4.5; // High scoring game benefits passing, receptions & anytime TDs
    }
  } else if (gameScript === 'run_heavy') {
    if (currentMarket === 'player_rushing_yards') {
      scriptMod = +5.0; // Team expected to lead and run clock
    } else if (currentMarket === 'player_passing_yards' || currentMarket === 'player_receptions') {
      scriptMod = -5.0; // Fewer pass attempts
    }
  }

  const rawCalculated = baseRate + weatherMod + defMod + snapMod + scriptMod;
  const finalCalibratedProb = Math.min(97, Math.max(3, Math.round(rawCalculated * 10) / 10));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        id="toggle-nfl-estimator-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">
                Assistente de Probabilidade Real NFL
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Contexto NFL
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {isOpen
                ? 'Ocultar estimador estatístico'
                : `Estimar chance de ${playerNameOrTeam || 'jogador/time'} bater a linha com dados recentes e clima`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOpen && (
            <span className="text-xs font-mono-numbers text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded font-semibold">
              Chance Estimada: {finalCalibratedProb}%
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-2 border-t border-slate-800/90 space-y-4 text-xs text-slate-300">
          <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Na NFL, apostas de valor dependem do <strong>volume do jogador (snap share)</strong>, do <strong>clima/vento</strong> e da qualidade da <strong>defesa adversária</strong>. Ajuste os fatores abaixo para calibrar a probabilidade real.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Amostra recente */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium flex justify-between">
                <span>Amostra de Jogos Recentes</span>
                <span className="font-mono-numbers text-amber-400 font-semibold">{sampleGames} partidas</span>
              </label>
              <div className="flex gap-1.5">
                {[5, 8, 10, 14, 17].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setSampleGames(num);
                      if (hits > num) setHits(num);
                    }}
                    className={`flex-1 py-1.5 rounded text-xs font-mono-numbers transition-colors ${
                      sampleGames === num
                        ? 'bg-amber-600 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {num === 17 ? '17 (Temp)' : `${num}j`}
                  </button>
                ))}
              </div>
            </div>

            {/* Bateu a meta */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium flex justify-between">
                <span>Bateu a meta em ({safeHits} de {safeSample} jogos)</span>
                <span className="font-mono-numbers text-amber-400 font-semibold">{baseRate.toFixed(1)}% base</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max={sampleGames}
                  value={safeHits}
                  onChange={(e) => setHits(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="font-mono-numbers text-white font-bold bg-slate-800 px-2.5 py-1 rounded text-xs min-w-[2.5rem] text-center border border-slate-700">
                  {safeHits}
                </span>
              </div>
            </div>
          </div>

          {/* NFL Modifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Clima e Estádio */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                <span>Estádio & Clima</span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setWeatherCondition('dome')}
                  className={`py-1.5 px-2 rounded text-left transition-colors text-xs ${
                    weatherCondition === 'dome'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🏟️ Domo / Fechado (+2.5%)
                </button>
                <button
                  type="button"
                  onClick={() => setWeatherCondition('fair')}
                  className={`py-1.5 px-2 rounded text-left transition-colors text-xs ${
                    weatherCondition === 'fair'
                      ? 'bg-slate-700 text-slate-100 border border-slate-600 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  ☀️ Aberto / Bom (0%)
                </button>
                <button
                  type="button"
                  onClick={() => setWeatherCondition('bad_weather')}
                  className={`py-1.5 px-2 rounded text-left transition-colors text-xs ${
                    weatherCondition === 'bad_weather'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  💨 Vento &gt; 18mph / Chuva
                </button>
              </div>
            </div>

            {/* Defesa Adversária */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Defesa Adversária</span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setOpponentDefRank('bottom5')}
                  className={`py-1.5 px-2 rounded text-left transition-colors text-xs ${
                    opponentDefRank === 'bottom5'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🟢 Frágil / Bottom 5 (+6%)
                </button>
                <button
                  type="button"
                  onClick={() => setOpponentDefRank('average')}
                  className={`py-1.5 px-2 rounded text-left transition-colors text-xs ${
                    opponentDefRank === 'average'
                      ? 'bg-slate-700 text-slate-100 border border-slate-600 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  ⚪ Média da Liga (0%)
                </button>
                <button
                  type="button"
                  onClick={() => setOpponentDefRank('top5')}
                  className={`py-1.5 px-2 rounded text-left transition-colors text-xs ${
                    opponentDefRank === 'top5'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🔴 Elite / Top 5 (-6.5%)
                </button>
              </div>
            </div>

            {/* Papel e Volume (Snap Share) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Trophy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Volume & Snaps</span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setSnapShare('featured')}
                  className={`py-1.5 px-2 rounded text-left transition-colors text-xs ${
                    snapShare === 'featured'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  ⭐ Titular 80%+ snaps (+2%)
                </button>
                <button
                  type="button"
                  onClick={() => setSnapShare('rotation')}
                  className={`py-1.5 px-2 rounded text-left transition-colors text-xs ${
                    snapShare === 'rotation'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🔄 Comitê / 50-65% (-5%)
                </button>
                <button
                  type="button"
                  onClick={() => setSnapShare('limited')}
                  className={`py-1.5 px-2 rounded text-left transition-colors text-xs ${
                    snapShare === 'limited'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  ⚠️ Snaps Limitados (-12%)
                </button>
              </div>
            </div>

            {/* Ritmo do Jogo (Game Script) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <span>Ritmo (Game Script)</span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setGameScript('shootout')}
                  className={`py-1.5 px-2 rounded text-left transition-colors text-xs ${
                    gameScript === 'shootout'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🔥 Tiroteio / Over Alto
                </button>
                <button
                  type="button"
                  onClick={() => setGameScript('balanced')}
                  className={`py-1.5 px-2 rounded text-left transition-colors text-xs ${
                    gameScript === 'balanced'
                      ? 'bg-slate-700 text-slate-100 border border-slate-600 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  ⚖️ Jogo Equilibrado
                </button>
                <button
                  type="button"
                  onClick={() => setGameScript('run_heavy')}
                  className={`py-1.5 px-2 rounded text-left transition-colors text-xs ${
                    gameScript === 'run_heavy'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🏈 Controle pelo Chão
                </button>
              </div>
            </div>
          </div>

          {/* Result bar and action */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-slate-400 text-xs">Probabilidade Calibrada para NFL:</span>
              <span className="text-lg font-bold font-mono-numbers text-amber-400">
                {finalCalibratedProb}%
              </span>
              <span className="text-xs text-slate-500 font-mono-numbers">
                (Odd Justa Decimal: {(100 / finalCalibratedProb).toFixed(2)})
              </span>
            </div>

            <button
              type="button"
              id="apply-nfl-prob-btn"
              onClick={() => {
                onApplyProbability(finalCalibratedProb);
                setIsOpen(false);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Aplicar {finalCalibratedProb}% à Calculadora
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
