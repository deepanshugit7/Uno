import React, { useState } from 'react';
import './StartScreen.css';

interface StartScreenProps {
  onStart: (playerName: string, botCount: number, humanCount: number) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [playerName, setPlayerName] = useState('');
  const [humanCount, setHumanCount] = useState(1);
  const [botCount, setBotCount] = useState(2);
  const [isAnimating, setIsAnimating] = useState(false);

  // Keep total players ≤ 4
  const maxBots = 4 - humanCount;
  const minBots = humanCount === 1 ? 1 : 0;
  const adjustedBotCount = Math.min(Math.max(botCount, minBots), maxBots);
  const botOptions = Array.from({ length: maxBots - minBots + 1 }, (_, i) => i + minBots);
  const totalPlayers = humanCount + adjustedBotCount;

  const handleHumanChange = (count: number) => {
    setHumanCount(count);
    const newMax = 4 - count;
    const newMin = count === 1 ? 1 : 0;
    setBotCount(prev => Math.min(Math.max(prev, newMin), newMax));
  };

  const handleStart = () => {
    if (!playerName.trim()) return;
    setIsAnimating(true);
    setTimeout(() => {
      onStart(playerName.trim(), adjustedBotCount, humanCount);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleStart();
  };

  return (
    <div className={`start-screen ${isAnimating ? 'exiting' : ''}`}>
      {/* Floating card decorations */}
      <div className="floating-cards">
        {['🃏', '🂠', '🂡', '🂢', '🃏', '🂣'].map((emoji, i) => (
          <div
            key={i}
            className="floating-card"
            style={{
              left: `${10 + i * 15}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <div className="start-content">
        <div className="logo-container">
          <div className="logo-glow"></div>
          <h1 className="game-logo">
            <span className="logo-u">U</span>
            <span className="logo-n">N</span>
            <span className="logo-o">O</span>
          </h1>
          <p className="logo-subtitle">The Classic Card Game</p>
        </div>

        <div className="start-form">
          <div className="input-group">
            <label htmlFor="player-name" className="input-label">
              {humanCount > 1 ? 'Player 1 Name' : 'Your Name'}
            </label>
            <input
              id="player-name"
              type="text"
              className="name-input"
              placeholder="Enter your name..."
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={15}
              autoFocus
            />
          </div>

          {/* Human player count selector */}
          <div className="input-group">
            <label className="input-label">Human Players</label>
            <div className="player-selector">
              {[1, 2, 3, 4].map(count => (
                <button
                  key={count}
                  id={`human-count-${count}`}
                  className={`player-option ${humanCount === count ? 'active' : ''}`}
                  onClick={() => handleHumanChange(count)}
                >
                  <span className="player-icon">👤</span>
                  <span className="player-count">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bot count selector — hidden when 4 humans */}
          {maxBots > 0 && (
            <div className="input-group">
              <label className="input-label">Number of Bots</label>
              <div className="bot-selector">
                {botOptions.map(count => (
                  <button
                    key={count}
                    id={`bot-count-${count}`}
                    className={`bot-option ${adjustedBotCount === count ? 'active' : ''}`}
                    onClick={() => setBotCount(count)}
                  >
                    <span className="bot-icon">{count === 0 ? '🚫' : '🤖'}</span>
                    <span className="bot-count">{count === 0 ? 'None' : count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Total players indicator */}
          <div className="total-players-hint">
            <span>{totalPlayers} players total</span>
            {humanCount > 1 && (
              <span className="multiplayer-tag">✨ Multiplayer</span>
            )}
          </div>

          <button
            id="start-game-btn"
            className={`start-btn ${!playerName.trim() ? 'disabled' : ''}`}
            onClick={handleStart}
            disabled={!playerName.trim()}
          >
            <span className="btn-text">Start Game</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>

        <div className="rules-hint">
          <details>
            <summary className="rules-toggle">📖 How to Play</summary>
            <div className="rules-content">
              <p>Match cards by <strong>Color, Number, or Symbol</strong>.</p>
              <p>Special cards like <strong>Skip, Reverse,</strong> and <strong>Draw 2</strong> add excitement!</p>
              <p>When you have <strong>1 card left</strong>, yell <strong>UNO!</strong> or face a penalty.</p>
              <p><strong>Wild cards</strong> let you choose the next color. <strong>Wild Draw 4</strong> is the ultimate weapon!</p>
              {humanCount > 1 && <p>📱 <strong>Pass the device</strong> to each player on their turn!</p>}
              <p>First player to empty their hand <strong>wins!</strong></p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
