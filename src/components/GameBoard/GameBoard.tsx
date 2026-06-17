import React, { useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { GameState, CardColor } from '../../types/game';
import {
  initializeGame,
  playCardAction,
  drawCardAction,
  yellUnoAction,
  chooseColorAction,
} from '../../logic/gameEngine.ts';
import { canPlayCard } from '../../logic/rules.ts';
import { makeAIMove } from '../../logic/ai.ts';
import { useSound } from '../../hooks/useSound.ts';
import Card from '../Card/Card.tsx';
import GameOverModal from '../GameOverModal/GameOverModal.tsx';
import './GameBoard.css';

type GameAction =
  | { type: 'INIT_GAME'; playerNames: string[]; humanCount: number }
  | { type: 'PLAY_CARD'; cardId: string; chosenColor?: CardColor }
  | { type: 'DRAW' }
  | { type: 'CHOOSE_COLOR'; color: CardColor }
  | { type: 'YELL_UNO' }
  | { type: 'TOGGLE_THEME' };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME':
      return initializeGame(action.playerNames, action.humanCount);
    case 'PLAY_CARD':
      return playCardAction(state, action.cardId, action.chosenColor);
    case 'DRAW':
      return drawCardAction(state);
    case 'CHOOSE_COLOR':
      return chooseColorAction(state, action.color);
    case 'YELL_UNO':
      return yellUnoAction(state);
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    default:
      return state;
  }
}

