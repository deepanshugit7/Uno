import { Card, GameState, GameStatus, Player, CardColor } from '../types/game.ts';
import { createDeck, shuffleDeck } from './deck.ts';
import { canPlayCard } from './rules.ts';

export const INITIAL_HAND_SIZE = 7;

/**
 * Helper to draw cards from deck, reshuffling if necessary.
 */
const drawFromDeck = (state: GameState, count: number): { cards: Card[], newState: GameState } => {
  let { deck, discardPile } = state;
  const drawnCards: Card[] = [];
  let currentDeck = [...deck];
  let currentDiscard = [...discardPile];

  for (let i = 0; i < count; i++) {
    if (currentDeck.length === 0) {
      if (currentDiscard.length <= 1) break; // No more cards available
      const topCard = currentDiscard.pop()!;
      currentDeck = shuffleDeck(currentDiscard);
      currentDiscard = [topCard];
    }
    const card = currentDeck.pop();
    if (card) drawnCards.push(card);
  }

  return {
    cards: drawnCards,
    newState: { ...state, deck: currentDeck, discardPile: currentDiscard }
  };
};

export const nextPlayerIndex = (currentIndex: number, playerCount: number, direction: 1 | -1, skip: number = 1): number => {
  let next = (currentIndex + (direction * skip)) % playerCount;
  while (next < 0) next += playerCount;
  return next;
};

export const initializeGame = (playerNames: string[], humanCount: number = 1): GameState => {
  let deck = shuffleDeck(createDeck());
  const players: Player[] = playerNames.map((name, index) => ({
    id: index.toString(),
    name,
    hand: [],
    isAI: index >= humanCount,
    score: 0,
  }));

  // Deal cards
  for (const player of players) {
    for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
      const card = deck.pop();
      if (card) player.hand.push(card);
    }
  }

  // Initial discard pile
  let firstCard = deck.pop()!;
  while (firstCard.type === 'wild_draw_4') {
    deck.unshift(firstCard);
    deck = shuffleDeck(deck);
    firstCard = deck.pop()!;
  }

  const discardPile = [firstCard];
  
  let currentPlayerIndex = 0;
  let direction: 1 | -1 = 1;
  let status: GameStatus = 'playing';
  let message: string | undefined;

  // Handle action cards at start
  if (firstCard.type === 'skip') {
    currentPlayerIndex = nextPlayerIndex(0, players.length, 1, 2);
    message = `${players[0].name} was skipped!`;
  } else if (firstCard.type === 'reverse') {
    direction = -1;
    currentPlayerIndex = 0; // In 2 player, it stays 0 (dealer plays first? wait). 
    // Actually, in Uno, Reverse at start means dealer plays first then play goes to the right.
    // For simplicity, we'll just start at 0 with reversed direction.
  } else if (firstCard.type === 'draw_2') {
    const { cards, newState: stateAfterDraw } = drawFromDeck({ deck, discardPile, players, currentPlayerIndex: 0, direction: 1, status: 'playing', winner: null, currentColor: firstCard.color, hasYelledUno: false, theme: 'dark' }, 2);
    players[0].hand.push(...cards);
    deck = stateAfterDraw.deck;
    currentPlayerIndex = nextPlayerIndex(0, players.length, 1, 2);
    message = `${players[0].name} draws 2 and is skipped!`;
  } else if (firstCard.type === 'wild') {
    status = 'waiting_for_color';
  }

  return {
    deck,
    discardPile,
    players,
    currentPlayerIndex,
    direction,
    status,
    winner: null,
    currentColor: firstCard.color === 'wild' ? 'red' : firstCard.color,
    currentValue: firstCard.type === 'number' ? firstCard.value : firstCard.type,
    hasYelledUno: false,
    theme: 'dark',
    message,
  };
};

