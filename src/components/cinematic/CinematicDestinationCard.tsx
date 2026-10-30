import React from 'react';
import {
  Star,
  Heart,
  MapPin,
  Calendar,
  ArrowRight,
  Sparkles,
  Layers,
  Check,
  GitBranch
} from 'lucide-react';
import type { Destination } from '../../types/index.ts';
import type { DestinationRecommendation } from '../../services/recommendations/types.ts';
import { Card } from '../ui/Card.tsx';
import { Badge } from '../ui/Badge.tsx';
import { ImageWithFallback } from '../ui/ImageWithFallback.tsx';

interface CinematicDestinationCardProps {
  recommendation: DestinationRecommendation;
  onSelect?: (destination: Destination) => void;
  isSaved?: boolean;
  onToggleSave?: (destination: Destination) => void;
  isShortlisted?: boolean;
  onToggleShortlist?: (destination: Destination) => void;
  onBuildJourney?: (destination: Destination) => void;
  onExploreRabbitHole?: (seed: string) => void;
}

export const CinematicDestinationCard: React.FC<CinematicDestinationCardProps> = ({
  recommendation,
  onSelect,
  isSaved = false,
  onToggleSave,
  isShortlisted = false,
  onToggleShortlist,
  onBuildJourney,
  onExploreRabbitHole,
}) => {
  const { destination, score, matchLevel, matchedPillars } = recommendation;

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave?.(destination);
  };

  const handleShortlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleShortlist?.(destination);
  };

  const handleJourneyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBuildJourney?.(destination);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(destination);
    }
  };

  return (
    <Card
      variant="interactive"
      tabIndex={0}
      role="button"
      aria-label={`View cultural dossier for ${destination.name}, ${destination.country}`}
      onKeyDown={handleKeyDown}
      onClick={() => onSelect?.(destination)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#243049] bg-gradient-to-b from-[#10192A] to-[#0A101D] hover:border-[#48E3EF]/60 hover:shadow-[0_12px_36px_rgba(72,227,239,0.15)] transition-all duration-300 focus-visible:outline-[#3DDC97] focus-visible:outline-2"
    >
      {/* Floating Cinematic Photography */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#080D18]">
        <ImageWithFallback
          src={destination.heroImage}
          alt={destination.name}
          fallbackTitle={destination.name}
          fallbackColor={destination.fallbackColor}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Cinematic Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#10192A] via-transparent to-black/45" />

        {/* Top Badges Bar */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
          <Badge
            variant="neutral"
            size="sm"
            className="backdrop-blur-md bg-[#080D18]/90 text-white font-medium border-white/10 shadow-sm"
          >
            <MapPin className="h-3 w-3 text-[#3DDC97] mr-1 shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-none">
              {destination.country} • {destination.region}
            </span>
          </Badge>

          {/* Action Buttons: Shortlist & Bookmark */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShortlistToggle}
              className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer ${
                isShortlisted
                  ? 'bg-[#48E3EF] text-[#080D18] shadow-md shadow-[#48E3EF]/30 scale-105'
                  : 'bg-[#080D18]/80 text-white/80 hover:bg-white hover:text-[#080D18] hover:scale-105'
              }`}
              aria-label={isShortlisted ? `Remove ${destination.name} from comparison shortlist` : `Add ${destination.name} to comparison shortlist`}
              title={isShortlisted ? 'In comparison shortlist' : 'Add to comparison'}
            >
              {isShortlisted ? <Check className="h-4 w-4 stroke-[2.5]" /> : <Layers className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={handleSaveToggle}
              className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer ${
                isSaved
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
                  : 'bg-[#080D18]/80 text-white/80 hover:bg-white hover:text-rose-500 hover:scale-105'
              }`}
              aria-label={isSaved ? `Remove ${destination.name} from saved sanctuaries` : `Save ${destination.name} to my trips`}
              title={isSaved ? 'Saved to my trips' : 'Save destination'}
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bottom Floating Vibe & Transparent Affinity Pill */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between gap-1.5">
          <span className="rounded-md bg-[#080D18]/90 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md border border-white/10 shadow-sm truncate">
            {destination.vibe}
          </span>

          {score !== undefined && (
            <span
              className={`rounded-md px-2.5 py-0.5 text-[11px] font-mono font-semibold shadow-sm flex items-center gap-1.5 backdrop-blur-md border shrink-0 ${
                score >= 75
                  ? 'bg-[#080D18]/90 text-[#3DDC97] border-[#3DDC97]/50 shadow-[0_0_12px_rgba(61,220,151,0.25)]'
                  : score > 0
                  ? 'bg-[#080D18]/90 text-[#48E3EF] border-[#48E3EF]/50'
                  : 'bg-[#080D18]/90 text-[#9BA9C3] border-[#243049]'
              }`}
              title={`Deterministic Trait Match Index: ${score}/100 (${matchLevel}) • Transparent metric of cultural preference intersection, not simulated probability.`}
            >
              <Sparkles className="h-3 w-3 text-[#3DDC97]" />
              <span>{score} Trait Index</span>
            </span>
          )}

        </div>
      </div>

      {/* Card Content & Cultural Dimensions */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-xl font-medium tracking-tight text-white group-hover:text-[#48E3EF] transition-colors">
            {destination.name}
          </h3>

          <div className="flex items-center gap-1 rounded-md bg-[#18253E] px-2 py-0.5 text-xs font-semibold text-white border border-white/5 shrink-0">
            <Star className="h-3 w-3 fill-[#F5A623] text-[#F5A623]" />
            <span>{destination.rating}</span>
          </div>
        </div>

        <p className="mt-2 text-xs font-light text-[#9BA9C3] line-clamp-2 leading-relaxed">
          {destination.tagline}
        </p>

        {/* Matched Pillars Preview */}
        {matchedPillars && matchedPillars.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {matchedPillars.slice(0, 3).map((mp) => (
              <span
                key={mp.pillar}
                className="rounded-full bg-[#152238] px-2.5 py-0.5 text-[10px] font-medium text-[#48E3EF] border border-[#48E3EF]/25"
              >
                {mp.pillar}
              </span>
            ))}
            {matchedPillars.length > 3 && (
              <span className="text-[10px] text-[#9BA9C3]">
                +{matchedPillars.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Curated Artisan Signature Experience */}
        <div className="mt-4 rounded-xl border border-[#243049]/70 bg-[#0E1626]/90 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-[#3DDC97] mb-1">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span className="uppercase text-[10px] tracking-wider font-semibold">Artisan Signature</span>
          </div>
          <p className="text-[#C4D0E5] text-[11px] font-light line-clamp-2">
            {destination.curatedExperience}
          </p>
        </div>

        {/* Card Footer: Timing & Actions */}
        <div className="mt-auto pt-4 border-t border-[#243049]/60 flex items-center justify-between text-xs text-[#9BA9C3]">
          <div className="flex items-center gap-1.5 font-light">
            <Calendar className="h-3.5 w-3.5 text-[#3DDC97]" />
            <span>{destination.idealDays} Days</span>
          </div>

          <div className="flex items-center gap-2.5">
            {onExploreRabbitHole && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExploreRabbitHole(destination.name);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-[#9875FF] hover:text-white transition-colors cursor-pointer"
                title={`Explore cultural rabbit hole starting from ${destination.name}`}
              >
                <GitBranch className="h-3 w-3" />
                <span>Rabbit Hole</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleJourneyClick}
              className="group/btn inline-flex items-center gap-1 text-xs font-medium text-[#48E3EF] hover:text-white transition-colors active:translate-x-0.5 cursor-pointer"
            >
              <span>Build Journey</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};
