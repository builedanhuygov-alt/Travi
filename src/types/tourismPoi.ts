/**
 * Unified POI (Point of Interest) Schema for Travi
 * Designed to unify Vietnam Tourism Starter Dataset, Sơn La dataset,
 * Curated Travi destinations, and future province-level tourism datasets.
 */

export type PoiCategory =
  | 'Khu du lịch quốc gia'
  | 'Khu du lịch cấp tỉnh'
  | 'Điểm du lịch'
  | 'Di tích lịch sử - văn hóa'
  | 'Danh lam thắng cảnh'
  | 'Du lịch sinh thái'
  | 'Du lịch cộng đồng'
  | 'Du lịch văn hóa - tâm linh'
  | 'Du lịch nông thôn'
  | 'Du lịch mạo hiểm - trải nghiệm'
  | 'Khác';

export type PoiVerificationStatus = 'verified' | 'needs_review' | 'rejected';

export type CoordinateConfidence =
  | 'exact'          // Verified exact entrance / reception coordinates
  | 'approximate'    // Verified area center / village coordinates
  | 'province_level' // Generic provincial center placeholder
  | 'none';          // No coordinates verified; DO NOT display pin on map

export type PoiSourceType =
  | 'official_gov'      // e.g. Sở VHTT&DL, Cục Du lịch Quốc gia
  | 'starter_dataset'   // Initial research/starter dataset
  | 'editorial'         // Travi editorial curation
  | 'curated_partner';  // Verified local partner / authority

export interface UnifiedTourismPoi {
  id: string;
  name: string;
  vietnameseName: string;
  slug: string;
  provinceOrRegion: string;
  subregion: string;
  latitude: number | null;
  longitude: number | null;
  category: PoiCategory | string;
  shortDescription: string;
  longDescription: string;
  bestSeason: string;
  recommendedDuration: string;
  keyAttractions: string[];
  image: string | null;
  experiences: string[];
  localFood: string[];
  culturalHighlights: string[];
  source: string;
  sourceUrl: string | null;
  sourceType: PoiSourceType;
  verificationStatus: PoiVerificationStatus;
  coordinateConfidence: CoordinateConfidence;
  confidenceScore: number; // 0 to 100
  historicalAliases: string[];
  parentDestinationId: string | null;
  officialRecognition: string | null;
  sourceCount: number;
  communityMentioned: boolean;
  reviewNotes: string | null;
  lastReviewedDate: string;

  // Optional extensions for administration & provenance
  address?: string;
  operatingStatus?: string;
  managingEntity?: string;
  wardId?: string | null;
  provinceId?: string | null;
}

export interface PoiFilterOptions {
  searchQuery?: string;
  province?: string;
  subregion?: string;
  category?: string;
  verificationStatus?: PoiVerificationStatus;
  coordinateConfidence?: CoordinateConfidence;
  hasValidCoordinatesOnly?: boolean;
}

export interface PoiSummaryStats {
  totalPois: number;
  verifiedCount: number;
  needsReviewCount: number;
  rejectedCount: number;
  withCoordinatesCount: number;
  withoutCoordinatesCount: number;
  provincesCount: number;
  sourcesBreakdown: Record<string, number>;
  categoriesBreakdown: Record<string, number>;
}

