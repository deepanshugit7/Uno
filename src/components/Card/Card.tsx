import React, { useState } from 'react';
import { Card as CardType } from '../../types/game';
import './Card.css';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  hidden?: boolean;
  isPlayable?: boolean;
  selected?: boolean;
  animateEntry?: boolean;
  animateIndex?: number;
}

const Card: React.FC<CardProps> = ({
  card,
  onClick,
  disabled,
  hidden,
  isPlayable,
  selected,
  animateEntry,
  animateIndex = 0,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled || !onClick) return;
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    onClick();
  };

  if (hidden) {
    return (
      <div
        className={`card card-back ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        style={animateEntry ? { animationDelay: `${animateIndex * 50}ms` } : undefined}
      >
        <div className="card-back-inner">
          <div className="card-back-pattern"></div>
          <div className="uno-logo">UNO</div>
        </div>
      </div>
    );
  }

  const getCardContent = () => {
    switch (card.type) {
      case 'number':
        return card.value;
      case 'skip':
        return 'Ø';
      case 'reverse':
        return '⇄';
      case 'draw_2':
        return '+2';
      case 'wild':
        return 'W';
      case 'wild_draw_4':
        return '+4';
      default:
        return '';
    }
  };

  const getCardLabel = () => {
    switch (card.type) {
      case 'wild':
        return 'WILD';
      case 'wild_draw_4':
        return 'WILD';
      default:
        return '';
    }
  };

  const content = getCardContent();
  const label = getCardLabel();

  return (
    <div
      className={`card card-${card.color} ${isPlayable ? 'playable' : ''} ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''} ${isPressed ? 'pressed' : ''} ${animateEntry ? 'animate-entry' : ''} type-${card.type}`}
      onClick={handleClick}
      style={animateEntry ? { animationDelay: `${animateIndex * 60}ms` } : undefined}
    >
      <div className="card-face">
        <div className="card-corner card-top-left">
          <span className="corner-value">{content}</span>
          {label && <span className="corner-label">{label}</span>}
        </div>

        <div className="card-center">
          <div className="card-oval">
            {card.type === 'wild' || card.type === 'wild_draw_4' ? (
              <div className="wild-circles">
                <div className="circle red"></div>
                <div className="circle blue"></div>
                <div className="circle yellow"></div>
                <div className="circle green"></div>
              </div>
            ) : (
              <span className="center-value">{content}</span>
            )}
          </div>
        </div>

        <div className="card-corner card-bottom-right">
          <span className="corner-value">{content}</span>
          {label && <span className="corner-label">{label}</span>}
        </div>
      </div>

      {isPlayable && <div className="playable-glow"></div>}
      {selected && <div className="selected-glow"></div>}
    </div>
  );
};

export default Card;
