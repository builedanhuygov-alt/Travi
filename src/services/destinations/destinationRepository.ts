import { vietnamDestinations } from '../../data/vietnamData.ts';
import { northVietnamDestinations } from '../../data/northVietnamData.ts';
import type { VietnamDestination } from '../../types/vietnam.ts';
import type { NorthDestinationRecord, NorthMapSubregion } from '../../types/northMap.ts';
import type { Destination } from '../../types/index.ts';
import type {
  DiscoveryDestination,
  DestinationDataStatus,
  CoordinateStatus,
  SourceReference,
} from '../../types/discoveryDestination.ts';

// Known aliases mapping lookup IDs to their canonical destination IDs
const CANONICAL_ALIAS_MAP: Record<string, string> = {
  hanoi: 'ha-noi',
  'ha-noi': 'ha-noi',
  thanglong: 'ha-noi',
  'thang-long': 'ha-noi',
  sapa: 'sapa',
  'sa-pa': 'sapa',
  'lao-cai-sapa': 'lao-cai-sapa',
  hagiang: 'ha-giang',
  'ha-giang': 'ha-giang',
  'ha-giang-city': 'ha-giang-city',
  caobang: 'cao-bang',
  'cao-bang': 'cao-bang',
  'cao-bang-city': 'cao-bang-city',
  halong: 'ha-long-bay',
  'ha-long': 'ha-long-bay',
  'ha-long-bay': 'ha-long-bay',
  'quang-ninh-halong': 'quang-ninh-halong',
  ninhbinh: 'ninh-binh',
  'ninh-binh': 'ninh-binh',
  'ninh-binh-city': 'ninh-binh-city',
  mucangchai: 'mu-cang-chai',
  'mu-cang-chai': 'mu-cang-chai',
  'yen-bai-mucangchai': 'yen-bai-mucangchai',
  hue: 'thua-thien-hue',
  'thua-thien-hue': 'thua-thien-hue',
  hoian: 'quang-nam-hoian',
  'quang-nam-hoian': 'quang-nam-hoian',
  danang: 'da-nang',
  'da-nang': 'da-nang',
  saigon: 'ho-chi-minh-city',
  'ho-chi-minh': 'ho-chi-minh-city',
  'ho-chi-minh-city': 'ho-chi-minh-city',
  cantho: 'can-tho',
  'can-tho': 'can-tho',
  phuquoc: 'kien-giang-phu-quoc',
  'kien-giang-phu-quoc': 'kien-giang-phu-quoc',
};

/**
 * Adapter: Normalizes a VietnamDestination into DiscoveryDestination
 */
function normalizeVietnamDestination(vd: VietnamDestination): DiscoveryDestination {
  let subregion: NorthMapSubregion | 'Chưa phân vùng' = 'Chưa phân vùng';
  if (vd.region === 'Northern Vietnam') {
    if (['lao-cai-sapa', 'yen-bai-mucangchai'].includes(vd.id)) {
      subregion = 'Tây Bắc';
    } else if (['ha-giang', 'cao-bang'].includes(vd.id)) {
      subregion = 'Đông Bắc';
    } else if (['ha-noi', 'ninh-binh'].includes(vd.id)) {
      subregion = 'Đồng bằng sông Hồng';
    } else if (vd.id === 'quang-ninh-halong') {
      subregion = 'Ven biển Bắc Bộ';
    }
  }

  const sources: SourceReference[] = [
    {
      name: vd.provenanceMetadata.sourceName || 'Hồ sơ Di sản & Địa chí Du lịch Quốc gia',
      sourceType: vd.provenanceMetadata.sourceName?.includes('Bộ') || vd.provenanceMetadata.sourceName?.includes('Sở')
        ? 'Official tourism source'
        : 'Travel editorial',
      url: vd.provenanceMetadata.sourceUrl,
      verifiedAt: vd.provenanceMetadata.lastVerifiedAt,
      notes: vd.provenanceMetadata.verificationNotes,
    },
  ];

  let coordinateStatus: CoordinateStatus = 'administrative_center';
  if (vd.coordinatePrecision === 'Verified Exact Landmark') {
    coordinateStatus = 'exact_landmark';
  }

  const dataStatus: DestinationDataStatus =
    vd.verificationStatus === 'Verified Editorial' || vd.verificationStatus === 'Curated Partner'
      ? 'verified'
      : 'needs_review';

  return {
    id: vd.id,
    name: vd.name,
    vietnameseName: vd.vietnameseName,
    slug: vd.id,
    aliases: [vd.name, vd.vietnameseName, ...(vd.historicalNames || [])],
    currentAdministrativeRegion: vd.provinceOrMunicipality,
    historicalAdministrativeNames: vd.historicalNames || [],
    subregion,
    macroRegion: vd.region,
    latitude: vd.coordinates.lat,
    longitude: vd.coordinates.lng,
    category: vd.categories[0] || 'Văn hóa & Di sản',
    shortDescription: vd.description,
    longDescription: vd.editorialSummary,
    images: [vd.heroImage, ...(vd.galleryImages || [])],
    experiences: vd.localExperiences.map((e) => e.vietnameseTitle || e.title),
    localFood: vd.mustTryFood.map((f) => f.vietnameseName || f.name),
    culturalHighlights: vd.culturalEtiquetteTips || [],
    nearbyDestinationIds: [],
    bestSeason: vd.bestSeason,
    recommendedDuration: `${vd.estimatedVisitDays} ngày`,
    sourceReferences: sources,
    dataStatus,
    coordinateStatus,
    coordinateConfidenceScore: 0.98,
    lastReviewedAt: vd.provenanceMetadata.lastVerifiedAt || '2026-10-31',
    canonicalSource: 'vietnamData',
  };
}

