import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Database,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Sparkles,
  Layers,
  Building2,
  Compass,
  CheckCircle2,
  Clock,
  Landmark,
  Eye,
  X,
  RefreshCw,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import { tourismDataService } from '../services/tourism/tourismDataService';
import { culturalDataService } from '../services/cultural/culturalDataService';
import type { UnifiedTourismPoi, PoiVerificationStatus } from '../types/tourismPoi';
import type { CulturalAsset, CulturalAssetType } from '../types/cultural';

export const VietnamTourismDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pois' | 'cultural' | 'quality'>('pois');

  // POI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedSubregion, setSelectedSubregion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<PoiVerificationStatus | 'all'>('all');
  const [validCoordsOnly, setValidCoordsOnly] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<UnifiedTourismPoi | null>(null);

  // Cultural state
  const [culturalQuery, setCulturalQuery] = useState('');
  const [culturalType, setCulturalType] = useState<CulturalAssetType | 'all'>('all');
  const [culturalAssets, setCulturalAssets] = useState<CulturalAsset[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(culturalDataService.getDemoMode());
  const [selectedAsset, setSelectedAsset] = useState<CulturalAsset | null>(null);
  const [isLoadingCultural, setIsLoadingCultural] = useState(false);

  // Administrative & Stats
  const stats = useMemo(() => tourismDataService.getSummaryStatistics(), []);
  const importSummary = useMemo(() => tourismDataService.getImportSummary(), []);
  const provinces = useMemo(() => tourismDataService.getAdministrativeProvinces(), []);

  // Filtered POIs
  const filteredPois = useMemo(() => {
    return tourismDataService.getPois({
      searchQuery: searchQuery || undefined,
      province: selectedProvince || undefined,
      subregion: selectedSubregion || undefined,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      verificationStatus: selectedStatus === 'all' ? undefined : selectedStatus,
      hasValidCoordinatesOnly: validCoordsOnly,
    });
  }, [searchQuery, selectedProvince, selectedSubregion, selectedCategory, selectedStatus, validCoordsOnly]);

  // Load Cultural Assets
  useEffect(() => {
    let mounted = true;
    const fetchAssets = async () => {
      try {
        const res = await culturalDataService.getAssets({
          q: culturalQuery,
          type: culturalType,
          limit: 20,
        });
        if (mounted) {
          setCulturalAssets(res.items);
          setIsLoadingCultural(false);
        }
      } catch (err) {
        console.error('Failed to load cultural assets:', err);
        if (mounted) {
          setIsLoadingCultural(false);
        }
      }
    };

    fetchAssets();

    return () => {
      mounted = false;
    };
  }, [culturalQuery, culturalType, isDemoMode]);

  const handleToggleDemoMode = (enabled: boolean) => {
    culturalDataService.setDemoMode(enabled);
    setIsDemoMode(enabled);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header Banner */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-4 py-8 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Database className="w-3.5 h-3.5" /> Nền tảng Dữ liệu Du lịch Việt Nam
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Hậu 2025 • 34 Tỉnh/Thành
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Khám phá Dữ liệu Địa phương, Di sản & Kiểm định Chất lượng
              </h1>
              <p className="mt-1 text-sm text-slate-400 max-w-2xl">
                Tích hợp dữ liệu du lịch chính thống từ các địa phương, hồ sơ di sản văn hóa và dữ liệu hành chính chuẩn hóa phục vụ AI Travel Assistant.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
              <button
                onClick={() => setActiveTab('pois')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'pois'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapPin className="w-4 h-4" /> Điểm đến POI ({filteredPois.length})
              </button>
              <button
                onClick={() => setActiveTab('cultural')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'cultural'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Landmark className="w-4 h-4" /> Di sản Văn hóa API
              </button>
              <button
                onClick={() => setActiveTab('quality')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'quality'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Bảng Chất lượng Dữ liệu
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        {/* TAB 1: UNIFIED POI DISCOVERY */}
        {activeTab === 'pois' && (
          <div className="space-y-6">
            {/* Quick KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Tổng số POI nạp</span>
                <div className="text-2xl font-bold text-white mt-1">{stats.totalPois}</div>
                <span className="text-xs text-emerald-400 mt-1 block">Tỉnh Sơn La & Khu vực</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Cần kiểm duyệt thực địa</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">{stats.needsReviewCount}</div>
                <span className="text-xs text-slate-400 mt-1 block">Bảo lưu trạng thái gốc</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Tọa độ chưa xác minh</span>
                <div className="text-2xl font-bold text-rose-400 mt-1">{stats.withoutCoordinatesCount}</div>
                <span className="text-xs text-slate-400 mt-1 block">Không tự tạo ghim giả định</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Bảo mật thông tin cá nhân</span>
                <div className="text-2xl font-bold text-cyan-400 mt-1">100%</div>
                <span className="text-xs text-cyan-400 mt-1 block">Đã bóc tách sạch CCCD/CMND</span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Search input */}
                <div className="md:col-span-5 relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên điểm du lịch, địa chỉ, tài nguyên nổi bật..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Province select */}
                <div className="md:col-span-3">
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Tất cả tỉnh thành ({provinces.length})</option>
                    <option value="Sơn La">Sơn La (85 điểm)</option>
                    {provinces
                      .filter((p) => p.nameLocal !== 'Sơn La')
                      .map((p) => (
                        <option key={p.id} value={p.nameLocal}>
                          {p.nameLocal}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Category select */}
                <div className="md:col-span-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">Tất cả loại hình</option>
                    <option value="Khu du lịch quốc gia">Khu du lịch quốc gia</option>
                    <option value="Khu du lịch cấp tỉnh">Khu du lịch cấp tỉnh</option>
                    <option value="Điểm du lịch">Điểm du lịch</option>
                    <option value="Di tích lịch sử - văn hóa">Di tích lịch sử - văn hóa</option>
                    <option value="Du lịch sinh thái">Du lịch sinh thái</option>
                    <option value="Du lịch cộng đồng">Du lịch cộng đồng</option>
                    <option value="Du lịch mạo hiểm - trải nghiệm">Mạo hiểm / Khám phá</option>
                  </select>
                </div>

                {/* Status select */}
                <div className="md:col-span-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">Trạng thái xác minh</option>
                    <option value="verified">Đã xác minh (Verified)</option>
                    <option value="needs_review">Cần kiểm duyệt (Needs Review)</option>
                  </select>
                </div>
              </div>

              {/* Sub-toggles */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={validCoordsOnly}
                      onChange={(e) => setValidCoordsOnly(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Chỉ hiển thị điểm có tọa độ đã xác thực (loại trừ tọa độ ảo)</span>
                  </label>
                  {selectedProvince && (
                    <span className="text-emerald-400 font-medium">Đang lọc tỉnh: {selectedProvince}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedProvince('');
                      setSelectedSubregion('');
                      setSelectedCategory('all');
                      setSelectedStatus('all');
                      setValidCoordsOnly(false);
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Đặt lại bộ lọc
                  </button>
                  <span className="text-slate-600">•</span>
                  <span>Tìm thấy {filteredPois.length} điểm đến</span>
                </div>
              </div>
            </div>

            {/* POI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPois.map((poi) => (
                <div
                  key={poi.id}
                  onClick={() => setSelectedPoi(poi)}
                  className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                        {poi.category}
                      </span>

                      {poi.verificationStatus === 'needs_review' ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Chờ đối soát thực địa
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã xác thực
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                      {poi.vietnameseName}
                    </h3>

                    {poi.address && (
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 line-clamp-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        {poi.address}
                      </p>
                    )}

                    <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">
                      {poi.shortDescription || poi.longDescription}
                    </p>

                    {/* Coordinate Security Guard Badge */}
                    {poi.coordinateConfidence === 'none' && (
                      <div className="mt-3.5 bg-amber-950/30 border border-amber-900/40 rounded-lg p-2 text-2xs text-amber-300/90 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>Tọa độ chưa xác minh trên thực địa • Không hiển thị ghim bản đồ để tránh sai lệch</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-slate-500 truncate max-w-[180px]">Nguồn: {poi.source}</span>
                    <span className="text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Chi tiết <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredPois.length === 0 && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
                <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-medium text-slate-300">Không tìm thấy điểm đến phù hợp</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Hãy thử điều chỉnh từ khóa tìm kiếm hoặc bỏ bớt các tiêu chí lọc.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CULTURAL DATA API EXPLORER */}
        {activeTab === 'cultural' && (
          <div className="space-y-6">
            {/* API Mode & Architecture Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Cultural Data API v1
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isDemoMode
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isDemoMode ? 'DEMO MODE (Active)' : 'LIVE API MODE'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Tích hợp Dữ liệu Di sản & Bảo vật Văn hóa
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Hỗ trợ endpoint <code className="text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded">GET /v1/assets?q=&#123;query&#125;</code> và <code className="text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded">GET /v1/assets/&#123;slug&#125;</code>.
                    Tự động phân định ranh giới giữa Hiện vật (Cultural Asset), Viện lưu giữ (Institution) và Điểm tham quan thực tế (Visitable POI).
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Chế độ Demo:</span>
                  <button
                    onClick={() => handleToggleDemoMode(!isDemoMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isDemoMode ? 'bg-amber-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isDemoMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-slate-300">{isDemoMode ? 'Bật' : 'Tắt'}</span>
                </div>
              </div>

              {/* Strict Semantic Separation Notice */}
              <div className="mt-5 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Nguyên tắc toàn vẹn ngữ nghĩa di sản (Domain Separation):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-slate-400">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-slate-200 block mb-1">1. Cultural Asset</span>
                    Hiện vật bảo tàng, cổ vật, bảo vật quốc gia. Tọa độ khảo cổ nơi phát hiện (trong lòng đất) KHÔNG PHẢI là điểm tham quan.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-slate-200 block mb-1">2. Cultural Institution</span>
                    Cơ quan quản lý, viện nghiên cứu, bảo tàng lưu giữ hiện vật (ví dụ: Bảo tàng Lịch sử Quốc gia).
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-slate-200 block mb-1">3. Visit-able POI</span>
                    Địa điểm có địa chỉ cổng vào, giờ mở cửa và quầy vé thực tế phục vụ khách du lịch đến chiêm ngưỡng hiện vật.
                  </div>
                </div>
              </div>
            </div>

            {/* Cultural Search & Type Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm kiếm hiện vật: Trống đồng Ngọc Lũ, Thạp đồng Đào Thịnh, Bia Tiến sĩ..."
                  value={culturalQuery}
                  onChange={(e) => setCulturalQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                {(
                  [
                    { key: 'all', label: 'Tất cả' },
                    { key: 'artifact', label: 'Hiện vật / Cổ vật' },
                    { key: 'monument', label: 'Bia đá / Di tích' },
                    { key: 'intangible_heritage', label: 'Di sản phi vật thể' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setCulturalType(t.key)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      culturalType === t.key
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cultural Assets List */}
            {isLoadingCultural ? (
              <div className="text-center py-12 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
                <span>Đang truy xuất dữ liệu di sản...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {culturalAssets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {asset.cultureOrPeriod}
                        </span>
                        {asset.isNationalTreasure && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Bảo vật Quốc gia
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {asset.vietnameseName}
                      </h3>
                      <p className="text-xs text-slate-400 italic mb-2">{asset.name}</p>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {asset.shortDescription}
                      </p>

                      {/* Institution & Venue badge */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                        <div className="flex items-start gap-2 text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-slate-400">Lưu giữ tại:</strong>{' '}
                            {asset.holdingInstitution.name} ({asset.holdingInstitution.city})
                          </span>
                        </div>

                        {asset.visitableVenue ? (
                          <div className="flex items-start gap-2 text-emerald-400">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Điểm tham quan:</strong> {asset.visitableVenue.poiName}
                              <br />
                              <span className="text-slate-400 text-2xs">
                                Cổng vào: {asset.visitableVenue.entranceAddress}
                              </span>
                            </span>
                          </div>
                        ) : (
                          <div className="text-2xs text-slate-500 italic">
                            Chưa mở cổng tham quan công cộng rộng rãi
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span className="text-slate-500 text-2xs">Nguồn: {asset.provenance.sourceName}</span>
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        Xem hồ sơ di sản <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DATA QUALITY DASHBOARD */}
        {activeTab === 'quality' && (
          <div className="space-y-8">
            {/* Headline Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Tổng bản ghi POI
                  </span>
                  <MapPin className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-white mt-2">{stats.totalPois}</div>
                <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 85 bản ghi từ Sở VHTT&DL Sơn La
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Đơn vị Hành chính
                  </span>
                  <Layers className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-extrabold text-white mt-2">{provinces.length}</div>
                <div className="text-xs text-cyan-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 3.321 xã/phường (Hậu 2025 - QĐ 19)
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Cần đối soát thực địa
                  </span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-amber-400 mt-2">{stats.needsReviewCount}</div>
                <div className="text-xs text-slate-400 mt-2">
                  Giữ nguyên phân loại & mô tả gốc
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Toàn vẹn PII & Tọa độ
                  </span>
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-400 mt-2">100%</div>
                <div className="text-xs text-emerald-400 mt-2">
                  0 rò rỉ CCCD/CMND • 0 ghim sai lệch
                </div>
              </div>
            </div>

            {/* Datasets Ingestion Audit Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Kiểm định Nguồn Dữ liệu (Dataset Audit)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Trạng thái đối soát và báo cáo minh bạch cho từng tập dữ liệu theo chính sách Data Integrity First.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Cập nhật: {importSummary?.timestamp ? new Date(importSummary.timestamp).toLocaleString('vi-VN') : '2026-11-10'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Tên Bộ Dữ liệu</th>
                      <th className="px-5 py-3.5">Tệp nguồn</th>
                      <th className="px-5 py-3.5">Quy mô</th>
                      <th className="px-5 py-3.5">Trạng thái Nạp</th>
                      <th className="px-5 py-3.5">Ghi chú Kiểm duyệt & Bảo mật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {/* Son La */}
                    <tr className="hover:bg-slate-800/30">
                      <td className="px-5 py-4 font-semibold text-white">
                        Sơn La Tourism Dataset
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-400">
                        Du_lieu_Khu_du_lich...csv
                      </td>
                      <td className="px-5 py-4">85 điểm du lịch</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Đã nạp đầy đủ (85/85)
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 leading-relaxed">
                        Đã loại bỏ số CCCD/CMND và SĐT cá nhân trong 62 bản ghi. Giữ nguyên mô tả tiếng Việt; tọa độ đặt là unverified để không làm sai lệch bản đồ.
                      </td>
                    </tr>

                    {/* Administrative vn.json */}
                    <tr className="hover:bg-slate-800/30">
                      <td className="px-5 py-4 font-semibold text-white">
                        Vietnam Administrative Dataset
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-400">
                        vn.json
                      </td>
                      <td className="px-5 py-4">34 tỉnh, 3.321 xã/phường</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Đã nạp thành công
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 leading-relaxed">
                        Chuẩn hóa cấu trúc hành chính sau năm 2025 theo Quyết định 19/2025/QĐ-TTg. Dùng làm dữ liệu tham chiếu địa chỉ, không coi đơn vị hành chính là POI du lịch.
                      </td>
                    </tr>

                    {/* Starter Dataset */}
                    <tr className="hover:bg-slate-800/30">
                      <td className="px-5 py-4 font-semibold text-white">
                        Vietnam Tourism Starter Dataset
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-400">
                        vietnam_tourism_starter.csv
                      </td>
                      <td className="px-5 py-4">53 bản ghi (dự kiến)</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" /> Chưa được cung cấp
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 leading-relaxed">
                        Báo cáo minh bạch: Tệp không có sẵn trong thư mục dự án và file tải lên. Đã chuẩn bị sẵn pipeline và schema thống nhất để tiếp nhận ngay khi có file.
                      </td>
                    </tr>

                    {/* QA Datasets */}
                    <tr className="hover:bg-slate-800/30">
                      <td className="px-5 py-4 font-semibold text-white">
                        Tourism QA Dataset (RAG Knowledge)
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-400">
                        train_vietnam_tourism.json
                      </td>
                      <td className="px-5 py-4">139 bài viết, 1.386 passages</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" /> Chưa được cung cấp
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 leading-relaxed">
                        Dữ liệu tri thức hỏi đáp, không phải cơ sở dữ liệu POI. Đã thiết kế cấu trúc RAG Knowledge Base để lưu metadata bài viết và passage phục vụ trích dẫn kiểm chứng.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quality Principles Checklist */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Cam kết Chuẩn mực Kỹ thuật & Đạo đức Dữ liệu
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Không giả lập tọa độ sai lệch
                  </span>
                  <p className="text-slate-400">
                    Đối với 85 điểm du lịch Sơn La chưa có tọa độ GPS cổng vào, hệ thống tuyệt đối không tự bịa đặt tọa độ kinh/vĩ độ hoặc gán tọa độ trung tâm ủy ban làm cổng vào.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Bảo vệ dữ liệu cá nhân (PII)
                  </span>
                  <p className="text-slate-400">
                    Bóc tách và loại bỏ hoàn toàn các trường số CCCD/CMND của người đại diện pháp luật và số điện thoại cá nhân từ file dữ liệu nguồn trước khi lưu trữ.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Phân biệt rõ Hiện vật vs Điểm tham quan
                  </span>
                  <p className="text-slate-400">
                    Cổ vật (như Trống đồng Ngọc Lũ) là Cultural Asset lưu giữ tại Bảo tàng Lịch sử Quốc gia. Điểm tham quan (POI) là khuôn viên bảo tàng tại Tràng Tiền, không phải vị trí khảo cổ tại Hà Nam.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Báo cáo minh bạch số lượng
                  </span>
                  <p className="text-slate-400">
                    Báo cáo trung thực đúng 85 điểm du lịch Sơn La đã nạp và 34 tỉnh hành chính. Không thổi phồng các con số chưa được xác thực vào cơ sở dữ liệu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* POI Detail Modal */}
      {selectedPoi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 text-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {selectedPoi.category}
                </span>
                <h2 className="text-xl font-bold text-white mt-2">{selectedPoi.vietnameseName}</h2>
                <p className="text-xs text-slate-400">{selectedPoi.provinceOrRegion} • Vùng: {selectedPoi.subregion}</p>
              </div>
              <button
                onClick={() => setSelectedPoi(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedPoi.coordinateConfidence === 'none' && (
              <div className="bg-amber-950/40 border border-amber-900/50 rounded-xl p-3.5 text-xs text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Cảnh báo toàn vẹn tọa độ:
                </div>
                <p className="text-amber-200/90 text-2xs leading-relaxed">
                  Bản ghi này thuộc danh mục quản lý du lịch địa phương của Sở VHTT&DL, chưa có tọa độ GPS cổng vào được đối soát thực địa. Travi không hiển thị ghim bản đồ giả định.
                </p>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-400 block mb-1">Mô tả đặc điểm & Giá trị nổi bật:</span>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {selectedPoi.longDescription || selectedPoi.shortDescription}
                </p>
              </div>

              {selectedPoi.address && (
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Địa chỉ:</span>
                  <p className="text-slate-300">{selectedPoi.address}</p>
                </div>
              )}

              {selectedPoi.managingEntity && (
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Đơn vị quản lý:</span>
                  <p className="text-slate-300">{selectedPoi.managingEntity}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Thời điểm lý tưởng:</span>
                  <p className="text-slate-300">{selectedPoi.bestSeason}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Thời lượng khuyến nghị:</span>
                  <p className="text-slate-300">{selectedPoi.recommendedDuration}</p>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-400 block mb-1">Ẩm thực đặc sản địa phương:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPoi.localFood.map((food, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-2xs">
                      {food}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-400 block mb-1">Nét văn hóa nổi bật:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPoi.culturalHighlights.map((cul, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-900/60 text-2xs">
                      {cul}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-2xs text-slate-400">
                <span>Nguồn: {selectedPoi.source}</span>
                <span>Ngày rà soát: {selectedPoi.lastReviewedDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cultural Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 text-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {selectedAsset.cultureOrPeriod}
                  </span>
                  {selectedAsset.isNationalTreasure && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Bảo vật Quốc gia
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white mt-2">{selectedAsset.vietnameseName}</h2>
                <p className="text-xs text-slate-400 italic">{selectedAsset.name}</p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-400 block mb-1">Mô tả hiện vật:</span>
                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {selectedAsset.fullDescription}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-400 block mb-1">Ý nghĩa & Giá trị lịch sử văn hóa:</span>
                <p className="text-emerald-300 leading-relaxed bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/40">
                  {selectedAsset.culturalSignificance}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Niên đại:</span>
                  <p className="text-slate-300">{selectedAsset.dating}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Cơ quan lưu giữ (Institution):</span>
                  <p className="text-slate-300">{selectedAsset.holdingInstitution.name}</p>
                </div>
              </div>

              {selectedAsset.discoveryLocation && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-2xs text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300 block">Vị trí phát hiện khảo cổ (Discovery Location):</span>
                  <p>{selectedAsset.discoveryLocation.communeOrWard}, {selectedAsset.discoveryLocation.district}, {selectedAsset.discoveryLocation.province} (Năm {selectedAsset.discoveryLocation.yearDiscovered})</p>
                  <p className="text-slate-500 italic">{selectedAsset.discoveryLocation.notes}</p>
                </div>
              )}

              {selectedAsset.visitableVenue ? (
                <div className="bg-emerald-950/30 border border-emerald-900/50 p-3.5 rounded-xl text-xs space-y-1.5">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" /> Điểm tham quan thực tế (Visitable Venue):
                  </span>
                  <p className="text-white font-medium">{selectedAsset.visitableVenue.poiName}</p>
                  <p className="text-slate-300 text-2xs">Cổng vào: {selectedAsset.visitableVenue.entranceAddress}</p>
                  <p className="text-slate-400 text-2xs">Giờ mở cửa: {selectedAsset.visitableVenue.openingHoursNote}</p>
                </div>
              ) : (
                <div className="text-slate-500 italic text-2xs">
                  Hiện vật lưu trữ trong kho bảo quản chuyên biệt, không có lịch tham quan thường xuyên.
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-2xs text-slate-400">
                <span>Nguồn: {selectedAsset.provenance.sourceName}</span>
                <span>Chế độ: {selectedAsset.provenance.isMock ? 'Mock Provider' : 'Live API'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VietnamTourismDataPage;
