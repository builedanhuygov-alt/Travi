/**
 * Cultural Data API Schema & Types
 * Enforces strict separation between:
 * 1. Cultural Asset (Hiện vật văn hóa, Bảo vật quốc gia, Di sản phi vật thể)
 * 2. Cultural Institution (Bảo tàng, Viện lưu trữ, Đơn vị bảo tồn)
 * 3. Visit-able POI (Điểm du lịch tham quan với cổng vào, giờ mở cửa)
 */

export type CulturalAssetType =
  | 'artifact'             // Hiện vật bảo tàng, cổ vật, bảo vật quốc gia
  | 'intangible_heritage'  // Di sản văn hóa phi vật thể (hát then, xòe thái, ca trù...)
  | 'monument'             // Công trình kiến trúc nghệ thuật, bia đá
  | 'documentary_heritage';// Mộc bản, châu bản, di văn

export interface CulturalInstitution {
  id: string;
  name: string;
  slug: string;
  institutionType: 'museum' | 'research_institute' | 'conservation_center' | 'monument_management';
  address: string;
  city: string;
  website?: string;
  // Visitable POI reference if this institution is open to the public
  visitablePoiId?: string;
}

export interface VisitablePoiRef {
  poiId: string;
  poiName: string;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  coordinateConfidence: 'exact' | 'approximate' | 'none';
  entranceAddress: string;
  openingHoursNote: string;
  visitingGuideUrl?: string;
}

export interface CulturalAsset {
  id: string;
  slug: string;
  name: string;
  vietnameseName: string;
  assetType: CulturalAssetType;
  dating: string; // e.g., "Thế kỷ II - III TCN", "Thời Lý", "Thời Lê Sơ"
  cultureOrPeriod: string; // e.g., "Văn hóa Đông Sơn", "Văn hóa Sa Huỳnh"
  shortDescription: string;
  fullDescription: string;
  culturalSignificance: string;
  
  // Physical location & Custody
  holdingInstitution: CulturalInstitution;
  
  // Separation of Artifact vs Visitable POI:
  // Artifact coordinates are strictly null or denote discovery location, NEVER the museum entrance
  discoveryLocation?: {
    communeOrWard?: string;
    district?: string;
    province: string;
    yearDiscovered?: number;
    notes?: string;
  };

  // Visitable destination where tourists can observe this asset
  visitableVenue?: VisitablePoiRef;

  // National Recognition
  isNationalTreasure: boolean;
  nationalTreasureDecision?: string;
  recognitionYear?: number;
  
  images: Array<{
    url: string;
    caption: string;
    photographerOrSource: string;
    isPrimary: boolean;
  }>;

  tags: string[];
  provenance: {
    sourceName: string;
    sourceUrl?: string;
    isMock: boolean;
    verificationStatus: 'verified_official' | 'editorial_review';
    lastUpdated: string;
  };
}

export interface CulturalAssetQueryParams {
  q?: string;
  type?: CulturalAssetType | 'all';
  limit?: number;
  offset?: number;
}

export interface CulturalAssetListResponse {
  total: number;
  limit: number;
  offset: number;
  items: CulturalAsset[];
  mode: 'DEMO' | 'LIVE';
}

export interface CulturalAssetDetailResponse {
  asset: CulturalAsset;
  mode: 'DEMO' | 'LIVE';
}

