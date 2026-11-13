import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { Destination } from '../../types/index.ts';
import type { DiscoveryLane } from '../../services/recommendations/types.ts';
import { CinematicDestinationCard } from './CinematicDestinationCard.tsx';

interface DestinationDiscoveryRailProps {
  lane: DiscoveryLane;
  onSelectDestination: (dest: Destination) => void;
  savedDestIds: string[];
  onToggleSave: (dest: Destination) => void;
  shortlistIds: string[];
  onToggleShortlist: (dest: Destination) => void;
  onBuildJourney: (dest: Destination) => void;
  onExploreRabbitHole?: (seed: string) => void;
}

export const DestinationDiscoveryRail: React.FC<DestinationDiscoveryRailProps> = ({
  lane,
  onSelectDestination,
  savedDestIds,
  onToggleSave,
  shortlistIds,
  onToggleShortlist,
  onBuildJourney,
  onExploreRabbitHole,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 380;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!lane.recommendations || lane.recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mb-12" aria-labelledby={`lane-heading-${lane.id}`}>
      {/* Lane Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded-md border border-[#48E3EF]/30 bg-[#48E3EF]/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#48E3EF]">
              {lane.badge}
            </span>
            <span className="text-[11px] font-mono text-[#9BA9C3]">
              • {lane.recommendations.length} điểm đến tuyển chọn
            </span>
          </div>

          <h2 id={`lane-heading-${lane.id}`} className="font-serif text-2xl sm:text-3xl font-medium text-white tracking-tight">
            {lane.title}
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-[#9BA9C3] font-light max-w-2xl leading-relaxed">
            {lane.subtitle}
          </p>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#243049] bg-[#0E1626] text-[#C4D0E5] hover:border-[#48E3EF]/50 hover:bg-[#152338] hover:text-white transition-all cursor-pointer shadow-sm"
            aria-label={`Cuộn ${lane.title} sang trái`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#243049] bg-[#0E1626] text-[#C4D0E5] hover:border-[#48E3EF]/50 hover:bg-[#152338] hover:text-white transition-all cursor-pointer shadow-sm"
            aria-label={`Cuộn ${lane.title} sang phải`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Rail Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-[#243049] scrollbar-track-transparent scroll-smooth focus:outline-none"
        tabIndex={0}
        role="region"
        aria-label={`Danh sách điểm đến ${lane.title}`}
      >
        {lane.recommendations.map((rec) => (
          <div
            key={rec.destination.id}
            className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0"
          >
            <CinematicDestinationCard
              recommendation={rec}
              onSelect={onSelectDestination}
              isSaved={savedDestIds.includes(rec.destination.id)}
              onToggleSave={onToggleSave}
              isShortlisted={shortlistIds.includes(rec.destination.id)}
              onToggleShortlist={onToggleShortlist}
              onBuildJourney={onBuildJourney}
              onExploreRabbitHole={onExploreRabbitHole}
            />
          </div>
        ))}
      </div>

      {/* Transparent Selection Rule Legend */}
      <div className="mt-2 text-[11px] font-mono text-[#9BA9C3]/75 flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-[#3DDC97]" />
        <span>Tiêu chí tuyển chọn: {lane.selectionRule}</span>
      </div>
    </section>
  );
};
