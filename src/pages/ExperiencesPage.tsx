import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Search,
  Bookmark,
  Share2,
  Check,
  Info,
  CheckCircle2,
  ExternalLink,
  X,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Button } from '../components/ui/Button.tsx';
import { vietnamExperiences, VIETNAM_EXPERIENCE_CATEGORIES } from '../data/vietnamExperiences.ts';
import { VIETNAM_REGIONS } from '../data/vietnamData.ts';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { triggerToast } from '../lib/toast.ts';
import { translateRegion, translateExperienceCategory, translateTimeOfDay, formatDateVI } from '../lib/i18n/index.ts';
import { normalizeVietnameseText } from '../services/search/vietnamSearchEngine.ts';
import type { StandaloneExperience } from '../types/discovery.ts';

export const ExperiencesPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedExpIds, toggleSaveExperience, inquiries, createInquiry } = useDemoStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExp, setSelectedExp] = useState<StandaloneExperience | null>(null);

  // Inquiry modal state
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [guestsCount, setGuestsCount] = useState(2);
  const [preferredDate, setPreferredDate] = useState('2026-11-20');
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredExperiences = useMemo(() => {
    const norm = normalizeVietnameseText(searchQuery);

    return vietnamExperiences.filter((exp) => {
      if (selectedCategory !== 'All' && exp.category !== selectedCategory) return false;
      if (selectedRegion !== 'All' && exp.region !== selectedRegion) return false;
      if (selectedTimeOfDay !== 'All' && exp.bestTimeOfDay !== selectedTimeOfDay) return false;

      if (norm) {
        const matchTitle = normalizeVietnameseText(exp.title).includes(norm);
        const matchVnTitle = normalizeVietnameseText(exp.vietnameseTitle).includes(norm);
        const matchLoc = normalizeVietnameseText(exp.location).includes(norm);
        const matchHost = exp.hostOrCraftsman ? normalizeVietnameseText(exp.hostOrCraftsman).includes(norm) : false;
        const matchDesc = normalizeVietnameseText(exp.description).includes(norm);
        if (!matchTitle && !matchVnTitle && !matchLoc && !matchHost && !matchDesc) return false;
      }

      return true;
    });
  }, [selectedCategory, selectedRegion, selectedTimeOfDay, searchQuery]);

  const handleToggleSave = (e: React.MouseEvent, expId: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    const isNowSaved = toggleSaveExperience(expId);
    triggerToast(
      isNowSaved ? 'Đã lưu trải nghiệm' : 'Đã bỏ lưu trải nghiệm',
      `"${title}" đã được cập nhật trong sổ tay cá nhân.`,
      isNowSaved ? 'success' : 'neutral'
    );
  };

  const handleShareExp = (e: React.MouseEvent, exp: StandaloneExperience) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/experiences?id=${exp.id}`);
      setCopiedId(exp.id);
      triggerToast('Đã sao chép liên kết', `Đã sao chép liên kết cho "${exp.vietnameseTitle}".`, 'info');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleOpenInquiry = (exp: StandaloneExperience) => {
    setSelectedExp(exp);
    setIsInquiryModalOpen(true);
  };

  const handleConfirmInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExp) return;

    createInquiry({
      experienceId: selectedExp.id,
      experienceTitle: selectedExp.vietnameseTitle || selectedExp.title,
      date: preferredDate,
      guestsCount: guestsCount,
      totalPrice: selectedExp.estimatedCostVND,
    });

    setIsInquiryModalOpen(false);
    triggerToast(
      'Đã ghi nhận nguyện vọng',
      `Đã ghi nhận nguyện vọng tham gia ${selectedExp.vietnameseTitle} (${guestsCount} người) vào sổ tay cá nhân.`,
      'success'
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <PageHeader
        badge="Di sản & Làng nghề Việt Nam"
        badgeVariant="green"
        title="Trải nghiệm bản địa trên khắp Việt Nam"
        description="Gặp gỡ nghệ nhân 5 đời làm gốm, thợ dệt lanh chàm H'Mông, nghệ nhân làm đèn lồng và đầu bếp cung đình qua 8 nhóm trải nghiệm bản địa tuyển chọn."
      />

      {/* Honest Boundary Callout */}
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-[#3DDC97]/30 bg-[#3DDC97]/5 p-4 text-xs text-[#9BA9C3]">
        <Info className="h-5 w-5 text-[#3DDC97] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white block mb-0.5">
            Nguyên tắc minh bạch dữ liệu: Trải nghiệm thực tế có dẫn chứng
          </span>
          <p className="font-light leading-relaxed">
            Mọi trải nghiệm đều gắn liền với địa danh và nghệ nhân bản địa thực tế. Nguyện vọng đăng ký ({inquiries.length} mục đã ghi nhận) được lưu trữ minh bạch vào sổ tay cá nhân của bạn, không thu phí trung gian hay tuyên bố đặt chỗ tự động khi chưa có xác nhận từ cơ sở.
          </p>
        </div>
      </div>

      {/* Facet Filters & Search */}
      <div className="mb-8 space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {VIETNAM_EXPERIENCE_CATEGORIES.map((cat) => {
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
                {cat === 'All' ? 'Tất cả trải nghiệm' : translateExperienceCategory(cat)}
              </button>
            );
          })}
        </div>

        {/* Region & Time & Search Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9BA9C3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm trải nghiệm, làng nghề, nghệ nhân (vd: Bát Tràng, làm gốm, Hội An)..."
              className="w-full rounded-xl border border-[#243049] bg-[#0E1626] pl-9 pr-4 py-2 text-xs text-white placeholder-[#9BA9C3] focus:border-[#3DDC97] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full rounded-xl border border-[#243049] bg-[#0E1626] px-3 py-2 text-xs text-white focus:border-[#3DDC97] focus:outline-none"
            >
              <option value="All">Tất cả vùng miền Việt Nam</option>
              {VIETNAM_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {translateRegion(r)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedTimeOfDay}
              onChange={(e) => setSelectedTimeOfDay(e.target.value)}
              className="w-full rounded-xl border border-[#243049] bg-[#0E1626] px-3 py-2 text-xs text-white focus:border-[#3DDC97] focus:outline-none"
            >
              <option value="All">Bất kỳ thời điểm nào</option>
              <option value="Morning">Buổi sáng</option>
              <option value="Afternoon">Buổi chiều</option>
              <option value="Evening">Buổi tối</option>
              <option value="Full Day">Cả ngày</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count & Active Status */}
      <div className="flex items-center justify-between mb-6 text-xs text-[#9BA9C3]">
        <span>
          Đang hiển thị <strong className="text-white">{filteredExperiences.length}</strong> trải nghiệm tuyển chọn
        </span>
        {savedExpIds.length > 0 && (
          <span className="text-[#3DDC97]">
            {savedExpIds.length} mục đã lưu trong sổ tay
          </span>
        )}
      </div>

      {/* Experience Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExperiences.map((exp) => {
          const isSaved = savedExpIds.includes(exp.id);

          return (
            <Card
              key={exp.id}
              variant="interactive"
              className="group flex flex-col justify-between overflow-hidden border border-[#243049] hover:border-[#3DDC97]/40"
              onClick={() => setSelectedExp(exp)}
            >
              <div>
                <div className="relative aspect-[16/10] bg-[#10182A] overflow-hidden">
                  <img
                    src={exp.image}
                    alt={exp.vietnameseTitle}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10182A] via-transparent to-black/30" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <Badge variant="green" size="sm" className="bg-[#080D18]/85 text-white backdrop-blur-md border-white/10 text-[10px]">
                      {translateExperienceCategory(exp.category)}
                    </Badge>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleToggleSave(e, exp.id, exp.vietnameseTitle)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-[#080D18]/70 text-white/80 hover:bg-white hover:text-rose-500'
                        }`}
                        aria-label="Lưu trải nghiệm"
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleShareExp(e, exp)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#080D18]/70 text-white/80 hover:bg-white hover:text-[#080D18] backdrop-blur-md transition-all cursor-pointer"
                        aria-label="Chia sẻ trải nghiệm"
                      >
                        {copiedId === exp.id ? <Check className="h-3.5 w-3.5 text-[#3DDC97]" /> : <Share2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="absolute bottom-2.5 left-3">
                    <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm border border-white/10">
                      {translateRegion(exp.region)}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 text-[11px] text-[#3DDC97] mb-1 font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{exp.duration}</span>
                    <span>•</span>
                    <span>{translateTimeOfDay(exp.bestTimeOfDay)}</span>
                  </div>

                  <h3 className="font-serif text-lg font-medium text-white group-hover:text-[#3DDC97] transition-colors leading-snug mb-1">
                    {exp.vietnameseTitle}
                  </h3>
                  <p className="text-xs text-[#9BA9C3] mb-3 font-mono text-[11px]">
                    {exp.title}
                  </p>

                  <p className="text-xs text-[#9BA9C3] line-clamp-3 font-light leading-relaxed mb-4">
                    {exp.description}
                  </p>

                  {exp.hostOrCraftsman && (
                    <div className="rounded-lg bg-white/5 border border-white/5 p-2 text-[11px] text-[#C4D0E5] mb-3">
                      <span className="text-[#9BA9C3]">Nghệ nhân / Đơn vị tổ chức: </span>
                      <strong className="text-white">{exp.hostOrCraftsman}</strong>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-[#9BA9C3]">
                    <MapPin className="h-3 w-3 text-[#3DDC97] shrink-0" />
                    <span className="truncate">{exp.location}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-[#243049]/50 flex items-center justify-between text-xs text-[#9BA9C3]">
                <div className="pt-3">
                  <span className="text-[10px] uppercase text-[#9BA9C3] block font-mono">Ước tính chi phí</span>
                  <span className="font-mono text-white text-xs font-semibold">{exp.estimatedCostVND}</span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedExp(exp);
                  }}
                  className="mt-3 text-xs border-[#3DDC97]/40 text-[#3DDC97] hover:bg-[#3DDC97]/10"
                >
                  Chi tiết
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Experience Details Modal Drawer */}
      {selectedExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-modal-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-[#243049] bg-[#0E1626] overflow-hidden shadow-2xl my-8">
            <button
              onClick={() => setSelectedExp(null)}
              className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
              aria-label="Đóng bảng chi tiết"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative aspect-[16/9] w-full bg-[#10182A]">
              <img src={selectedExp.image} alt={selectedExp.vietnameseTitle} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E1626] via-transparent to-black/40" />

              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="green" size="sm">{translateExperienceCategory(selectedExp.category)}</Badge>
                  <Badge variant="neutral" size="sm">{translateRegion(selectedExp.region)}</Badge>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-medium text-white">
                  {selectedExp.vietnameseTitle}
                </h3>
                <p className="text-sm text-[#3DDC97] font-mono">
                  {selectedExp.title}
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] mb-2">
                  Nội dung trải nghiệm
                </h4>
                <p className="text-xs sm:text-sm text-[#C4D0E5] leading-relaxed font-light">
                  {selectedExp.description}
                </p>
              </div>

              {/* Highlights */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
                  Điểm nhấn nổi bật
                </h4>
                <ul className="space-y-2">
                  {selectedExp.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#C4D0E5]">
                      <CheckCircle2 className="h-4 w-4 text-[#3DDC97] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Host & Logistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-[#243049] bg-[#080D18] p-4 text-xs text-[#C4D0E5]">
                <div>
                  <span className="text-[#9BA9C3] block">Nghệ nhân / Đơn vị tổ chức:</span>
                  <strong className="text-white">{selectedExp.hostOrCraftsman || 'Hội nghệ nhân bản địa'}</strong>
                </div>
                <div>
                  <span className="text-[#9BA9C3] block">Thời lượng & Khung giờ:</span>
                  <strong className="text-white">{selectedExp.duration} ({translateTimeOfDay(selectedExp.bestTimeOfDay)})</strong>
                </div>
                <div>
                  <span className="text-[#9BA9C3] block">Địa điểm thực tế:</span>
                  <span className="text-white">{selectedExp.location}</span>
                </div>
                <div>
                  <span className="text-[#9BA9C3] block">Ước tính chi phí:</span>
                  <strong className="text-[#3DDC97] font-mono">{selectedExp.estimatedCostVND}</strong>
                </div>
              </div>

              {/* Provenance Metadata */}
              <div className="rounded-xl border border-[#243049] bg-[#0A101D] p-4 text-xs text-[#9BA9C3]">
                <div className="flex items-center gap-2 font-semibold text-white mb-1">
                  <ShieldCheck className="h-4 w-4 text-[#3DDC97]" />
                  <span>Nguồn xác thực: {selectedExp.provenanceMetadata.sourceName}</span>
                </div>
                <p className="font-light mb-2">{selectedExp.provenanceMetadata.verificationNotes}</p>
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5">
                  <span>Xác minh lần cuối: {formatDateVI(selectedExp.provenanceMetadata.lastVerifiedAt)}</span>
                  {selectedExp.provenanceMetadata.sourceUrl && (
                    <a
                      href={selectedExp.provenanceMetadata.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3DDC97] hover:underline inline-flex items-center gap-1 font-mono"
                    >
                      <span>Trang chính thức</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#243049]">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate(`/destinations/${selectedExp.destinationId}`)}
                  className="text-xs"
                >
                  <span>Xem hồ sơ điểm đến liên kết</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={(e) => handleToggleSave(e, selectedExp.id, selectedExp.vietnameseTitle)}
                    className="text-xs"
                  >
                    <Bookmark className={`h-4 w-4 mr-1 ${savedExpIds.includes(selectedExp.id) ? 'fill-current text-rose-500' : ''}`} />
                    <span>{savedExpIds.includes(selectedExp.id) ? 'Đã lưu' : 'Lưu trải nghiệm'}</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleOpenInquiry(selectedExp)}
                    className="text-xs"
                  >
                    Ghi nhận vào sổ tay
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draft Inquiry Modal */}
      {isInquiryModalOpen && selectedExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-modal-in">
          <div className="w-full max-w-md rounded-2xl border border-[#243049] bg-[#0E1626] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-medium text-white">
                Ghi nhận nguyện vọng trải nghiệm
              </h3>
              <button
                onClick={() => setIsInquiryModalOpen(false)}
                className="text-[#9BA9C3] hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmInquiry} className="space-y-4 text-xs">
              <div>
                <label className="text-[#9BA9C3] block mb-1">Trải nghiệm / Làng nghề</label>
                <input
                  type="text"
                  readOnly
                  value={selectedExp.vietnameseTitle}
                  className="w-full rounded-xl border border-[#243049] bg-[#080D18] px-3 py-2 text-white opacity-80"
                />
              </div>

              <div>
                <label className="text-[#9BA9C3] block mb-1">Ngày dự kiến</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full rounded-xl border border-[#243049] bg-[#080D18] px-3 py-2 text-white focus:border-[#3DDC97] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#9BA9C3] block mb-1">Số lượng khách: {guestsCount} người</label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(parseInt(e.target.value))}
                  className="w-full accent-[#3DDC97]"
                />
              </div>

              <div>
                <label className="text-[#9BA9C3] block mb-1">Ghi chú đặc biệt / Yêu cầu hướng dẫn</label>
                <textarea
                  rows={2}
                  value={inquiryNotes}
                  onChange={(e) => setInquiryNotes(e.target.value)}
                  placeholder="Ví dụ: Cần người hướng dẫn tiếng Anh, ăn chay, muốn học vuốt gốm thủ công..."
                  className="w-full rounded-xl border border-[#243049] bg-[#080D18] px-3 py-2 text-white placeholder-[#9BA9C3] focus:border-[#3DDC97] focus:outline-none"
                />
              </div>

              <div className="rounded-lg bg-[#3DDC97]/10 border border-[#3DDC97]/20 p-3 text-[11px] text-[#9BA9C3]">
                Nguyện vọng được lưu vào sổ tay cá nhân của bạn trên ứng dụng TRAVI nhằm hỗ trợ lên lịch trình tự túc, không thu tiền hay liên kết giao dịch trung gian.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInquiryModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Lưu vào sổ tay
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperiencesPage;
