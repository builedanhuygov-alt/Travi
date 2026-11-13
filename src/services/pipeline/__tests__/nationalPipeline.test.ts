import { describe, it, expect } from 'vitest';
import { validateCoordinates } from '../coordinateValidator.ts';
import { administrativeMatcher } from '../adminMatcher.ts';
import { nationalDeduplicator } from '../deduplicator.ts';
import { NationalTourismPipeline } from '../nationalPipeline.ts';
import type { TourismPOI } from '../../../types/nationalTourism.ts';

describe('TRAVI — National Tourism Data Pipeline & Schema Gates (Phase 1)', () => {
  // 1. Coordinate Validation & Bounding Box
  describe('1. Coordinate Validation & Bounding Box Gates', () => {
    it('validates coordinates strictly within Vietnam territorial bounds', () => {
      const hanoi = validateCoordinates(21.0285, 105.8542, 'exact');
      expect(hanoi.validity).toBe('valid');
      expect(hanoi.confidence).toBe('exact');
      expect(hanoi.latitude).toBeCloseTo(21.0285, 4);
      expect(hanoi.longitude).toBeCloseTo(105.8542, 4);

      const phuQuoc = validateCoordinates(10.2899, 103.9840, 'approximate');
      expect(phuQuoc.validity).toBe('valid');
      expect(phuQuoc.confidence).toBe('approximate');
    });

    it('rejects out-of-bounds coordinates and strips lat/lon to null for map safety', () => {
      // In foreign territory (e.g. Paris or Tokyo)
      const foreign = validateCoordinates(48.8566, 2.3522, 'exact');
      expect(foreign.validity).toBe('out_of_bounds');
      expect(foreign.confidence).toBe('none');
      expect(foreign.latitude).toBeNull();
      expect(foreign.longitude).toBeNull();

      // Inverted coordinates (Lon in Lat position e.g. Lat 105, Lon 21)
      const inverted = validateCoordinates(105.85, 21.02, 'exact');
      expect(inverted.validity).toBe('out_of_bounds');
      expect(inverted.latitude).toBeNull();
    });

    it('safely classifies null or missing coordinates without fabricating numbers', () => {
      const missing = validateCoordinates(null, null);
      expect(missing.validity).toBe('missing');
      expect(missing.confidence).toBe('none');
      expect(missing.latitude).toBeNull();
      expect(missing.longitude).toBeNull();
    });

    it('distinguishes coordinate validity from verification confidence', () => {
      // Valid numeric coords, but explicitly flagged as unverified field notes
      const unverified = validateCoordinates(21.195, 104.069, null, 'unverified_field_notes');
      expect(unverified.validity).toBe('valid');
      expect(unverified.confidence).toBe('none');
    });
  });

  // 2. Administrative Boundary Matching (34 Post-2025 Units)
  describe('2. Administrative Matching (34 Units Post-2025 Decision 19/2025/QĐ-TTg)', () => {
    it('maps official provincial names directly to canonical IDs', () => {
      expect(administrativeMatcher.matchProvince('Hà Nội').province_id).toBe('01');
      expect(administrativeMatcher.matchProvince('Tỉnh Sơn La').province_id).toBe('14');
      expect(administrativeMatcher.matchProvince('Thành phố Hồ Chí Minh').province_id).toBe('79');
      expect(administrativeMatcher.matchProvince('TP. Đà Nẵng').province_id).toBe('48');
      expect(administrativeMatcher.matchProvince('Tỉnh Cà Mau').province_id).toBe('96');
    });

    it('maps English provincial names correctly', () => {
      expect(administrativeMatcher.matchProvince('Hanoi').province_id).toBe('01');
      expect(administrativeMatcher.matchProvince('Son La').province_id).toBe('14');
      expect(administrativeMatcher.matchProvince('Da Nang').province_id).toBe('48');
      expect(administrativeMatcher.matchProvince('Can Tho').province_id).toBe('92');
    });

    it('maps historical aliases and post-2025 mergers with historical audit metadata', () => {
      const saigon = administrativeMatcher.matchProvince('Sài Gòn');
      expect(saigon.province_id).toBe('79');
      expect(saigon.is_historical).toBe(true);
      expect(saigon.historical_note).toContain('Hồ Chí Minh');

      const thanglong = administrativeMatcher.matchProvince('Thăng Long');
      expect(thanglong.province_id).toBe('01');
      expect(thanglong.is_historical).toBe(true);

      const hagiang = administrativeMatcher.matchProvince('Hà Giang');
      expect(hagiang.province_id).toBe('08'); // Merged into Tuyên Quang
      expect(hagiang.is_historical).toBe(true);
    });

    it('rejects ambiguous or unrecognized provinces without guessing', () => {
      const unknown = administrativeMatcher.matchProvince('Vùng Đất Kỳ Bí XYZ');
      expect(unknown.province_id).toBeNull();
      expect(unknown.confidence).toBe('unmatched');
    });

    it('matches wards strictly within their parent province and rejects cross-province guesswork', () => {
      // Ba Đình ward in Hà Nội (01)
      const baDinh = administrativeMatcher.matchWard('Ba Đình', '01');
      expect(baDinh.ward_id).toBe('00004');
      expect(baDinh.ward_name).toBe('Ba Đình');

      // Ba Đình ward does NOT exist in Sơn La (14)
      const invalidCross = administrativeMatcher.matchWard('Ba Đình', '14');
      expect(invalidCross.ward_id).toBeNull();
    });
  });

  // 3. Deduplication & Ambiguity Review Queue
  describe('3. Deduplication & Ambiguity Review Queue', () => {
    it('merges exact duplicates in the same province preserving richest metadata and provenance', () => {
      const rec1: TourismPOI = {
        id: 'poi-1',
        name: 'Đồi chè Trái Tim Mộc Châu',
        localized_names: { vi: 'Đồi chè Trái Tim Mộc Châu' },
        slug: 'doi-che-trai-tim-moc-chau',
        description: 'Đồi chè biểu tượng',
        province_id: '14',
        province_name_canonical: 'Sơn La',
        ward_id: null,
        ward_name_canonical: null,
        category: 'Điểm du lịch',
        entity_type: 'tourism_poi',
        poi_category: 'tourism_spot',
        latitude: null,
        longitude: null,
        address: 'Mộc Châu, Sơn La',
        coordinate_validity: 'missing',
        coordinate_confidence: 'none',
        verification_status: 'official_gov',
        experiences: ['Chụp ảnh'],
        local_food: ['Chè Mộc Châu'],
        cultural_highlights: [],
        historical_aliases: [],
        provenance: {
          source_id: 'src-1',
          source_name: 'Sở VHTT&DL Sơn La',
          source_url: 'https://dulichsonla.gov.vn',
          source_date: '2026-11-10',
          source_type: 'provincial_portal',
          ingestion_batch_id: 'batch-1',
          raw_record_id: 'rec-1',
        },
        audit_trail: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_verified_at: '2026-11-10',
      };

      const rec2: TourismPOI = {
        ...rec1,
        id: 'poi-2',
        description: 'Đồi chè hình trái tim tuyệt đẹp tại cao nguyên Mộc Châu, biểu tượng du lịch nông nghiệp.',
        latitude: 20.8521,
        longitude: 104.6412,
        coordinate_validity: 'valid',
        coordinate_confidence: 'approximate',
        provenance: {
          source_id: 'src-2',
          source_name: 'Cổng thông tin Du lịch Mộc Châu',
          source_url: null,
          source_date: '2026-11-01',
          source_type: 'editorial_curated',
          ingestion_batch_id: 'batch-2',
          raw_record_id: 'rec-2',
        },
      };

      const result = nationalDeduplicator.deduplicate([rec1, rec2]);
      expect(result.exact_merges_count).toBe(1);
      expect(result.deduplicated_records.length).toBe(1);

      const merged = result.deduplicated_records[0];
      expect(merged.description).toContain('tuyệt đẹp tại cao nguyên Mộc Châu');
      expect(merged.latitude).toBe(20.8521);
      expect(merged.coordinate_confidence).toBe('approximate');
      expect(merged.audit_trail.length).toBe(1);
      expect(merged.audit_trail[0].notes).toContain("Cổng thông tin Du lịch Mộc Châu");
    });

    it('preserves ambiguous / uncertain matches in the pool AND queues them for review without deletion', () => {
      const recA: TourismPOI = {
        id: 'poi-a',
        name: 'Thác Dải Yếm Mộc Châu',
        localized_names: { vi: 'Thác Dải Yếm' },
        slug: 'thac-dai-yem',
        description: 'Thác nước 9 tầng',
        province_id: '14',
        province_name_canonical: 'Sơn La',
        ward_id: null,
        ward_name_canonical: null,
        category: 'Thác nước',
        entity_type: 'tourism_poi',
        poi_category: 'natural_landscape',
        latitude: 20.831,
        longitude: 104.621,
        address: 'Xã Mường Sang, Mộc Châu',
        coordinate_validity: 'valid',
        coordinate_confidence: 'approximate',
        verification_status: 'official_gov',
        experiences: [],
        local_food: [],
        cultural_highlights: [],
        historical_aliases: [],
        provenance: {
          source_id: 'src-1',
          source_name: 'Sở VHTT&DL Sơn La',
          source_url: null,
          source_date: '2026-11-10',
          source_type: 'provincial_portal',
          ingestion_batch_id: 'batch-1',
          raw_record_id: 'a',
        },
        audit_trail: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_verified_at: '2026-11-10',
      };

      const recB: TourismPOI = {
        ...recA,
        id: 'poi-b',
        name: 'Khu du lịch Thác Dải Yếm - Cầu kính Tình Yêu',
        slug: 'khu-du-lich-thac-dai-yem-cau-kinh',
        description: 'Tổ hợp du lịch thác Dải Yếm và cầu kính hiện đại',
        latitude: 20.832,
        longitude: 104.622,
      };

      const result = nationalDeduplicator.deduplicate([recA, recB]);
      expect(result.exact_merges_count).toBe(0);
      expect(result.ambiguous_flags_count).toBe(1);
      expect(result.deduplicated_records.length).toBe(2); // NEVER auto-deleted!
      expect(result.review_queue.length).toBe(1);
      expect(result.review_queue[0].similarity_score).toBeGreaterThanOrEqual(0.6);
      expect(result.review_queue[0].status).toBe('pending_review');
    });

    it('treats identical names in different provinces as strictly distinct records', () => {
      const recHanoi: TourismPOI = {
        id: 'poi-hn',
        name: 'Chợ Đêm Phố Cổ',
        localized_names: { vi: 'Chợ Đêm Phố Cổ' },
        slug: 'cho-dem-hn',
        description: 'Chợ đêm Hà Nội',
        province_id: '01',
        province_name_canonical: 'Hà Nội',
        ward_id: null,
        ward_name_canonical: null,
        category: 'Chợ',
        entity_type: 'tourism_poi',
        poi_category: 'tourism_spot',
        latitude: 21.033,
        longitude: 105.851,
        address: 'Hàng Đào, Hoàn Kiếm, Hà Nội',
        coordinate_validity: 'valid',
        coordinate_confidence: 'exact',
        verification_status: 'verified',
        experiences: [],
        local_food: [],
        cultural_highlights: [],
        historical_aliases: [],
        provenance: {
          source_id: 'src-hn',
          source_name: 'Hanoi Tourism',
          source_url: null,
          source_date: '2026-11-01',
          source_type: 'editorial_curated',
          ingestion_batch_id: 'b1',
          raw_record_id: '1',
        },
        audit_trail: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_verified_at: '2026-11-01',
      };

      const recHoiAn: TourismPOI = {
        ...recHanoi,
        id: 'poi-ha',
        slug: 'cho-dem-ha',
        province_id: '48', // Đà Nẵng / Quảng Nam
        province_name_canonical: 'Đà Nẵng',
        latitude: 15.877,
        longitude: 108.326,
      };

      const result = nationalDeduplicator.deduplicate([recHanoi, recHoiAn]);
      expect(result.exact_merges_count).toBe(0);
      expect(result.deduplicated_records.length).toBe(2);
      expect(result.review_queue.length).toBe(0);
    });
  });

  // 4. End-to-End Pipeline Execution & Coverage Audit
  describe('4. Pipeline Execution & 34-Province Coverage Audit', () => {
    it('executes pipeline end-to-end, preserving all 85 Sơn La official records and generating multi-tier output', () => {
      const pipeline = new NationalTourismPipeline('test-audit-batch');
      const tempOutDir = 'src/data/national';
      const { report, coverage, reviewQueue } = pipeline.execute(tempOutDir);

      expect(report.total_raw_ingested).toBeGreaterThanOrEqual(350);
      expect(report.total_canonical_records).toBeGreaterThanOrEqual(350);
      expect(report.provinces_total_count).toBe(34);
      expect(coverage.length).toBe(34);
      expect(reviewQueue.length).toBeGreaterThanOrEqual(0);

      // Verify Sơn La official dataset preservation
      const sonLaStats = coverage.find((c) => c.province_id === '14');
      expect(sonLaStats).toBeDefined();
      expect(sonLaStats?.province_name_local).toBe('Sơn La');
      expect(sonLaStats?.official_gov_poi_count).toBeGreaterThanOrEqual(80);
      expect(sonLaStats?.data_confidence_tier).toBe('ROBUST');

      // Verify unverified GPS coordinate count in Sơn La (84 records have coordinate_confidence: 'none')
      expect(sonLaStats?.poi_with_no_coords).toBeGreaterThanOrEqual(80);

      // Verify honest reporting for empty provinces (Đồng Nai, Vĩnh Long, Cà Mau have 0 POIs and must be marked NO_VERIFIED_DATA)
      const emptyProvinces = coverage.filter((c) => c.data_confidence_tier === 'NO_VERIFIED_DATA');
      expect(emptyProvinces.length).toBeGreaterThan(0);
      for (const empty of emptyProvinces) {
        expect(empty.total_poi_count).toBe(0);
        expect(empty.official_gov_poi_count).toBe(0);
      }
    });
  });
});
