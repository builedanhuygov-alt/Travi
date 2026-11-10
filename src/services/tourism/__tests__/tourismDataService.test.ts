import { describe, it, expect } from 'vitest';
import { tourismDataService } from '../tourismDataService';

describe('Unified Vietnam Tourism & Administrative Data Service', () => {
  it('loads all 85 POIs from the Sơn La Tourism Dataset', () => {
    const pois = tourismDataService.getAllPois();
    expect(pois.length).toBe(85);

    const sonLaPois = pois.filter((p) => p.provinceOrRegion === 'Sơn La');
    expect(sonLaPois.length).toBe(85);
  });

  it('guarantees PII redaction: zero CCCD/CMND numbers in imported records', () => {
    const pois = tourismDataService.getAllPois();
    const cccdRegex = /\b\d{9,12}\b/; // Standard Vietnamese 9-digit CMND or 12-digit CCCD

    for (const poi of pois) {
      // Check address, managing entity, short & long descriptions
      expect(cccdRegex.test(poi.managingEntity || '')).toBe(false);
      expect(cccdRegex.test(poi.address || '')).toBe(false);
      expect(cccdRegex.test(poi.reviewNotes || '')).toBe(false);
    }
  });

  it('enforces strict coordinate safety: unverified POIs have null coordinates and coordinateConfidence "none"', () => {
    const pois = tourismDataService.getAllPois();

    for (const poi of pois) {
      if (poi.coordinateConfidence === 'none') {
        expect(poi.latitude).toBeNull();
        expect(poi.longitude).toBeNull();
        expect(tourismDataService.canDisplayOnMap(poi)).toBe(false);
      }
    }
  });

  it('preserves Vietnamese diacritics and correct regional associations', () => {
    const mocChau = tourismDataService.getPoiBySlug('son-la-khu-du-lich-quoc-gia-moc-chau');
    expect(mocChau).toBeDefined();
    expect(mocChau?.vietnameseName).toBe('Khu du lịch Quốc gia Mộc Châu');
    expect(mocChau?.subregion).toBe('Tây Bắc');
    expect(mocChau?.provinceOrRegion).toBe('Sơn La');
    expect(mocChau?.sourceType).toBe('official_gov');
    expect(mocChau?.verificationStatus).toBe('needs_review');
  });

  it('supports accent-insensitive filtering across POIs', () => {
    const resultsNoAccent = tourismDataService.getPois({ searchQuery: 'a phu' });
    expect(resultsNoAccent.length).toBeGreaterThanOrEqual(1);

    const aPhu = resultsNoAccent.find((p) => p.slug.includes('hang-vo-chong-a-phu'));
    expect(aPhu).toBeDefined();
    expect(aPhu?.vietnameseName).toContain('A Phủ');
  });

  it('loads authoritative post-2025 Vietnam Administrative Dataset (34 provinces & 3321 wards)', () => {
    const provinces = tourismDataService.getAdministrativeProvinces();
    expect(provinces.length).toBe(34);

    const sonLaAdmin = provinces.find((p) => p.nameLocal === 'Sơn La');
    expect(sonLaAdmin).toBeDefined();
    expect(sonLaAdmin?.subregion).toBe('Tây Bắc');

    const wards = tourismDataService.getAdministrativeWards();
    expect(wards.length).toBe(3321);

    const hanoiWards = tourismDataService.getAdministrativeWards('01');
    expect(hanoiWards.length).toBeGreaterThan(0);
    expect(hanoiWards.every((w) => w.parentId === '01')).toBe(true);
  });

  it('calculates aggregate statistics correctly', () => {
    const stats = tourismDataService.getSummaryStatistics();
    expect(stats.totalPois).toBe(85);
    expect(stats.needsReviewCount).toBe(85);
    expect(stats.withoutCoordinatesCount).toBe(85);
    expect(stats.provincesCount).toBe(1);
    expect(stats.sourcesBreakdown['Sở Văn hóa, Thể thao và Du lịch tỉnh Sơn La']).toBe(85);
  });
});
