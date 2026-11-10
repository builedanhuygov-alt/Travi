import { vietnamDestinations } from '../../data/vietnamData.ts';
import { vietnamExperiences } from '../../data/vietnamExperiences.ts';
import { traviStories } from '../../data/vietnamStories.ts';
import type { VietnamDestination, VietnamRegion } from '../../types/vietnam.ts';
import type { StandaloneExperience, TraviStory, UserDiscoveryPreferences, DiscoveryRecommendation } from '../../types/discovery.ts';
import type { TasteProfile } from '../../types/index.ts';
import { normalizeVietnameseText } from '../search/vietnamSearchEngine.ts';

export type AudiencePersona =
  | 'all'
  | 'independent'
  | 'family'
  | 'international'
  | 'culture'
  | 'contributor';

export interface DiscoveryEngineQuery {
  persona?: AudiencePersona;
  region?: VietnamRegion | 'All';
  searchQuery?: string;
  categoryFilter?: string;
  userPreferences?: UserDiscoveryPreferences;
  tasteProfile?: TasteProfile;
  savedDestIds?: string[];
  exploredPlaceIds?: string[];
  limit?: number;
}

export interface ScoredDestinationItem extends DiscoveryRecommendation<VietnamDestination> {
  itemType: 'destination';
  explanationTag: string;
}

export interface ScoredExperienceItem extends DiscoveryRecommendation<StandaloneExperience> {
  itemType: 'experience';
  explanationTag: string;
}

export interface ScoredStoryItem extends DiscoveryRecommendation<TraviStory> {
  itemType: 'story';
  explanationTag: string;
}

/**
 * Transparent Discovery Intelligence Engine for TRAVI.
 * Operates purely on deterministic, explainable ranking signals:
 * 1. Interest Relevance (matching taste profile / category)
 * 2. Audience Persona Alignment
 * 3. Editorial Trust & Provenance Score
 * 4. Geographic Alignment (nearby or matching region of saved places)
 * 5. Novelty / Unexplored factor
 */
