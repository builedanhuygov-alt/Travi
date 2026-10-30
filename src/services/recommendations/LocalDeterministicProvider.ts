import type { Destination, TasteProfile } from '../../types/index.ts';
import { sampleDestinations } from '../../data/sampleData.ts';
import { partitionDiscoveryLanes } from './pipeline/RecommendationPipeline.ts';
import type {
  RecommendationProvider,
  RecommendationQuery,
  RecommendationResult,
  DestinationRecommendation,
  ProviderMetadata,
  RecommendationMatchLevel,
} from './types.ts';

const PILLAR_MAPPINGS = [
  { profileKey: 'films', cultureKey: 'culturalInterests', label: 'Films & Cinema' },
  { profileKey: 'music', cultureKey: 'music', label: 'Music & Soundscapes' },
  { profileKey: 'food', cultureKey: 'food', label: 'Food & Gastronomy' },
  { profileKey: 'architecture', cultureKey: 'architecture', label: 'Architecture & Spaces' },
  { profileKey: 'art', cultureKey: 'art', label: 'Art & Artisan Craft' },
  { profileKey: 'history', cultureKey: 'history', label: 'History & Heritage' },
  { profileKey: 'nature', cultureKey: 'nature', label: 'Nature & Terrains' },
  { profileKey: 'localCulture', cultureKey: 'localExperiences', label: 'Local Culture & Pace' },
] as const;

function normalize(str: string): string {
  return str.toLowerCase().trim();
}

function stripDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function matchTrait(userTrait: string, destTrait: string): boolean {
  const u = normalize(userTrait);
  const d = normalize(destTrait);
  if (u === d || u.includes(d) || d.includes(u)) return true;

  const uClean = stripDiacritics(u);
  const dClean = stripDiacritics(d);
  if (uClean === dClean || uClean.includes(dClean) || dClean.includes(uClean)) return true;

  const stopWords = new Set(['and', 'the', 'with', 'from', 'into', 'for', 'over']);
  const uWords = uClean.split(/[\s,;&/]+/).filter((w) => w.length >= 4 && !stopWords.has(w));
  for (const w of uWords) {
    if (dClean.includes(w)) return true;
  }

  return false;
}

export class LocalDeterministicRecommendationProvider implements RecommendationProvider {
  public readonly id = 'local-deterministic';
  public readonly name = 'Vietnam Cultural Discovery Engine';

  public getMetadata(): ProviderMetadata {
    return {
      id: this.id,
      name: this.name,
      version: 'v1.0.0',
      isLiveProvider: true,
      disclaimer:
        'Scores represent deterministic cultural trait intersection across verified regional Vietnamese heritage. Scores are not probabilities of traveler satisfaction, but transparent measures of cultural resonance.',
    };
  }

  public getDestinationAffinity(
    destinationId: string,
    tasteProfile: TasteProfile,
    destinationsList: Destination[] = sampleDestinations
  ): DestinationRecommendation | null {
    const destination = destinationsList.find((d) => d.id === destinationId);
    if (!destination) return null;

    return this.scoreDestination(destination, tasteProfile);
  }

  public getRecommendations(query: RecommendationQuery): RecommendationResult {
    const allDestinations = query.destinations || sampleDestinations;
    const { tasteProfile, categoryFilter = 'All', regionFilter = 'All', searchQuery = '', sortBy = 'affinity' } = query;

    // Count user total preferences and active pillars
    let totalPreferencesCount = 0;
    let activePillarsCount = 0;

    for (const mapping of PILLAR_MAPPINGS) {
      const selections = (tasteProfile[mapping.profileKey] as string[]) || [];
      if (selections.length > 0) {
        totalPreferencesCount += selections.length;
        activePillarsCount += 1;
      }
    }

    const hasActivePreferences = totalPreferencesCount > 0;

    // Filter destinations first
    const filtered = allDestinations.filter((dest) => {
      const q = normalize(searchQuery);
      const matchesSearch =
        q === '' ||
        normalize(dest.name).includes(q) ||
        normalize(dest.country).includes(q) ||
        normalize(dest.region).includes(q) ||
        normalize(dest.tagline).includes(q) ||
        dest.tags.some((t) => normalize(t).includes(q));

      const matchesCategory =
        categoryFilter === 'All' ||
        dest.tags.some((t) => normalize(t).includes(normalize(categoryFilter)));

      const matchesRegion =
        regionFilter === 'All' || normalize(dest.region) === normalize(regionFilter);

      return matchesSearch && matchesCategory && matchesRegion;
    });

    // Score all filtered destinations deterministically
    const scored = filtered.map((dest) => this.scoreDestination(dest, tasteProfile));

    // Sort according to requested strategy
    const sorted = scored.sort((a, b) => {
      if (sortBy === 'affinity') {
        // If affinity scores are equal, fallback to rating descending
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.destination.rating - a.destination.rating;
      }
      if (sortBy === 'rating') {
        return b.destination.rating - a.destination.rating;
      }
      if (sortBy === 'days') {
        return b.destination.idealDays - a.destination.idealDays;
      }
      return 0; // 'curated' keeps original order
    });

    const totalMatchesFound = sorted.filter((r) => r.score > 0).length;
    const lanes = partitionDiscoveryLanes(sorted);

    return {
      recommendations: sorted,
      hasActivePreferences,
      totalPreferencesCount,
      activePillarsCount,
      totalMatchesFound,
      providerInfo: this.getMetadata(),
      lanes,
    };
  }

