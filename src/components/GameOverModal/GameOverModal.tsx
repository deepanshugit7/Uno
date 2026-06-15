import React, { useEffect, useState } from 'react';
import './GameOverModal.css';

interface GameOverModalProps {
  winnerName: string;
  isPlayerWin: boolean;
  scores: { name: string; cardsLeft: number }[];
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  winnerName,
  isPlayerWin,
  scores,
  onPlayAgain,
  onBackToMenu,
}) => {
  const [visible, setVisible] = useState(false);
  const [countUp, setCountUp] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (!visible) return;
    const maxScore = Math.max(...scores.map(s => s.cardsLeft), 1);
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      setCountUp(Math.min(frame, maxScore));
      if (frame >= maxScore) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [visible, scores]);

  return (
    <div className={`game-over-overlay ${visible ? 'visible' : ''}`}>
      <div className={`game-over-modal ${visible ? 'visible' : ''}`}>
        <div className="trophy-container">
          <div className="trophy-glow"></div>
          <span className="trophy-icon">{isPlayerWin ? '🏆' : '😤'}</span>
        </div>

        <h2 className="game-over-title">
          {isPlayerWin ? 'You Win!' : 'Game Over'}
        </h2>
        <p className="winner-text">
          {isPlayerWin
            ? 'Congratulations! You emptied your hand first!'
            : `${winnerName} wins this round!`}
        </p>

        <div className="scoreboard">
          <h3 className="scoreboard-title">Scoreboard</h3>
          {scores.map((entry, idx) => (
            <div key={idx} className={`score-row ${entry.cardsLeft === 0 ? 'winner' : ''}`}>
              <div className="score-rank">
                {entry.cardsLeft === 0 ? '👑' : `#${idx + 1}`}
              </div>
              <div className="score-name">{entry.name}</div>
              <div className="score-bar-container">
                <div
                  className="score-bar"
                  style={{
                    width: `${Math.min(100, (Math.min(countUp, entry.cardsLeft) / Math.max(...scores.map(s => s.cardsLeft), 1)) * 100)}%`,
                  }}
                ></div>
              </div>
              <div className="score-cards">
                {entry.cardsLeft === 0 ? '🎉' : `${entry.cardsLeft} cards`}
              </div>
            </div>
          ))}
        </div>

        <div className="game-over-actions">
          <button className="action-btn primary" onClick={onPlayAgain}>
            🔄 Play Again
          </button>
          <button className="action-btn secondary" onClick={onBackToMenu}>
            🏠 Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
