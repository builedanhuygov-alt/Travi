import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowRight,
  X,
  Calendar
} from 'lucide-react';
import { vietnamDestinations, VIETNAM_REGIONS } from '../../data/vietnamData.ts';
import type { VietnamDestination, VietnamRegion } from '../../types/vietnam.ts';
import { Badge } from '../ui/Badge.tsx';
import { Button } from '../ui/Button.tsx';

interface VietnamInteractiveMapProps {
  onSelectDestination?: (dest: VietnamDestination) => void;
  selectedDestinationId?: string | null;
  highlightedIds?: string[];
  routeConnectors?: string[]; // IDs of destinations to connect with route line
  className?: string;
}

// Vietnam Geographic Bounding Box for Mercator Projection
const GEO_BOUNDS = {
  minLat: 8.2, // Southernmost coastal islands
  maxLat: 23.6, // Northernmost point at Lung Cu
  minLng: 102.0, // Western border
  maxLng: 110.2, // Eastern coast and islands
};

const REGION_COLORS: Record<VietnamRegion, { pin: string; fill: string; border: string }> = {
  'Northern Vietnam': { pin: '#10B981', fill: '#10B981', border: '#059669' },
  'Central Vietnam': { pin: '#3DDC97', fill: '#3DDC97', border: '#10B981' },
  'Central Highlands': { pin: '#F59E0B', fill: '#F59E0B', border: '#D97706' },
  'Southern Vietnam': { pin: '#06B6D4', fill: '#06B6D4', border: '#0891B2' },
};

