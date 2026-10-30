import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  Film,
  Music,
  UtensilsCrossed,
  Building2,
  Palette,
  Landmark,
  Trees,
  Users,
  CheckCircle2,
  X
} from 'lucide-react';
import type { TasteProfile } from '../../types/index.ts';
import { PILLAR_MAPPINGS } from '../../services/recommendations/pipeline/RecommendationPipeline.ts';

interface CulturalSignalNetworkProps {
  tasteProfile: TasteProfile;
  activeFilter?: string | null;
  onSelectFilter?: (signal: string | null) => void;
  onOpenTasteStudio: () => void;
  onApplyPreset?: (presetProfile: Partial<TasteProfile>) => void;
}

const PILLAR_ICONS: Record<string, React.ReactNode> = {
  films: <Film className="h-3.5 w-3.5 text-[#9875FF]" />,
  music: <Music className="h-3.5 w-3.5 text-[#48E3EF]" />,
  food: <UtensilsCrossed className="h-3.5 w-3.5 text-[#3DDC97]" />,
  architecture: <Building2 className="h-3.5 w-3.5 text-[#F5A623]" />,
  art: <Palette className="h-3.5 w-3.5 text-[#EC4899]" />,
  history: <Landmark className="h-3.5 w-3.5 text-[#EAB308]" />,
  nature: <Trees className="h-3.5 w-3.5 text-[#10B981]" />,
  localCulture: <Users className="h-3.5 w-3.5 text-[#06B6D4]" />,
};

const PILLAR_COLORS: Record<string, string> = {
  films: '#9875FF',
  music: '#48E3EF',
  food: '#3DDC97',
  architecture: '#F5A623',
  art: '#EC4899',
  history: '#EAB308',
  nature: '#10B981',
  localCulture: '#06B6D4',
};

