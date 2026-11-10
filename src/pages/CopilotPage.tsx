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
import type { CustomerType, PreferredLanguage, TravelCompanions } from '../types/adaptiveTravel.ts';


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
      timestamp: 'Just now',
      content:
        'Xin chào! I am your **Travi Vietnam Travel Assistant**. Ask me about hidden destinations, regional street food secrets, cultural etiquette, or train logistics across Vietnam.',
      suggestions: [
        'What are the key cultural etiquette rules for temples?',
        'What are the best street food stalls in Hanoi?',
        'How to book trains over the Hai Van Pass?',
        'Plan a 5-day trip to Ha Giang and the North',
      ],
      provenance: {
        providerName: 'Travi Vietnam Expert Knowledge Engine',
        isLiveAi: false,
        modeDescription: 'Deterministic Expert Knowledge Base (Active & Verified)',
      },
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);

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
        triggerToast('Day-by-day Vietnam itinerary synthesized successfully', 'success');
      }
    } catch {
      triggerToast('Itinerary generation encountered an error. Please try again.', 'error');
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
    triggerToast(`Saved "${trip.title}" to My Journeys!`, 'success');
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
    triggerToast('Reordered stop up', 'info');
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
    triggerToast('Reordered stop down', 'info');
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
    triggerToast('Removed stop from itinerary', 'info');
  };

  const handleAddActivity = (dayIndex: number) => {
    if (!generatedDraft || !newStopTitle.trim()) return;
    const updatedDays = JSON.parse(JSON.stringify(generatedDraft.days));
    const stopId = `custom-stop-${dayIndex}-${updatedDays[dayIndex].activities.length + 1}`;
    updatedDays[dayIndex].activities.push({
      id: stopId,
      timeOfDay: 'Afternoon',
      title: newStopTitle.trim(),
      description: newStopDesc.trim() || 'Custom planned excursion stop.',
      culturalPillar: 'Personal Exploration',
      estimatedDuration: '2 Hours',
      unverifiedEstimateNotice: 'Custom traveler stop. Verify hours and access locally.',
    });
    setGeneratedDraft({
      ...generatedDraft,
      days: updatedDays,
      isEdited: true,
    });
    setNewStopTitle('');
    setNewStopDesc('');
    setEditingDayIndex(null);
    triggerToast('Added custom stop', 'success');
  };


  // Conversational Chat Submit
  const handleSendChatMessage = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query || isAiResponding) return;

    const userMsg: CopilotMessage = {
      id: createMsgId('user'),
      sender: 'user',
      timestamp: 'Just now',
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
        },
      });

      const aiMsg: CopilotMessage = {
        id: createMsgId('ai'),
        sender: 'copilot',
        timestamp: 'Just now',
        content: response.content,
        suggestions: response.suggestions,
        itineraryTeaser: response.itineraryTeaser,
        sources: response.sources,
        provenance: response.provenance,
      };


      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      triggerToast('Assistant response error. Please try again.', 'error');
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
                  Vietnam Travel Intelligence
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-white">
                Smart Trip Planner & AI Assistant
              </h1>
              <p className="text-xs sm:text-sm text-[#9BA9C3] mt-1 max-w-2xl font-light leading-relaxed">
                Build day-by-day Vietnam itineraries with realistic pacing and budget breakdowns, or consult our specialized Vietnam travel assistant.
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
                  <span>Smart Trip Planner</span>
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
                  <span>AI Travel Assistant</span>
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
                      Destination
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
                      Bạn đồng hành (Companions)
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
                          {comp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Starting Location */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">
                      Starting Origin
                    </label>
                    <select
                      value={startingLocation}
                      onChange={(e) => setStartingLocation(e.target.value)}
                      className="w-full rounded-xl border border-[#243049] bg-[#080D18] px-3.5 py-2.5 text-xs text-white focus:border-[#3DDC97] focus:outline-none"
                    >
                      <option value="Hà Nội, Vietnam">Hà Nội (Noi Bai Airport / Station)</option>
                      <option value="TP. Hồ Chí Minh, Vietnam">TP. Hồ Chí Minh (Tan Son Nhat)</option>
                      <option value="Đà Nẵng, Vietnam">Đà Nẵng (Central Coast)</option>
                      <option value="Cần Thơ, Vietnam">Cần Thơ (Mekong Delta)</option>
                      <option value="Overseas / International Arrival">Overseas / Direct Flight Arrival</option>
                    </select>
                  </div>

                  {/* Duration Slider */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-white mb-1.5">
                      <span>Trip Duration:</span>
                      <span className="font-mono text-[#3DDC97]">{durationDays} Days</span>
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
                      <span>1 Day</span>
                      <span>7 Days</span>
                      <span>14 Days</span>
                    </div>
                  </div>

                  {/* Budget Tier */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">
                      Budget Tier
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
                          {tier.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Travel Pace */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">
                      Travel Pacing
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
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transportation Preference */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">
                      Preferred Transportation
                    </label>
                    <select
                      value={transportPreference}
                      onChange={(e) => setTransportPreference(e.target.value as any)}
                      className="w-full rounded-xl border border-[#243049] bg-[#080D18] px-3.5 py-2.5 text-xs text-white focus:border-[#3DDC97] focus:outline-none"
                    >
                      <option value="Reunification Express Train">Reunification Express Train (Scenic & Slow)</option>
                      <option value="Scenic Limousine Sleeper Bus">VIP Limousine Cabin Sleeper Bus</option>
                      <option value="Private Car & Driver">Private Car & Driver</option>
                      <option value="Motorbike Loop">Motorbike / Easy Rider Road Loop</option>
                      <option value="Domestic Flights">Domestic Flights (Point-to-Point)</option>
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
                        <span>Synthesizing Vietnam Itinerary...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        <span>Build Day-by-Day Itinerary</span>
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
                      Agent Synthesis Stages
                    </span>
                    <Badge variant="outline" className="text-[10px] text-[#3DDC97] border-[#3DDC97]/30">
                      {workflowState.isComplete ? 'Complete' : 'Processing...'}
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
                            {generatedDraft.destinationName} • {generatedDraft.durationDays} Days
                          </Badge>
                          <span className="text-xs text-[#9BA9C3]">
                            Pace: {generatedDraft.travelPace} • Budget: {generatedDraft.budgetRange}
                          </span>
                        </div>
                        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-white">
                          {generatedDraft.title}
                        </h2>
                        <p className="text-xs text-[#9BA9C3] mt-1">
                          Starting from: <strong className="text-white">{generatedDraft.startingLocation}</strong> via{' '}
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
                            <span>Saved in My Journeys</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="h-4 w-4 mr-1.5" />
                            <span>Save to My Journeys</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Estimated Budget Summary Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#243049]/60">
                      <div className="rounded-xl border border-white/5 bg-[#080D18] p-3">
                        <span className="text-[10px] uppercase font-mono text-[#9BA9C3] block mb-1">
                          Grand Total (VND)
                        </span>
                        <span className="text-base font-mono font-bold text-[#3DDC97]">
                          {generatedDraft.budgetBreakdown.totalEstimateVND.toLocaleString()} ₫
                        </span>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-[#080D18] p-3">
                        <span className="text-[10px] uppercase font-mono text-[#9BA9C3] block mb-1">
                          USD Approx.
                        </span>
                        <span className="text-base font-mono font-bold text-white">
                          ${generatedDraft.budgetBreakdown.totalEstimateUSD} USD
                        </span>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-[#080D18] p-3">
                        <span className="text-[10px] uppercase font-mono text-[#9BA9C3] block mb-1">
                          Accommodation Total
                        </span>
                        <span className="text-xs font-mono text-[#C4D0E5]">
                          {generatedDraft.budgetBreakdown.accommodationTotalVND.toLocaleString()} ₫
                        </span>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-[#080D18] p-3">
                        <span className="text-[10px] uppercase font-mono text-[#9BA9C3] block mb-1">
                          Dining & Street Food
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
                              Day {day.dayNumber}
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
                            <span>Add Stop</span>
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
                                      {act.timeOfDay}
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
                                    aria-label="Move stop earlier"
                                    title="Move stop earlier"
                                    className="disabled:opacity-20 opacity-60 hover:opacity-100 hover:text-[#3DDC97] p-1 text-[#9BA9C3] transition-all rounded hover:bg-white/5"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={actIdx === day.activities.length - 1}
                                    onClick={() => handleMoveActivityDown(dayIdx, actIdx)}
                                    aria-label="Move stop later"
                                    title="Move stop later"
                                    className="disabled:opacity-20 opacity-60 hover:opacity-100 hover:text-[#3DDC97] p-1 text-[#9BA9C3] transition-all rounded hover:bg-white/5"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveActivity(dayIdx, act.id)}
                                    aria-label="Remove stop"
                                    title="Remove stop"
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
                                  <span>Transit Leg: ~20-40m • ⚠️ Missing live road GPS telemetry (Estimated direct connection)</span>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>


                        {/* Add Stop Inline Input Form */}
                        {editingDayIndex === dayIdx && (
                          <div className="mt-4 rounded-xl border border-[#3DDC97]/40 bg-[#0A101D] p-4 animate-modal-in">
                            <h4 className="text-xs font-semibold text-white mb-2">Add Custom Stop to Day {day.dayNumber}</h4>
                            <input
                              type="text"
                              value={newStopTitle}
                              onChange={(e) => setNewStopTitle(e.target.value)}
                              placeholder="Stop title (e.g. 02:00 PM — Chùa Trấn Quốc & West Lake Sunset)"
                              className="w-full rounded-lg border border-[#243049] bg-[#080D18] px-3 py-2 text-xs text-white placeholder-[#4A5D7E] mb-2 focus:border-[#3DDC97] focus:outline-none"
                            />
                            <textarea
                              value={newStopDesc}
                              onChange={(e) => setNewStopDesc(e.target.value)}
                              placeholder="Description or notes about this stop..."
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
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAddActivity(dayIdx)}
                                className="bg-[#3DDC97] text-[#080D18] text-xs font-semibold"
                              >
                                Save Stop
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
                        <strong className="block font-semibold">Route Feasibility Warning: Manual Review Advised</strong>
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
                    Build Your Custom Vietnam Itinerary
                  </h3>
                  <p className="text-xs sm:text-sm text-[#9BA9C3] max-w-md mb-6 leading-relaxed font-light">
                    Select your destination, starting origin, duration, and pace on the left. Click "Build Day-by-Day Itinerary" to synthesize a complete schedule.
                  </p>
                  <Button
                    size="md"
                    onClick={handleGenerateWorkflow}
                    className="bg-[#3DDC97] text-[#080D18] hover:bg-[#32B87D] font-semibold text-xs px-6"
                  >
                    Generate Sample Itinerary
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
                      Travi Vietnam Travel Assistant
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
                      timestamp: 'Just now',
                      content: 'Conversation reset. How can I help you explore Vietnam?',
                      suggestions: [
                        'What are the key cultural etiquette rules for temples?',
                        'What are the best street food stalls in Hanoi?',
                        'How does the train system work in Vietnam?',
                      ],
                    },
                  ])
                }
                className="text-xs text-[#9BA9C3] hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Chat</span>
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
                            <span className="text-[10px] font-mono uppercase text-[#3DDC97]">Suggested Journey</span>
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
                            Open in Planner
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
                  <span>Consulting Vietnam Travel Knowledge Base...</span>
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
                  placeholder="Ask anything about Vietnam (e.g. food etiquette, train tickets, Sapa weather)..."
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
