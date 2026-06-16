import { useEffect, useRef } from 'react';
import { windToAnimationParams } from '@/utils/windPhysics';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface MarsDustFieldProps {
  windSpeed: number;
  windDirection: string;
  density?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  depth: number;
}

export function MarsDustField({
  windSpeed,
  windDirection,
  density = 60,
  className = '',
}: MarsDustFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const spawn = (w: number, h: number): Particle[] =>
      Array.from({ length: density }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 0.4 + Math.random() * 2.2,
        opacity: 0.08 + Math.random() * 0.35,
        speed: 0.4 + Math.random() * 1.2,
        depth: 0.2 + Math.random() * 0.8,
      }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesRef.current = spawn(rect.width, rect.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let frame: number;
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const p = windToAnimationParams(windSpeed, windDirection);
      const vx = Math.cos(p.leanRadians) * p.particleSpeed;
      const vy = Math.sin(p.leanRadians) * p.particleSpeed * 0.15 - 0.05;

      ctx.clearRect(0, 0, w, h);

      for (const pt of particlesRef.current) {
        if (!reducedMotion) {
          pt.x += vx * pt.speed * pt.depth;
          pt.y += vy * pt.speed * pt.depth;
          if (pt.x > w + 4) pt.x = -4;
          if (pt.x < -4) pt.x = w + 4;
          if (pt.y > h + 4) pt.y = -4;
          if (pt.y < -4) pt.y = h + 4;
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * pt.depth, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 140, 80, ${pt.opacity * pt.depth})`;
        ctx.fill();
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [windSpeed, windDirection, density, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none mix-blend-screen opacity-70 ${className}`}
      aria-hidden
    />
  );
}
