import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  checkColabAIStatus,
  generateColabAIResponse,
  getColabAIModelInfo,
  type ColabAiConfig,
} from '../colabAiAdapter';

describe('TRAVI AI — Google Colab Qwen2 AI Provider Integration (15 Audit Scenarios)', () => {
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

  // 1. Colab online + valid token
  it('Scenario 1: Detects Colab online and Qwen ready with valid token and GPU metadata', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/health')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'healthy',
            service: 'travi-colab-gpu-inference',
            timestamp: new Date().toISOString(),
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
            gpu: { detected: true, name: 'Tesla T4', total_memory_mb: 15360, cuda_available: true },
            keep_alive: 'infinite (-1)',
            rag_facts_count: 85,
            context_window: 32768,
            runtime_expires_note: 'Temporary Colab runtime',
            active_model_ready: true,
            concurrency_max: 2,
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    const status = await checkColabAIStatus(mockConfig);
    expect(status.state).toBe('AI_ONLINE');
    expect(status.isAvailable).toBe(true);

    const modelInfo = await getColabAIModelInfo(mockConfig);
    expect(modelInfo.model).toBe('qwen2:7b');
    expect(modelInfo.quantization).toContain('Q4_0');
    expect(modelInfo.rag_facts_count).toBe(85);
    expect(modelInfo.gpu.name).toBe('Tesla T4');
  });

  // 2. Colab offline
  it('Scenario 2: Handles Colab offline gracefully without throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused: Endpoint unreachable'));

    const status = await checkColabAIStatus(mockConfig);
    expect(status.state).toBe('AI_OFFLINE');
    expect(status.isAvailable).toBe(false);
    expect(status.message).toContain('Failed to connect');

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

  // 4. Expired tunnel
  it('Scenario 4: Handles expired Cloudflare/ngrok tunnel network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch: Tunnel error 1033'));

    const status = await checkColabAIStatus(mockConfig);
    expect(status.state).toBe('AI_OFFLINE');
    expect(status.isAvailable).toBe(false);

    await expect(
      generateColabAIResponse({ prompt: 'Du lịch Hà Nội' }, mockConfig)
    ).rejects.toThrow(/Tunnel error 1033/i);
  });

  // 5. Ollama unavailable
  it('Scenario 5: Handles upstream Ollama daemon failure (HTTP 502)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      text: async () => 'Ollama upstream error: connection refused on 127.0.0.1:11434',
    });

    await expect(
      generateColabAIResponse({ prompt: 'Tư vấn Mộc Châu' }, mockConfig)
    ).rejects.toThrow(/error status 502/i);
  });

  // 6. Qwen model missing / still warming up
  it('Scenario 6: Reports AI_OFFLINE when health check returns degraded or model warming up', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'degraded',
        service: 'travi-colab-gpu-inference',
        timestamp: new Date().toISOString(),
      }),
    });

    const status = await checkColabAIStatus(mockConfig);
    expect(status.state).toBe('AI_OFFLINE');
    expect(status.status).toBe('degraded');
    expect(status.isAvailable).toBe(false);
  });

  // 7. Inference timeout
  it('Scenario 7: Handles request timeout via AbortController and reports clear timeout error', async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      throw abortError;
    });

    await expect(
      generateColabAIResponse({ prompt: 'Kinh nghiệm Mộc Châu' }, { ...mockConfig, timeoutMs: 50 })
    ).rejects.toThrow(/timed out/i);
  });

  // 8. Empty prompt
  it('Scenario 8: Validates request and rejects empty or whitespace-only prompt', async () => {
    await expect(
      generateColabAIResponse({ prompt: '' }, mockConfig)
    ).rejects.toThrow(/Prompt cannot be empty/i);

    await expect(
      generateColabAIResponse({ prompt: '   \n\t  ' }, mockConfig)
    ).rejects.toThrow(/Prompt cannot be empty/i);
  });

  // 9. Oversized prompt
  it('Scenario 9: Rejects oversized prompt exceeding maximum allowed 1000 characters', async () => {
    const overlyLongPrompt = 'A'.repeat(1001);
    await expect(
      generateColabAIResponse({ prompt: overlyLongPrompt }, mockConfig)
    ).rejects.toThrow(/exceeds maximum allowed length/i);
  });

  // 10. Malformed payload
  it('Scenario 10: Handles HTTP 400 or 422 malformed payload error from Colab backend', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      text: async () => JSON.stringify({ detail: [{ loc: ['body', 'prompt'], msg: 'field required' }] }),
    });

    await expect(
      generateColabAIResponse({ prompt: 'Valid Prompt' }, mockConfig)
    ).rejects.toThrow(/Invalid request payload/i);
  });

  // 11. Invalid customer profile / edge cases
  it('Scenario 11: Defaults gracefully when given incomplete or partial customer profile', async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          content: 'Chào mừng bạn đến với Việt Nam!',
          sources: [],
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
        prompt: 'Gợi ý du lịch ngắn ngày',
        profile: undefined,
      },
      mockConfig
    );

    expect(capturedBody.profile.customer_type).toBe('DOMESTIC');
    expect(res.status).toBe('success');
  });

  // 12. Vietnamese response language verification
  it('Scenario 12: Handles Vietnamese language prompt and preserves cultural provenance', async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          content: 'Khu du lịch Quốc gia Mộc Châu nổi tiếng với đồi chè trái tim và thung lũng mận Nà Ka. Bạn nên thưởng thức bê chao và cá suối nướng.',
          sources: [
            {
              name: 'Khu du lịch Quốc gia Mộc Châu',
              province: 'Sơn La',
              source: 'Sở Văn hóa Thể thao và Du lịch tỉnh Sơn La',
              coordinate_status: 'unverified_field_notes',
            },
          ],
          personalized_for: 'LOCAL',
          provenance: {
            providerName: 'Google Colab GPU Qwen2-7B (Tesla T4)',
            isLiveAi: true,
            modeDescription: 'Live Qwen2-7B Inference via Cloudflare Tunnel',
          },
        }),
      };
    });

    const res = await generateColabAIResponse(
      {
        prompt: 'Giới thiệu điểm đến Mộc Châu mùa này',
        profile: {
          travel_scope: 'LOCAL',
          language: 'VI',
          origin_location: { province: 'Sơn La' },
          destination_location: { province: 'Sơn La', city: 'Mộc Châu' },
        },
      },
      mockConfig
    );

    expect(capturedBody.profile.language).toBe('VI');
    expect(res.status).toBe('success');
    expect(res.content).toContain('đồi chè trái tim');
    expect(res.sources?.[0].province).toBe('Sơn La');
  });

  // 13. English response language verification
  it('Scenario 13: Handles English language profile and requests international cultural guidance', async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          content: 'Welcome to Hanoi! When visiting sacred pagodas such as Tran Quoc, please dress modestly and speak quietly.',
          sources: [{ name: 'Trấn Quốc Pagoda', province: 'Hà Nội', source: 'Hanoi Tourism Department' }],
          personalized_for: 'INTERNATIONAL',
          provenance: {
            providerName: 'Google Colab GPU Qwen2-7B (Tesla T4)',
            isLiveAi: true,
            modeDescription: 'Live Qwen2-7B Inference via Cloudflare Tunnel',
          },
        }),
      };
    });

    const res = await generateColabAIResponse(
      {
        prompt: 'What are the main pagoda rules in Hanoi?',
        profile: {
          market: 'INTERNATIONAL',
          language: 'EN',
          preferred_language: 'en',
          origin_country: 'United States',
          destination: 'Hà Nội',
        },
      },
      mockConfig
    );

    expect(capturedBody.profile.market).toBe('INTERNATIONAL');
    expect(capturedBody.profile.language).toBe('EN');
    expect(res.personalized_for).toBe('INTERNATIONAL');
    expect(res.content).toContain('Welcome to Hanoi');
  });

  // 14. Multi-turn chat history preserved
  it('Scenario 14: Preserves multi-turn chat history across conversational turns', async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          content: 'Quãng đường từ Hà Nội lên Mộc Châu khoảng 200km theo QL6, đi qua đèo Thung Khe.',
          sources: [],
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
        prompt: 'Đường đi có khó khăn không?',
        history: [
          { role: 'user', content: 'Tôi muốn đi Mộc Châu từ Hà Nội bằng ô tô.' },
          { role: 'assistant', content: 'Mộc Châu cách Hà Nội khoảng 200km, rất thích hợp đi 2 ngày 1 đêm.' },
        ],
        profile: {
          travel_scope: 'INTERPROVINCIAL',
          origin_province: 'Hà Nội',
          destination: 'Mộc Châu',
        },
      },
      mockConfig
    );

    expect(capturedBody.history).toHaveLength(2);
    expect(capturedBody.history[0].role).toBe('user');
    expect(capturedBody.history[1].role).toBe('assistant');
    expect(res.status).toBe('success');
  });

  // 15. Deterministic fallback after GPU disconnect
  it('Scenario 15: Falls back cleanly to deterministic expert mode after GPU disconnects', async () => {
    const offlineConfig: ColabAiConfig = {
      ...mockConfig,
      enabled: false,
    };

    const res = await generateColabAIResponse(
      { prompt: 'Lên lịch trình 3 ngày Mộc Châu' },
      offlineConfig
    );

    expect(res.status).toBe('offline');
    expect(res.provenance.isLiveAi).toBe(false);
    expect(res.provenance.providerName).toContain('Deterministic Expert');
  });
});
