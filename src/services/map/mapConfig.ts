import type { MapTileProviderConfig, NorthMapCategory, NorthMapSubregion } from '../../types/northMap.ts';

// Centralized tile provider configurations compliant with OpenStreetMap Tile Usage Policy
// Standard OSM raster tile endpoint: https://tile.openstreetmap.org/{z}/{x}/{y}.png
export const MAP_TILE_PROVIDERS: Record<string, MapTileProviderConfig> = {
  osmStandard: {
    id: 'osmStandard',
    name: 'OpenStreetMap Tiêu Chuẩn',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  osmHOT: {
    id: 'osmHOT',
    name: 'OpenStreetMap Nhân Đạo (HOT)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  },
};

// Default active provider: OpenStreetMap Tiêu Chuẩn
export const DEFAULT_TILE_PROVIDER_ID = 'osmStandard';

// Geographic bounds for Northern Vietnam (includes Red River Delta, Northwest, Northeast, Coast, and North Central extension)
export const NORTH_VIETNAM_BOUNDS = {
  minLat: 18.0, // North Central extension (Hà Tĩnh / Cẩm Xuyên)
  maxLat: 23.4, // Northernmost border at Lũng Cú (23.36°N)
  minLng: 102.1, // Western border at A Pa Chải / Điện Biên (102.14°E)
  maxLng: 108.3, // Easternmost islands & Móng Cái border (108.0°E)
  defaultCenter: [21.3, 105.3] as [number, number],
  defaultZoom: 7,
};

// Subregion bounds for "Fit to Region" feature
export const SUBREGION_BOUNDS: Record<NorthMapSubregion, { center: [number, number]; zoom: number; bounds: [[number, number], [number, number]] }> = {
  'Tây Bắc': {
    center: [21.8, 103.8],
    zoom: 8,
    bounds: [[20.5, 102.1], [22.8, 104.8]],
  },
  'Đông Bắc': {
    center: [22.6, 105.8],
    zoom: 8,
    bounds: [[21.4, 104.8], [23.4, 106.9]],
  },
  'Đồng bằng sông Hồng': {
    center: [20.8, 105.9],
    zoom: 9,
    bounds: [[20.2, 105.2], [21.5, 106.6]],
  },
  'Ven biển Bắc Bộ': {
    center: [20.9, 107.3],
    zoom: 9,
    bounds: [[20.1, 106.6], [21.6, 108.1]],
  },
  'Bắc Trung Bộ mở rộng': {
    center: [19.2, 105.5],
    zoom: 8,
    bounds: [[18.1, 104.6], [20.5, 106.1]],
  },
};

// Visual styling tokens by category
export const CATEGORY_STYLE_CONFIG: Record<
  NorthMapCategory,
  {
    color: string;
    bgColor: string;
    borderColor: string;
    iconName: string;
    label: string;
  }
> = {
  'Cảnh quan thiên nhiên': {
    color: '#3DDC97',
    bgColor: 'rgba(61, 220, 151, 0.15)',
    borderColor: '#3DDC97',
    iconName: 'Compass',
    label: 'Cảnh quan thiên nhiên',
  },
  'Núi non & Đỉnh cao': {
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#06B6D4',
    iconName: 'Mountain',
    label: 'Núi non & Đỉnh cao',
  },
  'Thác nước & Sông hồ': {
    color: '#48E3EF',
    bgColor: 'rgba(72, 227, 239, 0.15)',
    borderColor: '#48E3EF',
    iconName: 'Droplets',
    label: 'Thác nước & Sông hồ',
  },
  'Biển đảo & Bờ biển': {
    color: '#38BDF8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
    iconName: 'Palmtree',
    label: 'Biển đảo & Bờ biển',
  },
  'Di tích lịch sử': {
    color: '#F5A623',
    bgColor: 'rgba(245, 166, 35, 0.15)',
    borderColor: '#F5A623',
    iconName: 'Landmark',
    label: 'Di tích lịch sử',
  },
  'Văn hóa & Di sản': {
    color: '#9875FF',
    bgColor: 'rgba(152, 117, 255, 0.15)',
    borderColor: '#9875FF',
    iconName: 'Sparkles',
    label: 'Văn hóa & Di sản',
  },
  'Ẩm thực bản địa': {
    color: '#F43F5E',
    bgColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: '#F43F5E',
    iconName: 'Utensils',
    label: 'Ẩm thực bản địa',
  },
  'Thám hiểm & Trekking': {
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: '#F97316',
    iconName: 'Footprints',
    label: 'Thám hiểm & Trekking',
  },
  'Du lịch sinh thái': {
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
    iconName: 'Trees',
    label: 'Du lịch sinh thái',
  },
  'Đô thị & Cửa ngõ': {
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366F1',
    iconName: 'Building2',
    label: 'Đô thị & Cửa ngõ',
  },
};
