import React, { useEffect, useRef } from 'react';
import { Sparkles, Compass, ArrowRight, SlidersHorizontal, Activity } from 'lucide-react';
import { Button } from '../ui/Button.tsx';

interface SpatialHeroProps {
  onDiscoverJourney: () => void;
  onExploreDestinations: () => void;
  onOpenTasteStudio: () => void;
  activePillarsCount: number;
  totalSelectionsCount: number;
  totalDestinationsCount: number;
  isAiActive?: boolean;
}

export const SpatialHero: React.FC<SpatialHeroProps> = ({
  onDiscoverJourney,
  onExploreDestinations,
  onOpenTasteStudio,
  activePillarsCount,
  totalSelectionsCount,
  totalDestinationsCount,
  isAiActive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 480);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Connected nodes & spatial grid
    const cols = 14;
    const rows = 7;
    const points: { x: number; y: number; baseZ: number; pulse: number }[] = [];

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        points.push({
          x: (c / cols) * width,
          y: (r / rows) * height * 0.9 + height * 0.1,
          baseZ: Math.sin(c * 0.4) * Math.cos(r * 0.4),
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    // Light pulses traveling across paths
    interface LightPacket {
      fromIndex: number;
      toIndex: number;
      progress: number;
      speed: number;
      color: string;
    }

    const packets: LightPacket[] = [];
    const colors = ['#00F2FE', '#48E3EF', '#9875FF', '#3DDC97'];

    const spawnPacket = () => {
      if (points.length < 2) return;
      const idx1 = Math.floor(Math.random() * points.length);
      // Pick neighbor
      const neighborOffsets = [-1, 1, -(cols + 1), cols + 1];
      const offset = neighborOffsets[Math.floor(Math.random() * neighborOffsets.length)];
      const idx2 = idx1 + offset;
      if (idx2 >= 0 && idx2 < points.length) {
        packets.push({
          fromIndex: idx1,
          toIndex: idx2,
          progress: 0,
          speed: 0.015 + Math.random() * 0.02,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    for (let i = 0; i < 8; i++) spawnPacket();

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep perspective background fade
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#050811');
      grad.addColorStop(0.5, '#080D18');
      grad.addColorStop(1, '#050811');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      time += 0.02;

      // Draw spatial terrain grid
      ctx.strokeStyle = 'rgba(72, 227, 239, 0.07)';
      ctx.lineWidth = 1;

      // Horizontal lines with perspective curve
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const pt = points[r * (cols + 1) + c];
          if (!pt) continue;
          const wave = prefersReducedMotion ? 0 : Math.sin(time + c * 0.5 + r * 0.3) * 6;
          const y = pt.y + wave;
          if (c === 0) ctx.moveTo(pt.x, y);
          else ctx.lineTo(pt.x, y);
        }
        ctx.stroke();
      }

      // Vertical lines
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        for (let r = 0; r <= rows; r++) {
          const pt = points[r * (cols + 1) + c];
          if (!pt) continue;
          const wave = prefersReducedMotion ? 0 : Math.sin(time + c * 0.5 + r * 0.3) * 6;
          const y = pt.y + wave;
          if (r === 0) ctx.moveTo(pt.x, y);
          else ctx.lineTo(pt.x, y);
        }
        ctx.stroke();
      }

      // Draw subtle cultural signal nodes
      for (let i = 0; i < points.length; i += 3) {
        const pt = points[i];
        const wave = prefersReducedMotion ? 0 : Math.sin(time + i * 0.1) * 6;
        const pulse = Math.sin(time * 2 + pt.pulse) * 0.5 + 0.5;

        ctx.fillStyle = `rgba(72, 227, 239, ${0.15 + pulse * 0.25})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y + wave, 2 + pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Animate light packets traveling along grid edges
      if (!prefersReducedMotion) {
        for (let i = packets.length - 1; i >= 0; i--) {
          const p = packets[i];
          p.progress += p.speed;

          const p1 = points[p.fromIndex];
          const p2 = points[p.toIndex];
          if (p1 && p2) {
            const curX = p1.x + (p2.x - p1.x) * p.progress;
            const curY = p1.y + (p2.y - p1.y) * p.progress;

            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(curX, curY, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          if (p.progress >= 1) {
            packets.splice(i, 1);
            spawnPacket();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative mb-12 overflow-hidden rounded-3xl border border-[#243049] bg-gradient-to-b from-[#080D18] via-[#050811] to-[#080D18] shadow-2xl">
      {/* Background Spatial Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
        aria-hidden="true"
      />

      {/* Radiant Electric Cyan & Violet Glow Vignettes */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-[#48E3EF]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-[#9875FF]/10 blur-3xl" />

      {/* Content Container */}
      <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
        <div className="max-w-3xl">
          {/* Eyebrow Badge */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/30 bg-[#0A1628]/80 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-[#3DDC97] backdrop-blur-md shadow-[0_0_12px_rgba(61,220,151,0.15)]">
              <Sparkles className="h-3 w-3 text-[#3DDC97] animate-pulse" />
              <span>Vietnam Travel Discovery & Planning</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono border backdrop-blur-md ${
                isAiActive
                  ? 'border-[#3DDC97]/40 bg-[#3DDC97]/10 text-[#3DDC97]'
                  : 'border-[#9875FF]/40 bg-[#9875FF]/10 text-[#C4D0E5]'
              }`}
            >
              <Activity className="h-2.5 w-2.5" />
              <span>{isAiActive ? 'Vietnam Travel Engine Active' : 'Editorial Catalog Mode'}</span>
            </span>
          </div>

          {/* Central Hero Narrative */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-white leading-[1.08] mb-5">
            DISCOVER VIETNAM.{' '}
            <span className="bg-gradient-to-r from-white via-[#F4F7FF] to-[#3DDC97] bg-clip-text text-transparent">
              EXPERIENCE MORE.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#C4D0E5] font-light leading-relaxed max-w-2xl mb-8">
            Plan your journey through towering karst canyons, UNESCO imperial citadels, living craft ateliers,
            and legendary street food alleys. Experience travel calibrated to authentic Vietnam.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={onDiscoverJourney}
              className="group shadow-[0_0_20px_rgba(61,220,151,0.25)] hover:shadow-[0_0_28px_rgba(61,220,151,0.4)]"
            >
              <span>Discover My Cultural Journey</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onExploreDestinations}
              className="border-[#243049] hover:border-[#48E3EF]/50 hover:bg-[#121C30]"
            >
              <Compass className="h-4 w-4 text-[#48E3EF]" />
              <span>Explore Destinations</span>
            </Button>

            <button
              type="button"
              onClick={onOpenTasteStudio}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0E1626]/80 px-4 py-3 text-xs font-medium text-[#C4D0E5] hover:border-[#9875FF]/40 hover:text-white backdrop-blur-md transition-all cursor-pointer"
              title="Calibrate your 8 cultural pillars"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#9875FF]" />
              <span>Calibrate Taste Studio</span>
            </button>
          </div>

          {/* Real Live Telemetry Stats HUD */}
          <div className="mt-10 pt-6 border-t border-[#243049]/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="rounded-xl border border-white/5 bg-[#0E1626]/40 p-3 backdrop-blur-sm">
              <div className="text-[10px] uppercase font-mono text-[#9BA9C3] tracking-wider mb-1">
                Active Pillars
              </div>
              <div className="text-xl font-serif font-semibold text-white">
                {activePillarsCount}{' '}
                <span className="text-xs font-sans font-normal text-[#9BA9C3]">/ 8 Dimensions</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#0E1626]/40 p-3 backdrop-blur-sm">
              <div className="text-[10px] uppercase font-mono text-[#9BA9C3] tracking-wider mb-1">
                Taste Signals
              </div>
              <div className="text-xl font-serif font-semibold text-[#48E3EF]">
                {totalSelectionsCount}{' '}
                <span className="text-xs font-sans font-normal text-[#9BA9C3]">Selections</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#0E1626]/40 p-3 backdrop-blur-sm">
              <div className="text-[10px] uppercase font-mono text-[#9BA9C3] tracking-wider mb-1">
                Verified Pool
              </div>
              <div className="text-xl font-serif font-semibold text-[#3DDC97]">
                {totalDestinationsCount}{' '}
                <span className="text-xs font-sans font-normal text-[#9BA9C3]">Sanctuaries</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#0E1626]/40 p-3 backdrop-blur-sm">
              <div className="text-[10px] uppercase font-mono text-[#9BA9C3] tracking-wider mb-1">
                Mass Tourism
              </div>
              <div className="text-xl font-serif font-semibold text-white">
                0%{' '}
                <span className="text-xs font-sans font-normal text-[#9BA9C3]">Isolation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
