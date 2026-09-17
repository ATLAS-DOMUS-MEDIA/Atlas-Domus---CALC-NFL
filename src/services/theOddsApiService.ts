/**
 * The Odds API Client Service
 * 
 * Integra com a rota segura de backend (/api/odds/nfl) que consome
 * a API oficial da The Odds API (https://the-odds-api.com)
 * Cobrindo bookmakers como Bet365, DraftKings, FanDuel, Bovada, Pinnacle e BetMGM.
 */

export interface TheOddsApiMarketOutcome {
  name: string;
  price: number; // Decimal odds (ex: 1.91)
  point?: number; // Spread line (ex: -3.5) or Total (ex: 47.5)
  description?: string; // Player name for player props
}

export interface TheOddsApiMarket {
  key: 'h2h' | 'spreads' | 'totals' | string;
  last_update: string;
  outcomes: TheOddsApiMarketOutcome[];
}

export interface TheOddsApiBookmaker {
  key: string;
  title: string; // e.g. "Bet365", "DraftKings", "FanDuel", "Pinnacle"
  last_update: string;
  markets: TheOddsApiMarket[];
}

export interface TheOddsApiGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: TheOddsApiBookmaker[];
}

export interface TheOddsApiResponse {
  source: string;
  cached?: boolean;
  cacheAgeSeconds?: number;
  requestsRemaining?: string | null;
  requestsUsed?: string | null;
  count?: number;
  data: TheOddsApiGame[];
  error?: string;
  message?: string;
}

export interface TheOddsApiStatus {
  status: string;
  provider: string;
  sportKey: string;
  hasServerKey: boolean;
  cached: boolean;
}

const LOCAL_STORAGE_KEY_ODDS_API = 'the_odds_api_user_key';

export function getStoredUserOddsApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LOCAL_STORAGE_KEY_ODDS_API) || '';
}

export function setStoredUserOddsApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem(LOCAL_STORAGE_KEY_ODDS_API, key.trim());
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY_ODDS_API);
  }
}

/**
 * Checa status do backend e configuração de chave
 */
export async function checkTheOddsApiStatus(): Promise<TheOddsApiStatus> {
  try {
    const res = await fetch('/api/odds/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      provider: 'The Odds API',
      sportKey: 'americanfootball_nfl',
      hasServerKey: false,
      cached: false,
    };
  }
}

/**
 * Busca cotações ao vivo de NFL da The Odds API
 */
export async function fetchLiveNFLFromOddsApi(options?: {
  forceFresh?: boolean;
  userApiKey?: string;
}): Promise<TheOddsApiResponse> {
  const userKey = options?.userApiKey || getStoredUserOddsApiKey();
  const queryParams = new URLSearchParams();
  queryParams.set('regions', 'us,eu');
  queryParams.set('markets', 'h2h,spreads,totals');
  queryParams.set('oddsFormat', 'decimal');

  if (userKey) {
    queryParams.set('apiKey', userKey);
  }
  if (options?.forceFresh) {
    queryParams.set('forceFresh', 'true');
  }

  const res = await fetch(`/api/odds/nfl?${queryParams.toString()}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || json.error || `Erro HTTP ${res.status}`);
  }

  return json as TheOddsApiResponse;
}
