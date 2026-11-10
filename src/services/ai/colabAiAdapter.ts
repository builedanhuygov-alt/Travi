/**
 * Travi AI — On-Demand Google Colab Qwen2 AI Provider Adapter
 * ==========================================================
 * Manages secure communication with the Google Colab GPU backend:
 * - Server-side authentication (Bearer Token)
 * - Request validation & size safety limits
 * - Timeout handling via AbortController
 * - Seamless offline degradation (AI_ONLINE vs AI_OFFLINE)
 * - Adaptive Customer Profile personalization
 *
 * ZERO client-side secret leakage: credentials exist strictly on the backend.
 */

export type ColabAiState = 'AI_ONLINE' | 'AI_OFFLINE' | 'AI_CONNECTING';

export interface ColabAiConfig {
  baseUrl: string;
  apiToken: string;
  enabled: boolean;
  timeoutMs?: number;
}

export interface ColabCustomerProfile {
  // Multi-dimensional distinct attributes
  market?: 'DOMESTIC' | 'INTERNATIONAL';
  origin_location?: { country?: string; province?: string; city?: string };
  destination_location?: { country?: string; province?: string; city?: string };
  travel_scope?: 'LOCAL' | 'INTERPROVINCIAL' | 'INTERNATIONAL_TRAVEL';
  persona?: 'FAMILY' | 'BACKPACKER' | 'SOLO' | 'EXPLORER';
  language?: 'VI' | 'EN' | 'OTHER';

  // Legacy convenience fields
  customer_type?: 'INTERNATIONAL' | 'DOMESTIC' | 'LOCAL' | 'INTERPROVINCIAL';
  origin_country?: string;
  origin_province?: string;
  destination?: string;
  preferred_language?: string;
  budget?: string;
  travel_duration?: number;
  interests?: string[];
  transportation_preference?: string;
}

export interface ColabAiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ColabAiChatRequest {
  prompt: string;
  profile?: ColabCustomerProfile;
  context?: Record<string, unknown>;
  history?: ColabAiChatMessage[];
  stream?: boolean;
}

export interface ColabAiChatResponse {
  status: 'success' | 'error' | 'offline';
  content: string;
  sources?: Array<{
    name: string;
    province?: string;
    source: string;
    coordinate_status?: string;
  }>;
  suggestions?: string[];
  personalized_for?: string;
  provenance: {
    providerName: string;
    isLiveAi: boolean;
    modeDescription: string;
    vramAllocatedMB?: number;
  };
  error?: string;
}

export interface ColabAiModelInfo {
  model: string;
  quantization: string;
  gpu: {
    detected: boolean;
    name: string;
    total_memory_mb: number;
    cuda_available: boolean;
  };
  keep_alive: string;
  rag_facts_count: number;
  context_window?: number;
  runtime_expires_note?: string;
}

export interface ColabAiHealthResponse {
  state: ColabAiState;
  status: 'healthy' | 'degraded' | 'offline';
  isAvailable: boolean;
  gpu?: {
    detected: boolean;
    name: string;
    total_memory_mb: number;
  };
  model?: string;
  message?: string;
}

function assertServerEnvironment(): void {
  // Ensure sensitive credentials adapter is never run inside an untrusted browser context
  if (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    !(typeof process !== 'undefined' && process.env?.VITEST)
  ) {
    throw new Error(
      'Security Boundary Violation: colabAiAdapter handles upstream credentials and is strictly restricted to trusted server environments (Node.js/Cloud Functions). Never execute in client browser bundles.'
    );
  }
}

/**
 * Resolves current server environment configuration.
 * Fallback values default to disabled with zero client-side credentials.
 */
export function getColabConfig(override?: Partial<ColabAiConfig>): ColabAiConfig {
  assertServerEnvironment();
  const env = typeof process !== 'undefined' && process.env ? process.env : {};

  const baseUrl = (
    override?.baseUrl ??
    env.COLAB_AI_BASE_URL ??
    env.VIETNAM_AI_ENDPOINT ??
    ''
  ).trim();

  const apiToken = (
    override?.apiToken ??
    env.COLAB_AI_API_TOKEN ??
    env.VIETNAM_AI_API_KEY ??
    ''
  ).trim();

  const enabledRaw = override?.enabled !== undefined
    ? override.enabled
    : (env.COLAB_AI_ENABLED === 'true' || Boolean(baseUrl && apiToken));

  const timeoutMs = override?.timeoutMs ?? 15000;

  return {
    baseUrl,
    apiToken,
    enabled: Boolean(enabledRaw && baseUrl),
    timeoutMs,
  };
}

/**
 * Checks connectivity and readiness of the Colab Qwen2 inference server.
 * Returns state: 'AI_ONLINE' when reachable and model loaded, otherwise 'AI_OFFLINE'.
 */