export const VietnamInteractiveMap: React.FC<VietnamInteractiveMapProps> = ({
  onSelectDestination,
  selectedDestinationId = null,
  highlightedIds = [],
  routeConnectors = [],
  className = '',
}) => {
  const [activeRegion, setActiveRegion] = useState<string>('All');
  const [selectedDest, setSelectedDest] = useState<VietnamDestination | null>(() => {
    return selectedDestinationId
      ? vietnamDestinations.find((d) => d.id === selectedDestinationId) || null
      : null;
  });

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Sync external selected destination
  useEffect(() => {
    if (selectedDestinationId) {
      queueMicrotask(() => {
        const match = vietnamDestinations.find((d) => d.id === selectedDestinationId);
        if (match) setSelectedDest(match);
      });
    }
  }, [selectedDestinationId]);

  // Convert real geographic lat/lng to SVG percentage coordinates (0 - 1000 x 0 - 1400)
  const projectCoordinates = useCallback((lat: number, lng: number) => {
    const svgWidth = 700;
    const svgHeight = 1100;

    // Normalization with padding
    const xFraction = (lng - GEO_BOUNDS.minLng) / (GEO_BOUNDS.maxLng - GEO_BOUNDS.minLng);
    const yFraction = 1 - (lat - GEO_BOUNDS.minLat) / (GEO_BOUNDS.maxLat - GEO_BOUNDS.minLat);

    return {
      x: Math.round(xFraction * svgWidth),
      y: Math.round(yFraction * svgHeight),
    };
  }, []);

  // Filtered destinations
  const filteredDestinations = useMemo(() => {
    return vietnamDestinations.filter((dest) => {
      return activeRegion === 'All' || dest.region === activeRegion;
    });
  }, [activeRegion]);

  // Calculate route connecting line points
  const routePoints = useMemo(() => {
    if (!routeConnectors || routeConnectors.length < 2) return '';
    const points = routeConnectors
      .map((id) => vietnamDestinations.find((d) => d.id === id))
      .filter((d): d is VietnamDestination => Boolean(d))
      .map((d) => {
        const { x, y } = projectCoordinates(d.coordinates.lat, d.coordinates.lng);
        return `${x},${y}`;
      });
    return points.join(' ');
  }, [routeConnectors, projectCoordinates]);

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.3));
  const handleZoomOut = () => setZoom((z) => Math.max(0.8, z - 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch pan handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div
      ref={mapContainerRef}
      className={`relative flex flex-col rounded-3xl border border-[#243049] bg-gradient-to-b from-[#0B1324] via-[#080D18] to-[#050811] overflow-hidden shadow-2xl ${className}`}
    >
      {/* Top Filter Bar */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[#243049]/70 bg-[#0E1626]/90 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3DDC97]/15 border border-[#3DDC97]/30 text-[#3DDC97]">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              Interactive Vietnam Map
              <span className="text-[10px] font-normal text-[#9BA9C3]">
                ({filteredDestinations.length} destinations plotted)
              </span>
            </h3>
            <p className="text-[11px] text-[#9BA9C3]">
              Geographic Overview (Equirectangular SVG Projection) • Conceptual linkages, not road navigation
            </p>
          </div>
        </div>


        {/* Region Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveRegion('All')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              activeRegion === 'All'
                ? 'bg-[#18253E] text-white border border-white/20'
                : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
            }`}
          >
            All Regions
          </button>
          {VIETNAM_REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all ${
                activeRegion === region
                  ? 'bg-[#3DDC97]/20 text-[#3DDC97] border border-[#3DDC97]/40 shadow-sm'
                  : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
              }`}
            >
              {region.replace(' Vietnam', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div
        className="relative flex-1 min-h-[500px] sm:min-h-[620px] w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Subtle Map Grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #48E3EF 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Interactive SVG Projection */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <svg
            viewBox="0 0 700 1100"
            className="w-full h-full max-w-[850px] max-h-[1100px] drop-shadow-[0_0_40px_rgba(16,185,129,0.08)] pointer-events-auto"
            aria-label="Map of Vietnam"
          >
            <defs>
              <linearGradient id="vietnamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#121D33" />
                <stop offset="50%" stopColor="#0E182A" />
                <stop offset="100%" stopColor="#0B1324" />
              </linearGradient>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Vietnam S-Curve Stylized Geographic Silhouette */}
            <path
              d="M 280 40 
                 Q 360 40, 420 80 
                 T 480 130 
                 Q 490 190, 440 210 
                 T 380 230 
                 Q 340 270, 320 340 
                 T 360 420 
                 Q 410 470, 440 520 
                 T 460 600 
                 Q 470 680, 480 730 
                 T 440 820 
                 Q 410 880, 370 910 
                 T 320 950 
                 Q 280 970, 260 1010 
                 T 210 1020 
                 Q 190 990, 210 950 
                 T 250 910 
                 Q 280 870, 290 820 
                 T 320 730 
                 Q 330 650, 310 560 
                 T 270 450 
                 Q 240 370, 230 290 
                 T 190 200 
                 Q 170 120, 220 70 
                 Z"
              fill="url(#vietnamGrad)"
              stroke="#24375A"
              strokeWidth="2.5"
              className="transition-colors hover:stroke-[#3DDC97]/40"
            />

            {/* Maritime Sea Water Texture & Gulf Label */}
            <text x="520" y="240" fill="#2E4369" fontSize="13" fontStyle="italic" letterSpacing="2">
              Gulf of Tonkin (Vịnh Bắc Bộ)
            </text>
            <text x="500" y="580" fill="#2E4369" fontSize="14" fontStyle="italic" letterSpacing="3">
              East Sea (Biển Đông)
            </text>
            <text x="140" y="980" fill="#2E4369" fontSize="13" fontStyle="italic" letterSpacing="2">
              Gulf of Thailand (Vịnh Thái Lan)
            </text>

            {/* Offshore Archipelago Indicator Rings */}
            {/* Hoàng Sa & Trường Sa Sovereign Archipelagos */}
            <g opacity="0.6">
              <circle cx="580" cy="500" r="14" fill="none" stroke="#2E4369" strokeDasharray="3,3" />
              <text x="580" y="525" fill="#4B628A" fontSize="10" textAnchor="middle">
                Quần đảo Hoàng Sa (Vietnam)
              </text>
              <circle cx="560" cy="790" r="18" fill="none" stroke="#2E4369" strokeDasharray="3,3" />
              <text x="560" y="820" fill="#4B628A" fontSize="10" textAnchor="middle">
                Quần đảo Trường Sa (Vietnam)
              </text>
            </g>

            {/* Route Connecting Lines */}
            {routePoints && (
              <polyline
                points={routePoints}
                fill="none"
                stroke="#3DDC97"
                strokeWidth="3"
                strokeDasharray="6,4"
                className="animate-pulse"
              />
            )}

            {/* Destination Pins on SVG */}
            {filteredDestinations.map((dest) => {
              const { x, y } = projectCoordinates(dest.coordinates.lat, dest.coordinates.lng);
              const isSelected = selectedDest?.id === dest.id;
              const isHighlighted = highlightedIds.includes(dest.id);
              const colors = REGION_COLORS[dest.region] || REGION_COLORS['Northern Vietnam'];

              return (
                <g
                  key={dest.id}
                  transform={`translate(${x}, ${y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDest(dest);
                    onSelectDestination?.(dest);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Outer selection beacon ring */}
                  {(isSelected || isHighlighted) && (
                    <circle
                      r="18"
                      fill={colors.pin}
                      opacity="0.25"
                      className="animate-ping"
                    />
                  )}

                  {/* Marker Glow Background */}
                  <circle
                    r={isSelected ? 10 : 7}
                    fill={colors.pin}
                    stroke="#080D18"
                    strokeWidth="2.5"
                    filter="url(#glow)"
                    className="transition-all duration-200 group-hover:scale-125"
                  />

                  {/* Center Dot */}
                  <circle
                    r={isSelected ? 4 : 2.5}
                    fill="#FFFFFF"
                    className="pointer-events-none"
                  />

                  {/* Destination Label Pill */}
                  <text
                    x="12"
                    y="4"
                    fill={isSelected ? '#3DDC97' : '#FFFFFF'}
                    fontSize="11"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    className="transition-all pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] select-none"
                  >
                    {dest.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Floating Zoom & Map Controls */}
        <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-1.5 rounded-xl border border-[#243049] bg-[#0E1626]/90 p-1.5 backdrop-blur-md shadow-lg">
          <button
            onClick={handleZoomIn}
            aria-label="Zoom in map"
            className="rounded-lg p-2 text-[#9BA9C3] hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            aria-label="Zoom out map"
            className="rounded-lg p-2 text-[#9BA9C3] hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetView}
            aria-label="Reset map view"
            className="rounded-lg p-2 text-[#9BA9C3] hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Selected Destination Preview Overlay Card */}
        {selectedDest && (
          <div className="absolute bottom-5 left-5 right-5 sm:right-auto sm:max-w-md z-30 animate-modal-in">
            <div className="rounded-2xl border border-[#3DDC97]/40 bg-[#0E1626]/95 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={selectedDest.heroImage}
                      alt={selectedDest.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] text-[#3DDC97] border-[#3DDC97]/30">
                        {selectedDest.region}
                      </Badge>
                      <span className="text-[10px] text-[#9BA9C3]">
                        {selectedDest.coordinates.lat.toFixed(2)}°N, {selectedDest.coordinates.lng.toFixed(2)}°E
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-0.5">{selectedDest.name}</h4>
                    <p className="text-[11px] text-[#3DDC97] italic">{selectedDest.vietnameseName}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDest(null)}
                  className="rounded-lg p-1 text-[#9BA9C3] hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-[#C4D0E5] mt-3 line-clamp-2 leading-relaxed">
                {selectedDest.tagline}
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-[#243049]/60 pt-3">
                <div className="flex items-center gap-2 text-xs text-[#9BA9C3]">
                  <Calendar className="h-3.5 w-3.5 text-[#3DDC97]" />
                  <span>Best: {selectedDest.bestSeason}</span>
                </div>

                <Button
                  size="sm"
                  onClick={() => onSelectDestination?.(selectedDest)}
                  className="bg-[#3DDC97] text-[#080D18] hover:bg-[#32B87D] text-xs font-semibold px-3 py-1.5"
                >
                  <span>View Dossier</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend Footer */}
      <div className="border-t border-[#243049]/60 bg-[#080D18] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#9BA9C3]">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-white">Regions:</span>
          {VIETNAM_REGIONS.map((r) => (
            <div key={r} className="flex items-center gap-1.5 text-[11px]">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: REGION_COLORS[r].pin }}
              />
              <span>{r.replace(' Vietnam', '')}</span>
            </div>
          ))}
        </div>

        <span className="text-[10px] font-mono text-[#9BA9C3]/80">
          Equirectangular SVG (WGS84) • Conceptual geographic linkages, not road turn-by-turn navigation
        </span>
      </div>
    </div>
  );
};

