import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  checkColabAIStatus,
  generateColabAIResponse,
  getColabAIModelInfo,
  type ColabAiConfig,
} from '../colabAiAdapter';

describe('TRAVI AI — Google Colab Qwen2 AI Provider Integration', () => {
  const originalFetch = global.fetch;

  const mockConfig: ColabAiConfig = {
    baseUrl: 'https://demo-colab-tunnel.trycloudflare.com',
    apiToken: 'travi-colab-secret-token',
    enabled: true,
    timeoutMs: 1000,
  };

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // 1. Colab online and Qwen ready
  it('Scenario 1: Detects Colab online and Qwen ready with GPU metadata', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/health')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'healthy',
            service: 'travi-colab-gpu-inference',
            gpu: { detected: true, name: 'Tesla T4', total_memory_mb: 15360, cuda_available: true },
            model: 'qwen2:7b',
            ollama: { reachable: true, models: ['qwen2:7b'], active_model: 'qwen2:7b' },
          }),
        };
      }
      if (url.includes('/api/model-info')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            model: 'qwen2:7b',
            quantization: 'Q4_0 (GGUF 4-bit Quantization)',
            gpu: { detected: true, name: 'Tesla T4', total_memory_mb: 15360 },
            keep_alive: 'infinite (-1)',
            rag_facts_count: 85,
            context_window: 32768,
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    const status = await checkColabAIStatus(mockConfig);
    expect(status.state).toBe('AI_ONLINE');
    expect(status.isAvailable).toBe(true);
    expect(status.model).toBe('qwen2:7b');
    expect(status.gpu?.name).toBe('Tesla T4');

    const modelInfo = await getColabAIModelInfo(mockConfig);
    expect(modelInfo.model).toBe('qwen2:7b');
    expect(modelInfo.quantization).toContain('Q4_0');
    expect(modelInfo.rag_facts_count).toBe(85);
  });

  // 2. Colab offline
  it('Scenario 2: Handles Colab offline gracefully without throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused: Endpoint unreachable'));

    const status = await checkColabAIStatus(mockConfig);
    expect(status.state).toBe('AI_OFFLINE');
    expect(status.isAvailable).toBe(false);
    expect(status.message).toContain('Failed to connect');

    // When disabled, adapter returns offline fallback
    const offlineRes = await generateColabAIResponse(
      { prompt: 'Du lịch Sơn La' },
      { ...mockConfig, enabled: false }
    );
    expect(offlineRes.status).toBe('offline');
    expect(offlineRes.provenance.isLiveAi).toBe(false);
  });

  // 3. Invalid API token
  it('Scenario 3: Rejects invalid or expired API token with 401 unauthorized', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Unauthorized: Invalid token',
    });

    await expect(
      getColabAIModelInfo({ ...mockConfig, apiToken: 'wrong-token' })
    ).rejects.toThrow(/Unauthorized/i);

    await expect(
      generateColabAIResponse({ prompt: 'Hello' }, { ...mockConfig, apiToken: 'wrong-token' })
    ).rejects.toThrow(/Unauthorized/i);
  });

  // 4. Timeout
  it('Scenario 4: Handles request timeout via AbortController', async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      throw abortError;
    });

    await expect(
      generateColabAIResponse({ prompt: 'Kinh nghiệm Mộc Châu' }, { ...mockConfig, timeoutMs: 50 })
    ).rejects.toThrow(/timed out/i);
  });

  // 5. Invalid request
  it('Scenario 5: Validates request and rejects empty prompt or excessive length', async () => {
    await expect(
      generateColabAIResponse({ prompt: '   ' }, mockConfig)
    ).rejects.toThrow(/Prompt cannot be empty/i);

    const overlyLongPrompt = 'A'.repeat(1001);
    await expect(
      generateColabAIResponse({ prompt: overlyLongPrompt }, mockConfig)
    ).rejects.toThrow(/exceeds maximum allowed length/i);
  });

  // 6. Empty RAG retrieval
  it('Scenario 6: Operates gracefully when RAG retrieval produces 0 matches', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'success',
        content: 'Tôi là Travi AI, sẵn sàng trợ giúp bạn khám phá thông tin văn hóa Việt Nam.',
        sources: [],
        suggestions: ['Gợi ý điểm đến Tây Bắc', 'Món ăn đặc sản Hà Nội'],
        personalized_for: 'DOMESTIC',
        provenance: {
          providerName: 'Google Colab GPU Qwen2-7B (Tesla T4)',
          isLiveAi: true,
          modeDescription: 'Live Qwen2-7B Inference',
        },
      }),
    });

    const res = await generateColabAIResponse(
      { prompt: 'Xin chào bạn là ai?' },
      mockConfig
    );

    expect(res.status).toBe('success');
    expect(res.sources).toEqual([]);
    expect(res.provenance.isLiveAi).toBe(true);
    expect(res.content).toContain('Travi AI');
  });

  // 7. International customer profile
  it('Scenario 7: Personalizes inference for INTERNATIONAL customer profile', async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          content: 'Welcome to Hanoi! When visiting sacred pagodas, please remember to dress modestly and remove shoes.',
          sources: [{ name: 'Trấn Quốc Pagoda', province: 'Hà Nội', source: 'Sở Du lịch Hà Nội' }],
          personalized_for: 'INTERNATIONAL',
          provenance: {
            providerName: 'Google Colab GPU Qwen2-7B (Tesla T4)',
            isLiveAi: true,
            modeDescription: 'Live Qwen2-7B Inference',
          },
        }),
      };
    });

    const res = await generateColabAIResponse(
      {
        prompt: 'What are the temple rules in Hanoi?',
        profile: {
          customer_type: 'INTERNATIONAL',
          origin_country: 'United States',
          destination: 'Hà Nội',
          preferred_language: 'en',
        },
      },
      mockConfig
    );

    expect(capturedBody.profile.customer_type).toBe('INTERNATIONAL');
    expect(capturedBody.profile.origin_country).toBe('United States');
    expect(res.personalized_for).toBe('INTERNATIONAL');
    expect(res.content).toContain('Welcome to Hanoi');
  });

  // 8. Domestic customer profile
  it('Scenario 8: Personalizes inference for DOMESTIC customer profile', async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          content: 'Lịch trình 3 ngày Đà Nẵng tối ưu chi phí gia đình và gợi ý quán mì Quảng gia truyền.',
          sources: [{ name: 'Bán đảo Sơn Trà', province: 'Đà Nẵng', source: 'Sở VHTT&DL Đà Nẵng' }],
          personalized_for: 'DOMESTIC',
          provenance: {
            providerName: 'Google Colab GPU Qwen2-7B (Tesla T4)',
            isLiveAi: true,
            modeDescription: 'Live Qwen2-7B Inference',
          },
        }),
      };
    });

    const res = await generateColabAIResponse(
      {
        prompt: 'Gợi ý lịch trình Đà Nẵng cho gia đình 4 người',
        profile: {
          customer_type: 'DOMESTIC',
          origin_province: 'Hà Nội',
          destination: 'Đà Nẵng',
          budget: 'moderate',
        },
      },
      mockConfig
    );

    expect(capturedBody.profile.customer_type).toBe('DOMESTIC');
    expect(res.personalized_for).toBe('DOMESTIC');
    expect(res.content).toContain('tối ưu chi phí');
  });

  // 9. Local customer profile
  it('Scenario 9: Personalizes inference for LOCAL customer profile (hidden gems)', async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          content: 'Điểm cắm trại cuối tuần vắng vẻ ít người tại Mộc Châu: Thác Nàng Tiên Chiềng Khoa.',
          sources: [{ name: 'Thác Nàng Tiên', province: 'Sơn La', source: 'Sở VHTT&DL Sơn La' }],
          personalized_for: 'LOCAL',
          provenance: {
            providerName: 'Google Colab GPU Qwen2-7B (Tesla T4)',
            isLiveAi: true,
            modeDescription: 'Live Qwen2-7B Inference',
          },
        }),
      };
    });

    const res = await generateColabAIResponse(
      {
        prompt: 'Cuối tuần này ở Mộc Châu đi đâu vắng người?',
        profile: {
          customer_type: 'LOCAL',
          origin_province: 'Sơn La',
          destination: 'Mộc Châu',
        },
      },
      mockConfig
    );

    expect(capturedBody.profile.customer_type).toBe('LOCAL');
    expect(res.personalized_for).toBe('LOCAL');
    expect(res.content).toContain('Thác Nàng Tiên');
  });

  // 10. Interprovincial customer profile
  it('Scenario 10: Personalizes inference for INTERPROVINCIAL customer profile (routes & mountain passes)', async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          content: 'Cung đường Hà Nội - Mộc Châu qua đèo Thung Khe (QL6) dài 200km, chú ý sương mù dốc dốc.',
          sources: [{ name: 'Đèo Thung Khe', province: 'Hòa Bình - Sơn La', source: 'Tổng cục Đường bộ' }],
          personalized_for: 'INTERPROVINCIAL',
          provenance: {
            providerName: 'Google Colab GPU Qwen2-7B (Tesla T4)',
            isLiveAi: true,
            modeDescription: 'Live Qwen2-7B Inference',
          },
        }),
      };
    });

    const res = await generateColabAIResponse(
      {
        prompt: 'Lộ trình di chuyển từ Hà Nội lên Mộc Châu bằng xe máy',
        profile: {
          customer_type: 'INTERPROVINCIAL',
          origin_province: 'Hà Nội',
          destination: 'Mộc Châu (Sơn La)',
          travel_duration: 3,
        },
      },
      mockConfig
    );

    expect(capturedBody.profile.customer_type).toBe('INTERPROVINCIAL');
    expect(res.personalized_for).toBe('INTERPROVINCIAL');
    expect(res.content).toContain('đèo Thung Khe');
  });

  // 11. Multi-dimensional coexisting profile attributes
  it('Scenario 11: Supports coexisting Multi-Dimensional profile dimensions (Market, Scope, Persona, Language)', async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          content: 'Lịch trình khám phá Mộc Châu an toàn cho gia đình có trẻ nhỏ, ưu tiên các trải nghiệm ngách bản địa vắng người.',
          sources: [{ name: 'Rừng thông Bản Áng', province: 'Sơn La', source: 'Sở VHTT&DL Sơn La' }],
          personalized_for: 'DOMESTIC',
          provenance: {
            providerName: 'Google Colab GPU Qwen2-7B (Tesla T4)',
            isLiveAi: true,
            modeDescription: 'Live Qwen2-7B Inference with Coexisting Multi-Dimensional Persona',
          },
        }),
      };
    });

    const res = await generateColabAIResponse(
      {
        prompt: 'Gợi ý lịch trình cuối tuần cho gia đình có con nhỏ ở Mộc Châu',
        profile: {
          market: 'DOMESTIC',
          travel_scope: 'LOCAL',
          persona: 'FAMILY',
          language: 'VI',
          origin_location: { country: 'Việt Nam', province: 'Sơn La', city: 'Mộc Châu' },
          destination_location: { country: 'Việt Nam', province: 'Sơn La', city: 'Mộc Châu' },
        },
      },
      mockConfig
    );

    expect(capturedBody.profile.market).toBe('DOMESTIC');
    expect(capturedBody.profile.travel_scope).toBe('LOCAL');
    expect(capturedBody.profile.persona).toBe('FAMILY');
    expect(capturedBody.profile.language).toBe('VI');
    expect(res.status).toBe('success');
    expect(res.content).toContain('an toàn cho gia đình');
  });
});

