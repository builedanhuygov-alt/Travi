import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  vietnamAiService,
  getVietnamAiProviderStatus,
} from '../vietnamAiService.ts';
import {
  vietnamDestinations,
  searchVietnamDestinations,
  getVietnamDestinationById,
} from '../../../data/vietnamData.ts';
import {
  getAllAdministrativeUnits,
  getAdministrativeUnitById,
} from '../../../data/vietnamAdministrativeUnits.ts';
import {
  generateItinerary,
  CONCIERGE_DISCLAIMERS,
} from '../../concierge/itineraryGenerator.ts';

describe('Travi v1.2 — Trust, Security & Data Provenance Gateways', () => {
  // =========================================================================
  // PRIORITY 1 & 6: SECURITY & LLM SECRETS ISOLATION
  // =========================================================================
  describe('1. AI API Security & Secret Isolation', () => {
    it('guarantees no private LLM API keys are exposed in client source code', () => {
      const srcDir = path.resolve(__dirname, '../../..');
      const tsxFiles: string[] = [];

      function scanDir(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory() && !file.includes('node_modules')) {
            scanDir(fullPath);
          } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('.test.') && !file.includes('__tests__')) {
            tsxFiles.push(fullPath);
          }
        }
      }

      scanDir(srcDir);

      for (const file of tsxFiles) {
        const content = fs.readFileSync(file, 'utf8');
        expect(content).not.toContain('VITE_VIETNAM_AI_API_KEY');
        expect(content).not.toContain('VITE_VIETNAM_AI_ENDPOINT');
        expect(content).not.toContain('VITE_COLAB_AI_API_TOKEN');
        expect(content).not.toContain('VITE_COLAB_AI_BASE_URL');
      }
    });

    it('verifies that built production bundles in dist/ contain zero private AI secrets', () => {
      const distDir = path.resolve(__dirname, '../../../../dist');
      if (!fs.existsSync(distDir)) return;

      function scan(dir: string): string[] {
        let files: string[] = [];
        for (const f of fs.readdirSync(dir)) {
          const full = path.join(dir, f);
          if (fs.statSync(full).isDirectory()) files = files.concat(scan(full));
          else if (f.endsWith('.js') || f.endsWith('.html')) files.push(full);
        }
        return files;
      }

      const files = scan(distDir);
      expect(files.length).toBeGreaterThan(0);

      const forbidden = [
        'VITE_VIETNAM_AI_API_KEY',
        'VIETNAM_AI_API_KEY',
        'VITE_COLAB_AI_API_TOKEN',
        'COLAB_AI_API_TOKEN',
        'travi-colab-qwen2-secret-2026',
        'sk-ant-',
        'sk-proj-',
      ];
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        for (const token of forbidden) {
          expect(content).not.toContain(token);
        }
      }
    });

    it('enforces client-side query length limits and rejects oversized queries', async () => {
      // Empty input
      const emptyRes = await vietnamAiService.generateAnswer('');
      expect(emptyRes.content).toContain('Please enter a question');

      // Oversized input (>1000 characters)
      const oversizedQuery = 'A'.repeat(1005);
      const res = await vietnamAiService.generateAnswer(oversizedQuery);

      expect(res.content).toContain('maximum allowed length of 1,000 characters');
      expect(res.provenance.modeDescription).toContain('Safety Guard');
    });

    it('gracefully falls back to deterministic knowledge engine on network failure or upstream timeout', async () => {
      const originalFetch = globalThis.fetch;
      // Mock fetch simulating an AbortError timeout
      globalThis.fetch = vi.fn().mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'));

      try {
        const res = await vietnamAiService.generateAnswer('What is the temple etiquette in Vietnam?');
        expect(res).toBeDefined();
        expect(res.content).toContain('Cultural Etiquette');
        expect(res.provenance.isLiveAi).toBe(false);
        expect(res.provenance.providerName).toContain('Travi Vietnam Expert Knowledge Engine');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('reports truthful deterministic mode when external LLM is unconfigured', () => {
      const status = getVietnamAiProviderStatus();
      expect(status.provider).toBe('deterministic-expert');
      expect(status.isExternalApiConfigured).toBe(false);
      expect(status.securityPolicy).toContain('Zero client-side secrets');
      expect(status.backendGateway).toContain('/api/ai/chat');
    });
  });

  // =========================================================================
  // PRIORITY 2 & 6: DATA PROVENANCE & RESOLUTION NO. 202/2025/QH15
  // =========================================================================
  describe('2. Data Provenance & Legal Reference Accuracy', () => {
    it('verifies that all 34 administrative units cite Resolution No. 202/2025/QH15', () => {
      const units = getAllAdministrativeUnits();
      expect(units.length).toBe(34);

      for (const unit of units) {
        expect(unit.provenanceMetadata).toBeDefined();
        expect(unit.provenanceMetadata.legalBasis).toBe('Resolution No. 202/2025/QH15');
        expect(unit.provenanceMetadata.sourceName).toBeDefined();
        expect(unit.provenanceMetadata.sourceUrl).toBe('https://vbpl.vn');
        expect(unit.provenanceMetadata.lastVerifiedAt).toBe('2026-10-30');
        expect(unit.provenanceMetadata.verificationStatus).toBe('Verified Official Record');
      }
    });

    it('verifies structured provenance metadata on all 34 destination records', () => {
      expect(vietnamDestinations.length).toBe(34);

      for (const dest of vietnamDestinations) {
        expect(dest.provenanceMetadata).toBeDefined();
        expect(dest.provenanceMetadata.sourceName.length).toBeGreaterThan(5);
        expect(dest.provenanceMetadata.lastVerifiedAt).toBe('2026-10-30');
        expect(dest.provenanceMetadata.verificationStatus).toMatch(/^(Verified Editorial|Under Editorial Review)$/);
        expect(dest.provenanceMetadata.coordinatePrecision).toMatch(/^(Verified Exact Landmark|Provincial Capital \/ Transit Gateway)$/);

        // Under Editorial Review items must have meaningful verification notes
        if (dest.verificationStatus === 'Under Editorial Review') {
          expect(dest.provenanceMetadata.verificationNotes.length).toBeGreaterThan(20);
        }
      }
    });
  });

  // =========================================================================
  // PRIORITY 3 & 6: COORDINATE PRECISION & CENTROID AUDIT
  // =========================================================================
  describe('3. Coordinate Validation & Centroid Distinction', () => {
    it('flags destinations where coordinates represent provincial capitals/transit gateways rather than remote landmarks', () => {
      // Cao Bằng: coordinates point to Cao Bằng city (22.67, 106.25), not Bản Giốc Waterfall (~22.85, 106.72)
      const caobang = getVietnamDestinationById('cao-bang');
      expect(caobang?.coordinatePrecision).toBe('Provincial Capital / Transit Gateway');
      expect(caobang?.provenanceMetadata.verificationNotes).toContain('Cao Bằng provincial city center rather than Bản Giốc Waterfall');

      // Hải Phòng: coordinates point to municipal port gateway (20.86, 106.68), not Cát Bà Island (~20.73, 107.05)
      const haiphong = getVietnamDestinationById('hai-phong-catba');
      expect(haiphong?.coordinatePrecision).toBe('Provincial Capital / Transit Gateway');
      expect(haiphong?.provenanceMetadata.verificationNotes).toContain('Hải Phòng municipal administrative seat and ferry departure gateway');

      // Nghệ An: coordinates point to Vinh city (18.67, 105.68), not Pù Mát sanctuary (~18.98, 104.90)
      const nghean = getVietnamDestinationById('nghe-an-pumat');
      expect(nghean?.coordinatePrecision).toBe('Provincial Capital / Transit Gateway');
      expect(nghean?.provenanceMetadata.verificationNotes).toContain('Vinh city administrative center rather than Pù Mát National Park sanctuary');

      // Đồng Tháp: coordinates point to Cao Lãnh city (10.46, 105.63), not Tràm Chim wetland (~10.68, 105.52)
      const dongthap = getVietnamDestinationById('dong-thap-tramchim');
      expect(dongthap?.coordinatePrecision).toBe('Provincial Capital / Transit Gateway');
      expect(dongthap?.provenanceMetadata.verificationNotes).toContain('Cao Lãnh administrative center');
    });

    it('verifies exact landmark coordinates for core heritage and natural sites', () => {
      // Hanoi: Hoàn Kiếm Lake / Old Quarter core
      const hanoi = getVietnamDestinationById('ha-noi');
      expect(hanoi?.coordinatePrecision).toBe('Verified Exact Landmark');
      expect(hanoi?.coordinates.lat).toBeCloseTo(21.0285, 3);
      expect(hanoi?.coordinates.lng).toBeCloseTo(105.8542, 3);

      // Hue: Meridian Gate / Imperial Citadel
      const hue = getVietnamDestinationById('thua-thien-hue');
      expect(hue?.coordinatePrecision).toBe('Verified Exact Landmark');
      expect(hue?.coordinates.lat).toBeCloseTo(16.4637, 3);
      expect(hue?.coordinates.lng).toBeCloseTo(107.5909, 3);

      // Hoi An: Ancient Town
      const hoian = getVietnamDestinationById('quang-nam-hoian');
      expect(hoian?.coordinatePrecision).toBe('Verified Exact Landmark');
      expect(hoian?.coordinates.lat).toBeCloseTo(15.8801, 3);
      expect(hoian?.coordinates.lng).toBeCloseTo(108.3380, 3);
    });
  });

  // =========================================================================
  // PRIORITY 4 & 6: CONCEPT SEPARATION & HISTORICAL ALIASES
  // =========================================================================
  describe('4. Historical Alias Resolution & Administrative Separation', () => {
    it('resolves historical city names while maintaining current 2025 administrative container', () => {
      // Thăng Long -> Hanoi (Thành phố Hà Nội)
      const thangLongRes = searchVietnamDestinations('Thăng Long');
      expect(thangLongRes.some((d) => d.id === 'ha-noi')).toBe(true);
      expect(thangLongRes.find((d) => d.id === 'ha-noi')?.officialAdministrativeName).toBe('Thành phố Hà Nội');

      // Faifo -> Hoi An (Thành phố Đà Nẵng)
      const faifoRes = searchVietnamDestinations('Faifo');
      expect(faifoRes.some((d) => d.id === 'quang-nam-hoian')).toBe(true);
      expect(faifoRes.find((d) => d.id === 'quang-nam-hoian')?.officialAdministrativeName).toBe('Thành phố Đà Nẵng');

      // Gia Định -> Ho Chi Minh City (Thành phố Hồ Chí Minh)
      const giaDinhRes = searchVietnamDestinations('Gia Định');
      expect(giaDinhRes.some((d) => d.id === 'tp-ho-chi-minh')).toBe(true);
      expect(giaDinhRes.find((d) => d.id === 'tp-ho-chi-minh')?.officialAdministrativeName).toBe('Thành phố Hồ Chí Minh');
    });

    it('correctly maps pre-2025 merged provinces to their active 2025 parent unit', () => {
      // Former province Hà Giang -> ad-tuyen-quang (Tỉnh Tuyên Quang)
      const hagiangUnit = getAdministrativeUnitById('ad-tuyen-quang');
      expect(hagiangUnit?.mergedPre2025Provinces).toContain('Hà Giang');

      // Former province Kiên Giang -> ad-an-giang (Tỉnh An Giang)
      const angiangUnit = getAdministrativeUnitById('ad-an-giang');
      expect(angiangUnit?.mergedPre2025Provinces).toContain('Kiên Giang');

      // Former province Bà Rịa - Vũng Tàu -> ad-ho-chi-minh (Thành phố Hồ Chí Minh)
      const hcmUnit = getAdministrativeUnitById('ad-ho-chi-minh');
      expect(hcmUnit?.mergedPre2025Provinces).toContain('Bà Rịa - Vũng Tàu');
    });
  });

  // =========================================================================
  // PRIORITY 5 & 6: ROUTE PLANNING HONESTY & DISCLAIMERS
  // =========================================================================
  describe('5. Route Planning Honesty & Feasibility Checks', () => {
    it('includes explicit routing honesty disclaimer on synthesized itineraries', () => {
      const draft = generateItinerary({
        destination: 'ha-noi',
        durationDays: 3,
        budgetRange: 'Comfort Explorer',
        travelPace: 'Deliberate',
        culturalInterests: ['Heritage & History'],
      });

      expect(draft.disclaimers.routingNotice).toBeDefined();
      expect(draft.disclaimers.routingNotice).toContain('No live turn-by-turn road navigation provider is connected');
      expect(draft.disclaimers.estimationNotice).toContain('without live GPS navigation telemetry');
      expect(CONCIERGE_DISCLAIMERS.routingNotice).toContain('Route Honesty Notice');
    });

    it('flags impossible geographic sequences requiring manual review', () => {
      // 1-day trip starting from Ho Chi Minh City to Ha Giang with no flights
      const impossibleDraft = generateItinerary({
        destination: 'ha-giang',
        startingLocation: 'TP. Hồ Chí Minh, Vietnam',
        durationDays: 1,
        budgetRange: 'Budget Backpacker',
        travelPace: 'Expedition',
        transportPreference: 'Reunification Express Train',
        culturalInterests: ['Mountains, Karsts & Terrains'],
      });

      expect(impossibleDraft.feasibilityStatus).toBe('Requires Manual Review (Regional Distance Alert)');
      expect(impossibleDraft.feasibilityWarning).toContain('Overland transit between Southern Vietnam and Northern High Mountains requires minimum 2 full travel days');
    });

    it('confirms feasibility for reasonable regional routes', () => {
      const feasibleDraft = generateItinerary({
        destination: 'ha-noi',
        startingLocation: 'Hà Nội, Vietnam',
        durationDays: 3,
        budgetRange: 'Comfort Explorer',
        travelPace: 'Deliberate',
        transportPreference: 'Private Car & Driver',
        culturalInterests: ['Living Heritage & Dynasties'],
      });

      expect(feasibleDraft.feasibilityStatus).toBe('Feasible Itinerary');
      expect(feasibleDraft.feasibilityWarning).toBeUndefined();
    });
  });
});
