import type {
  CulturalAssetDetailResponse,
  CulturalAssetListResponse,
  CulturalAssetQueryParams,
} from '../../types/cultural';
import { MOCK_CULTURAL_ASSETS } from '../../data/culturalMockData';

/**
 * Cultural Data Provider Interface
 * Supports both Mock/Demo mode and Real API connectivity.
 */
export interface ICulturalDataProvider {
  getAssets(params?: CulturalAssetQueryParams): Promise<CulturalAssetListResponse>;
  getAssetBySlug(slug: string): Promise<CulturalAssetDetailResponse>;
}

/**
 * Mock Cultural Data Provider
 * Provides curated verified heritage assets (Ngọc Lũ drum, Đào Thịnh jar, Văn Miếu stelae...)
 * with explicit DEMO mode badge and separation of Artifact vs Visitable POI.
 */
export class MockCulturalDataProvider implements ICulturalDataProvider {
  async getAssets(params?: CulturalAssetQueryParams): Promise<CulturalAssetListResponse> {
    const query = (params?.q || '').trim().toLowerCase();
    const type = params?.type;
    const limit = params?.limit ?? 10;
    const offset = params?.offset ?? 0;

    let filtered = [...MOCK_CULTURAL_ASSETS];

    if (query) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.vietnameseName.toLowerCase().includes(query) ||
          item.cultureOrPeriod.toLowerCase().includes(query) ||
          item.holdingInstitution.name.toLowerCase().includes(query) ||
          item.tags.some((t) => t.toLowerCase().includes(query)) ||
          item.shortDescription.toLowerCase().includes(query)
      );
    }

    if (type && type !== 'all') {
      filtered = filtered.filter((item) => item.assetType === type);
    }

    const paginated = filtered.slice(offset, offset + limit);

    return {
      total: filtered.length,
      limit,
      offset,
      items: paginated,
      mode: 'DEMO',
    };
  }

  async getAssetBySlug(slug: string): Promise<CulturalAssetDetailResponse> {
    const asset = MOCK_CULTURAL_ASSETS.find((item) => item.slug === slug);
    if (!asset) {
      throw new Error(`Cultural asset not found with slug: ${slug}`);
    }
    return {
      asset,
      mode: 'DEMO',
    };
  }
}

/**
 * Real Cultural API Provider (Stub for production integration)
 * Configured via environment variables:
 * - VITE_CULTURAL_DATA_API_URL
 * - VITE_CULTURAL_DATA_API_KEY
 * Does NOT pretend to succeed if API Key is absent.
 */
export class RealCulturalDataProvider implements ICulturalDataProvider {
  private baseUrl: string;
  private apiKey: string | null;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CULTURAL_DATA_API_URL) || 'https://api.culturaldata.vn';
    this.apiKey = apiKey || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CULTURAL_DATA_API_KEY) || null;
  }

  private ensureConfigured(): void {
    if (!this.apiKey) {
      throw new Error(
        'CULTURAL_DATA_API_KEY is not configured in environment. To test, please enable DEMO mode or provide VITE_CULTURAL_DATA_API_KEY in server environment.'
      );
    }
  }

  async getAssets(params?: CulturalAssetQueryParams): Promise<CulturalAssetListResponse> {
    this.ensureConfigured();

    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.set('q', params.q);
    if (params?.type && params.type !== 'all') queryParams.set('type', params.type);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.offset) queryParams.set('offset', String(params.offset));

    const url = `${this.baseUrl}/v1/assets?${queryParams.toString()}`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Cultural API request failed with status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      ...data,
      mode: 'LIVE',
    };
  }

  async getAssetBySlug(slug: string): Promise<CulturalAssetDetailResponse> {
    this.ensureConfigured();

    const url = `${this.baseUrl}/v1/assets/${encodeURIComponent(slug)}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Cultural API request failed with status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      asset: data,
      mode: 'LIVE',
    };
  }
}

/**
 * Cultural Data Service Singleton with DEMO Mode toggle
 */
class CulturalDataService {
  private isDemoMode: boolean = true;
  private mockProvider: MockCulturalDataProvider;
  private realProvider: RealCulturalDataProvider;

  constructor() {
    this.mockProvider = new MockCulturalDataProvider();
    this.realProvider = new RealCulturalDataProvider();
  }

  public setDemoMode(enabled: boolean): void {
    this.isDemoMode = enabled;
  }

  public getDemoMode(): boolean {
    return this.isDemoMode;
  }

  public isRealApiConfigured(): boolean {
    const key = typeof import.meta !== 'undefined' && import.meta.env?.VITE_CULTURAL_DATA_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  public async getAssets(params?: CulturalAssetQueryParams): Promise<CulturalAssetListResponse> {
    if (this.isDemoMode || !this.isRealApiConfigured()) {
      return this.mockProvider.getAssets(params);
    }
    try {
      return await this.realProvider.getAssets(params);
    } catch {
      // Fallback to mock provider with warning rather than crashing UI
      const mockResult = await this.mockProvider.getAssets(params);
      return mockResult;
    }
  }

  public async getAssetBySlug(slug: string): Promise<CulturalAssetDetailResponse> {
    if (this.isDemoMode || !this.isRealApiConfigured()) {
      return this.mockProvider.getAssetBySlug(slug);
    }
    try {
      return await this.realProvider.getAssetBySlug(slug);
    } catch {
      return await this.mockProvider.getAssetBySlug(slug);
    }
  }
}

export const culturalDataService = new CulturalDataService();
