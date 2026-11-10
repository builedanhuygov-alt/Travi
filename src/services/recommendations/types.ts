import type { Destination, TasteProfile, ScoringBreakdown } from '../../types/index.ts';

export interface RecommendationQuery {
  tasteProfile: TasteProfile;
  destinations?: Destination[];
  categoryFilter?: string;
  regionFilter?: string;
  searchQuery?: string;
  sortBy?: 'affinity' | 'rating' | 'days' | 'curated';
  customSignalEntityIds?: string[];
  signalTags?: string[];
  location?: string;
  explainability?: boolean;
}

export type RecommendationMatchLevel =
  | 'Strong Alignment'
  | 'Moderate Alignment'
  | 'Emerging Alignment'
  | 'Low Overlap'
  | 'No Overlap'
  | 'Uncalibrated'
  | 'Curated Baseline'
  // Backwards compatibility aliases
  | 'Exceptional Resonance'
  | 'High Resonance'
  | 'Harmonic Affinity';

export type DiscoveryLaneType =
  | 'CULTURAL_MATCHES'
  | 'UNEXPECTED_DISCOVERIES'
  | 'CULTURAL_WORLDS'
  | 'BEYOND_COMFORT_ZONE'
  | 'BUILD_JOURNEY';

export interface DiscoveryLane {
  id: DiscoveryLaneType;
  title: string;
  badge: string;
  subtitle: string;
  selectionRule: string;
  recommendations: DestinationRecommendation[];
}

export interface DestinationRecommendation {
  destination: Destination;
  score: number; // Final blended ranking score (0 - 100)
  matchLevel: RecommendationMatchLevel;
  matchedPillars: {
    pillar: string;
    matchedTraits: string[];
  }[];
  explanation: string;
  explanationTag?: string;
  scoringBreakdown: ScoringBreakdown;
  providerId: string;
  isSimulatedDemo: boolean;
  isCalculated: boolean;
  culturalRelevanceScore?: number;
  provenance?: 'vietnam-verified' | 'verified-catalog' | 'local-deterministic';
  diversityScore?: number;
  discoveryLane?: DiscoveryLaneType;
  distinctiveFeature?: string;
  signatureExperience?: string;
  verifiedEvidence?: string[];
  generatedInterpretation?: string;
  retrievalTimestamp?: string;
}

export interface ProviderMetadata {
  id: string;
  name: string;
  version: string;
  isLiveProvider: boolean;
  disclaimer: string;
}

export interface RecommendationResult {
  recommendations: DestinationRecommendation[];
  hasActivePreferences: boolean;
  totalPreferencesCount: number;
  activePillarsCount: number;
  totalMatchesFound: number;
  providerInfo: ProviderMetadata;
  lanes?: DiscoveryLane[];
  diversityMetrics?: {
    regionsRepresentedCount: number;
    countriesRepresentedCount: number;
    dominantCategory: string;
    entropyScore: number;
  };
}

/**
 * Stable interface for Travi Vietnam recommendation engines.
 */
export interface RecommendationProvider {
  id: string;
  name: string;
  getMetadata(): ProviderMetadata;
  getRecommendations(query: RecommendationQuery): RecommendationResult;
  getDestinationAffinity(
    destinationId: string,
    tasteProfile: TasteProfile,
    destinations?: Destination[]
  ): DestinationRecommendation | null;
}
