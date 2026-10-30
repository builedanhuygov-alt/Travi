import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Compass,
  Layers,
  LayoutGrid,
  Rows3,
  TrendingUp,
  Map
} from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';
import { CinematicDestinationCard } from '../components/cinematic/CinematicDestinationCard.tsx';
import { DestinationDiscoveryRail } from '../components/cinematic/DestinationDiscoveryRail.tsx';
import { SpatialHero } from '../components/cinematic/SpatialHero.tsx';
import { CulturalSignalNetwork } from '../components/cinematic/CulturalSignalNetwork.tsx';
import { DestinationComparison } from '../components/cinematic/DestinationComparison.tsx';
import { CulturalPulseModal } from '../components/cinematic/CulturalPulseModal.tsx';
import { CulturalRabbitHoleModal } from '../components/rabbithole/CulturalRabbitHoleModal.tsx';
import { TasteProfileModal } from '../components/taste/TasteProfileModal.tsx';
import { VietnamInteractiveMap } from '../components/map/VietnamInteractiveMap.tsx';

import { vietnamDestinations, VIETNAM_REGIONS, VIETNAM_CATEGORIES } from '../data/vietnamData.ts';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { triggerToast } from '../lib/toast.ts';
import { recommendationService } from '../services/recommendations/RecommendationService.ts';
import { partitionDiscoveryLanes } from '../services/recommendations/pipeline/RecommendationPipeline.ts';
import type { Destination } from '../types/index.ts';
import type { DiscoveryLane } from '../services/recommendations/types.ts';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { savedDestIds, toggleSaveDestination, tasteProfile, saveTasteProfile } = useDemoStore();

  const initialShouldOpenStudio = searchParams.get('studio') === 'true';
  const [isTasteModalOpen, setIsTasteModalOpen] = useState(initialShouldOpenStudio);

  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialRegion = searchParams.get('region') || 'All';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [sortBy, setSortBy] = useState<'affinity' | 'rating' | 'days'>('affinity');
  const [viewMode, setViewMode] = useState<'rails' | 'grid' | 'map'>('rails');

  // Shortlist for Comparison & Journey
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isPulseOpen, setIsPulseOpen] = useState(false);
  const [isRabbitHoleOpen, setIsRabbitHoleOpen] = useState(false);
  const [rabbitHoleSeed, setRabbitHoleSeed] = useState<string | undefined>(undefined);
  const [activeSignalFilter, setActiveSignalFilter] = useState<string | null>(null);

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (activeCategory !== 'All') params.set('category', activeCategory);
    if (selectedRegion !== 'All') params.set('region', selectedRegion);
    setSearchParams(params, { replace: true });
  }, [searchQuery, activeCategory, selectedRegion, setSearchParams]);

  const handleOpenRabbitHole = useCallback((seed?: string) => {
    setRabbitHoleSeed(seed);
    setIsRabbitHoleOpen(true);
  }, []);

  // Compute recommendations using Travi Vietnam Recommendation Service
  const recommendationResult = useMemo(() => {
    return recommendationService.getRecommendations({
      tasteProfile,
      categoryFilter: activeCategory,
      regionFilter: selectedRegion,
      searchQuery: searchQuery.trim(),
      sortBy,
    });
  }, [tasteProfile, activeCategory, selectedRegion, searchQuery, sortBy]);

  const allRecommendations = recommendationResult.recommendations;

  // Filter recommendations further if active signal node is selected
  const displayRecommendations = useMemo(() => {
    if (!activeSignalFilter) return allRecommendations;
    const filterNorm = activeSignalFilter.toLowerCase();
    return allRecommendations.filter((rec) => {
      const cultureTraits = rec.destination.culture
        ? Object.values(rec.destination.culture).flatMap((v) => (Array.isArray(v) ? v : []))
        : [];
      return cultureTraits.some((trait) => trait.toLowerCase().includes(filterNorm));
    });
  }, [allRecommendations, activeSignalFilter]);

  // Compute discovery lanes
  const discoveryLanes: DiscoveryLane[] = useMemo(() => {
    return partitionDiscoveryLanes(displayRecommendations);
  }, [displayRecommendations]);

  // Shortlist handling
  const handleToggleShortlist = (dest: Destination) => {
    setShortlistIds((prev) => {
      const exists = prev.includes(dest.id);
      if (exists) {
        return prev.filter((id) => id !== dest.id);
      }
      if (prev.length >= 3) {
        triggerToast('Maximum 3 destinations can be compared at once', 'info');
        return prev;
      }
      return [...prev, dest.id];
    });
  };

  const shortlistedDestinations = useMemo(() => {
    return shortlistIds
      .map((id) => allRecommendations.find((r) => r.destination.id === id)?.destination)
      .filter((d): d is Destination => Boolean(d));
  }, [shortlistIds, allRecommendations]);

  const handleBuildJourneyFromComparison = (dests: Destination[]) => {
    setIsComparisonOpen(false);
    const destParam = dests.map((d) => d.name).join(', ');
    navigate(`/copilot?destination=${encodeURIComponent(destParam)}`);
  };

  const handleSelectDestination = (dest: Destination) => {
    navigate(`/destinations/${dest.id}`);
  };

  const totalSelectionsCount = useMemo(() => {
    const pillars = ['films', 'music', 'food', 'architecture', 'art', 'history', 'nature', 'localCulture'] as const;
    return pillars.reduce((sum, p) => sum + (Array.isArray(tasteProfile[p]) ? tasteProfile[p].length : 0), 0);
  }, [tasteProfile]);

  const activePillarsCount = useMemo(() => {
    const pillars = ['films', 'music', 'food', 'architecture', 'art', 'history', 'nature', 'localCulture'] as const;
    return pillars.filter((p) => Array.isArray(tasteProfile[p]) && tasteProfile[p].length > 0).length;
  }, [tasteProfile]);

  return (
    <div className="min-h-screen bg-[#080D18] text-[#F4F7FF] pb-24">
      {/* Cinematic Spatial Hero Section */}
      <SpatialHero
        onDiscoverJourney={() => {
          const firstDest = displayRecommendations[0]?.destination.name || 'Hà Nội';
          navigate(`/copilot?destination=${encodeURIComponent(firstDest)}`);
        }}
        onExploreDestinations={() => {
          const el = document.getElementById('explore-search-controls');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenTasteStudio={() => setIsTasteModalOpen(true)}
        activePillarsCount={activePillarsCount}
        totalSelectionsCount={totalSelectionsCount}
        totalDestinationsCount={vietnamDestinations.length}
        isAiActive={true}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
        {/* Cultural Signal Network Component */}
        <CulturalSignalNetwork
          tasteProfile={tasteProfile}
          activeFilter={activeSignalFilter}
          onSelectFilter={setActiveSignalFilter}
          onOpenTasteStudio={() => setIsTasteModalOpen(true)}
          onApplyPreset={(preset) => {
            saveTasteProfile({
              ...tasteProfile,
              ...preset,
              updatedAt: new Date().toISOString(),
              isCustomized: true,
            });
            triggerToast('Applied Vietnam travel persona', 'success');
          }}
        />

        {/* Discover Vietnam Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#3DDC97]/30 bg-[#3DDC97]/10 px-3 py-1 text-xs font-semibold text-[#3DDC97] mb-2">
              <Compass className="h-3.5 w-3.5" />
              Discover Vietnam
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
              Discover Vietnam
            </h1>
            <p className="text-xs sm:text-sm text-[#9BA9C3] mt-1">
              Explore 34 provincial destinations across North Vietnam, Central Vietnam, and South Vietnam.
            </p>
          </div>
        </div>

        {/* Search, Filter & View Controls */}
        <div
          id="explore-search-controls"
          className="rounded-3xl border border-[#243049] bg-gradient-to-b from-[#0E1626]/90 via-[#0A1120]/95 to-[#080D18] p-6 backdrop-blur-xl shadow-xl mb-8"
        >
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9BA9C3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Vietnam destinations, UNESCO sites, street food, provinces..."
                className="w-full rounded-xl border border-[#243049] bg-[#0A101D] pl-10 pr-10 py-3 text-xs sm:text-sm text-white placeholder-[#4A5D7E] focus:border-[#3DDC97] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9BA9C3] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick Actions & View Mode Switcher */}
            <div className="flex items-center gap-2.5">
              {/* Cultural Pulse Button */}
              <button
                type="button"
                onClick={() => setIsPulseOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#3DDC97]/30 bg-[#3DDC97]/10 px-3.5 py-2.5 text-xs font-semibold text-[#3DDC97] hover:bg-[#3DDC97]/20 transition-all cursor-pointer shadow-sm"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Seasonal Calendar</span>
              </button>

              {/* View Mode Pills: Rails / Grid / Map */}
              <div className="flex items-center rounded-xl border border-[#243049] bg-[#080D18] p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('rails')}
                  aria-label="Curated Rails View"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === 'rails'
                      ? 'bg-[#18253E] text-white shadow-sm border border-white/10'
                      : 'text-[#9BA9C3] hover:text-white'
                  }`}
                >
                  <Rows3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Curated Rails</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid View"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-[#18253E] text-white shadow-sm border border-white/10'
                      : 'text-[#9BA9C3] hover:text-white'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  aria-label="Interactive Map View"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === 'map'
                      ? 'bg-[#3DDC97]/20 text-[#3DDC97] shadow-sm border border-[#3DDC97]/40'
                      : 'text-[#9BA9C3] hover:text-white'
                  }`}
                >
                  <Map className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Interactive Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* Regional Pills Bar */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#243049]/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9BA9C3] mr-1">
              Region:
            </span>
            <button
              onClick={() => setSelectedRegion('All')}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                selectedRegion === 'All'
                  ? 'bg-[#18253E] text-white border border-white/20'
                  : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
              }`}
            >
              All Vietnam ({vietnamDestinations.length})
            </button>
            {VIETNAM_REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap transition-all ${
                  selectedRegion === region
                    ? 'bg-[#3DDC97]/20 text-[#3DDC97] border border-[#3DDC97]/40 shadow-sm'
                    : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          {/* Category Filter Pills Bar */}
          <div className="flex flex-wrap items-center gap-2 mt-3 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9BA9C3] mr-1">
              Category:
            </span>
            <button
              onClick={() => setActiveCategory('All')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                activeCategory === 'All'
                  ? 'bg-[#18253E] text-white border border-white/20'
                  : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
              }`}
            >
              All Categories
            </button>
            {VIETNAM_CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.label
                    ? 'bg-[#48E3EF]/20 text-[#48E3EF] border border-[#48E3EF]/40 shadow-sm'
                    : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Shortlist Drawer Bar (Floating) */}
        {shortlistIds.length > 0 && (
          <div className="sticky top-24 z-30 mb-8 rounded-2xl border border-[#48E3EF]/40 bg-[#0E1626]/95 p-4 shadow-2xl backdrop-blur-xl animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#48E3EF]/20 text-[#48E3EF] border border-[#48E3EF]/40">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    Comparison Shortlist ({shortlistIds.length}/3 Destinations)
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    {shortlistedDestinations.map((d) => (
                      <span
                        key={d.id}
                        className="inline-flex items-center gap-1 text-[11px] text-[#C4D0E5] bg-[#18253E] px-2 py-0.5 rounded-md"
                      >
                        <span>{d.name}</span>
                        <button
                          onClick={() => handleToggleShortlist(d)}
                          className="hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShortlistIds([])}
                  className="text-xs text-[#9BA9C3] hover:text-white"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsComparisonOpen(true)}
                  className="bg-[#48E3EF] text-[#080D18] hover:bg-[#3AC9D4] font-semibold text-xs"
                >
                  Compare Side-by-Side
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Content Rendering */}
        {viewMode === 'map' ? (
          /* Interactive Map View */
          <div className="space-y-6">
            <VietnamInteractiveMap
              onSelectDestination={(dest) => handleSelectDestination({ id: dest.id, name: dest.name } as Destination)}
              highlightedIds={shortlistIds}
            />
          </div>
        ) : viewMode === 'rails' && !searchQuery.trim() && activeCategory === 'All' && selectedRegion === 'All' ? (
          /* Curated Discovery Rails */
          <div className="space-y-12">
            {discoveryLanes.map((lane) => (
              <DestinationDiscoveryRail
                key={lane.id}
                lane={lane}
                savedDestIds={savedDestIds}
                shortlistIds={shortlistIds}
                onSelectDestination={handleSelectDestination}
                onToggleSave={(dest) => toggleSaveDestination(dest.id)}
                onToggleShortlist={handleToggleShortlist}
                onBuildJourney={(dest) => navigate(`/copilot?destination=${encodeURIComponent(dest.name)}`)}
                onExploreRabbitHole={handleOpenRabbitHole}
              />
            ))}
          </div>
        ) : (
          /* Grid View for Filtered Results or Explicit Selection */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-white">
                {displayRecommendations.length}{' '}
                {displayRecommendations.length === 1 ? 'Sanctuary Found' : 'Sanctuaries Found'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-[#9BA9C3]">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-lg border border-[#243049] bg-[#0E1626] px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="affinity">Relevance Alignment</option>
                  <option value="rating">Top Rated</option>
                  <option value="days">Recommended Duration</option>
                </select>
              </div>
            </div>

            {displayRecommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#243049] bg-[#0E1626] p-12 text-center">
                <Compass className="h-10 w-10 text-[#4A5D7E] mb-3" />
                <h4 className="text-base font-bold text-white mb-1">No Sanctuaries Matched</h4>
                <p className="text-xs text-[#9BA9C3] max-w-md mb-4 leading-relaxed">
                  No destinations matched your search and filter criteria. Try expanding your search terms or clearing region filters.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('All');
                    setSelectedRegion('All');
                  }}
                  className="text-xs border-[#243049] text-white"
                >
                  Reset All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayRecommendations.map((rec) => (
                  <CinematicDestinationCard
                    key={rec.destination.id}
                    recommendation={rec}
                    onSelect={handleSelectDestination}
                    isSaved={savedDestIds.includes(rec.destination.id)}
                    onToggleSave={(dest) => toggleSaveDestination(dest.id)}
                    isShortlisted={shortlistIds.includes(rec.destination.id)}
                    onToggleShortlist={handleToggleShortlist}
                    onBuildJourney={(dest) => navigate(`/copilot?destination=${encodeURIComponent(dest.name)}`)}
                    onExploreRabbitHole={handleOpenRabbitHole}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <TasteProfileModal
        isOpen={isTasteModalOpen}
        onClose={() => setIsTasteModalOpen(false)}
      />

      <DestinationComparison
        shortlistDestinations={shortlistedDestinations}
        allRecommendations={allRecommendations}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onRemoveFromShortlist={(destId) => setShortlistIds((prev) => prev.filter((id) => id !== destId))}
        onClearShortlist={() => setShortlistIds([])}
        onBuildJourneyFromComparison={handleBuildJourneyFromComparison}
        onSelectDestination={handleSelectDestination}
      />

      <CulturalPulseModal
        isOpen={isPulseOpen}
        onClose={() => setIsPulseOpen(false)}
        onSelectDestination={(destId) => navigate(`/destinations/${destId}`)}
      />

      <CulturalRabbitHoleModal
        isOpen={isRabbitHoleOpen}
        onClose={() => setIsRabbitHoleOpen(false)}
        initialSeed={rabbitHoleSeed}
      />
    </div>
  );
};

export default ExplorePage;
