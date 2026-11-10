import React, { useState } from 'react';
import type {
  NorthDestinationRecord,
  NorthMapCategory,
  NorthMapSubregion,
  RouteCalculationResult,
} from '../../types/northMap.ts';
import {
  NORTH_MAP_SUBREGIONS,
  NORTH_MAP_CATEGORIES,
} from '../../data/northVietnamData.ts';
import { CATEGORY_STYLE_CONFIG } from '../../services/map/mapConfig.ts';
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  Route,
  Trash2,
  Navigation,
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface NorthMapSidebarProps {
  destinations: NorthDestinationRecord[];
  allDestinations: NorthDestinationRecord[];
  selectedDestination: NorthDestinationRecord | null;
  onSelectDestination: (dest: NorthDestinationRecord) => void;
  activeSubregion: NorthMapSubregion | 'All';
  onSelectSubregion: (subregion: NorthMapSubregion | 'All') => void;
  selectedCategories: NorthMapCategory[];
  onToggleCategory: (category: NorthMapCategory) => void;
  onClearCategories: () => void;
  routeDestinations: NorthDestinationRecord[];
  routeResult: RouteCalculationResult | null;
  onRemoveRouteDestination: (destId: string) => void;
  onClearRoute: () => void;
  className?: string;
}

type SidebarTab = 'regions' | 'filters' | 'route';

