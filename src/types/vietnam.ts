export type VietnamRegion =
  | 'Northern Vietnam'
  | 'Central Vietnam'
  | 'Central Highlands'
  | 'Southern Vietnam';

export type VietnamCategory =
  | 'Nature & Mountains'
  | 'Beaches & Islands'
  | 'Heritage & History'
  | 'Food & Cuisine'
  | 'Culture & Festivals'
  | 'Adventure & Outdoor'
  | 'Relaxation & Wellness'
  | 'Hidden Gems'
  | 'Photography & Scenic';

export type BudgetTier = 'Budget' | 'Moderate' | 'Luxury';

export type TravelStyle =
  | 'Cultural & Heritage'
  | 'Adventure & Nature'
  | 'Culinary Discovery'
  | 'Relaxation & Wellness'
  | 'Photography & Scenic'
  | 'Unhurried Immersion';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface Attraction {
  id: string;
  name: string;
  vietnameseName: string;
  category: VietnamCategory;
  description: string;
  coordinates: GeoCoordinates;
  estimatedDuration: string;
  ticketPriceEstimateVND?: number;
  ticketPriceNote?: string;
  openingHoursEstimate?: string;
  highlights: string[];
  image: string;
}

export interface LocalExperienceItem {
  id: string;
  title: string;
  vietnameseTitle: string;
  category:
    | 'Cuisine'
    | 'Craft Village'
    | 'Local Market'
    | 'Festival'
    | 'Heritage'
    | 'Outdoor'
    | 'Wellness'
    | 'Culture & Festivals'
    | 'Adventure & Outdoor';
  location: string;
  destinationId: string;
  description: string;
  bestTimeOfDay?: 'Morning' | 'Afternoon' | 'Evening' | 'Full Day';
  estimatedCostVND?: string;
  highlights: string[];
  image: string;
  hostOrCraftsman?: string;
}

export interface DestinationFood {
  name: string;
  vietnameseName: string;
  description: string;
  estimatedPriceVND: string;
  recommendedVenues?: string[];
}

export interface ImageAttribution {
  photographer: string;
  source: string;
  license: string;
}

export type CoordinatePrecision =
  | 'Verified Exact Landmark'
  | 'Provincial Capital / Transit Gateway'
  | 'Regional Approximation (Unverified)';

export interface AdministrativeProvenanceMetadata {
  legalBasis: string; // Resolution No. 202/2025/QH15
  sourceName: string; // e.g. National Assembly / General Statistics Office
  sourceUrl?: string; // Authoritative URL
  lastVerifiedAt: string;
  verificationStatus: 'Verified Official Record' | 'Under Editorial Review';
  verificationNotes: string;
  dataTier: 'Official Government Record' | 'Verified Editorial' | 'Under Editorial Review';
  // Backward compatibility fields
  verifiedDate?: string;
  source?: string;
  notes?: string;
}

export interface DestinationProvenanceMetadata {
  sourceName: string;
  sourceUrl?: string;
  lastVerifiedAt: string;
  verificationStatus: 'Verified Official' | 'Verified Editorial' | 'Curated Partner' | 'Under Editorial Review' | 'Unverified';
  verificationNotes: string;
  coordinatePrecision?: CoordinatePrecision;
  // Backward compatibility fields
  source: string;
  verifiedDate: string;
  dataTier: 'Official Government Record' | 'Verified Editorial' | 'Curated Partner' | 'Under Editorial Review';
}

export interface VietnamAdministrativeUnit {
  id: string; // e.g. 'ad-tuyen-quang'
  officialVietnameseName: string; // e.g. 'Tỉnh Tuyên Quang'
  englishName: string; // e.g. 'Tuyen Quang Province'
  administrativeType: 'Centrally-Governed Municipality' | 'Province';
  region: VietnamRegion;
  administrativeSeat: string; // e.g. 'Thành phố Tuyên Quang'
  mergedPre2025Provinces: string[]; // Former provinces merged into this unit
  historicalAliases: string[]; // Searchable historical aliases
  touristDestinationIds: string[]; // Contained tourist destination IDs
  reorganizationSummary: string;
  provenanceMetadata: AdministrativeProvenanceMetadata;
}

export interface VietnamDestination {
  id: string;
  name: string;
  vietnameseName: string;
  provinceOrMunicipality: string;
  administrativeUnitId: string; // 2025 Administrative Unit ID
  officialAdministrativeName: string; // Current 2025 Official Administrative Name
  administrativeType: 'Centrally-Governed Municipality' | 'Province';
  administrativeRelationship: string; // Relationship explanation
  isFormerProvince: boolean;
  formerProvinceName?: string;
  historicalNames?: string[];
  historicalContext?: string;
  region: VietnamRegion;
  categories: VietnamCategory[];
  tagline: string;
  description: string;
  editorialSummary: string;
  heroImage: string;
  galleryImages: string[];
  imageAttribution: ImageAttribution;
  coordinates: GeoCoordinates;
  coordinatePrecision?: CoordinatePrecision;
  rating: number;
  reviewsCount: number;
  estimatedVisitDays: number;
  bestSeason: string;
  bestMonths: number[]; // 1 to 12
  weatherNote: string;
  mustTryFood: DestinationFood[];
  attractions: Attraction[];
  localExperiences: LocalExperienceItem[];
  transportationAdvice: {
    fromHanoi: string;
    fromSaigon: string;
    fromDanang: string;
    localTransit: string;
  };
  culturalEtiquetteTips: string[];
  budgetEstimates: {
    budgetDailyVND: number;
    moderateDailyVND: number;
    luxuryDailyVND: number;
  };
  isCurated: boolean;
  verificationStatus: 'Verified Editorial' | 'Curated Partner' | 'Under Editorial Review' | 'Unverified';
  provenanceMetadata: DestinationProvenanceMetadata;
}


