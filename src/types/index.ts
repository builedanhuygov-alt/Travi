export * from './vietnam.ts';

export interface DestinationCulturalDimensions {
  culturalInterests: string[]; // Cinema, narrative world-building, and cultural themes
  music: string[];             // Acoustic textures, soundscapes, instruments
  food: string[];              // Gastronomy, terroir, and culinary traditions
  architecture: string[];      // Spatial vernaculars, joinery, and design heritage
  art: string[];               // Living crafts, textiles, and tactile materials
  history: string[];           // Historical epochs, dynasties, and lineages
  nature: string[];            // Geological terrains, flora, and microclimates
  localExperiences: string[];  // Social rhythms, community rituals, and everyday life
}

export interface DestinationCulturalProfile extends DestinationCulturalDimensions {
  destinationId: string;
  culturalDepthScore: number;  // 0 - 100
  crowdIsolationScore: number; // 0 - 100
  paceStyle: 'Unhurried' | 'Deliberate' | 'Expedition' | 'Immersive' | 'Sensory' | 'Restorative';
  editorialSummary: string;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  tagline: string;
  description: string;
  heroImage: string;
  fallbackColor: string;
  rating: number;
  reviewsCount: number;
  tags: string[];
  vibe: string;
  idealDays: number;
  bestSeason: string;
  curatedExperience: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  editorialSummary?: string;
  culture?: DestinationCulturalProfile;
}

export interface TripDayActivity {
  id: string;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
  title: string;
  description: string;
  culturalPillar?: string;
  estimatedDuration?: string;
  unverifiedEstimateNotice?: string;
}

export interface TripDay {
  dayNumber: number;
  title: string;
  theme?: string;
  interestExplanation?: string;
  activities: TripDayActivity[];
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'upcoming' | 'completed';
  coverImage: string;
  daysCount: number;
  travelersCount: number;
  itineraryStops: string[];
  dayNotes?: Record<number, string>;
  notes?: string;
  destinationId?: string;
  tags?: string[];
  highlights?: string[];
  days?: TripDay[];
}

export interface Memory {
  id: string;
  title: string;
  location: string;
  country: string;
  date: string;
  image: string;
  note: string;
  badge: string;
  coordinates?: [number, number];
}

export interface Experience {
  id: string;
  title: string;
  location: string;
  category: 'Gastronomy' | 'Heritage' | 'Art & Craft' | 'Wild & Nature' | 'Wellness';
  duration: string;
  groupSize: string;
  rating: number;
  reviewsCount: number;
  image: string;
  hostName: string;
  hostTitle: string;
  pricePerPerson: string;
  highlight: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'copilot';
  timestamp: string;
  content: string;
  suggestions?: string[];
  itineraryTeaser?: {
    destination: string;
    duration: string;
    highlights: string[];
  };
  provenance?: {
    providerName: string;
    isLiveAi: boolean;
    modeDescription: string;
  };
}


export interface TravelerProfile {
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  homeBase: string;
  countriesVisited: number;
  savedTripsCount: number;
  memoriesLogged: number;
  travelDna: {
    primary: string;
    secondary: string;
    style: string;
    pace: string;
  };
  badges: string[];
}

export interface TasteProfile {
  films: string[];
  music: string[];
  food: string[];
  architecture: string[];
  art: string[];
  history: string[];
  nature: string[];
  localCulture: string[];
  updatedAt?: string;
  isCustomized?: boolean;
}

export interface ScoringBreakdown {
  matchedTraitsCount: number;
  totalUserPreferencesCount: number;
  matchedPillarsCount: number;
  activePillarsCount: number;
  preferenceCoverageRate: number; // 0.0 - 1.0 (trait recall)
  pillarBreadthRate: number;       // 0.0 - 1.0 (proportion of active pillars with matches)
  meanPillarMatchRate?: number;    // 0.0 - 1.0 (average per-pillar match fraction)
  rawScore: number;               // 0 - 100
}

export interface DestinationAffinityResult {
  destinationId: string;
  affinityScore: number; // 0 - 100
  matchLevel:
    | 'Strong Alignment'
    | 'Moderate Alignment'
    | 'Emerging Alignment'
    | 'Low Overlap'
    | 'No Overlap'
    | 'Uncalibrated'
    | 'Curated Baseline'
    | 'Exceptional Resonance'
    | 'High Resonance'
    | 'Harmonic Affinity';
  topMatchedPillars: {
    pillar: string;
    matchedTraits: string[];
  }[];
  rationale: string;
  scoringBreakdown: ScoringBreakdown;
  isSimulatedDemo: true;
  isCalculated: boolean;
}
