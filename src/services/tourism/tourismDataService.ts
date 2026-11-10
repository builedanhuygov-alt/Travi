import type {
  PoiFilterOptions,
  PoiSummaryStats,
  UnifiedTourismPoi,
} from '../../types/tourismPoi';
import type { AdministrativeDataset, AdministrativeProvince, AdministrativeWard } from '../../types/administrative';

import rawPoisData from '../../data/generated/vietnamPois.json';
import rawAdminData from '../../data/generated/vietnamAdministrative.json';
import rawImportSummary from '../../data/generated/importSummary.json';

const POIS: UnifiedTourismPoi[] = rawPoisData as UnifiedTourismPoi[];
const ADMIN_DATA: AdministrativeDataset = rawAdminData as unknown as AdministrativeDataset;

export class TourismDataService {
  private pois: UnifiedTourismPoi[] = POIS;
  private adminData: AdministrativeDataset = ADMIN_DATA;

  /**
   * Retrieves all unified POIs in the database.
   */
  public getAllPois(): UnifiedTourismPoi[] {
    return [...this.pois];
  }

  /**
   * Filter POIs by various criteria with accent-insensitive search.
   */
  public getPois(filters: PoiFilterOptions = {}): UnifiedTourismPoi[] {
    let result = [...this.pois];

    if (filters.searchQuery) {
      const q = filters.searchQuery.trim().toLowerCase();
      const qNormalized = this.normalizeText(q);
      result = result.filter((p) => {
        const nameNorm = this.normalizeText(p.name);
        const vnNameNorm = this.normalizeText(p.vietnameseName);
        const descNorm = this.normalizeText(p.shortDescription + ' ' + p.longDescription);
        const aliasNorm = p.historicalAliases.map((a) => this.normalizeText(a)).join(' ');
        const addressNorm = p.address ? this.normalizeText(p.address) : '';

        return (
          nameNorm.includes(qNormalized) ||
          vnNameNorm.includes(qNormalized) ||
          descNorm.includes(qNormalized) ||
          aliasNorm.includes(qNormalized) ||
          addressNorm.includes(qNormalized)
        );
      });
    }

    if (filters.province) {
      const pNorm = this.normalizeText(filters.province);
      result = result.filter((p) => this.normalizeText(p.provinceOrRegion).includes(pNorm));
    }

    if (filters.subregion) {
      const sNorm = this.normalizeText(filters.subregion);
      result = result.filter((p) => this.normalizeText(p.subregion).includes(sNorm));
    }

    if (filters.category && filters.category !== 'all') {
      result = result.filter((p) => p.category === filters.category);
    }

    if (filters.verificationStatus) {
      result = result.filter((p) => p.verificationStatus === filters.verificationStatus);
    }

    if (filters.coordinateConfidence) {
      result = result.filter((p) => p.coordinateConfidence === filters.coordinateConfidence);
    }

    if (filters.hasValidCoordinatesOnly) {
      result = result.filter((p) => this.canDisplayOnMap(p));
    }

    return result;
  }

  public getPoiById(id: string): UnifiedTourismPoi | undefined {
    return this.pois.find((p) => p.id === id);
  }

  public getPoiBySlug(slug: string): UnifiedTourismPoi | undefined {
    return this.pois.find((p) => p.slug === slug);
  }

  /**
   * Anti-Hallucination Guard:
   * Only permits map rendering if coordinates are verified and not null.
   */
  public canDisplayOnMap(poi: UnifiedTourismPoi): boolean {
    return (
      poi.coordinateConfidence !== 'none' &&
      poi.latitude !== null &&
      poi.longitude !== null &&
      typeof poi.latitude === 'number' &&
      typeof poi.longitude === 'number' &&
      !isNaN(poi.latitude) &&
      !isNaN(poi.longitude)
    );
  }

  /**
   * Get all 34 centrally-governed administrative provinces (Post-2025).
   */
  public getAdministrativeProvinces(): AdministrativeProvince[] {
    return this.adminData.provinces || [];
  }

  /**
   * Get administrative wards/communes, optionally filtered by province ID.
   */
  public getAdministrativeWards(provinceId?: string): AdministrativeWard[] {
    const wards = this.adminData.wards || [];
    if (!provinceId) return wards;
    return wards.filter((w) => w.parentId === provinceId);
  }

  /**
   * Retrieve aggregate statistics for the Data Quality Dashboard.
   */
  public getSummaryStatistics(): PoiSummaryStats {
    const totalPois = this.pois.length;
    let verifiedCount = 0;
    let needsReviewCount = 0;
    let rejectedCount = 0;
    let withCoordinatesCount = 0;
    let withoutCoordinatesCount = 0;

    const sourcesBreakdown: Record<string, number> = {};
    const categoriesBreakdown: Record<string, number> = {};
    const provinceSet = new Set<string>();

    for (const p of this.pois) {
      if (p.verificationStatus === 'verified') verifiedCount++;
      else if (p.verificationStatus === 'needs_review') needsReviewCount++;
      else if (p.verificationStatus === 'rejected') rejectedCount++;

      if (this.canDisplayOnMap(p)) withCoordinatesCount++;
      else withoutCoordinatesCount++;

      if (p.provinceOrRegion) provinceSet.add(p.provinceOrRegion);

      sourcesBreakdown[p.source] = (sourcesBreakdown[p.source] || 0) + 1;
      categoriesBreakdown[p.category] = (categoriesBreakdown[p.category] || 0) + 1;
    }

    return {
      totalPois,
      verifiedCount,
      needsReviewCount,
      rejectedCount,
      withCoordinatesCount,
      withoutCoordinatesCount,
      provincesCount: provinceSet.size,
      sourcesBreakdown,
      categoriesBreakdown,
    };
  }

  /**
   * Retrieve the import execution audit summary log.
   */
  public getImportSummary(): any {
    return rawImportSummary;
  }

  private normalizeText(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }
}

export const tourismDataService = new TourismDataService();
