import { describe, it, expect } from 'vitest';
import {
  vietnamDestinations,
  getVietnamDestinationById,
  getDestinationsByRegion,
  getDestinationsByCategory,
  searchVietnamDestinations,
} from '../vietnamData.ts';

describe('Vietnam Destination Database Architecture (Phase 3)', () => {
  it('covers 34 provincial units with valid schema', () => {
    expect(vietnamDestinations.length).toBe(34);

    for (const dest of vietnamDestinations) {
      expect(dest.id).toBeDefined();
      expect(dest.name).toBeDefined();
      expect(dest.provinceOrMunicipality).toBeDefined();
      expect(dest.region).toMatch(/(Northern|Central|Southern)/);
      expect(dest.categories.length).toBeGreaterThan(0);
      expect(dest.editorialSummary.length).toBeGreaterThan(20);
      expect(dest.heroImage).toBeDefined();
      expect(dest.imageAttribution).toBeDefined();
      expect(dest.imageAttribution.source).toBe('Unsplash');
      expect(dest.mustTryFood.length).toBeGreaterThan(0);
      expect(dest.attractions.length).toBeGreaterThan(0);
      expect(dest.estimatedVisitDays).toBeGreaterThan(0);
      expect(dest.bestSeason).toBeDefined();
      expect(dest.budgetEstimates.budgetDailyVND).toBeGreaterThan(0);
      expect(dest.budgetEstimates.moderateDailyVND).toBeGreaterThan(0);
    }
  });

  it('guarantees genuine coordinates within Vietnam geographic bounding box [8.2°N - 23.6°N, 102.0°E - 110.2°E]', () => {
    for (const dest of vietnamDestinations) {
      const { lat, lng } = dest.coordinates;
      expect(lat).toBeGreaterThanOrEqual(8.2);
      expect(lat).toBeLessThanOrEqual(23.6);
      expect(lng).toBeGreaterThanOrEqual(102.0);
      expect(lng).toBeLessThanOrEqual(110.2);
    }
  });

  it('preserves historical place names and former administrative boundaries where applicable', () => {
    const hanoi = getVietnamDestinationById('ha-noi');
    expect(hanoi?.historicalNames?.join(' ')).toContain('Thăng Long');

    const saigon = getVietnamDestinationById('ho-chi-minh-city');
    expect(saigon?.historicalNames?.join(' ')).toContain('Gia Định');

    const hoian = getVietnamDestinationById('quang-nam-hoian');
    expect(hoian?.historicalNames?.join(' ')).toContain('Faifo');

    const ninhbinh = getVietnamDestinationById('ninh-binh');
    expect(ninhbinh?.historicalNames?.join(' ')).toContain('Cố Đô Hoa Lư');
  });

  it('filters destinations accurately by region and category', () => {
    const north = getDestinationsByRegion('Northern');
    const central = getDestinationsByRegion('Central');
    const south = getDestinationsByRegion('Southern');

    expect(north.length).toBeGreaterThan(0);
    expect(central.length).toBeGreaterThan(0);
    expect(south.length).toBeGreaterThan(0);
    expect(north.length + central.length + south.length).toBe(34);

    const heritage = getDestinationsByCategory('Heritage & History');
    expect(heritage.length).toBeGreaterThan(0);
    expect(heritage.some((d) => d.id === 'thua-thien-hue')).toBe(true);
  });

  it('searches by keyword across names, historical names, and gastronomy', () => {
    const phoSearches = searchVietnamDestinations('Phở');
    expect(phoSearches.length).toBeGreaterThan(0);
    expect(phoSearches.some((d) => d.id === 'ha-noi')).toBe(true);

    const faifoSearches = searchVietnamDestinations('Faifo');
    expect(faifoSearches.some((d) => d.id === 'quang-nam-hoian')).toBe(true);
  });

  it('validates 2025 administrative reorganization structure (34 provincial units)', () => {
    const { getAllAdministrativeUnits } = require('../vietnamAdministrativeUnits.ts');
    const units = getAllAdministrativeUnits();
    expect(units.length).toBe(34);

    const municipalities = units.filter((u: any) => u.administrativeType === 'Centrally-Governed Municipality');
    const provinces = units.filter((u: any) => u.administrativeType === 'Province');

    expect(municipalities.length).toBe(6);
    expect(provinces.length).toBe(28);

    // Verify 6 centrally-governed municipalities
    const muniNames = municipalities.map((m: any) => m.officialVietnameseName);
    expect(muniNames).toContain('Thành phố Hà Nội');
    expect(muniNames).toContain('Thành phố Hồ Chí Minh');
    expect(muniNames).toContain('Thành phố Hải Phòng');
    expect(muniNames).toContain('Thành phố Đà Nẵng');
    expect(muniNames).toContain('Thành phố Huế');
    expect(muniNames).toContain('Thành phố Cần Thơ');
  });

  it('verifies parent-child containment and distinguishes administrative units from tourist destinations', () => {
    for (const dest of vietnamDestinations) {
      expect(dest.administrativeUnitId).toBeDefined();
      expect(dest.officialAdministrativeName).toBeDefined();
      expect(dest.administrativeRelationship).toBeDefined();
      expect(typeof dest.isFormerProvince).toBe('boolean');
      expect(dest.provenanceMetadata).toBeDefined();
      expect(dest.provenanceMetadata.source).toBeDefined();
      expect(dest.provenanceMetadata.verifiedDate).toBe('2026-10-30');
    }

    // Verify specific merger containments
    const hagiang = getVietnamDestinationById('ha-giang');
    expect(hagiang?.administrativeUnitId).toBe('ad-tuyen-quang');
    expect(hagiang?.officialAdministrativeName).toBe('Tỉnh Tuyên Quang');
    expect(hagiang?.formerProvinceName).toBe('Tỉnh Hà Giang');

    const phuquoc = getVietnamDestinationById('kien-giang-phuquoc');
    expect(phuquoc?.administrativeUnitId).toBe('ad-an-giang');
    expect(phuquoc?.officialAdministrativeName).toBe('Tỉnh An Giang');
    expect(phuquoc?.formerProvinceName).toBe('Tỉnh Kiên Giang');

    const condao = getVietnamDestinationById('ba-ria-condao');
    expect(condao?.administrativeUnitId).toBe('ad-ho-chi-minh');
    expect(condao?.officialAdministrativeName).toBe('Thành phố Hồ Chí Minh');
    expect(condao?.formerProvinceName).toBe('Tỉnh Bà Rịa - Vũng Tàu');
  });

  it('accurately distinguishes verified records from records requiring editorial review', () => {
    const verified = vietnamDestinations.filter((d) => d.verificationStatus === 'Verified Editorial');
    const review = vietnamDestinations.filter((d) => d.verificationStatus === 'Under Editorial Review');

    expect(verified.length).toBe(24);
    expect(review.length).toBe(10);
    expect(verified.length + review.length).toBe(34);

    // Records under review must contain explicit verification notes explaining why
    for (const item of review) {
      expect(item.provenanceMetadata.verificationNotes).toBeDefined();
      expect(item.provenanceMetadata.verificationNotes?.length).toBeGreaterThan(15);
    }
  });

  it('keeps historical province names searchable without representing them as current administrative units', () => {
    // Searching former province "Hà Giang" finds the destination contained in Tuyên Quang
    const hagiangResults = searchVietnamDestinations('Hà Giang');
    expect(hagiangResults.some((d) => d.id === 'ha-giang')).toBe(true);
    const hg = hagiangResults.find((d) => d.id === 'ha-giang');
    expect(hg?.officialAdministrativeName).toBe('Tỉnh Tuyên Quang');

    // Searching former province "Quảng Nam" finds Hội An contained in Đà Nẵng
    const quangnamResults = searchVietnamDestinations('Quảng Nam');
    expect(quangnamResults.some((d) => d.id === 'quang-nam-hoian')).toBe(true);
    const qn = quangnamResults.find((d) => d.id === 'quang-nam-hoian');
    expect(qn?.officialAdministrativeName).toBe('Thành phố Đà Nẵng');

    // Searching former province "Kiên Giang" finds Phú Quốc contained in An Giang
    const kiengiangResults = searchVietnamDestinations('Kiên Giang');
    expect(kiengiangResults.some((d) => d.id === 'kien-giang-phuquoc')).toBe(true);
    const kg = kiengiangResults.find((d) => d.id === 'kien-giang-phuquoc');
    expect(kg?.officialAdministrativeName).toBe('Tỉnh An Giang');
  });
});

