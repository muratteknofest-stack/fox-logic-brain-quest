import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  wobble: number;
  wobbleSpeed: number;
  alpha: number;
  shape: 'rect' | 'circle' | 'star';
}

const COLORS = [
  '#F59E0B', // Gold
  '#EC4899', // Hot Pink
  '#10B981', // Emerald
  '#3B82F6', // Royal Blue
  '#8B5CF6', // Violet
  '#EF4444', // Red
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#FACC15', // Bright Yellow
];

interface ConfettiCanvasProps {
  burstKey?: number | string;
  continuous?: boolean;
}

export const ConfettiCanvas: React.FC<ConfettiCanvasProps> = ({
  burstKey = 0,
  continuous = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.parentElement?.clientHeight || window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];

    const spawnBurst = (originX: number, originY: number, count: number, spreadVx = 18, baseVy = -16) => {
      const shapes: ('rect' | 'circle' | 'star')[] = ['rect', 'circle', 'star'];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: originX + (Math.random() - 0.5) * 60,
          y: originY + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * spreadVx,
          vy: baseVy - Math.random() * 10,
          size: Math.random() * 10 + 7,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 14,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.08 + Math.random() * 0.08,
          alpha: 1,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        });
      }
    };

    // Initial triple cannon burst (left cannon, center burst, right cannon)
    spawnBurst(width * 0.15, height * 0.7, 50, 16, -18);
    spawnBurst(width * 0.5, height * 0.45, 70, 22, -15);
    spawnBurst(width * 0.85, height * 0.7, 50, 16, -18);

    let secondWaveTimer: number | undefined;
    if (continuous) {
      secondWaveTimer = window.setInterval(() => {
        spawnBurst(width * (0.2 + Math.random() * 0.6), height * 0.3, 45, 18, -12);
      }, 1400);
    }

    let animId = 0;

    const drawStar = (c: CanvasRenderingContext2D, r: number) => {
      c.beginPath();
      const spikes = 5;
      for (let i = 0; i < spikes * 2; i++) {
        const rad = i % 2 === 0 ? r : r * 0.45;
        const angle = (i * Math.PI) / spikes;
        const px = Math.cos(angle) * rad;
        const py = Math.sin(angle) * rad;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      for (const p of particles) {
        if (p.alpha <= 0.01) continue;
        alive = true;

        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 1.2;
        p.y += p.vy;
        p.vy += 0.38; // gravity
        p.vx *= 0.988; // air resistance
        p.rotation += p.vRot;
        p.alpha = Math.max(0, p.alpha - 0.0075);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, p.size * 0.65);
        }

        ctx.restore();
      }

      if (alive || continuous) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      if (secondWaveTimer) clearInterval(secondWaveTimer);
    };
  }, [burstKey, continuous]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
};

export default ConfettiCanvas;
