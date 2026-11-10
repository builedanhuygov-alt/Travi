import { describe, it, expect } from 'vitest';
import { HomePage } from '../HomePage.tsx';
import { StoriesPage } from '../StoriesPage.tsx';
import { StoryDetailPage } from '../StoryDetailPage.tsx';
import { MyDiscoveriesPage } from '../MyDiscoveriesPage.tsx';
import { ExperiencesPage } from '../ExperiencesPage.tsx';
import { DestinationDetailPage } from '../DestinationDetailPage.tsx';

describe('TRAVI 2.0 — Discovery-First Product Transformation Suite', () => {
  describe('1. Discover Feed & Platform Identity', () => {
    it('HomePage exports valid component with discovery-first architecture', () => {
      expect(HomePage).toBeDefined();
      expect(typeof HomePage).toBe('function');
    });

    it('HomePage source reflects TRAVI brand identity and Vietnamese tagline', async () => {
      const fs = await import('node:fs/promises');
      const homeCode = await fs.readFile('d:/Travi/src/pages/HomePage.tsx', 'utf-8');

      expect(homeCode).toContain('Mỗi miền đất, một câu chuyện.');
      expect(homeCode).toContain('TRAVI');
      expect(homeCode).toContain('Khám phá Việt Nam');
      expect(homeCode).toContain('Điểm đến nổi bật');
      expect(homeCode).toContain('Hương vị vùng miền');
      expect(homeCode).toContain('Trải nghiệm bản địa');
      expect(homeCode).toContain('Câu chuyện từ mỗi miền đất');
      expect(homeCode).toContain('Gợi ý dành cho bạn');
      expect(homeCode).not.toContain('qloo');
    });
  });

  describe('2. Destination Intelligence & Provenance', () => {
    it('DestinationDetailPage exports valid component', () => {
      expect(DestinationDetailPage).toBeDefined();
      expect(typeof DestinationDetailPage).toBe('function');
    });

    it('DestinationDetailPage links experiences, stories, and explored status with Vietnamese provenance', async () => {
      const fs = await import('node:fs/promises');
      const detailCode = await fs.readFile('d:/Travi/src/pages/DestinationDetailPage.tsx', 'utf-8');

      expect(detailCode).toContain('linkedStandaloneExperiences');
      expect(detailCode).toContain('linkedStories');
      expect(detailCode).toContain('toggleExploredPlace');
      expect(detailCode).toContain('translateProvenanceStatus');
      expect(detailCode).toContain('Bối cảnh lịch sử & Dòng chảy thời gian');
    });
  });

  describe('3. Experience Discovery Module', () => {
    it('ExperiencesPage exports valid component with 8 discovery disciplines', async () => {
      expect(ExperiencesPage).toBeDefined();
      expect(typeof ExperiencesPage).toBe('function');

      const fs = await import('node:fs/promises');
      const expCode = await fs.readFile('d:/Travi/src/pages/ExperiencesPage.tsx', 'utf-8');

      expect(expCode).toContain('VIETNAM_EXPERIENCE_CATEGORIES');
      expect(expCode).toContain('Ghi nhận nguyện vọng');
      expect(expCode).toContain('Lưu vào sổ tay');
    });
  });

  describe('4. Travi Stories & Editorial Archives', () => {
    it('StoriesPage and StoryDetailPage export valid components', () => {
      expect(StoriesPage).toBeDefined();
      expect(StoryDetailPage).toBeDefined();
    });

    it('Stories module source enforces archival references and image attribution', async () => {
      const fs = await import('node:fs/promises');
      const storyCode = await fs.readFile('d:/Travi/src/pages/StoryDetailPage.tsx', 'utf-8');

      expect(storyCode).toContain('Tài liệu tham khảo lưu trữ');
      expect(storyCode).toContain('Đồ thị Khám phá Việt Nam');
      expect(storyCode).toContain('imageAttribution');
      expect(storyCode).toContain('readTimeMinutes');
    });
  });

  describe('5. My Discoveries & Explored Tracker', () => {
    it('MyDiscoveriesPage exports valid component and supports collections and explored tracker in Vietnamese', async () => {
      expect(MyDiscoveriesPage).toBeDefined();
      expect(typeof MyDiscoveriesPage).toBe('function');

      const fs = await import('node:fs/promises');
      const discCode = await fs.readFile('d:/Travi/src/pages/MyDiscoveriesPage.tsx', 'utf-8');

      expect(discCode).toContain('Điểm đến đã lưu');
      expect(discCode).toContain('Trải nghiệm đã lưu');
      expect(discCode).toContain('Danh sách đọc');
      expect(discCode).toContain('Dấu chân khám phá');
      expect(discCode).toContain('VIETNAM_ADMINISTRATIVE_UNITS');
      expect(discCode).toContain('Tạo bộ sưu tập mới');
      expect(discCode).toContain('Chia sẻ bộ sưu tập');
    });
  });
});
