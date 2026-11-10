import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Clock,
  ArrowRight,
  MapPin,
  Sparkles,
  Utensils,
  BookOpen,
  Landmark,
  Trash2,
  Filter
} from 'lucide-react';
import {
  vietnamSearchEngine,
  type UnifiedDiscoveryItem,
  type GroupedSearchResults,
} from '../../services/search/vietnamSearchEngine.ts';
import { VIETNAM_REGIONS } from '../../data/vietnamData.ts';
import { translateRegion } from '../../lib/i18n/index.ts';
import type { VietnamRegion } from '../../types/vietnam.ts';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [selectedRegion, setSelectedRegion] = useState<VietnamRegion | 'All'>('All');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => vietnamSearchEngine.getRecentSearches());

  // Derive suggestions dynamically as query changes
  const suggestions = useMemo(() => {
    if (query.trim().length >= 2) {
      return vietnamSearchEngine.getSuggestions(query, 5);
    }
    return [];
  }, [query]);

  // Sync initial query and focus when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setQuery(initialQuery);
        setRecentSearches(vietnamSearchEngine.getRecentSearches());
        inputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialQuery]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Execute grouped search
  const searchResults: GroupedSearchResults = useMemo(() => {
    if (!query.trim()) {
      return {
        query: '',
        totalCount: 0,
        destinations: [],
        experiences: [],
        food: [],
        heritage: [],
        stories: [],
      };
    }

    return vietnamSearchEngine.search(query, {
      region: selectedRegion,
      limit: 6,
    });
  }, [query, selectedRegion]);

  const handleSelectRecentOrSuggestion = (term: string) => {
    setQuery(term);
    vietnamSearchEngine.addRecentSearch(term);
    setRecentSearches(vietnamSearchEngine.getRecentSearches());
  };

  const handleClearHistory = () => {
    vietnamSearchEngine.clearRecentSearches();
    setRecentSearches([]);
  };

  const handleSelectResult = (item: UnifiedDiscoveryItem) => {
    vietnamSearchEngine.addRecentSearch(item.vietnameseName || item.name);
    onClose();
    navigate(item.routeUrl);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    vietnamSearchEngine.addRecentSearch(query.trim());
    onClose();
    navigate(`/explore?search=${encodeURIComponent(query.trim())}`);
  };

  if (!isOpen) return null;

  const hasResults = searchResults.totalCount > 0;
  const isQueryEmpty = !query.trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Khung tìm kiếm khám phá Việt Nam"
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 px-4 bg-black/80 backdrop-blur-md animate-modal-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl border border-[#243049] bg-[#0E1626] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#F4F7FF]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Search Bar Input */}
        <form onSubmit={handleFormSubmit} className="relative border-b border-[#243049]/80 bg-[#080D18]/80 p-4">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-[#3DDC97] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tỉnh thành, địa danh, món ngon, làng nghề (vd: Hội An, Phở, Bát Tràng)..."
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-[#9BA9C3] focus:outline-none"
              aria-label="Tìm kiếm khám phá Việt Nam"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-[#9BA9C3] hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                title="Xóa nội dung tìm kiếm"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="hidden sm:inline-flex items-center justify-center rounded-lg border border-[#243049] bg-[#18253E]/60 px-2.5 py-1 text-[11px] font-mono text-[#9BA9C3] hover:text-white transition-colors cursor-pointer"
            >
              ESC
            </button>
          </div>

          {/* Regional Filter Pills */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] text-[#9BA9C3] font-medium mr-1 flex items-center gap-1 shrink-0">
              <Filter className="h-3 w-3 text-[#3DDC97]" />
              Vùng miền:
            </span>
            <button
              type="button"
              onClick={() => setSelectedRegion('All')}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                selectedRegion === 'All'
                  ? 'bg-[#3DDC97] text-[#080D18] font-semibold'
                  : 'bg-white/5 text-[#9BA9C3] hover:text-white border border-white/10'
              }`}
            >
              Tất cả
            </button>
            {VIETNAM_REGIONS.map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setSelectedRegion(reg)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedRegion === reg
                    ? 'bg-[#3DDC97] text-[#080D18] font-semibold'
                    : 'bg-white/5 text-[#9BA9C3] hover:text-white border border-white/10'
                }`}
              >
                {translateRegion(reg)}
              </button>
            ))}
          </div>
        </form>

        {/* Scrollable Results / Suggestions / History Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* A. If Query is Empty: Show Recent Searches & Curated Suggestions */}
          {isQueryEmpty && (
            <div className="space-y-6">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#9BA9C3] mb-3">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#48E3EF]" />
                      Lịch sử tìm kiếm
                    </span>
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="text-[11px] text-[#9BA9C3] hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors normal-case"
                    >
                      <Trash2 className="h-3 w-3" />
                      Xóa lịch sử
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleSelectRecentOrSuggestion(term)}
                        className="rounded-full border border-[#243049] bg-[#18253E]/50 px-3 py-1.5 text-xs text-white/90 hover:border-[#3DDC97] hover:text-[#3DDC97] transition-colors cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Curated Discovery Inspiration */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9BA9C3] mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#3DDC97]" />
                  Gợi ý khám phá tiêu biểu
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { title: 'Phố cổ Hội An', sub: 'Di sản & Đèn lồng' },
                    { title: 'Phở Bát Đàn', sub: 'Hương vị Hà Nội 100 năm' },
                    { title: 'Gốm Bát Tràng', sub: 'Làng nghề 800 năm' },
                    { title: 'Đèo Mã Pí Lèng', sub: 'Kỳ vĩ Hà Giang' },
                    { title: 'Cố đô Huế', sub: 'Ẩm thực & Cung đình' },
                    { title: 'Chợ nổi Cái Răng', sub: 'Sông nước Cần Thơ' },
                  ].map((rec) => (
                    <button
                      key={rec.title}
                      type="button"
                      onClick={() => handleSelectRecentOrSuggestion(rec.title)}
                      className="flex flex-col items-start p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-[#18253E] hover:border-[#3DDC97]/40 transition-all text-left cursor-pointer"
                    >
                      <span className="text-xs font-medium text-white">{rec.title}</span>
                      <span className="text-[10px] text-[#9BA9C3] mt-0.5">{rec.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* B. Live Suggestions Dropdown while typing */}
          {!isQueryEmpty && suggestions.length > 0 && (
            <div className="border-b border-[#243049]/60 pb-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#3DDC97] mb-2 block">
                Gợi ý cụm từ:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleSelectRecentOrSuggestion(sug)}
                    className="rounded-lg bg-[#18253E] border border-white/10 px-2.5 py-1 text-xs text-white hover:border-[#3DDC97] hover:text-[#3DDC97] transition-colors cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* C. Grouped Search Results Display */}
          {!isQueryEmpty && hasResults && (
            <div className="space-y-6">
              {/* Group 1: Điểm đến (Destinations) */}
              {searchResults.destinations.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#3DDC97] mb-3 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    Điểm đến ({searchResults.destinations.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {searchResults.destinations.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item)}
                        className="group flex items-center gap-3 p-2.5 rounded-2xl border border-white/5 bg-[#141E33]/70 hover:bg-[#18253E] hover:border-[#3DDC97]/50 transition-all cursor-pointer"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.vietnameseName}
                            className="h-14 w-14 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-semibold text-white group-hover:text-[#3DDC97] transition-colors truncate">
                            {item.vietnameseName}
                          </h5>
                          <p className="text-[11px] text-[#9BA9C3] truncate">{item.administrativeUnit || item.region}</p>
                          <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#9BA9C3]">
                            {item.verificationStatus}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#9BA9C3] group-hover:text-[#3DDC97] transition-transform group-hover:translate-x-1 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group 2: Trải nghiệm bản địa (Experiences) */}
              {searchResults.experiences.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#48E3EF] mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Trải nghiệm bản địa ({searchResults.experiences.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {searchResults.experiences.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item)}
                        className="group flex items-center gap-3 p-2.5 rounded-2xl border border-white/5 bg-[#141E33]/70 hover:bg-[#18253E] hover:border-[#48E3EF]/50 transition-all cursor-pointer"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.vietnameseName}
                            className="h-14 w-14 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-semibold text-white group-hover:text-[#48E3EF] transition-colors truncate">
                            {item.vietnameseName}
                          </h5>
                          <p className="text-[11px] text-[#9BA9C3] truncate">{item.administrativeUnit || item.region}</p>
                          <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#48E3EF]/10 text-[#48E3EF]">
                            {item.category}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#9BA9C3] group-hover:text-[#48E3EF] transition-transform group-hover:translate-x-1 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group 3: Ẩm thực (Food) */}
              {searchResults.food.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F5A623] mb-3 flex items-center gap-1.5">
                    <Utensils className="h-4 w-4" />
                    Ẩm thực vùng miền ({searchResults.food.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {searchResults.food.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item)}
                        className="group flex items-center gap-3 p-2.5 rounded-2xl border border-white/5 bg-[#141E33]/70 hover:bg-[#18253E] hover:border-[#F5A623]/50 transition-all cursor-pointer"
                      >
                        <div className="h-10 w-10 rounded-xl bg-[#F5A623]/10 flex items-center justify-center text-[#F5A623] shrink-0">
                          <Utensils className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-semibold text-white group-hover:text-[#F5A623] transition-colors truncate">
                            {item.vietnameseName}
                          </h5>
                          <p className="text-[11px] text-[#9BA9C3] truncate">{item.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#9BA9C3] group-hover:text-[#F5A623] transition-transform group-hover:translate-x-1 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group 4: Văn hóa & Di sản (Heritage) */}
              {searchResults.heritage.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A78BFA] mb-3 flex items-center gap-1.5">
                    <Landmark className="h-4 w-4" />
                    Văn hóa và di sản ({searchResults.heritage.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {searchResults.heritage.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item)}
                        className="group flex items-center gap-3 p-2.5 rounded-2xl border border-white/5 bg-[#141E33]/70 hover:bg-[#18253E] hover:border-[#A78BFA]/50 transition-all cursor-pointer"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.vietnameseName}
                            className="h-12 w-12 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-semibold text-white group-hover:text-[#A78BFA] transition-colors truncate">
                            {item.vietnameseName}
                          </h5>
                          <p className="text-[11px] text-[#9BA9C3] truncate">{item.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#9BA9C3] group-hover:text-[#A78BFA] transition-transform group-hover:translate-x-1 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group 5: Câu chuyện du lịch (Stories) */}
              {searchResults.stories.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#EC4899] mb-3 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    Câu chuyện du lịch ({searchResults.stories.length})
                  </h4>
                  <div className="space-y-2">
                    {searchResults.stories.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item)}
                        className="group flex items-start gap-3 p-2.5 rounded-2xl border border-white/5 bg-[#141E33]/70 hover:bg-[#18253E] hover:border-[#EC4899]/50 transition-all cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-xl bg-[#EC4899]/10 flex items-center justify-center text-[#EC4899] shrink-0 mt-0.5">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-semibold text-white group-hover:text-[#EC4899] transition-colors line-clamp-1">
                            {item.vietnameseName}
                          </h5>
                          <p className="text-[11px] text-[#9BA9C3] line-clamp-2 mt-0.5">{item.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#9BA9C3] group-hover:text-[#EC4899] transition-transform group-hover:translate-x-1 shrink-0 mt-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* D. Empty State when query has no matches */}
          {!isQueryEmpty && !hasResults && (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-[#9BA9C3] mb-4">
                <Search className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">
                Không tìm thấy kết quả cho &ldquo;{query}&rdquo;
              </h4>
              <p className="text-xs text-[#9BA9C3] max-w-sm mb-6">
                Thử tìm với tên không dấu, từ khóa rộng hơn hoặc thử một trong những gợi ý dưới đây:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
                {['Hội An', 'Hà Nội', 'Đà Nẵng', 'Huế', 'Phở', 'Bát Tràng', 'Mã Pí Lèng', 'Sài Gòn'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSelectRecentOrSuggestion(term)}
                    className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white hover:border-[#3DDC97] hover:text-[#3DDC97] transition-colors cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="border-t border-[#243049]/60 bg-[#080D18]/90 px-4 py-2.5 flex items-center justify-between text-[11px] text-[#9BA9C3]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3DDC97]" />
            Chỉ mục quốc gia TRAVI: 34 đơn vị hành chính, điểm đến, ẩm thực & di sản
          </span>
          <button
            type="button"
            onClick={handleFormSubmit}
            className="text-[#3DDC97] hover:underline font-medium cursor-pointer"
          >
            Xem trang kết quả đầy đủ &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
