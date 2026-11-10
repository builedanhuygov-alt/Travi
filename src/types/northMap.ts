export type NorthMapSubregion =
  | 'Tây Bắc'
  | 'Đông Bắc'
  | 'Đồng bằng sông Hồng'
  | 'Ven biển Bắc Bộ'
  | 'Bắc Trung Bộ mở rộng';

export type NorthMapCategory =
  | 'Cảnh quan thiên nhiên'
  | 'Núi non & Đỉnh cao'
  | 'Thác nước & Sông hồ'
  | 'Biển đảo & Bờ biển'
  | 'Di tích lịch sử'
  | 'Văn hóa & Di sản'
  | 'Ẩm thực bản địa'
  | 'Thám hiểm & Trekking'
  | 'Du lịch sinh thái'
  | 'Đô thị & Cửa ngõ';

export type CoordinateVerificationStatus = 'verified' | 'needs_review' | 'unresolved';

export type CoordinateConfidence =
  | 'exact_landmark'
  | 'administrative_center'
  | 'scenic_pass'
  | 'island_centroid'
  | 'scenic_lake'
  | 'approximate';

export interface NorthDestinationRecord {
  id: string;
  name: string;
  vietnameseName: string;
  slug: string;
  provinceOrRegion: string;
  subregion: NorthMapSubregion;
  latitude: number;
  longitude: number;
  category: NorthMapCategory;
  shortDescription: string;
  longDescription?: string;
  bestSeason?: string;
  recommendedDuration?: string;
  keyAttractions?: string[];
  image: string;
  galleryImages?: string[];
  experiences: string[];
  localFood: string[];
  culturalHighlights: string[];
  source: string;
  sourceUrl?: string;
  sourceType?:
    | 'Official tourism source'
    | 'Official heritage or protected-area source'
    | 'Travel editorial'
    | 'Community contribution'
    | 'Manually reviewed content';
  verificationStatus: CoordinateVerificationStatus;
  coordinateConfidence: CoordinateConfidence;
  confidenceScore: number; // 0.0 to 1.0
  historicalAliases?: string[];
  linkedDestinationId?: string; // Links to existing vietnamDestinations id if available
  parentDestinationId?: string; // Links to parent hub/area if this is a sub-attraction
  officialRecognition?: string; // e.g. UNESCO, Di tích Quốc gia Đặc biệt
  sourceCount?: number; // Number of independent sources corroborating this destination
  communityMentioned?: boolean; // Flagged in traveler & hiking community discussions
  reviewNotes?: string;
  lastReviewedDate?: string;
}

export interface MapTileProviderConfig {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

export interface RouteWaypoint {
  destination: NorthDestinationRecord;
  order: number;
}

export interface RouteCalculationResult {
  waypoints: RouteWaypoint[];
  totalGeographicDistanceKm: number;
  estimatedDriveTimeHours?: number;
  terrainType: 'mountain_pass' | 'delta_highway' | 'mixed_terrain';
  distanceType: 'straight_line_geographic' | 'routed_network';
  coordinates: [number, number][];
}
