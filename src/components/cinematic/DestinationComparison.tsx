import React, { useEffect } from 'react';
import {
  X,
  Compass,
  ArrowRight,
  MapPin,
  Scale
} from 'lucide-react';
import type { Destination } from '../../types/index.ts';
import type { DestinationRecommendation } from '../../services/recommendations/types.ts';
import { ImageWithFallback } from '../ui/ImageWithFallback.tsx';
import { Button } from '../ui/Button.tsx';
import { translateRegion } from '../../lib/i18n/index.ts';

interface DestinationComparisonProps {
  shortlistDestinations: Destination[];
  allRecommendations: DestinationRecommendation[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveFromShortlist: (destId: string) => void;
  onClearShortlist: () => void;
  onBuildJourneyFromComparison: (destinations: Destination[]) => void;
  onSelectDestination: (dest: Destination) => void;
}

export const DestinationComparison: React.FC<DestinationComparisonProps> = ({
  shortlistDestinations,
  allRecommendations,
  isOpen,
  onClose,
  onRemoveFromShortlist,
  onClearShortlist,
  onBuildJourneyFromComparison,
  onSelectDestination,
}) => {
  // Accessible keyboard dismissal on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-modal-title"
    >
      <div className="relative flex flex-col w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border border-[#243049] bg-[#080D18] shadow-2xl animate-modal-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#243049]/70 bg-[#0E1626]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#48E3EF]/10 border border-[#48E3EF]/20 text-[#48E3EF]">
              <Scale className="h-5 w-5" />
            </span>
            <div>
              <h2 id="comparison-modal-title" className="font-serif text-2xl font-medium text-white">
                So sánh điểm đến văn hóa
              </h2>
              <p className="text-xs text-[#9BA9C3]">
                Đánh giá song song về chiều sâu văn hóa, nhịp điệu và trải nghiệm bản địa.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClearShortlist}
              className="text-xs text-[#9BA9C3] hover:text-white transition-colors cursor-pointer"
            >
              Xóa tất cả
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#121C30] border border-white/5 text-[#9BA9C3] hover:text-white transition-colors cursor-pointer"
              aria-label="Đóng hộp thoại so sánh"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Comparison Grid Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className={`grid gap-6 ${shortlistDestinations.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
            {shortlistDestinations.map((dest) => {
              const rec = allRecommendations.find((r) => r.destination.id === dest.id);
              const score = rec?.score || 0;

              return (
                <div
                  key={dest.id}
                  className="flex flex-col rounded-2xl border border-[#243049] bg-[#0E1626]/60 p-5 backdrop-blur-md"
                >
                  {/* Photo & Remove */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl mb-4 bg-[#10182A]">
                    <ImageWithFallback
                      src={dest.heroImage}
                      alt={dest.name}
                      fallbackTitle={dest.name}
                      fallbackColor={dest.fallbackColor}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveFromShortlist(dest.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white/80 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                      title="Xóa khỏi so sánh"
                      aria-label={`Xóa ${dest.name} khỏi so sánh`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-2">
                      <span className="rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-mono text-[#3DDC97] border border-white/10">
                        {score > 0 ? `${score} Điểm phù hợp` : 'Điểm đến đề xuất'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Location */}
                  <h3 className="font-serif text-xl font-medium text-white mb-1">
                    {dest.vietnameseName || dest.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#3DDC97] mb-3">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>Việt Nam ({dest.region ? translateRegion(dest.region) : 'Việt Nam'})</span>
                  </div>

                  <p className="text-xs text-[#9BA9C3] font-light leading-relaxed mb-4 line-clamp-2">
                    {dest.tagline}
                  </p>

                  {/* Matrix Attributes */}
                  <div className="space-y-3 pt-3 border-t border-[#243049]/60 text-xs flex-1">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#9BA9C3] block mb-0.5">
                        Nhịp độ & Không khí
                      </span>
                      <span className="text-white font-medium">
                        {dest.culture?.paceStyle || 'Thong thả'} • {dest.vibe}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#9BA9C3] block mb-0.5">
                        Thời gian lý tưởng & Mùa đẹp
                      </span>
                      <span className="text-white font-medium">
                        {dest.idealDays} ngày • {dest.bestSeason}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-[#121C30]/80 border border-white/5">
                        <span className="text-[9px] uppercase font-mono text-[#9BA9C3] block">Chiều sâu văn hóa</span>
                        <span className="text-sm font-serif font-bold text-[#48E3EF]">
                          {dest.culture?.culturalDepthScore || 90}/100
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#121C30]/80 border border-white/5">
                        <span className="text-[9px] uppercase font-mono text-[#9BA9C3] block">Độ yên tĩnh</span>
                        <span className="text-sm font-serif font-bold text-[#3DDC97]">
                          {dest.culture?.crowdIsolationScore || 90}%
                        </span>
                      </div>
                    </div>

                    {/* Cultural Match Breakdown */}
                    <div className="rounded-xl border border-[#243049] bg-[#0E1626] p-2.5 text-[10px] text-[#9BA9C3] font-mono flex items-center justify-between">
                      <span>Mức độ phù hợp:</span>
                      <span className="text-[#3DDC97] font-semibold">{score > 0 ? `${score} Điểm` : 'Tuyển chọn'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#9BA9C3] block mb-1">
                        Trải nghiệm đặc trưng
                      </span>
                      <div className="p-2.5 rounded-lg bg-[#10182A] border border-[#243049] text-[11px] text-[#C4D0E5] font-light leading-relaxed">
                        {dest.curatedExperience}
                      </div>
                    </div>

                    {/* Matched Pillars in Comparison */}
                    {rec?.matchedPillars && rec.matchedPillars.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-mono text-[#9BA9C3] block mb-1">
                          Chiều sở thích tương đồng
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {rec.matchedPillars.map((p) => (
                            <span
                              key={p.pillar}
                              className="px-2 py-0.5 rounded-md bg-[#121C30] text-[10px] text-[#48E3EF] border border-[#48E3EF]/20"
                            >
                              {p.pillar}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Destination Action */}
                  <div className="mt-5 pt-4 border-t border-[#243049]/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectDestination(dest);
                      }}
                      className="text-xs text-[#9BA9C3] hover:text-white transition-colors cursor-pointer"
                    >
                      Xem hồ sơ chi tiết
                    </button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        onClose();
                        onBuildJourneyFromComparison([dest]);
                      }}
                      className="text-xs"
                    >
                      <span>Lên lịch trình</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-[#243049]/70 bg-[#0E1626]/90 backdrop-blur-md">
          <div className="text-xs text-[#9BA9C3]">
            Đã chọn {shortlistDestinations.length} điểm đến để so sánh.
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                onClose();
                onBuildJourneyFromComparison(shortlistDestinations);
              }}
              className="shadow-[0_0_16px_rgba(61,220,151,0.3)]"
            >
              <Compass className="h-4 w-4 mr-1.5" />
              <span>
                Lên hành trình {shortlistDestinations.length} điểm đến &rarr;
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
