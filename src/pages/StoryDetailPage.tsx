import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Share2,
  Bookmark,
  Calendar,
  ExternalLink,
  Check,
  Compass,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { traviStories } from '../data/vietnamStories.ts';
import { vietnamDestinations } from '../data/vietnamData.ts';
import { vietnamExperiences } from '../data/vietnamExperiences.ts';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { Badge } from '../components/ui/Badge.tsx';
import { triggerToast } from '../lib/toast.ts';
import { translateRegion, translateStoryCategory, formatDateVI } from '../lib/i18n/index.ts';

export const StoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { savedStoryIds, toggleSaveStory } = useDemoStore();
  const [copiedLink, setCopiedLink] = useState(false);

  // Find story by id or slug
  const story =
    traviStories.find((s) => s.id === id || s.slug === id) ||
    traviStories[0];

  const isSaved = savedStoryIds.includes(story.id);

  // Find linked destinations & experiences from Vietnam Discovery Graph
  const linkedDestinations = vietnamDestinations.filter((d) =>
    story.destinationIds.includes(d.id)
  );

  const linkedExperiences = vietnamExperiences.filter((e) =>
    story.experienceIds?.includes(e.id)
  );

  // Related stories
  const otherStories = traviStories
    .filter((s) => s.id !== story.id)
    .slice(0, 2);

  const handleToggleSave = () => {
    const nextSaved = toggleSaveStory(story.id);
    triggerToast(
      nextSaved ? 'Đã lưu câu chuyện' : 'Đã bỏ lưu câu chuyện',
      `"${story.title}" đã được cập nhật vào danh sách đọc.`,
      nextSaved ? 'success' : 'neutral'
    );
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      triggerToast('Đã sao chép liên kết', 'Đã sao chép liên kết câu chuyện vào bộ nhớ tạm.', 'info');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <article className="min-h-screen bg-[#080D18] text-[#F4F7FF] pb-24">
      {/* Sticky Back Header */}
      <div className="sticky top-20 z-30 border-b border-[#243049]/80 bg-[#080D18]/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            to="/stories"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#9BA9C3] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách Câu chuyện</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#243049] bg-[#0E1626] px-3 py-1.5 text-xs text-[#9BA9C3] hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-[#3DDC97]" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Đã chép' : 'Chia sẻ'}</span>
            </button>

            <button
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                isSaved
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                  : 'border-[#243049] bg-[#0E1626] text-[#9BA9C3] hover:text-white hover:border-white/20'
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current text-rose-500' : ''}`} />
              <span>{isSaved ? 'Đã lưu' : 'Lưu câu chuyện'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Reading Container */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
        {/* Story Metadata Header */}
        <header className="mb-10 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-4">
            <Badge variant="cyan" size="sm">
              {translateStoryCategory(story.category)}
            </Badge>
            <Badge variant="neutral" size="sm" className="border-white/10 text-[#C4D0E5]">
              {translateRegion(story.region)}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-[#9BA9C3] font-mono">
              <Clock className="h-3 w-3 text-[#3DDC97]" />
              {story.readTimeMinutes} phút đọc
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.15] mb-4">
            {story.title}
          </h1>

          <p className="text-base sm:text-xl text-[#3DDC97] font-serif italic mb-8 max-w-3xl leading-relaxed">
            {story.subtitle}
          </p>

          {/* Author & Byline Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-b border-[#243049] py-4 text-xs text-[#9BA9C3]">
            <div className="flex items-center gap-3">
              <img
                src={story.author.avatar}
                alt={story.author.name}
                className="h-11 w-11 rounded-full object-cover border-2 border-[#3DDC97]/40"
              />
              <div className="text-left">
                <span className="font-semibold text-white block text-sm">
                  {story.author.name}
                </span>
                <span className="text-[11px] text-[#9BA9C3]">
                  {story.author.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              {story.editor && (
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] uppercase tracking-wider text-[#9BA9C3] block font-mono">
                    Thẩm định bởi
                  </span>
                  <span className="text-white font-medium">{story.editor.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 font-mono text-[11px] bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                <Calendar className="h-3.5 w-3.5 text-[#3DDC97]" />
                <span>{formatDateVI(story.publishedAt)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Image Showcase */}
        <figure className="mb-12 overflow-hidden rounded-3xl border border-[#243049] bg-[#0E1626]">
          <img
            src={story.heroImage}
            alt={story.title}
            className="w-full aspect-[16/9] object-cover"
          />
          <figcaption className="flex items-center justify-between p-3.5 text-[11px] text-[#9BA9C3] bg-[#080D18]">
            <span>Tư liệu hình ảnh</span>
            <span>
              Ảnh: <strong>{story.imageAttribution.photographer}</strong> • {story.imageAttribution.source} ({story.imageAttribution.license})
            </span>
          </figcaption>
        </figure>

        {/* Lead Excerpt */}
        <div className="mb-10 rounded-2xl border-l-4 border-[#3DDC97] bg-[#0E1626]/70 p-6 sm:p-8 backdrop-blur-xl">
          <p className="text-base sm:text-lg text-white font-serif italic leading-relaxed">
            &ldquo;{story.excerpt}&rdquo;
          </p>
        </div>

        {/* Narrative Sections */}
        <div className="space-y-10 text-sm sm:text-base text-[#C4D0E5] leading-relaxed font-light">
          {story.sections.map((section, idx) => (
            <section key={idx} className="space-y-4">
              {section.heading && (
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-white pt-4 tracking-tight">
                  {section.heading}
                </h2>
              )}

              {section.content && (
                <p className="leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              )}

              {section.quote && (
                <blockquote className="my-8 rounded-2xl border border-[#243049] bg-gradient-to-r from-[#101D30] to-[#0A1220] p-6 sm:p-8 text-center sm:text-left">
                  <p className="font-serif text-lg sm:text-xl text-white italic leading-relaxed mb-2">
                    &ldquo;{section.quote}&rdquo;
                  </p>
                  <cite className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] not-italic block mt-3">
                    — Ký ức văn hóa & Dòng họ truyền đời
                  </cite>
                </blockquote>
              )}

              {section.image && (
                <figure className="my-6 overflow-hidden rounded-2xl border border-[#243049]">
                  <img src={section.image} alt={section.heading || 'Tư liệu bài viết'} className="w-full object-cover" />
                </figure>
              )}
            </section>
          ))}
        </div>

        {/* Vietnam Discovery Graph: Linked Entities */}
        <div className="mt-16 pt-10 border-t border-[#243049]">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] mb-6 flex items-center gap-2">
            <Compass className="h-4 w-4" />
            <span>Liên kết trong Đồ thị Khám phá Việt Nam</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {linkedDestinations.map((dest) => (
              <div
                key={dest.id}
                onClick={() => navigate(`/destinations/${dest.id}`)}
                className="group flex items-center gap-4 rounded-2xl border border-[#243049] bg-[#0E1626] p-4 hover:border-[#3DDC97]/40 transition-all cursor-pointer"
              >
                <img
                  src={dest.heroImage}
                  alt={dest.vietnameseName}
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono text-[#3DDC97] uppercase">Hồ sơ điểm đến</span>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#3DDC97] transition-colors truncate">
                    {dest.vietnameseName} ({dest.name})
                  </h4>
                  <p className="text-xs text-[#9BA9C3] truncate">{dest.tagline}</p>
                </div>
              </div>
            ))}

            {linkedExperiences.map((exp) => (
              <div
                key={exp.id}
                onClick={() => navigate(`/experiences`)}
                className="group flex items-center gap-4 rounded-2xl border border-[#243049] bg-[#0E1626] p-4 hover:border-[#48E3EF]/40 transition-all cursor-pointer"
              >
                <img
                  src={exp.image}
                  alt={exp.vietnameseTitle}
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono text-[#48E3EF] uppercase">Xưởng nghề bản địa</span>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#48E3EF] transition-colors truncate">
                    {exp.vietnameseTitle}
                  </h4>
                  <p className="text-xs text-[#9BA9C3] truncate">{exp.location}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Archival Sources & Provenance */}
          <section className="rounded-2xl border border-[#243049] bg-[#0A101D] p-6 text-xs text-[#9BA9C3]">
            <h4 className="font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#3DDC97]" />
              Dẫn chứng & Tài liệu tham khảo lưu trữ
            </h4>
            <p className="mb-4 font-light leading-relaxed">
              TRAVI duy trì ranh giới thẩm định nghiêm ngặt. Các thông tin lịch sử và dữ liệu văn hóa trong bài viết được trích lục và đối chiếu từ các nguồn tư liệu sau:
            </p>
            <ul className="space-y-2">
              {story.sources.map((src, i) => (
                <li key={i} className="flex items-center justify-between border-t border-white/5 pt-2">
                  <div>
                    <strong className="text-white">{src.title}</strong>
                    <span className="text-[#9BA9C3] block text-[11px]">{src.publisher}</span>
                  </div>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3DDC97] hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>Xem tài liệu lưu trữ</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Continue Reading More Stories */}
          {otherStories.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[#243049]">
              <h4 className="font-serif text-xl font-medium text-white mb-6">
                Đọc tiếp các câu chuyện khác
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherStories.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/stories/${s.id}`)}
                    className="group flex flex-col justify-between rounded-2xl border border-[#243049] bg-[#0E1626] p-4 hover:border-[#3DDC97]/40 transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden mb-3">
                        <img src={s.heroImage} alt={s.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <Badge variant="cyan" size="sm" className="mb-2 text-[10px]">{translateStoryCategory(s.category)}</Badge>
                      <h5 className="font-serif text-base font-medium text-white group-hover:text-[#3DDC97] transition-colors line-clamp-2">
                        {s.title}
                      </h5>
                    </div>
                    <div className="pt-3 mt-3 border-t border-[#243049]/60 flex items-center justify-between text-[11px] text-[#9BA9C3]">
                      <span>{s.readTimeMinutes} phút đọc</span>
                      <span className="text-[#3DDC97] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Đọc toàn văn <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default StoryDetailPage;
