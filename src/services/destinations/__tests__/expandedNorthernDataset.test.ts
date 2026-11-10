import { describe, it, expect } from 'vitest';
import {
  northVietnamDestinations,
  NORTH_MAP_SUBREGIONS,
  NORTH_MAP_CATEGORIES,
} from '../../../data/northVietnamData.ts';
import {
  getDiscoveryDestinationById,
} from '../destinationRepository.ts';
import { vietnamSearchEngine } from '../../search/vietnamSearchEngine.ts';

describe('TRAVI Maximum-Coverage Northern Vietnam Dataset Quality Gates (Section 9)', () => {
  // 1. Stable unique IDs
  it('1. Stable unique IDs — guarantees 100% uniqueness across all destinations', () => {
    expect(northVietnamDestinations.length).toBeGreaterThanOrEqual(230);
    const ids = northVietnamDestinations.map((d) => d.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Validate ID slug format (kebab-case)
    ids.forEach((id) => {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });
  });

  // 2. Duplicate detection
  it('2. Duplicate detection — confirms no duplicate slugs or duplicate geographic points', () => {
    const slugs = northVietnamDestinations.map((d) => d.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);

    // Ensure distinct lat/lng coordinate pairs (no accidental copy-pasting of identical coordinates)
    const coordPairs = new Set(northVietnamDestinations.map((d) => `${d.latitude.toFixed(4)},${d.longitude.toFixed(4)}`));
    expect(coordPairs.size).toBe(northVietnamDestinations.length);
  });

  // 3. Valid coordinates
  it('3. Valid coordinates — confirms all coordinates fall strictly within Northern Vietnam bounds', () => {
    northVietnamDestinations.forEach((dest) => {
      // Northern Vietnam bounds: [18.0°N to 23.5°N], [102.0°E to 108.5°E]
      expect(dest.latitude).toBeGreaterThanOrEqual(18.0);
      expect(dest.latitude).toBeLessThanOrEqual(23.5);
      expect(dest.longitude).toBeGreaterThanOrEqual(102.0);
      expect(dest.longitude).toBeLessThanOrEqual(108.5);

      // Sanity check: latitude must be strictly less than longitude in Vietnam
      expect(dest.latitude).toBeLessThan(dest.longitude);
      expect(Number.isFinite(dest.latitude)).toBe(true);
      expect(Number.isFinite(dest.longitude)).toBe(true);
    });
  });

  // 4. Missing and approximate coordinate handling
  it('4. Missing and approximate coordinate handling — 0 unresolved, strictly classified', () => {
    const unresolved = northVietnamDestinations.filter((d) => d.verificationStatus === 'unresolved');
    expect(unresolved.length).toBe(0);

    const needsReview = northVietnamDestinations.filter((d) => d.verificationStatus === 'needs_review');
    expect(needsReview.length).toBe(2);
    const needsReviewIds = needsReview.map((d) => d.id);
    expect(needsReviewIds).toContain('bach-long-vi');
    expect(needsReviewIds).toContain('pu-mat-national-park');

    // Confirms all others are verified
    const verified = northVietnamDestinations.filter((d) => d.verificationStatus === 'verified');
    expect(verified.length).toBe(northVietnamDestinations.length - 2);
  });

  // 5. Required provenance for map-ready destinations
  it('5. Required provenance — verifies all records have verified sources and secure https URLs', () => {
    const allowedSourceTypes = [
      'Official tourism source',
      'Official heritage or protected-area source',
      'Travel editorial',
      'Community contribution',
      'Manually reviewed content',
    ];

    northVietnamDestinations.forEach((dest) => {
      expect(dest.source, `Source name missing for ${dest.id}`).toBeTruthy();
      expect(dest.sourceUrl, `Source URL missing for ${dest.id}`).toBeTruthy();
      expect(dest.sourceUrl!.startsWith('https://'), `Source URL must use HTTPS for ${dest.id}`).toBe(true);
      expect(allowedSourceTypes).toContain(dest.sourceType);
      expect(dest.lastReviewedDate).toBe('2026-10-31');
    });
  });

  // 6. Valid category and tag values
  it('6. Valid category and subregion values — conforms to schemas', () => {
    const validSubregions = new Set(NORTH_MAP_SUBREGIONS.map((s) => s.id));
    const validCategories = new Set(NORTH_MAP_CATEGORIES.map((c) => c.id));

    northVietnamDestinations.forEach((dest) => {
      expect(validSubregions.has(dest.subregion), `Invalid subregion ${dest.subregion} on ${dest.id}`).toBe(true);
      expect(validCategories.has(dest.category), `Invalid category ${dest.category} on ${dest.id}`).toBe(true);
      expect(dest.experiences.length).toBeGreaterThanOrEqual(3);
      expect(dest.localFood.length).toBeGreaterThanOrEqual(3);
      expect(dest.culturalHighlights.length).toBeGreaterThanOrEqual(2);
    });
  });

  // 7. Search aliases and accent-insensitive search
  it('7. Search aliases and accent-insensitive search — discovers newly added destinations', () => {
    // Accent-insensitive searches for newly added destinations
    const searchTuSan = vietnamSearchEngine.search('nho que tu san');
    expect(searchTuSan.totalCount).toBeGreaterThan(0);

    const searchVanMieu = vietnamSearchEngine.search('van mieu quoc tu giam');
    expect(searchVanMieu.totalCount).toBeGreaterThan(0);

    const searchMuCangChai = vietnamSearchEngine.search('mu cang chai');
    expect(searchMuCangChai.totalCount).toBeGreaterThan(0);

    const searchThacBanGioc = vietnamSearchEngine.search('ban gioc');
    expect(searchThacBanGioc.totalCount).toBeGreaterThan(0);

    // Search by historical alias
    const searchDoiMamXoi = vietnamSearchEngine.search('Đồi Mâm Xôi');
    expect(searchDoiMamXoi.totalCount).toBeGreaterThan(0);
  });

  // 8. Detail-page lookup
  it('8. Detail-page lookup — 100% of destinations resolve via repository lookup API', () => {
    let resolvedCount = 0;
    northVietnamDestinations.forEach((dest) => {
      const resolved = getDiscoveryDestinationById(dest.id);
      expect(resolved, `Failed to resolve ${dest.id}`).toBeDefined();
      if (resolved) {
        expect(resolved.id).toBe(dest.id);
        expect(resolved.vietnameseName).toBe(dest.vietnameseName);
        expect(resolved.subregion).toBe(dest.subregion);
        expect(resolved.latitude).toBe(dest.latitude);
        expect(resolved.longitude).toBe(dest.longitude);
        resolvedCount++;
      }
    });
    expect(resolvedCount).toBe(northVietnamDestinations.length);
  });

  // 9. No fallback to Hanoi for missing destination IDs
  it('9. No fallback to Hanoi for missing destination IDs', () => {
    const bogusIds = [
      'non-existent-dest-1',
      'hanoi-fake-attraction',
      'unknown-place-404',
      'invalid-id-xyz',
    ];

    bogusIds.forEach((id) => {
      const result = getDiscoveryDestinationById(id);
      expect(result).toBeUndefined();
    });
  });

  // 10. Map-ready records have verified coordinates
  it('10. Map-ready records have verified coordinates and high confidence scores', () => {
    const verifiedDestinations = northVietnamDestinations.filter((d) => d.verificationStatus === 'verified');
    expect(verifiedDestinations.length).toBeGreaterThanOrEqual(230);

    verifiedDestinations.forEach((dest) => {
      expect(dest.confidenceScore).toBeGreaterThanOrEqual(0.9);
      expect([
        'exact_landmark',
        'administrative_center',
        'scenic_pass',
        'island_centroid',
        'scenic_lake',
      ]).toContain(dest.coordinateConfidence);
    });
  });
});
