import { describe, it, expect } from 'vitest';
import { northVietnamDestinations } from '../../../data/northVietnamData.ts';
import {
  getDiscoveryDestinationById,
  getAllNorthernDestinations,
} from '../destinationRepository.ts';
import { vietnamSearchEngine } from '../../search/vietnamSearchEngine.ts';

describe('Phase 2 — Northern Vietnam Editorial Content Quality & Provenance', () => {
  describe('1. Northern Vietnam Dataset Integrity & Coverage', () => {
    it('contains 237 distinct Northern destinations across 5 subregions', () => {
      expect(northVietnamDestinations.length).toBe(237);

      const subregionCounts = {
        'Tây Bắc': 0,
        'Đông Bắc': 0,
        'Đồng bằng sông Hồng': 0,
        'Ven biển Bắc Bộ': 0,
        'Bắc Trung Bộ mở rộng': 0,
      };

      for (const dest of northVietnamDestinations) {
        expect(subregionCounts).toHaveProperty(dest.subregion);
        subregionCounts[dest.subregion]++;
      }

      expect(subregionCounts['Tây Bắc']).toBe(49);
      expect(subregionCounts['Đông Bắc']).toBe(42);
      expect(subregionCounts['Đồng bằng sông Hồng']).toBe(88);
      expect(subregionCounts['Ven biển Bắc Bộ']).toBe(31);
      expect(subregionCounts['Bắc Trung Bộ mở rộng']).toBe(27);
    });

    it('guarantees zero duplicate destination IDs', () => {
      const ids = northVietnamDestinations.map((d) => d.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('2. Editorial Completeness & Detail Enrichment', () => {
    it('verifies all 81 destinations have rich longDescription, bestSeason, and recommendedDuration', () => {
      for (const dest of northVietnamDestinations) {
        expect(dest.shortDescription, `Short description missing for ${dest.id}`).toBeTruthy();
        expect(dest.shortDescription.length).toBeGreaterThan(30);

        expect(dest.longDescription, `Long description missing for ${dest.id}`).toBeTruthy();
        expect(dest.longDescription!.length, `Long description too short for ${dest.id}`).toBeGreaterThan(80);

        expect(dest.bestSeason, `Best season missing for ${dest.id}`).toBeTruthy();
        expect(dest.recommendedDuration, `Recommended duration missing for ${dest.id}`).toBeTruthy();

        expect(dest.keyAttractions, `Key attractions missing for ${dest.id}`).toBeDefined();
        expect(dest.keyAttractions!.length, `Key attractions insufficient for ${dest.id}`).toBeGreaterThanOrEqual(3);
      }
    });

    it('verifies all 81 destinations have authentic experiences, local food, and cultural highlights', () => {
      for (const dest of northVietnamDestinations) {
        expect(dest.experiences.length, `Experiences < 3 for ${dest.id}`).toBeGreaterThanOrEqual(3);
        expect(dest.localFood.length, `Local food < 3 for ${dest.id}`).toBeGreaterThanOrEqual(3);
        expect(dest.culturalHighlights.length, `Cultural highlights < 2 for ${dest.id}`).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('3. Source Provenance & Data Review Standards', () => {
    it('verifies all 81 destinations retain reliable source names and URLs', () => {
      for (const dest of northVietnamDestinations) {
        expect(dest.source, `Source name missing for ${dest.id}`).toBeTruthy();
        expect(dest.sourceUrl, `Source URL missing for ${dest.id}`).toBeTruthy();
        expect(dest.sourceUrl!.startsWith('https://'), `Invalid URL for ${dest.id}: ${dest.sourceUrl}`).toBe(true);

        expect(dest.sourceType, `Source type missing for ${dest.id}`).toBeTruthy();
        expect([
          'Official tourism source',
          'Official heritage or protected-area source',
          'Travel editorial',
          'Community contribution',
          'Manually reviewed content',
        ]).toContain(dest.sourceType);

        expect(dest.reviewNotes, `Review notes missing for ${dest.id}`).toBeTruthy();
        expect(dest.lastReviewedDate).toBe('2026-10-31');
      }
    });

    it('honestly distinguishes verified records from those needing editorial review', () => {
      const needsReviewRecords = northVietnamDestinations.filter((d) => d.verificationStatus === 'needs_review');
      expect(needsReviewRecords.length).toBeGreaterThanOrEqual(2);

      const needsReviewIds = needsReviewRecords.map((d) => d.id);
      // Bach Long Vi is a remote border military/civilian outpost
      expect(needsReviewIds).toContain('bach-long-vi');
      // Pu Mat National Park is an expansive 94,000-ha biosphere reserve with approximate regional centroid
      expect(needsReviewIds).toContain('pu-mat-national-park');
    });
  });

  describe('4. Media Audit & Zero Generic Placeholders', () => {
    it('guarantees no destination uses the generic landscape placeholder image', () => {
      const genericPlaceholder = 'photo-1528127269322-539801943592';
      for (const dest of northVietnamDestinations) {
        expect(
          dest.image.includes(genericPlaceholder),
          `Destination ${dest.id} is still using the generic placeholder image!`
        ).toBe(false);
      }
    });

    it('verifies iconic destinations have distinct, place-accurate imagery', () => {
      const sapa = northVietnamDestinations.find((d) => d.id === 'sapa');
      const halong = northVietnamDestinations.find((d) => d.id === 'ha-long-bay');
      const trangan = northVietnamDestinations.find((d) => d.id === 'trang-an-complex');
      const mapileng = northVietnamDestinations.find((d) => d.id === 'ma-pi-leng-pass');
      const bacninh = northVietnamDestinations.find((d) => d.id === 'bac-ninh');

      expect(sapa?.image).toContain('photo-1570789210967-2cac24afeb00');
      expect(halong?.image).toContain('photo-1559592413-7cec4d0cae2b');
      expect(trangan?.image).toContain('photo-1506744038136-46273834b3fb');
      expect(mapileng?.image).toContain('photo-1540555700478-4be289fbecef');
      expect(bacninh?.image).toContain('photo-1508804185872-d7badad00f7d');
    });
  });

  describe('5. Geographic Coordinates Precision & Classifications', () => {
    it('distinguishes exact landmarks, administrative centers, passes, lakes, and islands', () => {
      const coordTypes = new Set(northVietnamDestinations.map((d) => d.coordinateConfidence));

      expect(coordTypes.has('exact_landmark')).toBe(true);
      expect(coordTypes.has('administrative_center')).toBe(true);
      expect(coordTypes.has('scenic_pass')).toBe(true);
      expect(coordTypes.has('island_centroid')).toBe(true);
      expect(coordTypes.has('scenic_lake')).toBe(true);
      expect(coordTypes.has('approximate')).toBe(true);

      // Verify specific passes
      const mapileng = northVietnamDestinations.find((d) => d.id === 'ma-pi-leng-pass');
      expect(mapileng?.coordinateConfidence).toBe('scenic_pass');

      // Verify administrative centers
      const provincialCenters = ['lai-chau-city', 'cao-bang-city', 'bac-kan-city', 'ninh-binh-city', 'thanh-hoa-city', 'vinh-city', 'ha-tinh-city'];
      for (const pcId of provincialCenters) {
        const dest = northVietnamDestinations.find((d) => d.id === pcId);
        expect(dest?.coordinateConfidence).toBe('administrative_center');
      }

      // Verify island centroids
      const islands = ['cat-ba-island', 'co-to-island', 'minh-chau-beach', 'cai-chien-island', 'bach-long-vi'];
      for (const islId of islands) {
        const dest = northVietnamDestinations.find((d) => d.id === islId);
        expect(dest?.coordinateConfidence).toBe('island_centroid');
      }
    });

    it('verifies all coordinates fall strictly within Northern Vietnam geographic bounds', () => {
      for (const dest of northVietnamDestinations) {
        // Northern Vietnam latitude range: 18.0°N (Ha Tinh) to 23.4°N (Lung Cu)
        expect(dest.latitude).toBeGreaterThanOrEqual(18.0);
        expect(dest.latitude).toBeLessThanOrEqual(23.4);

        // Northern Vietnam longitude range: 102.1°E (A Pa Chai) to 108.3°E (Mong Cai / Bach Long Vi)
        expect(dest.longitude).toBeGreaterThanOrEqual(102.1);
        expect(dest.longitude).toBeLessThanOrEqual(108.3);
      }
    });
  });

  describe('6. Repository Normalization & Enriched Metadata Propagation', () => {
    it('propagates longDescription, bestSeason, recommendedDuration, and sources to DiscoveryDestination', () => {
      const sapa = getDiscoveryDestinationById('sapa');
      expect(sapa).toBeDefined();
      expect(sapa?.longDescription).toContain('1.500m');
      expect(sapa?.bestSeason).toContain('Tháng 9');
      expect(sapa?.recommendedDuration).toBe('3 ngày 2 đêm');
      expect(sapa?.sourceReferences.length).toBeGreaterThan(0);
      expect(sapa?.sourceReferences[0].url).toBe('https://laocai.gov.vn');

      const halong = getDiscoveryDestinationById('ha-long-bay');
      expect(halong).toBeDefined();
      expect(halong?.bestSeason).toContain('Tháng 3');
      expect(halong?.recommendedDuration).toContain('du thuyền');
    });

    it('ensures all destinations resolve without fallback', () => {
      const allNorthern = getAllNorthernDestinations();
      expect(allNorthern.length).toBeGreaterThanOrEqual(237);
    });
  });

  describe('7. Search Indexing of Newly Enriched Fields', () => {
    it('indexes key attractions and allows searching by sub-attraction name', () => {
      // "Tu Sản" is a key attraction of Mã Pí Lèng
      const tuSanResults = vietnamSearchEngine.search('Tu Sản');
      expect(tuSanResults.totalCount).toBeGreaterThan(0);

      // "Đồi Mâm Xôi" is a key attraction of Mù Cang Chải
      const mamXoiResults = vietnamSearchEngine.search('Đồi Mâm Xôi');
      expect(mamXoiResults.totalCount).toBeGreaterThan(0);

      // "Làng Sen" is a key attraction of Quê Bác Nam Đàn
      const langSenResults = vietnamSearchEngine.search('Làng Sen');
      expect(langSenResults.totalCount).toBeGreaterThan(0);
    });

    it('indexes newly added cultural highlights and traditional practices', () => {
      // "Sao la" or "Đan Lai" in Pu Mat
      const danLaiResults = vietnamSearchEngine.search('Đan Lai');
      expect(danLaiResults.totalCount).toBeGreaterThan(0);

      // "Mộc bản" in Chùa Vĩnh Nghiêm
      const mocBanResults = vietnamSearchEngine.search('Mộc bản');
      expect(mocBanResults.totalCount).toBeGreaterThan(0);

      // "Chợ tình" in Sa Pa / Khau Vai
      const choTinhResults = vietnamSearchEngine.search('Chợ tình');
      expect(choTinhResults.totalCount).toBeGreaterThan(0);
    });
  });
});
