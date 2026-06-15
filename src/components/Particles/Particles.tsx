import React, { useEffect, useRef, useCallback } from 'react';
import './Particles.css';

interface ParticlesProps {
  type: 'burst' | 'confetti' | 'ambient';
  active: boolean;
  x?: number;
  y?: number;
  color?: string;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'square' | 'triangle';
}

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#6c5ce7', '#00cec9', '#e17055', '#fd79a8'];

const Particles: React.FC<ParticlesProps> = ({ type, active, x, y, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animFrame = useRef<number>(0);

  const createBurstParticles = useCallback((cx: number, cy: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 6;
      newParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
        maxLife: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as Particle['shape'],
      });
    }
    return newParticles;
  }, []);

  const createConfettiParticles = useCallback((canvas: HTMLCanvasElement) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      newParticles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 3,
        vy: 1.5 + Math.random() * 3,
        size: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
        maxLife: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        shape: ['circle', 'square'][Math.floor(Math.random() * 2)] as Particle['shape'],
      });
    }
    return newParticles;
  }, []);

  const createAmbientParticles = useCallback((canvas: HTMLCanvasElement) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.2 - Math.random() * 0.3,
        size: 1 + Math.random() * 2,
        color: `rgba(108, 92, 231, ${0.1 + Math.random() * 0.2})`,
        life: 1,
        maxLife: 1,
        rotation: 0,
        rotationSpeed: 0,
        shape: 'circle',
      });
    }
    return newParticles;
  }, []);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    if (type === 'burst') {
      const cx = x ?? canvas.width / 2;
      const cy = y ?? canvas.height / 2;
      particles.current = createBurstParticles(cx, cy);
    } else if (type === 'confetti') {
      particles.current = createConfettiParticles(canvas);
    } else {
      particles.current = createAmbientParticles(canvas);
    }

    let startTime = Date.now();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = Date.now() - startTime;

      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (type === 'burst') {
          p.life -= 0.02;
          p.vy += 0.08; // gravity
        } else if (type === 'confetti') {
          p.life -= 0.003;
          p.vx += Math.sin(elapsed * 0.001 + i) * 0.03;
        } else {
          // ambient — loop
          if (p.y < -10) {
            p.y = canvas.height + 10;
            p.x = Math.random() * canvas.width;
          }
        }

        if (p.life <= 0) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'square') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size, p.size);
          ctx.lineTo(-p.size, p.size);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      if (particles.current.length > 0 || type === 'ambient') {
        if (type === 'ambient' && particles.current.length < 15) {
          particles.current.push(...createAmbientParticles(canvas).slice(0, 3));
        }
        animFrame.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    animFrame.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrame.current);
    };
  }, [active, type, x, y, onComplete, createBurstParticles, createConfettiParticles, createAmbientParticles]);

  if (!active) return null;

  return <canvas ref={canvasRef} className={`particles-canvas particles-${type}`} />;
};

export default Particles;