  private scoreDestination(
    destination: Destination,
    tasteProfile: TasteProfile
  ): DestinationRecommendation {
    const culture = destination.culture;

    // Extract active pillars from user profile
    const activePillars: { label: string; selections: string[]; cultureTraits: string[] }[] = [];
    let totalUserPreferences = 0;

    for (const mapping of PILLAR_MAPPINGS) {
      const selections = (tasteProfile[mapping.profileKey] as string[]) || [];
      const cultureTraits = culture ? ((culture as any)[mapping.cultureKey] as string[]) || [] : [];

      if (selections.length > 0) {
        totalUserPreferences += selections.length;
        activePillars.push({
          label: mapping.label,
          selections,
          cultureTraits,
        });
      }
    }

    // Edge Case: Empty profile (user has not selected any preferences)
    if (totalUserPreferences === 0) {
      return {
        destination,
        score: 75,
        matchLevel: 'Curated Baseline',
        matchedPillars: [],
        explanation: 'Curated editorial recommendation. Calibrate your preferences in the Travel Studio for deeper personalization.',
        scoringBreakdown: {
          matchedTraitsCount: 0,
          totalUserPreferencesCount: 0,
          matchedPillarsCount: 0,
          activePillarsCount: 0,
          preferenceCoverageRate: 0,
          pillarBreadthRate: 0,
          meanPillarMatchRate: 0,
          rawScore: 75,
        },
        providerId: this.id,
        isSimulatedDemo: false,
        isCalculated: true,
      };
    }

    // Match profile selections against destination traits
    const matchedPillars: { pillar: string; matchedTraits: string[] }[] = [];
    let totalMatchedTraits = 0;
    let sumPillarMatchFractions = 0;

    for (const pillar of activePillars) {
      const matched = pillar.selections.filter((sel) =>
        pillar.cultureTraits.some((trait) => matchTrait(sel, trait))
      );

      if (matched.length > 0) {
        matchedPillars.push({
          pillar: pillar.label,
          matchedTraits: matched,
        });
        totalMatchedTraits += matched.length;
      }

      // Per-pillar satisfaction rate (fraction of this pillar's selections satisfied)
      const pillarFraction = matched.length / pillar.selections.length;
      sumPillarMatchFractions += pillarFraction;
    }

    const matchedPillarsCount = matchedPillars.length;
    const activePillarsCount = activePillars.length;

    // Deterministic mathematical scoring factors:
    // 1. Preference Coverage Rate: proportion of all user-selected tags that match (0.0 to 1.0)
    const preferenceCoverageRate = totalMatchedTraits / totalUserPreferences;
    // 2. Mean Pillar Match Rate: average per-pillar satisfaction fraction across active dimensions (0.0 to 1.0)
    const meanPillarMatchRate = sumPillarMatchFractions / activePillarsCount;
    // 3. Pillar Breadth Rate: proportion of active pillars with >= 1 match (diagnostic metric)
    const pillarBreadthRate = matchedPillarsCount / activePillarsCount;

    // Combined score: balanced 50% on raw preference recall and 50% on mean pillar match rate.
    // This formulation prevents the single-pillar inflation anomaly where selecting 5 items in 1 dimension
    // and matching only 1 item resulted in a disproportionately high breadth-boosted score.
    const rawScore = 100 * (0.5 * preferenceCoverageRate + 0.5 * meanPillarMatchRate);
    const score = Math.min(100, Math.max(0, Math.round(rawScore)));

    // Categorize into clear match tiers
    let matchLevel: RecommendationMatchLevel = 'No Overlap';
    if (score >= 80) {
      matchLevel = 'Strong Alignment';
    } else if (score >= 50) {
      matchLevel = 'Moderate Alignment';
    } else if (score >= 20) {
      matchLevel = 'Emerging Alignment';
    } else if (score > 0) {
      matchLevel = 'Low Overlap';
    }

    // Build transparent explanation based purely on actual intersections
    let explanation = '';
    if (score === 0) {
      const activeLabels = activePillars.map((p) => p.label).slice(0, 3).join(', ');
      explanation = `No overlapping cultural traits found with your current taste selections in ${activeLabels}.`;
    } else {
      const sampleMatches = matchedPillars
        .flatMap((p) => p.matchedTraits.map((t) => `"${t}"`))
        .slice(0, 3)
        .join(', ');

      const contextSummary = culture?.editorialSummary ? ` ${culture.editorialSummary}` : '';

      explanation = `${destination.name}: Matches ${totalMatchedTraits} of your ${totalUserPreferences} selected preferences (${sampleMatches}) across ${matchedPillarsCount} of ${activePillarsCount} active cultural dimensions.${contextSummary}`;
    }

    return {
      destination,
      score,
      matchLevel,
      matchedPillars,
      explanation,
      scoringBreakdown: {
        matchedTraitsCount: totalMatchedTraits,
        totalUserPreferencesCount: totalUserPreferences,
        matchedPillarsCount,
        activePillarsCount,
        preferenceCoverageRate: Number(preferenceCoverageRate.toFixed(3)),
        pillarBreadthRate: Number(pillarBreadthRate.toFixed(3)),
        meanPillarMatchRate: Number(meanPillarMatchRate.toFixed(3)),
        rawScore: score,
      },
      providerId: this.id,
      isSimulatedDemo: false,
      isCalculated: true,
    };

  }
}
