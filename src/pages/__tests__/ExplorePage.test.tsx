import { describe, it, expect } from 'vitest';
import { ExplorePage } from '../ExplorePage.tsx';

describe('ExplorePage — Discover Vietnam Verification', () => {
  it('ExplorePage exports a valid React component', () => {
    expect(ExplorePage).toBeDefined();
    expect(typeof ExplorePage).toBe('function');
  });

  it('ExplorePage source contains Vietnam travel discovery architecture and zero Qloo references', async () => {
    const fs = await import('node:fs/promises');
    const exploreCode = await fs.readFile('d:/Travi/src/pages/ExplorePage.tsx', 'utf-8');

    // Asserts Discover Vietnam branding & positioning in Vietnamese
    expect(exploreCode).toContain('Khám phá Việt Nam');
    expect(exploreCode).toContain('Điểm đến khắp Việt Nam');

    // Asserts View Switcher
    expect(exploreCode).toContain('Tuyển chọn');
    expect(exploreCode).toContain('Bản đồ');

    // Asserts Vietnam Region and Category Filtering
    expect(exploreCode).toContain('translateRegion');
    expect(exploreCode).toContain('translateCategory');

    // Asserts ZERO Qloo leakage
    expect(exploreCode.toLowerCase()).not.toContain('qloo');
    expect(exploreCode).not.toContain('api.qloo.com');
  });
});
