import { Card, CardColor, Player } from '../types/game.ts';

/**
 * Checks if a card can be played on top of the current discard pile card.
 */
export const canPlayCard = (card: Card, topCard: Card, currentColor: CardColor): boolean => {
  // Wild cards can always be played
  if (card.color === 'wild') return true;

  // Match by color
  if (card.color === currentColor) return true;

  // Match by type/value
  if (card.type === topCard.type) {
    if (card.type === 'number') {
      return card.value === topCard.value;
    }
    return true; // Action cards of same type (e.g. Skip on Skip)
  }

  return false;
};

/**
 * Official Uno rule: Wild Draw 4 can only be played if the player has no cards
 * of the currentColor in their hand.
 */
export const canPlayWildDraw4 = (player: Player, currentColor: CardColor): boolean => {
  return !player.hand.some(card => card.color === currentColor);
};

/**
 * Checks if a player has any playable card in their hand.
 */
export const hasPlayableCard = (player: Player, topCard: Card, currentColor: CardColor): boolean => {
  return player.hand.some(card => canPlayCard(card, topCard, currentColor));
};

/**
 * Calculates the score of a hand (for round end scoring).
 * Number cards: Face value
 * Action cards (Skip, Reverse, Draw 2): 20 points
 * Wild cards (Wild, Wild Draw 4): 50 points
 */
export const calculateHandScore = (hand: Card[]): number => {
  return hand.reduce((score, card) => {
    if (card.type === 'number') return score + (card.value || 0);
    if (['skip', 'reverse', 'draw_2'].includes(card.type)) return score + 20;
    if (['wild', 'wild_draw_4'].includes(card.type)) return score + 50;
    return score;
  }, 0);
};
