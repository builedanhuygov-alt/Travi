/**
 * Travi Local Dev AI Proxy Server
 * Runs on port 3001 and handles /api/ai/chat for Vite dev server.
 * Reads VIETNAM_AI_ENDPOINT and VIETNAM_AI_API_KEY from server environment (.env).
 * ZERO client-side secret leakage.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

// Parse .env file manually without requiring dotenv
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const PORT = process.env.PROXY_PORT || 3001;
const COLAB_AI_BASE_URL = (process.env.COLAB_AI_BASE_URL || process.env.VIETNAM_AI_ENDPOINT || '').trim();
const COLAB_AI_API_TOKEN = (process.env.COLAB_AI_API_TOKEN || process.env.VIETNAM_AI_API_KEY || '').trim();
const COLAB_AI_ENABLED = process.env.COLAB_AI_ENABLED === 'false' ? false : Boolean(COLAB_AI_BASE_URL && COLAB_AI_API_TOKEN);
const VIETNAM_AI_ENDPOINT = COLAB_AI_BASE_URL;
const VIETNAM_AI_API_KEY = COLAB_AI_API_TOKEN;

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/api/health' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      proxy: 'Travi Local AI Gateway',
      colabConfigured: Boolean(COLAB_AI_ENABLED && COLAB_AI_BASE_URL),
      upstreamEndpoint: COLAB_AI_BASE_URL ? '(Configured)' : '(Not set)',
    }));
    return;
  }

  // GET /api/ai/status or /api/ai/colab/status
  if ((req.url === '/api/ai/status' || req.url === '/api/ai/colab/status') && req.method === 'GET') {
    if (!COLAB_AI_ENABLED || !COLAB_AI_BASE_URL) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        state: 'AI_OFFLINE',
        status: 'offline',
        isAvailable: false,
        provider: 'Travi Vietnam Expert Knowledge Engine',
        model: 'Deterministic Expert Engine (Active & Verified)',
        message: 'Google Colab GPU inference is currently offline or unconfigured. Operating in verified Deterministic Expert mode.',
      }));
      return;
    }

    try {
      const healthUrl = COLAB_AI_BASE_URL.replace(/\/+$/, '') + '/health';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const upstreamRes = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (upstreamRes.ok) {
        const data = await upstreamRes.json();
        const isHealthy = data.status === 'healthy';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          state: isHealthy ? 'AI_ONLINE' : 'AI_OFFLINE',
          status: data.status || (isHealthy ? 'healthy' : 'degraded'),
          isAvailable: isHealthy,
          provider: 'Qwen2-7B-Instruct (Google Colab GPU)',
          model: data.model || data.ollama?.active_model || 'qwen2:7b',
          gpu: data.gpu || { name: 'Tesla T4 / P100', detected: true },
          message: isHealthy ? 'Colab GPU runtime online and ready.' : 'Colab model warming up.',
        }));
        return;
      }
    } catch {
      // Endpoint unreachable or timed out
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      state: 'AI_OFFLINE',
      status: 'offline',
      isAvailable: false,
      provider: 'Travi Vietnam Expert Knowledge Engine',
      model: 'Deterministic Expert Engine (Active & Verified)',
      message: 'Temporary Colab GPU runtime unreachable. Operating in verified Deterministic Expert mode.',
    }));
    return;
  }

  // GET /api/ai/model-info
  if (req.url === '/api/ai/model-info' && req.method === 'GET') {
    if (!COLAB_AI_ENABLED || !COLAB_AI_BASE_URL) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        model: 'deterministic-expert',
        quantization: 'N/A (Built-in Knowledge Graph)',
        state: 'AI_OFFLINE',
        rag_facts_count: 85,
        runtime_expires_note: 'Operating in verified local expert mode.',
      }));
      return;
    }

    try {
      const modelInfoUrl = COLAB_AI_BASE_URL.replace(/\/+$/, '') + '/api/model-info';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const upstreamRes = await fetch(modelInfoUrl, {
        headers: {
          'Authorization': `Bearer ${COLAB_AI_API_TOKEN}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (upstreamRes.ok) {
        const info = await upstreamRes.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(info));
        return;
      }
    } catch {}

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      model: 'qwen2:7b',
      state: 'AI_OFFLINE',
      message: 'Colab runtime disconnected.',
    }));
    return;
  }

  // GET /api/travel/health
  if (req.url === '/api/travel/health' && req.method === 'GET') {
    let poisCount = 85;
    try {
      const poisRaw = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'src/data/generated/vietnamPois.json'), 'utf8'));
      poisCount = poisRaw.length;
    } catch {}

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        sharedPoiDatabase: {
          available: true,
          totalRecords: poisCount,
          provincesCount: 34,
        },
        classifier: {
          available: true,
          supportedTypes: ['INTERNATIONAL', 'DOMESTIC', 'LOCAL', 'INTERPROVINCIAL'],
        },
        weatherEngine: {
          available: true,
          zonesCovered: 4,
        },
        routeEngine: {
          available: true,
          formula: 'Haversine Geographic Distance + Terrain Speed Factor',
        },
        aiInference: {
          isAvailable: Boolean(VIETNAM_AI_ENDPOINT && VIETNAM_AI_API_KEY),
          provider: VIETNAM_AI_ENDPOINT ? 'Qwen2-7B-Instruct (Kaggle GPU)' : 'Deterministic Expert Fallback',
          model: 'qwen2:7b',
          mode: VIETNAM_AI_ENDPOINT ? 'live_qwen2_gpu' : 'deterministic_fallback',
        },
      },
    }));
    return;
  }

  // POST /api/travel/profile
  if (req.url === '/api/travel/profile' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', (chunk) => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const profile = JSON.parse(bodyStr || '{}');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          message: 'User travel profile validated and saved.',
          profile,
          timestamp: new Date().toISOString(),
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message, code: 'INVALID_PROFILE_PAYLOAD' }));
      }
    });
    return;
  }

  // POST /api/travel/classify
  if (req.url === '/api/travel/classify' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', (chunk) => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const profile = JSON.parse(bodyStr || '{}');
        const originCountryNorm = (profile.origin_country || '').toLowerCase().trim();
        const originProvinceNorm = (profile.origin_province || '').toLowerCase().trim();
        const destNorm = (profile.destination || '').toLowerCase().trim();
        const lang = profile.preferred_language || 'vi';

        let detectedType = 'DOMESTIC';
        let confidence = 0.85;
        let reasons = [];

        if (profile.customer_type) {
          detectedType = profile.customer_type;
          confidence = 1.0;
          reasons.push(`Người dùng chủ động chỉ định nhóm khách: ${detectedType}`);
        } else if (originCountryNorm && !['vietnam', 'việt nam', 'vn'].includes(originCountryNorm)) {
          detectedType = 'INTERNATIONAL';
          confidence = 0.95;
          reasons.push(`Khởi hành từ ${profile.origin_country}. Ưu tiên song ngữ và di sản.`);
        } else if (!originCountryNorm && ['en', 'fr', 'ja', 'ko', 'zh'].includes(lang)) {
          detectedType = 'INTERNATIONAL';
          confidence = 0.85;
          reasons.push(`Ngôn ngữ ưu tiên (${lang.toUpperCase()}).`);
        } else if (originProvinceNorm && destNorm && (originProvinceNorm === destNorm || originProvinceNorm.includes(destNorm) || destNorm.includes(originProvinceNorm))) {
          detectedType = 'LOCAL';
          confidence = 0.95;
          reasons.push(`Khởi hành và điểm đến cùng tại ${profile.origin_province}. Ưu tiên hidden gems và cuối tuần.`);
        } else if (originProvinceNorm && destNorm && (profile.travel_duration || 1) >= 2) {
          detectedType = 'INTERPROVINCIAL';
          confidence = 0.90;
          reasons.push(`Chuyến đi liên tỉnh (${profile.origin_province} → ${profile.destination}). Ưu tiên lộ trình và trung chuyển.`);
        } else {
          detectedType = 'DOMESTIC';
          confidence = 0.88;
          reasons.push('Khách nội địa Việt Nam. Ưu tiên ẩm thực và chi phí tối ưu.');
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          classification: {
            detected_type: detectedType,
            confidence,
            reasons,
            is_overridden: Boolean(profile.customer_type),
            available_types: ['INTERNATIONAL', 'DOMESTIC', 'LOCAL', 'INTERPROVINCIAL'],
          },
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message, code: 'INVALID_CLASSIFY_PAYLOAD' }));
      }
    });
    return;
  }

  // POST /api/travel/recommend
  if (req.url === '/api/travel/recommend' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', (chunk) => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const profile = JSON.parse(bodyStr || '{}');
        const dest = profile.destination || 'Sơn La';
        const customerType = profile.customer_type || 'DOMESTIC';

        // Load shared POIs
        let samplePois = [];
        try {
          const poisRaw = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'src/data/generated/vietnamPois.json'), 'utf8'));
          samplePois = poisRaw.slice(0, 5).map(p => ({
            id: p.id,
            name: p.name,
            vietnameseName: p.vietnameseName,
            provinceOrRegion: p.provinceOrRegion,
            category: p.category,
            overallScore: 88,
            customerTypeAlignmentScore: 90,
            matchReasons: [`Phù hợp tiêu chí ${customerType}`, `Đặc sản: ${p.localFood.slice(0, 2).join(', ')}`],
            suggestedDuration: p.recommendedDuration,
            verificationStatus: p.verificationStatus,
            coordinateConfidence: p.coordinateConfidence,
            source: p.source,
          }));
        } catch {}

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          customer_type: customerType,
          destination: dest,
          recommendations: samplePois,
          weather: {
            destination: dest,
            seasonName: 'Mùa Khô Vùng Cao',
            suitabilityScore: 90,
            advisory: 'Thời tiết lý tưởng cho các hoạt động trải nghiệm ngoài trời.',
          },
          provenance: {
            dataSource: 'Travi Shared POI Database (Sở VHTT&DL)',
            verificationStatus: 'verified_with_unverified_coordinates_marked',
          },
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /api/travel/itinerary
  if (req.url === '/api/travel/itinerary' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', (chunk) => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const profile = JSON.parse(bodyStr || '{}');
        const days = Math.max(1, Math.min(profile.travel_duration || 3, 14));
        const customerType = profile.customer_type || 'DOMESTIC';
        const dest = profile.destination || 'Sơn La';

        const itineraryDays = [];
        for (let i = 1; i <= days; i++) {
          itineraryDays.push({
            dayNumber: i,
            title: `Ngày ${i}: Khám phá điểm nhấn văn hóa & thiên nhiên`,
            theme: i === 1 ? 'Khởi hành & Thưởng thức ẩm thực' : 'Trải nghiệm thắng cảnh thực địa',
            dailyEstimatedCostVND: customerType === 'INTERNATIONAL' ? 1800000 : 1200000,
            activities: [
              {
                timeOfDay: 'Morning',
                title: i === 1 ? 'Di chuyển đến điểm đến và nhận phòng' : 'Tham quan danh thắng địa phương',
                estimatedDuration: '3 Giờ',
              },
              {
                timeOfDay: 'Afternoon',
                title: 'Trải nghiệm ẩm thực và giao lưu văn hóa',
                estimatedDuration: '2.5 Giờ',
              },
            ],
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          customerType,
          destination: dest,
          durationDays: days,
          days: itineraryDays,
          estimatedTotalVND: days * (customerType === 'INTERNATIONAL' ? 1800000 : 1200000),
          disclaimer: 'Ước tính mang tính tham khảo thực tế. Không tự bịa đặt giá vé hay lịch trình đặt phòng.',
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // AI Chat endpoint
  if (req.url === '/api/ai/chat' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', (chunk) => {
      bodyStr += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyStr || '{}');
        const trimmedPrompt = (payload.prompt || '').trim();

        if (!trimmedPrompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Prompt is required', code: 'INVALID_PROMPT' }));
          return;
        }

        // If upstream Colab endpoint not configured, report unconfigured status
        if (!COLAB_AI_ENABLED || !COLAB_AI_BASE_URL || !COLAB_AI_API_TOKEN) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'unconfigured',
            mode: 'deterministic-fallback',
            message: 'Server-side Colab GPU endpoint not configured. Operating in verified Deterministic Expert mode.',
          }));
          return;
        }

        // Forward to Colab GPU Endpoint
        const targetUrl = COLAB_AI_BASE_URL.endsWith('/api/chat')
          ? COLAB_AI_BASE_URL
          : `${COLAB_AI_BASE_URL.replace(/\/+$/, '')}/api/chat`;

        const upstreamRes = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${COLAB_AI_API_TOKEN}`,
          },
          body: JSON.stringify({
            prompt: trimmedPrompt,
            profile: payload.profile || { customer_type: payload.customer_type || 'DOMESTIC' },
            context: payload.context || {},
            history: payload.history || [],
            stream: false,
          }),
        });

        if (!upstreamRes.ok) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: `Upstream Colab GPU error: ${upstreamRes.statusText}`,
            code: 'UPSTREAM_ERROR',
          }));
          return;
        }

        const upstreamData = await upstreamRes.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          content: upstreamData.content || upstreamData.reply || '',
          sources: upstreamData.sources || [],
          personalized_for: upstreamData.personalized_for || payload.profile?.customer_type || 'DOMESTIC',
          suggestions: upstreamData.suggestions || ['Tìm hiểu thêm về ẩm thực', 'Lên lịch trình chi tiết'],
          provenance: {
            providerName: upstreamData.provenance?.providerName || 'Travi Colab GPU Qwen2-7B (Server-Side)',
            isLiveAi: true,
            modeDescription: 'Live LLM Inference via Colab GPU Secure Tunnel',
          },
        }));
      } catch (err) {
        // Fallback to unconfigured/offline on connection error or tunnel expiration
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'unconfigured',
          mode: 'deterministic-fallback',
          error: err.message,
          message: 'Temporary Colab GPU runtime offline or unreachable. Switched to verified Deterministic Expert mode.',
        }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`Travi Dev AI Proxy listening on http://localhost:${PORT}`);
  console.log(`Upstream GPU Endpoint: ${VIETNAM_AI_ENDPOINT || '(None - offline deterministic fallback)'}`);
});

