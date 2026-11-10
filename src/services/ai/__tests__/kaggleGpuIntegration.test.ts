import { describe, it, expect, vi, afterEach } from 'vitest';
import { vietnamAiService } from '../vietnamAiService';

describe('Travi AI — Kaggle GPU Backend Integration & RAG Grounding', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('handles live inference response with sources and live AI provenance', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        content: 'Cao nguyên Mộc Châu mùa này hoa mơ, hoa mận đang bung nở trắng xóa tại thung lũng Nà Ka.',
        sources: [
          {
            name: 'Khu du lịch Quốc gia Mộc Châu',
            province: 'Sơn La',
            source: 'Sở Văn hóa Thể thao và Du lịch tỉnh Sơn La',
            coordinate_status: 'unverified_field_notes',
          },
        ],
        suggestions: ['Đặc sản bê chao Mộc Châu', 'Đồi chè trái tim'],
        provenance: {
          providerName: 'Travi Kaggle GPU Qwen2-7B (Tesla P100)',
          isLiveAi: true,
          modeDescription: 'Live LLM Inference via Kaggle GPU Secure Tunnel',
        },
      }),
    });

    const res = await vietnamAiService.generateAnswer('Mùa hoa ở Mộc Châu như thế nào?');
    expect(res.provenance.isLiveAi).toBe(true);
    expect(res.provenance.providerName).toContain('Kaggle GPU');
    expect(res.sources).toBeDefined();
    expect(res.sources?.length).toBe(1);
    expect(res.sources?.[0].name).toContain('Mộc Châu');
    expect(res.content).toContain('thung lũng Nà Ka');
  });

  it('seamlessly falls back to Deterministic Expert Engine when Kaggle GPU endpoint is unconfigured', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'unconfigured',
        mode: 'deterministic-fallback',
        message: 'Kaggle GPU session offline.',
      }),
    });

    const res = await vietnamAiService.generateAnswer('What is the temple etiquette in Vietnam?');
    expect(res.provenance.isLiveAi).toBe(false);
    expect(res.provenance.providerName).toBe('Travi Vietnam Expert Knowledge Engine');
    expect(res.content).toContain('Cultural Etiquette');
  });

  it('handles network timeout and connection failure gracefully without throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to connect to tunnel: Connection refused'));

    const res = await vietnamAiService.generateAnswer('Tell me about food in Hanoi');
    expect(res).toBeDefined();
    expect(res.content.length).toBeGreaterThan(0);
    expect(res.provenance.isLiveAi).toBe(false);
  });
});
