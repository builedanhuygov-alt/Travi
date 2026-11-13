/**
 * National Vietnam Tourism Intelligence Data Schema (Phase 1)
 * ==========================================================
 * Strict multi-tier schema supporting nationwide coverage across
 * Vietnam's 34 provincial administrative units (Post-2025 structure).
 *
 * Core Principles:
 * 1. Zero data loss: Preserves raw source metadata and full lineage.
 * 2. Separation of Coordinate Validity vs. Coordinate Verification.
 * 3. Conservative verification: source_url does NOT imply 'verified'.
 * 4. Provenance & Audit Trail on every entity.
 */

export type NationalVerificationStatus =
  | 'official_gov'      // Officially published by ministry or provincial Department of Tourism (Sở Du lịch / Sở VHTT&DL)
  | 'verified'          // Independently verified by ground-truth survey or authoritative gazetteer
  | 'needs_review'       // Ingested from secondary, editorial, or partner source; pending field review
  | 'unverified'        // Raw or self-reported data without third-party validation
  | 'rejected';         // Confirmed invalid, closed, or fabricated

export type CoordinateValidity =
  | 'valid'             // Numeric lat/lon strictly inside Vietnam territorial bounds (Lat: 8.0 - 24.0, Lon: 102.0 - 110.0)
  | 'out_of_bounds'      // Non-null coordinates falling outside Vietnam geographic boundary
  | 'missing';          // Null / undefined coordinates

export type CoordinateConfidence =
  | 'exact'             // Physical entrance, reception, or landmark gate surveyed on site
  | 'approximate'       // Village, commune center, or geographic bounding box midpoint
  | 'province_level'    // Administrative provincial center fallback placeholder
  | 'none';             // Coordinates completely unverified; MUST NOT be rendered as a map pin

export type SourceType =
  | 'provincial_portal'     // e.g. Sở VHTT&DL Sơn La, Sở Du lịch Hà Nội
  | 'national_authority'    // e.g. Cục Du lịch Quốc gia Việt Nam (VNAT)
  | 'cultural_department'   // e.g. Cục Di sản Văn hóa, Bảo tàng Lịch sử Quốc gia
  | 'open_street_map'       // Licensed geospatial community data (ODbL)
  | 'editorial_curated'     // Travi internal editorial research
  | 'partner_provider';     // Licensed verified local tour operator

export interface DataProvenance {
  source_id: string;
  source_name: string;
  source_url: string | null;
  source_date: string;
  source_type: SourceType;
  ingestion_batch_id: string;
  raw_record_id: string | null;
  license?: string | null;
  attribution_notes?: string | null;
}

export interface AuditEntry {
  timestamp: string;
  action: 'ingested' | 'normalized' | 'admin_matched' | 'coord_validated' | 'dedup_reviewed' | 'manually_verified' | 'flagged';
  agent: string;
  notes: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
}

export interface LocalizedNames {
  vi: string;
  en?: string;
  fr?: string;
  zh?: string;
  ja?: string;
  ko?: string;
  [locale: string]: string | undefined;
}

export interface BaseTourismEntity {
  id: string;
  name: string;
  localized_names: LocalizedNames;
  slug: string;
  description: string;
  short_description?: string;
  province_id: string | null;   // Canonical 2-digit province ID from the 34-unit master database (e.g. '01', '14')
  province_name_canonical: string | null;
  ward_id: string | null;       // Canonical 5-digit ward/commune ID from Decision 19/2025/QĐ-TTg
  ward_name_canonical: string | null;
  category: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  
  // Coordinate assessment
  coordinate_validity: CoordinateValidity;
  coordinate_confidence: CoordinateConfidence;
  
  // Verification & Provenance
  verification_status: NationalVerificationStatus;
  verification_reason?: string;
  provenance: DataProvenance;
  audit_trail: AuditEntry[];
  
  created_at: string;
  updated_at: string;
  last_verified_at: string | null;
}

export interface TourismPOI extends BaseTourismEntity {
  entity_type: 'tourism_poi';
  poi_category:
    | 'national_tourism_area'    // Khu du lịch quốc gia
    | 'provincial_tourism_area'  // Khu du lịch cấp tỉnh
    | 'tourism_spot'             // Điểm du lịch
    | 'cultural_historical_relic'// Di tích lịch sử - văn hóa
    | 'natural_landscape'        // Danh lam thắng cảnh
    | 'eco_tourism'              // Du lịch sinh thái
    | 'community_tourism'        // Du lịch cộng đồng
    | 'spiritual_tourism'        // Du lịch văn hóa - tâm linh
    | 'rural_agri_tourism'       // Du lịch nông thôn - nông nghiệp
    | 'adventure_trekking'       // Du lịch mạo hiểm - khám phá
    | 'other';
  experiences: string[];
  local_food: string[];
  cultural_highlights: string[];
  official_recognition?: string | null;
  managing_entity?: string | null;
  operating_status?: 'active' | 'under_investment' | 'seasonal' | 'closed';
  best_season?: string | null;
  recommended_duration?: string | null;
  ticket_price_notes?: string | null;   // Stored ONLY when officially documented; NEVER fabricated
  opening_hours_notes?: string | null;  // Stored ONLY when officially documented; NEVER fabricated
  historical_aliases: string[];
}

