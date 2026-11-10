import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import type {
  NorthDestinationRecord,
  NorthMapCategory,
  NorthMapSubregion,
  RouteCalculationResult,
} from '../../types/northMap.ts';
import {
  MAP_TILE_PROVIDERS,
  DEFAULT_TILE_PROVIDER_ID,
  NORTH_VIETNAM_BOUNDS,
  SUBREGION_BOUNDS,
  CATEGORY_STYLE_CONFIG,
} from '../../services/map/mapConfig.ts';
import {
  VIETNAM_ARCHIPELAGOS,
  type VietnamArchipelagoRecord,
  type IslandFeature,
} from '../../services/map/vietnamIslandsConfig.ts';
import { VietnamIslandsInset } from './VietnamIslandsInset.tsx';
import { clusterDestinations, type DisplayMarkerItem } from '../../services/map/clusteringEngine.ts';
import {
  Maximize2,
  Minimize2,
  Layers,
  RotateCcw,
  Sparkles,
  MapPin,
  AlertTriangle,
  Shield,
  ArrowLeft,
} from 'lucide-react';

interface LeafletNorthMapProps {
  destinations: NorthDestinationRecord[];
  selectedDestination: NorthDestinationRecord | null;
  onSelectDestination: (dest: NorthDestinationRecord) => void;
  activeSubregion: NorthMapSubregion | 'All';
  routeResult: RouteCalculationResult | null;
  routeDestinations: NorthDestinationRecord[];
  className?: string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  isIslandsInsetOpen?: boolean;
  onToggleIslandsInset?: (isOpen: boolean) => void;
}

// Generate category SVG icon string for Leaflet DivIcon
function getCategorySvgPath(category: NorthMapCategory): string {
  switch (category) {
    case 'Núi non & Đỉnh cao':
      return '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>';
    case 'Thác nước & Sông hồ':
      return '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>';
    case 'Biển đảo & Bờ biển':
      return '<path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2m7 5c0 3.31-2.69 6-6 6M2 13h2m8-5c0 2.21-1.79 4-4 4M2 8c0 3.87 3.13 7 7 7m3 7v-4a3 3 0 0 0-3-3H2"/>';
    case 'Di tích lịch sử':
      return '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h6M9 14h6M9 18h6"/>';
    case 'Văn hóa & Di sản':
      return '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/>';
    case 'Ẩm thực bản địa':
      return '<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M6 2v20M15 11v11"/>';
    case 'Thám hiểm & Trekking':
      return '<path d="M4 16v-2.38C4 11.5 2.97 9.87 3 7.82 3.03 5.7 4.7 4 6.82 4c1.9 0 3.51 1.39 3.79 3.27l.56 3.73H13v5M17 14v4a2 2 0 0 0 2 2h2"/>';
    case 'Du lịch sinh thái':
      return '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0zM7 16v6M17 14v.2A3 3 0 0 1 15.9 20H12a3 3 0 0 1-1-5.8V14a3 3 0 0 1 6 0zM14 20v2"/>';
    case 'Đô thị & Cửa ngõ':
      return '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>';
    case 'Cảnh quan thiên nhiên':
    default:
      return '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>';
  }
}