/**
 * Adapter: Normalizes a NorthDestinationRecord into DiscoveryDestination
 */
function normalizeNorthDestinationRecord(nd: NorthDestinationRecord): DiscoveryDestination {
  let coordinateStatus: CoordinateStatus = 'exact_landmark';
  switch (nd.coordinateConfidence) {
    case 'administrative_center':
      coordinateStatus = 'administrative_center';
      break;
    case 'island_centroid':
      coordinateStatus = 'island_centroid';
      break;
    case 'scenic_pass':
      coordinateStatus = 'scenic_pass';
      break;
    case 'scenic_lake':
      coordinateStatus = 'scenic_lake';
      break;
    case 'approximate':
      coordinateStatus = 'approximate';
      break;
    default:
      coordinateStatus = 'exact_landmark';
  }

  const dataStatus: DestinationDataStatus =
    nd.verificationStatus === 'verified'
      ? 'verified'
      : nd.verificationStatus === 'needs_review'
      ? 'needs_review'
      : 'unresolved';

  const sourceRef: SourceReference = {
    name: nd.source,
    sourceType:
      nd.sourceType ||
      (nd.source.includes('Sở') || nd.source.includes('BQL') || nd.source.includes('Cục') || nd.source.includes('UNESCO') || nd.source.includes('Bộ')
        ? 'Official tourism source'
        : 'Travel editorial'),
    url: nd.sourceUrl,
    verifiedAt: nd.lastReviewedDate || '2026-10-31',
    notes: nd.reviewNotes || 'Tọa độ và dữ liệu địa danh được rà soát qua hồ sơ du lịch miền Bắc',
  };

  const images = [nd.image, ...(nd.galleryImages || [])];

  return {
    id: nd.id,
    name: nd.name,
    vietnameseName: nd.vietnameseName,
    slug: nd.slug,
    aliases: [nd.name, nd.vietnameseName, ...(nd.historicalAliases || [])],
    currentAdministrativeRegion: nd.provinceOrRegion,
    historicalAdministrativeNames: nd.historicalAliases || [],
    subregion: nd.subregion,
    macroRegion: nd.subregion === 'Bắc Trung Bộ mở rộng' ? 'Central Vietnam' : 'Northern Vietnam',
    latitude: nd.latitude,
    longitude: nd.longitude,
    category: nd.category,
    shortDescription: nd.shortDescription,
    longDescription: nd.longDescription,
    bestSeason: nd.bestSeason,
    recommendedDuration: nd.recommendedDuration,
    images,
    experiences: nd.experiences,
    localFood: nd.localFood,
    culturalHighlights: nd.culturalHighlights,
    nearbyDestinationIds: [],
    sourceReferences: [sourceRef],
    dataStatus,
    coordinateStatus,
    coordinateConfidenceScore: nd.confidenceScore,
    lastReviewedAt: nd.lastReviewedDate || '2026-10-31',
    canonicalSource: 'northVietnamData',
    linkedParentDestinationId: nd.parentDestinationId || nd.linkedDestinationId,
  };
}

/**
 * In-memory repository registry that provides a single, normalized view
 * without duplicating or copying datasets.
 */
class DestinationRepositoryImpl {
  private cache: Map<string, DiscoveryDestination> | null = null;

  private initCache(): Map<string, DiscoveryDestination> {
    if (this.cache) return this.cache;

    const map = new Map<string, DiscoveryDestination>();

    // 1. Index canonical primary destinations from vietnamData
    for (const vd of vietnamDestinations) {
      const normalized = normalizeVietnamDestination(vd);
      map.set(normalized.id, normalized);
    }

    // 2. Index specific landmark & regional destinations from northVietnamData
    for (const nd of northVietnamDestinations) {
      // If ID does not collide with existing primary hub, register it directly
      if (!map.has(nd.id)) {
        const normalized = normalizeNorthDestinationRecord(nd);
        map.set(normalized.id, normalized);
      }
    }

    // 3. Populate nearby destinations based on same subregion proximity
    for (const [, dest] of map) {
      if (dest.subregion !== 'Chưa phân vùng') {
        const nearby = Array.from(map.values())
          .filter((other) => other.id !== dest.id && other.subregion === dest.subregion)
          .slice(0, 4)
          .map((other) => other.id);
        dest.nearbyDestinationIds = nearby;
      }
    }

    this.cache = map;
    return this.cache;
  }

