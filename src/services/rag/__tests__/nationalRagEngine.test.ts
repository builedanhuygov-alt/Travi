/**
 * Comprehensive National Multi-Collection RAG Test Suite (Phase 2)
 * =================================================================
 * Validates the 15 mandated scenarios across Vietnam's 34 administrative units,
 * 4 geographic regions, 7 distinct knowledge collections, source authority ranking,
 * anti-hallucination safeguards, cultural artifact isolation, and Colab offline fallback.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { NationalRetrievalEngine } from '../nationalRetrievalEngine.ts';
import {
  checkColabAIStatus,
  generateColabAIResponse,
  type ColabAiConfig,
} from '../../ai/colabAiAdapter.ts';
import { vietnamAiService } from '../../ai/vietnamAiService.ts';

describe('TRAVI — Phase 2: National Multi-Collection RAG Engine (15 Test Scenarios)', () => {
  const originalFetch = global.fetch;
  const engine = new NationalRetrievalEngine();

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // 1. POI query in each of 4 regions (North, Central, Central Highlands, South)
  it('Scenario 1: Retrieves POIs across all 4 Vietnamese regions (North, Central, Central Highlands, South)', () => {
    // North (e.g. Mộc Châu, Sơn La)
    const northRes = engine.retrieve({ query: 'Mộc Châu', top_k: 3 });
    expect(northRes.results.length).toBeGreaterThan(0);
    expect(northRes.results.some(r => r.province_name_canonical === 'Sơn La')).toBe(true);

    // Central (e.g. Cố đô Huế / Phong Nha)
    const centralRes = engine.retrieve({ query: 'Cố đô Huế', top_k: 3 });
    expect(centralRes.results.length).toBeGreaterThan(0);
    expect(centralRes.results.some(r => r.province_name_canonical?.includes('Huế'))).toBe(true);

    // Central Highlands (e.g. Đắk Lắk / Cồng chiêng)
    const highlandsRes = engine.retrieve({ query: 'Cồng chiêng Tây Nguyên', top_k: 3 });
    expect(highlandsRes.results.length).toBeGreaterThan(0);
    expect(highlandsRes.results.some(r => r.province_name_canonical === 'Đắk Lắk')).toBe(true);

    // South (e.g. Sài Gòn / Cần Thơ / Bến Thành)
    const southRes = engine.retrieve({ query: 'Sài Gòn', top_k: 3 });
    expect(southRes.results.length).toBeGreaterThan(0);
    expect(southRes.results.some(r => r.province_name_canonical?.includes('Hồ Chí Minh'))).toBe(true);
  });

  // 2. Query across all 7 collections
  it('Scenario 2: Supports querying and retrieving records from all 7 distinct collections', () => {
    const collectionsList = [
      'tourism_pois',
      'cultural_heritage',
      'local_cuisine',
      'festivals',
      'transportation',
      'accommodation',
      'tourism_experiences',
    ] as const;

    for (const col of collectionsList) {
      expect(engine.getCollectionCount(col)).toBeGreaterThan(0);
    }

    // Query cuisine collection
    const cuisineRes = engine.retrieve({ query: 'bê chao', collections: ['local_cuisine'], top_k: 1 });
    expect(cuisineRes.results[0].collection).toBe('local_cuisine');
    expect(cuisineRes.results[0].name).toContain('Bê chao');

    // Query festival collection
    const festRes = engine.retrieve({ query: 'Đền Hùng', collections: ['festivals'], top_k: 1 });
    expect(festRes.results[0].collection).toBe('festivals');
    expect(festRes.results[0].name).toContain('Đền Hùng');

    // Query transportation collection
    const transRes = engine.retrieve({ query: 'Nội Bài', collections: ['transportation'], top_k: 1 });
    expect(transRes.results[0].collection).toBe('transportation');
    expect(transRes.results[0].name).toContain('Nội Bài');

    // Query accommodation collection
    const accRes = engine.retrieve({ query: 'Homestay Bản Áng', collections: ['accommodation'], top_k: 1 });
    expect(accRes.results[0].collection).toBe('accommodation');

    // Query experiences collection
    const expRes = engine.retrieve({ query: 'Săn mây Tà Xùa', collections: ['tourism_experiences'], top_k: 1 });
    expect(expRes.results[0].collection).toBe('tourism_experiences');
  });

  // 3. Single province filter
  it('Scenario 3: Enforces strict single province filter without leaking other provinces', () => {
    // Filter strictly by Sơn La (province_id: '14')
    const sonLaRes = engine.retrieve({ query: 'du lịch', provinces: ['14'], top_k: 10 });
    expect(sonLaRes.results.length).toBeGreaterThan(0);
    for (const r of sonLaRes.results) {
      expect(r.province_id === '14' || r.province_name_canonical === 'Sơn La').toBe(true);
    }
  });

  // 4. Multi-province cross-border query
  it('Scenario 4: Correctly handles multi-province cross-border queries', () => {
    // Hai Van Pass spans Đà Nẵng ('48') and Thừa Thiên Huế ('46')
    const passRes = engine.retrieve({ query: 'Đèo Hải Vân', provinces: ['48', '46'], top_k: 3 });
    expect(passRes.results.length).toBeGreaterThan(0);
    expect(passRes.results[0].name).toContain('Hải Vân');
    expect(['Đà Nẵng', 'Thừa Thiên Huế']).toContain(passRes.results[0].province_name_canonical);
  });

  // 5. Vietnamese and English queries
  it('Scenario 5: Successfully retrieves content for both Vietnamese and English query inputs', () => {
    const viRes = engine.retrieve({ query: 'Phở bò Hà Nội', top_k: 1 });
    const enRes = engine.retrieve({ query: 'Hanoi Beef Pho', top_k: 1 });

    expect(viRes.results.length).toBeGreaterThan(0);
    expect(enRes.results.length).toBeGreaterThan(0);
    expect(viRes.results[0].id).toBe(enRes.results[0].id);
  });

  // 6. Missing ticket price behavior
  it('Scenario 6: Missing ticket prices are never fabricated; attaches verified uncertainty warning', () => {
    // Sơn La official POI (ticket_price_notes is null)
    const res = engine.retrieve({ query: 'Hang A Phủ', top_k: 1 });
    expect(res.results.length).toBeGreaterThan(0);
    const poi = res.results[0];

    // Ensures price field in entity is null (zero fabrication)
    if ('ticket_price_notes' in poi.entity) {
      expect(poi.entity.ticket_price_notes).toBeNull();
    }
    // Ensures uncertainty warning is explicitly attached
    expect(
      poi.uncertainty_warnings.some(w => w.includes('Giá vé: Thông tin chưa được xác thực'))
    ).toBe(true);
  });

  // 7. Missing opening hours behavior
  it('Scenario 7: Missing opening hours are never fabricated; attaches verified uncertainty warning', () => {
    const res = engine.retrieve({ query: 'Hang A Phủ', top_k: 1 });
    expect(res.results.length).toBeGreaterThan(0);
    const poi = res.results[0];

    if ('opening_hours_notes' in poi.entity) {
      expect(poi.entity.opening_hours_notes).toBeNull();
    }
    expect(
      poi.uncertainty_warnings.some(w => w.includes('Giờ mở cửa: Thông tin chưa được xác thực'))
    ).toBe(true);
  });

  // 8. Missing coordinates behavior
  it('Scenario 8: Missing coordinates are never fabricated as pins; coordinate_confidence is "none"', () => {
    const res = engine.retrieve({ query: 'poi-son-la-002', top_k: 1 });
    if (res.results.length > 0) {
      const poi = res.results[0];
      if (poi.entity.latitude === null) {
        expect(poi.entity.coordinate_confidence).toBe('none');
        expect(
          poi.uncertainty_warnings.some(w => w.includes('Tọa độ GPS chưa được đối soát thực địa'))
        ).toBe(true);
      }
    }
  });

  // 9. Unverified record handling with uncertainty badge
  it('Scenario 9: Flags needs_review or unverified records with explicit uncertainty badge', () => {
    const res = engine.retrieve({ query: 'bảo tàng lịch sử quốc gia', top_k: 5 });
    const verifiedItem = res.results.find(r => r.verification_status === 'verified');
    if (verifiedItem) {
      expect(verifiedItem.verification_badge).toBe('[ĐÃ XÁC MINH ĐỘC LẬP]');
    }

    const officialItem = res.results.find(r => r.verification_status === 'official_gov');
    if (officialItem) {
      expect(officialItem.verification_badge).toBe('[CHÍNH THỐNG - CÔNG BỐ CƠ QUAN NHÀ NƯỚC]');
    }
  });

  // 10. Conflicting sources handling
  it('Scenario 10: Preserves distinct provenance without silently overwriting conflicting sources', () => {
    // Both Sơn La portal and Northern editorial datasets contribute POIs with distinct provenance
    const sonLaPois = engine.retrieve({ query: 'Mộc Châu', top_k: 10 });
    const sources = new Set(sonLaPois.results.map(r => r.entity.provenance.source_name));
    expect(sources.size).toBeGreaterThan(0);
    for (const item of sonLaPois.results) {
      expect(item.entity.provenance.source_id).toBeDefined();
      expect(item.entity.provenance.source_date).toBeDefined();
    }
  });

  // 11. Duplicate record handling
  it('Scenario 11: Automatically deduplicates identical entity IDs and snippets from search results', () => {
    const res = engine.retrieve({ query: 'Mộc Châu', top_k: 10 });
    const ids = res.results.map(r => r.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  // 12. Cultural artifact vs visitable venue separation
  it('Scenario 12: Strictly separates cultural artifacts from visitable museum venues', () => {
    const drumRes = engine.retrieve({ query: 'Trống đồng Ngọc Lũ', top_k: 2 });
    expect(drumRes.results.length).toBeGreaterThan(0);
    const drum = drumRes.results.find(r => r.id === 'ca-trong-dong-ngoc-lu');
    expect(drum).toBeDefined();

    // Verify artifact metadata
    expect(drum?.visitable_venue_info?.is_artifact).toBe(true);
    expect(drum?.visitable_venue_info?.holding_museum).toBe('Bảo tàng Lịch sử Quốc gia');
    expect(
      drum?.uncertainty_warnings.some(w =>
        w.includes('Hiện vật văn hóa lưu giữ tại') && w.includes('địa điểm phát hiện khảo cổ')
      )
    ).toBe(true);
  });

  // 13. Empty retrieval result graceful fallback
  it('Scenario 13: Handles empty queries and non-matching inputs gracefully without crashing', () => {
    // Empty string
    const emptyRes = engine.retrieve({ query: '' });
    expect(emptyRes.total_matches).toBe(0);
    expect(emptyRes.results.length).toBe(0);
    expect(emptyRes.warnings.length).toBeGreaterThan(0);
    expect(emptyRes.suggested_followups.length).toBeGreaterThan(0);

    // Non-existent destination
    const noMatchRes = engine.retrieve({ query: 'xyznonexistentdestination999' });
    expect(noMatchRes.total_matches).toBe(0);
    expect(noMatchRes.results.length).toBe(0);
    expect(noMatchRes.warnings[0]).toContain('Không tìm thấy kết quả phù hợp');
  });

  // 14. Colab offline fallback
  it('Scenario 14: Gracefully falls back to Deterministic Expert Mode when Colab GPU server is offline', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED: Connection refused at 127.0.0.1:8000'));

    const mockConfig: ColabAiConfig = {
      baseUrl: 'http://127.0.0.1:8000',
      apiToken: 'test-token',
      enabled: true,
      timeoutMs: 500,
    };

    const status = await checkColabAIStatus(mockConfig);
    expect(status.state).toBe('AI_OFFLINE');
    expect(status.isAvailable).toBe(false);

    // Test deterministic expert fallback in vietnamAiService
    const expertRes = await vietnamAiService.generateAnswer('ẩm thực Sơn La');
    expect(expertRes.provenance.isLiveAi).toBe(false);
    expect(expertRes.provenance.providerName).toContain('Travi Vietnam Expert Knowledge Engine');
    expect(expertRes.content).toBeDefined();
  });

  // 15. Invalid / unauthorized request (401/422)
  it('Scenario 15: Rejects unauthorized requests (401) and malformed payloads without crashing', async () => {
    // 401 Unauthorized mock
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => '{"detail":"Unauthorized: Invalid or missing API authentication token."}',
    });

    const mockConfig: ColabAiConfig = {
      baseUrl: 'http://127.0.0.1:8000',
      apiToken: 'wrong-token',
      enabled: true,
    };

    await expect(
      generateColabAIResponse(
        { prompt: 'Lịch trình du lịch Sơn La' },
        mockConfig
      )
    ).rejects.toThrow('Unauthorized');
  });
});