export const LeafletNorthMap: React.FC<LeafletNorthMapProps> = ({
  destinations,
  selectedDestination,
  onSelectDestination,
  activeSubregion,
  routeResult,
  routeDestinations,
  className = '',
  isFullScreen = false,
  onToggleFullScreen,
  isIslandsInsetOpen: controlledIslandsInsetOpen,
  onToggleIslandsInset,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const sovereigntyLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeTileId, setActiveTileId] = useState<string>(DEFAULT_TILE_PROVIDER_ID);
  const [currentZoom, setCurrentZoom] = useState<number>(NORTH_VIETNAM_BOUNDS.defaultZoom);
  const [isClustering, setIsClustering] = useState<boolean>(true);
  const [tileError, setTileError] = useState<boolean>(false);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [internalIslandsInsetOpen, setInternalIslandsInsetOpen] = useState<boolean>(false);
  const [viewingArchipelagoName, setViewingArchipelagoName] = useState<string | null>(null);

  const isIslandsInsetOpen =
    controlledIslandsInsetOpen !== undefined ? controlledIslandsInsetOpen : internalIslandsInsetOpen;

  const handleToggleIslandsInset = useCallback(
    (value: boolean) => {
      if (onToggleIslandsInset) {
        onToggleIslandsInset(value);
      } else {
        setInternalIslandsInsetOpen(value);
      }
    },
    [onToggleIslandsInset]
  );

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: NORTH_VIETNAM_BOUNDS.defaultCenter,
      zoom: NORTH_VIETNAM_BOUNDS.defaultZoom,
      minZoom: 5, // Allows seamless pan out to encompass full Vietnamese maritime territory
      maxZoom: 18,
      zoomControl: false, // Custom controls
      attributionControl: true,
    });

    // Create layer groups
    const markerGroup = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);
    const sovereigntyGroup = L.layerGroup().addTo(map);

    markerLayerGroupRef.current = markerGroup;
    routeLayerGroupRef.current = routeGroup;
    sovereigntyLayerGroupRef.current = sovereigntyGroup;
    mapInstanceRef.current = map;

    // Track zoom and center to detect maritime view
    const handleMove = () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      setCurrentZoom(zoom);

      // Check if user has panned to maritime archipelagos
      if (center.lat < 17.5 && center.lat > 14.5 && center.lng > 110.0) {
        setViewingArchipelagoName(VIETNAM_ARCHIPELAGOS.hoangSa.officialLabel);
      } else if (center.lat < 13.0 && center.lat > 6.5 && center.lng > 110.0) {
        setViewingArchipelagoName(VIETNAM_ARCHIPELAGOS.truongSa.officialLabel);
      } else {
        setViewingArchipelagoName(null);
      }
    };

    map.on('zoomend', handleMove);
    map.on('moveend', handleMove);

    // Initial resize
    setTimeout(() => {
      map.invalidateSize();
      setIsMapReady(true);
    }, 150);

    // Attach ResizeObserver to container to guarantee crisp rendering when sidebar opens/closes
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer with OpenStreetMap Standard
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const provider = MAP_TILE_PROVIDERS[activeTileId] || MAP_TILE_PROVIDERS.osmStandard;

    const tileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
      subdomains: provider.subdomains || ['a', 'b', 'c'],
    });

    tileLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayer.on('load', () => {
      setTileError(false);
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
  }, [activeTileId]);

  // Handle FullScreen map resize
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullScreen]);

  // Render Sovereignty Markers for Hoang Sa & Truong Sa on the Main Map Canvas
  useEffect(() => {
    const sovGroup = sovereigntyLayerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!sovGroup || !map || !isMapReady) return;

    sovGroup.clearLayers();

    // 1. Quần đảo Hoàng Sa – Việt Nam
    const hoangSa = VIETNAM_ARCHIPELAGOS.hoangSa;
    const hoangSaHtml = `
      <div class="relative flex flex-col items-center cursor-pointer group" style="width: 220px; transform: translate(-50%, -50%);">
        <div class="px-3 py-1.5 rounded-xl bg-[#0E1626]/95 border-2 border-amber-400 text-white shadow-2xl backdrop-blur-md flex items-center gap-2 transition-transform group-hover:scale-105">
          <span class="w-3.5 h-3.5 rounded-full bg-red-600 border border-amber-300 flex items-center justify-center text-[9px] text-amber-300 font-bold">★</span>
          <div class="text-left">
            <div class="text-[11px] font-extrabold text-amber-300 tracking-wide font-serif leading-none whitespace-nowrap">
              ${hoangSa.officialLabel}
            </div>
            <div class="text-[9px] text-slate-300 mt-0.5 leading-none">
              ${hoangSa.administrativeUnit} • ${hoangSa.governingProvinceOrCity}
            </div>
          </div>
        </div>
        <div class="w-2 h-2 rotate-45 bg-amber-400 -mt-1 shadow-md"></div>
      </div>
    `;

    const hoangSaIcon = L.divIcon({
      html: hoangSaHtml,
      className: 'travi-sovereignty-marker',
      iconSize: [220, 50],
      iconAnchor: [110, 25],
    });

    const hoangSaMarker = L.marker(hoangSa.centroid, {
      icon: hoangSaIcon,
      zIndexOffset: 2000,
    });

    hoangSaMarker.on('click', () => {
      handleToggleIslandsInset(true);
      map.flyTo(hoangSa.centroid, hoangSa.defaultZoom, { duration: 1.0 });
    });

    sovGroup.addLayer(hoangSaMarker);

    // 2. Quần đảo Trường Sa – Việt Nam
    const truongSa = VIETNAM_ARCHIPELAGOS.truongSa;
    const truongSaHtml = `
      <div class="relative flex flex-col items-center cursor-pointer group" style="width: 220px; transform: translate(-50%, -50%);">
        <div class="px-3 py-1.5 rounded-xl bg-[#0E1626]/95 border-2 border-[#3DDC97] text-white shadow-2xl backdrop-blur-md flex items-center gap-2 transition-transform group-hover:scale-105">
          <span class="w-3.5 h-3.5 rounded-full bg-red-600 border border-amber-300 flex items-center justify-center text-[9px] text-amber-300 font-bold">★</span>
          <div class="text-left">
            <div class="text-[11px] font-extrabold text-[#3DDC97] tracking-wide font-serif leading-none whitespace-nowrap">
              ${truongSa.officialLabel}
            </div>
            <div class="text-[9px] text-slate-300 mt-0.5 leading-none">
              ${truongSa.administrativeUnit} • ${truongSa.governingProvinceOrCity}
            </div>
          </div>
        </div>
        <div class="w-2 h-2 rotate-45 bg-[#3DDC97] -mt-1 shadow-md"></div>
      </div>
    `;

    const truongSaIcon = L.divIcon({
      html: truongSaHtml,
      className: 'travi-sovereignty-marker',
      iconSize: [220, 50],
      iconAnchor: [110, 25],
    });

    const truongSaMarker = L.marker(truongSa.centroid, {
      icon: truongSaIcon,
      zIndexOffset: 2000,
    });

    truongSaMarker.on('click', () => {
      handleToggleIslandsInset(true);
      map.flyTo(truongSa.centroid, truongSa.defaultZoom, { duration: 1.0 });
    });

    sovGroup.addLayer(truongSaMarker);

    // When zoomed into the archipelagos (zoom >= 8), render individual island pins
    if (currentZoom >= 8) {
      const allIslands = [...hoangSa.keyIslands, ...truongSa.keyIslands];
      allIslands.forEach((island) => {
        const islandHtml = `
          <div class="px-2 py-0.5 rounded-lg bg-[#0E1626]/90 border border-cyan-400 text-cyan-300 text-[10px] font-bold shadow-md whitespace-nowrap flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>${island.vietnameseName}</span>
          </div>
        `;
        const islandIcon = L.divIcon({
          html: islandHtml,
          className: 'island-label-pin',
          iconSize: [120, 24],
          iconAnchor: [60, 12],
        });
        const marker = L.marker([island.latitude, island.longitude], { icon: islandIcon });
        marker.on('click', () => {
          handleToggleIslandsInset(true);
        });
        sovGroup.addLayer(marker);
      });
    }
  }, [isMapReady, currentZoom, handleToggleIslandsInset]);

  // Fit bounds when active subregion changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    if (activeSubregion === 'All') {
      map.flyTo(NORTH_VIETNAM_BOUNDS.defaultCenter, NORTH_VIETNAM_BOUNDS.defaultZoom, {
        duration: 1.0,
      });
    } else if (SUBREGION_BOUNDS[activeSubregion]) {
      const config = SUBREGION_BOUNDS[activeSubregion];
      map.flyToBounds(config.bounds, {
        duration: 1.0,
        padding: [30, 30],
        maxZoom: 10,
      });
    }
  }, [activeSubregion, isMapReady]);

  // Fit bounds when a destination is selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedDestination || !isMapReady) return;

    map.flyTo([selectedDestination.latitude, selectedDestination.longitude], 12, {
      duration: 0.9,
    });
  }, [selectedDestination, isMapReady]);

  // Render Route Polylines and Waypoint Markers
  useEffect(() => {
    const routeGroup = routeLayerGroupRef.current;
    if (!routeGroup) return;

    routeGroup.clearLayers();

    if (routeResult && routeResult.coordinates.length >= 2) {
      // Glow background line
      const glowPolyline = L.polyline(routeResult.coordinates, {
        color: '#48E3EF',
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      });
      routeGroup.addLayer(glowPolyline);

      // Main route polyline
      const mainPolyline = L.polyline(routeResult.coordinates, {
        color: '#3DDC97',
        weight: 4,
        opacity: 0.95,
        dashArray: routeResult.distanceType === 'straight_line_geographic' ? '8, 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      });
      routeGroup.addLayer(mainPolyline);

      // Fit map bounds to encompass the entire route
      const map = mapInstanceRef.current;
      if (map && routeResult.coordinates.length > 0) {
        const bounds = L.latLngBounds(routeResult.coordinates);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
      }
    }
  }, [routeResult]);

  // Render Destination Pins and Clusters
  useEffect(() => {
    const markerGroup = markerLayerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!markerGroup || !map || !isMapReady) return;

    markerGroup.clearLayers();

    // Compute display items (clusters vs single markers)
    const displayItems: DisplayMarkerItem[] = clusterDestinations(
      destinations,
      currentZoom,
      55,
      isClustering
    );

    // Map route destination IDs for waypoint indices
    const routeIndexMap = new Map<string, number>();
    routeDestinations.forEach((d, idx) => routeIndexMap.set(d.id, idx + 1));

    displayItems.forEach((item) => {
      if (item.isCluster) {
        // Render Cluster Marker
        const clusterHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width: 44px; height: 44px;">
            <div class="absolute inset-0 rounded-full bg-cyan-500/25 animate-ping opacity-60"></div>
            <div class="relative w-10 h-10 rounded-full bg-[#0E1626]/90 border-2 border-[#48E3EF] shadow-lg flex flex-col items-center justify-center backdrop-blur-md transition-transform group-hover:scale-110">
              <span class="text-xs font-bold text-white leading-none">${item.count}</span>
              <span class="text-[9px] text-[#48E3EF] font-medium leading-none mt-0.5">điểm</span>
            </div>
          </div>
        `;

        const clusterIcon = L.divIcon({
          html: clusterHtml,
          className: 'travi-cluster-marker',
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const clusterMarker = L.marker([item.latitude, item.longitude], {
          icon: clusterIcon,
        });

        clusterMarker.on('click', () => {
          map.setView([item.latitude, item.longitude], Math.min(map.getZoom() + 2, 13), {
            animate: true,
          });
        });

        // Hover tooltip listing destinations
        const tooltipNames = item.destinations
          .slice(0, 4)
          .map((d) => d.vietnameseName)
          .join(', ');
        const tooltipExtra =
          item.count > 4 ? ` và +${item.count - 4} điểm khác` : '';
        clusterMarker.bindTooltip(
          `<div class="p-1 font-sans text-xs"><strong>Cụm ${item.count} điểm:</strong><br/>${tooltipNames}${tooltipExtra}</div>`,
          { direction: 'top', offset: [0, -20], opacity: 0.95 }
        );

        markerGroup.addLayer(clusterMarker);
      } else {
        // Render Single Destination Marker
        const dest = item.destination;
        const isSelected = selectedDestination?.id === dest.id;
        const waypointNumber = routeIndexMap.get(dest.id);
        const style = CATEGORY_STYLE_CONFIG[dest.category] || CATEGORY_STYLE_CONFIG['Cảnh quan thiên nhiên'];
        const svgIconPath = getCategorySvgPath(dest.category);

        const pinSize = isSelected ? 44 : waypointNumber ? 38 : 32;
        const activeClass = isSelected ? 'travi-marker-active' : '';

        const pinHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width: ${pinSize}px; height: ${pinSize}px;">
            ${
              isSelected
                ? `<div class="absolute inset-0 rounded-full bg-[#48E3EF]/40 animate-ping"></div>`
                : ''
            }
            <div class="${activeClass} relative w-full h-full rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-115"
                 style="background: ${isSelected ? '#0E1626' : '#121C30'}; border: 2.5px solid ${isSelected ? '#48E3EF' : style.color}; box-shadow: 0 4px 14px ${style.color}40;">
              ${
                waypointNumber
                  ? `<span class="text-xs font-extrabold text-white bg-[#3DDC97] rounded-full w-5 h-5 flex items-center justify-center">${waypointNumber}</span>`
                  : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#48E3EF' : style.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svgIconPath}</svg>`
              }
            </div>
            ${
              dest.verificationStatus === 'needs_review'
                ? `<div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border border-[#080D18] flex items-center justify-center text-[8px] text-black font-bold">!</div>`
                : ''
            }
          </div>
        `;

        const pinIcon = L.divIcon({
          html: pinHtml,
          className: 'travi-pin-marker',
          iconSize: [pinSize, pinSize],
          iconAnchor: [pinSize / 2, pinSize / 2],
        });

        const marker = L.marker([dest.latitude, dest.longitude], {
          icon: pinIcon,
          zIndexOffset: isSelected ? 1000 : waypointNumber ? 500 : 100,
        });

        marker.on('click', () => {
          onSelectDestination(dest);
        });

        // Rich tooltip on hover
        const tooltipHtml = `
          <div class="p-1.5 font-sans min-w-[150px]">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="w-2 h-2 rounded-full" style="background: ${style.color};"></span>
              <span class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">${dest.subregion}</span>
            </div>
            <div class="font-bold text-white text-xs leading-tight">${dest.vietnameseName}</div>
            <div class="text-[10px] text-emerald-400 font-medium mt-0.5">${dest.category}</div>
            ${
              dest.verificationStatus === 'needs_review'
                ? `<div class="text-[9px] text-amber-400 mt-0.5 flex items-center gap-1">⚠️ Cần rà soát tọa độ</div>`
                : `<div class="text-[9px] text-slate-400 mt-0.5">✓ Tọa độ chuẩn xác</div>`
            }
          </div>
        `;

        marker.bindTooltip(tooltipHtml, {
          direction: 'top',
          offset: [0, -pinSize / 2],
          opacity: 0.95,
          className: 'travi-custom-tooltip',
        });

        markerGroup.addLayer(marker);
      }
    });
  }, [
    destinations,
    selectedDestination,
    currentZoom,
    isClustering,
    routeDestinations,
    onSelectDestination,
    isMapReady,
  ]);

  // Handlers
  const handleResetView = useCallback(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo(NORTH_VIETNAM_BOUNDS.defaultCenter, NORTH_VIETNAM_BOUNDS.defaultZoom, {
        duration: 0.9,
      });
      setViewingArchipelagoName(null);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    const map = mapInstanceRef.current;
    if (map) map.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    const map = mapInstanceRef.current;
    if (map) map.zoomOut();
  }, []);

  const toggleTileProvider = useCallback(() => {
    setActiveTileId((prev) => (prev === 'osmStandard' ? 'osmHOT' : 'osmStandard'));
  }, []);

  const handleFlyToArchipelago = useCallback((arch: VietnamArchipelagoRecord) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo(arch.centroid, arch.defaultZoom, { duration: 1.2 });
      setViewingArchipelagoName(arch.officialLabel);
    }
  }, []);

  const handleFlyToIsland = useCallback((island: IslandFeature) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([island.latitude, island.longitude], 11, { duration: 1.0 });
    }
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" tabIndex={0} />

      {/* Viewing Archipelago Floating Banner / Return to North button */}
      {viewingArchipelagoName && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#0E1626]/95 border-2 border-amber-400 text-white text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-amber-300 animate-pulse"></span>
          <span className="font-extrabold text-amber-300 font-serif">{viewingArchipelagoName}</span>
          <button
            onClick={handleResetView}
            className="ml-2 px-2.5 py-1 rounded-xl bg-[#3DDC97] hover:brightness-110 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-md transition-all active:scale-95"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Về miền Bắc</span>
          </button>
        </div>
      )}

      {/* Tile Error Warning Toast with Retry */}
      {tileError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs shadow-lg backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Mảnh bản đồ OpenStreetMap đang tải chậm.</span>
          <button
            onClick={() => {
              tileLayerRef.current?.redraw();
              setTileError(false);
            }}
            className="ml-1 underline font-bold text-amber-300 hover:text-white"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Floating Map Controls Toolbar (Clear of Leaflet attribution) */}
      <div className="absolute right-4 bottom-12 z-20 flex flex-col gap-2">
        {/* Biển đảo Việt Nam (Hoàng Sa & Trường Sa) Toggle */}
        <button
          onClick={() => handleToggleIslandsInset(!isIslandsInsetOpen)}
          title="Biển đảo Việt Nam (Hoàng Sa & Trường Sa)"
          aria-label="Biển đảo Việt Nam"
          className={`w-10 h-10 rounded-xl border shadow-xl backdrop-blur-md flex items-center justify-center transition-all active:scale-95 ${
            isIslandsInsetOpen
              ? 'bg-red-600 text-white border-amber-400 shadow-red-500/30'
              : 'bg-[#0E1626]/90 text-amber-300 border-amber-400/60 hover:border-amber-400 hover:bg-amber-400/10'
          }`}
        >
          <Shield className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          title="Phóng to bản đồ (+)"
          aria-label="Phóng to"
          className="w-10 h-10 rounded-xl bg-[#0E1626]/90 hover:bg-[#151F33] text-white border border-[#243049] shadow-xl backdrop-blur-md flex items-center justify-center transition-all hover:border-[#3DDC97] active:scale-95"
        >
          <span className="text-xl font-semibold leading-none">+</span>
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          title="Thu nhỏ bản đồ (-)"
          aria-label="Thu nhỏ"
          className="w-10 h-10 rounded-xl bg-[#0E1626]/90 hover:bg-[#151F33] text-white border border-[#243049] shadow-xl backdrop-blur-md flex items-center justify-center transition-all hover:border-[#3DDC97] active:scale-95"
        >
          <span className="text-xl font-semibold leading-none">−</span>
        </button>

        {/* Reset View to Northern Vietnam */}
        <button
          onClick={handleResetView}
          title="Khôi phục toàn cảnh miền Bắc"
          aria-label="Toàn cảnh miền Bắc"
          className="w-10 h-10 rounded-xl bg-[#0E1626]/90 hover:bg-[#151F33] text-slate-300 hover:text-[#3DDC97] border border-[#243049] shadow-xl backdrop-blur-md flex items-center justify-center transition-all hover:border-[#3DDC97] active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Toggle Clustering */}
        <button
          onClick={() => setIsClustering((prev) => !prev)}
          title={isClustering ? 'Tắt gom cụm điểm đến' : 'Bật gom cụm điểm đến'}
          aria-label="Bật tắt gom cụm"
          className={`w-10 h-10 rounded-xl border shadow-xl backdrop-blur-md flex items-center justify-center transition-all active:scale-95 ${
            isClustering
              ? 'bg-[#0E1626]/90 text-[#48E3EF] border-[#48E3EF]/50 shadow-[#48E3EF]/10'
              : 'bg-[#0E1626]/90 text-slate-400 border-[#243049] hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Toggle Tile Layer */}
        <button
          onClick={toggleTileProvider}
          title={`Đổi kiểu bản đồ (${MAP_TILE_PROVIDERS[activeTileId]?.name})`}
          aria-label="Đổi kiểu bản đồ"
          className="w-10 h-10 rounded-xl bg-[#0E1626]/90 hover:bg-[#151F33] text-slate-300 hover:text-white border border-[#243049] shadow-xl backdrop-blur-md flex items-center justify-center transition-all hover:border-[#48E3EF] active:scale-95"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        {onToggleFullScreen && (
          <button
            onClick={onToggleFullScreen}
            title={isFullScreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình bản đồ'}
            aria-label="Toàn màn hình"
            className="w-10 h-10 rounded-xl bg-[#0E1626]/90 hover:bg-[#151F33] text-slate-300 hover:text-[#48E3EF] border border-[#243049] shadow-xl backdrop-blur-md flex items-center justify-center transition-all hover:border-[#48E3EF] active:scale-95"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Floating Map Legend Indicator (Positioned nicely above Leaflet attribution) */}
      <div className="absolute left-4 bottom-12 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#0E1626]/90 border border-[#243049] shadow-xl backdrop-blur-md text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#3DDC97]" />
          <span>{destinations.length} điểm hiển thị</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-slate-600" />
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-[#48E3EF]" />
          <span>Thu phóng {currentZoom}x</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-slate-600" />
        <button
          onClick={() => handleToggleIslandsInset(true)}
          className="flex items-center gap-1 text-amber-300 hover:underline font-semibold"
        >
          <Shield className="w-3 h-3 text-red-400" />
          <span>Biển đảo Việt Nam</span>
        </button>
      </div>

      {/* Dedicated Vietnam Islands Inset Component */}
      <VietnamIslandsInset
        isOpen={isIslandsInsetOpen}
        onClose={() => handleToggleIslandsInset(false)}
        onFlyToArchipelago={handleFlyToArchipelago}
        onFlyToIsland={handleFlyToIsland}
      />
    </div>
  );
};
