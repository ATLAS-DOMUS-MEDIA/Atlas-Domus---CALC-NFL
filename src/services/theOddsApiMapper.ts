import { TheOddsApiGame, TheOddsApiBookmaker } from './theOddsApiService';
import { NFLMatchupStudy, NFLGameProp } from '../data/nflGamesSchedule';

/**
 * Normaliza nomes de franquias da The Odds API para abreviações oficiais da NFL
 */
export function normalizeTeamToAbbr(teamName: string): string {
  const clean = teamName.toLowerCase().trim();
  if (clean.includes('kansas') || clean.includes('chiefs')) return 'KC';
  if (clean.includes('san francisco') || clean.includes('49ers')) return 'SF';
  if (clean.includes('baltimore') || clean.includes('ravens')) return 'BAL';
  if (clean.includes('detroit') || clean.includes('lions')) return 'DET';
  if (clean.includes('new orleans') || clean.includes('saints')) return 'NO';
  if (clean.includes('philadelphia') || clean.includes('eagles')) return 'PHI';
  if (clean.includes('dallas') || clean.includes('cowboys')) return 'DAL';
  if (clean.includes('green bay') || clean.includes('packers')) return 'GB';
  if (clean.includes('buffalo') || clean.includes('bills')) return 'BUF';
  if (clean.includes('miami') || clean.includes('dolphins')) return 'MIA';
  if (clean.includes('houston') || clean.includes('texans')) return 'HOU';
  if (clean.includes('cincinnati') || clean.includes('bengals')) return 'CIN';
  if (clean.includes('seattle') || clean.includes('seahawks')) return 'SEA';
  if (clean.includes('los angeles rams') || clean.includes('rams')) return 'LAR';
  if (clean.includes('los angeles chargers') || clean.includes('chargers')) return 'LAC';
  if (clean.includes('tampa') || clean.includes('buccaneers')) return 'TB';
  if (clean.includes('minnesota') || clean.includes('vikings')) return 'MIN';
  if (clean.includes('atlanta') || clean.includes('falcons')) return 'ATL';
  if (clean.includes('carolina') || clean.includes('panthers')) return 'CAR';
  if (clean.includes('chicago') || clean.includes('bears')) return 'CHI';
  if (clean.includes('cleveland') || clean.includes('browns')) return 'CLE';
  if (clean.includes('denver') || clean.includes('broncos')) return 'DEN';
  if (clean.includes('indianapolis') || clean.includes('colts')) return 'IND';
  if (clean.includes('jacksonville') || clean.includes('jaguars')) return 'JAX';
  if (clean.includes('las vegas') || clean.includes('raiders')) return 'LV';
  if (clean.includes('new england') || clean.includes('patriots')) return 'NE';
  if (clean.includes('new york giants') || clean.includes('giants')) return 'NYG';
  if (clean.includes('new york jets') || clean.includes('jets')) return 'NYJ';
  if (clean.includes('pittsburgh') || clean.includes('steelers')) return 'PIT';
  if (clean.includes('tennessee') || clean.includes('titans')) return 'TEN';
  if (clean.includes('washington') || clean.includes('commanders')) return 'WAS';
  if (clean.includes('arizona') || clean.includes('cardinals')) return 'ARI';
  return teamName.slice(0, 3).toUpperCase();
}

/**
 * Mescla as odds em tempo real da The Odds API nos jogos da grade
 */