interface GameBoardProps {
  playerName: string;
  botCount: number;
  humanCount: number;
  onBackToMenu: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ playerName, botCount, humanCount, onBackToMenu }) => {
  const [state, dispatch] = useReducer(gameReducer, null as unknown as GameState);
  const [, setShowConfetti] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string; type: string }[]>([]);
  const toastIdRef = useRef(0);
  const { play, toggleMute } = useSound();

  // Handoff screen state for hot-seat multiplayer
  const [showHandoff, setShowHandoff] = useState(false);
  const [handoffPlayerName, setHandoffPlayerName] = useState('');
  // Track the last human player index we showed the handoff for
  const lastHumanIndexRef = useRef<number>(-1);

  // Use a ref to always access the latest state inside async callbacks (avoids stale closure)
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  // Track if AI is currently processing to prevent double-triggers
  const aiProcessingRef = useRef(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize game
  useEffect(() => {
    const humanNames = Array.from({ length: humanCount }, (_, i) =>
      i === 0 ? playerName : `Player ${i + 1}`
    );
    const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma'].slice(0, botCount);
    dispatch({ type: 'INIT_GAME', playerNames: [...humanNames, ...botNames], humanCount });
    lastHumanIndexRef.current = 0;
  }, [playerName, botCount, humanCount]);

  // Theme management
  useEffect(() => {
    if (state?.theme) {
      document.documentElement.setAttribute('data-theme', state.theme);
    }
  }, [state?.theme]);

  // Toast system
  const addToast = useCallback((text: string, type: string = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev.slice(-2), { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Win detection
  useEffect(() => {
    if (state?.status === 'gameover') {
      play('win');
      setShowConfetti(true);
    }
  }, [state?.status]);

  // Hot-seat multiplayer handoff: show overlay when turn shifts to a different human seat
  useEffect(() => {
    if (!state || humanCount <= 1) return;
    if (state.status === 'gameover') return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isAI) return;

    const currentHumanIdx = state.currentPlayerIndex;
    if (currentHumanIdx !== lastHumanIndexRef.current) {
      // Different human seat — show handoff overlay
      lastHumanIndexRef.current = currentHumanIdx;
      setHandoffPlayerName(currentPlayer.name);
      setShowHandoff(true);
    }
  }, [state?.currentPlayerIndex, state?.status, humanCount]);

  // AI logic — runs whenever state changes and it's an AI's turn
  useEffect(() => {
    if (!state) return;
    const currentPlayer = state.players[state.currentPlayerIndex];

    // Only trigger AI if it's an AI's turn and game is active
    if (!currentPlayer?.isAI) return;
    if (state.status === 'gameover') return;
    if (aiProcessingRef.current) return;

    aiProcessingRef.current = true;

    // Clear any pending AI action
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);

    const delay = 900 + Math.random() * 700;

    aiTimeoutRef.current = setTimeout(() => {
      // Read fresh state from ref to avoid stale closures
      const freshState = stateRef.current;
      const freshPlayer = freshState.players[freshState.currentPlayerIndex];

      // Double-check it's still AI's turn
      if (!freshPlayer?.isAI || freshState.status === 'gameover') {
        aiProcessingRef.current = false;
        return;
      }

      // Yell UNO if 2 cards left
      if (freshPlayer.hand.length === 2 && !freshState.hasYelledUno) {
        dispatch({ type: 'YELL_UNO' });
      }

      const move = makeAIMove(freshState);

      if (move.action === 'play' && move.cardId) {
        const card = freshPlayer.hand.find(c => c.id === move.cardId);
        if (card?.color === 'wild') {
          dispatch({ type: 'PLAY_CARD', cardId: move.cardId });
        } else {
          dispatch({ type: 'PLAY_CARD', cardId: move.cardId });
        }
        addToast(`${freshPlayer.name} played a card`, 'play');
        play('play');
      } else if (move.action === 'choose_color' && move.color) {
        dispatch({ type: 'CHOOSE_COLOR', color: move.color });
        addToast(`${freshPlayer.name} chose ${move.color}`, 'info');
      } else if (move.action === 'draw') {
        dispatch({ type: 'DRAW' });
        addToast(`${freshPlayer.name} drew a card`, 'draw');
        play('draw');
      }

      aiProcessingRef.current = false;
    }, delay);

    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      aiProcessingRef.current = false;
    };
  }, [
    state?.currentPlayerIndex,
    state?.status,
    state?.players?.length,
    state?.players?.[state?.currentPlayerIndex ?? 0]?.hand?.length,
  ]);

  // Game messages
  useEffect(() => {
    if (state?.message) {
      addToast(state.message, state.message.includes('UNO') ? 'uno' : 'info');
    }
  }, [state?.message]);

  if (!state) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
    </div>
  );

  const currentPlayer = state.players[state.currentPlayerIndex];
  const topCard = state.discardPile[state.discardPile.length - 1];
  const isCurrentHumanTurn =
    !currentPlayer?.isAI &&
    (state.status === 'playing' || state.status === 'waiting_for_color');
  const isPlayerTurn = isCurrentHumanTurn && !showHandoff;
  const isAITurn = currentPlayer?.isAI;
  const winnerPlayer = state.winner ? state.players.find(p => p.id === state.winner) : null;

  const handleHandCardClick = (cardId: string) => {
    if (!isPlayerTurn || (state.status !== 'playing' && state.status !== 'waiting_for_color')) return;
    const card = currentPlayer.hand.find(c => c.id === cardId);
    if (!card) return;

    if (canPlayCard(card, topCard, state.currentColor)) {
      dispatch({ type: 'PLAY_CARD', cardId });
      play('play');
    } else {
      play('invalid');
      addToast('Can\'t play that card', 'error');
    }
  };

  const handleDraw = () => {
    if (!isPlayerTurn || state.status !== 'playing') return;
    dispatch({ type: 'DRAW' });
    play('draw');
  };

  const handleColorChoice = (color: CardColor) => {
    dispatch({ type: 'CHOOSE_COLOR', color });
    play('click');
  };

  const handleUno = () => {
    dispatch({ type: 'YELL_UNO' });
    play('uno');
    addToast('UNO! 🔥', 'uno');
  };

  const handleThemeToggle = () => {
    dispatch({ type: 'TOGGLE_THEME' });
    play('click');
  };

  const handleMuteToggle = () => {
    toggleMute();
    setIsMuted(prev => !prev);
  };

  const handlePlayAgain = () => {
    const humanNames = Array.from({ length: humanCount }, (_, i) =>
      i === 0 ? playerName : `Player ${i + 1}`
    );
    const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma'].slice(0, botCount);
    dispatch({ type: 'INIT_GAME', playerNames: [...humanNames, ...botNames], humanCount });
    setShowConfetti(false);
    setShowHandoff(false);
    lastHumanIndexRef.current = 0;
    aiProcessingRef.current = false;
  };

  const handleBackToMenu = () => {
    setShowConfetti(false);
    setShowHandoff(false);
    onBackToMenu();
  };

  const handleHandoffReady = () => {
    setShowHandoff(false);
    play('click');
  };

  // Determine which human player's hand to always show at the bottom.
  // In single-human mode: always show player index 0.
  // In hot-seat mode: show the currently-active human seat.
  const viewerPlayerIndex = humanCount === 1 ? 0 : (showHandoff ? lastHumanIndexRef.current : state.currentPlayerIndex);
  const viewerPlayer = state.players[viewerPlayerIndex];
  const isViewerTurn = isPlayerTurn && state.currentPlayerIndex === viewerPlayerIndex;

  const showUnoBtn =
    isViewerTurn &&
    viewerPlayer?.hand.length === 2 &&
    !state.hasYelledUno;

  return (
    <div className={`game-board color-${state.currentColor}`}>
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.text}
          </div>
        ))}
      </div>

      {/* Hot-seat Handoff Overlay */}
      {showHandoff && (
        <div className="handoff-overlay">
          <div className="handoff-card">
            <div className="handoff-icon">🤝</div>
            <h2 className="handoff-title">Pass the device</h2>
            <p className="handoff-subtitle">
              It's <strong>{handoffPlayerName}</strong>'s turn
            </p>
            <p className="handoff-hint">Make sure no one else can see the screen!</p>
            <button id="handoff-ready-btn" className="handoff-ready-btn" onClick={handleHandoffReady}>
              <span>I'm Ready</span>
              <span className="handoff-arrow">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Top HUD */}
      <header className="top-bar">
        <div className="hud-left">
          <div className={`turn-pill ${isPlayerTurn ? 'your-turn' : ''}`}>
            <span className="turn-dot" />
            <span className="turn-text">
              {isAITurn ? (
                <><span className="ai-name">{currentPlayer?.name}</span><span className="thinking-dots"><span>.</span><span>.</span><span>.</span></span></>
              ) : (
                <>{currentPlayer?.name}'s turn</>
              )}
            </span>
          </div>
        </div>

        <div className="hud-center">
          <div className={`color-chip ${state.currentColor}`} />
          <span className="color-label">{state.currentColor}</span>
          <span className="direction-arrow">{state.direction === 1 ? '↻' : '↺'}</span>
        </div>

        <div className="hud-right">
          <button className="icon-btn" onClick={handleMuteToggle} title="Toggle sound">
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button className="icon-btn" onClick={handleThemeToggle} title="Toggle theme">
            {state.theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="icon-btn back-btn" onClick={handleBackToMenu} title="Back to menu">
            ✕
          </button>
        </div>
      </header>

      {/* Opponents row */}
      <section className="opponents-row">
        {state.players.map((player, idx) =>
          (player.isAI || (humanCount > 1 && idx !== state.currentPlayerIndex && !player.isAI)) ||
          (humanCount === 1 && idx !== 0) ? (
            <div key={player.id} className={`opponent-slot ${state.currentPlayerIndex === idx ? 'active' : ''}`}>
              <div className="opp-avatar">{player.isAI ? '🤖' : '👤'}</div>
              <div className="opp-name">{player.name}</div>
              <div className="opp-count">{player.hand.length}</div>
              <div className="opp-mini-hand">
                {Array.from({ length: Math.min(player.hand.length, 7) }).map((_, i) => (
                  <div key={i} className="mini-card-dot" />
                ))}
              </div>
            </div>
          ) : null
        )}
      </section>

      {/* Center play area */}
      <section className="play-area">
        <div className="pile-wrapper">
          <div className="pile-label">DECK</div>
          <div className={`draw-pile-btn ${isPlayerTurn && state.status === 'playing' ? 'clickable' : ''}`} onClick={handleDraw}>
            <Card card={{} as any} hidden />
            <span className="deck-count">{state.deck.length}</span>
          </div>
        </div>

        <div className="pile-wrapper">
          <div className="pile-label">DISCARD</div>
          <div className="discard-area">
            <Card card={topCard} />
          </div>
        </div>

        {/* Color picker */}
        {state.status === 'waiting_for_color' && !currentPlayer?.isAI && !showHandoff && (
          <div className="color-picker-overlay">
            <p className="color-picker-label">Choose color</p>
            <div className="color-grid">
              {(['red', 'blue', 'green', 'yellow'] as CardColor[]).map(color => (
                <button
                  key={color}
                  className={`color-btn ${color}`}
                  onClick={() => handleColorChoice(color)}
                  aria-label={color}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Player section — always visible so the human can always see their cards */}
      <section className={`player-area ${showHandoff ? 'hand-dimmed' : ''}`}>
        <div className="player-bar">
          <div className="player-info">
            <span className={`status-dot ${isViewerTurn ? 'active' : ''}`} />
            <span className="player-name-label">{viewerPlayer?.isAI ? '' : viewerPlayer?.name}</span>
            <span className="card-count-badge">{viewerPlayer?.isAI ? '' : viewerPlayer?.hand.length}</span>
            {state.hasYelledUno && !viewerPlayer?.isAI && (
              <span className="uno-badge">UNO</span>
            )}
          </div>
          {!isViewerTurn && !showHandoff && (
            <div className="waiting-label">Waiting for turn…</div>
          )}
        </div>

        {/* UNO Button — big, near the hand */}
        {showUnoBtn && (
          <div className="uno-float-zone">
            <button id="uno-call-btn" className="uno-btn-large" onClick={handleUno}>
              <span className="uno-btn-text">UNO!</span>
              <span className="uno-btn-flame">🔥</span>
            </button>
          </div>
        )}

        <div className="player-hand">
          {viewerPlayer && !viewerPlayer.isAI && viewerPlayer.hand.map((card, idx) => (
            <Card
              key={card.id}
              card={card}
              onClick={isViewerTurn ? () => handleHandCardClick(card.id) : undefined}
              isPlayable={isViewerTurn && canPlayCard(card, topCard, state.currentColor)}
              disabled={!isViewerTurn}
              animateEntry
              animateIndex={idx}
            />
          ))}
        </div>
      </section>

      {state.status === 'gameover' && winnerPlayer && (
        <GameOverModal
          winnerName={winnerPlayer.name}
          isPlayerWin={!winnerPlayer.isAI}
          scores={state.players.map(p => ({ name: p.name, cardsLeft: p.hand.length }))}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
};

export default GameBoard;
