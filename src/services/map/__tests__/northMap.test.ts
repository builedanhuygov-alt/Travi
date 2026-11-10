import { describe, it, expect } from 'vitest';
import {
  northVietnamDestinations,
  NORTH_MAP_SUBREGIONS,
  NORTH_MAP_CATEGORIES,
} from '../../../data/northVietnamData.ts';
import {
  calculateHaversineDistance,
  calculateRouteSummary,
  detectTerrainCharacteristics,
  estimateDriveTimeHours,
} from '../routeEngine.ts';
import { clusterDestinations } from '../clusteringEngine.ts';
import {
  NORTH_VIETNAM_BOUNDS,
  SUBREGION_BOUNDS,
} from '../mapConfig.ts';

describe('TRAVI NORTH MAP — Dataset & Coordinate Quality Gates', () => {
  it('contains at least 180 structured Northern Vietnam destinations across all 5 subregions', () => {
    expect(northVietnamDestinations.length).toBeGreaterThanOrEqual(180);

    const subregionsPresent = new Set(northVietnamDestinations.map((d) => d.subregion));
    expect(subregionsPresent.size).toBe(5);

    NORTH_MAP_SUBREGIONS.forEach((sub) => {
      expect(subregionsPresent.has(sub.id)).toBe(true);
      const count = northVietnamDestinations.filter((d) => d.subregion === sub.id).length;
      expect(count).toBeGreaterThanOrEqual(10); // Each subregion has at least 10 destinations
    });
  });

  it('validates that all geographical coordinates fall within Northern Vietnam bounds (18°N to 23.4°N, 102°E to 108.3°E)', () => {
    northVietnamDestinations.forEach((dest) => {
      expect(dest.latitude).toBeGreaterThanOrEqual(NORTH_VIETNAM_BOUNDS.minLat);
      expect(dest.latitude).toBeLessThanOrEqual(NORTH_VIETNAM_BOUNDS.maxLat);
      expect(dest.longitude).toBeGreaterThanOrEqual(NORTH_VIETNAM_BOUNDS.minLng);
      expect(dest.longitude).toBeLessThanOrEqual(NORTH_VIETNAM_BOUNDS.maxLng);

      // Sanity check: latitude must never equal longitude or be inverted in Vietnam
      expect(dest.latitude).toBeLessThan(dest.longitude);
      expect(isNaN(dest.latitude)).toBe(false);
      expect(isNaN(dest.longitude)).toBe(false);
    });
  });

  it('ensures zero unresolved coordinates and strict verification status discipline', () => {
    const unresolved = northVietnamDestinations.filter((d) => d.verificationStatus === 'unresolved');
    expect(unresolved.length).toBe(0);

    const verified = northVietnamDestinations.filter((d) => d.verificationStatus === 'verified');
    const needsReview = northVietnamDestinations.filter((d) => d.verificationStatus === 'needs_review');

    // Vast majority are verified
    expect(verified.length).toBeGreaterThanOrEqual(180);
    // Explicitly tracked needs_review destinations exist as required by prompt Section 5
    expect(needsReview.length).toBeGreaterThan(0);

    verified.forEach((dest) => {
      expect(dest.confidenceScore).toBeGreaterThanOrEqual(0.9);
    });
  });

  it('verifies all required fields exist for every destination record', () => {
    northVietnamDestinations.forEach((dest) => {
      expect(dest.id).toBeTruthy();
      expect(dest.name).toBeTruthy();
      expect(dest.vietnameseName).toBeTruthy();
      expect(dest.slug).toBeTruthy();
      expect(dest.provinceOrRegion).toBeTruthy();
      expect(dest.subregion).toBeTruthy();
      expect(dest.category).toBeTruthy();
      expect(dest.shortDescription).toBeTruthy();
      expect(dest.image).toMatch(/^https?:\/\//);
      expect(Array.isArray(dest.experiences)).toBe(true);
      expect(dest.experiences.length).toBeGreaterThan(0);
      expect(Array.isArray(dest.localFood)).toBe(true);
      expect(dest.localFood.length).toBeGreaterThan(0);
      expect(Array.isArray(dest.culturalHighlights)).toBe(true);
      expect(dest.culturalHighlights.length).toBeGreaterThan(0);
      expect(dest.source).toBeTruthy();
      expect(dest.verificationStatus).toBeTruthy();
      expect(dest.coordinateConfidence).toBeTruthy();
    });
  });

  it('verifies all 10 filter categories are utilized in the dataset', () => {
    const usedCategories = new Set(northVietnamDestinations.map((d) => d.category));
    NORTH_MAP_CATEGORIES.forEach((cat) => {
      expect(usedCategories.has(cat.id)).toBe(true);
    });
  });
});

describe('TRAVI NORTH MAP — Haversine Distance & Route Calculation Engine', () => {
  it('accurately calculates Haversine straight-line distance between Hanoi and Sa Pa (~250km)', () => {
    const hanoi = northVietnamDestinations.find((d) => d.id === 'ha-noi')!;
    const sapa = northVietnamDestinations.find((d) => d.id === 'sapa')!;

    expect(hanoi).toBeDefined();
    expect(sapa).toBeDefined();

    const distance = calculateHaversineDistance(
      hanoi.latitude,
      hanoi.longitude,
      sapa.latitude,
      sapa.longitude
    );

    // Exact geographic distance is ~251-253 km
    expect(distance).toBeGreaterThan(240);
    expect(distance).toBeLessThan(265);
  });

  it('accurately calculates multi-waypoint route summary and labels distance as straight_line_geographic', () => {
    const hanoi = northVietnamDestinations.find((d) => d.id === 'ha-noi')!;
    const sapa = northVietnamDestinations.find((d) => d.id === 'sapa')!;
    const hagiang = northVietnamDestinations.find((d) => d.id === 'ha-giang-city')!;

    const result = calculateRouteSummary([hanoi, sapa, hagiang]);

    expect(result.waypoints.length).toBe(3);
    expect(result.distanceType).toBe('straight_line_geographic');
    expect(result.totalGeographicDistanceKm).toBeGreaterThan(350);
    expect(result.coordinates.length).toBe(3);
    expect(result.estimatedDriveTimeHours).toBeGreaterThan(5);
  });

  it('detects mountain pass terrain for Northwest/Northeast and delta highway for Red River Delta', () => {
    const sapa = northVietnamDestinations.find((d) => d.id === 'sapa')!;
    const hagiang = northVietnamDestinations.find((d) => d.id === 'ha-giang-city')!;
    const hanoi = northVietnamDestinations.find((d) => d.id === 'ha-noi')!;
    const haiphong = northVietnamDestinations.find((d) => d.id === 'hai-phong-city')!;

    expect(detectTerrainCharacteristics([sapa, hagiang])).toBe('mountain_pass');
    expect(detectTerrainCharacteristics([hanoi, haiphong])).toBe('delta_highway');
    expect(detectTerrainCharacteristics([sapa, hanoi])).toBe('mixed_terrain');
  });

  it('calculates realistic travel time estimates accounting for terrain winding factors', () => {
    const mountainHours = estimateDriveTimeHours(100, 'mountain_pass');
    const deltaHours = estimateDriveTimeHours(100, 'delta_highway');

    // Mountain road takes longer due to winding passes and lower speed limits
    expect(mountainHours).toBeGreaterThan(deltaHours);
  });
});

describe('TRAVI NORTH MAP — Marker Clustering Engine', () => {
  it('clusters markers when zoom is low (< 10) and clustering is enabled', () => {
    const clusters = clusterDestinations(northVietnamDestinations, 7, 55, true);

    // With 81 markers clustered at zoom 7, count of display items should be significantly smaller than 81
    expect(clusters.length).toBeLessThan(northVietnamDestinations.length);

    const clusterItems = clusters.filter((c) => c.isCluster);
    expect(clusterItems.length).toBeGreaterThan(0);

    clusterItems.forEach((c) => {
      if (c.isCluster) {
        expect(c.count).toBeGreaterThan(1);
        expect(c.destinations.length).toBe(c.count);
        expect(c.latitude).toBeGreaterThan(18);
        expect(c.longitude).toBeGreaterThan(102);
      }
    });
  });

  it('returns individual single markers when zoom is >= 10 or clustering is disabled', () => {
    const atZoom11 = clusterDestinations(northVietnamDestinations, 11, 55, true);
    expect(atZoom11.length).toBe(northVietnamDestinations.length);
    expect(atZoom11.every((item) => !item.isCluster)).toBe(true);

    const disabled = clusterDestinations(northVietnamDestinations, 7, 55, false);
    expect(disabled.length).toBe(northVietnamDestinations.length);
    expect(disabled.every((item) => !item.isCluster)).toBe(true);
  });
});

describe('TRAVI NORTH MAP — Subregion Bounds Configuration', () => {
  it('has bounding boxes configured for all 5 subregions', () => {
    NORTH_MAP_SUBREGIONS.forEach((sub) => {
      const config = SUBREGION_BOUNDS[sub.id];
      expect(config).toBeDefined();
      expect(config.bounds.length).toBe(2);
      expect(config.center.length).toBe(2);
      expect(config.zoom).toBeGreaterThanOrEqual(7);
    });
  });
});
