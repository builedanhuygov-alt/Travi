import { describe, it, expect } from 'vitest';
import {
  normalizeTasteProfile,
  scoreCandidate,
  rankWithDiversity,
  partitionDiscoveryLanes,
} from '../pipeline/RecommendationPipeline.ts';
import { verifiedDestinations } from '../../../data/verifiedDestinationsData.ts';
import { EMPTY_TASTE_PROFILE, CURATED_DEMO_TASTE_PROFILE } from '../../taste/tasteData.ts';
import { demoStore } from '../../storage/demoStore.ts';

describe('Vietnam Cultural Intelligence Validation — Data, Reliability & Ranking', () => {
  it('1. Handles cold starts and empty taste profiles truthfully without fabricated affinities', () => {
    const normalized = normalizeTasteProfile(EMPTY_TASTE_PROFILE);
    expect(normalized.totalUserPreferencesCount).toBe(0);
    expect(normalized.activePillarsCount).toBe(0);

    const scored = scoreCandidate(verifiedDestinations[0], normalized);
    expect(scored.score).toBe(75);
    expect(scored.matchLevel).toBe('Curated Baseline');
    expect(scored.isCalculated).toBe(true);
    expect(scored.provenance).toBe('vietnam-verified');
    expect(scored.explanation).toContain('Curated editorial recommendation');
  });

  it('2. Correctly parses and normalizes populated 8-pillar Vietnam taste profiles', () => {
    const normalized = normalizeTasteProfile(CURATED_DEMO_TASTE_PROFILE);
    expect(normalized.totalUserPreferencesCount).toBeGreaterThan(0);
    expect(normalized.activePillarsCount).toBe(8);

    const pillarKeys = normalized.pillars.map((p: { profileKey: string }) => p.profileKey);
    expect(pillarKeys).toContain('films');
    expect(pillarKeys).toContain('music');
    expect(pillarKeys).toContain('food');
    expect(pillarKeys).toContain('architecture');
    expect(pillarKeys).toContain('art');
    expect(pillarKeys).toContain('history');
    expect(pillarKeys).toContain('nature');
    expect(pillarKeys).toContain('localCulture');
  });

  it('3. Computes deterministic trait intersection against verified Vietnam destinations', () => {
    const normalized = normalizeTasteProfile({
      ...EMPTY_TASTE_PROFILE,
      food: ['Traditional Phở', 'Bún Bò Huế'],
      history: ['Imperial Citadels & Dynasties', 'Ancient Capitals'],
    });

    const hueDest = verifiedDestinations.find((d) => d.id === 'hue') || verifiedDestinations[0];
    const recommendation = scoreCandidate(hueDest, normalized);

    expect(recommendation.provenance).toBe('vietnam-verified');
    expect(recommendation.isSimulatedDemo).toBe(false);
    expect(recommendation.score).toBeGreaterThan(0);
    expect(recommendation.verifiedEvidence?.some((e) => e.includes('Verified destination'))).toBe(true);
  });

  it('4. Applies regional diversity to prevent monotonous single-province ranking', () => {
    const mockRecs = verifiedDestinations.map((dest, i) => ({
      destination: dest,
      score: 95 - i,
      matchLevel: 'Strong Alignment' as const,
      matchedPillars: [],
      explanation: 'Test',
      scoringBreakdown: {
        matchedTraitsCount: 5,
        totalUserPreferencesCount: 5,
        matchedPillarsCount: 3,
        activePillarsCount: 3,
        preferenceCoverageRate: 1,
        pillarBreadthRate: 1,
        meanPillarMatchRate: 1,
        rawScore: 90,
      },
      providerId: 'vietnam-engine',
      isSimulatedDemo: false,
      isCalculated: true,
      culturalRelevanceScore: 90,
      provenance: 'vietnam-verified' as const,
      verifiedEvidence: ['Verified'],
      generatedInterpretation: 'Interpretation',
    }));

    const ranked = rankWithDiversity(mockRecs, 'affinity', 2);
    expect(ranked.length).toBe(mockRecs.length);

    // Verify regions are represented
    const regions = new Set(ranked.slice(0, 6).map((r) => r.destination.region));
    expect(regions.size).toBeGreaterThan(1);
  });

  it('5. Partitions recommendations into transparent Vietnam discovery lanes', () => {
    const mockRecs = verifiedDestinations.map((dest, i) => ({
      destination: dest,
      score: 90 - i * 2,
      matchLevel: 'Strong Alignment' as const,
      matchedPillars: [],
      explanation: 'Lane test',
      scoringBreakdown: {
        matchedTraitsCount: 4,
        totalUserPreferencesCount: 4,
        matchedPillarsCount: 2,
        activePillarsCount: 2,
        preferenceCoverageRate: 1,
        pillarBreadthRate: 1,
        meanPillarMatchRate: 1,
        rawScore: 80,
      },
      providerId: 'vietnam-engine',
      isSimulatedDemo: false,
      isCalculated: true,
      culturalRelevanceScore: 80,
      provenance: 'vietnam-verified' as const,
      verifiedEvidence: ['Verified'],
      generatedInterpretation: 'Interpretation',
    }));

    const lanes = partitionDiscoveryLanes(mockRecs, ['hanoi']);

    expect(lanes.length).toBeGreaterThanOrEqual(4);
    const laneIds = lanes.map((l) => l.id);
    expect(laneIds).toContain('CULTURAL_MATCHES');
    expect(laneIds).toContain('UNEXPECTED_DISCOVERIES');
    expect(laneIds).toContain('CULTURAL_WORLDS');
    expect(laneIds).toContain('BEYOND_COMFORT_ZONE');
    expect(laneIds).toContain('BUILD_JOURNEY');

    for (const lane of lanes) {
      expect(lane.selectionRule).toBeDefined();
      expect(lane.recommendations.length).toBeGreaterThan(0);
    }
  });

  it('6. Local persistence maintains offline reliability and save/restore integrity', () => {
    const initialTrips = demoStore.getTrips();
    expect(Array.isArray(initialTrips)).toBe(true);

    const testTrip = {
      title: 'Hà Giang & Đồng Văn Karst Expedition',
      destination: 'Hà Giang, Vietnam',
      country: 'Vietnam',
      destinationId: 'ha-giang',
      coverImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800&auto=format&fit=crop',
      startDate: '2026-11-01',
      endDate: '2026-11-06',
      status: 'planning' as const,
      daysCount: 5,
      travelersCount: 2,
      itineraryStops: ['Mã Pí Lèng Pass', 'Đồng Văn Ancient Quarter', 'Nho Quế River'],
      tags: ['Karst', 'Pass', 'Heritage'],
      notes: 'Testing offline persistence integrity.',
      highlights: ['Mã Pí Lèng Pass', 'Đồng Văn Ancient Quarter'],
      days: [],
    };

    const created = demoStore.createTrip(testTrip);
    expect(created.id).toBeDefined();

    const allTrips = demoStore.getTrips();
    const retrieved = allTrips.find((t) => t.id === created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe(testTrip.title);

    // Update
    demoStore.updateTrip(created.id, { notes: 'Updated notes offline.' });
    const updated = demoStore.getTrips().find((t) => t.id === created.id);
    expect(updated?.notes).toBe('Updated notes offline.');

    // Delete
    const deleted = demoStore.deleteTrip(created.id);
    expect(deleted).toBe(true);
    expect(demoStore.getTrips().some((t) => t.id === created.id)).toBe(false);
  });
});