export const NorthMapSidebar: React.FC<NorthMapSidebarProps> = ({
  destinations,
  allDestinations,
  selectedDestination,
  onSelectDestination,
  activeSubregion,
  onSelectSubregion,
  selectedCategories,
  onToggleCategory,
  onClearCategories,
  routeDestinations,
  routeResult,
  onRemoveRouteDestination,
  onClearRoute,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('regions');
  const [expandedSubregions, setExpandedSubregions] = useState<Record<string, boolean>>({
    'Tây Bắc': true,
    'Đông Bắc': false,
    'Đồng bằng sông Hồng': false,
    'Ven biển Bắc Bộ': false,
    'Bắc Trung Bộ mở rộng': false,
  });

  const toggleSubregionAccordion = (subregion: NorthMapSubregion) => {
    setExpandedSubregions((prev) => ({
      ...prev,
      [subregion]: !prev[subregion],
    }));
  };

  // Group filtered destinations by subregion
  const destinationsBySubregion = NORTH_MAP_SUBREGIONS.reduce(
    (acc, sub) => {
      acc[sub.id] = destinations.filter((d) => d.subregion === sub.id);
      return acc;
    },
    {} as Record<NorthMapSubregion, NorthDestinationRecord[]>
  );

  return (
    <aside
      aria-label="Thanh điều hướng vùng và bộ lọc bản đồ miền Bắc"
      className={`w-full md:w-80 lg:w-96 bg-[#0E1626]/95 border-r border-[#243049] flex flex-col h-full shadow-2xl backdrop-blur-xl z-20 ${className}`}
    >
      {/* Sidebar Tabs */}
      <div className="flex items-center border-b border-[#243049] bg-[#121C30]/60 p-1.5 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('regions')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'regions'
              ? 'bg-[#151F33] text-[#3DDC97] border border-[#3DDC97]/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#151F33]/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Địa danh ({destinations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('filters')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all relative ${
            activeTab === 'filters'
              ? 'bg-[#151F33] text-[#48E3EF] border border-[#48E3EF]/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#151F33]/50'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Bộ lọc</span>
          {selectedCategories.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#48E3EF] text-slate-950 text-[10px] font-bold flex items-center justify-center ml-0.5">
              {selectedCategories.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('route')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all relative ${
            activeTab === 'route'
              ? 'bg-[#151F33] text-amber-300 border border-amber-400/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#151F33]/50'
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          <span>Lộ trình</span>
          {routeDestinations.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center ml-0.5">
              {routeDestinations.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Subregions & Destination Groups */}
      {activeTab === 'regions' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {/* Quick Subregion Filter Strip */}
          <div className="flex items-center justify-between pb-2 border-b border-[#243049]/60 px-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              5 Phân vùng địa lý
            </span>
            {activeSubregion !== 'All' && (
              <button
                onClick={() => onSelectSubregion('All')}
                className="text-[11px] text-[#3DDC97] hover:underline font-medium"
              >
                Hiện tất cả
              </button>
            )}
          </div>

          {NORTH_MAP_SUBREGIONS.map((subregion) => {
            const items = destinationsBySubregion[subregion.id] || [];
            const isExpanded = !!expandedSubregions[subregion.id];
            const isCurrentSubregion = activeSubregion === subregion.id;

            return (
              <div
                key={subregion.id}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isCurrentSubregion
                    ? 'border-[#3DDC97]/60 bg-[#121C30]/80 shadow-lg shadow-[#3DDC97]/5'
                    : 'border-[#243049] bg-[#121C30]/40 hover:border-slate-600'
                }`}
              >
                {/* Accordion Subregion Header */}
                <div className="flex items-center justify-between p-3 cursor-pointer select-none">
                  <div
                    className="flex-1 flex items-center gap-2"
                    onClick={() => toggleSubregionAccordion(subregion.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-sm text-white flex items-center gap-2">
                        <span>{subregion.label}</span>
                        <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#151F33] text-slate-400 border border-[#243049]">
                          {items.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {subregion.countHint}
                      </p>
                    </div>
                  </div>

                  {/* Fit to Region Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSubregion(subregion.id);
                    }}
                    title={`Phóng to toàn vùng ${subregion.label}`}
                    className="ml-2 p-1.5 rounded-lg bg-[#151F33] hover:bg-[#1C2A45] text-slate-300 hover:text-[#3DDC97] border border-[#243049] transition-colors shrink-0"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subregion Destination List */}
                {isExpanded && (
                  <div className="border-t border-[#243049]/60 bg-[#0E1626]/60 p-1.5 space-y-1">
                    {items.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2 text-center italic">
                        Không có điểm đến phù hợp với bộ lọc hiện tại.
                      </p>
                    ) : (
                      items.map((dest) => {
                        const isSelected = selectedDestination?.id === dest.id;
                        const style =
                          CATEGORY_STYLE_CONFIG[dest.category] ||
                          CATEGORY_STYLE_CONFIG['Cảnh quan thiên nhiên'];

                        return (
                          <button
                            key={dest.id}
                            onClick={() => onSelectDestination(dest)}
                            className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between group ${
                              isSelected
                                ? 'bg-[#151F33] border border-[#48E3EF]/50 shadow-md'
                                : 'hover:bg-[#121C30] border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: style.color }}
                              />
                              <div className="min-w-0">
                                <div
                                  className={`text-xs font-medium truncate ${
                                    isSelected
                                      ? 'text-[#48E3EF] font-semibold'
                                      : 'text-slate-200 group-hover:text-white'
                                  }`}
                                >
                                  {dest.vietnameseName}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {dest.provinceOrRegion} • {dest.category}
                                </div>
                              </div>
                            </div>

                            {/* Verification indicator */}
                            <div className="shrink-0 ml-2">
                              {dest.verificationStatus === 'verified' ? (
                                <span className="text-[10px] text-emerald-400/80">✓</span>
                              ) : (
                                <span className="text-[10px] text-amber-400/80">⚠️</span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Filters */}
      {activeTab === 'filters' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                10 Chủ đề trải nghiệm
              </h3>
              {selectedCategories.length > 0 && (
                <button
                  onClick={onClearCategories}
                  className="text-xs text-[#3DDC97] hover:underline"
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {NORTH_MAP_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                const style =
                  CATEGORY_STYLE_CONFIG[cat.id] ||
                  CATEGORY_STYLE_CONFIG['Cảnh quan thiên nhiên'];
                const count = allDestinations.filter((d) => d.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => onToggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#151F33] text-white shadow-md'
                        : 'bg-[#121C30]/60 text-slate-400 border-[#243049] hover:text-white hover:border-slate-500'
                    }`}
                    style={{
                      borderColor: isSelected ? style.color : undefined,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: style.color }}
                    />
                    <span>{cat.label}</span>
                    <span className="text-[10px] text-slate-400 opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coordinate Verification Info */}
          <div className="p-3 rounded-xl bg-[#121C30] border border-[#243049] text-xs space-y-2 text-slate-300">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#3DDC97]" />
              <span>Tiêu chuẩn tọa độ địa lý</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              100% điểm đến trên bản đồ được ánh xạ theo tọa độ địa lý thực tế (GPS WGS84) xác thực từ nguồn Tổng cục Du lịch và OpenStreetMap, không dùng tọa độ ước lượng.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Route Explorer */}
      {activeTab === 'route' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#243049]">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                Khám phá tuyến đường
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chọn các điểm trên bản đồ để nối tuyến
              </p>
            </div>
            {routeDestinations.length > 0 && (
              <button
                onClick={onClearRoute}
                title="Xóa toàn bộ lộ trình"
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {routeDestinations.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#151F33] border border-[#243049] flex items-center justify-center mx-auto text-amber-400">
                <Route className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chưa có điểm nào trong tuyến. Hãy bấm vào các điểm đến trên bản đồ hoặc bảng chi tiết và chọn <strong className="text-white">"Thêm vào Lộ trình"</strong>.
              </p>
            </div>
          ) : (
            <>
              {/* Waypoint List */}
              <div className="space-y-2">
                {routeDestinations.map((dest, idx) => (
                  <div
                    key={dest.id}
                    className="p-2.5 rounded-xl bg-[#121C30] border border-[#243049] flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-[#3DDC97] text-slate-950 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {dest.vietnameseName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {dest.latitude.toFixed(2)}°B, {dest.longitude.toFixed(2)}°Đ
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveRouteDestination(dest.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Bỏ khỏi lộ trình"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Route Summary & Distance Metrics */}
              {routeResult && routeDestinations.length >= 2 && (
                <div className="p-3 rounded-xl bg-[#151F33] border border-[#3DDC97]/40 shadow-lg space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#3DDC97]" />
                    <span>Thông số đo đạc tuyến</span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-[#243049]">
                    <span className="text-slate-400">Khoảng cách địa lý thẳng (Haversine):</span>
                    <span className="font-bold text-[#48E3EF] text-sm">
                      {routeResult.totalGeographicDistanceKm} km
                    </span>
                  </div>

                  {routeResult.estimatedDriveTimeHours !== undefined && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Thời gian di chuyển ước lượng:
                      </span>
                      <span className="font-semibold text-white">
                        ~{routeResult.estimatedDriveTimeHours} giờ
                      </span>
                    </div>
                  )}

                  <div className="pt-2 text-[10px] text-slate-400 leading-normal border-t border-[#243049]/60 italic">
                    {routeResult.terrainType === 'mountain_pass'
                      ? '⚠️ Tuyến đường vùng núi Tây Bắc/Đông Bắc có nhiều đèo dốc quanh co (Ô Quy Hồ, Pha Đin, Mã Pí Lèng), tốc độ an toàn trung bình ~35-40 km/h.'
                      : '✓ Tuyến đồng bằng & duyên hải kết nối qua các trục cao tốc (CT05, CT04, CT01), thời gian di chuyển thuận lợi.'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Footer Status Bar */}
      <div className="px-4 py-2.5 border-t border-[#243049] bg-[#0E1626] text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#3DDC97]" />
          <span>TRAVI North Map • Miền Bắc</span>
        </span>
        <span className="text-slate-400">81 điểm du lịch</span>
      </div>
    </aside>
  );
};
