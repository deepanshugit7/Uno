export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw_2' | 'wild' | 'wild_draw_4';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value?: number; // 0-9 for number cards
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isAI: boolean;
  score: number;
}

export type GameStatus = 'playing' | 'gameover' | 'round_end' | 'waiting_for_color';

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  status: GameStatus;
  winner: string | null;
  currentColor: CardColor;
  currentValue?: number | string; // To help UI show what to match
  hasYelledUno: boolean;
  message?: string;
  theme: 'light' | 'dark';
}