export const discoveryEngine = {
  /**
   * Rank destinations according to audience persona, filters, and trust signals.
   */
  rankDestinations(query: DiscoveryEngineQuery = {}): ScoredDestinationItem[] {
    const {
      persona = 'all',
      region = 'All',
      searchQuery = '',
      categoryFilter = 'All',
      tasteProfile,
      savedDestIds = [],
      exploredPlaceIds = [],
      limit = 12,
    } = query;

    const normQuery = normalizeVietnameseText(searchQuery);

    const scored = vietnamDestinations
      .filter((dest) => {
        // Region filter
        if (region !== 'All' && dest.region !== region) return false;

        // Category filter
        if (categoryFilter !== 'All' && !dest.categories.includes(categoryFilter as any)) {
          return false;
        }

        // Search query
        if (normQuery) {
          const matchName = normalizeVietnameseText(dest.name).includes(normQuery);
          const matchVnName = normalizeVietnameseText(dest.vietnameseName).includes(normQuery);
          const matchTagline = normalizeVietnameseText(dest.tagline).includes(normQuery);
          const matchFood = dest.mustTryFood.some((f) =>
            normalizeVietnameseText(f.name).includes(normQuery) ||
            normalizeVietnameseText(f.vietnameseName).includes(normQuery)
          );
          const matchAttr = dest.attractions.some((a) =>
            normalizeVietnameseText(a.name).includes(normQuery) ||
            normalizeVietnameseText(a.vietnameseName).includes(normQuery)
          );
          if (!matchName && !matchVnName && !matchTagline && !matchFood && !matchAttr) {
            return false;
          }
        }

        return true;
      })
      .map((dest) => {
        let score = 50; // Base deterministic score
        const signals: string[] = [];

        // 1. Editorial Trust & Provenance
        if (dest.verificationStatus === 'Verified Editorial') {
          score += 25;
          signals.push('Được biên tập từ nguồn có dẫn chứng');
        } else if (dest.verificationStatus === 'Curated Partner') {
          score += 15;
          signals.push('Đối tác du lịch bản địa tuyển chọn');
        }

        // 2. Persona Alignment
        if (persona === 'independent') {
          if (dest.categories.includes('Adventure & Outdoor') || dest.categories.includes('Hidden Gems')) {
            score += 20;
            signals.push('Lựa chọn cho người trẻ & độc hành');
          }
        } else if (persona === 'family') {
          if (dest.categories.includes('Relaxation & Wellness') || dest.estimatedVisitDays <= 3) {
            score += 18;
            signals.push('Điểm đến phù hợp cho gia đình');
          }
        } else if (persona === 'international') {
          if (dest.attractions.length >= 2 || dest.mustTryFood.length >= 3) {
            score += 20;
            signals.push('Cửa ngõ văn hóa tiêu biểu Việt Nam');
          }
        } else if (persona === 'culture') {
          if (dest.categories.includes('Heritage & History') || dest.categories.includes('Culture & Festivals')) {
            score += 22;
            signals.push('Phù hợp với sở thích văn hóa');
          }
        }

        // 3. User Saved & Explored Context
        if (savedDestIds.length > 0) {
          const savedDests = vietnamDestinations.filter((d) => savedDestIds.includes(d.id));
          const hasSameRegion = savedDests.some((d) => d.region === dest.region);
          if (hasSameRegion && !savedDestIds.includes(dest.id)) {
            score += 15;
            signals.push('Cùng khu vực bạn đang khám phá');
          }

          const hasSharedCategories = savedDests.some((d) =>
            d.categories.some((c) => dest.categories.includes(c))
          );
          if (hasSharedCategories && !savedDestIds.includes(dest.id)) {
            score += 12;
            signals.push('Có liên quan đến địa điểm đã lưu');
          }
        }

        // 4. Novelty Factor: Unexplored hidden gem
        const isExplored = exploredPlaceIds.includes(dest.id);
        if (!isExplored && (dest.categories.includes('Hidden Gems') || dest.isFormerProvince)) {
          score += 10;
          signals.push('Một trải nghiệm mới để khám phá');
        }

        // 5. Taste Profile Alignment
        if (tasteProfile) {
          if (tasteProfile.food?.length && dest.mustTryFood.length > 0) {
            score += 10;
            signals.push('Hợp gu ẩm thực vùng miền');
          }
          if (tasteProfile.history?.length && dest.categories.includes('Heritage & History')) {
            score += 10;
            signals.push('Phù hợp với sở thích văn hóa');
          }
          if (tasteProfile.nature?.length && dest.categories.includes('Nature & Mountains')) {
            score += 10;
            signals.push('Dành cho người yêu thiên nhiên');
          }
        }

        // Deterministic fallback label if no specific signal triggered
        const explanationTag = signals.length > 0 ? signals[0] : 'Lựa chọn biên tập tiêu biểu';
        const primaryReason = signals.length > 0 ? signals.slice(0, 2).join(' • ') : 'Lựa chọn biên tập tiêu biểu';

        return {
          itemType: 'destination' as const,
          id: dest.id,
          item: dest,
          score,
          recommendationReason: primaryReason,
          explanationTag,
          signals,
        };
      })
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
  },

  /**
   * Rank experiences according to audience persona, category, and regional filters.
   */
  rankExperiences(query: DiscoveryEngineQuery = {}): ScoredExperienceItem[] {
    const {
      persona = 'all',
      region = 'All',
      searchQuery = '',
      categoryFilter = 'All',
      savedDestIds = [],
      limit = 12,
    } = query;

    const normQuery = normalizeVietnameseText(searchQuery);

    const scored = vietnamExperiences
      .filter((exp) => {
        if (region !== 'All' && exp.region !== region) return false;
        if (categoryFilter !== 'All' && exp.category !== categoryFilter) return false;

        if (normQuery) {
          const matchTitle = normalizeVietnameseText(exp.title).includes(normQuery);
          const matchVnTitle = normalizeVietnameseText(exp.vietnameseTitle).includes(normQuery);
          const matchLoc = normalizeVietnameseText(exp.location).includes(normQuery);
          const matchHost = exp.hostOrCraftsman ? normalizeVietnameseText(exp.hostOrCraftsman).includes(normQuery) : false;
          const matchDesc = normalizeVietnameseText(exp.description).includes(normQuery);
          if (!matchTitle && !matchVnTitle && !matchLoc && !matchHost && !matchDesc) {
            return false;
          }
        }

        return true;
      })
      .map((exp) => {
        let score = 55;
        const signals: string[] = [];

        if (exp.verificationStatus === 'Verified Editorial') {
          score += 25;
          signals.push('Được biên tập từ nguồn có dẫn chứng');
        }

        if (exp.hostOrCraftsman) {
          score += 12;
          signals.push('Nghệ nhân & Dòng dõi bản địa');
        }

        if (persona === 'culture' && (exp.category === 'Arts & Crafts' || exp.category === 'Culture & Heritage')) {
          score += 20;
          signals.push('Phù hợp với sở thích văn hóa');
        } else if (persona === 'independent' && (exp.category === 'Nature & Adventure' || exp.category === 'Local Life')) {
          score += 18;
          signals.push('Một trải nghiệm mới để khám phá');
        } else if (persona === 'family' && (exp.category === 'Family & Leisure' || exp.category === 'Food & Culinary')) {
          score += 18;
          signals.push('Điểm đến phù hợp cho gia đình');
        }

        if (savedDestIds.includes(exp.destinationId)) {
          score += 20;
          signals.push('Có liên quan đến địa điểm đã lưu');
        }

        const explanationTag = signals.length > 0 ? signals[0] : 'Trải nghiệm bản địa tuyển chọn';
        const primaryReason = signals.length > 0 ? signals.slice(0, 2).join(' • ') : 'Trải nghiệm bản địa tuyển chọn';

        return {
          itemType: 'experience' as const,
          id: exp.id,
          item: exp,
          score,
          recommendationReason: primaryReason,
          explanationTag,
          signals,
        };
      })
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
  },

  /**
   * Retrieve and rank editorial stories.
   */
  rankStories(query: DiscoveryEngineQuery = {}): ScoredStoryItem[] {
    const {
      region = 'All',
      searchQuery = '',
      categoryFilter = 'All',
      limit = 6,
    } = query;

    const normQuery = normalizeVietnameseText(searchQuery);

    const scored = traviStories
      .filter((story) => {
        if (region !== 'All' && story.region !== region) return false;
        if (categoryFilter !== 'All' && story.category !== categoryFilter) return false;

        if (normQuery) {
          const matchTitle = normalizeVietnameseText(story.title).includes(normQuery);
          const matchExcerpt = normalizeVietnameseText(story.excerpt).includes(normQuery);
          const matchAuthor = normalizeVietnameseText(story.author.name).includes(normQuery);
          const matchTags = story.tags.some((t) => normalizeVietnameseText(t).includes(normQuery));
          if (!matchTitle && !matchExcerpt && !matchAuthor && !matchTags) return false;
        }

        return true;
      })
      .map((story) => {
        let score = 70;
        const signals: string[] = ['Bài viết biên tập chuyên sâu'];

        if (story.featured) {
          score += 20;
          signals.push('Lựa chọn của Tổng biên tập');
        }

        if (story.sources.length > 0) {
          score += 10;
          signals.push('Được biên tập từ nguồn có dẫn chứng');
        }

        const explanationTag = signals.length > 0 ? signals[0] : 'Ký sự du lịch & văn hóa';

        return {
          itemType: 'story' as const,
          id: story.id,
          item: story,
          score,
          recommendationReason: signals.join(' • '),
          explanationTag,
          signals,
        };
      })
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
  },

  /**
   * Find nearby destinations within the same region or coordinate bounding.
   */
  getNearbyDestinations(destinationId: string, limit = 3): VietnamDestination[] {
    const target = vietnamDestinations.find((d) => d.id === destinationId);
    if (!target) return vietnamDestinations.slice(0, limit);

    return vietnamDestinations
      .filter((d) => d.id !== target.id)
      .map((d) => {
        const dLat = d.coordinates.lat - target.coordinates.lat;
        const dLng = d.coordinates.lng - target.coordinates.lng;
        const distSq = dLat * dLat + dLng * dLng;
        const sameRegion = d.region === target.region;
        return { dest: d, distSq, sameRegion };
      })
      .sort((a, b) => {
        if (a.sameRegion && !b.sameRegion) return -1;
        if (!a.sameRegion && b.sameRegion) return 1;
        return a.distSq - b.distSq;
      })
      .slice(0, limit)
      .map((entry) => entry.dest);
  },

  /**
   * Find experiences linked to a specific destination.
   */
  getExperiencesForDestination(destinationId: string): StandaloneExperience[] {
    return vietnamExperiences.filter(
      (exp) => exp.destinationId === destinationId || exp.location.toLowerCase().includes(destinationId.toLowerCase())
    );
  },
};
