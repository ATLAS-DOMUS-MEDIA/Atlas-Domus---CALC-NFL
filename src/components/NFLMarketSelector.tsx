import React from 'react';
import { NFLMarketCategory } from '../types';
import { Flame, Target, Trophy, Award, Footprints, ShieldAlert, Layers } from 'lucide-react';

interface MarketOption {
  value: NFLMarketCategory;
  label: string;
  category: 'player' | 'game';
  example: string;
  icon: React.ReactNode;
}

export const NFL_MARKETS: MarketOption[] = [
  {
    value: 'player_anytime_td',
    label: 'Anytime Touchdown (TD)',
    category: 'player',
    example: 'Ex: McCaffrey anotar TD',
    icon: <Flame className="w-3.5 h-3.5 text-amber-400" />
  },
  {
    value: 'player_passing_yards',
    label: 'Jardas de Passe (Passing Yds)',
    category: 'player',
    example: 'Ex: Mahomes Over 265.5',
    icon: <Target className="w-3.5 h-3.5 text-sky-400" />
  },
  {
    value: 'player_passing_tds',
    label: 'Touchdowns de Passe (TDs)',
    category: 'player',
    example: 'Ex: Josh Allen Over 1.5 TDs',
    icon: <Award className="w-3.5 h-3.5 text-emerald-400" />
  },
  {
    value: 'player_rushing_yards',
    label: 'Jardas Terrestres (Rushing Yds)',
    category: 'player',
    example: 'Ex: Henry Over 75.5 jardas',
    icon: <Footprints className="w-3.5 h-3.5 text-orange-400" />
  },
  {
    value: 'player_receiving_yards',
    label: 'Jardas Recebidas (Receiving Yds)',
    category: 'player',
    example: 'Ex: Jefferson Over 82.5 yds',
    icon: <Target className="w-3.5 h-3.5 text-indigo-400" />
  },
  {
    value: 'player_receptions',
    label: 'Recepções de Passes (Catches)',
    category: 'player',
    example: 'Ex: Kelce Over 5.5 recepções',
    icon: <Layers className="w-3.5 h-3.5 text-purple-400" />
  },
  {
    value: 'player_interceptions',
    label: 'Intercepção Lançada (INTs)',
    category: 'player',
    example: 'Ex: QB lançar 1+ INT',
    icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
  },
  {
    value: 'game_spread',
    label: 'Spread / Handicap de Pontos',
    category: 'game',
    example: 'Ex: Chiefs -3.5 / Ravens +3.5',
    icon: <Trophy className="w-3.5 h-3.5 text-blue-400" />
  },
  {
    value: 'game_moneyline',
    label: 'Moneyline (Vencedor Direto)',
    category: 'game',
    example: 'Ex: Vitória do time seco',
    icon: <Trophy className="w-3.5 h-3.5 text-emerald-400" />
  },
  {
    value: 'game_total_points',
    label: 'Total de Pontos (Over/Under)',
    category: 'game',
    example: 'Ex: Mais de 47.5 pontos no jogo',
    icon: <Layers className="w-3.5 h-3.5 text-teal-400" />
  },
  {
    value: 'team_total_points',
    label: 'Total de Pontos do Time',
    category: 'game',
    example: 'Ex: 49ers Over 26.5 pontos',
    icon: <Target className="w-3.5 h-3.5 text-cyan-400" />
  },
];

interface NFLMarketSelectorProps {
  selectedMarket: NFLMarketCategory;
  onSelectMarket: (market: NFLMarketCategory, defaultLabel: string) => void;
}

export const NFLMarketSelector: React.FC<NFLMarketSelectorProps> = ({
  selectedMarket,
  onSelectMarket,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
        <span>Mercado da Aposta NFL</span>
        <span className="text-[11px] text-slate-500 font-normal">Player Props ou Jogo</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
        {NFL_MARKETS.map((m) => {
          const isSelected = selectedMarket === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onSelectMarket(m.value, m.label)}
              className={`p-2 rounded-lg text-left transition-all border text-xs flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {m.icon}
                <span className="font-semibold truncate text-[11px]">{m.label}</span>
              </div>
              <span className="text-[10px] text-slate-500 truncate block">{m.example}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
