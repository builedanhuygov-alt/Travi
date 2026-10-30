/**
 * Firebase Cloud Functions: Travi Backend Functions (travi-app-23th10)
 * 
 * Secure Server-Side AI Gateway & Health Checks
 * - Secrets (VIETNAM_AI_API_KEY) are stored exclusively in server environment
 * - Input validation & size limits (max 1000 chars for query, max 10KB total payload)
 * - Rate limiting (max 20 requests per minute per IP)
 * - Upstream request timeout (10-second AbortSignal)
 * - Typed, safe error responses with no secret leakage
 */

import { onRequest } from 'firebase-functions/v2/https';

export const healthCheck = onRequest(
  {
    region: 'us-central1',
    cors: true,
  },
  (req, res) => {
    res.json({
      status: 'healthy',
      service: 'travi-api',
      platform: 'Vietnam Travel Discovery Platform',
      timestamp: new Date().toISOString(),
    });
  }
);

// In-memory rate limiting map: ip -> timestamps[]
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function isRateLimited(clientIp) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitMap.get(clientIp) || []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(clientIp, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(clientIp, timestamps);

  // Periodic cleanup
  if (rateLimitMap.size > 1000) {
    for (const [ip, tsList] of rateLimitMap.entries()) {
      const active = tsList.filter((t) => t > windowStart);
      if (active.length === 0) {
        rateLimitMap.delete(ip);
      } else {
        rateLimitMap.set(ip, active);
      }
    }
  }

  return false;
}

export const vietnamAiChat = onRequest(
  {
    region: 'us-central1',
    cors: true,
    timeoutSeconds: 15,
    maxInstances: 10,
  },
  async (req, res) => {
    // 1. Method check
    if (req.method !== 'POST') {
      res.status(405).json({
        error: 'Method Not Allowed. Use POST.',
        code: 'METHOD_NOT_ALLOWED',
      });
      return;
    }

    // 2. Client IP Rate Limiting
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
      res.status(429).json({
        error: 'Rate limit exceeded. Please wait a moment before sending more queries.',
        code: 'RATE_LIMIT_EXCEEDED',
      });
      return;
    }

    // 3. Payload size check
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 10240) {
      res.status(413).json({
        error: 'Payload Too Large. Request body must be under 10KB.',
        code: 'PAYLOAD_TOO_LARGE',
      });
      return;
    }

    // 4. Input validation
    const { prompt, context } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({
        error: 'Validation Error: "prompt" must be a non-empty string.',
        code: 'INVALID_PROMPT',
      });
      return;
    }

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length > 1000) {
      res.status(400).json({
        error: 'Validation Error: "prompt" exceeds the maximum allowed length of 1000 characters.',
        code: 'PROMPT_TOO_LONG',
      });
      return;
    }

    // Validate optional context fields if provided
    if (context && typeof context === 'object') {
      if (context.destination && typeof context.destination === 'string' && context.destination.length > 100) {
        res.status(400).json({
          error: 'Validation Error: context.destination exceeds 100 characters.',
          code: 'INVALID_CONTEXT',
        });
        return;
      }
      if (context.durationDays !== undefined && (typeof context.durationDays !== 'number' || context.durationDays < 1 || context.durationDays > 30)) {
        res.status(400).json({
          error: 'Validation Error: context.durationDays must be a number between 1 and 30.',
          code: 'INVALID_CONTEXT',
        });
        return;
      }
    }

    // 5. Server-Side Secret Inspection (NEVER read from client VITE_*)
    const serverApiKey = process.env.VIETNAM_AI_API_KEY?.trim();
    const serverEndpoint = process.env.VIETNAM_AI_ENDPOINT?.trim();

    if (!serverApiKey || !serverEndpoint) {
      // Gracefully signal to frontend that no upstream key is provisioned
      res.status(200).json({
        status: 'unconfigured',
        mode: 'deterministic-fallback',
        message: 'Server-side LLM credentials not configured. Operating in verified Deterministic Expert mode.',
      });
      return;
    }

    // 6. Upstream LLM Dispatch with 10-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const upstreamRes = await fetch(serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverApiKey}`,
        },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          context: context || {},
          system: 'You are Travi AI, an expert cultural travel companion specializing exclusively in Vietnam tourism.',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!upstreamRes.ok) {
        res.status(502).json({
          error: 'Upstream travel AI provider responded with an error.',
          code: 'UPSTREAM_ERROR',
        });
        return;
      }

      const upstreamData = await upstreamRes.json();
      res.json({
        status: 'success',
        content: upstreamData.reply || upstreamData.content || '',
        suggestions: upstreamData.suggestions || ['Tell me more', 'Suggest an itinerary stop'],
        provenance: {
          providerName: 'Travi Vietnam Live AI Provider (Server-Side)',
          isLiveAi: true,
          modeDescription: 'Live LLM Inference via Secure Backend Gateway',
        },
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        res.status(504).json({
          error: 'Upstream AI request timed out after 10 seconds.',
          code: 'REQUEST_TIMEOUT',
        });
        return;
      }

      // Safe generic error response — never log or expose secrets
      res.status(500).json({
        error: 'An internal server error occurred while contacting the AI provider.',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }
);
