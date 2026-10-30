import React from 'react';
import {
  SlidersHorizontal,
  Compass,
  Layers,
  Sparkles,
  BookmarkCheck,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface CulturalJourneyTimelineProps {
  activePillarsCount: number;
  totalSelectionsCount: number;
  totalRecommendationsCount: number;
  shortlistCount: number;
  savedTripsCount: number;
  onOpenTasteStudio: () => void;
  onOpenComparison: () => void;
  onLaunchConcierge: () => void;
  onViewTrips: () => void;
}

export const CulturalJourneyTimeline: React.FC<CulturalJourneyTimelineProps> = ({
  activePillarsCount,
  totalSelectionsCount,
  totalRecommendationsCount,
  shortlistCount,
  savedTripsCount,
  onOpenTasteStudio,
  onOpenComparison,
  onLaunchConcierge,
  onViewTrips,
}) => {
  const steps = [
    {
      step: '01',
      title: 'Taste Studio',
      status: totalSelectionsCount > 0 ? 'Calibrated' : 'Pending',
      detail: `${totalSelectionsCount} signals across ${activePillarsCount} pillars`,
      actionLabel: 'Calibrate Taste',
      action: onOpenTasteStudio,
      isComplete: totalSelectionsCount > 0,
      icon: <SlidersHorizontal className="h-4 w-4 text-[#9875FF]" />,
      accent: '#9875FF',
    },
    {
      step: '02',
      title: 'Discovery',
      status: 'Active',
      detail: `${totalRecommendationsCount} sanctuaries ranked`,
      actionLabel: 'Explore Rails',
      action: () => {
        const el = document.getElementById('discovery-lanes-anchor');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      isComplete: true,
      icon: <Sparkles className="h-4 w-4 text-[#48E3EF]" />,
      accent: '#48E3EF',
    },
    {
      step: '03',
      title: 'Compare',
      status: shortlistCount > 0 ? `${shortlistCount} Shortlisted` : 'Ready',
      detail: shortlistCount > 0 ? 'Side-by-side evaluation' : 'Add 2-3 sanctuaries',
      actionLabel: shortlistCount > 0 ? `Compare (${shortlistCount})` : 'Select Items',
      action: shortlistCount > 0 ? onOpenComparison : () => {},
      isComplete: shortlistCount >= 2,
      disabled: shortlistCount === 0,
      icon: <Layers className="h-4 w-4 text-[#3DDC97]" />,
      accent: '#3DDC97',
    },
    {
      step: '04',
      title: 'Concierge Draft',
      status: 'Ready',
      detail: 'Tailored day-by-day blueprint',
      actionLabel: 'Launch Concierge',
      action: onLaunchConcierge,
      isComplete: false,
      icon: <Compass className="h-4 w-4 text-[#F5A623]" />,
      accent: '#F5A623',
    },
    {
      step: '05',
      title: 'My Trips',
      status: savedTripsCount > 0 ? `${savedTripsCount} Trips` : 'Cloud Ledger',
      detail: 'Persisted itinerary ledger',
      actionLabel: 'View My Trips',
      action: onViewTrips,
      isComplete: savedTripsCount > 0,
      icon: <BookmarkCheck className="h-4 w-4 text-[#3DDC97]" />,
      accent: '#3DDC97',
    },
  ];

  return (
    <div className="relative mb-12 overflow-hidden rounded-3xl border border-[#243049] bg-gradient-to-r from-[#0E1626]/90 via-[#0A101D]/90 to-[#0E1626]/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
      {/* Eyebrow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#243049]/60">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#48E3EF]">
            End-to-End Cultural Travel Journey
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-medium text-white">
            From Cultural Taste to Itinerary Ledger
          </h2>
        </div>

        <span className="text-xs text-[#9BA9C3] font-light">
          Real persistent state • Zero mock workflows
        </span>
      </div>

      {/* 5-Step Process Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
        {steps.map((s) => (
          <div
            key={s.step}
            className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 ${
              s.isComplete
                ? 'border-[#3DDC97]/30 bg-[#0E1B27]/70 hover:border-[#3DDC97]/60'
                : 'border-[#243049] bg-[#0E1626]/60 hover:border-white/20'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-[11px] font-bold text-[#9BA9C3]">
                  {s.step}
                </span>
                <span className="p-1 rounded-md bg-[#121C30] border border-white/5">
                  {s.icon}
                </span>
              </div>

              <h3 className="font-serif text-base font-medium text-white group-hover:text-[#48E3EF] transition-colors">
                {s.title}
              </h3>

              <div className="mt-1 flex items-center gap-1.5">
                {s.isComplete ? (
                  <CheckCircle2 className="h-3 w-3 text-[#3DDC97]" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#48E3EF]" />
                )}
                <span className="text-[11px] font-medium text-[#C4D0E5]">
                  {s.status}
                </span>
              </div>

              <p className="mt-1.5 text-[11px] text-[#9BA9C3] font-light line-clamp-2">
                {s.detail}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={s.action}
                disabled={s.disabled}
                className={`inline-flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  s.disabled
                    ? 'text-[#9BA9C3]/50 cursor-not-allowed bg-transparent'
                    : 'bg-[#152338] text-[#C4D0E5] hover:bg-[#48E3EF] hover:text-[#080D18]'
                }`}
              >
                <span>{s.actionLabel}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