export const CulturalSignalNetwork: React.FC<CulturalSignalNetworkProps> = ({
  tasteProfile,
  activeFilter = null,
  onSelectFilter,
  onOpenTasteStudio,
  onApplyPreset,
}) => {
  const [hoveredSignal, setHoveredSignal] = useState<{
    label: string;
    pillarLabel: string;
    pillarKey: string;
  } | null>(null);

  // Extract signals directly from real taste profile
  const signalsByPillar = useMemo(() => {
    return PILLAR_MAPPINGS.map((m) => {
      const selections = (tasteProfile[m.profileKey] as string[]) || [];
      return {
        key: m.profileKey,
        label: m.label,
        selections: selections.filter((s) => typeof s === 'string' && s.trim().length > 0),
        color: PILLAR_COLORS[m.profileKey] || '#48E3EF',
        icon: PILLAR_ICONS[m.profileKey],
      };
    }).filter((p) => p.selections.length > 0);
  }, [tasteProfile]);

  const allSignals = useMemo(() => {
    return signalsByPillar.flatMap((p) =>
      p.selections.map((sel) => ({
        label: sel,
        pillarKey: p.key,
        pillarLabel: p.label,
        color: p.color,
      }))
    );
  }, [signalsByPillar]);

  // Handle Preset quick-apply for onboarding empty state
  const handleApplyPreset = (type: 'zen' | 'mediterranean' | 'highland') => {
    if (!onApplyPreset) return;

    if (type === 'zen') {
      onApplyPreset({
        films: ['Studio Ghibli Pastoral Animation'],
        music: ['Shakuhachi, Koto & East Asian Strings', 'Ambient & Meditative Drone'],
        food: ['Ceremonial Shade Matcha & Wild Mountain Teas', 'Seasonal Kaiseki & Monastic Washoku'],
        architecture: ['Traditional Machiya & Cedar Joinery'],
        art: ['Wabi-Sabi Wood-Fired Ceramics'],
        history: ['Zen Monastic Lineages & Tea Dynasties'],
        nature: ['Bamboo Groves & Mossy Temple Gardens'],
        localCulture: ['Dawn Silence & Abbot Dialogues'],
      });
    } else if (type === 'mediterranean') {
      onApplyPreset({
        films: ['European Art House & Slow Cinema', 'Wong Kar-wai Poetic Moods'],
        music: ['Bossa Nova & Coastal Latin Jazz', 'Acoustic Chamber & Solitary Cello'],
        food: ['Terraced Lemon Groves & Olive Estates', 'Ancestral Fermentation & Sourdough Lineages'],
        architecture: ['Cliffside Whitewashed & Stucco Terraces'],
        art: ['Vintage Wooden Boat Restoration'],
        history: ['Amalfi Maritime Republic & Roman Villas'],
        nature: ['Cobalt Sea Cliffs & Hidden Mediterranean Grottoes'],
        localCulture: ['Orchard Lunch with Family Cultivators'],
      });
    } else if (type === 'highland') {
      onApplyPreset({
        films: ['Terrence Malick Poetic Nature', 'Atmospheric Historical Epics'],
        music: ['Indigenous Highland Folk & Polyphony', 'Cinematic Orchestral & Atmospheric Soundtracks'],
        food: ['Ancestral Agave Mezcal & Slow Mole'],
        architecture: ['Sun-Dried Adobe & Zapotec Stone Courtyards', 'Earth & Bamboo Vernacular Pavilions'],
        art: ['Botanical Indigo & Natural Cochineal Dyeing', 'Ancestral Black Clay & Barro Negro'],
        history: ['Zapotec & Mixtec Ancestral Kingdoms', 'Highland Frontier Posts & Ethnic Confederacies'],
        nature: ['Towering Limestone Karst & Emerald River Canyons', 'Obsidian Highlands & Steaming Geothermal Rivers'],
        localCulture: ['Hearthside Homestay with Ethnic Weavers'],
      });
    }
  };

  // If user has 0 preferences configured, show welcoming Onboarding State
  if (allSignals.length === 0) {
    return (
      <div className="mb-10 overflow-hidden rounded-3xl border border-[#243049] bg-gradient-to-br from-[#0D1525] via-[#080D18] to-[#0A1120] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-[#48E3EF] animate-ping" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#48E3EF]">
                Signal Network Uncalibrated
              </span>
            </div>
            <h3 className="font-serif text-2xl font-medium text-white mb-2">
              Connect Your Cultural Signal Network
            </h3>
            <p className="text-xs sm:text-sm text-[#9BA9C3] font-light leading-relaxed">
              Your travel preferences calibrate personalized Vietnam discovery tracks and custom itinerary lanes.
              Calibrate your profile across 8 cultural dimensions, or select a Vietnam persona:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleApplyPreset('zen')}
              className="rounded-xl border border-[#3DDC97]/30 bg-[#0E1B27] px-3.5 py-2 text-xs font-medium text-[#3DDC97] hover:bg-[#3DDC97]/15 transition-all cursor-pointer shadow-sm"
            >
              🏔️ Northern Karst & Pass
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('mediterranean')}
              className="rounded-xl border border-[#48E3EF]/30 bg-[#0A1A2B] px-3.5 py-2 text-xs font-medium text-[#48E3EF] hover:bg-[#48E3EF]/15 transition-all cursor-pointer shadow-sm"
            >
              🏛️ Imperial Citadel & Silk
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('highland')}
              className="rounded-xl border border-[#9875FF]/30 bg-[#15122B] px-3.5 py-2 text-xs font-medium text-[#9875FF] hover:bg-[#9875FF]/15 transition-all cursor-pointer shadow-sm"
            >
              🏝️ Coastal & Island Atolls
            </button>
            <button
              type="button"
              onClick={onOpenTasteStudio}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="h-3 w-3 inline mr-1.5" />
              Open Travel Studio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-10 overflow-hidden rounded-3xl border border-[#243049] bg-gradient-to-b from-[#0E1626]/90 via-[#0A1120]/95 to-[#080D18] p-6 sm:p-8 backdrop-blur-xl shadow-xl">
      {/* Radiant ambient glow */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-[#48E3EF]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#9875FF]/10 blur-3xl" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#243049]/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-[#3DDC97]" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#9BA9C3]">
              Active Signal Network ({allSignals.length} Active Nodes across {signalsByPillar.length} Pillars)
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-medium text-white">
            Your Cultural Taste Constellation
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {activeFilter && (
            <button
              type="button"
              onClick={() => onSelectFilter?.(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
              title="Clear active signal filter"
            >
              <span>Filtering by: {activeFilter}</span>
              <X className="h-3 w-3" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenTasteStudio}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#243049] bg-[#121C30] px-3.5 py-1.5 text-xs font-medium text-[#C4D0E5] hover:border-[#3DDC97]/40 hover:text-white transition-all cursor-pointer"
          >
            <SlidersHorizontal className="h-3 w-3 text-[#3DDC97]" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Interactive Signal Nodes Matrix */}
      <div className="relative z-10 space-y-4">
        {signalsByPillar.map((pillar) => (
          <div key={pillar.key} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Pillar Badge */}
            <div className="w-48 shrink-0 flex items-center gap-2 text-xs font-medium text-white/90">
              <span className="p-1 rounded-md bg-[#121C30] border border-white/5">
                {pillar.icon}
              </span>
              <span className="truncate">{pillar.label}</span>
            </div>

            {/* Signal Nodes Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {pillar.selections.map((signal) => {
                const isSelected = activeFilter === signal;
                return (
                  <button
                    key={signal}
                    type="button"
                    onClick={() => {
                      if (onSelectFilter) {
                        onSelectFilter(isSelected ? null : signal);
                      }
                    }}
                    onMouseEnter={() =>
                      setHoveredSignal({
                        label: signal,
                        pillarLabel: pillar.label,
                        pillarKey: pillar.key,
                      })
                    }
                    onMouseLeave={() => setHoveredSignal(null)}
                    className={`group relative flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border border-[#48E3EF] bg-[#48E3EF]/20 text-[#48E3EF] shadow-[0_0_12px_rgba(72,227,239,0.3)] scale-105'
                        : 'border border-[#243049] bg-[#10192A]/80 text-[#C4D0E5] hover:border-white/30 hover:bg-[#15233C] hover:text-white'
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: pillar.color }}
                    />
                    <span className="truncate max-w-[220px]">{signal}</span>
                    {isSelected && <CheckCircle2 className="h-3 w-3 text-[#48E3EF] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Signal Inspector Card Footnote */}
      <div className="relative z-10 mt-6 pt-4 border-t border-[#243049]/50 flex flex-wrap items-center justify-between text-xs text-[#9BA9C3]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#3DDC97]" />
          <span>
            {hoveredSignal
              ? `Inspecting: "${hoveredSignal.label}" (${hoveredSignal.pillarLabel}) — Click node to filter recommendations.`
              : 'Click any node above to focus destination discovery on that specific cultural signal.'}
          </span>
        </div>

        <span className="text-[11px] font-mono text-[#9BA9C3]/80">
          Derived from authentic Taste Studio selections • Zero synthetic traits
        </span>
      </div>
    </div>
  );
};
