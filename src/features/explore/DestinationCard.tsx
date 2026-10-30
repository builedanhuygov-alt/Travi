import React from 'react';
import { Star, Heart, MapPin, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import type { Destination } from '../../types/index.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback.tsx';

interface DestinationCardProps {
  destination: Destination;
  onSelect?: (destination: Destination) => void;
  isSaved?: boolean;
  onToggleSave?: (destination: Destination) => void;
  affinityScore?: number;
  matchLevel?: string;
  isSimulatedDemo?: boolean;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
  destination,
  onSelect,
  isSaved = false,
  onToggleSave,
  affinityScore,
  matchLevel,
}) => {
  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave?.(destination);
  };

  return (
    <Card
      variant="interactive"
      onClick={() => onSelect?.(destination)}
      className="group relative flex flex-col overflow-hidden border border-[#243049] hover:border-[#3DDC97]/50 transition-all duration-300"
    >
      {/* Photo Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#10182A]">
        <ImageWithFallback
          src={destination.heroImage}
          alt={destination.name}
          fallbackTitle={destination.name}
          fallbackColor={destination.fallbackColor}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Cinematic Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121C30] via-transparent to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
          <Badge variant="neutral" size="sm" className="backdrop-blur-md bg-[#080D18]/85 text-white font-medium border-white/10 shadow-sm">
            <MapPin className="h-3 w-3 text-[#3DDC97] mr-1 shrink-0" />
            <span>{destination.country}</span>
          </Badge>

          <button
            type="button"
            onClick={handleSaveToggle}
            className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer ${
              isSaved
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
                : 'bg-[#080D18]/75 text-white/80 hover:bg-white hover:text-rose-500 hover:scale-105'
            }`}
            aria-label={isSaved ? `Remove ${destination.name} from saved sanctuaries` : `Save ${destination.name} to my trips`}
            title={isSaved ? 'Saved to my trips' : 'Save destination'}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Vibe & Simulated Affinity Pill */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between gap-1.5">
          <span className="rounded-md bg-[#080D18]/80 px-2 py-0.5 text-[11px] font-medium text-white/95 backdrop-blur-sm border border-white/10 shadow-sm">
            {destination.vibe}
          </span>

          {affinityScore !== undefined && (
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold shadow-sm flex items-center gap-1 backdrop-blur-sm border ${
                affinityScore >= 70
                  ? 'bg-[#080D18]/90 text-[#3DDC97] border-[#3DDC97]/40'
                  : affinityScore > 0
                  ? 'bg-[#080D18]/90 text-[#48E3EF] border-[#48E3EF]/40'
                  : 'bg-[#080D18]/90 text-[#9BA9C3] border-[#243049]'
              }`}
              title={`Travi Alignment: Direct resonance with authentic regional Vietnamese heritage (${matchLevel || 'Aligned'}).`}
            >
              <Sparkles className="h-3 w-3 text-[#3DDC97]" />
              <span>{affinityScore}% Match</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-xl font-medium tracking-tight text-white group-hover:text-[#3DDC97] transition-colors">
            {destination.name}
          </h3>

          <div className="flex items-center gap-1 rounded-md bg-[#18253E] px-2 py-0.5 text-xs font-semibold text-white border border-white/5">
            <Star className="h-3 w-3 fill-[#3DDC97] text-[#3DDC97]" />
            <span>{destination.rating}</span>
          </div>
        </div>

        <p className="mt-2 text-xs font-light text-[#9BA9C3] line-clamp-2 leading-relaxed">
          {destination.tagline}
        </p>

        {/* Curated Experience Signature */}
        <div className="mt-4 rounded-xl border border-[#243049]/60 bg-[#0E1626]/80 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-[#48E3EF] mb-1">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span className="uppercase text-[10px] tracking-wider font-semibold">Artisan Signature</span>
          </div>
          <p className="text-[#9BA9C3] text-[11px] font-light line-clamp-1">
            {destination.curatedExperience}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="mt-4 pt-3 border-t border-[#243049]/50 flex items-center justify-between text-xs text-[#9BA9C3]">
          <div className="flex items-center gap-1.5 font-light">
            <Calendar className="h-3.5 w-3.5 text-[#3DDC97]" />
            <span>{destination.idealDays} Days Pace</span>
          </div>

          <div className="flex items-center gap-1 text-[#3DDC97] font-medium group-hover:translate-x-1 transition-transform">
            <span>Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Card>
  );
};
