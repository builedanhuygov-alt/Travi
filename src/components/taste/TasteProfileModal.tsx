import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Film,
  Music,
  Utensils,
  Landmark,
  Palette,
  Scroll,
  Trees,
  Users,
  Check,
  RotateCcw,
  Sliders,
  Layers,
  Plus,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { useDemoStore } from '../../services/storage/demoStore.ts';
import { TASTE_PILLARS, TASTE_PRESETS, EMPTY_TASTE_PROFILE, CURATED_DEMO_TASTE_PROFILE } from '../../services/taste/tasteData.ts';
import { triggerToast } from '../../lib/toast.ts';
import type { TasteProfile } from '../../types/index.ts';

interface TasteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PILLAR_ICONS: Record<string, React.ElementType> = {
  films: Film,
  music: Music,
  food: Utensils,
  architecture: Landmark,
  art: Palette,
  history: Scroll,
  nature: Trees,
  localCulture: Users,
};

export const TasteProfileModal: React.FC<TasteProfileModalProps> = ({ isOpen, onClose }) => {
  const { tasteProfile, saveTasteProfile } = useDemoStore();

  const [activeTab, setActiveTab] = useState<'pillars' | 'presets' | 'custom'>('pillars');
  const [activePillarIndex, setActivePillarIndex] = useState(0);
  const [draftProfile, setDraftProfile] = useState<TasteProfile>(() => ({ ...tasteProfile }));
  const [customTagInput, setCustomTagInput] = useState('');

  // Sync draft when opened or store updates
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setDraftProfile({ ...tasteProfile });
      });
    }
  }, [isOpen, tasteProfile]);

  // Accessible keyboard dismissal on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activePillar = TASTE_PILLARS[activePillarIndex];
  const activeIcon = PILLAR_ICONS[activePillar.id] || Compass;

  const handleToggleOption = (pillarId: keyof Omit<TasteProfile, 'updatedAt' | 'isCustomized'>, label: string) => {
    setDraftProfile((prev) => {
      const currentList = (prev[pillarId] as string[]) || [];
      const exists = currentList.includes(label);
      const updatedList = exists
        ? currentList.filter((item) => item !== label)
        : [...currentList, label];

      return {
        ...prev,
        [pillarId]: updatedList,
        isCustomized: true,
      };
    });
  };

  const handleApplyPreset = (presetProfile: Partial<TasteProfile>, presetName: string) => {
    setDraftProfile({
      ...EMPTY_TASTE_PROFILE,
      ...presetProfile,
      updatedAt: 'calibrated',
      isCustomized: true,
    });
    triggerToast(`Đã áp dụng hồ sơ "${presetName}"`, 'info');
  };

  const handleReset = () => {
    setDraftProfile({ ...EMPTY_TASTE_PROFILE, isCustomized: false });
    triggerToast('Đã đặt lại sở thích về mặc định', 'info');
  };

  const handleApplyCuratedDemo = () => {
    setDraftProfile({ ...CURATED_DEMO_TASTE_PROFILE });
    triggerToast('Đã áp dụng hồ sơ Người khám phá Việt Nam', 'info');
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = customTagInput.trim();
    if (!tag) return;

    // Add to current active pillar
    const pillarId = activePillar.id;
    setDraftProfile((prev) => {
      const currentList = (prev[pillarId] as string[]) || [];
      if (currentList.includes(tag)) return prev;
      return {
        ...prev,
        [pillarId]: [...currentList, tag],
        isCustomized: true,
      };
    });
    setCustomTagInput('');
    triggerToast(`Đã thêm sở thích riêng: "${tag}"`, 'info');
  };

  const handleRemoveTrait = (pillarId: keyof Omit<TasteProfile, 'updatedAt' | 'isCustomized'>, trait: string) => {
    setDraftProfile((prev) => ({
      ...prev,
      [pillarId]: ((prev[pillarId] as string[]) || []).filter((t) => t !== trait),
      isCustomized: true,
    }));
  };

  const handleSave = () => {
    saveTasteProfile(draftProfile);
    triggerToast('Đã lưu sở thích du lịch thành công', 'success');
    onClose();
  };

  // Calculate stats
  const totalSelectedCount = TASTE_PILLARS.reduce((sum, pillar) => {
    const list = (draftProfile[pillar.id] as string[]) || [];
    return sum + list.length;
  }, 0);

  const activePillarsCount = TASTE_PILLARS.filter((pillar) => {
    const list = (draftProfile[pillar.id] as string[]) || [];
    return list.length > 0;
  }).length;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="taste-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[#243049] bg-[#0A101D] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#243049]/80 px-6 py-4 bg-[#0E1626]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#10B981]/20 to-[#3DDC97]/20 border border-[#10B981]/40 text-[#3DDC97]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 id="taste-modal-title" className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Phòng hiệu chỉnh gu du lịch TRAVI
                <span className="text-xs font-normal text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20">
                  Hiệu chỉnh văn hóa
                </span>
              </h2>
              <p className="text-xs text-[#9BA9C3]">
                Thiết lập các chiều văn hóa, ẩm thực và cảnh sắc để cá nhân hóa gợi ý khám phá Việt Nam.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng phòng hiệu chỉnh"
            className="rounded-lg p-2 text-[#9BA9C3] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#243049]/60 px-6 bg-[#080D18]">
          <button
            onClick={() => setActiveTab('pillars')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'pillars'
                ? 'border-[#3DDC97] text-[#3DDC97] bg-[#3DDC97]/5'
                : 'border-transparent text-[#9BA9C3] hover:text-white'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>8 Trụ cột văn hóa</span>
            <span className="ml-1 rounded-full bg-[#18253E] px-1.5 py-0.5 text-[10px] text-white">
              {totalSelectedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'presets'
                ? 'border-[#3DDC97] text-[#3DDC97] bg-[#3DDC97]/5'
                : 'border-transparent text-[#9BA9C3] hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Hồ sơ du lịch mẫu</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'custom'
                ? 'border-[#3DDC97] text-[#3DDC97] bg-[#3DDC97]/5'
                : 'border-transparent text-[#9BA9C3] hover:text-white'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Từ khóa & Sở thích riêng</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'pillars' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Pillar Selector Sidebar */}
              <div className="md:col-span-4 flex flex-col gap-1.5 border-r border-[#243049]/60 pr-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9BA9C3] mb-1">
                  Chọn trụ cột
                </div>
                {TASTE_PILLARS.map((pillar, idx) => {
                  const Icon = PILLAR_ICONS[pillar.id] || Compass;
                  const selections = (draftProfile[pillar.id] as string[]) || [];
                  const isSelected = idx === activePillarIndex;

                  return (
                    <button
                      key={pillar.id}
                      onClick={() => setActivePillarIndex(idx)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-[#18253E] text-white font-medium shadow-sm border border-[#3DDC97]/30'
                          : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-[#3DDC97]' : 'text-[#9BA9C3]'}`} />
                        <span className="truncate">{pillar.label}</span>
                      </div>
                      {selections.length > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3DDC97]/20 text-[10px] font-bold text-[#3DDC97]">
                          {selections.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Options Content */}
              <div className="md:col-span-8 flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    {React.createElement(activeIcon, { className: 'h-4 w-4 text-[#3DDC97]' })}
                    <span>{activePillar.label}</span>
                    <Badge variant="outline" className="text-[10px] text-[#3DDC97] border-[#3DDC97]/30">
                      {activePillar.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#9BA9C3] mt-1">{activePillar.tagline}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activePillar.options.map((option) => {
                    const currentSelected = ((draftProfile[activePillar.id] as string[]) || []).includes(
                      option.label
                    );

                    return (
                      <div
                        key={option.id}
                        onClick={() => handleToggleOption(activePillar.id, option.label)}
                        className={`group relative flex flex-col justify-between rounded-xl p-3.5 border transition-all cursor-pointer select-none ${
                          currentSelected
                            ? 'bg-[#18253E]/90 border-[#3DDC97] shadow-sm shadow-[#3DDC97]/10'
                            : 'bg-[#0E1626]/80 border-[#243049]/70 hover:border-[#3DDC97]/40 hover:bg-[#121C2F]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-xs font-medium leading-snug transition-colors ${
                              currentSelected ? 'text-white' : 'text-[#E2E8F0] group-hover:text-white'
                            }`}
                          >
                            {option.label}
                          </span>
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              currentSelected
                                ? 'bg-[#3DDC97] border-[#3DDC97] text-[#080D18]'
                                : 'border-[#4A5D7E] group-hover:border-[#9BA9C3]'
                            }`}
                          >
                            {currentSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-[#9BA9C3] mt-2 leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TASTE_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="flex flex-col justify-between rounded-xl border border-[#243049] bg-[#0E1626] p-4 hover:border-[#3DDC97]/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-white">{preset.name}</h3>
                      <Badge variant="outline" className="text-[10px] text-[#3DDC97] border-[#3DDC97]/30">
                        {preset.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#3DDC97]/90 font-medium italic mb-2">"{preset.tagline}"</p>
                    <p className="text-xs text-[#9BA9C3] leading-relaxed mb-4">{preset.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyPreset(preset.profile, preset.name)}
                    className="w-full text-xs border-[#243049] hover:bg-[#3DDC97]/10 hover:border-[#3DDC97]/50 hover:text-[#3DDC97]"
                  >
                    Áp dụng hồ sơ
                  </Button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="flex flex-col gap-6">
              <div className="rounded-xl border border-[#243049] bg-[#0E1626] p-4">
                <h3 className="text-sm font-semibold text-white mb-1">Thêm từ khóa sở thích cá nhân</h3>
                <p className="text-xs text-[#9BA9C3] mb-3">
                  Bạn có sở thích cụ thể như món ăn đặc sản, làng nghề, vườn quốc gia hoặc lễ hội? Nhập từ khóa để hiệu chỉnh:
                </p>

                <form onSubmit={handleAddCustomTag} className="flex gap-2">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    placeholder="Ví dụ: Bánh cuốn nóng, Làng gốm Phù Lãng, Trekking Tà Xùa, Đờn ca tài tử..."
                    className="flex-1 rounded-xl border border-[#243049] bg-[#080D18] px-3.5 py-2 text-xs text-white placeholder-[#4A5D7E] focus:border-[#3DDC97] focus:outline-none"
                  />
                  <Button type="submit" size="sm" className="bg-[#3DDC97] text-[#080D18] hover:bg-[#32B87D] text-xs font-semibold">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Thêm
                  </Button>
                </form>
              </div>

              {/* Current Active Selections by Pillar */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9BA9C3] mb-3">
                  Các lựa chọn hiện tại ({totalSelectedCount})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {TASTE_PILLARS.map((pillar) => {
                    const traits = (draftProfile[pillar.id] as string[]) || [];
                    return traits.map((trait) => (
                      <span
                        key={`${pillar.id}-${trait}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#243049] bg-[#121C2F] px-2.5 py-1 text-xs text-[#E2E8F0]"
                      >
                        <span className="text-[10px] text-[#3DDC97] font-medium">[{pillar.label.split(' ')[0]}]:</span>
                        <span>{trait}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTrait(pillar.id, trait)}
                          aria-label={`Bỏ chọn ${trait}`}
                          className="text-[#9BA9C3] hover:text-red-400 ml-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ));
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#243049]/80 px-6 py-4 bg-[#0E1626] gap-3">
          <div className="flex items-center gap-2 text-xs text-[#9BA9C3]">
            <ShieldCheck className="h-4 w-4 text-[#3DDC97]" />
            <span>
              {activePillarsCount}/8 trụ cột đang kích hoạt ({totalSelectedCount} lựa chọn)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-[#9BA9C3] hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Đặt lại
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyCuratedDemo}
              className="text-xs border-[#243049] hover:bg-white/5"
            >
              Mẫu tuyển chọn
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-gradient-to-r from-[#10B981] to-[#3DDC97] text-[#080D18] hover:opacity-95 font-semibold text-xs px-5"
            >
              Lưu sở thích
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
