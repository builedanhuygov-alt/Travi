import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  Bot,
  User,
  Compass,
  Check,
  Sparkles,
  BookmarkPlus,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Workflow,
  Plus,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Globe,
  Home,
  Car,
  Users,
  CloudSun,
} from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { vietnamDestinations } from '../data/vietnamData.ts';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { triggerToast } from '../lib/toast.ts';
import {
  type ItineraryDraft,
  type BudgetRange,
  type TravelPace,
  type TransportPreference,
} from '../services/concierge/itineraryGenerator.ts';
import {
  executeAgentWorkflow,
  convertDraftToTrip,
  type AgentWorkflowState,
} from '../services/concierge/agenticTripBuilder.ts';
import {
  vietnamAiService,
  type AiAssistantResponse,
} from '../services/ai/vietnamAiService.ts';
import type { CopilotMessage } from '../types/index.ts';
import { classifyCustomerType } from '../services/adaptive/customerClassifier.ts';
import { assessDestinationWeather } from '../services/weather/weatherService.ts';
import { AiStatusIndicator } from '../components/ai/AiStatusIndicator.tsx';
import type { CustomerType, PreferredLanguage, TravelCompanions, TravelPersona } from '../types/adaptiveTravel.ts';


let msgCounter = 0;
const createMsgId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++msgCounter}`;

export const CopilotPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { tasteProfile, createTrip } = useDemoStore();

  // Active view tab: 'concierge' (itinerary builder) vs 'chat' (conversational assistant)
  const [activeTab, setActiveTab] = useState<'concierge' | 'chat'>('concierge');

  // Generator Form States
  const prefillDest = searchParams.get('destination') || 'ha-noi';
  const [destination, setDestination] = useState<string>(prefillDest);
  const [startingLocation, setStartingLocation] = useState<string>('Hà Nội, Vietnam');
  const [durationDays, setDurationDays] = useState<number>(5);
  const [budgetRange, setBudgetRange] = useState<BudgetRange>('Comfort Explorer');
  const [travelPace, setTravelPace] = useState<TravelPace>('Deliberate');
  const [transportPreference, setTransportPreference] = useState<TransportPreference>('Reunification Express Train');

  // Adaptive Travel Intelligence States
  const [manualCustomerType, setManualCustomerType] = useState<CustomerType | null>(null);
  const [originCountry] = useState<string>('Vietnam');
  const [originProvince, setOriginProvince] = useState<string>('Hà Nội');
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>('vi');
  const [travelCompanions, setTravelCompanions] = useState<TravelCompanions>('Couple');
  const [selectedPersona, setSelectedPersona] = useState<TravelPersona>('EXPLORER');

  // Selected cultural interests & foods
  const [selectedInterests] = useState<string[]>([
    'Living Heritage & Dynasties',
    'Regional Gastronomy & Street Food',
    'Mountains, Karsts & Terrains',
  ]);
  const [selectedFoods] = useState<string[]>([
    'Phở Bò & Broth Lineages',
    'Bún Bò Huế',
    'Mekong Floating Market Delicacies',
  ]);

  // Compute adaptive classification with user override support
  const classificationResult = useMemo(() => {
    if (manualCustomerType) {
      return {
        detected_type: manualCustomerType,
        confidence: 1.0,
        reasons: [`Người dùng chủ động chọn: ${manualCustomerType}`],
        is_overridden: true,
        available_types: ['INTERNATIONAL', 'DOMESTIC', 'LOCAL', 'INTERPROVINCIAL'] as CustomerType[],
      };
    }
    return classifyCustomerType({
      origin_country: originCountry,
      origin_province: originProvince,
      destination,
      preferred_language: preferredLanguage,
      travel_duration: durationDays,
    });
  }, [manualCustomerType, originCountry, originProvince, destination, preferredLanguage, durationDays]);

  const customerType = classificationResult.detected_type;
  const classificationReason = classificationResult.reasons[0] || '';
  const isCustomerTypeOverridden = classificationResult.is_overridden;

  // Weather assessment for selected destination
  const destinationWeather = assessDestinationWeather(destination);

  // Agent Execution States
  const [workflowState, setWorkflowState] = useState<AgentWorkflowState | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedDraft, setGeneratedDraft] = useState<ItineraryDraft | null>(null);
  const [isSavedToTrips, setIsSavedToTrips] = useState<boolean>(false);

  // Stop Editing State
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [newStopTitle, setNewStopTitle] = useState<string>('');
  const [newStopDesc, setNewStopDesc] = useState<string>('');

  // Conversational Chat States
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: createMsgId('ai-init'),
      sender: 'copilot',
      timestamp: 'Vừa xong',
      content:
        'Xin chào! Tôi là **Trợ lý Du lịch Thông minh Travi**. Bạn có thể hỏi tôi về các điểm đến tiềm ẩn, nét đặc sắc ẩm thực vùng miền, văn hóa phong tục bản địa, hoặc lộ trình di chuyển xuyên Việt.',
      suggestions: [
        'Quy tắc văn hóa và trang phục cần biết khi viếng thăm đền chùa?',
        'Những quán ăn đường phố truyền thống ngon nhất tại Hà Nội?',
        'Kinh nghiệm đặt vé tàu hỏa ngắm cảnh qua đèo Hải Vân?',
        'Gợi ý lịch trình 5 ngày khám phá Hà Giang và Đông Bắc?',
      ],
      provenance: {
        providerName: 'Cơ sở Tri thức Chuyên gia Du lịch Travi',
        isLiveAi: false,
        modeDescription: 'Cơ sở Tri thức Chuyên gia Tất định (Đang hoạt động & Đã đối soát)',
      },
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);

  // Helper translations for display
  const companionLabels: Record<TravelCompanions, string> = {
    Solo: 'Một mình',
    Couple: 'Cặp đôi',
    Family: 'Gia đình',
    Friends: 'Bạn bè',
    'Small Group': 'Nhóm nhỏ',
  };

  const budgetLabels: Record<BudgetRange, string> = {
    'Budget Backpacker': 'Tiết kiệm',
    'Comfort Explorer': 'Tiêu chuẩn',
    'Luxury Heritage': 'Cao cấp',
    'Mid-range': 'Tầm trung',
    Comfort: 'Thoải mái',
    Luxury: 'Sang trọng',
    'Artisanal Heritage': 'Di sản tinh hoa',
  };

  const paceLabels: Record<TravelPace, string> = {
    Unhurried: 'Thong thả',
    Deliberate: 'Cân bằng',
    Expedition: 'Khám phá nhanh',
    Moderate: 'Vừa phải',
    'Fast-paced': 'Tốc hành',
  };

  const timeOfDayLabels: Record<string, string> = {
    Morning: 'Buổi sáng',
    Afternoon: 'Buổi chiều',
    Evening: 'Buổi tối',
  };

  // Generate Itinerary through 8-stage Agentic Workflow
  const handleGenerateWorkflow = async () => {
    setIsGenerating(true);
    setIsSavedToTrips(false);

    try {
      const result = await executeAgentWorkflow(
        {
          destination,
          durationDays,
          budgetRange,
          travelPace,
          culturalInterests: selectedInterests,
          foodPreferences: selectedFoods,
          startingLocation,
          tasteProfile,
          transportPreference,
        },
        (updated) => {
          setWorkflowState(updated);
        }
      );

      setWorkflowState(result);
      if (result.draft) {
        setGeneratedDraft(result.draft);
        triggerToast('Đã tổng hợp thành công lịch trình chi tiết theo từng ngày!', 'success');
      }
    } catch {
      triggerToast('Đã xảy ra lỗi khi tạo lịch trình. Vui lòng thử lại.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save to My Trips
  const handleSaveToTrips = () => {
    if (!generatedDraft) return;
    const trip = convertDraftToTrip(generatedDraft);
    createTrip(trip);
    setIsSavedToTrips(true);
    triggerToast(`Đã lưu "${trip.title}" vào Hành Trình Của Tôi!`, 'success');
  };

  // Activity Edit & Reorder Functions
  const handleMoveActivityUp = (dayIndex: number, actIndex: number) => {
    if (!generatedDraft || actIndex <= 0) return;
    const updatedDays = JSON.parse(JSON.stringify(generatedDraft.days));
    const day = updatedDays[dayIndex];
    const temp = day.activities[actIndex];
    day.activities[actIndex] = day.activities[actIndex - 1];
    day.activities[actIndex - 1] = temp;
    setGeneratedDraft({
      ...generatedDraft,
      days: updatedDays,
      isEdited: true,
    });
    triggerToast('Đã chuyển điểm dừng lên trước', 'info');
  };

  const handleMoveActivityDown = (dayIndex: number, actIndex: number) => {
    if (!generatedDraft) return;
    const updatedDays = JSON.parse(JSON.stringify(generatedDraft.days));
    const day = updatedDays[dayIndex];
    if (actIndex >= day.activities.length - 1) return;
    const temp = day.activities[actIndex];
    day.activities[actIndex] = day.activities[actIndex + 1];
    day.activities[actIndex + 1] = temp;
    setGeneratedDraft({
      ...generatedDraft,
      days: updatedDays,
      isEdited: true,
    });
    triggerToast('Đã chuyển điểm dừng xuống sau', 'info');
  };

  const handleRemoveActivity = (dayIndex: number, actId: string) => {
    if (!generatedDraft) return;
    const updatedDays = [...generatedDraft.days];
    updatedDays[dayIndex].activities = updatedDays[dayIndex].activities.filter((a) => a.id !== actId);
    setGeneratedDraft({
      ...generatedDraft,
      days: updatedDays,
      isEdited: true,
    });
    triggerToast('Đã xóa điểm dừng khỏi lịch trình', 'info');
  };

  const handleAddActivity = (dayIndex: number) => {
    if (!generatedDraft || !newStopTitle.trim()) return;
    const updatedDays = JSON.parse(JSON.stringify(generatedDraft.days));
    const stopId = `custom-stop-${dayIndex}-${updatedDays[dayIndex].activities.length + 1}`;
    updatedDays[dayIndex].activities.push({
      id: stopId,
      timeOfDay: 'Afternoon',
      title: newStopTitle.trim(),
      description: newStopDesc.trim() || 'Điểm tham quan được thêm thủ công.',
      culturalPillar: 'Khám phá cá nhân',
      estimatedDuration: '2 Giờ',
      unverifiedEstimateNotice: 'Điểm dừng do du khách tự thêm. Vui lòng kiểm tra giờ mở cửa thực tế.',
    });
    setGeneratedDraft({
      ...generatedDraft,
      days: updatedDays,
      isEdited: true,
    });
    setNewStopTitle('');
    setNewStopDesc('');
    setEditingDayIndex(null);
    triggerToast('Đã thêm điểm dừng tùy chọn', 'success');
  };


  // Conversational Chat Submit
  const handleSendChatMessage = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query || isAiResponding) return;

    const userMsg: CopilotMessage = {
      id: createMsgId('user'),
      sender: 'user',
      timestamp: 'Vừa xong',
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAiResponding(true);

    try {
      const response: AiAssistantResponse = await vietnamAiService.generateAnswer(query, {
        destination,
        durationDays,
        travelPace,
        budgetRange,
        customerType,
        profile: {
          customer_type: customerType,
          origin_country: originCountry,
          origin_province: originProvince,
          destination,
          preferred_language: preferredLanguage,
          budget: budgetRange,
          travel_duration: durationDays,
          interests: selectedInterests,
          persona: selectedPersona,
          market: customerType === 'INTERNATIONAL' ? 'INTERNATIONAL' : 'DOMESTIC',
          travel_scope: customerType === 'LOCAL' ? 'LOCAL' : customerType === 'INTERPROVINCIAL' ? 'INTERPROVINCIAL' : 'INTERNATIONAL_TRAVEL',
        },
      });

      const aiMsg: CopilotMessage = {
        id: createMsgId('ai'),
        sender: 'copilot',
        timestamp: 'Vừa xong',
        content: response.content,
        suggestions: response.suggestions,
        itineraryTeaser: response.itineraryTeaser,
        sources: response.sources,
        provenance: response.provenance,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      triggerToast('Đã xảy ra lỗi phản hồi từ trợ lý. Vui lòng thử lại.', 'error');
    } finally {
      setIsAiResponding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080D18] text-[#F4F7FF] pb-24">
      {/* Page Header */}
      <div className="border-b border-[#243049]/80 bg-[#0A101D] px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 rounded-full bg-[#3DDC97] animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-widest text-[#3DDC97]">
                  Trí Tuệ Du Lịch Việt Nam
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-white">
                Lập Kế Hoạch Chuyến Đi & Trợ Lý AI
              </h1>
              <p className="text-xs sm:text-sm text-[#9BA9C3] mt-1 max-w-2xl font-light leading-relaxed">
                Thiết lập lịch trình du lịch chi tiết từng ngày với nhịp độ thực tế và dự toán chi phí, hoặc tham vấn trợ lý AI chuyên sâu về du lịch Việt Nam.
              </p>
            </div>

            {/* Mode Switcher Tabs & Live AI Status */}
            <div className="flex flex-wrap items-center gap-3">
              <AiStatusIndicator />
              <div className="flex items-center rounded-2xl border border-[#243049] bg-[#080D18] p-1.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveTab('concierge')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'concierge'
                      ? 'bg-[#18253E] text-white shadow-sm border border-white/10'
                      : 'text-[#9BA9C3] hover:text-white'
                  }`}
                >
                  <Workflow className="h-4 w-4 text-[#3DDC97]" />
                  <span>Lập Kế Hoạch Thông Minh</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-[#18253E] text-white shadow-sm border border-white/10'
                      : 'text-[#9BA9C3] hover:text-white'
                  }`}
                >
                  <Bot className="h-4 w-4 text-[#48E3EF]" />
                  <span>Trợ Lý Du Lịch AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'concierge' ? (
          /* ============================================================ */
          /* SMART TRIP PLANNER MODE                                      */
          /* ============================================================ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Control Panel: Inputs */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="rounded-3xl border border-[#243049] bg-gradient-to-b from-[#0E1626]/90 to-[#0A1120] p-6 shadow-xl backdrop-blur-xl">
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Hồ Sơ & Tham Số Lịch Trình Thích Ứng
                </h2>

                <div className="space-y-4">
                  {/* Customer Type Selector & Classifier */}
                  <div className="bg-[#080D18] border border-[#243049] p-3.5 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#3DDC97]" />
                        Nhóm Khách Du Lịch (Customer Type)
                      </label>
                      <span className="text-[10px] font-mono text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded-full border border-[#3DDC97]/20">
                        {isCustomerTypeOverridden ? 'Tự chọn' : 'Tự động nhận diện'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { type: 'INTERNATIONAL' as CustomerType, label: 'Quốc tế', icon: Globe },
                        { type: 'DOMESTIC' as CustomerType, label: 'Nội địa', icon: User },
                        { type: 'LOCAL' as CustomerType, label: 'Bản địa', icon: Home },
                        { type: 'INTERPROVINCIAL' as CustomerType, label: 'Liên tỉnh', icon: Car },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = customerType === item.type;
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => {
                              setManualCustomerType(item.type);
                              triggerToast(`Đã chuyển nhóm khách: ${item.label}`, 'info');
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-[#3DDC97] text-[#080D18] font-semibold shadow-md shadow-[#3DDC97]/20'
                                : 'bg-[#101A2C] text-[#9BA9C3] hover:text-white border border-[#243049]/60'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[10px] text-[#9BA9C3] leading-relaxed italic">
                      {classificationReason}
                    </p>
                  </div>

                  {/* Origin & Language Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Tỉnh/Nước xuất phát
                      </label>
                      <input
                        type="text"
                        value={originProvince}
                        onChange={(e) => {
                          setOriginProvince(e.target.value);
                          setManualCustomerType(null);
                        }}
                        placeholder="Hà Nội / France..."
                        className="w-full rounded-xl border border-[#243049] bg-[#080D18] px-3 py-2 text-xs text-white focus:border-[#3DDC97] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Ngôn ngữ ưu tiên
                      </label>
                      <select
                        value={preferredLanguage}
                        onChange={(e) => {
                          setPreferredLanguage(e.target.value as PreferredLanguage);
                          setManualCustomerType(null);
                        }}
                        className="w-full rounded-xl border border-[#243049] bg-[#080D18] px-3 py-2 text-xs text-white focus:border-[#3DDC97] focus:outline-none"
                      >
                        <option value="vi">Tiếng Việt (VI)</option>
                        <option value="en">English (EN)</option>
                        <option value="fr">Français (FR)</option>
                        <option value="ja">日本語 (JA)</option>
                      </select>
                    </div>
                  </div>

                  {/* Destination Selector */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">
                      Điểm đến
                    </label>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full rounded-xl border border-[#243049] bg-[#080D18] px-3.5 py-2.5 text-xs text-white focus:border-[#3DDC97] focus:outline-none"
                    >
                      {vietnamDestinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.provinceOrMunicipality} • {d.region})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Weather Advisory Card */}
                  <div className="bg-[#101A2C] border border-[#243049] p-3 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[#48E3EF]">
                      <span className="font-semibold flex items-center gap-1.5">
                        <CloudSun className="h-3.5 w-3.5" /> Thời tiết: {destinationWeather.seasonName}
                      </span>
                      <span className="font-mono text-[10px] bg-[#48E3EF]/10 px-2 py-0.5 rounded-full border border-[#48E3EF]/20">
                        {destinationWeather.temperatureRange}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#9BA9C3] leading-relaxed">
                      {destinationWeather.advisory}
                    </p>
                  </div>

                  {/* Travel Companions */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">
                      Bạn đồng hành
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['Solo', 'Couple', 'Family', 'Friends'] as TravelCompanions[]).map((comp) => (
                        <button
                          key={comp}
                          type="button"
                          onClick={() => setTravelCompanions(comp)}
                          className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                            travelCompanions === comp
                              ? 'bg-[#48E3EF] text-[#080D18] font-semibold'
                              : 'bg-[#080D18] text-[#9BA9C3] border border-[#243049]'
                          }`}
                        >
                          {companionLabels[comp]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Travel Persona */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-white">
                        Phong cách du khách
                      </label>
                      <span className="text-[10px] font-mono text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded-full border border-[#3DDC97]/20">
                        {selectedPersona}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {([
                        { id: 'FAMILY' as TravelPersona, label: 'Gia đình' },
                        { id: 'BACKPACKER' as TravelPersona, label: 'Phượt thủ' },
                        { id: 'SOLO' as TravelPersona, label: 'Độc hành' },
                        { id: 'EXPLORER' as TravelPersona, label: 'Khám phá' },
                      ]).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPersona(p.id);
                            triggerToast(`Phong cách du khách: ${p.label}`, 'info');
                          }}
                          className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                            selectedPersona === p.id
                              ? 'bg-[#3DDC97] text-[#080D18] font-semibold shadow-sm'
                              : 'bg-[#080D18] text-[#9BA9C3] border border-[#243049] hover:text-white'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Starting Location */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">
                      Điểm xuất phát
                    </label>
                    <select
                      value={startingLocation}
                      onChange={(e) => setStartingLocation(e.target.value)}
                      className="w-full rounded-xl border border-[#243049] bg-[#080D18] px-3.5 py-2.5 text-xs text-white focus:border-[#3DDC97] focus:outline-none"
                    >
                      <option value="Hà Nội, Vietnam">Hà Nội (Sân bay Nội Bài / Ga Hà Nội)</option>
                      <option value="TP. Hồ Chí Minh, Vietnam">TP. Hồ Chí Minh (Sân bay Tân Sơn Nhất / Ga Sài Gòn)</option>
                      <option value="Đà Nẵng, Vietnam">Đà Nẵng (Sân bay Đà Nẵng / Duyên hải miền Trung)</option>
                      <option value="Cần Thơ, Vietnam">Cần Thơ (Đồng bằng sông Cửu Long)</option>
                      <option value="Overseas / International Arrival">Chuyến bay quốc tế / Đến từ nước ngoài</option>
                    </select>
                  </div>

                  {/* Duration Slider */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-white mb-1.5">
                      <span>Thời gian chuyến đi:</span>
                      <span className="font-mono text-[#3DDC97]">{durationDays} ngày</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={14}
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full accent-[#3DDC97] bg-[#18253E] h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#9BA9C3] mt-1">
                      <span>1 ngày</span>
                      <span>7 ngày</span>
                      <span>14 ngày</span>
                    </div>
                  </div>

                  {/* Budget Tier */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">
                      Mức ngân sách
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Budget Backpacker', 'Comfort Explorer', 'Luxury Heritage'] as BudgetRange[]).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setBudgetRange(tier)}
                          className={`rounded-xl px-2 py-2 text-[11px] font-medium transition-all ${
                            budgetRange === tier
                              ? 'bg-[#3DDC97]/20 text-[#3DDC97] border border-[#3DDC97]/50 font-semibold'
                              : 'bg-[#080D18] text-[#9BA9C3] border border-[#243049] hover:text-white'
                          }`}
                        >
                          {budgetLabels[tier]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Travel Pace */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">
                      Nhịp độ di chuyển
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Unhurried', 'Deliberate', 'Expedition'] as TravelPace[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTravelPace(p)}
                          className={`rounded-xl px-2 py-2 text-[11px] font-medium transition-all ${
                            travelPace === p
                              ? 'bg-[#48E3EF]/20 text-[#48E3EF] border border-[#48E3EF]/50 font-semibold'
                              : 'bg-[#080D18] text-[#9BA9C3] border border-[#243049] hover:text-white'
                          }`}
                        >
                          {paceLabels[p]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transportation Preference */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">
                      Phương tiện ưu tiên
                    </label>
                    <select
                      value={transportPreference}
                      onChange={(e) => setTransportPreference(e.target.value as any)}
                      className="w-full rounded-xl border border-[#243049] bg-[#080D18] px-3.5 py-2.5 text-xs text-white focus:border-[#3DDC97] focus:outline-none"
                    >
                      <option value="Reunification Express Train">Tàu hỏa Thống Nhất (Ngắm cảnh & Trải nghiệm)</option>
                      <option value="Scenic Limousine Sleeper Bus">Xe Limousine giường nằm VIP</option>
                      <option value="Private Car & Driver">Xe riêng & Tài xế</option>
                      <option value="Motorbike Loop">Xe máy / Cung đường phượt</option>
                      <option value="Domestic Flights">Chuyến bay nội địa (Nhanh chóng)</option>
                    </select>
                  </div>

                  {/* Generate Button */}
                  <Button
                    size="lg"
                    disabled={isGenerating}
                    onClick={handleGenerateWorkflow}
                    className="w-full mt-4 bg-gradient-to-r from-[#10B981] to-[#3DDC97] text-[#080D18] hover:opacity-95 font-semibold text-xs shadow-lg shadow-[#3DDC97]/25"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        <span>Đang tổng hợp lịch trình...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        <span>Tạo Lịch Trình Chi Tiết</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 8-Stage Workflow Progress Card */}
              {workflowState && (
                <div className="rounded-3xl border border-[#243049] bg-[#0E1626]/80 p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">
                      Các Giai Đoạn Phân Tích Của AI
                    </span>
                    <Badge variant="outline" className="text-[10px] text-[#3DDC97] border-[#3DDC97]/30">
                      {workflowState.isComplete ? 'Hoàn thành' : 'Đang xử lý...'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {workflowState.stages.map((st, i) => (
                      <div
                        key={st.id}
                        className={`flex items-start gap-2.5 text-xs p-2 rounded-xl transition-all ${
                          st.status === 'completed'
                            ? 'bg-[#18253E]/60 text-[#F4F7FF]'
                            : st.status === 'running'
                            ? 'bg-[#3DDC97]/10 text-[#3DDC97] border border-[#3DDC97]/30'
                            : 'text-[#9BA9C3]'
                        }`}
                      >
                        <div className="mt-0.5">
                          {st.status === 'completed' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#3DDC97]" />
                          ) : st.status === 'running' ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#3DDC97]" />
                          ) : (
                            <span className="h-3.5 w-3.5 flex items-center justify-center text-[10px] text-[#4A5D7E]">
                              {i + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium block leading-tight">{st.name}</span>
                          {st.outputSummary && (
                            <span className="text-[11px] text-[#9BA9C3] leading-snug block mt-0.5">
                              {st.outputSummary}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Display Panel: Generated Itinerary Blueprint */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {generatedDraft ? (
                <div className="space-y-6">
                  {/* Blueprint Hero Bar */}
                  <div className="rounded-3xl border border-[#243049] bg-gradient-to-r from-[#0E1626] to-[#0A101D] p-6 shadow-xl backdrop-blur-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="outline" className="text-xs text-[#3DDC97] border-[#3DDC97]/40">
                            {generatedDraft.destinationName} • {generatedDraft.durationDays} ngày
                          </Badge>
                          <span className="text-xs text-[#9BA9C3]">
                            Nhịp độ: {paceLabels[generatedDraft.travelPace] || generatedDraft.travelPace} • Ngân sách: {budgetLabels[generatedDraft.budgetRange] || generatedDraft.budgetRange}
                          </span>
                        </div>
                        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-white">
                          {generatedDraft.title}
                        </h2>
                        <p className="text-xs text-[#9BA9C3] mt-1">
                          Khởi hành từ: <strong className="text-white">{generatedDraft.startingLocation}</strong> bằng{' '}
                          <strong className="text-white">{generatedDraft.transportPreference}</strong>
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#3DDC97]/15 text-[#3DDC97] border border-[#3DDC97]/30">
                            <Users className="h-3 w-3" /> Nhóm khách: {customerType}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#48E3EF]/15 text-[#48E3EF] border border-[#48E3EF]/30">
                            <CloudSun className="h-3 w-3" /> Thời tiết: {destinationWeather.seasonName}
                          </span>
                        </div>
                      </div>

                      {/* Save to Trips Button */}
                      <Button
                        size="sm"
                        disabled={isSavedToTrips}
                        onClick={handleSaveToTrips}
                        className={`font-semibold text-xs px-4 py-2 ${
                          isSavedToTrips
                            ? 'bg-[#3DDC97]/20 text-[#3DDC97] border border-[#3DDC97]/40'
                            : 'bg-gradient-to-r from-[#10B981] to-[#3DDC97] text-[#080D18] hover:opacity-95'
                        }`}
                      >
                        {isSavedToTrips ? (
                          <>
                            <Check className="h-4 w-4 mr-1.5" />
                            <span>Đã lưu vào Hành trình</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="h-4 w-4 mr-1.5" />
                            <span>Lưu vào Hành trình</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Estimated Budget Summary Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#243049]/60">
                      <div className="rounded-xl border border-white/5 bg-[#080D18] p-3">
                        <span className="text-[10px] uppercase font-mono text-[#9BA9C3] block mb-1">
                          Tổng dự toán (VND)
                        </span>
                        <span className="text-base font-mono font-bold text-[#3DDC97]">
                          {generatedDraft.budgetBreakdown.totalEstimateVND.toLocaleString()} ₫
                        </span>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-[#080D18] p-3">
                        <span className="text-[10px] uppercase font-mono text-[#9BA9C3] block mb-1">
                          Quy đổi USD (ước tính)
                        </span>
                        <span className="text-base font-mono font-bold text-white">
                          ${generatedDraft.budgetBreakdown.totalEstimateUSD} USD
                        </span>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-[#080D18] p-3">
                        <span className="text-[10px] uppercase font-mono text-[#9BA9C3] block mb-1">
                          Chi phí lưu trú
                        </span>
                        <span className="text-xs font-mono text-[#C4D0E5]">
                          {generatedDraft.budgetBreakdown.accommodationTotalVND.toLocaleString()} ₫
                        </span>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-[#080D18] p-3">
                        <span className="text-[10px] uppercase font-mono text-[#9BA9C3] block mb-1">
                          Ẩm thực & Ăn uống
                        </span>
                        <span className="text-xs font-mono text-[#C4D0E5]">
                          {generatedDraft.budgetBreakdown.diningTotalVND.toLocaleString()} ₫
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Day-by-Day Activities */}
                  <div className="space-y-4">
                    {generatedDraft.days.map((day, dayIdx) => (
                      <div
                        key={day.dayNumber}
                        className="rounded-3xl border border-[#243049] bg-[#0E1626]/80 p-6 backdrop-blur-xl shadow-lg"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#243049]/60 pb-3 mb-4">
                          <div>
                            <span className="text-xs font-mono uppercase tracking-wider text-[#3DDC97]">
                              Ngày {day.dayNumber}
                            </span>
                            <h3 className="text-lg font-bold text-white mt-0.5">{day.theme}</h3>
                            <p className="text-xs text-[#9BA9C3] mt-0.5">{day.interestExplanation}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setEditingDayIndex(editingDayIndex === dayIdx ? null : dayIdx)}
                            className="inline-flex items-center gap-1 text-xs text-[#48E3EF] hover:underline"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Thêm điểm dừng</span>
                          </button>
                        </div>

                        {/* Activities List */}
                        <div className="space-y-3">
                          {day.activities.map((act, actIdx) => (
                            <React.Fragment key={act.id}>
                              <div className="group relative flex flex-col sm:flex-row items-start justify-between gap-3 rounded-2xl border border-[#243049] bg-[#080D18] p-4 hover:border-[#3DDC97]/40 transition-colors">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] ${
                                        act.timeOfDay === 'Morning'
                                          ? 'text-[#F59E0B] border-[#F59E0B]/30'
                                          : act.timeOfDay === 'Afternoon'
                                          ? 'text-[#3DDC97] border-[#3DDC97]/30'
                                          : 'text-[#9875FF] border-[#9875FF]/30'
                                      }`}
                                    >
                                      {timeOfDayLabels[act.timeOfDay] || act.timeOfDay}
                                    </Badge>
                                    <span className="text-[11px] text-[#9BA9C3]">• {act.estimatedDuration}</span>
                                    {act.costEstimateVND !== undefined && (
                                      <span className="text-[11px] font-mono text-[#3DDC97]">
                                        • ~{act.costEstimateVND.toLocaleString()} ₫
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-semibold text-white">{act.title}</h4>
                                  <p className="text-xs text-[#C4D0E5] mt-1 leading-relaxed">{act.description}</p>
                                  <span className="text-[10px] text-[#9BA9C3]/80 italic block mt-1">
                                    {act.unverifiedEstimateNotice}
                                  </span>
                                </div>

                                {/* Stop Action Controls: Move Up, Move Down, Remove */}
                                <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                                  <button
                                    type="button"
                                    disabled={actIdx === 0}
                                    onClick={() => handleMoveActivityUp(dayIdx, actIdx)}
                                    aria-label="Chuyển điểm dừng lên trước"
                                    title="Chuyển điểm dừng lên trước"
                                    className="disabled:opacity-20 opacity-60 hover:opacity-100 hover:text-[#3DDC97] p-1 text-[#9BA9C3] transition-all rounded hover:bg-white/5"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={actIdx === day.activities.length - 1}
                                    onClick={() => handleMoveActivityDown(dayIdx, actIdx)}
                                    aria-label="Chuyển điểm dừng xuống sau"
                                    title="Chuyển điểm dừng xuống sau"
                                    className="disabled:opacity-20 opacity-60 hover:opacity-100 hover:text-[#3DDC97] p-1 text-[#9BA9C3] transition-all rounded hover:bg-white/5"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveActivity(dayIdx, act.id)}
                                    aria-label="Xóa điểm dừng"
                                    title="Xóa điểm dừng"
                                    className="opacity-60 hover:opacity-100 hover:text-red-400 p-1 text-[#9BA9C3] transition-all rounded hover:bg-white/5"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Inter-Stop Transit Notice & Missing Telemetry Flag */}
                              {actIdx < day.activities.length - 1 && (
                                <div className="flex items-center gap-2 pl-4 py-1 text-[11px] text-[#9BA9C3]/75 font-mono">
                                  <span className="h-3 border-l-2 border-dashed border-[#243049]" />
                                  <span>Thời gian di chuyển: ~20-40 phút • ⚠️ Ước tính kết nối tuyến đường (chưa có dữ liệu GPS thời gian thực)</span>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>


                        {/* Add Stop Inline Input Form */}
                        {editingDayIndex === dayIdx && (
                          <div className="mt-4 rounded-xl border border-[#3DDC97]/40 bg-[#0A101D] p-4 animate-modal-in">
                            <h4 className="text-xs font-semibold text-white mb-2">Thêm điểm dừng tùy chọn vào Ngày {day.dayNumber}</h4>
                            <input
                              type="text"
                              value={newStopTitle}
                              onChange={(e) => setNewStopTitle(e.target.value)}
                              placeholder="Tên điểm dừng (Ví dụ: 14:00 — Chùa Trấn Quốc & Ngắm hoàng hôn Hồ Tây)"
                              className="w-full rounded-lg border border-[#243049] bg-[#080D18] px-3 py-2 text-xs text-white placeholder-[#4A5D7E] mb-2 focus:border-[#3DDC97] focus:outline-none"
                            />
                            <textarea
                              value={newStopDesc}
                              onChange={(e) => setNewStopDesc(e.target.value)}
                              placeholder="Mô tả chi tiết hoặc lưu ý cho điểm dừng này..."
                              rows={2}
                              className="w-full rounded-lg border border-[#243049] bg-[#080D18] px-3 py-2 text-xs text-white placeholder-[#4A5D7E] mb-3 focus:border-[#3DDC97] focus:outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingDayIndex(null)}
                                className="text-xs text-[#9BA9C3]"
                              >
                                Hủy
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAddActivity(dayIdx)}
                                className="bg-[#3DDC97] text-[#080D18] text-xs font-semibold"
                              >
                                Lưu điểm dừng
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Feasibility Warning Banner if Manual Review is Advised */}
                  {generatedDraft.feasibilityStatus === 'Requires Manual Review (Regional Distance Alert)' && (
                    <div className="rounded-2xl border border-[#F59E0B]/50 bg-[#F59E0B]/10 p-4 text-xs text-[#F59E0B] flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-[#F59E0B]" />
                      <div>
                        <strong className="block font-semibold">Cảnh báo tính khả thi lộ trình: Khuyến nghị kiểm tra thực địa</strong>
                        <p className="mt-0.5 text-[#FCD34D] leading-relaxed">{generatedDraft.feasibilityWarning}</p>
                      </div>
                    </div>
                  )}

                  {/* Disclaimers & Estimation Notice */}
                  <div className="rounded-2xl border border-[#243049] bg-[#080D18] p-4 text-xs text-[#9BA9C3] leading-relaxed space-y-1">
                    <p>• {generatedDraft.disclaimers.bookingNotice}</p>
                    <p>• {generatedDraft.disclaimers.estimationNotice}</p>
                    <p>• {generatedDraft.disclaimers.routingNotice}</p>
                    <p>• {generatedDraft.disclaimers.engineNotice}</p>
                  </div>
                </div>
              ) : (
                /* Initial Empty / Welcoming State */
                <div className="flex flex-col items-center justify-center rounded-3xl border border-[#243049] bg-[#0E1626]/60 p-12 text-center min-h-[460px]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3DDC97]/15 border border-[#3DDC97]/30 text-[#3DDC97] mb-4">
                    <Compass className="h-8 w-8" />
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-white mb-2">
                    Thiết Kế Lịch Trình Khám Phá Việt Nam Của Riêng Bạn
                  </h3>
                  <p className="text-xs sm:text-sm text-[#9BA9C3] max-w-md mb-6 leading-relaxed font-light">
                    Chọn điểm đến, nơi xuất phát, số ngày và nhịp độ mong muốn ở khung bên trái. Nhấn "Tạo Lịch Trình Chi Tiết" để hệ thống AI tổng hợp lịch trình đầy đủ.
                  </p>
                  <Button
                    size="md"
                    onClick={handleGenerateWorkflow}
                    className="bg-[#3DDC97] text-[#080D18] hover:bg-[#32B87D] font-semibold text-xs px-6"
                  >
                    Tạo Lịch Trình Mẫu Ngay
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* AI TRAVEL ASSISTANT (CONVERSATIONAL CHAT)                     */
          /* ============================================================ */
          <div className="mx-auto max-w-4xl flex flex-col rounded-3xl border border-[#243049] bg-gradient-to-b from-[#0E1626]/90 to-[#0A101D] overflow-hidden shadow-2xl backdrop-blur-xl min-h-[600px]">
            {/* Assistant Header */}
            <div className="border-b border-[#243049]/70 bg-[#0E1626] p-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#48E3EF]/15 border border-[#48E3EF]/30 text-[#48E3EF]">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      Trợ Lý Du Lịch Thông Minh Travi
                    </h3>
                    <AiStatusIndicator />
                  </div>
                  <p className="text-[11px] text-[#9BA9C3]">
                    Trợ lý du lịch thích ứng • Tự động cá nhân hóa theo nhóm khách và đối soát dữ liệu thực địa
                  </p>
                </div>
              </div>


              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: createMsgId('ai-reset'),
                      sender: 'copilot',
                      timestamp: 'Vừa xong',
                      content: 'Đã làm mới cuộc hội thoại. Bạn cần Travi hỗ trợ thông tin gì cho chuyến đi tiếp theo?',
                      suggestions: [
                        'Quy tắc văn hóa và trang phục cần biết khi viếng thăm đền chùa?',
                        'Những quán ăn đường phố truyền thống ngon nhất tại Hà Nội?',
                        'Kinh nghiệm đặt vé tàu hỏa ngắm cảnh qua đèo Hải Vân?',
                      ],
                    },
                  ])
                }
                className="text-xs text-[#9BA9C3] hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Làm mới hội thoại</span>
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'copilot' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#48E3EF]/15 border border-[#48E3EF]/30 text-[#48E3EF]">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-3`}>
                    <div
                      className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#18253E] text-white border border-white/10 rounded-tr-none'
                          : 'bg-[#080D18] text-[#E2E8F0] border border-[#243049] rounded-tl-none'
                      }`}
                    >
                      <div className="prose prose-invert prose-xs max-w-none space-y-2 whitespace-pre-wrap">
                        {msg.content}
                      </div>

                      {msg.itineraryTeaser && (
                        <div className="mt-3 rounded-xl border border-[#3DDC97]/40 bg-[#0E1B27] p-3 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-[#3DDC97]">Lộ trình gợi ý</span>
                            <h4 className="text-xs font-bold text-white">{msg.itineraryTeaser.destination}</h4>
                            <p className="text-[11px] text-[#9BA9C3]">{msg.itineraryTeaser.highlights.join(' • ')}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setActiveTab('concierge');
                              setDestination(msg.itineraryTeaser!.destination.toLowerCase());
                            }}
                            className="bg-[#3DDC97] text-[#080D18] text-xs font-semibold shrink-0"
                          >
                            Mở trong Lập kế hoạch
                          </Button>
                        </div>
                      )}

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
                          <span className="text-[10px] font-mono text-[#48E3EF] block uppercase tracking-wider">
                            Nguồn đối soát thực địa (RAG Grounding):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#48E3EF]/10 border border-[#48E3EF]/20 text-[10px] text-[#48E3EF]"
                              >
                                <span className="font-medium">{src.name}</span>
                                {src.province && <span className="text-[#9BA9C3]">({src.province})</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.provenance && (
                        <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#9BA9C3]">
                          <span className="flex items-center gap-1 font-mono text-[#3DDC97]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#3DDC97]" />
                            {msg.provenance.modeDescription}
                          </span>
                          <span className="font-mono text-[#4A5D7E]">{msg.provenance.providerName}</span>
                        </div>
                      )}
                    </div>


                    {/* Follow-up suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendChatMessage(sug)}
                            className="rounded-full border border-[#243049] bg-[#0E1626] px-3 py-1 text-[11px] text-[#C4D0E5] hover:border-[#3DDC97]/50 hover:text-white transition-all text-left"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#18253E] border border-white/10 text-white">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isAiResponding && (
                <div className="flex gap-3 items-center text-xs text-[#9BA9C3]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#48E3EF]/15 border border-[#48E3EF]/30 text-[#48E3EF]">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </div>
                  <span>Đang tra cứu cơ sở tri thức du lịch Việt Nam...</span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="border-t border-[#243049]/70 bg-[#0E1626] p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Hỏi bất kỳ điều gì về du lịch Việt Nam (ẩm thực, vé tàu xe, thời tiết Sa Pa, văn hóa bản địa)..."
                  className="flex-1 rounded-xl border border-[#243049] bg-[#080D18] px-4 py-3 text-xs sm:text-sm text-white placeholder-[#4A5D7E] focus:border-[#3DDC97] focus:outline-none"
                />
                <Button
                  type="submit"
                  disabled={!chatInput.trim() || isAiResponding}
                  className="bg-[#3DDC97] text-[#080D18] hover:bg-[#32B87D] font-semibold px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CopilotPage;