export function mergeTheOddsApiIntoSchedule(
  baseSchedule: NFLMatchupStudy[],
  liveOddsGames: TheOddsApiGame[]
): {
  mergedSchedule: NFLMatchupStudy[];
  matchedCount: number;
  featuredBookmakers: string[];
} {
  if (!liveOddsGames || liveOddsGames.length === 0) {
    return {
      mergedSchedule: baseSchedule,
      matchedCount: 0,
      featuredBookmakers: ['Bet365', 'Pinnacle'],
    };
  }

  let matchedCount = 0;
  const bookmakerSet = new Set<string>();

  const updatedSchedule = baseSchedule.map((game) => {
    // Procura o jogo correspondente na The Odds API
    const match = liveOddsGames.find((apiGame) => {
      const homeAbbr = normalizeTeamToAbbr(apiGame.home_team);
      const awayAbbr = normalizeTeamToAbbr(apiGame.away_team);
      return (
        (homeAbbr === game.homeAbbr && awayAbbr === game.awayAbbr) ||
        (homeAbbr === game.awayAbbr && awayAbbr === game.homeAbbr)
      );
    });

    if (!match || !match.bookmakers || match.bookmakers.length === 0) {
      return game;
    }

    matchedCount++;

    // Prioriza bookmakers em ordem: bet365, draftkings, fanduel, pinnacle, ou o primeiro disponível
    const priorityKeys = ['bet365', 'draftkings', 'fanduel', 'pinnacle', 'bovada'];
    let selectedBm: TheOddsApiBookmaker | undefined;

    for (const key of priorityKeys) {
      selectedBm = match.bookmakers.find((b) => b.key.toLowerCase().includes(key));
      if (selectedBm) break;
    }

    if (!selectedBm) {
      selectedBm = match.bookmakers[0];
    }

    bookmakerSet.add(selectedBm.title);

    // Extrai mercados
    const h2hMarket = selectedBm.markets.find((m) => m.key === 'h2h');
    const spreadsMarket = selectedBm.markets.find((m) => m.key === 'spreads');
    const totalsMarket = selectedBm.markets.find((m) => m.key === 'totals');

    let updatedMoneyline = { ...game.moneyline };
    if (h2hMarket && h2hMarket.outcomes.length >= 2) {
      const homeOutcome = h2hMarket.outcomes.find(
        (o) => normalizeTeamToAbbr(o.name) === game.homeAbbr
      );
      const awayOutcome = h2hMarket.outcomes.find(
        (o) => normalizeTeamToAbbr(o.name) === game.awayAbbr
      );
      if (homeOutcome && awayOutcome) {
        updatedMoneyline = {
          home: Number(homeOutcome.price.toFixed(2)),
          away: Number(awayOutcome.price.toFixed(2)),
        };
      }
    }

    let updatedSpread = game.spread;
    let updatedSpreadOdds = { ...game.spreadOdds };
    if (spreadsMarket && spreadsMarket.outcomes.length >= 2) {
      const homeOutcome = spreadsMarket.outcomes.find(
        (o) => normalizeTeamToAbbr(o.name) === game.homeAbbr
      );
      const awayOutcome = spreadsMarket.outcomes.find(
        (o) => normalizeTeamToAbbr(o.name) === game.awayAbbr
      );
      if (homeOutcome && awayOutcome) {
        updatedSpreadOdds = {
          home: Number(homeOutcome.price.toFixed(2)),
          away: Number(awayOutcome.price.toFixed(2)),
        };
        if (awayOutcome.point !== undefined) {
          const sign = awayOutcome.point > 0 ? `+${awayOutcome.point}` : `${awayOutcome.point}`;
          updatedSpread = `${game.awayAbbr} ${sign}`;
        }
      }
    }

    let updatedTotalOverUnder = game.totalOverUnder;
    let updatedTotalOdds = { ...game.totalOdds };
    if (totalsMarket && totalsMarket.outcomes.length >= 2) {
      const overOutcome = totalsMarket.outcomes.find((o) =>
        o.name.toLowerCase().includes('over')
      );
      const underOutcome = totalsMarket.outcomes.find((o) =>
        o.name.toLowerCase().includes('under')
      );
      if (overOutcome && underOutcome) {
        updatedTotalOdds = {
          over: Number(overOutcome.price.toFixed(2)),
          under: Number(underOutcome.price.toFixed(2)),
        };
        if (overOutcome.point !== undefined) {
          updatedTotalOverUnder = overOutcome.point;
        }
      }
    }

    return {
      ...game,
      moneyline: updatedMoneyline,
      spread: updatedSpread,
      spreadOdds: updatedSpreadOdds,
      totalOverUnder: updatedTotalOverUnder,
      totalOdds: updatedTotalOdds,
      bookmakerName: selectedBm.title,
    };
  });

  return {
    mergedSchedule: updatedSchedule,
    matchedCount,
    featuredBookmakers: Array.from(bookmakerSet),
  };
}
