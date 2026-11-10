import { describe, it, expect } from 'vitest';
import {
  destinationRepository,
  getDiscoveryDestinationById,
  getAllDiscoveryDestinations,
  getAllNorthernDestinations,
  discoveryDestinationToLegacy,
} from '../destinationRepository.ts';
import { northVietnamDestinations } from '../../../data/northVietnamData.ts';
import { vietnamSearchEngine } from '../../search/vietnamSearchEngine.ts';

describe('TRAVI Destination Repository & Normalization Gateways', () => {
  describe('1. Destination Lookup & Northern Coverage', () => {
    it('successfully retrieves primary Northern hub destinations', () => {
      const hubs = [
        'ha-noi',
        'lao-cai-sapa',
        'ha-giang',
        'cao-bang',
        'quang-ninh-halong',
        'ninh-binh',
        'yen-bai-mucangchai',
      ];

      for (const hubId of hubs) {
        const dest = getDiscoveryDestinationById(hubId);
        expect(dest, `Failed to look up hub ${hubId}`).toBeDefined();
        expect(dest?.id).toBe(hubId);
        expect(dest?.vietnameseName).toBeTruthy();
        expect(dest?.latitude).toBeGreaterThan(18.0);
        expect(dest?.latitude).toBeLessThan(24.0);
        expect(dest?.longitude).toBeGreaterThan(102.0);
        expect(dest?.longitude).toBeLessThan(109.0);
      }
    });

    it('successfully retrieves detailed Northern destinations and natural sanctuaries', () => {
      const detailedNorthernIds = [
        'sapa',
        'dien-bien-phu',
        'moc-chau',
        'mai-chau',
        'dong-van',
        'ba-be-lake',
        'co-to-island',
        'tam-dao',
        'pu-luong-nature-reserve',
        'thanh-hoa-city',
      ];

      for (const destId of detailedNorthernIds) {
        const dest = getDiscoveryDestinationById(destId);
        expect(dest, `Expected destination ${destId} to resolve`).toBeDefined();
        expect(dest?.subregion).not.toBe('Chưa phân vùng');
        expect(dest?.experiences.length).toBeGreaterThan(0);
        expect(dest?.images.length).toBeGreaterThan(0);
      }
    });

    it('ensures all Northern destinations resolve through the repository', () => {
      const northRecords = northVietnamDestinations;
      expect(northRecords.length).toBe(237);

      let resolvedCount = 0;
      for (const record of northRecords) {
        const resolved = getDiscoveryDestinationById(record.id);
        if (resolved) {
          resolvedCount++;
          expect(resolved.vietnameseName).toBe(record.vietnameseName);
          expect(resolved.subregion).toBe(record.subregion);
        }
      }
      expect(resolvedCount).toBe(237);

      const allNorthern = getAllNorthernDestinations();
      expect(allNorthern.length).toBeGreaterThanOrEqual(230);
      expect(destinationRepository.getAll().length).toBeGreaterThanOrEqual(230);
    });
  });

  describe('2. Regression Test: Invalid Destination IDs & Fallback Removal', () => {
    it('returns undefined for non-existent IDs instead of falling back to Hà Nội', () => {
      const invalidIds = [
        'invalid-destination-999',
        'random-place-xyz',
        'does-not-exist',
        '404-not-found-id',
      ];

      for (const invalidId of invalidIds) {
        const result = getDiscoveryDestinationById(invalidId);
        expect(result).toBeUndefined();
        // Specifically assert that it NEVER returns Hà Nội
        if (result) {
          expect((result as any).id).not.toBe('ha-noi');
          expect((result as any).name).not.toBe('Hà Nội');
        }
      }
    });

    it('returns undefined for empty, null, or undefined inputs', () => {
      expect(getDiscoveryDestinationById('')).toBeUndefined();
      expect(getDiscoveryDestinationById('   ')).toBeUndefined();
      expect(getDiscoveryDestinationById(undefined)).toBeUndefined();
    });
  });

  describe('3. Deduplication & Identifier Integrity', () => {
    it('ensures all destination IDs across the repository are strictly unique', () => {
      const allDests = getAllDiscoveryDestinations();
      expect(allDests.length).toBeGreaterThan(80);

      const idSet = new Set<string>();
      const duplicates: string[] = [];

      for (const dest of allDests) {
        if (idSet.has(dest.id)) {
          duplicates.push(dest.id);
        }
        idSet.add(dest.id);
      }

      expect(duplicates).toEqual([]);
      expect(idSet.size).toBe(allDests.length);
    });

    it('verifies coordinate and geographic validity for all records', () => {
      const allDests = getAllDiscoveryDestinations();

      for (const dest of allDests) {
        expect(dest.id).toBeTruthy();
        expect(dest.name).toBeTruthy();
        expect(dest.vietnameseName).toBeTruthy();
        expect(Number.isFinite(dest.latitude)).toBe(true);
        expect(Number.isFinite(dest.longitude)).toBe(true);

        // Latitude inside Vietnam range (8.5°N - 24.0°N)
        expect(dest.latitude).toBeGreaterThan(8.0);
        expect(dest.latitude).toBeLessThan(24.0);

        // Longitude inside Vietnam range (102.0°E - 110.0°E)
        expect(dest.longitude).toBeGreaterThan(102.0);
        expect(dest.longitude).toBeLessThan(110.0);
      }
    });
  });

  describe('4. Search Aliases & Indexing Consistency', () => {
    it('resolves historical and phonetic aliases to canonical destinations', () => {
      // Historical alias: Thăng Long -> Hà Nội
      const thangLong = getDiscoveryDestinationById('thanglong');
      expect(thangLong?.id).toBe('ha-noi');

      // Canonical slug aliases: sapa -> sapa
      const sapa = getDiscoveryDestinationById('sapa');
      expect(sapa?.id).toBe('sapa');

      // Hyphenated alias: sa-pa -> sapa
      const sapaHyphen = getDiscoveryDestinationById('sa-pa');
      expect(sapaHyphen?.id).toBe('sapa');

      // Ninh Bình alias
      const ninhBinh = getDiscoveryDestinationById('ninhbinh');
      expect(ninhBinh?.id).toBe('ninh-binh');

      // Mù Cang Chải alias
      const muCangChai = getDiscoveryDestinationById('mucangchai');
      expect(muCangChai?.id).toBe('mu-cang-chai');
    });

    it('searches destinations with accent-insensitive support', () => {
      // Search with diacritics
      const resWithAccent = vietnamSearchEngine.search('Cao Bằng');
      expect(resWithAccent.totalCount).toBeGreaterThan(0);
      expect(
        resWithAccent.destinations.some(
          (r) => r.vietnameseName.includes('Cao Bằng') || r.name.includes('Cao Bang')
        )
      ).toBe(true);

      // Search without diacritics
      const resWithoutAccent = vietnamSearchEngine.search('cao bang');
      expect(resWithoutAccent.totalCount).toBeGreaterThan(0);
      expect(
        resWithoutAccent.destinations.some(
          (r) => r.vietnameseName.includes('Cao Bằng') || r.name.includes('Cao Bang')
        )
      ).toBe(true);
    });

    it('indexes local gastronomy and dishes across Northern destinations', () => {
      // "thắng cố" in Northern mountain destinations
      const thangCoResults = vietnamSearchEngine.search('thắng cố');
      expect(thangCoResults.totalCount).toBeGreaterThan(0);

      // "phở chua" in Cao Bằng / Lạng Sơn
      const phoChuaResults = vietnamSearchEngine.search('phở chua');
      expect(phoChuaResults.totalCount).toBeGreaterThan(0);

      // "chả mực" in Hạ Long
      const chaMucResults = vietnamSearchEngine.search('chả mực');
      expect(chaMucResults.totalCount).toBeGreaterThan(0);
    });

    it('indexes Northern map feature and routes', () => {
      const mapResults = vietnamSearchEngine.search('bản đồ miền bắc');
      expect(mapResults.totalCount).toBeGreaterThan(0);
      expect(
        mapResults.destinations.some((r) => r.routeUrl === '/map/north')
      ).toBe(true);
    });
  });

  describe('5. Data Quality, Administrative Governance & Precision Metadata', () => {
    it('distinguishes exact landmark coordinates from administrative center coordinates', () => {
      const allDests = getAllDiscoveryDestinations();

      const exactCount = allDests.filter((d) => d.coordinateStatus === 'exact_landmark').length;
      const adminCount = allDests.filter((d) => d.coordinateStatus === 'administrative_center').length;

      expect(exactCount).toBeGreaterThan(0);
      expect(adminCount).toBeGreaterThan(0);
    });

    it('maintains provenance references and does not mark all records blindly as verified', () => {
      const allDests = getAllDiscoveryDestinations();

      const needsReviewCount = allDests.filter((d) => d.dataStatus === 'needs_review').length;
      // We do NOT mark all records as verified without editorial audit
      expect(needsReviewCount).toBeGreaterThan(0);

      for (const dest of allDests) {
        expect(dest.sourceReferences.length).toBeGreaterThan(0);
        for (const src of dest.sourceReferences) {
          expect(src.name).toBeTruthy();
          expect(src.sourceType).toBeTruthy();
        }
      }
    });

    it('converts to legacy Destination format while preserving required UI contract fields', () => {
      const hanoi = getDiscoveryDestinationById('ha-noi');
      expect(hanoi).toBeDefined();

      const legacy = discoveryDestinationToLegacy(hanoi!);
      expect(legacy.id).toBe('ha-noi');
      expect(legacy.name).toBe(hanoi!.name);
      expect(legacy.vietnameseName).toBe(hanoi!.vietnameseName);
      expect(legacy.country).toBe('Vietnam');
      expect(legacy.coordinates?.latitude).toBe(hanoi!.latitude);
      expect(legacy.coordinates?.longitude).toBe(hanoi!.longitude);
      expect(legacy.tags.length).toBeGreaterThan(0);
      expect(legacy.culture?.destinationId).toBe('ha-noi');
    });
  });
});
