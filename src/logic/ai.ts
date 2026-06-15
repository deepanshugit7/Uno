import { CardColor, GameState } from '../types/game.ts';
import { canPlayCard } from './rules.ts';

export function makeAIMove(state: GameState): {
  action: 'play' | 'draw' | 'choose_color';
  cardId?: string;
  color?: CardColor;
} {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const topCard = state.discardPile[state.discardPile.length - 1];

  if (state.status === 'waiting_for_color') {
    // Choose the color the AI has most of
    const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
    const colorCounts = colors.map(color => ({
      color,
      count: currentPlayer.hand.filter(c => c.color === color).length
    }));
    const bestColor = colorCounts.sort((a, b) => b.count - a.count)[0].color;
    return { action: 'choose_color', color: bestColor };
  }

  // Find playable cards
  const playableCards = currentPlayer.hand.filter(card => 
    canPlayCard(card, topCard, state.currentColor)
  );

  if (playableCards.length > 0) {
    // Strategy: Prefer playing action cards if next player has few cards
    // Otherwise, prefer matching color with high value cards
    
    // Simple strategy for now: pick the first playable card
    // But prioritize non-wild cards if possible to save wilds
    const nonWild = playableCards.find(c => c.color !== 'wild');
    const cardToPlay = nonWild || playableCards[0];

    return { action: 'play', cardId: cardToPlay.id };
  }

  return { action: 'draw' };
}
