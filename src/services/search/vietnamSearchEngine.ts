import { VIETNAM_ADMINISTRATIVE_UNITS } from '../../data/vietnamAdministrativeUnits.ts';
import { vietnamExperiences } from '../../data/vietnamExperiences.ts';
import { traviStories } from '../../data/vietnamStories.ts';
import { destinationRepository } from '../destinations/destinationRepository.ts';
import type { VietnamRegion } from '../../types/vietnam.ts';
import { translateProvenanceStatus } from '../../lib/i18n/index.ts';

export type SearchEntityType =
  | 'destination'
  | 'experience'
  | 'food'
  | 'heritage'
  | 'story'
  | 'administrative_unit';

export interface UnifiedDiscoveryItem {
  id: string;
  entityType: SearchEntityType;
  name: string;
  vietnameseName: string;
  aliases: string[];
  description: string;
  category: string;
  region: VietnamRegion;
  administrativeUnit?: string;
  administrativeUnitId?: string;
  historicalNames: string[];
  tags: string[];
  relatedDestinationIds: string[];
  sourceName: string;
  sourceUrl?: string;
  sourceType: 'official' | 'editorial' | 'community' | 'ai_assisted' | 'unverified';
  verificationStatus: string;
  lastVerifiedAt?: string;
  image?: string;
  routeUrl: string;
  score?: number;
  highlightSnippet?: string;
}

export interface GroupedSearchResults {
  query: string;
  totalCount: number;
  destinations: UnifiedDiscoveryItem[];
  experiences: UnifiedDiscoveryItem[];
  food: UnifiedDiscoveryItem[];
  heritage: UnifiedDiscoveryItem[];
  stories: UnifiedDiscoveryItem[];
}

export interface SearchFilterOptions {
  region?: VietnamRegion | 'All';
  category?: string;
  entityType?: SearchEntityType | 'All';
  limit?: number;
}

/**
 * Remove Vietnamese accents and diacritics for insensitive matching.
 * "Hội An" -> "hoi an"
 * "Phở Bát Đàn" -> "pho bat dan"
 * "Đà Nẵng" -> "da nang"
 */
