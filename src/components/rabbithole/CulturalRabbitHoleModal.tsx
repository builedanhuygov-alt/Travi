import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  X,
  Sparkles,
  Compass,
  ArrowRight,
  GitBranch,
  BookmarkPlus,
  RefreshCw,
  Search,
  HelpCircle
} from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { triggerToast } from '../../lib/toast.ts';
import { useDemoStore } from '../../services/storage/demoStore.ts';
import { useNavigate } from 'react-router-dom';
import {
  initiateRabbitHole,
  getAvailableHops,
  executeRabbitHoleHop,
  convertRabbitHoleTrailToTrip,
  RABBIT_HOLE_PRESETS,
  type RabbitHoleTrail,
  type RabbitHoleHopOption,
} from '../../services/rabbithole/culturalRabbitHoleEngine.ts';

interface CulturalRabbitHoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSeed?: string;
}

export const CulturalRabbitHoleModal: React.FC<CulturalRabbitHoleModalProps> = ({
  isOpen,
  onClose,
  initialSeed,
}) => {
  const navigate = useNavigate();
  const { createTrip } = useDemoStore();
  const searchInputId = useId();

  const [seedInput, setSeedInput] = useState(() => initialSeed || RABBIT_HOLE_PRESETS[0].seed);
  const [trail, setTrail] = useState<RabbitHoleTrail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Initialize with initialSeed or default preset when modal opens
  const startRabbitHole = useCallback(async (seed: string) => {
    setIsLoading(true);
    try {
      const initialTrail = await initiateRabbitHole(seed);
      setTrail(initialTrail);
      setSelectedNodeId(initialTrail.nodes[initialTrail.nodes.length - 1].id);
      triggerToast('Mở mạch văn hóa', `Đang kết nối các chiều sở thích cho "${seed}".`, 'success');
    } catch {
      triggerToast('Lỗi mở mạch văn hóa', 'Không thể khởi tạo mạch khám phá. Vui lòng thử từ khóa khác.', 'warning');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const startingSeed = initialSeed || RABBIT_HOLE_PRESETS[0].seed;
      queueMicrotask(() => {
        void startRabbitHole(startingSeed);
      });
    }
  }, [isOpen, initialSeed, startRabbitHole]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedInput.trim()) return;
    startRabbitHole(seedInput.trim());
  };

  const handleHopClick = async (hop: RabbitHoleHopOption) => {
    if (!trail || !selectedNodeId) return;
    setIsLoading(true);
    try {
      const updatedTrail = await executeRabbitHoleHop(trail, selectedNodeId, hop);
      setTrail(updatedTrail);
      setSelectedNodeId(updatedTrail.activeNodeId);
      triggerToast('Mở rộng nhánh mới', `Đã kết nối với "${hop.title}".`, 'success');
    } catch {
      triggerToast('Lỗi mở rộng nhánh', 'Không thể kết nối nhánh này. Vui lòng chọn nhánh khác.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToTrip = () => {
    if (!trail) return;
    const tripPayload = convertRabbitHoleTrailToTrip(trail);
    createTrip(tripPayload);
    triggerToast('Đã lưu chuyến đi', `Đã lưu "${tripPayload.title}" vào sổ tay cá nhân.`, 'success');
  };

  const handleSendToCopilot = () => {
    if (!trail) return;
    const destNode = trail.nodes.find((n) => n.destinationId);
    const destId = destNode?.destinationId || 'ha-noi';
    onClose();
    navigate(`/copilot?destination=${destId}`);
  };

  const activeNode = trail?.nodes.find((n) => n.id === selectedNodeId) || trail?.nodes[trail.nodes.length - 1];
  const availableHops = activeNode && trail ? getAvailableHops(activeNode, trail) : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rabbit-hole-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[900px] rounded-3xl border border-[#243049] bg-[#080D18] text-white shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#243049] bg-[#0E1626]/90 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#3DDC97]/20 via-[#48E3EF]/20 to-[#9875FF]/20 border border-[#48E3EF]/30">
              <GitBranch className="h-5 w-5 text-[#48E3EF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="rabbit-hole-title" className="text-base font-semibold text-white tracking-wide">
                  Khám phá đa tầng văn hóa Việt Nam
                </h2>
                <span className="rounded-full bg-[#48E3EF]/15 border border-[#48E3EF]/30 px-2 py-0.5 text-[10px] font-mono text-[#48E3EF]">
                  Mạch nguồn văn hóa
                </span>
              </div>
              <p className="text-xs text-[#9BA9C3] font-light">
                Dõi theo dòng chảy văn hóa sống động từ ẩm thực truyền thống, phường hội làng nghề, lịch sử cung đình đến đèo mây hùng vĩ.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-[#243049] bg-[#121C30] p-2 text-[#9BA9C3] hover:text-white hover:bg-[#18253E] transition-colors"
              aria-label="Đóng cửa sổ"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preset Starters & Custom Search Bar */}
        <div className="border-b border-[#243049] bg-[#0E1626]/50 p-4 space-y-3">
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <label htmlFor={searchInputId} className="sr-only">
                Nhập sở thích văn hóa, nghệ thuật, ẩm thực
              </label>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9BA9C3]" />
              <input
                id={searchInputId}
                type="text"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                placeholder="Nhập sở thích văn hóa (ví dụ: gốm Bát Tràng, cà phê Tây Nguyên, chèo, lụa Vạn Phúc)..."
                className="w-full rounded-xl border border-[#243049] bg-[#080D18] pl-10 pr-4 py-2 text-xs text-white placeholder-[#9BA9C3] focus:border-[#48E3EF] focus:outline-none transition-colors"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isLoading || !seedInput.trim()}
              className="text-xs"
            >
              {isLoading ? 'Đang kết nối...' : 'Khám phá mạch văn hóa'}
            </Button>
          </form>

          {/* Quick Preset Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-mono uppercase text-[#9BA9C3] shrink-0 mr-1">
              Gợi ý khơi nguồn:
            </span>
            {RABBIT_HOLE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSeedInput(p.seed);
                  startRabbitHole(p.seed);
                }}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                  trail?.seedQuery.toLowerCase() === p.seed.toLowerCase()
                    ? 'bg-[#48E3EF]/20 text-[#48E3EF] border border-[#48E3EF]/40'
                    : 'bg-[#121C30] text-[#9BA9C3] border border-[#243049] hover:text-white hover:border-[#48E3EF]/30'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area: Node Graph / Discovery Trail on Left, Active Node Details & Hops on Right */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Visual Discovery Trail (Breadcrumb & Node Cards) */}
          <div className="lg:col-span-5 border-r border-[#243049] bg-[#080D18] p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9BA9C3] font-mono">
                Mạch văn hóa ({trail?.nodes.length || 0} Điểm kết nối)
              </span>
              <span className="text-[10px] font-mono text-[#3DDC97]">
                Nguồn gốc rõ ràng
              </span>
            </div>

            {isLoading && !trail && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <RefreshCw className="h-6 w-6 text-[#48E3EF] animate-spin" />
                <p className="text-xs text-[#9BA9C3]">Đang kết nối mạch nguồn văn hóa và định vị điểm đến bản địa...</p>
              </div>
            )}

            {trail && (
              <div className="space-y-3 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#243049]">
                {trail.nodes.map((node, idx) => {
                  const isSelected = node.id === selectedNodeId;

                  let provColor = 'text-[#3DDC97] bg-[#3DDC97]/15 border-[#3DDC97]/30';
                  if (node.provenance === 'vietnam-heritage') provColor = 'text-[#48E3EF] bg-[#48E3EF]/15 border-[#48E3EF]/30';
                  if (node.provenance === 'curated-destination') provColor = 'text-[#9875FF] bg-[#9875FF]/15 border-[#9875FF]/30';
                  if (node.provenance === 'artisan-atelier') provColor = 'text-amber-400 bg-amber-400/15 border-amber-400/30';

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`relative pl-9 cursor-pointer group transition-all select-none`}
                    >
                      {/* Trail Node Marker */}
                      <div
                        className={`absolute left-2.5 top-3.5 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono font-bold transition-all ${
                          isSelected
                            ? 'bg-[#48E3EF] text-black shadow-lg shadow-[#48E3EF]/40 scale-110'
                            : 'bg-[#18253E] border border-[#243049] text-[#9BA9C3] group-hover:border-[#48E3EF]'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {/* Card Content */}
                      <div
                        className={`rounded-2xl border p-3.5 transition-all ${
                          isSelected
                            ? 'border-[#48E3EF] bg-[#121C30] shadow-md shadow-black/40'
                            : 'border-[#243049] bg-[#0E1626]/60 hover:bg-[#121C30] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-mono border ${provColor}`}>
                            {node.provenanceLabel}
                          </span>
                          <span className="text-[10px] font-mono text-[#9BA9C3]">
                            {node.pillar}
                          </span>
                        </div>

                        <h3 className="text-xs font-semibold text-white group-hover:text-[#48E3EF] transition-colors">
                          {node.title}
                        </h3>

                        {node.subtitle && (
                          <p className="text-[11px] text-[#9BA9C3] font-light mt-0.5">
                            {node.subtitle}
                          </p>
                        )}

                        <p className="text-[11px] text-[#C4D0E5] font-light line-clamp-2 mt-2 leading-relaxed">
                          {node.connectionReason}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Active Node Deep Inspection & Branching Hops */}
          <div className="lg:col-span-7 bg-[#0E1626]/40 p-6 overflow-y-auto space-y-6">
            {activeNode ? (
              <div className="space-y-6">
                {/* Active Node Detail Card */}
                <div className="rounded-3xl border border-[#243049] bg-[#121C30] p-6 space-y-4 shadow-xl">
                  {/* Image banner if destination or artisan atelier */}
                  {activeNode.imageUrl && (
                    <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-[#243049]">
                      <img
                        src={activeNode.imageUrl}
                        alt={activeNode.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0E1626] via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-white border border-white/10">
                          {activeNode.pillar}
                        </span>
                        {activeNode.metadata?.rating && (
                          <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-[#3DDC97] border border-[#3DDC97]/30">
                            ★ {activeNode.metadata.rating} Rating
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full bg-[#48E3EF]/15 border border-[#48E3EF]/30 px-2.5 py-0.5 text-[10px] font-mono text-[#48E3EF]">
                          {activeNode.provenanceLabel}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-wide">
                        {activeNode.title}
                      </h3>
                      {activeNode.subtitle && (
                        <p className="text-xs text-[#9BA9C3] font-light mt-0.5">
                          {activeNode.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Why this connects reasoning */}
                  <div className="rounded-2xl border border-white/5 bg-[#080D18] p-4 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#48E3EF] block">
                      Cầu nối văn hóa & Lý do liên kết:
                    </span>
                    <p className="text-xs text-[#C4D0E5] font-light leading-relaxed">
                      {activeNode.connectionReason}
                    </p>
                  </div>

                  {/* Curated Experience Highlight */}
                  {activeNode.curatedExperience && (
                    <div className="rounded-2xl border border-[#3DDC97]/30 bg-[#3DDC97]/5 p-4 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#3DDC97] block">
                        Trải nghiệm bản địa đặc sắc:
                      </span>
                      <p className="text-xs text-white font-medium">
                        {activeNode.curatedExperience}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {activeNode.tags && activeNode.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeNode.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-[#080D18] border border-[#243049] text-[10px] font-mono text-[#9BA9C3]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Branching Hops: Hop Deeper into the Rabbit Hole */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4 text-[#48E3EF]" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-white">
                        Bước tiếp theo — Mở rộng nhánh văn hóa
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#9BA9C3]">
                      Nhấp để mở nhánh mới
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableHops.map((hop) => (
                      <button
                        key={hop.id}
                        type="button"
                        onClick={() => handleHopClick(hop)}
                        disabled={isLoading}
                        className="flex flex-col text-left rounded-2xl border border-[#243049] bg-[#121C30] p-4 hover:border-[#48E3EF] hover:bg-[#18253E] transition-all group cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="rounded-full bg-[#48E3EF]/10 px-2 py-0.5 text-[9px] font-mono text-[#48E3EF] border border-[#48E3EF]/20">
                            {hop.relationType}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#9BA9C3] group-hover:text-[#48E3EF] group-hover:translate-x-1 transition-all" />
                        </div>
                        <h4 className="text-xs font-semibold text-white group-hover:text-[#48E3EF] transition-colors line-clamp-1">
                          {hop.title}
                        </h4>
                        <p className="text-[11px] text-[#9BA9C3] font-light line-clamp-2 mt-1 leading-relaxed">
                          {hop.teaser}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trail Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-[#243049]">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveToTrip}
                      className="text-xs flex items-center gap-2"
                    >
                      <BookmarkPlus className="h-4 w-4 text-[#3DDC97]" />
                      Lưu mạch văn hóa vào chuyến đi
                    </Button>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendToCopilot}
                    className="text-xs flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Chuyển thành lịch trình mẫu
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
                <HelpCircle className="h-8 w-8 text-[#9BA9C3]" />
                <p className="text-xs text-[#9BA9C3]">Chọn một điểm kết nối bên trái để xem nguồn gốc văn hóa chi tiết.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
