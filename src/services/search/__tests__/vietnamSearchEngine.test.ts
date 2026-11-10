import { describe, it, expect, beforeEach } from 'vitest';
import {
  vietnamSearchEngine,
  normalizeVietnameseText,
  levenshteinDistance,
} from '../vietnamSearchEngine.ts';

describe('Vietnam Nationwide Search Engine', () => {
  beforeEach(() => {
    vietnamSearchEngine.clearRecentSearches();
  });

  describe('Vietnamese Normalization & Accent-Insensitive Matching', () => {
    it('normalizes accents, diacritics, and handles đ/Đ correctly', () => {
      expect(normalizeVietnameseText('Hội An')).toBe('hoi an');
      expect(normalizeVietnameseText('Phở Bát Đàn')).toBe('pho bat dan');
      expect(normalizeVietnameseText('Đà Nẵng')).toBe('da nang');
      expect(normalizeVietnameseText('QUẢNG BÌNH')).toBe('quang binh');
      expect(normalizeVietnameseText('Mã Pí Lèng')).toBe('ma pi leng');
    });

    it('matches "Hoi An" to "Hội An" (accent-insensitive)', () => {
      const results = vietnamSearchEngine.search('Hoi An');
      expect(results.destinations.length).toBeGreaterThan(0);
      const matched = results.destinations.some(
        (d) => d.vietnameseName.includes('Hội An') || d.name.includes('Hoi An')
      );
      expect(matched).toBe(true);
    });

    it('matches "pho" to "Phở" (accent-insensitive culinary search)', () => {
      const results = vietnamSearchEngine.search('pho');
      expect(results.food.length).toBeGreaterThan(0);
      const matched = results.food.some((f) =>
        normalizeVietnameseText(f.vietnameseName).includes('pho')
      );
      expect(matched).toBe(true);
    });

    it('matches case-insensitively across uppercase, lowercase, and mixed queries', () => {
      const lower = vietnamSearchEngine.search('ha noi');
      const upper = vietnamSearchEngine.search('HA NOI');
      const title = vietnamSearchEngine.search('Hà Nội');

      expect(lower.destinations.length).toBeGreaterThan(0);
      expect(upper.destinations.length).toBeGreaterThan(0);
      expect(title.destinations.length).toBeGreaterThan(0);

      expect(lower.destinations[0].id).toBe('ha-noi');
      expect(upper.destinations[0].id).toBe('ha-noi');
      expect(title.destinations[0].id).toBe('ha-noi');
    });
  });

  describe('Historical Name and Alias Matching', () => {
    it('resolves historical name "Thăng Long" to Hà Nội', () => {
      const results = vietnamSearchEngine.search('Thăng Long');
      expect(results.destinations.length).toBeGreaterThan(0);
      const hanoi = results.destinations.find((d) => d.id === 'ha-noi');
      expect(hanoi).toBeDefined();
      expect(hanoi?.vietnameseName).toBe('Hà Nội');
    });

    it('resolves historical port alias "Faifo" to Hội An', () => {
      const results = vietnamSearchEngine.search('Faifo');
      expect(results.destinations.length).toBeGreaterThan(0);
      const hoian = results.destinations.find((d) => d.id === 'quang-nam-hoian' || d.vietnameseName.includes('Hội An'));
      expect(hoian).toBeDefined();
      expect(hoian?.vietnameseName).toContain('Hội An');
    });

    it('resolves "Sài Gòn" / "Gia Định" to TP. Hồ Chí Minh', () => {
      const resultsSaigon = vietnamSearchEngine.search('Sài Gòn');
      expect(resultsSaigon.destinations.length).toBeGreaterThan(0);
      const hcm = resultsSaigon.destinations.find((d) => d.id === 'tp-ho-chi-minh' || d.id === 'ad-ho-chi-minh');
      expect(hcm).toBeDefined();

      const resultsGiaDinh = vietnamSearchEngine.search('Gia Định');
      expect(resultsGiaDinh.destinations.length).toBeGreaterThan(0);
    });

    it('resolves province administrative name "Gia Lai" accurately', () => {
      const results = vietnamSearchEngine.search('Gia Lai');
      expect(results.destinations.length).toBeGreaterThan(0);
      const found = results.destinations.some((d) =>
        normalizeVietnameseText(d.vietnameseName).includes('gia lai') ||
        normalizeVietnameseText(d.administrativeUnit).includes('gia lai')
      );
      expect(found).toBe(true);
    });
  });

  describe('Multi-Category Search and Grouping', () => {
    it('returns grouped results across destinations, experiences, food, heritage, and stories', () => {
      // "Hue" has destinations, foods (Bún bò Huế), experiences, and stories
      const results = vietnamSearchEngine.search('Huế');
      expect(results.destinations.length).toBeGreaterThan(0);
      expect(results.food.length).toBeGreaterThan(0);
      expect(results.heritage.length).toBeGreaterThan(0);
    });

    it('searches craft villages like "Bát Tràng" across experiences and heritage', () => {
      const results = vietnamSearchEngine.search('Bát Tràng');
      expect(results.totalCount).toBeGreaterThan(0);
      const matched =
        results.experiences.some((e) => e.vietnameseName.includes('Bát Tràng')) ||
        results.heritage.some((h) => h.vietnameseName.includes('Bát Tràng'));
      expect(matched).toBe(true);
    });

    it('searches stories by topic e.g. "Phở"', () => {
      const results = vietnamSearchEngine.search('phở');
      expect(results.stories.length).toBeGreaterThan(0);
    });
  });

  describe('Search Filters & Suggestions', () => {
    it('filters results by region accurately', () => {
      const northResults = vietnamSearchEngine.search('Hồ', { region: 'Northern Vietnam' });
      expect(northResults.destinations.every((d) => d.region === 'Northern Vietnam')).toBe(true);

      const southResults = vietnamSearchEngine.search('Hồ', { region: 'Southern Vietnam' });
      expect(southResults.destinations.every((d) => d.region === 'Southern Vietnam')).toBe(true);
    });

    it('generates real-time suggestions while typing', () => {
      const suggestions = vietnamSearchEngine.getSuggestions('Hà', 5);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => normalizeVietnameseText(s).includes('ha'))).toBe(true);
    });

    it('handles empty query gracefully with zero results and no crash', () => {
      const empty = vietnamSearchEngine.search('');
      expect(empty.totalCount).toBe(0);
      expect(empty.destinations).toEqual([]);
      expect(empty.experiences).toEqual([]);
    });

    it('handles obscure non-existent query without fabricating data', () => {
      const nonexistent = vietnamSearchEngine.search('xyzrandom123987nonexistent');
      expect(nonexistent.totalCount).toBe(0);
      expect(nonexistent.destinations).toEqual([]);
    });
  });

  describe('Search History Management', () => {
    it('persists and clears search history correctly', () => {
      vietnamSearchEngine.addRecentSearch('Hội An');
      vietnamSearchEngine.addRecentSearch('Phở Hà Nội');

      const recent = vietnamSearchEngine.getRecentSearches();
      expect(recent).toContain('Phở Hà Nội');
      expect(recent).toContain('Hội An');

      vietnamSearchEngine.clearRecentSearches();
      expect(vietnamSearchEngine.getRecentSearches()).toEqual([]);
    });
  });

  describe('Levenshtein Distance Function', () => {
    it('computes distance correctly for typo tolerance', () => {
      expect(levenshteinDistance('saigon', 'saigon')).toBe(0);
      expect(levenshteinDistance('saigon', 'saigonn')).toBe(1);
      expect(levenshteinDistance('hanoi', 'hanio')).toBe(2);
    });
  });
});
