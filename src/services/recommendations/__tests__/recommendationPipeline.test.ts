import { describe, it, expect } from 'vitest';
import {
  normalizeTasteProfile,
  retrieveCandidates,
  enrichCandidateMetadata,
  scoreCandidate,
  rankWithDiversity,
  partitionDiscoveryLanes,
} from '../pipeline/RecommendationPipeline.ts';
import { verifiedDestinations } from '../../../data/verifiedDestinationsData.ts';
import type { TasteProfile } from '../../../types/index.ts';

const createVietnamProfile = (): TasteProfile => ({
  films: ['The Scent of Green Papaya', 'Indochine Heritage'],
  music: ['Ca Trù & Traditional North Strings', 'Đàn Bầu Monochord'],
  food: ['Traditional Phở Bát Đàn', 'Bún Bò Huế Royal Broth'],
  architecture: ['French Indochine Colonial & Yellow Shophouses'],
  art: ['Bát Tràng Ceramics & Woodcut Prints'],
  history: ['Thăng Long Millennium & Imperial Citadels'],
  nature: ['Limestone Karst Peaks & Caves'],
  localCulture: ['Old Quarter Morning Guilds & Sidewalk Coffee'],
});

describe('Travi Vietnam Recommendation Pipeline Architecture', () => {
  describe('Stage 1: Taste Profile Normalization', () => {
    it('normalizes 8-pillar selections and calculates active pillars accurately', () => {
      const profile = createVietnamProfile();
      const normalized = normalizeTasteProfile(profile);

      expect(normalized.activePillarsCount).toBe(8);
      expect(normalized.totalUserPreferencesCount).toBe(11);
      expect(normalized.pillars.find((p: { profileKey: string }) => p.profileKey === 'food')?.selections.length).toBe(2);
    });

    it('handles empty / cold-start taste profile gracefully', () => {
      const emptyProfile: TasteProfile = {
        films: [],
        music: [],
        food: [],
        architecture: [],
        art: [],
        history: [],
        nature: [],
        localCulture: [],
      };
      const normalized = normalizeTasteProfile(emptyProfile);

      expect(normalized.activePillarsCount).toBe(0);
      expect(normalized.totalUserPreferencesCount).toBe(0);
      expect(normalized.pillars).toEqual([]);
    });
  });

  describe('Stage 2: Candidate Retrieval & Deduplication', () => {
    it('retrieves candidate pool of Vietnam provincial destinations when unconstrained', () => {
      const candidates = retrieveCandidates({ tasteProfile: createVietnamProfile() });
      expect(candidates.length).toBe(verifiedDestinations.length);
      expect(candidates.length).toBeGreaterThanOrEqual(20);
    });

    it('deduplicates candidate items by stable destination id', () => {
      const duplicatedPool = [verifiedDestinations[0], verifiedDestinations[0], verifiedDestinations[1]];
      const candidates = retrieveCandidates({
        tasteProfile: createVietnamProfile(),
        destinations: duplicatedPool,
      });

      expect(candidates.length).toBe(2);
      expect(candidates[0].id).toBe(verifiedDestinations[0].id);
      expect(candidates[1].id).toBe(verifiedDestinations[1].id);
    });

    it('filters candidates by category and search text', () => {
      const filtered = retrieveCandidates({
        tasteProfile: createVietnamProfile(),
        categoryFilter: 'Heritage & History',
        searchQuery: 'Hội An',
      });

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some((d) => d.id === 'hoi-an')).toBe(true);
    });
  });

  describe('Stage 3: Candidate Metadata Enrichment', () => {
    it('enriches destination with fallback color, rating, and default tags if missing', () => {
      const minimalDest = { ...verifiedDestinations[0], fallbackColor: '', rating: 0 };
      const enriched = enrichCandidateMetadata(minimalDest);

      expect(enriched.fallbackColor).toBe('#151F33');
      expect(enriched.rating).toBeGreaterThan(0);
    });
  });

  describe('Stage 4: Transparent Relevance Scoring & Truthful Attribution', () => {
    it('scores candidates deterministically with verified provenance', () => {
      const hanoi = verifiedDestinations.find((d) => d.id === 'hanoi') || verifiedDestinations[0];
      const normalized = normalizeTasteProfile(createVietnamProfile());

      const scored = scoreCandidate(hanoi, normalized);

      expect(scored.score).toBeGreaterThanOrEqual(0);
      expect(scored.provenance).toBe('vietnam-verified');
      expect(scored.isCalculated).toBe(true);
      expect(scored.verifiedEvidence?.length).toBeGreaterThanOrEqual(2);
    });

    it('operates honestly in default baseline when no preferences exist', () => {
      const hanoi = verifiedDestinations.find((d) => d.id === 'hanoi') || verifiedDestinations[0];
      const emptyProfile = normalizeTasteProfile({
        films: [],
        music: [],
        food: [],
        architecture: [],
        art: [],
        history: [],
        nature: [],
        localCulture: [],
      });

      const scored = scoreCandidate(hanoi, emptyProfile);

      expect(scored.score).toBe(75);
      expect(scored.matchLevel).toBe('Curated Baseline');
      expect(scored.provenance).toBe('vietnam-verified');
    });
  });

  describe('Stage 5: Diversity-Aware Ranking', () => {
    it('prevents single-region monopoly in top recommendations', () => {
      const normalized = normalizeTasteProfile(createVietnamProfile());
      const candidates = retrieveCandidates({ tasteProfile: createVietnamProfile() });
      const scored = candidates.map((c) => scoreCandidate(c, normalized));

      const ranked = rankWithDiversity(scored, 'affinity', 2);
      expect(ranked.length).toBe(scored.length);

      const top6Regions = ranked.slice(0, 6).map((r) => r.destination.region);
      const uniqueRegions = new Set(top6Regions);
      expect(uniqueRegions.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Stage 6 & 7: Discovery Lanes Partitioning', () => {
    it('creates structured discovery lanes with explicit selection rules', () => {
      const normalized = normalizeTasteProfile(createVietnamProfile());
      const candidates = retrieveCandidates({ tasteProfile: createVietnamProfile() });
      const scored = candidates.map((c) => scoreCandidate(c, normalized));
      const ranked = rankWithDiversity(scored, 'affinity');

      const lanes = partitionDiscoveryLanes(ranked, ['hanoi', 'ha-giang']);

      expect(lanes.some((l) => l.id === 'CULTURAL_MATCHES')).toBe(true);
      expect(lanes.some((l) => l.id === 'UNEXPECTED_DISCOVERIES')).toBe(true);
      expect(lanes.some((l) => l.id === 'CULTURAL_WORLDS')).toBe(true);
      expect(lanes.some((l) => l.id === 'BEYOND_COMFORT_ZONE')).toBe(true);
      expect(lanes.some((l) => l.id === 'BUILD_JOURNEY')).toBe(true);

      const journeyLane = lanes.find((l) => l.id === 'BUILD_JOURNEY');
      expect(journeyLane?.recommendations.length).toBe(2);
      expect(journeyLane?.recommendations.map((r) => r.destination.id)).toContain('hanoi');
    });
  });
});