export const playCardAction = (state: GameState, cardId: string, chosenColor?: CardColor): GameState => {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = currentPlayer.hand[cardIndex];
  const topCard = state.discardPile[state.discardPile.length - 1];

  if (!canPlayCard(card, topCard, state.currentColor)) {
    return { ...state, message: "Cannot play that card!" };
  }

  // Remove card from hand
  const newHand = currentPlayer.hand.filter((_, idx) => idx !== cardIndex);
  
  // UNO penalty check: if player has 1 card left after playing and didn't yell UNO
  let penaltyCards: Card[] = [];
  let penaltyState = state;
  if (newHand.length === 1 && !state.hasYelledUno) {
    const result = drawFromDeck(state, 2);
    penaltyCards = result.cards;
    penaltyState = result.newState;
  }

  const newPlayers = penaltyState.players.map((p, idx) => 
    idx === state.currentPlayerIndex ? { ...p, hand: [...newHand, ...penaltyCards] } : p
  );

  let newState: GameState = {
    ...penaltyState,
    players: newPlayers,
    discardPile: [...penaltyState.discardPile, card],
    currentColor: card.color === 'wild' ? (chosenColor || state.currentColor) : card.color,
    currentValue: card.type === 'number' ? card.value : card.type,
    message: penaltyCards.length > 0 ? `${currentPlayer.name} forgot to yell UNO! +2 cards.` : undefined,
  };

  // Check for Win
  if (newHand.length === 0) {
    newState.status = 'gameover';
    newState.winner = currentPlayer.id;
    return newState;
  }

  // Handle Action Cards
  let skipCount = 1;
  let cardsToDraw = 0;

  if (card.type === 'skip') {
    skipCount = 2;
  } else if (card.type === 'reverse') {
    if (state.players.length === 2) {
      skipCount = 2;
    } else {
      newState.direction = state.direction === 1 ? -1 : 1;
    }
  } else if (card.type === 'draw_2') {
    cardsToDraw = 2;
    skipCount = 2;
  } else if (card.type === 'wild_draw_4') {
    cardsToDraw = 4;
    skipCount = 2;
  }

  // Apply draw penalty to next player
  if (cardsToDraw > 0) {
    const targetIdx = nextPlayerIndex(state.currentPlayerIndex, state.players.length, newState.direction);
    const { cards, newState: stateAfterDraw } = drawFromDeck(newState, cardsToDraw);
    newState = stateAfterDraw;
    newState.players = newState.players.map((p, idx) => 
      idx === targetIdx ? { ...p, hand: [...p.hand, ...cards] } : p
    );
    newState.message = `${newState.players[targetIdx].name} draws ${cardsToDraw} and is skipped!`;
  }

  // Transition turn
  if (card.color === 'wild' && !chosenColor) {
    newState.status = 'waiting_for_color';
  } else {
    newState.currentPlayerIndex = nextPlayerIndex(newState.currentPlayerIndex, newState.players.length, newState.direction, skipCount);
    newState.hasYelledUno = false;
  }

  return newState;
};

export const drawCardAction = (state: GameState): GameState => {
  const { cards, newState: stateAfterDraw } = drawFromDeck(state, 1);
  if (cards.length === 0) return state;

  const card = cards[0];
  const currentPlayer = stateAfterDraw.players[stateAfterDraw.currentPlayerIndex];
  const topCard = stateAfterDraw.discardPile[stateAfterDraw.discardPile.length - 1];

  const newPlayers = stateAfterDraw.players.map((p, idx) => 
    idx === stateAfterDraw.currentPlayerIndex ? { ...p, hand: [...p.hand, card] } : p
  );

  const newState = { ...stateAfterDraw, players: newPlayers };

  // If drawn card is not playable, advance turn.
  // If it IS playable, stay on current turn so player/AI can choose to play it.
  if (!canPlayCard(card, topCard, newState.currentColor)) {
    newState.currentPlayerIndex = nextPlayerIndex(newState.currentPlayerIndex, newState.players.length, newState.direction);
    newState.message = `${currentPlayer.name} drew a card.`;
  } else {
    newState.message = `${currentPlayer.name} drew a playable card!`;
  }

  return newState;
};

export const chooseColorAction = (state: GameState, color: CardColor): GameState => {
  const lastCard = state.discardPile[state.discardPile.length - 1];
  const skipCount = (lastCard.type === 'wild_draw_4') ? 2 : 1;

  const newState: GameState = { 
    ...state, 
    currentColor: color, 
    status: 'playing',
    currentPlayerIndex: nextPlayerIndex(state.currentPlayerIndex, state.players.length, state.direction, skipCount),
    hasYelledUno: false,
  };
  
  return newState;
};

export const yellUnoAction = (state: GameState): GameState => {
  return { ...state, hasYelledUno: true, message: "UNO!" };
};