  /**
   * Look up a destination strictly by its ID or known canonical alias.
   * Returns undefined if ID is invalid or not found (NO silent fallback to Hà Nội).
   */
  public getById(id: string | undefined): DiscoveryDestination | undefined {
    if (!id) return undefined;

    const cache = this.initCache();
    const cleanId = id.trim().toLowerCase();

    // 1. Direct match
    if (cache.has(cleanId)) {
      return cache.get(cleanId);
    }

    // 2. Check canonical alias map
    const aliasTarget = CANONICAL_ALIAS_MAP[cleanId];
    if (aliasTarget && cache.has(aliasTarget)) {
      return cache.get(aliasTarget);
    }

    // 3. Search aliases inside records
    for (const dest of cache.values()) {
      if (dest.slug.toLowerCase() === cleanId) return dest;
      if (dest.aliases.some((a) => a.toLowerCase() === cleanId)) return dest;
    }

    return undefined;
  }

  /**
   * Returns all normalized destinations across the platform.
   */
  public getAll(): DiscoveryDestination[] {
    const cache = this.initCache();
    return Array.from(cache.values());
  }

  /**
   * Returns all destinations in Northern Vietnam (including North Central Extension if marked).
   */
  public getAllNorthernDestinations(): DiscoveryDestination[] {
    return this.getAll().filter(
      (d) =>
        d.macroRegion === 'Northern Vietnam' ||
        d.subregion === 'Bắc Trung Bộ mở rộng' ||
        [
          'Tây Bắc',
          'Đông Bắc',
          'Đồng bằng sông Hồng',
          'Ven biển Bắc Bộ',
          'Bắc Trung Bộ mở rộng',
        ].includes(d.subregion)
    );
  }

  /**
   * Returns destinations by specific subregion
   */
  public getBySubregion(subregion: NorthMapSubregion): DiscoveryDestination[] {
    return this.getAll().filter((d) => d.subregion === subregion);
  }

  /**
   * Returns destinations by category
   */
  public getByCategory(category: string): DiscoveryDestination[] {
    const norm = category.toLowerCase().trim();
    return this.getAll().filter(
      (d) =>
        d.category.toLowerCase().includes(norm) ||
        d.experiences.some((e) => e.toLowerCase().includes(norm))
    );
  }
}

export const destinationRepository = new DestinationRepositoryImpl();

// Export standalone helper functions
export const getDiscoveryDestinationById = (id: string | undefined): DiscoveryDestination | undefined =>
  destinationRepository.getById(id);

export const getAllDiscoveryDestinations = (): DiscoveryDestination[] =>
  destinationRepository.getAll();

export const getAllNorthernDestinations = (): DiscoveryDestination[] =>
  destinationRepository.getAllNorthernDestinations();

/**
 * Adapter: Converts DiscoveryDestination to legacy Destination interface for backward compatibility
 */
export function discoveryDestinationToLegacy(d: DiscoveryDestination): Destination {
  return {
    id: d.id,
    name: d.name,
    vietnameseName: d.vietnameseName,
    country: 'Vietnam',
    region: d.macroRegion,
    tagline: d.shortDescription,
    description: d.longDescription || d.shortDescription,
    heroImage:
      d.images[0] ||
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    fallbackColor: '#0E1626',
    rating: 4.8,
    reviewsCount: 120,
    tags: [d.subregion, d.category, ...d.experiences.slice(0, 3), ...d.localFood.slice(0, 3)],
    vibe: d.category,
    idealDays: d.recommendedDuration ? parseInt(d.recommendedDuration) || 2 : 2,
    bestSeason: d.bestSeason || 'Mùa thu & mùa xuân',
    curatedExperience: d.experiences[0] || 'Khám phá văn hóa & cảnh quan bản địa',
    coordinates: {
      latitude: d.latitude,
      longitude: d.longitude,
    },
    editorialSummary: d.shortDescription,
    culture: {
      destinationId: d.id,
      culturalInterests: d.culturalHighlights,
      music: [],
      food: d.localFood,
      architecture: [],
      art: [],
      history: d.historicalAdministrativeNames,
      nature: [d.subregion, d.category],
      localExperiences: d.experiences,
      culturalDepthScore: 92,
      crowdIsolationScore: 88,
      paceStyle: 'Deliberate',
      editorialSummary: d.shortDescription,
    },
  };
}

export const getAllAsLegacyDestinations = (): Destination[] =>
  destinationRepository.getAll().map(discoveryDestinationToLegacy);

