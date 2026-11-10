import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Heart,
  Sparkles,
  Utensils,
  Landmark,
  Compass,
  Clock,
  Share2,
  Check,
  CheckCircle2,
  FileText,
  Navigation2,
  ExternalLink,
} from 'lucide-react';

import { getDiscoveryDestinationById, getAllNorthernDestinations } from '../services/destinations/destinationRepository.ts';
import { vietnamDestinations } from '../data/vietnamData.ts';
import { vietnamExperiences } from '../data/vietnamExperiences.ts';
import { traviStories } from '../data/vietnamStories.ts';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { triggerToast } from '../lib/toast.ts';
import { translateRegion, translateProvenanceStatus, formatDateVI } from '../lib/i18n/index.ts';

export const DestinationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { savedDestIds, toggleSaveDestination, exploredPlaceIds, toggleExploredPlace } = useDemoStore();
  const [copiedLink, setCopiedLink] = useState(false);

  // Strictly lookup destination by id or canonical alias — NO fallback to Hà Nội!
  const destination = getDiscoveryDestinationById(id);

  // If destination is not found or ID is invalid, display a clear, honest NotFound state
  if (!destination) {
    return (
      <div className="min-h-screen bg-[#080D18] text-[#F4F7FF] flex flex-col justify-center items-center px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#151F33] border border-[#243049] flex items-center justify-center text-amber-400 mb-6 shadow-xl">
          <MapPin className="h-8 w-8 text-amber-400" />
        </div>
        <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30 bg-amber-500/10 mb-3">
          Không tìm thấy điểm đến
        </Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-3">
          Điểm đến không tồn tại hoặc đã thay đổi địa chỉ
        </h1>
        <p className="max-w-md text-sm text-[#9BA9C3] leading-relaxed mb-8">
          Mã điểm đến <code className="text-[#3DDC97] bg-[#121C30] px-1.5 py-0.5 rounded border border-[#243049] font-mono">{id || 'chưa xác định'}</code> không có trong hệ thống dữ liệu du lịch đã xác thực, hoặc đang trong quá trình khảo sát thực địa.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 rounded-xl bg-[#3DDC97] px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-[#2BB67B] transition-all shadow-lg shadow-[#3DDC97]/20"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Khám phá danh mục Điểm đến</span>
          </Link>
          <Link
            to="/map/north"
            className="inline-flex items-center gap-2 rounded-xl border border-[#243049] bg-[#121C30] px-5 py-2.5 text-xs font-semibold text-white hover:border-[#48E3EF] hover:bg-[#151F33] transition-all"
          >
            <Compass className="h-4 w-4 text-[#48E3EF]" />
            <span>Mở Bản đồ miền Bắc</span>
          </Link>
        </div>
      </div>
    );
  }

  // Check if there is an associated rich legacy record in vietnamDestinations
  const legacyRecord = vietnamDestinations.find(
    (vd) => vd.id === destination.id || (destination.linkedParentDestinationId && vd.id === destination.linkedParentDestinationId)
  );

  const isSaved = savedDestIds.includes(destination.id);
  const isExplored = exploredPlaceIds.includes(destination.id);

  // Find linked standalone experiences from Vietnam Discovery Graph
  const linkedStandaloneExperiences = vietnamExperiences.filter(
    (exp) =>
      exp.destinationId === destination.id ||
      (destination.linkedParentDestinationId && exp.destinationId === destination.linkedParentDestinationId) ||
      exp.location.toLowerCase().includes(destination.name.toLowerCase()) ||
      exp.location.toLowerCase().includes(destination.vietnameseName.toLowerCase())
  );

  // Find linked stories
  const linkedStories = traviStories.filter(
    (s) =>
      s.destinationIds.includes(destination.id) ||
      (destination.linkedParentDestinationId && s.destinationIds.includes(destination.linkedParentDestinationId))
  );

  // Find related destinations in the same subregion / region
  const relatedDestinations =
    destination.nearbyDestinationIds.length > 0
      ? (destination.nearbyDestinationIds
          .map((nid) => getDiscoveryDestinationById(nid))
          .filter(Boolean) as typeof destination[])
      : getAllNorthernDestinations()
          .filter((d) => d.id !== destination.id && d.subregion === destination.subregion)
          .slice(0, 3);

  const handleToggleSave = () => {
    const nextSaved = toggleSaveDestination(destination.id);
    triggerToast(
      nextSaved ? `Đã lưu ${destination.vietnameseName} vào bộ sưu tập cá nhân` : `Đã bỏ lưu ${destination.vietnameseName}`,
      nextSaved ? 'success' : 'neutral'
    );
  };

  const handleToggleExplored = () => {
    const next = toggleExploredPlace(destination.id);
    triggerToast(
      next ? `Đã đánh dấu ${destination.vietnameseName} là Đã khám phá!` : `Đã bỏ đánh dấu ${destination.vietnameseName}`,
      'success'
    );
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      triggerToast('Đã sao chép liên kết', 'info');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleStartPlanning = () => {
    navigate(`/copilot?destination=${encodeURIComponent(destination.name)}`);
  };

  const heroImage = destination.images[0] || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="min-h-screen bg-[#080D18] text-[#F4F7FF] pb-24">
      {/* Top Back Navigation Bar */}
      <div className="sticky top-20 z-30 border-b border-[#243049]/80 bg-[#080D18]/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#9BA9C3] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách Điểm đến</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to={`/map/north?destination=${destination.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#243049] bg-[#0E1626] px-3 py-1.5 text-xs text-[#48E3EF] hover:border-[#48E3EF]/50 hover:bg-[#151F33] transition-all"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Xem trên Bản đồ miền Bắc</span>
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#243049] bg-[#0E1626] px-3 py-1.5 text-xs text-[#9BA9C3] hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-[#3DDC97]" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Đã sao chép' : 'Chia sẻ'}</span>
            </button>
            <button
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                isSaved
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                  : 'border-[#243049] bg-[#0E1626] text-[#9BA9C3] hover:text-white hover:border-white/20'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>{isSaved ? 'Đã lưu' : 'Lưu lại'}</span>
            </button>
            <button
              onClick={handleToggleExplored}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                isExplored
                  ? 'border-[#3DDC97]/40 bg-[#3DDC97]/10 text-[#3DDC97] hover:bg-[#3DDC97]/20'
                  : 'border-[#243049] bg-[#0E1626] text-[#9BA9C3] hover:text-white hover:border-white/20'
              }`}
            >
              <CheckCircle2 className={`h-3.5 w-3.5 ${isExplored ? 'text-[#3DDC97]' : ''}`} />
              <span>{isExplored ? 'Đã khám phá' : 'Đánh dấu đã đi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Visual Dossier Header */}
      <div className="relative min-h-[440px] sm:min-h-[520px] w-full overflow-hidden flex flex-col justify-end border-b border-[#243049]">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt={destination.vietnameseName}
            className="h-full w-full object-cover object-center filter brightness-[0.75] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080D18] via-[#080D18]/60 to-transparent" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#080D18]/30 to-[#080D18]/90" />
        </div>

        <div className="relative z-10 p-6 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-7xl">
            {/* Badges & Region */}
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <Badge variant="outline" className="text-xs text-[#3DDC97] border-[#3DDC97]/40 bg-[#080D18]/80 backdrop-blur-md">
                <MapPin className="h-3 w-3 mr-1" />
                {destination.currentAdministrativeRegion}
              </Badge>
              <Badge variant="neutral" className="text-xs text-[#C4D0E5] bg-[#0E1626]/80 backdrop-blur-md border-[#243049]">
                {destination.subregion !== 'Chưa phân vùng' ? destination.subregion : translateRegion(destination.macroRegion)}
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs text-[#3DDC97] bg-[#3DDC97]/10 px-2.5 py-0.5 rounded-full border border-[#3DDC97]/30 backdrop-blur-sm">
                <CheckCircle2 className="h-3 w-3" />
                {destination.dataStatus === 'verified' ? 'Tọa độ GPS xác thực' : 'Cần rà soát ranh giới'}
              </span>
              {destination.historicalAdministrativeNames.length > 0 && (
                <span className="text-xs text-[#9BA9C3] bg-black/50 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                  Tên lịch sử: {destination.historicalAdministrativeNames.join(', ')}
                </span>
              )}
            </div>

            {/* Destination Titles */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-white mb-2">
              {destination.vietnameseName}
            </h1>
            {destination.name !== destination.vietnameseName && (
              <p className="text-lg sm:text-xl text-[#3DDC97] font-serif italic mb-4">
                {destination.name}
              </p>
            )}

            {/* Quick Summary Coordinates Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/15 text-xs text-[#C4D0E5]">
              <div className="flex items-center gap-1.5 font-mono text-[11px] bg-[#121C30]/80 px-2.5 py-1 rounded-lg border border-[#243049]">
                <Navigation2 className="h-3.5 w-3.5 text-[#48E3EF]" />
                <span>
                  {destination.latitude.toFixed(4)}°B, {destination.longitude.toFixed(4)}°Đ
                </span>
                <span className="text-slate-500 mx-1">|</span>
                <span className="text-slate-400">Độ tin cậy {(destination.coordinateConfidenceScore * 100).toFixed(0)}%</span>
              </div>
              {destination.bestSeason && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#3DDC97]" />
                  <span>Mùa lý tưởng: <strong className="text-white">{destination.bestSeason}</strong></span>
                </div>
              )}
              {destination.recommendedDuration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#3DDC97]" />
                  <span>Thời lượng gợi ý (Tham khảo): <strong className="text-white">{destination.recommendedDuration}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Story & Dossier Column */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            {/* Editorial Overview */}
            <section className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 sm:p-8 backdrop-blur-xl">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] mb-2 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Câu chuyện & Chiều sâu văn hóa
              </h2>
              <h3 className="font-serif text-2xl font-medium text-white mb-4">
                Hồn cốt miền đất {destination.vietnameseName}
              </h3>
              <p className="text-sm sm:text-base text-[#C4D0E5] leading-relaxed mb-6 font-light">
                {destination.shortDescription}
              </p>
              {destination.longDescription && (
                <p className="text-sm text-[#9BA9C3] leading-relaxed border-t border-[#243049]/60 pt-4 font-light">
                  {destination.longDescription}
                </p>
              )}
            </section>

            {/* Must-Try Regional Gastronomy */}
            <section className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 sm:p-8 backdrop-blur-xl">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#F43F5E] mb-2 flex items-center gap-2">
                <Utensils className="h-3.5 w-3.5" />
                Hương vị vùng miền
              </h2>
              <h3 className="font-serif text-2xl font-medium text-white mb-6">
                Đặc sản ẩm thực bản địa phải thử
              </h3>

              {destination.localFood.length === 0 ? (
                <p className="text-xs text-[#9BA9C3] italic">
                  Thông tin ẩm thực đặc sản cho địa danh này đang được bổ sung và xác thực thực địa.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {destination.localFood.map((food, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border border-[#243049] bg-[#080D18] p-4 hover:border-[#F43F5E]/40 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#F43F5E]/15 border border-[#F43F5E]/30 flex items-center justify-center text-[#F43F5E] shrink-0">
                        <Utensils className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{food}</h4>
                        <span className="text-[11px] text-slate-400">Đặc sản trứ danh {destination.subregion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Key Attractions / Highlights */}
            {legacyRecord?.attractions && legacyRecord.attractions.length > 0 ? (
              <section className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 sm:p-8 backdrop-blur-xl">
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] mb-2 flex items-center gap-2">
                  <Compass className="h-3.5 w-3.5" />
                  Thắng cảnh & Danh lam
                </h2>
                <h3 className="font-serif text-2xl font-medium text-white mb-6">
                  Điểm tham quan nổi bật tuyển chọn
                </h3>

                <div className="space-y-4">
                  {legacyRecord.attractions.map((att) => (
                    <div
                      key={att.id}
                      className="flex flex-col sm:flex-row gap-4 rounded-xl border border-[#243049] bg-[#080D18] p-4 hover:border-[#3DDC97]/40 transition-colors"
                    >
                      <div className="relative h-40 sm:h-auto sm:w-48 shrink-0 rounded-lg overflow-hidden border border-white/5">
                        <img src={att.image} alt={att.vietnameseName} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] text-[#3DDC97] border-[#3DDC97]/30">
                              {att.category}
                            </Badge>
                            <span className="text-[11px] text-[#9BA9C3]">• Thời lượng: {att.estimatedDuration}</span>
                          </div>
                          <h4 className="text-base font-bold text-white">{att.vietnameseName}</h4>
                          <p className="text-xs text-[#9BA9C3] mb-2 font-mono text-[11px]">{att.name}</p>
                          <p className="text-xs text-[#C4D0E5] leading-relaxed mb-3">{att.description}</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#243049]/60 pt-2.5 text-xs text-[#9BA9C3]">
                          <span>Vé tham quan: <strong className="text-white">{att.ticketPriceNote || 'Theo quy định ban quản lý'}</strong></span>
                          <div className="flex items-center gap-1.5">
                            {att.highlights.slice(0, 2).map((h, i) => (
                              <span key={i} className="text-[10px] bg-[#121C2F] px-2 py-0.5 rounded text-[#C4D0E5]">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Living Experiences & Activities */}
            {destination.experiences.length > 0 && (
              <section className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 sm:p-8 backdrop-blur-xl">
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#48E3EF] mb-2 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Trải nghiệm thực địa
                </h2>
                <h3 className="font-serif text-2xl font-medium text-white mb-6">
                  Hoạt động khám phá không nên bỏ lỡ
                </h3>

                <div className="space-y-3">
                  {destination.experiences.map((exp, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-[#243049] bg-[#080D18] p-4 hover:border-[#48E3EF]/40 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#48E3EF]/10 border border-[#48E3EF]/30 flex items-center justify-center text-xs text-[#48E3EF] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{exp}</p>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">Trải nghiệm gắn liền với văn hóa và thiên nhiên bản địa</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Cultural Highlights & Etiquette Tips */}
            {destination.culturalHighlights.length > 0 && (
              <section className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 sm:p-8 backdrop-blur-xl">
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#9875FF] mb-2 flex items-center gap-2">
                  <Landmark className="h-3.5 w-3.5" />
                  Dấu ấn văn hóa & Lưu ý bản địa
                </h2>
                <h3 className="font-serif text-2xl font-medium text-white mb-6">
                  Tập tục, tín ngưỡng & Lưu ý khi ghé thăm
                </h3>

                <div className="space-y-3">
                  {destination.culturalHighlights.map((hl, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-[#243049] bg-[#080D18] p-4 text-xs sm:text-sm text-[#C4D0E5] leading-relaxed"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#9875FF] shrink-0 mt-2" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Historical Context & Timeline */}
            <section className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 sm:p-8 backdrop-blur-xl">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#F59E0B] mb-2 flex items-center gap-2">
                <Landmark className="h-3.5 w-3.5" />
                Địa danh & Di sản lịch sử
              </h2>
              <h3 className="font-serif text-2xl font-medium text-white mb-6">
                Bối cảnh lịch sử & Dòng chảy thời gian
              </h3>

              <div className="space-y-4 text-xs sm:text-sm text-[#C4D0E5] leading-relaxed">
                {destination.historicalAdministrativeNames.length > 0 && (
                  <div className="p-4 rounded-xl border border-[#243049] bg-[#080D18]">
                    <span className="text-[#9BA9C3] block font-semibold text-xs mb-1">
                      Địa danh và tên gọi qua các thời kỳ lịch sử:
                    </span>
                    <p className="text-white font-medium">
                      {destination.historicalAdministrativeNames.join(' • ')}
                    </p>
                  </div>
                )}
                <p className="leading-relaxed">
                  {destination.longDescription || destination.shortDescription}
                </p>
              </div>
            </section>

            {/* Standalone Cultural Experiences from Discovery Graph */}
            {linkedStandaloneExperiences.length > 0 && (
              <section className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 sm:p-8 backdrop-blur-xl">
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] mb-2 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Mạng lưới trải nghiệm chuyên sâu
                </h2>
                <h3 className="font-serif text-2xl font-medium text-white mb-6">
                  Hoạt động kết nối nghệ nhân & bản địa
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {linkedStandaloneExperiences.map((exp) => (
                    <Link
                      key={exp.id}
                      to={`/experiences?id=${exp.id}`}
                      className="group flex flex-col justify-between rounded-xl border border-[#243049] bg-[#080D18] p-4 hover:border-[#3DDC97]/40 transition-colors"
                    >
                      <div>
                        <div className="aspect-video w-full rounded-lg overflow-hidden mb-3 border border-white/5">
                          <img src={exp.image} alt={exp.vietnameseTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <Badge variant="outline" className="text-[10px] text-[#3DDC97] border-[#3DDC97]/30 mb-1.5">
                          {exp.category}
                        </Badge>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#3DDC97] transition-colors">{exp.vietnameseTitle}</h4>
                        <p className="text-xs text-[#9BA9C3] line-clamp-2 mt-1">{exp.description}</p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-[#243049]/60 flex items-center justify-between text-xs text-[#3DDC97]">
                        <span>Khám phá trải nghiệm</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Linked Editorial Stories */}
            {linkedStories.length > 0 && (
              <section className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 sm:p-8 backdrop-blur-xl">
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#48E3EF] mb-2 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Góc nhìn & Ký sự bản địa
                </h2>
                <h3 className="font-serif text-2xl font-medium text-white mb-6">
                  Câu chuyện văn hóa tại {destination.vietnameseName}
                </h3>

                <div className="space-y-4">
                  {linkedStories.map((story) => (
                    <Link
                      key={story.id}
                      to={`/stories?id=${story.id}`}
                      className="group flex flex-col sm:flex-row items-start gap-4 rounded-xl border border-[#243049] bg-[#080D18] p-4 hover:border-[#48E3EF]/40 transition-colors"
                    >
                      <div className="w-full sm:w-32 aspect-video sm:aspect-square rounded-lg overflow-hidden shrink-0">
                        <img src={story.heroImage} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="flex-1">
                        <Badge variant="outline" className="text-[10px] text-[#48E3EF] border-[#48E3EF]/30 mb-1">
                          {story.category}
                        </Badge>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#48E3EF] transition-colors">{story.title}</h4>
                        <p className="text-xs text-[#9BA9C3] line-clamp-2 mt-1">{story.excerpt}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Rail: Meta, Planning & Sources */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Quick Actions Panel */}
            <div className="rounded-2xl border border-[#243049] bg-[#0E1626] p-6 backdrop-blur-xl space-y-4">
              <h3 className="font-serif text-lg font-medium text-white">Khám phá miền đất này</h3>

              <div className="space-y-2">
                <Link
                  to={`/map/north?destination=${destination.id}`}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3DDC97] to-[#48E3EF] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#3DDC97]/15 hover:opacity-95 transition-opacity"
                >
                  <Compass className="w-4 h-4 text-slate-950" />
                  <span>Mở trên Bản đồ miền Bắc</span>
                </Link>

                <Button
                  variant="outline"
                  size="md"
                  className="w-full text-xs border-[#243049] text-white hover:border-[#3DDC97]"
                  onClick={handleStartPlanning}
                >
                  <Calendar className="h-4 w-4 mr-2 text-[#3DDC97]" />
                  <span>Lên lịch trình cùng TRAVI</span>
                </Button>
              </div>

              {/* Transportation Advice (if available from verified record) */}
              {legacyRecord?.transportationAdvice && (
                <div className="pt-4 border-t border-[#243049]/60 space-y-2 text-xs">
                  <span className="text-[#9BA9C3] block font-semibold text-[11px] uppercase tracking-wider">
                    Gợi ý phương tiện di chuyển
                  </span>
                  <div className="p-3 rounded-xl bg-[#080D18] border border-[#243049] text-slate-300 space-y-1.5 leading-relaxed text-[11px]">
                    <p><strong>Từ Hà Nội:</strong> {legacyRecord.transportationAdvice.fromHanoi}</p>
                    <p><strong>Tại địa phương:</strong> {legacyRecord.transportationAdvice.localTransit}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Provenance & Source Metadata Card */}
            <div className="rounded-2xl border border-[#243049] bg-[#0E1626] p-6 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-[#3DDC97]" />
                <h4 className="font-serif text-sm font-semibold text-white uppercase tracking-wider">
                  Nguồn dữ liệu & Hồ sơ thực địa
                </h4>
              </div>

              <div className="space-y-3 text-xs text-[#C4D0E5]">
                <div>
                  <span className="text-[#9BA9C3] block font-medium">Hồ sơ thẩm định:</span>
                  <span className="text-white font-medium">
                    {translateProvenanceStatus(legacyRecord?.verificationStatus || (destination.dataStatus === 'verified' ? 'Verified Editorial' : 'Needs Verification'))}
                  </span>
                </div>

                <div>
                  <span className="text-[#9BA9C3] block font-medium">Đơn vị hành chính:</span>
                  <span className="text-white font-medium">{destination.currentAdministrativeRegion}</span>
                </div>

                <div>
                  <span className="text-[#9BA9C3] block font-medium">Phân vùng địa lý:</span>
                  <span className="text-[#3DDC97] font-medium">{destination.subregion}</span>
                </div>

                <div>
                  <span className="text-[#9BA9C3] block font-medium">Tọa độ GPS xác thực:</span>
                  <span className="font-mono text-[11px] text-white">
                    {destination.latitude.toFixed(4)}°B, {destination.longitude.toFixed(4)}°Đ
                  </span>
                </div>

                <div className="border-t border-[#243049]/60 pt-3 space-y-1.5">
                  <span className="text-[#9BA9C3] block font-medium">Nguồn trích dẫn:</span>
                  {destination.sourceReferences.map((src, i) => (
                    <div key={i} className="text-[11px] text-[#9BA9C3] bg-[#080D18] p-2.5 rounded-lg border border-[#243049]/60">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-white">{src.name}</div>
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3DDC97] hover:underline flex items-center gap-1 text-[10px]"
                          >
                            <span>Tham chiếu</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-[10px] text-[#3DDC97]">{src.sourceType}</div>
                      {src.notes && <p className="text-[10px] text-slate-400 mt-1 italic">{src.notes}</p>}
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-500 mt-1">
                    Cập nhật lần cuối: {formatDateVI(destination.lastReviewedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Nearby Destinations in the same Subregion */}
        {relatedDestinations.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#243049]/60">
            <h3 className="font-serif text-2xl font-medium text-white mb-6">
              Những miền đất lân cận tại {destination.subregion}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedDestinations.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/destinations/${rel.id}`}
                  className="group relative flex flex-col rounded-2xl border border-[#243049] bg-[#0E1626] overflow-hidden hover:border-[#3DDC97]/50 transition-all"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <img
                      src={rel.images[0] || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80'}
                      alt={rel.vietnameseName}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E1626] via-transparent to-transparent" />
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] text-[#3DDC97] font-medium uppercase tracking-wider">
                      {rel.currentAdministrativeRegion}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1 group-hover:text-[#3DDC97] transition-colors">
                      {rel.vietnameseName}
                    </h4>
                    <p className="text-xs text-[#9BA9C3] line-clamp-2 mt-1">{rel.shortDescription}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DestinationDetailPage;
