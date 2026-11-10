import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Compass } from 'lucide-react';

interface TraviBrandIntroProps {
  onComplete?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const TraviBrandIntro: React.FC<TraviBrandIntroProps> = ({
  onComplete,
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasReducedMotion, setHasReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const handleDismiss = useCallback(() => {
    onClose();
    onComplete?.();
  }, [onClose, onComplete]);

  // Keyboard accessibility: Escape to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDismiss]);

  // Reduced motion media query listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e: MediaQueryListEvent) => setHasReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Canvas particle and trail choreography from travi-logo-transition.html
  useEffect(() => {
    if (!isOpen || hasReducedMotion) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let startTime: number | null = null;

    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    fit();
    window.addEventListener('resize', fit);

    // Color palette from reference: #3DDC97 (emerald), #48E3EF (cyan), #FFFFFF (white), #9875FF (violet)
    const COL = ['#3DDC97', '#48E3EF', '#FFFFFF', '#9875FF'];

    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      color: string;
      trail?: boolean;
    }

    interface ShockRing {
      x: number;
      y: number;
      r: number;
      v: number;
      life: number;
      maxLife: number;
      color: string;
      width: number;
    }

    const sparks: Spark[] = [];
    const shockRings: ShockRing[] = [];

    // Ambient floating stardust
    const stardust = Array.from({ length: 32 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      v: 8 + Math.random() * 16,
      phase: Math.random() * Math.PI * 2,
      size: 1 + Math.random() * 2,
      color: COL[Math.floor(Math.random() * COL.length)],
    }));

    const burst = (x: number, y: number, count = 28, speed = 320, size = 3) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const v = speed * (0.35 + Math.random() * 0.65);
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          life: 0.5 + Math.random() * 0.5,
          maxLife: 0.5 + Math.random() * 0.5,
          size: size * (0.5 + Math.random()),
          color: COL[Math.floor(Math.random() * COL.length)],
        });
      }
    };

    const shock = (x: number, y: number, v = 320, life = 0.8, color = '#3DDC97', width = 5) => {
      shockRings.push({
        x,
        y,
        r: 6,
        v,
        life,
        maxLife: life,
        color,
        width,
      });
    };

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2 - 30;

    // Trigger sequential bursts aligned with logo appearance
    const timer1 = setTimeout(() => {
      burst(centerX, centerY, 24, 280, 2.5);
      shock(centerX, centerY, 260, 0.7, '#3DDC97', 4);
    }, 450);

    const timer2 = setTimeout(() => {
      burst(centerX + 30, centerY - 25, 18, 300, 2.2);
      shock(centerX, centerY, 380, 0.85, '#48E3EF', 3);
    }, 1100);

    let lastTime = performance.now();

    const loop = (now: number) => {
      if (!startTime) startTime = now;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // 1. Draw floating ambient dust
      for (const d of stardust) {
        d.y -= (d.v * dt);
        if (d.y < -10) {
          d.y = window.innerHeight + 10;
          d.x = Math.random() * window.innerWidth;
        }
        ctx.globalAlpha = 0.2 + 0.25 * Math.sin(now * 0.002 + d.phase);
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Draw shock rings
      for (let j = shockRings.length - 1; j >= 0; j--) {
        const ring = shockRings[j];
        ring.life -= dt;
        if (ring.life <= 0) {
          shockRings.splice(j, 1);
          continue;
        }
        ring.r += ring.v * dt;
        ring.v *= (1 - 1.2 * dt);

        const alpha = Math.max(0, ring.life / ring.maxLife);
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.width * alpha + 0.5;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Draw sparks and trails
      ctx.globalCompositeOperation = 'lighter';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life -= dt;
        if (p.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= (1 - 1.5 * dt);
        p.vy *= (1 - 1.5 * dt);

        const a = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a * 2 + 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', fit);
    };
  }, [isOpen, hasReducedMotion]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Travi Cultural Intelligence Brand Transition"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#050811]/95 backdrop-blur-2xl transition-opacity duration-500 animate-fade-in"
    >
      {/* Background Interactive Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* Close / Skip button */}
      <button
        onClick={handleDismiss}
        id="btn-skip-intro"
        type="button"
        className="absolute top-6 right-6 z-30 flex items-center gap-2 rounded-full border border-white/20 bg-[#0E1626]/80 px-4 py-2 text-xs font-medium tracking-wide text-white shadow-xl backdrop-blur-md transition-all hover:bg-white/15 hover:border-white/40 active:scale-95 cursor-pointer"
      >
        <span>Skip to App</span>
        <X className="h-4 w-4" />
      </button>

      {/* Main Animated Card */}
      <div className="relative z-10 flex max-w-md flex-col items-center px-6 text-center">
        {/* Animated Glow Aura */}
        <div className="absolute -inset-10 rounded-full bg-gradient-to-tr from-[#3DDC97]/25 via-[#48E3EF]/20 to-[#9875FF]/25 blur-3xl opacity-75 animate-glow-pulse" />

        {/* SVG Logo Container with Eased Trajectory */}
        <div className="relative mb-6">
          <svg
            viewBox="0 0 200 200"
            className="h-32 w-32 drop-shadow-2xl transition-transform duration-700 hover:scale-105 sm:h-40 sm:w-40"
            role="img"
            aria-label="Travi Animated Mark"
          >
            <defs>
              <clipPath id="trv-brand-intro-clip">
                <circle cx="96" cy="100" r="62" />
              </clipPath>
            </defs>

            {/* Hard drop shadow */}
            <rect x="8" y="8" width="192" height="192" rx="46" fill="#111111" />

            {/* Main squircle badge */}
            <rect
              x="3"
              y="3"
              width="188"
              height="188"
              rx="44"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="6"
            />

            <g transform="translate(0,-3)">
              {/* Green circle base */}
              <circle cx="96" cy="100" r="62" fill="#3DDC97" />

              {/* Three jet-wake arcs */}
              <g clipPath="url(#trv-brand-intro-clip)" fill="none" stroke="#111111" strokeLinecap="round">
                <path d="M40,112 C62,134 92,128 98,110" strokeWidth="8" />
                <path d="M46,128 C68,146 100,140 110,122" strokeWidth="6" />
                <path d="M56,142 C76,154 104,150 116,136" strokeWidth="4" />
              </g>

              {/* Cyan sprouting leaf */}
              <g transform="translate(-6,-2)">
                <path
                  d="M30,78 C28,42 54,24 82,28 C84,58 62,84 30,78 Z"
                  fill="#48E3EF"
                  stroke="#111111"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <path d="M34,76 C48,60 62,46 76,34" fill="none" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
              </g>

              {/* Airplane */}
              <g transform="translate(118,76) rotate(45) scale(0.9)">
                <path
                  d="M0,-50 C4,-50 6,-40 6,-30 L6,-12 L46,14 L46,24 L6,12 L6,30 L16,40 L16,46 L0,41 L-16,46 L-16,40 L-6,30 L-6,12 L-46,24 L-46,14 L-6,-12 L-6,-30 C-6,-40 -4,-50 0,-50 Z"
                  fill="#FFFFFF"
                  stroke="#111111"
                  strokeWidth="5.5"
                  strokeLinejoin="round"
                />
              </g>
            </g>
          </svg>
        </div>

        {/* Wordmark & Tagline */}
        <h2 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-white">
          TRAVI
        </h2>
        <p className="mt-2 text-sm sm:text-base font-light text-[#48E3EF] tracking-wide">
          Mỗi miền đất, một câu chuyện.
        </p>

        <p className="mt-4 max-w-sm text-xs sm:text-sm text-[#9BA9C3] leading-relaxed font-light">
          Nền tảng khám phá điểm đến, văn hóa và trải nghiệm bản địa Việt Nam dành cho những tâm hồn lữ hành khao khát tính chân thực.
        </p>

        {/* Enter App CTA Button */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleDismiss}
            id="btn-enter-travi"
            type="button"
            className="flex items-center gap-2 rounded-xl bg-[#3DDC97] px-7 py-3.5 font-semibold text-[#111111] shadow-lg shadow-[#3DDC97]/25 transition-all hover:bg-[#48E3EF] hover:shadow-cyan-500/25 active:scale-[0.98] cursor-pointer"
          >
            <Compass className="h-4 w-4" />
            <span>Bắt đầu khám phá</span>
          </button>
        </div>
      </div>
    </div>
  );
};
