import { describe, it, expect, beforeEach } from 'vitest';
import {
  culturalDataService,
  MockCulturalDataProvider,
  RealCulturalDataProvider,
} from '../culturalDataService';

describe('Cultural Data API & Service Integration', () => {
  let mockProvider: MockCulturalDataProvider;

  beforeEach(() => {
    mockProvider = new MockCulturalDataProvider();
    culturalDataService.setDemoMode(true);
  });

  it('provides curated National Treasures in DEMO mode', async () => {
    const res = await mockProvider.getAssets();
    expect(res.mode).toBe('DEMO');
    expect(res.total).toBeGreaterThanOrEqual(4);

    const ngocLu = res.items.find((item) => item.slug === 'trong-dong-ngoc-lu');
    expect(ngocLu).toBeDefined();
    expect(ngocLu?.vietnameseName).toBe('Trống đồng Ngọc Lũ');
    expect(ngocLu?.isNationalTreasure).toBe(true);
    expect(ngocLu?.cultureOrPeriod).toContain('Đông Sơn');
  });

  it('filters cultural assets by query keyword', async () => {
    const res = await mockProvider.getAssets({ q: 'Đào Thịnh' });
    expect(res.items.length).toBe(1);
    expect(res.items[0].slug).toBe('thap-dong-dao-thinh');
  });

  it('filters cultural assets by assetType', async () => {
    const res = await mockProvider.getAssets({ type: 'monument' });
    expect(res.items.length).toBeGreaterThanOrEqual(1);
    expect(res.items[0].assetType).toBe('monument');
    expect(res.items[0].slug).toBe('bia-tien-si-van-mieu');
  });

  it('enforces separation of Cultural Asset, Holding Institution, and Visitable POI', async () => {
    const res = await mockProvider.getAssetBySlug('trong-dong-ngoc-lu');
    const asset = res.asset;

    // 1. Cultural Asset
    expect(asset.assetType).toBe('artifact');
    expect(asset.isNationalTreasure).toBe(true);

    // 2. Holding Institution
    expect(asset.holdingInstitution.name).toBe('Bảo tàng Lịch sử Quốc gia');
    expect(asset.holdingInstitution.city).toBe('Hà Nội');

    // 3. Discovery Location (Archaeological site != entrance gate)
    expect(asset.discoveryLocation?.province).toBe('Hà Nam');
    expect(asset.discoveryLocation?.notes).toContain('không phải tọa độ tham quan du lịch');

    // 4. Visitable Venue (Actual entrance with coordinates)
    expect(asset.visitableVenue).toBeDefined();
    expect(asset.visitableVenue?.entranceAddress).toContain('Số 1 Tràng Tiền');
    expect(asset.visitableVenue?.coordinates?.lat).toBeCloseTo(21.0253, 3);
  });

  it('throws error when querying non-existent slug', async () => {
    await expect(mockProvider.getAssetBySlug('non-existent-asset')).rejects.toThrow(
      'Cultural asset not found with slug: non-existent-asset'
    );
  });

  it('RealCulturalDataProvider safely rejects when API key is missing', async () => {
    const realProvider = new RealCulturalDataProvider('https://api.culturaldata.vn', '');
    await expect(realProvider.getAssets()).rejects.toThrow('CULTURAL_DATA_API_KEY is not configured');
  });

  it('culturalDataService supports toggling DEMO mode', () => {
    culturalDataService.setDemoMode(false);
    expect(culturalDataService.getDemoMode()).toBe(false);
    culturalDataService.setDemoMode(true);
    expect(culturalDataService.getDemoMode()).toBe(true);
  });
});

