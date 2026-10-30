import type { Destination, TasteProfile, DestinationAffinityResult } from '../../types/index.ts';
import { recommendationService } from '../recommendations/RecommendationService.ts';

/**
 * Calculates a deterministic cultural affinity score and matched traits
 * between a destination and the user's 8-pillar taste profile.
 *
 * Backed by RecommendationService (LocalDeterministicRecommendationProvider).
 */
export function calculateDestinationAffinity(
  destinationId: string,
  tasteProfile: TasteProfile
): DestinationAffinityResult {
  const result = recommendationService.getDestinationAffinity(destinationId, tasteProfile);

  if (!result) {
    return {
      destinationId,
      affinityScore: 0,
      matchLevel: 'Uncalibrated',
      topMatchedPillars: [],
      rationale: 'Destination not found in cultural catalog.',
      scoringBreakdown: {
        matchedTraitsCount: 0,
        totalUserPreferencesCount: 0,
        matchedPillarsCount: 0,
        activePillarsCount: 0,
        preferenceCoverageRate: 0,
        pillarBreadthRate: 0,
        meanPillarMatchRate: 0,
        rawScore: 0,
      },
      isSimulatedDemo: true,
      isCalculated: false,
    };
  }

  return {
    destinationId,
    affinityScore: result.score,
    matchLevel: result.matchLevel,
    topMatchedPillars: result.matchedPillars,
    rationale: result.explanation,
    scoringBreakdown: result.scoringBreakdown,
    isSimulatedDemo: true,
    isCalculated: result.isCalculated,
  };
}

/**
 * Augments and sorts destinations according to active simulated taste affinity.
 */
export function sortDestinationsByAffinity(
  destinations: Destination[],
  tasteProfile: TasteProfile
): { destination: Destination; affinity: DestinationAffinityResult }[] {
  const recResult = recommendationService.getRecommendations({
    tasteProfile,
    destinations,
    sortBy: 'affinity',
  });

  return recResult.recommendations.map((rec) => ({
    destination: rec.destination,
    affinity: {
      destinationId: rec.destination.id,
      affinityScore: rec.score,
      matchLevel: rec.matchLevel,
      topMatchedPillars: rec.matchedPillars,
      rationale: rec.explanation,
      scoringBreakdown: rec.scoringBreakdown,
      isSimulatedDemo: true,
      isCalculated: rec.isCalculated,
    },
  }));
}

/**
 * Summary stats for the active taste profile
 */
export function getTasteProfileStats(tasteProfile: TasteProfile): {
  totalPillarsConfigured: number;
  totalSelectionsCount: number;
  activeDimensionsSummary: string[];
} {
  const pillarKeys = ['films', 'music', 'food', 'architecture', 'art', 'history', 'nature', 'localCulture'] as const;
  let configuredCount = 0;
  let totalSelections = 0;
  const summary: string[] = [];

  for (const pillar of pillarKeys) {
    const choices = (tasteProfile[pillar] as string[]) || [];
    if (choices.length > 0) {
      configuredCount += 1;
      totalSelections += choices.length;
      summary.push(choices[0]);
    }
  }

  return {
    totalPillarsConfigured: configuredCount,
    totalSelectionsCount: totalSelections,
    activeDimensionsSummary: summary.slice(0, 4),
  };
}
