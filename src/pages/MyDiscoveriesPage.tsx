import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Sparkles,
  BookOpen,
  FolderHeart,
  CheckCircle2,
  Share2,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Button } from '../components/ui/Button.tsx';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { vietnamDestinations } from '../data/vietnamData.ts';
import { vietnamExperiences } from '../data/vietnamExperiences.ts';
import { traviStories } from '../data/vietnamStories.ts';
import { VIETNAM_ADMINISTRATIVE_UNITS } from '../data/vietnamAdministrativeUnits.ts';
import { triggerToast } from '../lib/toast.ts';
import { translateRegion, translateExperienceCategory, translateStoryCategory } from '../lib/i18n/index.ts';
import type { DiscoveryCollection } from '../types/discovery.ts';

type DiscoveryTab = 'destinations' | 'experiences' | 'stories' | 'collections' | 'explored';

export const MyDiscoveriesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    savedDestIds,
    toggleSaveDestination,
    savedExpIds,
    toggleSaveExperience,
    savedStoryIds,
    toggleSaveStory,
    exploredPlaceIds,
    toggleExploredPlace,
    collections,
    createCollection,
    deleteCollection,
  } = useDemoStore();

  const [activeTab, setActiveTab] = useState<DiscoveryTab>('destinations');

  // Collection modal state
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCover, setNewCover] = useState('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop');

  // Compute actual saved entities
  const savedDestinationsList = vietnamDestinations.filter((d) => savedDestIds.includes(d.id));
  const savedExperiencesList = vietnamExperiences.filter((e) => savedExpIds.includes(e.id));
  const savedStoriesList = traviStories.filter((s) => savedStoryIds.includes(s.id));

  const exploredPercentage = Math.round((exploredPlaceIds.length / VIETNAM_ADMINISTRATIVE_UNITS.length) * 100);

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    createCollection({
      title: newTitle.trim(),
      description: newDesc.trim() || 'Bộ sưu tập khám phá tuyển chọn cá nhân tại Việt Nam.',
      coverImage: newCover,
      destinationIds: savedDestIds.slice(0, 3),
      experienceIds: savedExpIds.slice(0, 2),
      storyIds: savedStoryIds.slice(0, 1),
    });

    setNewTitle('');
    setNewDesc('');
    setIsCreateCollectionOpen(false);
    triggerToast('Đã tạo bộ sưu tập', `Bộ sưu tập "${newTitle}" đã được tạo thành công.`, 'success');
  };

  const handleShareCollection = (col: DiscoveryCollection) => {
    const url = `${window.location.origin}/discoveries?collection=${col.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      triggerToast('Đã sao chép liên kết', `Đã sao chép liên kết bộ sưu tập "${col.title}".`, 'info');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <PageHeader
        badge="Sổ tay Khám phá Cá nhân"
        badgeVariant="cyan"
        title="Kho lưu trữ & Bộ sưu tập của tôi"
        description="Không gian lưu giữ các điểm đến tâm đắc, xưởng nghề nghệ nhân, danh sách bài đọc ký sự và dấu chân hành trình qua 34 đơn vị hành chính trên khắp Việt Nam."
      />

      {/* Tabs Navigation */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#243049] scrollbar-none">
        <button
          onClick={() => setActiveTab('destinations')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
            activeTab === 'destinations'
              ? 'bg-[#18253E] text-white border border-[#3DDC97]/40 shadow-sm'
              : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
          }`}
        >
          <MapPin className="h-4 w-4 text-[#3DDC97]" />
          <span>Điểm đến đã lưu ({savedDestIds.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('experiences')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
            activeTab === 'experiences'
              ? 'bg-[#18253E] text-white border border-[#3DDC97]/40 shadow-sm'
              : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="h-4 w-4 text-[#48E3EF]" />
          <span>Trải nghiệm đã lưu ({savedExpIds.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
            activeTab === 'stories'
              ? 'bg-[#18253E] text-white border border-[#3DDC97]/40 shadow-sm'
              : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen className="h-4 w-4 text-[#9875FF]" />
          <span>Danh sách đọc ({savedStoryIds.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('collections')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
            activeTab === 'collections'
              ? 'bg-[#18253E] text-white border border-[#3DDC97]/40 shadow-sm'
              : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
          }`}
        >
          <FolderHeart className="h-4 w-4 text-rose-400" />
          <span>Bộ sưu tập ({collections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('explored')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
            activeTab === 'explored'
              ? 'bg-[#18253E] text-white border border-[#3DDC97]/40 shadow-sm'
              : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-[#3DDC97]" />
          <span>Dấu chân khám phá ({exploredPlaceIds.length}/34)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. SAVED DESTINATIONS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'destinations' && (
        <div>
          {savedDestinationsList.length === 0 ? (
            <div className="rounded-3xl border border-[#243049] bg-[#0E1626] p-12 text-center">
              <MapPin className="mx-auto h-12 w-12 text-[#9BA9C3]/50 mb-3" />
              <h3 className="font-serif text-xl font-medium text-white mb-2">Chưa có điểm đến nào được lưu</h3>
              <p className="text-xs text-[#9BA9C3] max-w-md mx-auto mb-6">
                Đánh dấu các thắng cảnh, di tích lịch sử và danh thắng khi khám phá Việt Nam để xem lại bất cứ lúc nào.
              </p>
              <Link to="/explore">
                <Button variant="primary" size="md">Khám phá điểm đến</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedDestinationsList.map((dest) => {
                const isExplored = exploredPlaceIds.includes(dest.id);
                return (
                  <Card
                    key={dest.id}
                    variant="interactive"
                    className="group flex flex-col justify-between overflow-hidden border border-[#243049] hover:border-[#3DDC97]/40"
                    onClick={() => navigate(`/destinations/${dest.id}`)}
                  >
                    <div>
                      <div className="relative aspect-[16/10] bg-[#10182A]">
                        <img src={dest.heroImage} alt={dest.vietnameseName} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#10182A] via-transparent to-black/30" />

                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <Badge variant="neutral" size="sm" className="bg-[#080D18]/80 text-white backdrop-blur-md">
                            {translateRegion(dest.region)}
                          </Badge>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveDestination(dest.id);
                              triggerToast('Đã bỏ lưu', `Đã xóa ${dest.vietnameseName} khỏi mục đã lưu.`, 'neutral');
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-md cursor-pointer"
                            aria-label="Xóa điểm đến"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {isExplored && (
                          <div className="absolute bottom-3 right-3">
                            <span className="flex items-center gap-1 rounded bg-[#3DDC97] px-2 py-0.5 text-[10px] font-bold text-[#080D18]">
                              <CheckCircle2 className="h-3 w-3" />
                              Đã khám phá
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="font-serif text-xl font-medium text-white group-hover:text-[#3DDC97] transition-colors">
                          {dest.vietnameseName}
                        </h3>
                        <p className="text-xs text-[#9BA9C3] mb-2 font-mono text-[11px]">
                          {dest.name}
                        </p>
                        <p className="text-xs text-[#9BA9C3] line-clamp-2 leading-relaxed">
                          {dest.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-[#243049]/50 flex items-center justify-between text-xs text-[#9BA9C3]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExploredPlace(dest.id);
                        }}
                        className={`text-xs inline-flex items-center gap-1 cursor-pointer ${
                          isExplored ? 'text-[#3DDC97]' : 'hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{isExplored ? 'Đã đánh dấu' : 'Đánh dấu đã đến'}</span>
                      </button>

                      <span className="text-[#3DDC97] font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Xem chi tiết &rarr;
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SAVED EXPERIENCES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'experiences' && (
        <div>
          {savedExperiencesList.length === 0 ? (
            <div className="rounded-3xl border border-[#243049] bg-[#0E1626] p-12 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-[#9BA9C3]/50 mb-3" />
              <h3 className="font-serif text-xl font-medium text-white mb-2">Chưa lưu trải nghiệm nào</h3>
              <p className="text-xs text-[#9BA9C3] max-w-md mx-auto mb-6">
                Khám phá các xưởng gốm cổ, làng dệt lanh chàm và lớp học nấu ăn cung đình để lưu vào sổ tay.
              </p>
              <Link to="/experiences">
                <Button variant="primary" size="md">Xem trải nghiệm bản địa</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedExperiencesList.map((exp) => (
                <Card
                  key={exp.id}
                  variant="interactive"
                  className="group flex flex-col justify-between overflow-hidden border border-[#243049] hover:border-[#48E3EF]/40"
                  onClick={() => navigate('/experiences')}
                >
                  <div>
                    <div className="relative aspect-[16/10] bg-[#10182A]">
                      <img src={exp.image} alt={exp.vietnameseTitle} className="h-full w-full object-cover" />
                      <div className="absolute top-3 right-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveExperience(exp.id);
                            triggerToast('Đã bỏ lưu', `Đã xóa "${exp.vietnameseTitle}" khỏi sổ tay.`, 'neutral');
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-md cursor-pointer"
                          aria-label="Xóa trải nghiệm"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="cyan" size="sm">{translateExperienceCategory(exp.category)}</Badge>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="text-[10px] font-mono text-[#48E3EF] mb-1">{exp.duration}</div>
                      <h3 className="font-serif text-lg font-medium text-white group-hover:text-[#48E3EF] transition-colors leading-snug mb-1">
                        {exp.vietnameseTitle}
                      </h3>
                      <p className="text-xs text-[#9BA9C3] line-clamp-2 leading-relaxed mb-3">
                        {exp.description}
                      </p>
                      <div className="text-[11px] text-[#C4D0E5]">
                        <span className="text-[#9BA9C3]">Chủ trì: </span>{exp.hostOrCraftsman}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-[#243049]/50 flex items-center justify-between text-xs text-[#9BA9C3]">
                    <span className="font-mono text-white text-xs">{exp.estimatedCostVND}</span>
                    <span className="text-[#48E3EF] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Xem chi tiết &rarr;
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. READING LIST (SAVED STORIES) TAB */}
      {/* ========================================================================= */}
      {activeTab === 'stories' && (
        <div>
          {savedStoriesList.length === 0 ? (
            <div className="rounded-3xl border border-[#243049] bg-[#0E1626] p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-[#9BA9C3]/50 mb-3" />
              <h3 className="font-serif text-xl font-medium text-white mb-2">Danh sách bài đọc đang trống</h3>
              <p className="text-xs text-[#9BA9C3] max-w-md mx-auto mb-6">
                Lưu lại các bài viết ký sự và cẩm nang văn hóa sâu sắc để đọc chậm khi rảnh rỗi.
              </p>
              <Link to="/stories">
                <Button variant="primary" size="md">Khám phá các câu chuyện</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedStoriesList.map((story) => (
                <Card
                  key={story.id}
                  variant="interactive"
                  className="group flex flex-col justify-between overflow-hidden border border-[#243049] hover:border-[#9875FF]/40"
                  onClick={() => navigate(`/stories/${story.id}`)}
                >
                  <div>
                    <div className="relative aspect-[16/10] bg-[#10182A]">
                      <img src={story.heroImage} alt={story.title} className="h-full w-full object-cover" />
                      <div className="absolute top-3 right-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveStory(story.id);
                            triggerToast('Đã bỏ lưu', `Đã xóa "${story.title}" khỏi danh sách đọc.`, 'neutral');
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-md cursor-pointer"
                          aria-label="Xóa câu chuyện"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="violet" size="sm">{translateStoryCategory(story.category)}</Badge>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="text-[11px] font-mono text-[#9875FF] mb-1">
                        {story.readTimeMinutes} phút đọc • {translateRegion(story.region)}
                      </div>
                      <h3 className="font-serif text-lg font-medium text-white group-hover:text-[#9875FF] transition-colors leading-snug mb-2">
                        {story.title}
                      </h3>
                      <p className="text-xs text-[#9BA9C3] line-clamp-3 leading-relaxed mb-4">
                        {story.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-[#243049]/50 flex items-center justify-between text-xs text-[#9BA9C3]">
                    <span className="text-[11px] text-white">{story.author.name}</span>
                    <span className="text-[#9875FF] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Đọc toàn văn &rarr;
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CURATED & PERSONAL COLLECTIONS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'collections' && (
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-serif text-2xl font-medium text-white">Bộ sưu tập theo chủ đề</h3>
              <p className="text-xs sm:text-sm text-[#9BA9C3] mt-1 font-light">
                Các tuyến hành trình chuyên biệt xâu chuỗi danh lam, xưởng nghề và câu chuyện văn hóa.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateCollectionOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Tạo bộ sưu tập mới
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {collections.map((col) => (
              <div
                key={col.id}
                onClick={() => handleShareCollection(col)}
                className="group relative overflow-hidden rounded-3xl border border-[#243049] bg-[#0E1626] transition-all hover:border-[#3DDC97]/40 cursor-pointer shadow-xl flex flex-col justify-between"
              >
                <div className="relative aspect-[16/8] bg-[#10182A] overflow-hidden">
                  <img src={col.coverImage} alt={col.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1626] via-[#0E1626]/40 to-black/30" />

                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    {col.isCuratedEditorial ? (
                      <Badge variant="cyan" size="sm" className="bg-[#080D18]/85 text-white backdrop-blur-md">
                        Bộ sưu tập biên tập
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm" className="bg-[#080D18]/85 text-white backdrop-blur-md">
                        Bộ sưu tập cá nhân
                      </Badge>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareCollection(col);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#080D18]/70 text-white hover:bg-white hover:text-black backdrop-blur-md transition-colors cursor-pointer"
                        aria-label="Chia sẻ bộ sưu tập"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>

                      {!col.isCuratedEditorial && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCollection(col.id);
                            triggerToast('Đã xóa bộ sưu tập', `Bộ sưu tập "${col.title}" đã được xóa.`, 'neutral');
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/80 text-white hover:bg-rose-500 backdrop-blur-md transition-colors cursor-pointer"
                          aria-label="Xóa bộ sưu tập"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-serif text-2xl font-medium text-white group-hover:text-[#3DDC97] transition-colors mb-2">
                    {col.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#9BA9C3] leading-relaxed mb-4 font-light">
                    {col.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[#C4D0E5] pt-4 border-t border-[#243049]/60">
                    <span>{col.destinationIds.length} Điểm đến</span>
                    <span>•</span>
                    <span>{col.experienceIds.length} Trải nghiệm</span>
                    <span>•</span>
                    <span>{col.storyIds.length} Câu chuyện</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. EXPLORED PLACES TRACKER TAB (34 UNITS) */}
      {/* ========================================================================= */}
      {activeTab === 'explored' && (
        <div className="space-y-8">
          {/* Tracker Progress Bar Card */}
          <div className="rounded-3xl border border-[#243049] bg-gradient-to-r from-[#101D30] to-[#0A1220] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#3DDC97] block mb-1">
                  Dấu chân khám phá Việt Nam
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-medium text-white">
                  Đã khám phá {exploredPlaceIds.length} / {VIETNAM_ADMINISTRATIVE_UNITS.length} đơn vị hành chính cấp tỉnh
                </h3>
              </div>
              <div className="text-right">
                <span className="font-mono text-3xl font-bold text-[#3DDC97]">{exploredPercentage}%</span>
                <span className="text-xs text-[#9BA9C3] block">Bao phủ địa lý toàn quốc</span>
              </div>
            </div>

            <div className="h-3 w-full rounded-full bg-[#121C30] overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-[#10B981] via-[#3DDC97] to-[#48E3EF] transition-all duration-700 rounded-full"
                style={{ width: `${Math.max(5, exploredPercentage)}%` }}
              />
            </div>
          </div>

          {/* List of 34 Administrative Units */}
          <div>
            <h4 className="font-serif text-xl font-medium text-white mb-4">
              Danh sách 34 đơn vị hành chính cấp tỉnh Việt Nam
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {VIETNAM_ADMINISTRATIVE_UNITS.map((unit) => {
                const isVisited = exploredPlaceIds.some((id) =>
                  unit.touristDestinationIds.includes(id) || unit.id === id
                );
                return (
                  <div
                    key={unit.id}
                    onClick={() => {
                      const sampleDestId = unit.touristDestinationIds[0] || unit.id;
                      toggleExploredPlace(sampleDestId);
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isVisited
                        ? 'border-[#3DDC97]/40 bg-[#3DDC97]/10 text-white'
                        : 'border-[#243049] bg-[#0E1626] text-[#9BA9C3] hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold block">{unit.officialVietnameseName}</span>
                      <span className="text-[10px] text-[#9BA9C3] font-mono">{translateRegion(unit.region)}</span>
                    </div>

                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                      isVisited ? 'bg-[#3DDC97] text-[#080D18]' : 'bg-[#18253E] text-[#9BA9C3]'
                    }`}>
                      {isVisited ? '✓' : '+'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create Collection Modal */}
      {isCreateCollectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-modal-in">
          <div className="w-full max-w-md rounded-2xl border border-[#243049] bg-[#0E1626] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-medium text-white">Tạo bộ sưu tập mới</h3>
              <button onClick={() => setIsCreateCollectionOpen(false)} className="text-[#9BA9C3] hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4 text-xs">
              <div>
                <label className="text-[#9BA9C3] block mb-1">Tên bộ sưu tập</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Vòng cung Đông Bắc mùa lúa chín..."
                  className="w-full rounded-xl border border-[#243049] bg-[#080D18] px-3 py-2 text-white placeholder-[#9BA9C3] focus:border-[#3DDC97] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#9BA9C3] block mb-1">Mô tả chủ đề</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Mô tả ý nghĩa, tuyến đường hoặc cảm hứng cho bộ sưu tập này..."
                  className="w-full rounded-xl border border-[#243049] bg-[#080D18] px-3 py-2 text-white placeholder-[#9BA9C3] focus:border-[#3DDC97] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#9BA9C3] block mb-1">Đường dẫn ảnh bìa (URL)</label>
                <input
                  type="url"
                  value={newCover}
                  onChange={(e) => setNewCover(e.target.value)}
                  className="w-full rounded-xl border border-[#243049] bg-[#080D18] px-3 py-2 text-white focus:border-[#3DDC97] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateCollectionOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Xác nhận tạo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDiscoveriesPage;
