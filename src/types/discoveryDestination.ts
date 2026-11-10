import type { VietnamRegion } from './vietnam.ts';
import type { NorthMapCategory, NorthMapSubregion } from './northMap.ts';

export type DestinationDataStatus = 'verified' | 'needs_review' | 'draft' | 'unresolved';

export type CoordinateStatus =
  | 'exact_landmark'
  | 'administrative_center'
  | 'scenic_pass'
  | 'island_centroid'
  | 'scenic_lake'
  | 'approximate'
  | 'unresolved';

export type SourceType =
  | 'Official tourism source'
  | 'Official heritage or protected-area source'
  | 'Travel editorial'
  | 'Community contribution'
  | 'AI-assisted draft'
  | 'Manually reviewed content';

export interface SourceReference {
  name: string;
  sourceType: SourceType;
  url?: string;
  notes?: string;
  verifiedAt?: string;
}

/**
 * Standardized discovery destination model.
 * Serves as the normalized view over existing canonical datasets without duplicating records.
 */
export interface DiscoveryDestination {
  id: string;
  name: string;
  vietnameseName: string;
  slug: string;
  aliases: string[];
  currentAdministrativeRegion: string;
  historicalAdministrativeNames: string[];
  subregion: NorthMapSubregion | 'Chưa phân vùng';
  macroRegion: VietnamRegion;
  latitude: number;
  longitude: number;
  category: NorthMapCategory | string;
  shortDescription: string;
  longDescription?: string;
  images: string[];
  experiences: string[];
  localFood: string[];
  culturalHighlights: string[];
  nearbyDestinationIds: string[];
  bestSeason?: string;
  recommendedDuration?: string;
  sourceReferences: SourceReference[];
  dataStatus: DestinationDataStatus;
  coordinateStatus: CoordinateStatus;
  coordinateConfidenceScore: number; // 0.0 to 1.0
  lastReviewedAt: string;
  canonicalSource: 'vietnamData' | 'northVietnamData';
  linkedParentDestinationId?: string;
}
