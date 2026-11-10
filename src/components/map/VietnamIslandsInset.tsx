import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  VIETNAM_ARCHIPELAGOS,
  type VietnamArchipelagoRecord,
  type IslandFeature,
} from '../../services/map/vietnamIslandsConfig.ts';
import { MAP_TILE_PROVIDERS } from '../../services/map/mapConfig.ts';
import {
  Compass,
  MapPin,
  ExternalLink,
  X,
  ChevronRight,
  Shield,
  Layers,
  Info,
} from 'lucide-react';

interface VietnamIslandsInsetProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToArchipelago?: (archipelago: VietnamArchipelagoRecord) => void;
  onFlyToIsland?: (island: IslandFeature) => void;
  className?: string;
}

export const VietnamIslandsInset: React.FC<VietnamIslandsInsetProps> = ({
  isOpen,
  onClose,
  onFlyToArchipelago,
  onFlyToIsland,
  className = '',
}) => {
  const [activeArchipelagoKey, setActiveArchipelagoKey] = useState<'hoangSa' | 'truongSa'>('hoangSa');
  const [selectedIsland, setSelectedIsland] = useState<IslandFeature | null>(null);

  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const miniMapMarkerGroupRef = useRef<L.LayerGroup | null>(null);

  const activeArchipelago = VIETNAM_ARCHIPELAGOS[activeArchipelagoKey];

  // Initialize and update Mini Map on active archipelago change
  useEffect(() => {
    if (!isOpen || !miniMapContainerRef.current) return;

    if (!miniMapInstanceRef.current) {
      const map = L.map(miniMapContainerRef.current, {
        center: activeArchipelago.centroid,
        zoom: activeArchipelago.defaultZoom,
        minZoom: 6,
        maxZoom: 14,
        zoomControl: true,
        attributionControl: false, // Inset has explicit caption/source
      });

      const osmProvider = MAP_TILE_PROVIDERS.osmStandard;
      L.tileLayer(osmProvider.url, {
        maxZoom: osmProvider.maxZoom,
      }).addTo(map);

      const markerGroup = L.layerGroup().addTo(map);
      miniMapMarkerGroupRef.current = markerGroup;
      miniMapInstanceRef.current = map;
    } else {
      miniMapInstanceRef.current.setView(activeArchipelago.centroid, activeArchipelago.defaultZoom);
    }

    // Refresh markers for current archipelago
    const markerGroup = miniMapMarkerGroupRef.current;
    if (markerGroup) {
      markerGroup.clearLayers();

      activeArchipelago.keyIslands.forEach((island) => {
        const isCenter = island.isAdministrativeCenter;

        const pinHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width: 28px; height: 28px;">
            <div class="absolute inset-0 rounded-full ${
              isCenter ? 'bg-amber-400/30 animate-ping' : 'bg-cyan-400/20'
            }"></div>
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md border ${
              isCenter
                ? 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-[#0E1626] text-cyan-400 border-cyan-400'
            }">
              ${isCenter ? '★' : '●'}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: pinHtml,
          className: 'island-mini-pin',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([island.latitude, island.longitude], { icon });

        marker.bindTooltip(
          `<div class="p-1 font-sans text-xs">
            <strong>${island.vietnameseName}</strong><br/>
            <span class="text-[10px] text-slate-300">${island.latitude.toFixed(4)}°B, ${island.longitude.toFixed(4)}°Đ</span>
          </div>`,
          { direction: 'top', offset: [0, -14], opacity: 0.95 }
        );

        marker.on('click', () => {
          setSelectedIsland(island);
          if (onFlyToIsland) onFlyToIsland(island);
        });

        markerGroup.addLayer(marker);
      });
    }

    // Force size invalidation
    const timer = setTimeout(() => {
      miniMapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, activeArchipelagoKey, activeArchipelago, onFlyToIsland]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen && miniMapInstanceRef.current) {
      miniMapInstanceRef.current.remove();
      miniMapInstanceRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="vietnam-islands-title"
      aria-modal="true"
      className={`absolute bottom-12 left-4 md:left-6 z-30 w-[92vw] sm:w-[420px] md:w-[460px] max-h-[85vh] bg-[#0A101D]/98 border border-[#243049] rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200 ${className}`}
    >
      {/* Top Header */}
      <div className="p-3.5 bg-gradient-to-r from-[#101A2D] via-[#0E1626] to-[#121E36] border-b border-[#243049] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-sm">
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="vietnam-islands-title" className="text-sm font-bold font-serif tracking-wide text-white">
                BIỂN ĐẢO VIỆT NAM
              </h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                Chủ quyền thiêng liêng
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Khung bản đồ & tư liệu pháp lý các quần đảo của Việt Nam
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Đóng bảng Biển đảo Việt Nam"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Archipelago Selector Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-[#0E1626]/80 border-b border-[#243049] gap-1.5 text-xs">
        <button
          onClick={() => {
            setActiveArchipelagoKey('hoangSa');
            setSelectedIsland(null);
          }}
          className={`py-2 px-2.5 rounded-xl text-center font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
            activeArchipelagoKey === 'hoangSa'
              ? 'bg-[#15233D] text-[#48E3EF] border border-[#48E3EF]/40 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#121C30]'
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider font-semibold">Hoàng Sa</span>
          <span className="text-[9px] text-slate-400 font-normal">TP. Đà Nẵng</span>
        </button>

        <button
          onClick={() => {
            setActiveArchipelagoKey('truongSa');
            setSelectedIsland(null);
          }}
          className={`py-2 px-2.5 rounded-xl text-center font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
            activeArchipelagoKey === 'truongSa'
              ? 'bg-[#15233D] text-[#3DDC97] border border-[#3DDC97]/40 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#121C30]'
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider font-semibold">Trường Sa</span>
          <span className="text-[9px] text-slate-400 font-normal">Tỉnh Khánh Hòa</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {/* Exact Official Label Card */}
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#121C30] to-[#0A101D] border border-[#243049] shadow-inner">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Tên gọi chính thức theo Công pháp & Bản đồ Quốc gia
          </div>
          <div className="text-sm font-extrabold text-amber-300 font-serif tracking-wide leading-tight">
            {activeArchipelago.officialLabel}
          </div>
          <div className="text-xs text-slate-300 mt-1 flex items-center gap-2">
            <span className="font-semibold text-white">{activeArchipelago.administrativeUnit}</span>
            <span className="w-1 h-1 rounded-full bg-slate-500"></span>
            <span className="text-slate-400">{activeArchipelago.governingProvinceOrCity}</span>
          </div>
        </div>

        {/* Real Leaflet Mini Map Inset */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#48E3EF]" />
              <span>Hải đồ thực tế (OpenStreetMap)</span>
            </span>
            <button
              onClick={() => onFlyToArchipelago && onFlyToArchipelago(activeArchipelago)}
              className="text-[11px] text-[#3DDC97] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Xem trên bản đồ chính</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[#243049] shadow-lg bg-[#080D18]">
            <div ref={miniMapContainerRef} className="w-full h-full z-0" />
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-[#0E1626]/90 border border-[#243049] text-[10px] text-white font-mono backdrop-blur-md">
              {activeArchipelago.centroid[0].toFixed(2)}°B, {activeArchipelago.centroid[1].toFixed(2)}°Đ
            </div>
            <div className="absolute bottom-1 right-1 z-10 px-1.5 py-0.5 rounded bg-black/60 text-[8px] text-slate-400 backdrop-blur-sm">
              © OpenStreetMap
            </div>
          </div>
        </div>

        {/* Explanatory Caption */}
        <div className="p-2.5 rounded-xl bg-[#0E1626]/70 border border-[#243049]/80 flex items-start gap-2 text-xs">
          <Info className="w-4 h-4 text-[#48E3EF] shrink-0 mt-0.5" />
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {activeArchipelago.explanatoryCaption}
          </p>
        </div>

        {/* Selected Island or Key Islands List */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Các đảo tiêu biểu ({activeArchipelago.keyIslands.length})</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Toạ độ xác thực</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {activeArchipelago.keyIslands.map((island) => {
              const isSelected = selectedIsland?.id === island.id;
              return (
                <div
                  key={island.id}
                  onClick={() => {
                    setSelectedIsland(island);
                    miniMapInstanceRef.current?.setView([island.latitude, island.longitude], 10, {
                      animate: true,
                    });
                  }}
                  className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#15233D] border-[#48E3EF] text-white shadow-sm'
                      : 'bg-[#0E1626] border-[#243049]/80 hover:border-[#3DDC97]/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${island.isAdministrativeCenter ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{island.vietnameseName}</span>
                        {island.isAdministrativeCenter && (
                          <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Trung tâm
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{island.featureDescription}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-[10px] text-slate-400">
                    <div>{island.latitude.toFixed(2)}°B</div>
                    <div>{island.longitude.toFixed(2)}°Đ</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal & Historical Sources Reference */}
        <div className="pt-2 border-t border-[#243049] space-y-1">
          <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-500" />
            <span>Nguồn tư liệu & Căn cứ pháp lý:</span>
          </div>
          {activeArchipelago.sources.map((src, i) => (
            <div key={i} className="text-[10px] text-slate-400 flex items-start gap-1">
              <span className="text-[#3DDC97]">▪</span>
              <span>
                <strong className="text-slate-300">{src.authority}:</strong> {src.documentRef}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 bg-[#0E1626] border-t border-[#243049] flex items-center justify-between gap-2">
        <button
          onClick={() => onFlyToArchipelago && onFlyToArchipelago(activeArchipelago)}
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#10B981] to-[#3DDC97] hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Định vị trên bản đồ chính</span>
        </button>
      </div>
    </div>
  );
};
