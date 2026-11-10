import React from 'react';
import { Link } from 'react-router-dom';
import type { NorthDestinationRecord } from '../../types/northMap.ts';
import { CATEGORY_STYLE_CONFIG } from '../../services/map/mapConfig.ts';
import {
  X,
  MapPin,
  Compass,
  Utensils,
  Sparkles,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Navigation2,
  ChevronRight,
} from 'lucide-react';

interface NorthMapDetailPanelProps {
  destination: NorthDestinationRecord | null;
  onClose: () => void;
  onSelectNearby: (dest: NorthDestinationRecord) => void;
  allDestinations: NorthDestinationRecord[];
  isInRoute: boolean;
  onToggleRoute: (dest: NorthDestinationRecord) => void;
}

export const NorthMapDetailPanel: React.FC<NorthMapDetailPanelProps> = ({
  destination,
  onClose,
  onSelectNearby,
  allDestinations,
  isInRoute,
  onToggleRoute,
}) => {
  if (!destination) return null;

  const categoryStyle =
    CATEGORY_STYLE_CONFIG[destination.category] || CATEGORY_STYLE_CONFIG['Cảnh quan thiên nhiên'];

  // Find other destinations in the same subregion
  const nearbyDestinations = allDestinations
    .filter((d) => d.id !== destination.id && d.subregion === destination.subregion)
    .slice(0, 4);

  return (
    <aside
      aria-label={`Chi tiết điểm đến ${destination.vietnameseName}`}
      className="fixed inset-x-0 bottom-0 z-30 max-h-[85vh] md:static md:w-[410px] md:max-h-full bg-[#0E1626]/95 border-t md:border-t-0 md:border-l border-[#243049] shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-300 rounded-t-2xl md:rounded-none animate-in fade-in slide-in-from-bottom md:slide-in-from-right"
    >
      {/* Mobile drag handle */}
      <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto mt-2.5 mb-1 md:hidden" />

      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#243049]/80 bg-[#121C30]/50">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full ring-4"
            style={{
              background: categoryStyle.color,
              boxShadow: `0 0 10px ${categoryStyle.color}`,
            }}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {destination.subregion}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400">{destination.provinceOrRegion}</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Đóng bảng chi tiết"
          className="w-8 h-8 rounded-lg bg-[#151F33] hover:bg-[#1C2A45] text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-[#243049]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-slate-200">
        {/* Cover Image */}
        <div className="relative aspect-video rounded-xl overflow-hidden border border-[#243049] shadow-inner group">
          <img
            src={destination.image}
            alt={destination.vietnameseName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E1626] via-transparent to-transparent opacity-80" />

          {/* Verification Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-md bg-black/60 border border-white/10">
            {destination.verificationStatus === 'verified' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3DDC97]" />
                <span className="text-[#3DDC97]">Tọa độ GPS xác thực</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">Cần rà soát ranh giới</span>
              </>
            )}
          </div>

          {/* Category Pill */}
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-xs font-medium text-white shadow-md bg-[#0E1626]/90 border border-[#243049] backdrop-blur-md">
            {destination.category}
          </div>
        </div>

        {/* Title & Coordinates */}
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-xl md:text-2xl font-bold font-serif text-white tracking-tight">
              {destination.vietnameseName}
            </h2>
          </div>
          {destination.name !== destination.vietnameseName && (
            <p className="text-xs text-slate-400 font-sans mt-0.5">{destination.name}</p>
          )}

          {/* Coordinates display */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 font-mono bg-[#121C30] px-2.5 py-1.5 rounded-lg border border-[#243049] w-fit">
            <Navigation2 className="w-3.5 h-3.5 text-[#48E3EF]" />
            <span>
              {destination.latitude.toFixed(4)}°B, {destination.longitude.toFixed(4)}°Đ
            </span>
            <span className="text-slate-600 mx-1">|</span>
            <span className="text-[11px] text-slate-400">Độ tin cậy {(destination.confidenceScore * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Short Editorial Description */}
        <p className="text-sm leading-relaxed text-slate-300">
          {destination.shortDescription}
        </p>

        {/* Route Action Button */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggleRoute(destination)}
            className={`flex-1 py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all border shadow-lg ${
              isInRoute
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                : 'bg-[#151F33] border-[#243049] text-white hover:border-[#3DDC97] hover:bg-[#18253E]'
            }`}
          >
            {isInRoute ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Đã có trong lộ trình (Bấm để xóa)</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 text-[#3DDC97]" />
                <span>Thêm vào Lộ trình khám phá</span>
              </>
            )}
          </button>

          {/* Link to Full Dossier if destination linked */}
          {destination.linkedDestinationId && (
            <Link
              to={`/destinations/${destination.linkedDestinationId}`}
              className="py-2.5 px-3 rounded-xl bg-[#3DDC97] hover:bg-[#2BB67B] text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-[#3DDC97]/15"
              title="Xem hồ sơ chi tiết điểm đến"
            >
              <span>Xem chi tiết</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Key Experiences */}
        {destination.experiences.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white tracking-wide">
              <Compass className="w-4 h-4 text-[#48E3EF]" />
              <span>Trải nghiệm không nên bỏ lỡ</span>
            </div>
            <ul className="space-y-1.5">
              {destination.experiences.map((exp, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-300 flex items-start gap-2 bg-[#121C30]/50 p-2 rounded-lg border border-[#243049]/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#48E3EF] mt-1.5 shrink-0" />
                  <span>{exp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Local Food Highlights */}
        {destination.localFood.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white tracking-wide">
              <Utensils className="w-4 h-4 text-[#F43F5E]" />
              <span>Ẩm thực & đặc sản bản địa</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {destination.localFood.map((food, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-lg bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-rose-200"
                >
                  {food}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cultural Highlights */}
        {destination.culturalHighlights.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white tracking-wide">
              <Sparkles className="w-4 h-4 text-[#9875FF]" />
              <span>Chiều sâu văn hóa & lịch sử</span>
            </div>
            <ul className="space-y-1.5">
              {destination.culturalHighlights.map((hl, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-300 flex items-start gap-2 bg-[#121C30]/50 p-2 rounded-lg border border-[#243049]/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9875FF] mt-1.5 shrink-0" />
                  <span>{hl}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Nearby Destinations */}
        {nearbyDestinations.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#243049]">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#3DDC97]" />
                <span>Điểm đến cùng vùng {destination.subregion}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {nearbyDestinations.map((nearby) => (
                <button
                  key={nearby.id}
                  onClick={() => onSelectNearby(nearby)}
                  className="text-left p-2 rounded-xl bg-[#121C30] hover:bg-[#151F33] border border-[#243049] transition-all group flex flex-col justify-between"
                >
                  <div className="font-medium text-xs text-white group-hover:text-[#48E3EF] transition-colors line-clamp-1">
                    {nearby.vietnameseName}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                    <span className="truncate">{nearby.category}</span>
                    <ChevronRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Provenance and Data Source Footer */}
        <div className="pt-2 text-[11px] text-slate-500 border-t border-[#243049]/60 flex flex-col gap-1">
          <div>
            Nguồn xác minh:{' '}
            <span className="text-slate-400 font-medium">{destination.source}</span>
          </div>
          {destination.historicalAliases && destination.historicalAliases.length > 0 && (
            <div>
              Tên gọi lịch sử / Dân gian:{' '}
              <span className="text-slate-400 italic">
                {destination.historicalAliases.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
