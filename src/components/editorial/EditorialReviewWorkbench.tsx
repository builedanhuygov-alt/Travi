import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  MapPin,
  FileText,
  Search,
  ExternalLink,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../ui/Badge.tsx';
import { destinationRepository } from '../../services/destinations/destinationRepository.ts';
import type { DestinationDataStatus, CoordinateStatus } from '../../types/discoveryDestination.ts';
import type { NorthMapSubregion } from '../../types/northMap.ts';

export const EditorialReviewWorkbench: React.FC = () => {
  const [filterSubregion, setFilterSubregion] = useState<NorthMapSubregion | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<DestinationDataStatus | 'All'>('All');
  const [filterCoordStatus, setFilterCoordStatus] = useState<CoordinateStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);

  const allDestinations = useMemo(() => {
    return destinationRepository.getAllNorthernDestinations();
  }, []);

  // Filtered dataset
  const filteredDestinations = useMemo(() => {
    return allDestinations.filter((d) => {
      if (filterSubregion !== 'All' && d.subregion !== filterSubregion) return false;
      if (filterStatus !== 'All' && d.dataStatus !== filterStatus) return false;
      if (filterCoordStatus !== 'All' && d.coordinateStatus !== filterCoordStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = d.name.toLowerCase().includes(q) || d.vietnameseName.toLowerCase().includes(q);
        const matchesId = d.id.toLowerCase().includes(q);
        const matchesProv = d.currentAdministrativeRegion.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesProv) return false;
      }
      return true;
    });
  }, [allDestinations, filterSubregion, filterStatus, filterCoordStatus, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = allDestinations.length;
    const verified = allDestinations.filter((d) => d.dataStatus === 'verified').length;
    const needsReview = allDestinations.filter((d) => d.dataStatus === 'needs_review').length;
    const exactCoords = allDestinations.filter((d) => d.coordinateStatus === 'exact_landmark').length;
    const adminCoords = allDestinations.filter((d) => d.coordinateStatus === 'administrative_center').length;
    const passes = allDestinations.filter((d) => d.coordinateStatus === 'scenic_pass').length;
    const islands = allDestinations.filter((d) => d.coordinateStatus === 'island_centroid').length;
    const lakes = allDestinations.filter((d) => d.coordinateStatus === 'scenic_lake').length;
    const approx = allDestinations.filter((d) => d.coordinateStatus === 'approximate').length;
    const withSources = allDestinations.filter((d) => d.sourceReferences.length > 0).length;
    const withUrls = allDestinations.filter((d) => d.sourceReferences.some((s) => !!s.url)).length;
    const withLongDesc = allDestinations.filter((d) => !!d.longDescription).length;
    const withSeason = allDestinations.filter((d) => !!d.bestSeason).length;

    return {
      total,
      verified,
      needsReview,
      exactCoords,
      adminCoords,
      passes,
      islands,
      lakes,
      approx,
      withSources,
      withUrls,
      withLongDesc,
      withSeason,
    };
  }, [allDestinations]);

  const selectedDestination = useMemo(() => {
    if (!selectedDestId) return filteredDestinations[0] || null;
    return allDestinations.find((d) => d.id === selectedDestId) || null;
  }, [selectedDestId, allDestinations, filteredDestinations]);

  return (
    <div className="space-y-6">
      {/* Workbench Header Banner */}
      <div className="rounded-2xl border border-[#3DDC97]/30 bg-gradient-to-r from-[#0E1E1A] via-[#102820] to-[#0A1424] p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#3DDC97]/20 text-[#3DDC97] border border-[#3DDC97]/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bàn làm việc Biên tập & Kiểm chứng Dữ liệu Thực địa</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-white">
              Bảng Kiểm tra & Quản trị Dữ liệu Miền Bắc
            </h2>
            <p className="text-xs text-[#9BA9C3] max-w-2xl leading-relaxed">
              Theo dõi tình trạng thẩm định biên tập, độ tin cậy tọa độ GPS, nguồn trích dẫn pháp lý và mức độ hoàn thiện nội dung của 81 điểm đến miền Bắc.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
              {stats.total} Điểm đến • {stats.verified} Xác thực • {stats.needsReview} Cần rà soát
            </span>
          </div>
        </div>
      </div>

      {/* Aggregate Quality Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-[#243049] bg-[#0E1626]">
          <div className="text-[11px] text-[#9BA9C3] uppercase font-semibold">Tọa độ Landmark Chuẩn</div>
          <div className="text-2xl font-bold font-mono text-[#3DDC97] mt-1">{stats.exactCoords}</div>
          <div className="text-[10px] text-slate-400 mt-1">Cột mốc, đền chùa, đỉnh núi</div>
        </div>

        <div className="p-4 rounded-xl border border-[#243049] bg-[#0E1626]">
          <div className="text-[11px] text-[#9BA9C3] uppercase font-semibold">Trung tâm Hành chính</div>
          <div className="text-2xl font-bold font-mono text-[#48E3EF] mt-1">{stats.adminCoords}</div>
          <div className="text-[10px] text-slate-400 mt-1">UBND tỉnh lỵ, thành phố</div>
        </div>

        <div className="p-4 rounded-xl border border-[#243049] bg-[#0E1626]">
          <div className="text-[11px] text-[#9BA9C3] uppercase font-semibold">Đèo, Đảo, Hồ, Vùng mở rộng</div>
          <div className="text-2xl font-bold font-mono text-[#F59E0B] mt-1">
            {stats.passes + stats.islands + stats.lakes + stats.approx}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {stats.passes} đèo • {stats.islands} đảo • {stats.lakes} hồ
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#243049] bg-[#0E1626]">
          <div className="text-[11px] text-[#9BA9C3] uppercase font-semibold">Có Nguồn Tham chiếu</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{stats.withSources} / {stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            {stats.withUrls} nguồn có link tra cứu trực tiếp
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-xl border border-[#243049] bg-[#0A1120] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9BA9C3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc theo tên, tỉnh thành hoặc ID (ví dụ: sapa, Fansipan, Hà Giang)..."
              className="w-full rounded-lg border border-[#243049] bg-[#080D18] pl-9 pr-3 py-2 text-xs text-white placeholder-[#4A5D7E] focus:border-[#3DDC97] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Subregion Selector */}
            <select
              value={filterSubregion}
              onChange={(e) => setFilterSubregion(e.target.value as any)}
              className="rounded-lg border border-[#243049] bg-[#080D18] px-2.5 py-2 text-xs text-white focus:outline-none"
            >
              <option value="All">Tất cả tiểu vùng ({allDestinations.length})</option>
              <option value="Tây Bắc">Tây Bắc</option>
              <option value="Đông Bắc">Đông Bắc</option>
              <option value="Đồng bằng sông Hồng">Đồng bằng sông Hồng</option>
              <option value="Ven biển Bắc Bộ">Ven biển Bắc Bộ</option>
              <option value="Bắc Trung Bộ mở rộng">Bắc Trung Bộ mở rộng</option>
            </select>

            {/* Review Status Selector */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-lg border border-[#243049] bg-[#080D18] px-2.5 py-2 text-xs text-white focus:outline-none"
            >
              <option value="All">Tất cả trạng thái thẩm định</option>
              <option value="verified">Đã xác thực (Verified)</option>
              <option value="needs_review">Cần rà soát (Needs Review)</option>
              <option value="unresolved">Chưa phân giải (Unresolved)</option>
            </select>

            {/* Coordinate Status Selector */}
            <select
              value={filterCoordStatus}
              onChange={(e) => setFilterCoordStatus(e.target.value as any)}
              className="rounded-lg border border-[#243049] bg-[#080D18] px-2.5 py-2 text-xs text-white focus:outline-none"
            >
              <option value="All">Tất cả trạng thái tọa độ</option>
              <option value="exact_landmark">Mốc Landmark chuẩn xác</option>
              <option value="administrative_center">Trung tâm hành chính</option>
              <option value="scenic_pass">Đèo cảnh quan</option>
              <option value="island_centroid">Tâm đảo</option>
              <option value="scenic_lake">Hồ sinh thái</option>
              <option value="approximate">Ước tính vùng rộng</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-[#9BA9C3] flex items-center justify-between">
          <span>Hiển thị <strong>{filteredDestinations.length}</strong> / {allDestinations.length} điểm đến phù hợp tiêu chí</span>
          {(filterSubregion !== 'All' || filterStatus !== 'All' || filterCoordStatus !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setFilterSubregion('All');
                setFilterStatus('All');
                setFilterCoordStatus('All');
                setSearchQuery('');
              }}
              className="text-[#3DDC97] hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Main Master-Detail Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Destination Records List */}
        <div className="lg:col-span-5 max-h-[640px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
          {filteredDestinations.map((dest) => {
            const isSelected = selectedDestination?.id === dest.id;
            const isNeedsReview = dest.dataStatus === 'needs_review';

            return (
              <div
                key={dest.id}
                onClick={() => setSelectedDestId(dest.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#3DDC97] bg-[#12221E]'
                    : isNeedsReview
                    ? 'border-[#F59E0B]/40 bg-[#161410] hover:border-[#F59E0B]'
                    : 'border-[#243049] bg-[#0E1626] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{dest.vietnameseName}</h4>
                      {isNeedsReview ? (
                        <span className="text-[10px] font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.2 rounded border border-[#F59E0B]/30 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Rà soát
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-[#3DDC97] bg-[#3DDC97]/10 px-1.5 py-0.2 rounded border border-[#3DDC97]/30 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Xác thực
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#9BA9C3] flex items-center gap-2 mt-0.5">
                      <span>{dest.currentAdministrativeRegion}</span>
                      <span>•</span>
                      <span>{dest.subregion}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-slate-300">
                    {dest.coordinateStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-[#243049]/60">
                  <span className="font-mono text-[10px]">
                    {dest.latitude.toFixed(3)}°B, {dest.longitude.toFixed(3)}°Đ
                  </span>
                  <div className="flex items-center gap-1.5">
                    {dest.longDescription && (
                      <span className="text-[10px] text-[#48E3EF]" title="Có bài viết chi tiết">Chi tiết ✓</span>
                    )}
                    {dest.bestSeason && (
                      <span className="text-[10px] text-[#3DDC97]" title="Có dữ liệu mùa lý tưởng">Mùa vụ ✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Destination Dossier & Provenance Detail */}
        <div className="lg:col-span-7">
          {selectedDestination ? (
            <div className="rounded-2xl border border-[#243049] bg-[#0E1626] p-6 space-y-6">
              {/* Header Title & Actions */}
              <div className="flex items-start justify-between gap-4 border-b border-[#243049]/60 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] text-[#3DDC97] border-[#3DDC97]/30">
                      {selectedDestination.subregion}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-[#48E3EF] border-[#48E3EF]/30">
                      {selectedDestination.category}
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white">
                    {selectedDestination.vietnameseName}
                  </h3>
                  <p className="text-xs text-[#9BA9C3] font-mono mt-0.5">
                    ID: {selectedDestination.id} • Tên quốc tế: {selectedDestination.name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/destinations/${selectedDestination.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3DDC97]/15 text-[#3DDC97] border border-[#3DDC97]/30 text-xs font-semibold hover:bg-[#3DDC97]/25 transition-colors"
                  >
                    <span>Trang chi tiết</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={`/map/north?destination=${selectedDestination.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#48E3EF]/15 text-[#48E3EF] border border-[#48E3EF]/30 text-xs font-semibold hover:bg-[#48E3EF]/25 transition-colors"
                  >
                    <span>Xem bản đồ</span>
                    <Compass className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Geographic Precision & Coordinates Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#3DDC97] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Hồ sơ Tọa độ & Trạng thái Địa lý</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#080D18] p-3.5 rounded-xl border border-[#243049]">
                  <div>
                    <span className="text-[#9BA9C3] block font-medium">Tọa độ GPS:</span>
                    <span className="font-mono text-white text-xs">
                      {selectedDestination.latitude.toFixed(4)}°B, {selectedDestination.longitude.toFixed(4)}°Đ
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9BA9C3] block font-medium">Phân loại Tọa độ:</span>
                    <span className="text-[#48E3EF] font-mono text-xs">
                      {selectedDestination.coordinateStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9BA9C3] block font-medium">Độ tin cậy:</span>
                    <span className="text-white text-xs">
                      {(selectedDestination.coordinateConfidenceScore * 100).toFixed(0)}% (Hệ định vị Travi North)
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9BA9C3] block font-medium">Trạng thái Thẩm định:</span>
                    <span className={selectedDestination.dataStatus === 'verified' ? 'text-[#3DDC97]' : 'text-[#F59E0B]'}>
                      {selectedDestination.dataStatus === 'verified' ? 'Đã xác thực (Verified)' : 'Cần rà soát (Needs Review)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editorial Content Quality Inspection */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#48E3EF] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Nội dung Biên tập Thực địa</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#080D18] border border-[#243049] space-y-1">
                    <span className="text-[#9BA9C3] font-semibold block text-[11px]">Giới thiệu ngắn:</span>
                    <p className="text-white leading-relaxed">{selectedDestination.shortDescription}</p>
                  </div>

                  {selectedDestination.longDescription && (
                    <div className="p-3 rounded-xl bg-[#080D18] border border-[#243049] space-y-1">
                      <span className="text-[#48E3EF] font-semibold block text-[11px]">Ký sự chi tiết:</span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{selectedDestination.longDescription}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-[#080D18] border border-[#243049]">
                      <span className="text-[#9BA9C3] block text-[10px]">Mùa lý tưởng:</span>
                      <span className="text-white text-xs font-medium">
                        {selectedDestination.bestSeason || 'Chưa thiết lập'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#080D18] border border-[#243049]">
                      <span className="text-[#9BA9C3] block text-[10px]">Thời lượng khuyên dùng:</span>
                      <span className="text-white text-xs font-medium">
                        {selectedDestination.recommendedDuration || 'Chưa thiết lập'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Source References & Citations */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#9875FF] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Nguồn Dữ liệu & Trích dẫn Kiểm chứng</span>
                </h4>

                <div className="space-y-2">
                  {selectedDestination.sourceReferences.map((src, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#080D18] border border-[#243049] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{src.name}</span>
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3DDC97] hover:underline flex items-center gap-1 text-[10px]"
                          >
                            <span>Mở nguồn</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-[10px] text-[#48E3EF]">{src.sourceType}</div>
                      {src.notes && <p className="text-[10px] text-slate-400 italic">{src.notes}</p>}
                      <div className="text-[9px] text-slate-500 pt-1">
                        Ngày rà soát: {src.verifiedAt || selectedDestination.lastReviewedAt}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center rounded-2xl border border-[#243049] bg-[#0E1626] text-center p-6 text-slate-400">
              <Compass className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-xs">Chọn một điểm đến bên trái để xem hồ sơ biên tập chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
