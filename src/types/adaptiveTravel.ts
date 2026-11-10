/**
 * Adaptive Travel Intelligence Types
 * Defines Customer Classification, User Travel Profile, Adaptive Recommendations,
 * Weather Assessment, Route Integration, and API schemas.
 */

import type { VietnamCategory } from './vietnam.ts';

export type CustomerType =
  | 'INTERNATIONAL'   // Foreign visitors traveling in Vietnam
  | 'DOMESTIC'        // Vietnamese visitors traveling outside their home province
  | 'LOCAL'           // Visitors exploring within their home province or local area
  | 'INTERPROVINCIAL';// Visitors traveling across Vietnamese provinces (intercity/multi-region)

// Distinct Multi-Dimensional Customer Profiling Attributes
export type TravelMarket = 'DOMESTIC' | 'INTERNATIONAL';

export type TravelScope = 'LOCAL' | 'INTERPROVINCIAL' | 'INTERNATIONAL_TRAVEL';

export type TravelPersona = 'FAMILY' | 'BACKPACKER' | 'SOLO' | 'EXPLORER';

export type TravelLanguage = 'VI' | 'EN' | 'OTHER';

export interface LocationHierarchy {
  country?: string;
  province?: string;
  city?: string;
}

export type PreferredLanguage = 'vi' | 'en' | 'fr' | 'ja' | 'ko' | 'zh';

export type BudgetTier = 'Budget' | 'Moderate' | 'Luxury';

export type TravelCompanions = 'Solo' | 'Couple' | 'Family' | 'Friends' | 'Small Group';

export type TransportationPreference =
  | 'Reunification Express Train'
  | 'Scenic Limousine Sleeper Bus'
  | 'Private Car & Driver'
  | 'Motorbike Loop'
  | 'Domestic Flights'
  | 'Local Walking & Transit';

export interface UserTravelProfile {
  // Multi-Dimensional coexistence
  market?: TravelMarket;
  origin_location?: LocationHierarchy;
  destination_location?: LocationHierarchy;
  travel_scope?: TravelScope;
  persona?: TravelPersona;
  language?: TravelLanguage;

  // Primary & Backward-Compatible fields
  customer_type?: CustomerType;
  origin_country?: string; // e.g. "Vietnam", "France", "United States", "Japan"
  origin_province?: string; // e.g. "Hà Nội", "Sơn La", "TP. Hồ Chí Minh"
  destination: string; // e.g. "Sơn La", "Hà Nội", "Đà Nẵng"
  preferred_language: PreferredLanguage;
  budget: BudgetTier;
  travel_duration: number; // in days (1 - 30)
  group_size?: number;
  travel_companions?: TravelCompanions;
  interests: string[];
  transportation_preference?: TransportationPreference;
  accessibility_requirements?: string[]; // e.g. 'wheelchair_accessible', 'elder_friendly', 'child_friendly'
}

export interface CustomerClassificationResult {
  detected_type: CustomerType;
  confidence: number; // 0.0 - 1.0
  reasons: string[];
  is_overridden: boolean;
  available_types: CustomerType[];
}

export interface WeatherAssessment {
  destination: string;
  targetMonth: number; // 1 - 12
  isOptimalSeason: boolean;
  suitabilityScore: number; // 0 - 100
  seasonName: string;
  climateZone: 'North Vietnam' | 'Central Vietnam' | 'South Vietnam' | 'Highlands';
  advisory: string;
  temperatureRange: string;
  rainRisk: 'Low' | 'Moderate' | 'High';
}

export interface AdaptiveRouteMetrics {
  origin: string;
  destination: string;
  straightLineDistanceKm: number;
  estimatedRoadDistanceKm: number;
  estimatedTravelTimeHours: number;
  recommendedTransport: TransportationPreference;
  terrainType: 'mountain_pass' | 'delta_highway' | 'mixed_terrain';
  notes: string;
}

export interface AdaptiveDestinationRecommendation {
  id: string;
  name: string;
  vietnameseName: string;
  provinceOrRegion: string;
  subregion: string;
  category: VietnamCategory | string;
  overallScore: number; // 0 - 100
  customerTypeAlignmentScore: number; // 0 - 100
  interestMatchScore: number; // 0 - 100
  budgetAlignmentScore: number; // 0 - 100
  weatherScore: number; // 0 - 100
  matchReasons: string[];
  customerTypeHighlight: string;
  suggestedDuration: string;
  mustTryLocalFood: string[];
  culturalHighlights: string[];
  weatherInfo?: WeatherAssessment;
  routeInfo?: AdaptiveRouteMetrics;
  image: string | null;
  verificationStatus: 'verified' | 'needs_review' | 'rejected';
  coordinateConfidence: 'exact' | 'approximate' | 'province_level' | 'none';
  source: string;
  isPoi: boolean; // true if from UnifiedTourismPoi, false if from VietnamDestination
}

export interface AdaptiveItineraryDay {
  dayNumber: number;
  title: string;
  theme: string;
  rationaleForCustomerType: string;
  activities: Array<{
    timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
    title: string;
    description: string;
    location: string;
    estimatedDuration: string;
    estimatedCostVND?: number;
    unverifiedNotice?: string;
  }>;
  dailyEstimatedCostVND: number;
}

export interface AdaptiveItineraryResult {
  id: string;
  customerType: CustomerType;
  destination: string;
  durationDays: number;
  budgetTier: BudgetTier;
  title: string;
  summary: string;
  adaptiveRationale: string;
  days: AdaptiveItineraryDay[];
  weatherAdvisory?: WeatherAssessment;
  routeSummary?: AdaptiveRouteMetrics;
  totalEstimatedCostVND: number;
  totalEstimatedCostUSD: number;
  costDisclaimer: string;
  dataSources: string[];
  provenance: {
    generator: string;
    isLiveAiGenerated: boolean;
    hasRetrievedGrounding: boolean;
  };
}

export interface AdaptiveTravelHealthResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  services: {
    sharedPoiDatabase: {
      available: boolean;
      totalRecords: number;
      provincesCount: number;
    };
    classifier: {
      available: boolean;
      supportedTypes: CustomerType[];
    };
    weatherEngine: {
      available: boolean;
      zonesCovered: number;
    };
    routeEngine: {
      available: boolean;
      formula: string;
    };
    aiInference: {
      isAvailable: boolean;
      provider: string;
      model: string;
      mode: 'live_qwen2_gpu' | 'deterministic_fallback';
    };
  };
}
