/**
 * National Tourism Deduplicator with Ambiguity Review Queue
 * =========================================================
 * Prevents accidental data loss by distinguishing between:
 * 1. Exact Duplicate: Merges provenance & audit trail, preserves richest data.
 * 2. Ambiguous / Uncertain Match: Kept in database AND queued for human review. NEVER auto-deleted.
 * 3. Distinct Entry: Cleanly appended to canonical collection.
 */

import type {
  BaseTourismEntity,
  DeduplicationReviewItem,
} from '../../types/nationalTourism.ts';

export interface DeduplicationResult<T extends BaseTourismEntity> {
  deduplicated_records: T[];
  review_queue: DeduplicationReviewItem[];
  exact_merges_count: number;
  ambiguous_flags_count: number;
  distinct_records_count: number;
}

function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Token Jaccard Similarity between two strings.
 */
function tokenJaccardSimilarity(s1: string, s2: string): number {
  const norm1 = removeDiacritics(s1);
  const norm2 = removeDiacritics(s2);

  if (norm1 === norm2) return 1.0;

  const tokens1 = new Set(norm1.split(' ').filter((t) => t.length > 1));
  const tokens2 = new Set(norm2.split(' ').filter((t) => t.length > 1));

  if (tokens1.size === 0 || tokens2.size === 0) return 0.0;

  const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  return intersection.size / union.size;
}

/**
 * Calculates approximate surface distance in meters between two lat/lon pairs (Haversine formula).
 */
function haversineDistanceMeters(
  lat1: number | null,
  lon1: number | null,
  lat2: number | null,
  lon2: number | null
): number | null {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;

  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class NationalDeduplicator {
  /**
   * Processes a list of incoming records against an existing pool.
   * Merges exact matches, generates review items for ambiguous cases, and preserves all distinct records.
   */
  public deduplicate<T extends BaseTourismEntity>(
    records: T[],
    similarityThreshold = 0.78
  ): DeduplicationResult<T> {
    const canonicalPool: T[] = [];
    const reviewQueue: DeduplicationReviewItem[] = [];
    let exactMerges = 0;
    let ambiguousFlags = 0;

    for (const incoming of records) {
      let matchedIndex = -1;
      let highestSimilarity = 0.0;
      let matchType: 'exact' | 'ambiguous' | 'distinct' = 'distinct';
      let matchReasons: string[] = [];

      for (let i = 0; i < canonicalPool.length; i++) {
        const existing = canonicalPool[i];

        // Must be in the same province or both have null province
        const sameProvince =
          incoming.province_id === existing.province_id ||
          incoming.province_name_canonical === existing.province_name_canonical;

        if (!sameProvince && incoming.province_id !== null && existing.province_id !== null) {
          continue; // Different provinces are not duplicates
        }

        const nameSimilarity = tokenJaccardSimilarity(incoming.name, existing.name);
        const distance = haversineDistanceMeters(
          incoming.latitude,
          incoming.longitude,
          existing.latitude,
          existing.longitude
        );

        // Case 1: Exact Match (same canonical slug or identical normalized name in same province)
        const isIdenticalName = removeDiacritics(incoming.name) === removeDiacritics(existing.name);
        const isIdenticalSlug = incoming.slug === existing.slug;

        if ((isIdenticalName || isIdenticalSlug) && sameProvince) {
          matchedIndex = i;
          highestSimilarity = 1.0;
          matchType = 'exact';
          matchReasons.push('Exact normalized name & province match');
          break;
        }

        // Case 2: Ambiguous Match (high name similarity or very proximate coordinates < 400m)
        if (sameProvince && nameSimilarity >= similarityThreshold) {
          if (nameSimilarity > highestSimilarity) {
            highestSimilarity = nameSimilarity;
            matchedIndex = i;
            matchType = 'ambiguous';
            matchReasons = [
              `High name similarity (${(nameSimilarity * 100).toFixed(1)}%) in ${incoming.province_name_canonical || 'same locality'}`,
            ];
            if (distance !== null && distance < 1000) {
              matchReasons.push(`Geographic proximity: ~${Math.round(distance)}m`);
            }
          }
        } else if (sameProvince && distance !== null && distance < 500 && nameSimilarity >= 0.2) {
          // Close geographic distance with overlapping vocabulary
          highestSimilarity = Math.max(highestSimilarity, 0.70);
          matchedIndex = i;
          matchType = 'ambiguous';
          matchReasons = [`Close proximity (~${Math.round(distance)}m) with overlapping vocabulary (${(nameSimilarity * 100).toFixed(0)}%)`];
        }
      }

      if (matchType === 'exact' && matchedIndex >= 0) {
        // Merge exact match into existing record
        exactMerges++;
        const target = canonicalPool[matchedIndex];
        canonicalPool[matchedIndex] = this.mergeExactRecords(target, incoming);
      } else if (matchType === 'ambiguous' && matchedIndex >= 0) {
        // AMBIGUOUS: Do NOT delete! Keep both records in pool and emit a review item
        ambiguousFlags++;
        canonicalPool.push(incoming); // Kept in database!
        reviewQueue.push({
          review_id: `rev-${Date.now()}-${ambiguousFlags}`,
          incoming_record: incoming,
          existing_record: canonicalPool[matchedIndex],
          similarity_score: highestSimilarity,
          match_reasons: matchReasons,
          flagged_at: new Date().toISOString(),
          status: 'pending_review',
        });
      } else {
        // Distinct record
        canonicalPool.push(incoming);
      }
    }

    return {
      deduplicated_records: canonicalPool,
      review_queue: reviewQueue,
      exact_merges_count: exactMerges,
      ambiguous_flags_count: ambiguousFlags,
      distinct_records_count: canonicalPool.length,
    };
  }

  /**
   * Merges two identical records, preserving both sources in the audit trail.
   */
  private mergeExactRecords<T extends BaseTourismEntity>(existing: T, incoming: T): T {
    // Preserve higher-confidence coordinates
    const confidenceRanks: Record<string, number> = {
      exact: 4,
      approximate: 3,
      province_level: 2,
      none: 1,
    };

    const existingRank = confidenceRanks[existing.coordinate_confidence] || 1;
    const incomingRank = confidenceRanks[incoming.coordinate_confidence] || 1;

    const chosenLat = incomingRank > existingRank ? incoming.latitude : existing.latitude;
    const chosenLon = incomingRank > existingRank ? incoming.longitude : existing.longitude;
    const chosenConfidence = incomingRank > existingRank ? incoming.coordinate_confidence : existing.coordinate_confidence;
    const chosenValidity = incomingRank > existingRank ? incoming.coordinate_validity : existing.coordinate_validity;

    // Preserve the longer / richer description
    const chosenDesc =
      (incoming.description?.length || 0) > (existing.description?.length || 0)
        ? incoming.description
        : existing.description;

    const mergedAudit = [
      ...existing.audit_trail,
      {
        timestamp: new Date().toISOString(),
        action: 'dedup_reviewed' as const,
        agent: 'NationalDeduplicator',
        notes: `Merged duplicate from source '${incoming.provenance.source_name}' (Raw ID: ${incoming.provenance.raw_record_id || 'N/A'}). Preserved coordinates confidence: ${chosenConfidence}.`,
      },
    ];

    return {
      ...existing,
      description: chosenDesc,
      latitude: chosenLat,
      longitude: chosenLon,
      coordinate_confidence: chosenConfidence,
      coordinate_validity: chosenValidity,
      audit_trail: mergedAudit,
      updated_at: new Date().toISOString(),
    };
  }
}

export const nationalDeduplicator = new NationalDeduplicator();
