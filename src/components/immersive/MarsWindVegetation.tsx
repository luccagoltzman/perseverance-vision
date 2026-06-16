import { useEffect, useRef } from 'react';
import { windToAnimationParams } from '@/utils/windPhysics';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface MarsWindVegetationProps {
  windSpeed: number;
  windDirection: string;
  className?: string;
}

interface Blade {
  x: number;
  height: number;
  width: number;
  phase: number;
  hue: number;
  lightness: number;
  kind: 'grass' | 'wheat' | 'fern';
  depth: number;
}

function createBlades(count: number, width: number): Blade[] {
  return Array.from({ length: count }, (_, i) => {
    const depth = 0.3 + Math.random() * 0.7;
    const roll = Math.random();
    return {
      x: (i / count) * width + (Math.random() - 0.5) * (width / count) * 1.8,
      height: (35 + Math.random() * 90) * depth,
      width: (1.2 + Math.random() * 2.8) * depth,
      phase: Math.random() * Math.PI * 2,
      hue: 88 + Math.random() * 38,
      lightness: 28 + Math.random() * 22,
      kind: roll > 0.88 ? 'wheat' : roll > 0.72 ? 'fern' : 'grass',
      depth,
    };
  });
}

export function MarsWindVegetation({
  windSpeed,
  windDirection,
  className = '',
}: MarsWindVegetationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bladesRef = useRef<Blade[]>([]);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bladesRef.current = createBlades(Math.floor(rect.width * 0.55), rect.width);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let time = 0;
    let frame: number;
    const params = () => windToAnimationParams(windSpeed, windDirection);

    const drawBlade = (
      blade: Blade,
      baseY: number,
      bend: number,
      leanX: number,
    ) => {
      const { x, height, width, hue, lightness, kind } = blade;
      const tipX = x + bend + leanX * (height / 80);
      const tipY = baseY - height;
      const ctrlX = x + bend * 0.45 + leanX * 0.3;
      const ctrlY = baseY - height * 0.55;

      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
      ctx.lineWidth = width;
      ctx.strokeStyle = `hsla(${hue}, 52%, ${lightness}%, ${0.55 + blade.depth * 0.45})`;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (kind === 'wheat') {
        ctx.beginPath();
        ctx.ellipse(tipX, tipY + 4, width * 2.2, height * 0.07, bend * 0.02, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue - 8}, 48%, ${lightness + 12}%, 0.75)`;
        ctx.fill();
      }

      if (kind === 'fern') {
        for (let i = 1; i <= 4; i++) {
          const t = i / 5;
          const px = x + (tipX - x) * t + bend * t * 0.5;
          const py = baseY - height * t;
          const side = i % 2 === 0 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.quadraticCurveTo(
            px + side * (8 + bend * 0.1),
            py - 6,
            px + side * 14,
            py - 2,
          );
          ctx.lineWidth = width * 0.7;
          ctx.strokeStyle = `hsla(${hue + 10}, 45%, ${lightness + 8}%, 0.65)`;
          ctx.stroke();
        }
      }
    };

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const p = params();
      time += reducedMotion ? 0 : 0.016;

      ctx.clearRect(0, 0, w, h);

      const groundGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
      groundGrad.addColorStop(0, 'rgba(20, 45, 18, 0)');
      groundGrad.addColorStop(0.35, 'rgba(18, 52, 20, 0.35)');
      groundGrad.addColorStop(1, 'rgba(8, 22, 10, 0.92)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, h * 0.45, w, h * 0.55);

      const sorted = [...bladesRef.current].sort((a, b) => a.depth - b.depth);
      const baseY = h * 0.97;
      const leanX = Math.cos(p.leanRadians) * p.amplitude * 0.35;

      for (const blade of sorted) {
        const gust =
          Math.sin(time * p.gustFrequency + blade.phase) * p.gustIntensity;
        const sway =
          Math.sin(time * p.frequency + blade.phase) * p.amplitude +
          gust * p.amplitude * 0.45;
        const bend = reducedMotion ? leanX * 0.5 : sway + leanX;
        drawBlade(blade, baseY, bend, leanX);
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [windSpeed, windDirection, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden
    />
  );
}