export interface CulturalHeritage extends BaseTourismEntity {
  entity_type: 'cultural_heritage';
  heritage_type:
    | 'national_treasure'       // Bảo vật quốc gia
    | 'tangible_heritage'       // Di sản văn hóa vật thể
    | 'intangible_unesco'       // Di sản văn hóa phi vật thể đại diện nhân loại (UNESCO)
    | 'national_intangible'     // Di sản văn hóa phi vật thể quốc gia
    | 'historical_monument';    // Di tích quốc gia đặc biệt
  dating?: string | null;
  culture_or_period?: string | null;
  cultural_significance?: string | null;
  holding_institution?: {
    name: string;
    address: string;
    city: string;
    website?: string | null;
    visitable_poi_id?: string | null;
  } | null;
  discovery_location?: {
    historical_commune?: string | null;
    historical_district?: string | null;
    historical_province?: string | null;
    year_discovered?: number | null;
    notes?: string | null;
  } | null;
  is_national_treasure: boolean;
  unesco_listed: boolean;
  unesco_year?: number | null;
}

export interface Festival extends BaseTourismEntity {
  entity_type: 'festival';
  lunar_date?: string | null;       // e.g. "Mùng 10 tháng 3 Âm lịch"
  solar_date_range?: string | null; // Approximate annual timing e.g. "Tháng 3 - Tháng 4 Dương lịch"
  frequency?: 'annual' | 'biennial' | 'periodic' | 'special';
  rituals: string[];
  activities: string[];
  organizer?: string | null;
  target_audience?: string[];
  unesco_recognized: boolean;
}

export interface LocalCuisine extends BaseTourismEntity {
  entity_type: 'local_cuisine';
  dish_type: 'soup_noodle' | 'roast_grill' | 'rice_dish' | 'cake_dessert' | 'beverage' | 'specialty_ingredient';
  signature_ingredients: string[];
  culinary_heritage_notes?: string | null;
  seasonal_availability?: string | null;
  famous_serving_localities: string[];
  dining_etiquette_notes?: string | null;
}

export interface Accommodation extends BaseTourismEntity {
  entity_type: 'accommodation';
  accommodation_type: 'homestay' | 'hotel' | 'resort' | 'community_lodge' | 'eco_retreat';
  star_rating?: number | null;
  community_operated: boolean;
  room_types_notes?: string | null;
  contact_notes?: string | null;
}

export interface TransportationHub extends BaseTourismEntity {
  entity_type: 'transportation_hub';
  hub_type: 'international_airport' | 'domestic_airport' | 'railway_station' | 'interprovincial_bus_terminal' | 'seaport_passenger_ferry';
  serving_provinces: string[];
  connected_routes: string[];
}

export interface TourismExperience extends BaseTourismEntity {
  entity_type: 'tourism_experience';
  experience_category: 'trekking' | 'craft_village' | 'culinary_tour' | 'cloud_hunting' | 'river_cruise' | 'cultural_exchange';
  difficulty_level?: 'easy' | 'moderate' | 'challenging';
  suitable_personas: Array<'FAMILY' | 'BACKPACKER' | 'SOLO' | 'EXPLORER'>;
}

export interface AdministrativeArea {
  province_id: string;
  name_local: string;
  name_en: string;
  slug: string;
  administrative_type: 'Centrally-Governed Municipality' | 'Province';
  region: 'Northern Vietnam' | 'Central Vietnam' | 'Central Highlands' | 'Southern Vietnam';
  subregion: string;
  center_coordinates: {
    lat: number;
    lon: number;
  };
  total_wards: number;
  merged_pre_2025_provinces: string[];
  historical_aliases: string[];
  legal_basis: string;
}

export interface TourismSource {
  id: string;
  name: string;
  organization: string;
  portal_url: string;
  license: string;
  source_type: SourceType;
  official_level: 'central_ministry' | 'provincial_department' | 'national_authority' | 'community_licensed';
  contact_email?: string | null;
  last_verified_at: string;
  notes: string;
}

/**
 * Deduplication Review Queue Record
 * Represents an ambiguous or uncertain duplicate pair preserved for human review.
 * NEVER automatically deleted.
 */
export interface DeduplicationReviewItem {
  review_id: string;
  incoming_record: BaseTourismEntity;
  existing_record: BaseTourismEntity;
  similarity_score: number; // 0.0 to 1.0
  match_reasons: string[];
  flagged_at: string;
  status: 'pending_review' | 'confirmed_same' | 'confirmed_distinct';
  reviewer_notes?: string;
}

/**
 * Nationwide Coverage Statistics per Province
 */
export interface ProvinceCoverageStats {
  province_id: string;
  province_name_local: string;
  province_name_en: string;
  region: string;
  total_poi_count: number;
  verified_poi_count: number;
  official_gov_poi_count: number;
  needs_review_poi_count: number;
  unverified_poi_count: number;
  poi_with_exact_coords: number;
  poi_with_approx_coords: number;
  poi_with_no_coords: number;
  cultural_heritage_count: number;
  local_cuisine_count: number;
  festivals_count: number;
  transportation_hubs_count: number;
  data_confidence_tier: 'ROBUST' | 'MODERATE' | 'SPARSE' | 'NO_VERIFIED_DATA';
}
