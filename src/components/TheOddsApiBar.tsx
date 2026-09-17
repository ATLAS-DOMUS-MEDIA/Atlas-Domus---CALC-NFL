import React, { useState, useEffect } from 'react';
import {
  checkTheOddsApiStatus,
  fetchLiveNFLFromOddsApi,
  getStoredUserOddsApiKey,
  setStoredUserOddsApiKey,
  TheOddsApiResponse,
  TheOddsApiStatus,
} from '../services/theOddsApiService';
import {
  TrendingUp,
  Key,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TheOddsApiBarProps {
  onLiveOddsReceived?: (data: TheOddsApiResponse) => void;
}

export const TheOddsApiBar: React.FC<TheOddsApiBarProps> = ({ onLiveOddsReceived }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [status, setStatus] = useState<TheOddsApiStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncInfo, setLastSyncInfo] = useState<{
    time: string;
    bookmakers: string[];
    gamesCount: number;
    remaining?: string | null;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const saved = getStoredUserOddsApiKey();
    if (saved) setApiKeyInput(saved);
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const s = await checkTheOddsApiStatus();
      setStatus(s);
      // If server key or stored key exists, auto fetch
      const localKey = getStoredUserOddsApiKey();
      if (s.hasServerKey || localKey) {
        handleFetchOdds(false, localKey);
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleSaveKey = () => {
    setStoredUserOddsApiKey(apiKeyInput);
    handleFetchOdds(true, apiKeyInput);
  };

  const handleFetchOdds = async (forceFresh = false, explicitKey?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchLiveNFLFromOddsApi({
        forceFresh,
        userApiKey: explicitKey || apiKeyInput || undefined,
      });

      // Extract unique bookmakers from response
      const bSet = new Set<string>();
      if (Array.isArray(res.data)) {
        res.data.forEach((g) => {
          g.bookmakers?.forEach((b) => bSet.add(b.title));
        });
      }

      setLastSyncInfo({
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        bookmakers: Array.from(bSet),
        gamesCount: Array.isArray(res.data) ? res.data.length : 0,
        remaining: res.requestsRemaining,
      });

      if (onLiveOddsReceived) {
        onLiveOddsReceived(res);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao buscar cotações da The Odds API');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                The Odds API (Multi-Casas de Apostas)
              </h3>
              {lastSyncInfo ? (
                <span className="text-[10px] font-semibold bg-emerald-950/70 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Sincronizado ({lastSyncInfo.gamesCount} jogos)
                </span>
              ) : status?.hasServerKey ? (
                <span className="text-[10px] font-semibold bg-sky-950/70 border border-sky-800 text-sky-400 px-2 py-0.5 rounded-full">
                  Chave no Servidor Detectada
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-amber-950/70 border border-amber-800 text-amber-400 px-2 py-0.5 rounded-full">
                  Configuração Disponível
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Odds oficiais ao vivo de Bet365, DraftKings, FanDuel, Bovada e Pinnacle via <code className="text-amber-300 font-mono text-[11px]">americanfootball_nfl</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleFetchOdds(true)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-amber-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Buscando...' : 'Atualizar Odds'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Chave de API</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Bookmakers found badge bar */}
      {lastSyncInfo && lastSyncInfo.bookmakers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-semibold">Casas integradas:</span>
            {lastSyncInfo.bookmakers.map((b) => (
              <span
                key={b}
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-200 border border-slate-800"
              >
                {b}
              </span>
            ))}
          </div>
          {lastSyncInfo.remaining && (
            <span className="text-[11px] text-slate-500 font-mono">
              Requisições restantes: <strong>{lastSyncInfo.remaining}</strong>
            </span>
          )}
        </div>
      )}

      {/* Key input dropdown panel */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3 bg-slate-950/60 p-3.5 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Sua Chave The Odds API (Gratuita ou Pro)
            </label>
            <a
              href="https://the-odds-api.com/#get-access"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline"
            >
              Obter chave gratuita (500 req/mês)
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Ex: 9a7b5c8d... (ou configure THE_ODDS_API_KEY no .env)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              type="button"
              onClick={handleSaveKey}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Salvar e Testar
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            A chave fica salva com segurança no seu navegador ou nas variáveis de ambiente do servidor. Ela desbloqueia cotações em tempo real de Bet365, DraftKings, Pinnacle, FanDuel e muito mais.
          </p>
        </div>
      )}
    </div>
  );
};
