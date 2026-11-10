import type { VietnamRegion, GeoCoordinates, ImageAttribution, DestinationProvenanceMetadata, TravelStyle } from './vietnam.ts';

export type ExperienceCategory =
  | 'Food & Culinary'
  | 'Culture & Heritage'
  | 'Nature & Adventure'
  | 'Arts & Crafts'
  | 'Local Life'
  | 'Festivals & Events'
  | 'Wellness & Retreats'
  | 'Family & Leisure';

export interface StandaloneExperience {
  id: string;
  slug: string;
  title: string;
  vietnameseTitle: string;
  category: ExperienceCategory;
  region: VietnamRegion;
  destinationId: string;
  destinationName: string;
  location: string;
  coordinates?: GeoCoordinates;
  description: string;
  highlights: string[];
  duration: string;
  bestTimeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Full Day' | 'Seasonal';
  estimatedCostVND: string;
  hostOrCraftsman?: string;
  image: string;
  imageAttribution?: ImageAttribution;
  isCurated: boolean;
  verificationStatus: 'Verified Editorial' | 'Curated Partner' | 'Under Editorial Review';
  provenanceMetadata: DestinationProvenanceMetadata;
}

export type StoryCategory =
  | 'Local Culture'
  | 'Food Origins'
  | 'Heritage & Lineage'
  | 'Craft Villages'
  | 'Photo Essay'
  | 'Travel Guide';

export interface StorySection {
  heading?: string;
  content?: string;
  image?: string;
  quote?: string;
  callout?: string;
}

export interface StorySource {
  title: string;
  url?: string;
  publisher: string;
}

export interface TraviStory {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: StoryCategory;
  region: VietnamRegion;
  destinationIds: string[];
  experienceIds?: string[];
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  editor?: {
    name: string;
    role: string;
  };
  publishedAt: string;
  readTimeMinutes: number;
  heroImage: string;
  imageAttribution: ImageAttribution;
  sections: StorySection[];
  sources: StorySource[];
  tags: string[];
  featured?: boolean;
}

export interface DiscoveryCollection {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  destinationIds: string[];
  experienceIds: string[];
  storyIds: string[];
  isCuratedEditorial?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserDiscoveryPreferences {
  interests: string[];
  preferredRegions: VietnamRegion[];
  travelStyles: TravelStyle[];
}

export interface DiscoveryRecommendation<T = unknown> {
  itemType: 'destination' | 'experience' | 'story';
  id: string;
  item: T;
  score: number;
  recommendationReason: string;
  signals: string[];
}
