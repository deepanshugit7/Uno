import { Card, CardColor, CardType } from '../types/game.ts';

const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];
const ACTION_TYPES: CardType[] = ['skip', 'reverse', 'draw_2'];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  let id = 0;

  for (const color of COLORS) {
    // Number 0: One of each color
    deck.push({ id: (id++).toString(), color, type: 'number', value: 0 });

    // Numbers 1-9: Two of each color
    for (let num = 1; num <= 9; num++) {
      deck.push({ id: (id++).toString(), color, type: 'number', value: num });
      deck.push({ id: (id++).toString(), color, type: 'number', value: num });
    }

    // Action cards: Two of each per color
    for (const type of ACTION_TYPES) {
      deck.push({ id: (id++).toString(), color, type });
      deck.push({ id: (id++).toString(), color, type });
    }
  }

  // Wild cards: Four of each
  for (let i = 0; i < 4; i++) {
    deck.push({ id: (id++).toString(), color: 'wild', type: 'wild' });
    deck.push({ id: (id++).toString(), color: 'wild', type: 'wild_draw_4' });
  }

  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
