import React, { useState, useMemo, useCallback } from 'react';
import { LeafletNorthMap } from '../components/map/LeafletNorthMap.tsx';
import { NorthMapSidebar } from '../components/map/NorthMapSidebar.tsx';
import { NorthMapDetailPanel } from '../components/map/NorthMapDetailPanel.tsx';
import {
  northVietnamDestinations,
  NORTH_MAP_SUBREGIONS,
} from '../data/northVietnamData.ts';
import type {
  NorthDestinationRecord,
  NorthMapCategory,
  NorthMapSubregion,
} from '../types/northMap.ts';
import { calculateRouteSummary } from '../services/map/routeEngine.ts';
import {
  Search,
  MapPin,
  Compass,
  Maximize2,
  Minimize2,
  List,
  Map as MapIcon,
  X,
  Sparkles,
  SlidersHorizontal,
  Shield,
} from 'lucide-react';

export const NorthMapPage: React.FC = () => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubregion, setActiveSubregion] = useState<NorthMapSubregion | 'All'>('All');
  const [selectedCategories, setSelectedCategories] = useState<NorthMapCategory[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<NorthDestinationRecord | null>(null);

  // View States
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false);
  const [isIslandsInsetOpen, setIsIslandsInsetOpen] = useState<boolean>(false);

  // Route Explorer Selected Destinations
  const [routeDestinations, setRouteDestinations] = useState<NorthDestinationRecord[]>([]);

  // Filter logic
  const filteredDestinations = useMemo(() => {
    return northVietnamDestinations.filter((dest) => {
      // 1. Subregion Filter
      if (activeSubregion !== 'All' && dest.subregion !== activeSubregion) {
        return false;
      }

      // 2. Category Filter (multi-select: must match at least one if any selected)
      if (selectedCategories.length > 0 && !selectedCategories.includes(dest.category)) {
        return false;
      }

      // 3. Search Query Filter (searches across name, vietnameseName, province, subregion, aliases)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = dest.name.toLowerCase().includes(q);
        const matchVnName = dest.vietnameseName.toLowerCase().includes(q);
        const matchProvince = dest.provinceOrRegion.toLowerCase().includes(q);
        const matchSubregion = dest.subregion.toLowerCase().includes(q);
        const matchAliases =
          dest.historicalAliases?.some((alias) => alias.toLowerCase().includes(q)) ?? false;

        if (!matchName && !matchVnName && !matchProvince && !matchSubregion && !matchAliases) {
          return false;
        }
      }

      return true;
    });
  }, [activeSubregion, selectedCategories, searchQuery]);

  // Route calculation result
  const routeResult = useMemo(() => {
    return calculateRouteSummary(routeDestinations);
  }, [routeDestinations]);

  // Handlers
  const handleToggleCategory = useCallback((category: NorthMapCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }, []);

  const handleClearCategories = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  const handleToggleRoute = useCallback((dest: NorthDestinationRecord) => {
    setRouteDestinations((prev) => {
      const exists = prev.some((d) => d.id === dest.id);
      if (exists) {
        return prev.filter((d) => d.id !== dest.id);
      } else {
        return [...prev, dest];
      }
    });
  }, []);

  const handleRemoveRouteDestination = useCallback((destId: string) => {
    setRouteDestinations((prev) => prev.filter((d) => d.id !== destId));
  }, []);

  const handleClearRoute = useCallback(() => {
    setRouteDestinations([]);
  }, []);

  const handleSelectDestination = useCallback((dest: NorthDestinationRecord) => {
    setSelectedDestination(dest);
    // On mobile, close sidebar if open so detail panel shows nicely
    setShowMobileSidebar(false);
  }, []);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
  }, []);

  return (
    <div
      className={`flex flex-col bg-[#080D18] text-[#F4F7FF] transition-all overflow-hidden ${
        isFullScreen
          ? 'fixed inset-0 z-50 h-screen w-screen'
          : 'h-[calc(100vh-4rem)] min-h-[600px] w-full'
      }`}
    >
      {/* ===================================================================== */}
      {/* TOP BAR */}
      {/* ===================================================================== */}
      <header
        aria-label="Thanh công cụ Bản đồ khám phá miền Bắc"
        className="h-16 px-4 md:px-6 bg-[#0E1626] border-b border-[#243049] flex items-center justify-between gap-3 shrink-0 z-20 shadow-md"
      >
        {/* Left: Feature Title & Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3DDC97] to-[#48E3EF] flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-[#3DDC97]/20">
            <Compass className="w-5 h-5 text-slate-950 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold font-serif text-white tracking-tight leading-none">
                TRAVI NORTH MAP
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#3DDC97] bg-[#3DDC97]/15 border border-[#3DDC97]/30 px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                Miền Bắc
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans hidden md:block">
              Bản đồ khám phá miền Bắc • 81 địa danh & tuyến đường
            </p>
          </div>
        </div>

        {/* Center: Search Box */}
        <div className="flex-1 max-w-md relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm Sa Pa, Hà Giang, Bản Giốc, Hạ Long, Tràng An..."
              aria-label="Tìm kiếm điểm đến miền Bắc"
              className="w-full bg-[#121C30] hover:bg-[#151F33] focus:bg-[#151F33] text-xs text-white placeholder-slate-400 pl-9 pr-8 py-2 rounded-xl border border-[#243049] focus:border-[#48E3EF] focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-white"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Subregion Bar, List Toggle & Full Screen */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Subregion Dropdown / Selector (Desktop) */}
          <div className="hidden lg:flex items-center gap-1 bg-[#121C30] p-1 rounded-xl border border-[#243049]">
            <button
              onClick={() => setActiveSubregion('All')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeSubregion === 'All'
                  ? 'bg-[#151F33] text-[#3DDC97] font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Toàn cảnh
            </button>
            {NORTH_MAP_SUBREGIONS.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSubregion(sub.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeSubregion === sub.id
                    ? 'bg-[#151F33] text-[#3DDC97] font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Biển đảo Việt Nam Quick Trigger Button */}
          <button
            onClick={() => {
              setViewMode('map');
              setIsIslandsInsetOpen((prev) => !prev);
            }}
            title="Biển đảo Việt Nam: Hoàng Sa & Trường Sa"
            aria-label="Biển đảo Việt Nam"
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm active:scale-95 ${
              isIslandsInsetOpen
                ? 'bg-red-600 text-white border-amber-400 shadow-red-500/20'
                : 'bg-gradient-to-r from-red-950/60 to-[#121C30] hover:from-red-900/70 hover:to-[#151F33] text-amber-300 hover:text-white border-amber-400/40'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="hidden sm:inline">Biển đảo VN</span>
          </button>

          {/* Mobile Sidebar Toggle Button */}
          <button
            onClick={() => setShowMobileSidebar((prev) => !prev)}
            aria-label="Bộ lọc và danh sách"
            className="md:hidden p-2 rounded-xl bg-[#121C30] text-slate-300 hover:text-white border border-[#243049]"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Map / List View Toggle */}
          <button
            onClick={() => setViewMode((prev) => (prev === 'map' ? 'list' : 'map'))}
            title={viewMode === 'map' ? 'Xem chế độ danh sách lưới' : 'Xem chế độ bản đồ tương tác'}
            aria-label="Chuyển chế độ xem bản đồ / danh sách"
            className="px-3 py-1.5 rounded-xl bg-[#121C30] hover:bg-[#151F33] text-slate-300 hover:text-white border border-[#243049] flex items-center gap-1.5 text-xs font-medium transition-all"
          >
            {viewMode === 'map' ? (
              <>
                <List className="w-4 h-4 text-[#48E3EF]" />
                <span className="hidden sm:inline">Danh sách</span>
              </>
            ) : (
              <>
                <MapIcon className="w-4 h-4 text-[#3DDC97]" />
                <span className="hidden sm:inline">Bản đồ</span>
              </>
            )}
          </button>

          {/* Full Screen Toggle */}
          <button
            onClick={toggleFullScreen}
            title={isFullScreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
            aria-label="Toàn màn hình"
            className="p-2 rounded-xl bg-[#121C30] hover:bg-[#151F33] text-slate-300 hover:text-[#48E3EF] border border-[#243049] transition-all"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MAIN VIEWPORT CANVAS */}
      {/* ===================================================================== */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Left Sidebar (Desktop always, mobile modal drawer) */}
        <div
          className={`${
            showMobileSidebar ? 'fixed inset-y-16 left-0 z-40 flex' : 'hidden md:flex'
          }`}
        >
          <NorthMapSidebar
            destinations={filteredDestinations}
            allDestinations={northVietnamDestinations}
            selectedDestination={selectedDestination}
            onSelectDestination={handleSelectDestination}
            activeSubregion={activeSubregion}
            onSelectSubregion={setActiveSubregion}
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
            onClearCategories={handleClearCategories}
            routeDestinations={routeDestinations}
            routeResult={routeResult}
            onRemoveRouteDestination={handleRemoveRouteDestination}
            onClearRoute={handleClearRoute}
          />
        </div>

        {/* Center / Right Content */}
        {viewMode === 'map' ? (
          <div className="flex-1 relative h-full w-full overflow-hidden">
            {/* Real Interactive Leaflet Canvas */}
            <LeafletNorthMap
              destinations={filteredDestinations}
              selectedDestination={selectedDestination}
              onSelectDestination={handleSelectDestination}
              activeSubregion={activeSubregion}
              routeResult={routeResult}
              routeDestinations={routeDestinations}
              isFullScreen={isFullScreen}
              onToggleFullScreen={toggleFullScreen}
              isIslandsInsetOpen={isIslandsInsetOpen}
              onToggleIslandsInset={setIsIslandsInsetOpen}
            />

            {/* Destination Detail Panel (Desktop Drawer / Mobile Bottom Sheet) */}
            <NorthMapDetailPanel
              destination={selectedDestination}
              onClose={() => setSelectedDestination(null)}
              onSelectNearby={handleSelectDestination}
              allDestinations={northVietnamDestinations}
              isInRoute={
                selectedDestination
                  ? routeDestinations.some((d) => d.id === selectedDestination.id)
                  : false
              }
              onToggleRoute={handleToggleRoute}
            />
          </div>
        ) : (
          /* List Mode Grid */
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#080D18]">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-[#243049] pb-4">
                <div>
                  <h2 className="text-xl font-bold font-serif text-white">
                    Khám phá theo danh sách ({filteredDestinations.length} điểm)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Hiển thị các điểm đến miền Bắc đã xác thực tọa độ địa lý thực tế
                  </p>
                </div>
                <button
                  onClick={() => setViewMode('map')}
                  className="px-3.5 py-2 rounded-xl bg-[#3DDC97] text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-[#3DDC97]/20"
                >
                  <MapIcon className="w-4 h-4" />
                  <span>Mở trên bản đồ</span>
                </button>
              </div>

              {filteredDestinations.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#151F33] flex items-center justify-center mx-auto text-slate-500">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Không tìm thấy điểm đến</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Thử thay đổi từ khóa tìm kiếm hoặc chọn lại phân vùng và chủ đề khám phá.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredDestinations.map((dest) => (
                    <div
                      key={dest.id}
                      onClick={() => {
                        handleSelectDestination(dest);
                        setViewMode('map');
                      }}
                      className="group bg-[#0E1626] border border-[#243049] hover:border-[#3DDC97] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col"
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={dest.image}
                          alt={dest.vietnameseName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-md border border-white/10">
                          {dest.subregion}
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#0E1626]/90 text-[#48E3EF] border border-[#243049]">
                          {dest.category}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-baseline justify-between gap-1">
                            <h3 className="font-bold text-base text-white group-hover:text-[#3DDC97] transition-colors">
                              {dest.vietnameseName}
                            </h3>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {dest.provinceOrRegion}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-2 mt-1.5 leading-relaxed">
                            {dest.shortDescription}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#243049]/60 flex items-center justify-between text-xs text-slate-400">
                          <span className="font-mono text-[11px]">
                            {dest.latitude.toFixed(2)}°B, {dest.longitude.toFixed(2)}°Đ
                          </span>
                          <span className="text-[#3DDC97] font-medium group-hover:underline flex items-center gap-1">
                            Xem vị trí →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NorthMapPage;
