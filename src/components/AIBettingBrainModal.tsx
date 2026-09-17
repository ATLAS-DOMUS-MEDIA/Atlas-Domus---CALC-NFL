import React, { useState, useEffect } from 'react';
import {
  BrainAnalysisRequest,
  BrainAnalysisResult,
  analyzeBetWithBrain,
} from '../services/aiBettingBrainService';
import { PlayerOddsProp } from '../services/prizePicksService';
import {
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  Target,
  BarChart3,
  Percent,
  Sliders,
  Calendar,
  MapPin,
  CloudSun,
} from 'lucide-react';

interface AIBettingBrainModalProps {
  prop: PlayerOddsProp | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyBet?: (prop: PlayerOddsProp, analysis: BrainAnalysisResult) => void;
}

export const AIBettingBrainModal: React.FC<AIBettingBrainModalProps> = ({
  prop,
  isOpen,
  onClose,
  onApplyBet,
}) => {
  const [analysis, setAnalysis] = useState<BrainAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeResearchTab, setActiveResearchTab] = useState<'all' | 'defense' | 'volume' | 'injuries'>('all');

  useEffect(() => {
    if (isOpen && prop) {
      runAnalysis(prop);
    } else {
      setAnalysis(null);
      setCustomPrompt('');
    }
  }, [isOpen, prop]);

  const runAnalysis = async (targetProp: PlayerOddsProp, customQuery?: string) => {
    setLoading(true);
    try {
      const request: BrainAnalysisRequest = {
        athleteName: targetProp.playerName,
        team: targetProp.teamId,
        opponent: targetProp.opponent || 'Adversário',
        position: targetProp.position,
        statType: targetProp.statType,
        lineScore: targetProp.lineScore,
        bookOdds: targetProp.overOdds || 1.85,
        isActiveToday: targetProp.isActiveToday,
        injuryDesignation: targetProp.injuryDesignation,
        marketCategory: targetProp.marketCategory,
        customQuery: customQuery || undefined,
      };

      const result = await analyzeBetWithBrain(request);
      setAnalysis(result);
    } catch (err) {
      console.error('Erro ao executar cérebro analítico:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnalysis = () => {
    if (!analysis) return;
    const text = `🧠 Análise Cérebro IA / Quant - NFL
Atleta: ${analysis.athleteName} (${analysis.team} vs ${analysis.opponent})
Mercado: ${analysis.statType} Over ${analysis.lineScore}
Veredito: ${analysis.verdictTitle}
Valor Esperado (+EV): ${analysis.expectedValue}% | Borda: +${analysis.edgePercent}%
Odd da Casa: @${analysis.bookOdds} | Odd Justa: @${analysis.fairOdds}
Prob. Implícita: ${analysis.impliedProb}% | Prob. Justa: ${analysis.fairProb}%
Gestão de Kelly: ${analysis.kellyPercent}% da banca
Recomendação: ${analysis.recommendation}
Resumo Tático: ${analysis.tacticalSummary}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !prop) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Cérebro Analítico & Quant (Deep Research)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 border border-emerald-700 text-emerald-300">
                  ESPN + PrizePicks Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pesquisa avançada de matchup, estatísticas de DVOA, volume de snaps e cálculo de +EV
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Target Athlete & Prop Banner */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black flex items-center justify-center text-sm font-mono">
                {prop.position}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{prop.playerName}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
                    {prop.teamId} {prop.opponent ? `vs ${prop.opponent}` : ''}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span>{prop.statType}:</span>
                  <strong className="text-amber-400 font-mono">Over {prop.lineScore}</strong>
                  <span className="text-slate-500">•</span>
                  <span>Odd: @{prop.overOdds || 1.85}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {prop.isActiveToday ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ativo no Roster ESPN (53)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 border border-rose-700 text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {prop.injuryDesignation?.toUpperCase() || 'DESFALQUE (OUT)'}
                </span>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                <Sparkles className="w-6 h-6 text-purple-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  O Cérebro está processando dados e pesquisas...
                </p>
                <p className="text-xs text-slate-400 max-w-md">
                  Consultando relatórios médicos oficiais da ESPN, métricas defensivas de DVOA, volume de jogo e calculando o valor esperado matemático (+EV).
                </p>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {!loading && analysis && (
            <div className="space-y-5 animate-fadeIn">
              {/* 3-Step Pipeline Audit Card */}
              {analysis.pipeline && (
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Pipeline Interligado de Verificação (3 Etapas)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      100% Sincronizado
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {/* Etapa 1: Jogador & Elenco ESPN */}
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                            <span>1. Elenco ESPN</span>
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            53 Atletas
                          </span>
                        </div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{analysis.pipeline.step1Roster.playerName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-amber-300 font-mono font-bold">
                            {analysis.pipeline.step1Roster.team}
                          </span>
                        </div>
                        {analysis.pipeline.step1Roster.teamCorrected && (
                          <div className="mt-1 text-[10px] text-amber-300 bg-amber-950/60 p-1 rounded border border-amber-800/80">
                            ⚡ Sincronizado: Corrigido de {analysis.pipeline.step1Roster.originalTeam} para {analysis.pipeline.step1Roster.team} via ESPN.
                          </div>
                        )}
                      </div>
                      <div className="mt-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Status:</span>
                        <span className={analysis.pipeline.step1Roster.isActiveToday ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {analysis.pipeline.step1Roster.isActiveToday ? 'Confirmado Ativo' : 'Fora da Rodada'}
                        </span>
                      </div>
                    </div>

                    {/* Etapa 2: Confronto do Dia */}
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>2. Jogo do Dia</span>
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-950 text-blue-400 border border-blue-800">
                            {analysis.pipeline.step2Matchup.gameDetails?.time || '14:00'}
                          </span>
                        </div>
                        <div className="font-bold text-white">
                          {analysis.pipeline.step2Matchup.matchup}
                        </div>
                        {analysis.pipeline.step2Matchup.gameDetails?.stadium && (
                          <div className="mt-1 text-[10px] text-slate-400 truncate flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                            <span className="truncate">{analysis.pipeline.step2Matchup.gameDetails.stadium}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Clima / Domo:</span>
                        <span className="text-slate-300 truncate max-w-[120px]">
                          {analysis.pipeline.step2Matchup.gameDetails?.weather ? 'Auditado' : 'Normal'}
                        </span>
                      </div>
                    </div>

                    {/* Etapa 3: Pesquisa & Inteligência */}
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <Search className="w-3 h-3" />
                            <span>3. Pesquisas IA</span>
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-950 text-purple-400 border border-purple-800">
                            Deep Quant
                          </span>
                        </div>
                        <div className="font-bold text-white flex items-center gap-1">
                          <span>{analysis.statType} Over {analysis.lineScore}</span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          Cruzamento tático vs defesa de {analysis.opponent}
                        </div>
                      </div>
                      <div className="mt-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Status:</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Concluído
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Verdict Card */}
              <div
                className={`p-4 rounded-xl border ${
                  analysis.verdict === 'STRONG_VALUE'
                    ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
                    : analysis.verdict === 'MODERATE_VALUE'
                    ? 'bg-blue-950/30 border-blue-800 text-blue-200'
                    : analysis.verdict === 'INACTIVE_WARNING'
                    ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                    : 'bg-amber-950/30 border-amber-800 text-amber-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block">
                      {analysis.verdictTitle}
                    </span>
                    <p className="text-sm font-semibold mt-1 text-white">
                      {analysis.recommendation}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                      Expectativa
                    </span>
                    <span
                      className={`text-lg font-black font-mono ${
                        analysis.expectedValue > 0
                          ? 'text-emerald-400'
                          : analysis.expectedValue < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {analysis.expectedValue > 0 ? `+${analysis.expectedValue}%` : `${analysis.expectedValue}%`} EV
                    </span>
                  </div>
                </div>
              </div>

              {/* Quant Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Odd da Casa
                  </span>
                  <span className="text-base font-black text-white font-mono mt-0.5 block">
                    @{analysis.bookOdds.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Implícita: {analysis.impliedProb}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Odd Justa (Fair)
                  </span>
                  <span className="text-base font-black text-amber-400 font-mono mt-0.5 block">
                    @{analysis.fairOdds.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Projeção: {analysis.fairProb}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Borda Matemática
                  </span>
                  <span
                    className={`text-base font-black font-mono mt-0.5 block ${
                      analysis.edgePercent > 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {analysis.edgePercent > 0 ? `+${analysis.edgePercent}%` : `${analysis.edgePercent}%`}
                  </span>
                  <span className="text-[10px] text-slate-400">Sobre a casa</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Critério de Kelly
                  </span>
                  <span className="text-base font-black text-purple-400 font-mono mt-0.5 block">
                    {analysis.kellyPercent > 0 ? `${analysis.kellyPercent}%` : '0%'}
                  </span>
                  <span className="text-[10px] text-slate-400">Gestão 1/4 Kelly</span>
                </div>
              </div>

              {/* Tactical Summary */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                  Síntese Analítica da Oportunidade
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {analysis.tacticalSummary}
                </p>
              </div>

              {/* Research Points Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-blue-400" />
                    Pontos de Pesquisa Aprofundada
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {analysis.researchPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white">
                          {point.category}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            point.impact === 'positive'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : point.impact === 'negative'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {point.impact === 'positive'
                            ? 'Favorável'
                            : point.impact === 'negative'
                            ? 'Alerta'
                            : 'Neutro'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {point.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sources */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <strong>Fontes Consultadas:</strong> ESPN 53-Man Rosters, PrizePicks JSON API, DVOA Defensive Ranks
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(analysis.timestamp).toLocaleTimeString('pt-BR')}
                </span>
              </div>

              {/* Custom Prompt / Deep Research Input */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Perguntar algo específico ao Cérebro IA (Ex: "Como a lesão do Left Tackle afeta ele?")
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customPrompt.trim()) {
                        runAnalysis(prop, customPrompt);
                      }
                    }}
                    placeholder="Digite sua dúvida de pesquisa ou clique para recalcular..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => runAnalysis(prop, customPrompt)}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pesquisar</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyAnalysis}
              disabled={!analysis}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Análise'}</span>
            </button>

            <button
              type="button"
              onClick={() => runAnalysis(prop)}
              disabled={loading}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Recalcular</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {analysis && onApplyBet && (
              <button
                type="button"
                onClick={() => {
                  onApplyBet(prop, analysis);
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto shadow-lg shadow-emerald-950"
              >
                <span>Aplicar na Calculadora (+EV)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
