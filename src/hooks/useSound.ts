import { useCallback, useRef } from 'react';

type SoundType = 'play' | 'draw' | 'match' | 'invalid' | 'uno' | 'win' | 'click' | 'turn';

const audioCtxRef: { current: AudioContext | null } = { current: null };

function getAudioContext(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtxRef.current;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio context is not available
  }
}

function playNoise(duration: number, volume: number = 0.05) {
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {
    // Silently fail
  }
}

const soundEffects: Record<SoundType, () => void> = {
  play: () => {
    playTone(520, 0.1, 'triangle', 0.12);
    setTimeout(() => playTone(680, 0.15, 'triangle', 0.1), 60);
  },
  draw: () => {
    playNoise(0.08, 0.06);
    playTone(300, 0.12, 'triangle', 0.08);
  },
  match: () => {
    playTone(523, 0.12, 'sine', 0.12);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.12), 80);
    setTimeout(() => playTone(784, 0.2, 'sine', 0.15), 160);
  },
  invalid: () => {
    playTone(200, 0.15, 'sawtooth', 0.08);
    setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.08), 100);
  },
  uno: () => {
    playTone(440, 0.1, 'square', 0.1);
    setTimeout(() => playTone(550, 0.1, 'square', 0.1), 80);
    setTimeout(() => playTone(660, 0.1, 'square', 0.1), 160);
    setTimeout(() => playTone(880, 0.25, 'square', 0.12), 240);
  },
  win: () => {
    const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sine', 0.12), i * 100);
    });
  },
  click: () => {
    playTone(800, 0.05, 'sine', 0.06);
  },
  turn: () => {
    playTone(440, 0.08, 'triangle', 0.06);
    setTimeout(() => playTone(520, 0.12, 'triangle', 0.08), 60);
  },
};

export function useSound() {
  const muted = useRef(false);

  const play = useCallback((sound: SoundType) => {
    if (muted.current) return;
    soundEffects[sound]();
  }, []);

  const toggleMute = useCallback(() => {
    muted.current = !muted.current;
    return muted.current;
  }, []);

  const isMuted = useCallback(() => muted.current, []);

  return { play, toggleMute, isMuted };
}