export async function checkColabAIStatus(
  overrideConfig?: Partial<ColabAiConfig>
): Promise<ColabAiHealthResponse> {
  const config = getColabConfig(overrideConfig);

  if (!config.enabled || !config.baseUrl) {
    return {
      state: 'AI_OFFLINE',
      status: 'offline',
      isAvailable: false,
      message: 'Colab AI backend is not configured or disabled.',
    };
  }

  const endpoint = config.baseUrl.replace(/\/+$/, '') + '/health';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Math.min(config.timeoutMs || 8000, 8000));

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        state: 'AI_OFFLINE',
        status: 'degraded',
        isAvailable: false,
        message: `Colab health check responded with status ${res.status}`,
      };
    }

    const data = await res.json();
    const isHealthy = data.status === 'healthy';

    return {
      state: isHealthy ? 'AI_ONLINE' : 'AI_OFFLINE',
      status: data.status || (isHealthy ? 'healthy' : 'degraded'),
      isAvailable: isHealthy,
      gpu: data.gpu,
      model: data.model || data.ollama?.active_model || 'qwen2:7b',
      message: isHealthy
        ? 'Colab GPU backend is online and ready for inference.'
        : 'Colab server is reachable but model is still warming up.',
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      state: 'AI_OFFLINE',
      status: 'offline',
      isAvailable: false,
      message: `Failed to connect to Colab server: ${errorMessage}`,
    };
  }
}

/**
 * Fetches model metadata and GPU hardware stats from Colab server.
 * Requires valid server-side token authentication.
 */
export async function getColabAIModelInfo(
  overrideConfig?: Partial<ColabAiConfig>
): Promise<ColabAiModelInfo> {
  const config = getColabConfig(overrideConfig);

  if (!config.enabled || !config.baseUrl) {
    throw new Error('Colab AI backend is not configured or disabled.');
  }

  const endpoint = config.baseUrl.replace(/\/+$/, '') + '/api/model-info';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs || 10000);

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.apiToken}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 401) {
      throw new Error('Unauthorized: Invalid or missing Colab API authentication token.');
    }

    if (!res.ok) {
      throw new Error(`Colab model-info failed with status ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Sends a travel prompt to the Colab Qwen2 inference engine.
 * Personalizes recommendation based on customer profile (INTERNATIONAL, DOMESTIC, LOCAL, INTERPROVINCIAL).
 */
export async function generateColabAIResponse(
  request: ColabAiChatRequest,
  overrideConfig?: Partial<ColabAiConfig>
): Promise<ColabAiChatResponse> {
  const trimmedPrompt = (request.prompt || '').trim();

  // Input validation
  if (!trimmedPrompt) {
    throw new Error('Invalid request: Prompt cannot be empty.');
  }
  if (trimmedPrompt.length > 1000) {
    throw new Error('Invalid request: Prompt exceeds maximum allowed length of 1,000 characters.');
  }

  const config = getColabConfig(overrideConfig);

  // If Colab is offline or unconfigured, return deterministic fallback signal
  if (!config.enabled || !config.baseUrl) {
    return {
      status: 'offline',
      content: '',
      provenance: {
        providerName: 'Travi Deterministic Expert Knowledge Engine',
        isLiveAi: false,
        modeDescription: 'Colab GPU backend unconfigured. Operating in verified expert mode.',
      },
      error: 'Colab GPU inference is disabled or unconfigured.',
    };
  }

  const endpoint = config.baseUrl.replace(/\/+$/, '') + '/api/chat';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs || 25000);

  try {
    const payload = {
      prompt: trimmedPrompt,
      profile: request.profile || { customer_type: 'DOMESTIC' },
      context: request.context || {},
      history: request.history || [],
      stream: false,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.apiToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 401) {
      throw new Error('Unauthorized: Invalid Colab API authentication token.');
    }

    if (res.status === 400 || res.status === 422) {
      const errBody = await res.text();
      throw new Error(`Invalid request payload: ${errBody}`);
    }

    if (res.status === 504) {
      throw new Error('Inference timed out on Colab GPU backend.');
    }

    if (!res.ok) {
      throw new Error(`Colab GPU inference returned error status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      status: 'success',
      content: data.content || data.reply || '',
      sources: data.sources || [],
      personalized_for: data.personalized_for || request.profile?.customer_type || 'DOMESTIC',
      suggestions: data.suggestions || [
        'Tìm hiểu ẩm thực bản địa',
        'Phương tiện di chuyển đến đây',
        'Thời điểm lý tưởng nhất trong năm',
      ],
      provenance: {
        providerName: data.provenance?.providerName || 'Google Colab GPU Qwen2-7B (Server-Side)',
        isLiveAi: true,
        modeDescription: data.provenance?.modeDescription || 'Live Qwen2-7B Inference via Cloudflare Tunnel',
        vramAllocatedMB: data.provenance?.vramAllocatedMB || 15360,
      },
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorMessage = err instanceof Error ? err.message : String(err);

    // If abort / timeout
    if (errorMessage.includes('aborted') || errorMessage.includes('AbortError')) {
      throw new Error('Inference timed out: Colab GPU request took longer than expected.');
    }

    throw err;
  }
}

