import { describe, it, expect } from 'vitest';
import {
  MAP_TILE_PROVIDERS,
  DEFAULT_TILE_PROVIDER_ID,
  NORTH_VIETNAM_BOUNDS,
} from '../mapConfig.ts';
import {
  VIETNAM_ARCHIPELAGOS,
} from '../vietnamIslandsConfig.ts';

describe('TRAVI MAP FIX — Tile Provider & OpenStreetMap Configuration', () => {
  it('uses OpenStreetMap standard raster tile endpoint as the default provider', () => {
    expect(DEFAULT_TILE_PROVIDER_ID).toBe('osmStandard');

    const defaultProvider = MAP_TILE_PROVIDERS[DEFAULT_TILE_PROVIDER_ID];
    expect(defaultProvider).toBeDefined();
    expect(defaultProvider.url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(defaultProvider.maxZoom).toBe(19);
  });

  it('displays visible and accurate OpenStreetMap attribution', () => {
    const osm = MAP_TILE_PROVIDERS.osmStandard;
    expect(osm.attribution).toContain('OpenStreetMap');
    expect(osm.attribution).toContain('https://www.openstreetmap.org/copyright');
  });

  it('does not contain broken Carto tile endpoints requiring API keys', () => {
    const providerIds = Object.keys(MAP_TILE_PROVIDERS);
    expect(providerIds).not.toContain('cartoDark');
    expect(providerIds).not.toContain('cartoVoyager');

    for (const id of providerIds) {
      const p = MAP_TILE_PROVIDERS[id];
      expect(p.url).not.toContain('cartocdn.com');
      expect(p.url).not.toContain('api_key');
    }
  });

  it('maintains default viewport focused on Northern Vietnam', () => {
    expect(NORTH_VIETNAM_BOUNDS.defaultCenter).toEqual([21.3, 105.3]);
    expect(NORTH_VIETNAM_BOUNDS.defaultZoom).toBe(7);
  });
});

describe('TRAVI MAP FIX — Vietnamese Maritime Sovereignty: Hoàng Sa & Trường Sa', () => {
  describe('1. Exact Vietnamese Labels', () => {
    it('uses the exact official label "QUẦN ĐẢO HOÀNG SA – VIỆT NAM"', () => {
      const hoangSa = VIETNAM_ARCHIPELAGOS.hoangSa;
      expect(hoangSa.officialLabel).toBe('QUẦN ĐẢO HOÀNG SA – VIỆT NAM');
    });

    it('uses the exact official label "QUẦN ĐẢO TRƯỜNG SA – VIỆT NAM"', () => {
      const truongSa = VIETNAM_ARCHIPELAGOS.truongSa;
      expect(truongSa.officialLabel).toBe('QUẦN ĐẢO TRƯỜNG SA – VIỆT NAM');
    });
  });

  describe('2. Geographic Coordinates & Accuracy', () => {
    it('accurately locates Quần đảo Hoàng Sa within the East Sea without inverted lat/lng', () => {
      const hoangSa = VIETNAM_ARCHIPELAGOS.hoangSa;
      const [lat, lng] = hoangSa.centroid;

      // Lat ~16.53°N, Lng ~111.60°E (Đảo Hoàng Sa)
      expect(lat).toBeGreaterThanOrEqual(15.5);
      expect(lat).toBeLessThanOrEqual(17.5);
      expect(lng).toBeGreaterThanOrEqual(111.0);
      expect(lng).toBeLessThanOrEqual(113.0);

      // Lat and Lng must never be inverted
      expect(lat).toBeLessThan(lng);
    });

    it('accurately locates Quần đảo Trường Sa within the East Sea without inverted lat/lng', () => {
      const truongSa = VIETNAM_ARCHIPELAGOS.truongSa;
      const [lat, lng] = truongSa.centroid;

      // Lat ~8.64°N, Lng ~111.92°E (Đảo Trường Sa Lớn)
      expect(lat).toBeGreaterThanOrEqual(7.0);
      expect(lat).toBeLessThanOrEqual(12.0);
      expect(lng).toBeGreaterThanOrEqual(111.0);
      expect(lng).toBeLessThanOrEqual(117.5);

      // Lat and Lng must never be inverted
      expect(lat).toBeLessThan(lng);
    });

    it('validates coordinates of individual key islands with verified provenance', () => {
      const allIslands = [
        ...VIETNAM_ARCHIPELAGOS.hoangSa.keyIslands,
        ...VIETNAM_ARCHIPELAGOS.truongSa.keyIslands,
      ];

      expect(allIslands.length).toBeGreaterThanOrEqual(10);

      allIslands.forEach((island) => {
        expect(island.id).toBeTruthy();
        expect(island.vietnameseName).toBeTruthy();
        expect(island.latitude).toBeGreaterThan(6.0);
        expect(island.latitude).toBeLessThan(18.0);
        expect(island.longitude).toBeGreaterThan(110.0);
        expect(island.longitude).toBeLessThan(118.0);
        expect(island.latitude).toBeLessThan(island.longitude);
        expect(island.status).toBe('verified');
        expect(island.sourceReference).toBeTruthy();
      });
    });
  });

  describe('3. Administrative Foundations & Official Sources', () => {
    it('properly documents administrative unit for Hoàng Sa (TP. Đà Nẵng, Nghị định 07/NĐ-CP)', () => {
      const hoangSa = VIETNAM_ARCHIPELAGOS.hoangSa;
      expect(hoangSa.administrativeUnit).toBe('Huyện Hoàng Sa');
      expect(hoangSa.governingProvinceOrCity).toBe('Thành phố Đà Nẵng');
      expect(hoangSa.legalFoundation).toContain('07/NĐ-CP');
      expect(hoangSa.sources.length).toBeGreaterThanOrEqual(2);
      expect(hoangSa.explanatoryCaption).toContain('Việt Nam');
      expect(hoangSa.explanatoryCaption).toContain('Đà Nẵng');
    });

    it('properly documents administrative unit for Trường Sa (Tỉnh Khánh Hòa, Nghị định 65/CP)', () => {
      const truongSa = VIETNAM_ARCHIPELAGOS.truongSa;
      expect(truongSa.administrativeUnit).toBe('Huyện Trường Sa');
      expect(truongSa.governingProvinceOrCity).toBe('Tỉnh Khánh Hòa');
      expect(truongSa.legalFoundation).toContain('65/CP');
      expect(truongSa.sources.length).toBeGreaterThanOrEqual(2);
      expect(truongSa.explanatoryCaption).toContain('Việt Nam');
      expect(truongSa.explanatoryCaption).toContain('Khánh Hòa');
    });
  });
});
