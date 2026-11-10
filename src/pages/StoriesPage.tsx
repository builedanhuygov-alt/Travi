import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Share2,
  Bookmark,
  Sparkles,
  ArrowRight,
  Search,
  Check,
  ShieldCheck
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { traviStories } from '../data/vietnamStories.ts';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { triggerToast } from '../lib/toast.ts';
import { translateRegion, translateStoryCategory, formatDateVI } from '../lib/i18n/index.ts';
import { normalizeVietnameseText } from '../services/search/vietnamSearchEngine.ts';
import type { StoryCategory } from '../types/discovery.ts';

const STORY_CATEGORIES: (StoryCategory | 'All')[] = [
  'All',
  'Local Culture',
  'Food Origins',
  'Heritage & Lineage',
  'Craft Villages',
  'Photo Essay',
  'Travel Guide',
];

export const StoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedStoryIds, toggleSaveStory } = useDemoStore();
  const [selectedCategory, setSelectedCategory] = useState<StoryCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredStories = useMemo(() => {
    const norm = normalizeVietnameseText(searchQuery);

    return traviStories.filter((story) => {
      if (selectedCategory !== 'All' && story.category !== selectedCategory) return false;
      if (norm) {
        const matchesTitle = normalizeVietnameseText(story.title).includes(norm);
        const matchesExcerpt = normalizeVietnameseText(story.excerpt).includes(norm);
        const matchesAuthor = normalizeVietnameseText(story.author.name).includes(norm);
        const matchesTag = story.tags.some((t) => normalizeVietnameseText(t).includes(norm));
        if (!matchesTitle && !matchesExcerpt && !matchesAuthor && !matchesTag) return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const leadStory = traviStories.find((s) => s.featured) || traviStories[0];

  const handleToggleSave = (e: React.MouseEvent, storyId: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    const isNowSaved = toggleSaveStory(storyId);
    triggerToast(
      isNowSaved ? 'Đã lưu câu chuyện' : 'Đã bỏ lưu câu chuyện',
      `"${title}" đã được cập nhật vào danh sách đọc.`,
      isNowSaved ? 'success' : 'neutral'
    );
  };

  const handleShareStory = (e: React.MouseEvent, storyId: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/stories/${storyId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(storyId);
      triggerToast('Đã sao chép liên kết', `Đã sao chép liên kết câu chuyện "${title}".`, 'info');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <PageHeader
        badge="Ký sự & Kho lưu trữ Văn hóa"
        badgeVariant="cyan"
        title="Câu chuyện từ mỗi miền đất"
        description="Những ký sự chuyên sâu về cội nguồn ẩm thực, các dòng họ nghệ nhân làng nghề cổ truyền và cẩm nang khám phá được ghi chép cùng các nhà nghiên cứu và nhân chứng bản địa."
      />

      {/* Editorial Standards Transparency Callout */}
      <div className="mb-10 flex items-start gap-3 rounded-2xl border border-[#48E3EF]/30 bg-[#48E3EF]/5 p-4 text-xs text-[#9BA9C3]">
        <ShieldCheck className="h-5 w-5 text-[#48E3EF] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white block mb-0.5">
            Tiêu chuẩn biên tập & Dẫn chứng văn hóa của TRAVI
          </span>
          <p className="font-light leading-relaxed">
            Mỗi bài viết đều được thẩm định độc lập dựa trên tài liệu nghiên cứu và đối chiếu với các viện văn hóa, bảo tàng di sản. Không sử dụng giai thoại giả lập hay nội dung quảng cáo du lịch sáo rỗng.
          </p>
        </div>
      </div>

      {/* Featured Lead Story Showcase */}
      {leadStory && selectedCategory === 'All' && !searchQuery && (
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-4 text-xs font-mono uppercase tracking-widest text-[#3DDC97]">
            <Sparkles className="h-4 w-4" />
            <span>Ký sự tiêu biểu của Ban Biên tập</span>
          </div>

          <div
            onClick={() => navigate(`/stories/${leadStory.id}`)}
            className="group relative grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-3xl border border-[#243049] bg-[#0E1626] transition-all hover:border-[#3DDC97]/40 cursor-pointer shadow-2xl"
          >
            {/* Visual Hero */}
            <div className="relative aspect-[16/10] lg:aspect-auto lg:col-span-7 bg-[#10182A] overflow-hidden">
              <img
                src={leadStory.heroImage}
                alt={leadStory.title}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E1626] via-transparent to-black/30 lg:bg-gradient-to-r lg:from-transparent lg:to-[#0E1626]" />

              <div className="absolute top-4 left-4">
                <Badge variant="cyan" size="sm" className="backdrop-blur-md bg-black/60 font-medium">
                  {translateStoryCategory(leadStory.category)}
                </Badge>
              </div>

              <div className="absolute bottom-3 left-4 text-[10px] text-white/70 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                Ảnh: {leadStory.imageAttribution.photographer} • {leadStory.imageAttribution.source}
              </div>
            </div>

            {/* Narrative Summary */}
            <div className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-5">
              <div>
                <div className="flex items-center gap-3 text-xs text-[#9BA9C3] mb-3">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5 text-[#3DDC97]" />
                    {leadStory.readTimeMinutes} phút đọc
                  </span>
                  <span>•</span>
                  <span>{translateRegion(leadStory.region)}</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium text-white group-hover:text-[#3DDC97] transition-colors leading-tight mb-3">
                  {leadStory.title}
                </h2>

                <p className="text-xs sm:text-sm text-[#3DDC97] font-serif italic mb-4">
                  {leadStory.subtitle}
                </p>

                <p className="text-xs sm:text-sm text-[#C4D0E5] leading-relaxed font-light mb-6">
                  {leadStory.excerpt}
                </p>
              </div>

              <div>
                {/* Author Credit */}
                <div className="flex items-center justify-between border-t border-[#243049] pt-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={leadStory.author.avatar}
                      alt={leadStory.author.name}
                      className="h-10 w-10 rounded-full object-cover border border-[#3DDC97]/30"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {leadStory.author.name}
                      </span>
                      <span className="text-[11px] text-[#9BA9C3] font-light">
                        {leadStory.author.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(e, leadStory.id, leadStory.title)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                        savedStoryIds.includes(leadStory.id)
                          ? 'border-rose-500/40 bg-rose-500/20 text-rose-400'
                          : 'border-[#243049] bg-[#121C30] text-[#9BA9C3] hover:text-white'
                      }`}
                      aria-label="Lưu câu chuyện"
                    >
                      <Bookmark className={`h-4 w-4 ${savedStoryIds.includes(leadStory.id) ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleShareStory(e, leadStory.id, leadStory.title)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#243049] bg-[#121C30] text-[#9BA9C3] hover:text-white transition-all cursor-pointer"
                      aria-label="Chia sẻ câu chuyện"
                    >
                      {copiedId === leadStory.id ? <Check className="h-4 w-4 text-[#3DDC97]" /> : <Share2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter and Search Bar */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {STORY_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-all select-none cursor-pointer ${
                  isActive
                    ? 'bg-[#3DDC97] text-[#080D18] font-semibold shadow-md shadow-[#3DDC97]/25'
                    : 'bg-[#121C30] text-[#9BA9C3] border border-[#243049] hover:text-white hover:border-white/30'
                }`}
              >
                {cat === 'All' ? 'Tất cả câu chuyện' : translateStoryCategory(cat)}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9BA9C3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm câu chuyện, chủ đề, tác giả..."
            className="w-full rounded-full border border-[#243049] bg-[#0E1626] pl-9 pr-4 py-1.5 text-xs text-white placeholder-[#9BA9C3] focus:border-[#3DDC97] focus:outline-none"
          />
        </div>
      </div>

      {/* Story Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStories.map((story) => {
          const isSaved = savedStoryIds.includes(story.id);

          return (
            <Card
              key={story.id}
              variant="interactive"
              className="group flex flex-col justify-between overflow-hidden border border-[#243049] hover:border-[#3DDC97]/40"
              onClick={() => navigate(`/stories/${story.id}`)}
            >
              <div>
                <div className="relative aspect-[16/10] bg-[#10182A] overflow-hidden">
                  <img
                    src={story.heroImage}
                    alt={story.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10182A] via-transparent to-black/30" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <Badge variant="neutral" size="sm" className="bg-[#080D18]/80 text-white backdrop-blur-md border-white/10 text-[10px]">
                      {translateStoryCategory(story.category)}
                    </Badge>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleToggleSave(e, story.id, story.title)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-[#080D18]/70 text-white/80 hover:bg-white hover:text-rose-500'
                        }`}
                        aria-label="Lưu câu chuyện"
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleShareStory(e, story.id, story.title)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#080D18]/70 text-white/80 hover:bg-white hover:text-[#080D18] backdrop-blur-md transition-all cursor-pointer"
                        aria-label="Chia sẻ câu chuyện"
                      >
                        {copiedId === story.id ? <Check className="h-3.5 w-3.5 text-[#3DDC97]" /> : <Share2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="absolute bottom-2.5 left-3 text-[10px] text-white/70 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                    {translateRegion(story.region)}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 text-[11px] text-[#9BA9C3] mb-2 font-mono">
                    <Clock className="h-3 w-3 text-[#3DDC97]" />
                    <span>{story.readTimeMinutes} phút đọc</span>
                    <span>•</span>
                    <span>{formatDateVI(story.publishedAt)}</span>
                  </div>

                  <h3 className="font-serif text-lg font-medium text-white group-hover:text-[#3DDC97] transition-colors leading-snug mb-2">
                    {story.title}
                  </h3>

                  <p className="text-xs text-[#9BA9C3] line-clamp-3 font-light leading-relaxed mb-4">
                    {story.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {story.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] rounded bg-white/5 border border-white/5 px-2 py-0.5 text-[#C4D0E5]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-[#243049]/50 flex items-center justify-between text-xs text-[#9BA9C3]">
                <div className="flex items-center gap-2 mt-3">
                  <img
                    src={story.author.avatar}
                    alt={story.author.name}
                    className="h-6 w-6 rounded-full object-cover border border-white/10"
                  />
                  <span className="text-[11px] font-medium text-white truncate max-w-[140px]">
                    {story.author.name}
                  </span>
                </div>

                <span className="text-[#3DDC97] font-medium inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform mt-3">
                  Đọc toàn văn <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StoriesPage;