export function normalizeVietnameseText(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

/**
 * Compute simple Levenshtein distance for typo-tolerant matching
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  for (let i = 0; i <= bLen; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= aLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bLen][aLen];
}

class VietnamSearchEngine {
  private index: UnifiedDiscoveryItem[] = [];
  private isIndexBuilt = false;
  private readonly RECENT_SEARCHES_KEY = 'travi_recent_searches';

  constructor() {
    this.buildIndex();
  }

  /**
   * Build the unified nationwide discovery index across all datasets
   */
  public buildIndex(): UnifiedDiscoveryItem[] {
    if (this.isIndexBuilt && this.index.length > 0) {
      return this.index;
    }

    const items: UnifiedDiscoveryItem[] = [];

    // 1. Index All Destinations from Unified Repository
    const allDestinations = destinationRepository.getAll();
    allDestinations.forEach((d) => {
      // Find parent administrative unit if available
      const parentUnit = VIETNAM_ADMINISTRATIVE_UNITS.find(
        (u) =>
          u.officialVietnameseName.toLowerCase() === d.currentAdministrativeRegion.toLowerCase() ||
          u.englishName.toLowerCase() === d.currentAdministrativeRegion.toLowerCase()
      );
      const adminName = parentUnit ? parentUnit.officialVietnameseName : d.currentAdministrativeRegion;
      const adminAliases = parentUnit ? parentUnit.historicalAliases : [];
      const mergedProvinces = parentUnit ? parentUnit.mergedPre2025Provinces : [];

      // Combine historical names and aliases
      const combinedAliases = Array.from(
        new Set([
          d.name,
          d.vietnameseName,
          d.currentAdministrativeRegion,
          d.subregion,
          ...d.aliases,
          ...d.historicalAdministrativeNames,
          ...adminAliases,
          ...mergedProvinces,
        ])
      );

      // Add Destination Entity
      items.push({
        id: d.id,
        entityType: 'destination',
        name: d.name,
        vietnameseName: d.vietnameseName,
        aliases: combinedAliases,
        description: d.shortDescription || d.longDescription || '',
        category: d.category,
        region: d.macroRegion,
        administrativeUnit: adminName,
        historicalNames: d.historicalAdministrativeNames,
        tags: [
          d.subregion,
          d.category,
          adminName,
          ...(d.bestSeason ? [d.bestSeason] : []),
          ...d.historicalAdministrativeNames,
          ...d.experiences,
          ...d.localFood,
          ...d.culturalHighlights,
        ],
        relatedDestinationIds: [d.id],
        sourceName: d.sourceReferences[0]?.name || 'TRAVI Editorial & Cục Du lịch Quốc gia',
        sourceUrl: d.sourceReferences[0]?.url,
        sourceType: d.sourceReferences[0]?.sourceType === 'Official tourism source' ? 'official' : 'editorial',
        verificationStatus: d.dataStatus === 'verified' ? 'Đã xác thực dữ liệu' : 'Cần rà soát thực địa',
        lastVerifiedAt: d.lastReviewedAt,
        image: d.images[0] || '',
        routeUrl: `/destinations/${d.id}`,
      });

      // 2. Index Must-Try Food items from this destination
      d.localFood.forEach((food, idx) => {
        items.push({
          id: `food-${d.id}-${idx}`,
          entityType: 'food',
          name: food,
          vietnameseName: food,
          aliases: [food, d.vietnameseName, d.name, adminName, d.subregion],
          description: `Đặc sản ẩm thực trứ danh của ${d.vietnameseName} (${adminName})`,
          category: 'Ẩm thực bản địa',
          region: d.macroRegion,
          administrativeUnit: adminName,
          historicalNames: [],
          tags: ['Ẩm thực', 'Đặc sản', food, d.vietnameseName, d.subregion],
          relatedDestinationIds: [d.id],
          sourceName: d.sourceReferences[0]?.name || 'Sổ tay Ẩm thực Bản địa TRAVI',
          sourceType: 'editorial',
          verificationStatus: 'Nội dung biên tập',
          lastVerifiedAt: d.lastReviewedAt,
          image: d.images[0] || '',
          routeUrl: `/destinations/${d.id}`,
        });
      });

      // 3. Index Experiences from this destination
      d.experiences.forEach((exp, idx) => {
        items.push({
          id: `exp-${d.id}-${idx}`,
          entityType: 'experience',
          name: exp,
          vietnameseName: exp,
          aliases: [exp, d.vietnameseName, d.name, adminName],
          description: `Trải nghiệm bản địa đặc sắc tại ${d.vietnameseName}`,
          category: 'Trải nghiệm thực địa',
          region: d.macroRegion,
          administrativeUnit: adminName,
          historicalNames: [],
          tags: ['Trải nghiệm', exp, d.vietnameseName, d.subregion],
          relatedDestinationIds: [d.id],
          sourceName: d.sourceReferences[0]?.name || 'Hồ sơ Trải nghiệm Thực địa TRAVI',
          sourceType: 'editorial',
          verificationStatus: 'Nội dung biên tập',
          lastVerifiedAt: d.lastReviewedAt,
          image: d.images[0] || '',
          routeUrl: `/destinations/${d.id}`,
        });
      });

      // 4. Index Cultural Highlights from this destination
      d.culturalHighlights.forEach((hl, idx) => {
        items.push({
          id: `heritage-${d.id}-${idx}`,
          entityType: 'heritage',
          name: hl,
          vietnameseName: hl,
          aliases: [hl, d.vietnameseName, d.name, adminName],
          description: `Dấu ấn văn hóa & tập tục bản địa tại ${d.vietnameseName}`,
          category: 'Di sản & Tập tục bản địa',
          region: d.macroRegion,
          administrativeUnit: adminName,
          historicalNames: d.historicalAdministrativeNames,
          tags: ['Văn hóa', 'Di sản', hl, d.vietnameseName, d.subregion],
          relatedDestinationIds: [d.id],
          sourceName: d.sourceReferences[0]?.name || 'Hồ sơ Di sản Văn hóa TRAVI',
          sourceType: 'editorial',
          verificationStatus: 'Nội dung biên tập',
          lastVerifiedAt: d.lastReviewedAt,
          image: d.images[0] || '',
          routeUrl: `/destinations/${d.id}`,
        });
      });
    });

    // 4. Index Standalone Experiences
    vietnamExperiences.forEach((exp) => {
      const isHeritageCraft =
        exp.category === 'Arts & Crafts' ||
        exp.category === 'Culture & Heritage' ||
        exp.category === 'Festivals & Events';

      items.push({
        id: exp.id,
        entityType: isHeritageCraft ? 'heritage' : 'experience',
        name: exp.title,
        vietnameseName: exp.vietnameseTitle,
        aliases: [exp.title, exp.vietnameseTitle, exp.location, exp.hostOrCraftsman || '', exp.destinationName],
        description: exp.description,
        category: exp.category,
        region: exp.region,
        administrativeUnit: exp.destinationName,
        historicalNames: [],
        tags: [...exp.highlights, exp.category, exp.bestTimeOfDay, exp.hostOrCraftsman || ''],
        relatedDestinationIds: [exp.destinationId],
        sourceName: exp.provenanceMetadata.sourceName || 'Hồ sơ Nghệ nhân & Trải nghiệm Bản địa',
        sourceUrl: exp.provenanceMetadata.sourceUrl,
        sourceType: exp.provenanceMetadata.sourceName?.includes('Department') ? 'official' : 'editorial',
        verificationStatus: translateProvenanceStatus(exp.verificationStatus),
        lastVerifiedAt: exp.provenanceMetadata.lastVerifiedAt,
        image: exp.image,
        routeUrl: `/experiences?id=${exp.id}`,
      });
    });

    // 5. Index Long-Form Stories
    traviStories.forEach((story) => {
      items.push({
        id: story.id,
        entityType: 'story',
        name: story.title,
        vietnameseName: story.title,
        aliases: [story.title, story.subtitle, story.author.name, ...(story.tags || [])],
        description: story.excerpt,
        category: story.category,
        region: story.region,
        historicalNames: [],
        tags: story.tags,
        relatedDestinationIds: story.destinationIds,
        sourceName: story.sources[0]?.publisher || 'Ban Biên tập TRAVI Stories',
        sourceUrl: story.sources[0]?.url,
        sourceType: 'editorial',
        verificationStatus: 'Nội dung biên tập',
        lastVerifiedAt: story.publishedAt,
        image: story.heroImage,
        routeUrl: `/stories/${story.id}`,
      });
    });

    // 6. Index All 34 Administrative Units (for direct unit searches like "Gia Lai", "Tuyên Quang")
    VIETNAM_ADMINISTRATIVE_UNITS.forEach((unit) => {
      items.push({
        id: unit.id,
        entityType: 'administrative_unit',
        name: unit.englishName,
        vietnameseName: unit.officialVietnameseName,
        aliases: [
          unit.englishName,
          unit.officialVietnameseName,
          unit.administrativeSeat,
          ...unit.mergedPre2025Provinces,
          ...unit.historicalAliases,
        ],
        description: unit.reorganizationSummary,
        category: 'Đơn vị hành chính cấp tỉnh',
        region: unit.region,
        administrativeUnit: unit.officialVietnameseName,
        administrativeUnitId: unit.id,
        historicalNames: unit.historicalAliases,
        tags: [unit.administrativeType, ...unit.mergedPre2025Provinces, ...unit.historicalAliases],
        relatedDestinationIds: unit.touristDestinationIds,
        sourceName: unit.provenanceMetadata.sourceName,
        sourceUrl: unit.provenanceMetadata.sourceUrl,
        sourceType: 'official',
        verificationStatus: 'Nguồn chính thức',
        lastVerifiedAt: unit.provenanceMetadata.lastVerifiedAt,
        routeUrl: unit.touristDestinationIds[0] ? `/explore?id=${unit.touristDestinationIds[0]}` : `/explore?search=${encodeURIComponent(unit.officialVietnameseName)}`,
      });
    });

    // 7. Index TRAVI North Map Dedicated Feature & Northern Destinations
    items.push({
      id: 'feature-north-map',
      entityType: 'destination',
      name: 'TRAVI North Map - Interactive Northern Vietnam Travel Map',
      vietnameseName: 'Bản đồ khám phá miền Bắc',
      aliases: [
        'Bản đồ miền Bắc',
        'Bản đồ du lịch miền Bắc',
        'Bản đồ Tây Bắc',
        'Bản đồ Đông Bắc',
        'North Map',
        'TRAVI North Map',
        'Bản đồ tương tác',
        'Lộ trình miền Bắc',
      ],
      description:
        'Bản đồ tương tác địa lý 81 điểm đến nổi tiếng miền Bắc Việt Nam, hỗ trợ tìm kiếm theo vùng, bộ lọc chủ đề và công cụ đo đạc tuyến đường.',
      category: 'Bản đồ khám phá',
      region: 'Northern Vietnam',
      historicalNames: ['Bắc Kỳ', 'Xứ Bắc'],
      tags: ['Bản đồ', 'Miền Bắc', 'Tây Bắc', 'Đông Bắc', 'Đồng bằng sông Hồng', 'Ven biển Bắc Bộ', 'Bắc Trung Bộ', 'Lộ trình'],
      relatedDestinationIds: ['ha-noi', 'ha-giang', 'lao-cai-sapa', 'ninh-binh', 'quang-ninh-halong'],
      sourceName: 'TRAVI Cartography',
      sourceType: 'official',
      verificationStatus: 'Đã xác thực tọa độ',
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      routeUrl: '/map/north',
    });

    this.index = items;
    this.isIndexBuilt = true;
    return this.index;
  }

  /**
   * Get the complete raw index
   */
  public getUnifiedIndex(): UnifiedDiscoveryItem[] {
    return this.buildIndex();
  }

  /**
   * Search across the entire unified discovery index
   */
  public search(query: string, options: SearchFilterOptions = {}): GroupedSearchResults {
    const rawQuery = (query || '').trim();
    const normQuery = normalizeVietnameseText(rawQuery);
    const { region = 'All', category, limit = 20 } = options;

    if (!normQuery) {
      return {
        query: rawQuery,
        totalCount: 0,
        destinations: [],
        experiences: [],
        food: [],
        heritage: [],
        stories: [],
      };
    }

    const allItems = this.buildIndex();
    const queryTokens = normQuery.split(/\s+/).filter((t) => t.length > 0);

    const scoredItems: UnifiedDiscoveryItem[] = [];

    for (const item of allItems) {
      // 1. Regional Filter
      if (region !== 'All' && item.region !== region) {
        continue;
      }

      // 2. Category Filter
      if (category && category !== 'All' && item.category !== category) {
        continue;
      }

      let score = 0;
      const normVnName = normalizeVietnameseText(item.vietnameseName);
      const normEnName = normalizeVietnameseText(item.name);
      const normDesc = normalizeVietnameseText(item.description);
      const normAdmin = normalizeVietnameseText(item.administrativeUnit);
      const normCategory = normalizeVietnameseText(item.category);

      // A. Exact Name Matches (Highest Priority)
      if (normVnName === normQuery || normEnName === normQuery) {
        score += 100;
      } else if (normVnName.startsWith(normQuery) || normEnName.startsWith(normQuery)) {
        score += 60;
      } else if (normVnName.includes(normQuery) || normEnName.includes(normQuery)) {
        score += 45;
      }

      // B. Historical Name & Alias Matches (Crucial for "Thăng Long", "Faifo", "Sài Gòn")
      for (const alias of item.aliases) {
        const normAlias = normalizeVietnameseText(alias);
        if (normAlias === normQuery) {
          score += 85;
          break;
        } else if (normAlias.includes(normQuery)) {
          score += 40;
          break;
        }
      }

      // C. Administrative Unit Match (e.g. searching "Gia Lai" matches destinations inside Gia Lai)
      if (normAdmin && normAdmin.includes(normQuery)) {
        score += 35;
      }

      // D. Category & Tag Matches
      if (normCategory.includes(normQuery)) {
        score += 25;
      }
      for (const tag of item.tags) {
        const normTag = normalizeVietnameseText(tag);
        if (normTag === normQuery) {
          score += 30;
          break;
        } else if (normTag.includes(normQuery)) {
          score += 15;
          break;
        }
      }

      // E. Description Match
      if (normDesc.includes(normQuery)) {
        score += 10;
      }

      // F. Multi-token Query Matching (e.g., "mon an hue", "dia diem gia lai", "lang nghe truyen thong")
      if (queryTokens.length > 1) {
        let tokenHits = 0;
        for (const token of queryTokens) {
          if (
            normVnName.includes(token) ||
            normEnName.includes(token) ||
            normAdmin.includes(token) ||
            normDesc.includes(token) ||
            normCategory.includes(token) ||
            item.tags.some((t) => normalizeVietnameseText(t).includes(token)) ||
            item.aliases.some((a) => normalizeVietnameseText(a).includes(token))
          ) {
            tokenHits++;
          }
        }
        if (tokenHits === queryTokens.length) {
          score += 40;
        } else if (tokenHits > 0) {
          score += tokenHits * 8;
        }
      }

      // G. Typo-Tolerant Matching (Levenshtein) for single tokens >= 4 chars
      if (score === 0 && normQuery.length >= 4) {
        // Check distance against name words
        const nameWords = normVnName.split(/\s+/).concat(normEnName.split(/\s+/));
        for (const word of nameWords) {
          if (word.length >= 4) {
            const dist = levenshteinDistance(normQuery, word);
            if (dist <= 1) {
              score += 20;
              break;
            }
          }
        }
      }

      if (score > 0) {
        scoredItems.push({
          ...item,
          score,
        });
      }
    }

    // Sort by score descending
    scoredItems.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Group results
    const destinations: UnifiedDiscoveryItem[] = [];
    const experiences: UnifiedDiscoveryItem[] = [];
    const food: UnifiedDiscoveryItem[] = [];
    const heritage: UnifiedDiscoveryItem[] = [];
    const stories: UnifiedDiscoveryItem[] = [];

    // Deduplicate by ID
    const seenIds = new Set<string>();

    for (const item of scoredItems) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);

      if (item.entityType === 'destination' || item.entityType === 'administrative_unit') {
        if (destinations.length < limit) destinations.push(item);
      } else if (item.entityType === 'experience') {
        if (experiences.length < limit) experiences.push(item);
      } else if (item.entityType === 'food') {
        if (food.length < limit) food.push(item);
      } else if (item.entityType === 'heritage') {
        if (heritage.length < limit) heritage.push(item);
      } else if (item.entityType === 'story') {
        if (stories.length < limit) stories.push(item);
      }
    }

    const totalCount =
      destinations.length + experiences.length + food.length + heritage.length + stories.length;

    return {
      query: rawQuery,
      totalCount,
      destinations,
      experiences,
      food,
      heritage,
      stories,
    };
  }

  /**
   * Get dynamic search suggestions while user types
   */
  public getSuggestions(query: string, limit = 6): string[] {
    const raw = (query || '').trim();
    const norm = normalizeVietnameseText(raw);
    if (!norm || norm.length < 2) return [];

    const suggestions = new Set<string>();
    const all = this.buildIndex();

    for (const item of all) {
      const normVn = normalizeVietnameseText(item.vietnameseName);
      const normEn = normalizeVietnameseText(item.name);

      if (normVn.startsWith(norm) || normVn.includes(norm)) {
        suggestions.add(item.vietnameseName);
      } else if (normEn.startsWith(norm) || normEn.includes(norm)) {
        suggestions.add(item.vietnameseName || item.name);
      }

      for (const alias of item.aliases) {
        const normAlias = normalizeVietnameseText(alias);
        if (normAlias.startsWith(norm)) {
          suggestions.add(alias);
          break;
        }
      }

      if (suggestions.size >= limit) break;
    }

    return Array.from(suggestions).slice(0, limit);
  }

  private memorySearchHistory: string[] = [];

  /**
   * Recent searches management in localStorage with memory fallback
   */
  public getRecentSearches(): string[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(this.RECENT_SEARCHES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed.slice(0, 8);
        }
      } catch {
        // Fallback to in-memory
      }
    }
    return this.memorySearchHistory;
  }

  public addRecentSearch(term: string): void {
    if (!term || !term.trim()) return;
    const trimmed = term.trim();
    const current = this.getRecentSearches().filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...current].slice(0, 8);
    this.memorySearchHistory = updated;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
    }
  }

  public clearRecentSearches(): void {
    this.memorySearchHistory = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(this.RECENT_SEARCHES_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  }
}

export const vietnamSearchEngine = new VietnamSearchEngine();
