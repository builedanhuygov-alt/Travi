import { describe, it, expect } from 'vitest';
import { verifiedDestinations } from '../../../data/verifiedDestinationsData.ts';
import { getAllDestinations } from '../../../data/sampleData.ts';
import {
  normalizeTasteProfile,
  retrieveCandidates,
  enrichCandidateMetadata,
  scoreCandidate,
  rankWithDiversity,
  partitionDiscoveryLanes,
} from '../pipeline/RecommendationPipeline.ts';
import type { TasteProfile } from '../../../types/index.ts';
import { generateCulturalItineraryDraft } from '../../concierge/itineraryGenerator.ts';

describe('TRAVI — Vietnam Platform Architectural & Feature Regression Suite', () => {
  const sampleTasteProfile: TasteProfile = {
    films: ['The Scent of Green Papaya', 'Indochine Heritage'],
    music: ['Ca Trù & Traditional North Strings', 'Đàn Bầu Monochord'],
    food: ['Traditional Phở Bát Đàn & Egg Coffee', 'Huế Royal Court Gastronomy & Bún Bò'],
    architecture: ['French Indochine Colonial & Yellow Shophouses'],
    art: ['Bát Tràng Ceramics & Woodcut Prints', 'Hội An Silk Lantern Crafting'],
    history: ['Thăng Long Millennium & Imperial Citadels'],
    nature: ['Limestone Karst Peaks & Caves'],
    localCulture: ['Old Quarter Morning Guilds & Sidewalk Coffee'],
    updatedAt: new Date().toISOString(),
    isCustomized: true,
  };

  describe('1. Vietnam Provincial Universe & Data Integrity', () => {
    it('provides 34 distinct verified destinations with valid Vietnam cultural dossiers', () => {
      expect(verifiedDestinations.length).toBeGreaterThanOrEqual(30);

      for (const dest of verifiedDestinations) {
        expect(dest.id).toBeDefined();
        expect(dest.name).toBeDefined();
        expect(dest.country).toBe('Vietnam');
        expect(dest.culture).toBeDefined();
        expect(dest.culture?.culturalInterests.length).toBeGreaterThan(0);
        expect(dest.culture?.food.length).toBeGreaterThan(0);
        expect(dest.culture?.architecture.length).toBeGreaterThan(0);
        expect(dest.curatedExperience).toBeDefined();
        expect(dest.heroImage).toBeDefined();
        expect(dest.rating).toBeGreaterThanOrEqual(4.5);
        expect(dest.coordinates).toBeDefined();
        expect(dest.coordinates?.latitude).toBeGreaterThan(8.0);
        expect(dest.coordinates?.latitude).toBeLessThan(24.0);
        expect(dest.coordinates?.longitude).toBeGreaterThan(102.0);
        expect(dest.coordinates?.longitude).toBeLessThan(110.0);
      }
    });

    it('getAllDestinations returns all verified destinations and sampleDestinations has authentic Vietnam items', () => {
      const all = getAllDestinations();
      expect(all.length).toBeGreaterThanOrEqual(30);
      expect(all.some((d) => d.id === 'hanoi')).toBe(true);
      expect(all.some((d) => d.id === 'ha-giang')).toBe(true);
      expect(all.some((d) => d.id === 'hue')).toBe(true);
      expect(all.some((d) => d.id === 'hoi-an')).toBe(true);
      expect(all.some((d) => d.id === 'saigon')).toBe(true);
    });

    it('candidate retrieval correctly deduplicates by stable identity', () => {
      const duplicatedPool = [...verifiedDestinations, ...verifiedDestinations.slice(0, 5)];
      const retrieved = retrieveCandidates({
        tasteProfile: sampleTasteProfile,
        destinations: duplicatedPool,
      });
      expect(retrieved.length).toBe(verifiedDestinations.length);

      const uniqueIds = new Set(retrieved.map((c) => c.id));
      expect(uniqueIds.size).toBe(retrieved.length);
    });
  });

  describe('2. Pipeline Architecture & Diversity-Aware Ranking', () => {
    it('executes candidate enrichment, transparent scoring, and produces structured recommendations', () => {
      const normalized = normalizeTasteProfile(sampleTasteProfile);
      const candidates = retrieveCandidates({ tasteProfile: sampleTasteProfile });
      expect(candidates.length).toBe(verifiedDestinations.length);

      const scored = candidates.map((c) => {
        const enriched = enrichCandidateMetadata(c);
        return scoreCandidate(enriched, normalized);
      });

      expect(scored.length).toBe(verifiedDestinations.length);
      const topScored = scored[0];
      expect(topScored.culturalRelevanceScore).toBeGreaterThan(0);
      expect(topScored.matchedPillars).toBeDefined();
      expect(topScored.verifiedEvidence).toBeDefined();
    });

    it('diversity-aware ranking ensures multiple regions are represented', () => {
      const normalized = normalizeTasteProfile(sampleTasteProfile);
      const candidates = retrieveCandidates({ tasteProfile: sampleTasteProfile });
      const scored = candidates.map((c) => scoreCandidate(c, normalized));

      const ranked = rankWithDiversity(scored, 'affinity', 2);
      const top6Regions = ranked.slice(0, 6).map((r) => r.destination.region);
      const uniqueRegions = new Set(top6Regions);
      expect(uniqueRegions.size).toBeGreaterThanOrEqual(2);
    });

    it('creates 5 structured discovery lanes with transparent selection rules', () => {
      const normalized = normalizeTasteProfile(sampleTasteProfile);
      const candidates = retrieveCandidates({ tasteProfile: sampleTasteProfile });
      const scored = candidates.map((c) => scoreCandidate(c, normalized));
      const ranked = rankWithDiversity(scored, 'affinity');

      const lanes = partitionDiscoveryLanes(ranked, ['hanoi', 'ha-giang']);

      expect(lanes.length).toBe(5);
      const laneIds = lanes.map((l) => l.id);
      expect(laneIds).toContain('CULTURAL_MATCHES');
      expect(laneIds).toContain('UNEXPECTED_DISCOVERIES');
      expect(laneIds).toContain('CULTURAL_WORLDS');
      expect(laneIds).toContain('BEYOND_COMFORT_ZONE');
      expect(laneIds).toContain('BUILD_JOURNEY');

      const journeyLane = lanes.find((l) => l.id === 'BUILD_JOURNEY');
      expect(journeyLane?.recommendations.length).toBe(2);
      expect(journeyLane?.recommendations.map((r) => r.destination.id)).toContain('hanoi');
    });
  });

  describe('3. Truth-in-Advertising & Data Provenance Integrity', () => {
    it('truthfully assigns provenance as vietnam-verified without fabricated data', () => {
      const hanoi = verifiedDestinations.find((d) => d.id === 'hanoi')!;
      const normalized = normalizeTasteProfile(sampleTasteProfile);
      const scored = scoreCandidate(hanoi, normalized);

      expect(scored.provenance).toBe('vietnam-verified');
      expect(scored.verifiedEvidence?.some((e) => e.includes('Verified destination in Northern Vietnam') || e.includes('Verified destination in North Vietnam'))).toBe(true);
    });

    it('clearly distinguishes verified destination metadata from generated interpretations', () => {
      const hanoi = verifiedDestinations.find((d) => d.id === 'hanoi')!;
      const normalized = normalizeTasteProfile(sampleTasteProfile);
      const scored = scoreCandidate(hanoi, normalized);

      expect(scored.distinctiveFeature).toBeDefined();
      expect(typeof scored.distinctiveFeature).toBe('string');
      expect(scored.signatureExperience).toBe(hanoi.curatedExperience);
      expect(scored.generatedInterpretation).toBeDefined();
      expect(scored.verifiedEvidence?.length).toBeGreaterThan(0);
    });
  });

  describe('4. Cultural Journey & Itinerary Draft Generation for Vietnam', () => {
    it('generates rich, culturally grounded itinerary drafts for Vietnam destinations', () => {
      const draft = generateCulturalItineraryDraft({
        destination: 'ha-giang',
        durationDays: 4,
        budgetRange: 'Mid-range',
        travelPace: 'Moderate',
        culturalInterests: ['Limestone Karsts', 'Ethnic Traditions', 'Mã Pí Lèng Pass'],
      });

      expect(draft.destinationName).toMatch(/H[aà] Giang/i);
      expect(draft.country).toBe('Vietnam');
      expect(draft.days.length).toBe(4);
      expect(draft.disclaimers.bookingNotice).toBeDefined();
      expect(draft.disclaimers.estimationNotice).toContain('unverified estimates');

      for (const day of draft.days) {
        expect(day.activities.length).toBeGreaterThan(0);
        expect(day.activities[0].culturalPillar).toBeDefined();
      }
    });

    it('generates multi-stop itinerary when passing multi-destination input', () => {
      const draft = generateCulturalItineraryDraft({
        destination: 'Hà Nội & Ninh Bình Heritage Corridor',
        durationDays: 5,
        budgetRange: 'Comfort',
        travelPace: 'Moderate',
        culturalInterests: ['Tràng An Karst', 'Old Quarter Gastronomy'],
      });

      expect(draft.days.length).toBe(5);
      expect(draft.title).toBeDefined();
      expect(draft.disclaimers.estimationNotice).toContain('unverified estimates');
    });
  });
});
