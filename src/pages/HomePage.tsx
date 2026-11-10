import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Search,
  Heart,
  Utensils,
  Share2,
  Check,
  Users,
  Bookmark
} from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Card } from '../components/ui/Card.tsx';
import { ImageWithFallback } from '../components/ui/ImageWithFallback.tsx';
import { vietnamDestinations, VIETNAM_REGIONS } from '../data/vietnamData.ts';
import { VIETNAM_ADMINISTRATIVE_UNITS } from '../data/vietnamAdministrativeUnits.ts';
import { vietnamExperiences } from '../data/vietnamExperiences.ts';
import { traviStories } from '../data/vietnamStories.ts';
import { discoveryEngine, type AudiencePersona } from '../services/recommendations/discoveryEngine.ts';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { triggerToast } from '../lib/toast.ts';
import { translateRegion } from '../lib/i18n/index.ts';
import type { VietnamRegion } from '../types/vietnam.ts';
import { GlobalSearchModal } from '../components/search/GlobalSearchModal.tsx';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<AudiencePersona>('all');
  const [selectedRegion, setSelectedRegion] = useState<VietnamRegion | 'All'>('All');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [copiedStoryId, setCopiedStoryId] = useState<string | null>(null);

  const {
    savedDestIds,
    toggleSaveDestination,
    savedExpIds,
    toggleSaveExperience,
    savedStoryIds,
    toggleSaveStory,
    exploredPlaceIds,
    tasteProfile,
  } = useDemoStore();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      setIsSearchModalOpen(true);
    }
  };

  const handleQuickChipSearch = (term: string) => {
    navigate(`/explore?search=${encodeURIComponent(term)}`);
  };

  // 1. Gợi ý dành cho bạn (Personalized & Deterministic Recommendation Lane)
  const personalizedLane = useMemo(() => {
    return discoveryEngine.rankDestinations({
      persona: selectedPersona,
      region: selectedRegion,
      tasteProfile,
      savedDestIds,
      exploredPlaceIds,
      limit: 6,
    });
  }, [selectedPersona, selectedRegion, tasteProfile, savedDestIds, exploredPlaceIds]);

  // 2. Điểm đến nổi bật (Featured Highlights across Regions)
  const featuredDestinations = useMemo(() => {
    return vietnamDestinations
      .filter((d) => d.rating >= 4.9 && d.isCurated)
      .slice(0, 6);
  }, []);

  // 3. Những miền đất ít người biết (Hidden Gems)
  const hiddenGems = useMemo(() => {
    return vietnamDestinations
      .filter((d) => d.categories.includes('Hidden Gems') || d.isFormerProvince)
      .slice(0, 4);
  }, []);

  // 4. Văn hóa và di sản (Heritage & UNESCO Citadels)
  const heritageSites = useMemo(() => {
    return vietnamDestinations
      .filter((d) => d.categories.includes('Heritage & History'))
      .slice(0, 4);
  }, []);

  // 5. Hương vị vùng miền (Gastronomy Lineages)
  const culinaryLineages = useMemo(() => {
    const dishes: {
      name: string;
      vietnameseName: string;
      description: string;
      price: string;
      destinationName: string;
      destId: string;
      image: string;
    }[] = [];

    vietnamDestinations.forEach((d) => {
      d.mustTryFood.forEach((f) => {
        dishes.push({
          name: f.name,
          vietnameseName: f.vietnameseName,
          description: f.description,
          price: f.estimatedPriceVND,
          destinationName: d.vietnameseName,
          destId: d.id,
          image: d.heroImage,
        });
      });
    });

    return dishes.slice(0, 4);
  }, []);

  // 6. Trải nghiệm bản địa (Living Artisanal Ateliers)
  const artisanalExperiences = useMemo(() => {
    return vietnamExperiences.slice(0, 4);
  }, []);

  // 7. Câu chuyện từ mỗi miền đất (Editorial Stories)
  const featuredStories = useMemo(() => {
    return traviStories.slice(0, 3);
  }, []);

  const handleToggleSaveDest = (e: React.MouseEvent, destId: string, name: string) => {
    e.stopPropagation();
    const nextSaved = toggleSaveDestination(destId);
    if (nextSaved) {
      triggerToast('Đã lưu điểm đến', `${name} đã được lưu vào bộ sưu tập cá nhân.`, 'success');
    } else {
      triggerToast('Đã bỏ lưu', `Đã xóa ${name} khỏi mục đã lưu.`, 'neutral');
    }
  };

  const handleToggleSaveExp = (e: React.MouseEvent, expId: string, title: string) => {
    e.stopPropagation();
    const nextSaved = toggleSaveExperience(expId);
    if (nextSaved) {
      triggerToast('Đã lưu trải nghiệm', `"${title}" đã lưu vào sổ tay.`, 'success');
    } else {
      triggerToast('Đã bỏ lưu', `Đã xóa "${title}" khỏi mục đã lưu.`, 'neutral');
    }
  };

  const handleShareStory = (e: React.MouseEvent, storyId: string, title: string) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/stories/${storyId}`);
      setCopiedStoryId(storyId);
      triggerToast('Đã sao chép liên kết', `Đã sao chép liên kết câu chuyện "${title}".`, 'info');
      setTimeout(() => setCopiedStoryId(null), 2000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080D18] text-[#F4F7FF]">
      {/* ========================================================================= */}
      {/* 1. Cinematic Hero: TRAVI — Mỗi miền đất, một câu chuyện */}
      {/* ========================================================================= */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-20">
        {/* Background Visual Layer */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2000&auto=format&fit=crop"
            alt="Non nước Việt Nam"
            fallbackTitle="Khám phá Việt Nam"
            fallbackColor="#0D1625"
            className="h-full w-full object-cover scale-105 filter brightness-70 contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080D18] via-[#080D18]/65 to-black/60" />
          <div className="absolute inset-0 bg-radial at-center from-transparent via-[#080D18]/30 to-[#080D18]" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 mx-auto max-w-4xl text-center flex flex-col items-center">
          {/* Brand Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3DDC97]/30 bg-[#080D18]/85 px-4 py-1.5 text-xs text-white backdrop-blur-md mb-6 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#3DDC97] animate-pulse" />
            <span className="font-mono uppercase tracking-widest text-[10px] text-[#3DDC97]">
              Nền tảng Khám phá Việt Nam
            </span>
          </div>

          {/* Product Name & Vietnamese Tagline */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-white leading-[1.1] mb-4 drop-shadow-md">
            TRAVI <br />
            <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#F4F7FF] via-[#3DDC97] to-[#48E3EF]">
              “Mỗi miền đất, một câu chuyện.”
            </span>
          </h1>

          {/* Product Description */}
          <p className="mx-auto max-w-2xl text-xs sm:text-sm font-light text-[#C4D0E5] leading-relaxed mb-8 drop-shadow-sm">
            Khám phá những điểm đến, trải nghiệm và câu chuyện văn hóa trên khắp Việt Nam. Nền tảng tuyển chọn di sản, món ngon vùng miền và nhịp sống bản địa có nguồn dẫn chứng minh bạch.
          </p>

          {/* Prominent Nationwide Search Box */}
          <form
            onSubmit={handleHeroSearch}
            className="w-full max-w-xl rounded-2xl border border-white/20 bg-[#0E1626]/90 p-2 backdrop-blur-xl shadow-2xl transition-all duration-300 focus-within:border-[#3DDC97] focus-within:ring-2 focus-within:ring-[#3DDC97]/20 mb-4"
          >
            <div className="flex items-center gap-2">
              <div className="pl-3 text-[#3DDC97]">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tỉnh thành, địa danh, món ngon, làng nghề (vd: Hội An, Phở, Bát Tràng)..."
                className="w-full bg-transparent px-2 py-2 text-xs sm:text-sm text-white placeholder-[#9BA9C3] focus:outline-none"
                aria-label="Tìm kiếm khám phá Việt Nam"
              />
              <Button type="submit" variant="primary" size="md" className="shrink-0 text-xs">
                Khám phá
              </Button>
            </div>
          </form>

          {/* Quick Curated Inspiration Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#9BA9C3] mb-6">
            <span className="text-[11px] font-mono uppercase text-[#9BA9C3]/70">Gợi ý địa danh:</span>
            {['Vịnh Hạ Long', 'Hà Giang mùa lúa', 'Cố đô Huế', 'Phố cổ Hội An', 'Sông nước Mekong', 'Làng gốm Bát Tràng'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickChipSearch(tag)}
                className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] text-white/90 hover:border-[#3DDC97] hover:text-[#3DDC97] transition-colors cursor-pointer backdrop-blur-sm"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Persona Filter Tabs (Audience Perspective) */}
          <div className="rounded-2xl border border-[#243049] bg-[#0E1626]/85 p-3 backdrop-blur-md max-w-2xl w-full">
            <div className="flex items-center justify-between text-[11px] text-[#9BA9C3] mb-2 px-1">
              <span className="font-mono uppercase tracking-wider text-[#3DDC97] flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                Góc nhìn người lữ hành:
              </span>
              <span>Định vị gợi ý theo gu khám phá</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'all', label: 'Tất cả du khách' },
                { id: 'independent', label: 'Trẻ & Độc hành' },
                { id: 'family', label: 'Gia đình & Nhóm' },
                { id: 'international', label: 'Khách quốc tế' },
                { id: 'culture', label: 'Văn hóa & Di sản' },
              ].map((p) => {
                const isSelected = selectedPersona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPersona(p.id as AudiencePersona)}
                    className={`rounded-xl px-2.5 py-1.5 text-[11px] font-medium transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'bg-[#3DDC97] text-[#080D18] font-bold shadow-md shadow-[#3DDC97]/20'
                        : 'bg-white/5 text-[#C4D0E5] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. Gợi ý dành cho bạn (Transparent Discovery Recommendations) */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-b border-[#243049]/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#3DDC97] uppercase tracking-wider mb-2 font-mono">
              <Sparkles className="h-4 w-4" />
              <span>Gợi ý minh bạch có dẫn chứng</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white">
              Gợi ý dành cho bạn
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#9BA9C3] font-light max-w-xl">
              Xếp hạng minh bạch dựa trên tiêu chí đối tượng ({selectedPersona}) và độ xác thực biên tập. Không sử dụng tỷ lệ phần trăm ảo.
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedRegion('All')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                selectedRegion === 'All'
                  ? 'bg-[#18253E] text-white border border-[#3DDC97]/40 font-semibold'
                  : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
              }`}
            >
              Tất cả vùng miền
            </button>
            {VIETNAM_REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedRegion === r
                    ? 'bg-[#3DDC97]/20 text-[#3DDC97] border border-[#3DDC97]/40 font-semibold'
                    : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
                }`}
              >
                {translateRegion(r)}
              </button>
            ))}
          </div>
        </div>

        {/* Discovery Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personalizedLane.map((rec) => {
            const dest = rec.item;
            const isSaved = savedDestIds.includes(dest.id);

            return (
              <Card
                key={dest.id}
                variant="interactive"
                className="group flex flex-col justify-between overflow-hidden border border-[#243049] hover:border-[#3DDC97]/40"
                onClick={() => navigate(`/destinations/${dest.id}`)}
              >
                <div>
                  <div className="relative aspect-[16/10] bg-[#10182A] overflow-hidden">
                    <img
                      src={dest.heroImage}
                      alt={dest.vietnameseName}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10182A] via-transparent to-black/30" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <Badge variant="neutral" size="sm" className="bg-[#080D18]/85 text-white backdrop-blur-md text-[10px]">
                        <MapPin className="h-3 w-3 text-[#3DDC97] mr-1" />
                        {dest.provinceOrMunicipality}
                      </Badge>

                      <button
                        type="button"
                        onClick={(e) => handleToggleSaveDest(e, dest.id, dest.vietnameseName)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-[#080D18]/70 text-white/80 hover:bg-white hover:text-rose-500'
                        }`}
                        aria-label="Lưu điểm đến"
                      >
                        <Heart className={`h-4 w-4 ${isSaved ? 'fill-current text-white' : ''}`} />
                      </button>
                    </div>

                    {/* Transparent Explanation Tag */}
                    <div className="absolute bottom-2.5 left-3 right-3">
                      <span className="inline-block rounded bg-[#080D18]/90 px-2.5 py-1 text-[10px] font-mono text-[#3DDC97] border border-[#3DDC97]/30 backdrop-blur-sm truncate max-w-full">
                        {rec.explanationTag}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs text-[#9BA9C3] mb-1">
                      <span className="font-mono">{translateRegion(dest.region)}</span>
                      <span>Mùa đẹp: {dest.bestSeason}</span>
                    </div>

                    <h3 className="font-serif text-xl font-medium text-white group-hover:text-[#3DDC97] transition-colors leading-snug">
                      {dest.vietnameseName}
                    </h3>
                    <p className="text-xs text-[#9BA9C3] mb-2 font-mono text-[11px]">
                      {dest.name}
                    </p>

                    <p className="text-xs text-[#9BA9C3] line-clamp-2 leading-relaxed font-light mb-4">
                      {dest.tagline}
                    </p>

                    {/* Food Preview Chip */}
                    {dest.mustTryFood[0] && (
                      <div className="rounded-lg bg-white/5 border border-white/5 p-2 text-[11px] text-[#C4D0E5] flex items-center gap-1.5">
                        <Utensils className="h-3.5 w-3.5 text-[#3DDC97] shrink-0" />
                        <span className="truncate">Món đặc trưng: {dest.mustTryFood[0].vietnameseName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-[#243049]/50 flex items-center justify-between text-xs text-[#9BA9C3]">
                  <span>Thời gian khuyên dùng: {dest.estimatedVisitDays} ngày</span>
                  <span className="text-[#3DDC97] font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Xem hồ sơ chi tiết <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. Khám phá Việt Nam (Nationwide Geographic & Administrative Units) */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-b border-[#243049]/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] mb-1 block">
              Địa lý & Hành chính 2026
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white">
              Khám phá Việt Nam
            </h2>
            <p className="text-xs sm:text-sm text-[#9BA9C3] font-light max-w-xl mt-1">
              Toàn cảnh 34 đơn vị hành chính cấp tỉnh (6 thành phố trực thuộc Trung ương & 28 tỉnh) cùng mạng lưới di sản trải dài từ Lũng Cú đến Mũi Cà Mau.
            </p>
          </div>

          <Link to="/explore?view=map">
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Bản đồ tương tác toàn quốc
            </Button>
          </Link>
        </div>

        {/* 4 Regions Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              region: 'Bắc Bộ',
              desc: 'Văn hiến ngàn năm, cao nguyên đá kỳ vĩ, thung lũng mây & ruộng bậc thang uốn lượn.',
              count: VIETNAM_ADMINISTRATIVE_UNITS.filter((u) => u.region === 'Northern Vietnam').length,
              sample: 'Hà Nội, Hà Giang, Ninh Bình, Sa Pa',
              image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop',
            },
            {
              region: 'Trung Bộ',
              desc: 'Cố đô di sản triều Nguyễn, phố cổ đèn lồng lung linh và bờ biển vàng duyên hải.',
              count: VIETNAM_ADMINISTRATIVE_UNITS.filter((u) => u.region === 'Central Vietnam').length,
              sample: 'Huế, Hội An, Đà Nẵng, Quảng Bình',
              image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop',
            },
            {
              region: 'Tây Nguyên',
              desc: 'Không gian văn hóa Cồng Chiêng, đồi chè bạt ngàn, thác nước hoang sơ & nhịp thở đại ngàn.',
              count: VIETNAM_ADMINISTRATIVE_UNITS.filter((u) => u.region === 'Central Highlands').length,
              sample: 'Đà Lạt, Gia Lai, Đắk Lắk, Kon Tum',
              image: 'https://images.unsplash.com/photo-1570784332176-fdd73da66f03?q=80&w=800&auto=format&fit=crop',
            },
            {
              region: 'Nam Bộ',
              desc: 'Chợ nổi sông nước mênh mang, đô thị Sài Gòn sôi động và thiên đường đảo ngọc Phú Quốc.',
              count: VIETNAM_ADMINISTRATIVE_UNITS.filter((u) => u.region === 'Southern Vietnam').length,
              sample: 'TP. Hồ Chí Minh, Cần Thơ, Phú Quốc',
              image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop',
            },
          ].map((item) => (
            <div
              key={item.region}
              onClick={() => navigate(`/explore?region=${encodeURIComponent(item.region === 'Bắc Bộ' ? 'Northern Vietnam' : item.region === 'Trung Bộ' ? 'Central Vietnam' : item.region === 'Tây Nguyên' ? 'Central Highlands' : 'Southern Vietnam')}`)}
              className="group relative overflow-hidden rounded-2xl border border-[#243049] bg-[#0E1626] p-5 hover:border-[#3DDC97]/50 transition-all cursor-pointer shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
                  <img src={item.image} alt={item.region} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3DDC97] text-[#080D18] font-bold">
                      {item.count} đơn vị cấp tỉnh
                    </span>
                  </div>
                </div>
                <h3 className="font-serif text-xl font-medium text-white group-hover:text-[#3DDC97] transition-colors">
                  {item.region}
                </h3>
                <p className="text-xs text-[#9BA9C3] mt-1 leading-relaxed line-clamp-3">
                  {item.desc}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-[#243049]/60 flex items-center justify-between text-[11px] text-[#C4D0E5]">
                <span className="truncate max-w-[170px]">{item.sample}</span>
                <span className="text-[#3DDC97] inline-flex items-center gap-0.5 shrink-0 group-hover:translate-x-1 transition-transform">
                  Xem <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. Điểm đến nổi bật (Featured Curated Destinations) */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-b border-[#243049]/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] mb-1 block">
              Tuyển tập biên tập
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white">
              Điểm đến nổi bật
            </h2>
            <p className="text-xs sm:text-sm text-[#9BA9C3] font-light max-w-xl mt-1">
              Những danh thắng tiêu biểu được đông đảo người lữ hành và các chuyên gia văn hóa đánh giá cao nhất.
            </p>
          </div>

          <Link to="/explore">
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Xem tất cả điểm đến
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredDestinations.map((dest) => (
            <div
              key={dest.id}
              onClick={() => navigate(`/destinations/${dest.id}`)}
              className="group relative flex flex-col rounded-2xl border border-[#243049] bg-[#0E1626] overflow-hidden hover:border-[#3DDC97]/50 transition-all cursor-pointer shadow-lg"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <img
                  src={dest.heroImage}
                  alt={dest.vietnameseName}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E1626] via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge variant="green" size="sm" className="text-[10px]">
                    {translateRegion(dest.region)}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-mono text-[#3DDC97] border border-[#3DDC97]/30">
                    ★ {dest.rating}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-xl font-medium text-white group-hover:text-[#3DDC97] transition-colors">
                    {dest.vietnameseName}
                  </h4>
                  <p className="text-xs text-[#9BA9C3] mb-2 font-mono">{dest.name}</p>
                  <p className="text-xs text-[#9BA9C3] line-clamp-2 leading-relaxed">
                    {dest.tagline}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#243049]/60 flex items-center justify-between text-xs text-[#C4D0E5]">
                  <span>{dest.estimatedVisitDays} ngày trải nghiệm</span>
                  <span className="text-[#3DDC97] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-medium">
                    Chi tiết <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. Những miền đất ít người biết (Hidden Gems & Unhurried Sanctuaries) */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-b border-[#243049]/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#48E3EF] mb-1 block">
              Trải nghiệm chậm & Tĩnh lặng
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white">
              Những miền đất ít người biết
            </h2>
            <p className="text-xs sm:text-sm text-[#9BA9C3] font-light max-w-xl mt-1">
              Những miền đất giữ trọn vẻ nguyên sơ, tránh xa những đoàn khách đông đúc. Thung lũng mây, cao nguyên đá tĩnh mịch và biển đảo hoang sơ.
            </p>
          </div>

          <Link to="/explore?category=Hidden+Gems">
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Xem tất cả điểm đến ẩn mình
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {hiddenGems.map((dest) => (
            <div
              key={dest.id}
              onClick={() => navigate(`/destinations/${dest.id}`)}
              className="group relative flex flex-col rounded-2xl border border-[#243049] bg-[#0E1626] overflow-hidden hover:border-[#48E3EF]/50 transition-all cursor-pointer shadow-lg"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={dest.heroImage}
                  alt={dest.vietnameseName}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E1626] via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge variant="cyan" size="sm" className="text-[10px]">
                    {translateRegion(dest.region)}
                  </Badge>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-lg font-medium text-white group-hover:text-[#48E3EF] transition-colors">
                    {dest.vietnameseName}
                  </h4>
                  <p className="text-xs text-[#9BA9C3] mb-1 font-mono text-[11px]">{dest.name}</p>
                  <p className="text-xs text-[#9BA9C3] line-clamp-2 leading-relaxed">
                    {dest.tagline}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#243049]/60 flex items-center justify-between text-[11px] text-[#C4D0E5]">
                  <span>{dest.estimatedVisitDays} ngày</span>
                  <span className="text-[#48E3EF] group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                    Xem hồ sơ <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. Văn hóa và di sản (Living Cultural Heritage) */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-b border-[#243049]/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#A78BFA] mb-1 block">
              Di sản nghìn năm
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white">
              Văn hóa và di sản
            </h2>
            <p className="text-xs sm:text-sm text-[#9BA9C3] font-light max-w-xl mt-1">
              Những di tích lịch sử, kinh thành hoàng gia, quần thể đền đài Chăm Pa và di sản văn hóa phi vật thể được UNESCO công nhận.
            </p>
          </div>

          <Link to="/explore?category=Heritage+%26+History">
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Khám phá di sản
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {heritageSites.map((site) => (
            <Card
              key={site.id}
              variant="interactive"
              className="group flex flex-col justify-between overflow-hidden border border-[#243049] hover:border-[#A78BFA]/50"
              onClick={() => navigate(`/destinations/${site.id}`)}
            >
              <div>
                <div className="relative aspect-[16/10] bg-[#10182A] overflow-hidden">
                  <img src={site.heroImage} alt={site.vietnameseName} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-2.5 left-2.5">
                    <Badge variant="violet" size="sm" className="text-[10px]">
                      {site.attractions.length} di tích nổi bật
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="font-serif text-lg font-medium text-white group-hover:text-[#A78BFA] transition-colors leading-snug mb-1">
                    {site.vietnameseName}
                  </h4>
                  <p className="text-xs text-[#9BA9C3] line-clamp-3 leading-relaxed mb-3">
                    {site.editorialSummary || site.description}
                  </p>
                  {site.historicalNames && site.historicalNames[0] && (
                    <div className="text-[10px] text-[#A78BFA] font-mono">
                      Tên lịch sử: {site.historicalNames[0]}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-[#243049]/50 flex items-center justify-between text-xs text-[#9BA9C3]">
                <span>{translateRegion(site.region)}</span>
                <span className="text-[#A78BFA] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Hồ sơ di sản <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. Hương vị vùng miền (Gastronomy Lineages) */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-b border-[#243049]/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#F59E0B] mb-1 block">
              Ẩm thực bản địa
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white">
              Hương vị vùng miền
            </h2>
            <p className="text-xs sm:text-sm text-[#9BA9C3] font-light max-w-xl mt-1">
              Từ phở gánh Hà Nội 100 năm đến bún bò cung đình Huế và bánh xèo giòn rụm miền Tây Nam Bộ.
            </p>
          </div>

          <Link to="/explore?category=Food+%26+Cuisine">
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Bản đồ món ngon
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {culinaryLineages.map((dish, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/destinations/${dish.destId}`)}
              className="group flex flex-col justify-between rounded-2xl border border-[#243049] bg-[#0E1626] p-5 hover:border-[#F59E0B]/50 transition-all cursor-pointer shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-serif text-lg font-medium text-white group-hover:text-[#F59E0B] transition-colors leading-snug">
                    {dish.vietnameseName}
                  </h4>
                  <span className="text-[10px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20 shrink-0">
                    {dish.destinationName}
                  </span>
                </div>
                <p className="text-xs text-[#9BA9C3] mb-2 font-mono text-[11px]">{dish.name}</p>
                <p className="text-xs text-[#9BA9C3] leading-relaxed line-clamp-3 mb-4">
                  {dish.description}
                </p>
              </div>

              <div>
                <div className="pt-3 border-t border-[#243049]/60 flex items-center justify-between text-xs">
                  <span className="font-mono text-white text-xs">{dish.price}</span>
                  <span className="text-[#F59E0B] group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 text-[11px]">
                    Khám phá quán <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. Trải nghiệm bản địa (Living Artisanal Craft Workshops) */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-b border-[#243049]/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] mb-1 block">
              Nghệ nhân & Xưởng nghề
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white">
              Trải nghiệm bản địa
            </h2>
            <p className="text-xs sm:text-sm text-[#9BA9C3] font-light max-w-xl mt-1">
              Tương tác trực tiếp với các nghệ nhân truyền đời: bàn xoay gốm Bát Tràng, vò chàm dệt lanh H&apos;Mông và khung tre đèn lồng phố cổ.
            </p>
          </div>

          <Link to="/experiences">
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Tất cả trải nghiệm
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {artisanalExperiences.map((exp) => (
            <Card
              key={exp.id}
              variant="interactive"
              className="group flex flex-col justify-between overflow-hidden border border-[#243049] hover:border-[#3DDC97]/40"
              onClick={() => navigate('/experiences')}
            >
              <div>
                <div className="relative aspect-[16/10] bg-[#10182A] overflow-hidden">
                  <img src={exp.image} alt={exp.vietnameseTitle} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <Badge variant="green" size="sm" className="text-[10px]">{exp.category}</Badge>
                    <button
                      type="button"
                      onClick={(e) => handleToggleSaveExp(e, exp.id, exp.vietnameseTitle)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                        savedExpIds.includes(exp.id)
                          ? 'bg-rose-500 text-white'
                          : 'bg-[#080D18]/70 text-white hover:text-rose-400'
                      }`}
                      aria-label="Lưu trải nghiệm"
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${savedExpIds.includes(exp.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-[10px] font-mono text-[#3DDC97] mb-1">{exp.duration}</div>
                  <h4 className="font-serif text-base font-medium text-white group-hover:text-[#3DDC97] transition-colors leading-snug mb-1">
                    {exp.vietnameseTitle}
                  </h4>
                  <p className="text-xs text-[#9BA9C3] line-clamp-2 leading-relaxed mb-3">
                    {exp.description}
                  </p>
                  <div className="text-[11px] text-[#C4D0E5]">
                    <span className="text-[#9BA9C3]">Chủ trì: </span>{exp.hostOrCraftsman || 'Hội nghệ nhân bản địa'}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-[#243049]/50 flex items-center justify-between text-xs text-[#9BA9C3]">
                <span className="font-mono text-white text-xs">{exp.estimatedCostVND}</span>
                <span className="text-[#3DDC97] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Xem xưởng nghề <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. Câu chuyện từ mỗi miền đất (Travi Stories) */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-b border-[#243049]/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#EC4899] mb-1 block">
              Góc nhìn ký sự
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white">
              Câu chuyện từ mỗi miền đất
            </h2>
            <p className="text-xs sm:text-sm text-[#9BA9C3] font-light max-w-xl mt-1">
              Những bài viết chuyên sâu về cội nguồn ẩm thực, phong tục tập quán và các dòng họ nghệ nhân gìn giữ hồn cốt Việt Nam.
            </p>
          </div>

          <Link to="/stories">
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Đọc tất cả câu chuyện
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredStories.map((story) => {
            const isSaved = savedStoryIds.includes(story.id);

            return (
              <Card
                key={story.id}
                variant="interactive"
                className="group flex flex-col justify-between overflow-hidden border border-[#243049] hover:border-[#EC4899]/40"
                onClick={() => navigate(`/stories/${story.id}`)}
              >
                <div>
                  <div className="relative aspect-[16/10] bg-[#10182A] overflow-hidden">
                    <img src={story.heroImage} alt={story.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10182A] via-transparent to-black/30" />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <Badge variant="cyan" size="sm" className="text-[10px] bg-[#080D18]/85 text-white">
                        {story.category}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveStory(story.id);
                            triggerToast(
                              isSaved ? 'Đã bỏ lưu câu chuyện' : 'Đã lưu câu chuyện',
                              `"${story.title}" đã được cập nhật vào danh sách đọc.`,
                              'info'
                            );
                          }}
                          className={`flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                            isSaved
                              ? 'bg-rose-500 text-white'
                              : 'bg-[#080D18]/70 text-white hover:text-rose-400'
                          }`}
                          aria-label="Lưu câu chuyện"
                        >
                          <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleShareStory(e, story.id, story.title)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#080D18]/70 text-white hover:bg-white hover:text-black transition-colors"
                          aria-label="Chia sẻ câu chuyện"
                        >
                          {copiedStoryId === story.id ? <Check className="h-3.5 w-3.5 text-[#3DDC97]" /> : <Share2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="text-[11px] font-mono text-[#3DDC97] mb-1">
                      {story.readTimeMinutes} phút đọc • {translateRegion(story.region)}
                    </div>
                    <h4 className="font-serif text-lg font-medium text-white group-hover:text-[#EC4899] transition-colors leading-snug mb-2">
                      {story.title}
                    </h4>
                    <p className="text-xs text-[#9BA9C3] line-clamp-3 leading-relaxed mb-4">
                      {story.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-[#243049]/50 flex items-center justify-between text-xs text-[#9BA9C3]">
                  <span className="text-[11px] text-white">{story.author.name}</span>
                  <span className="text-[#EC4899] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Đọc toàn văn <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. Secondary Trip Planner Gateway (Discovery-First Positioning) */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-[#243049] bg-gradient-to-r from-[#101D30] via-[#0E1626] to-[#080D18] p-8 sm:p-14 text-center">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-[#48E3EF] bg-[#48E3EF]/10 px-3 py-1 rounded-full border border-[#48E3EF]/30 mb-4">
              Tính năng hỗ trợ chuyến đi
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-medium text-white mb-4 leading-tight">
              Sẵn sàng biến cảm hứng thành chuyến đi thực tế?
            </h2>
            <p className="text-xs sm:text-sm text-[#9BA9C3] font-light mb-8 max-w-lg mx-auto leading-relaxed">
              Sử dụng công cụ lập kế hoạch để xâu chuỗi các điểm đến, ước lượng chi phí VND minh bạch và cân đối nhịp độ di chuyển thư thái.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/explore">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Khám phá toàn bộ điểm đến
                </Button>
              </Link>
              <Link to="/copilot">
                <Button variant="secondary" size="lg">
                  Mở công cụ Lên lịch trình
                </Button>
              </Link>
            </div>
          </div>

          <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-[#3DDC97]/10 blur-3xl pointer-events-none" />
          <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-[#48E3EF]/10 blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialQuery={searchQuery}
      />
    </div>
  );
};

export default HomePage;
