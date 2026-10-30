import { describe, it, expect } from 'vitest';
import { LocalDeterministicRecommendationProvider } from '../LocalDeterministicProvider.ts';
import { recommendationService } from '../RecommendationService.ts';
import { sampleDestinations } from '../../../data/sampleData.ts';
import type { TasteProfile } from '../../../types/index.ts';

const createEmptyProfile = (): TasteProfile => ({
  films: [],
  music: [],
  food: [],
  architecture: [],
  art: [],
  history: [],
  nature: [],
  localCulture: [],
});

describe('Travi Vietnam Recommendation Engine', () => {
  const provider = new LocalDeterministicRecommendationProvider();

  describe('1. Ranking based on Vietnam Taste Profile Selections', () => {
    it('ranks Hanoi #1 when profile selects Phở, Old Quarter and French Indochine architecture', () => {
      const hanoiProfile: TasteProfile = {
        ...createEmptyProfile(),
        food: ['Traditional Phở Bát Đàn & Egg Coffee'],
        architecture: ['French Indochine Colonial & Yellow Shophouses'],
        history: ['Thăng Long Millennium & Imperial Citadels'],
        art: ['Bát Tràng Ceramics & Woodcut Prints'],
        localCulture: ['Old Quarter Morning Guilds & Sidewalk Coffee'],
      };

      const result = provider.getRecommendations({
        tasteProfile: hanoiProfile,
        destinations: sampleDestinations,
        sortBy: 'affinity',
      });

      expect(result.hasActivePreferences).toBe(true);
      expect(result.recommendations.length).toBe(sampleDestinations.length);

      const topDest = result.recommendations[0];
      expect(topDest.destination.id).toBe('hanoi');
      expect(topDest.score).toBeGreaterThan(0);
      expect(topDest.matchedPillars.length).toBeGreaterThanOrEqual(1);
    });

    it('ranks Huế #1 when profile selects Royal Court Cuisine and Imperial Citadels', () => {
      const hueProfile: TasteProfile = {
        ...createEmptyProfile(),
        food: ['Huế Royal Court Gastronomy & Bún Bò'],
        history: ['Nguyễn Dynasty Imperial Citadels & Tombs'],
        architecture: ['Imperial Citadels, Royal Tombs & Garden Houses'],
      };

      const result = provider.getRecommendations({
        tasteProfile: hueProfile,
        destinations: sampleDestinations,
        sortBy: 'affinity',
      });

      const topDest = result.recommendations[0];
      expect(topDest.destination.id).toBe('hue');
      expect(topDest.score).toBeGreaterThan(0);
    });

    it('ranks Hà Giang #1 when profile selects Karst Passes and Ethnic Minority Culture', () => {
      const haGiangProfile: TasteProfile = {
        ...createEmptyProfile(),
        nature: ['Limestone Karst Peaks, Deep Canyons & Sky Passes'],
        localCulture: ['H’mong & Tay Highland Markets & Flax Weaving'],
        architecture: ['Highland Earthen Trình Tường Bastions'],
      };

      const result = provider.getRecommendations({
        tasteProfile: haGiangProfile,
        destinations: sampleDestinations,
        sortBy: 'affinity',
      });

      const topDest = result.recommendations[0];
      expect(topDest.destination.id).toBe('ha-giang');
      expect(topDest.score).toBeGreaterThan(0);
    });
  });

  describe('2. Empty Profile & Cold Start Truthfulness', () => {
    it('returns honest curated baseline when profile has no active selections', () => {
      const emptyProfile = createEmptyProfile();
      const result = provider.getRecommendations({
        tasteProfile: emptyProfile,
        destinations: sampleDestinations,
      });

      expect(result.hasActivePreferences).toBe(false);
      expect(result.recommendations.length).toBe(sampleDestinations.length);

      for (const rec of result.recommendations) {
        expect(rec.isCalculated).toBe(true);
        expect(rec.score).toBe(75);
        expect(rec.matchLevel).toBe('Curated Baseline');
      }
    });
  });

  describe('3. Explanations & Truthfulness Integrity', () => {
    it('includes authentic matched traits and dimension counts in explanation', () => {
      const profile: TasteProfile = {
        ...createEmptyProfile(),
        food: ['Traditional Phở Bát Đàn & Egg Coffee'],
        architecture: ['French Indochine Colonial & Yellow Shophouses'],
      };

      const affinity = provider.getDestinationAffinity('hanoi', profile);

      expect(affinity).not.toBeNull();
      expect(affinity!.explanation).toContain('Hanoi');
      expect(affinity!.matchedPillars.length).toBeGreaterThan(0);
    });

    it('never claims that scores represent a probability of traveler satisfaction', () => {
      const metadata = provider.getMetadata();
      expect(metadata.disclaimer).toContain('Scores represent deterministic cultural trait intersection');
      expect(metadata.disclaimer).toContain('Scores are not probabilities of traveler satisfaction');
      expect(metadata.disclaimer.toLowerCase()).not.toContain('satisfaction probability');
    });
  });

  describe('4. Recommendation Service Architecture', () => {
    it('manages the active provider through RecommendationService singleton', () => {
      const activeProvider = recommendationService.getActiveProvider();
      expect(activeProvider.id).toBe('local-deterministic');

      const metadata = recommendationService.getProviderMetadata();
      expect(metadata.name).toBe('Vietnam Cultural Discovery Engine');
      expect(metadata.isLiveProvider).toBe(true);
    });
  });
});
