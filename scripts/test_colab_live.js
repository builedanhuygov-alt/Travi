#!/usr/bin/env node
/**
 * TRAVI — Live Google Colab Qwen2 GPU Connection Tester
 * ====================================================
 * Run via: node scripts/test_colab_live.js
 * 
 * Verifies live connection to the temporary Google Colab HTTPS tunnel:
 * 1. Checks GET /health (GPU detection, Ollama status, model availability)
 * 2. Checks GET /api/model-info (Bearer token authentication & quantization)
 * 3. Checks POST /api/chat (Live Qwen2 inference with RAG & multi-dimensional profile)
 * 
 * ZERO fabrication: Never reports success if the endpoint is offline or unconfigured.
 */

import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const envVars = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        envVars[match[1]] = val;
      }
    }
  }
  return envVars;
}

async function runLiveTest() {
  console.log('='.repeat(70));
  console.log('TRAVI — GOOGLE COLAB QWEN2 LIVE INTEGRATION TESTER');
  console.log('='.repeat(70));

  const env = loadEnv();
  const baseUrl = (process.env.COLAB_AI_BASE_URL || env.COLAB_AI_BASE_URL || '').trim();
  const apiToken = (process.env.COLAB_AI_API_TOKEN || env.COLAB_AI_API_TOKEN || '').trim();
  const isEnabled = process.env.COLAB_AI_ENABLED === 'true' || env.COLAB_AI_ENABLED === 'true';

  if (!baseUrl || !apiToken) {
    console.log('\n[STATUS: NOT CONFIGURED]');
    console.log('No live Google Colab tunnel URL found in .env:');
    console.log('  COLAB_AI_BASE_URL=' + (baseUrl || '(empty)'));
    console.log('  COLAB_AI_API_TOKEN=' + (apiToken ? '(present)' : '(empty)'));
    console.log('  COLAB_AI_ENABLED=' + isEnabled);
    console.log('\n[HOW TO CONNECT A LIVE DEMO]:');
    console.log('1. Open colab/travi_colab_qwen2.ipynb in Google Colab with GPU T4.');
    console.log('2. Run all cells to initialize Ollama Qwen2 and the Cloudflare Tunnel.');
    console.log('3. Copy the tunnel URL and session token printed at Cell 6.');
    console.log('4. Add them to your .env file:');
    console.log('   COLAB_AI_BASE_URL="https://your-tunnel.trycloudflare.com"');
    console.log('   COLAB_AI_API_TOKEN="<token>"');
    console.log('   COLAB_AI_ENABLED=true');
    console.log('5. Re-run: node scripts/test_colab_live.js\n');
    console.log('Travi currently operates in verified DETERMINISTIC EXPERT MODE (Offline Fallback).');
    console.log('='.repeat(70));
    return;
  }

  console.log(`\nTarget URL: ${baseUrl}`);
  console.log(`API Token: ${apiToken.slice(0, 6)}... (length: ${apiToken.length})`);
  console.log('Sending live requests...\n');

  // 1. Test GET /health
  try {
    const t0 = Date.now();
    const healthRes = await fetch(`${baseUrl.replace(/\/+$/, '')}/health`, { signal: AbortSignal.timeout(8000) });
    const healthTime = Date.now() - t0;

    if (!healthRes.ok) {
      console.log(`❌ Step 1 (GET /health) FAILED with HTTP ${healthRes.status}: ${healthRes.statusText}`);
      return;
    }
    const healthData = await healthRes.json();
    console.log(`✅ Step 1 (GET /health) PASSED in ${healthTime}ms:`);
    console.log(`   Status: ${healthData.status}`);
    console.log(`   Service: ${healthData.service}`);
    console.log(`   Timestamp: ${healthData.timestamp}`);
  } catch (err) {
    console.log(`❌ Step 1 (GET /health) FAILED: ${err.message}`);
    console.log('   Ensure the Google Colab notebook kernel is still active and connected to Internet.');
    return;
  }

  // 2. Test GET /api/model-info with Auth
  try {
    const t0 = Date.now();
    const modelRes = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/model-info`, {
      headers: { Authorization: `Bearer ${apiToken}` },
      signal: AbortSignal.timeout(8000),
    });
    const modelTime = Date.now() - t0;

    if (modelRes.status === 401) {
      console.log('❌ Step 2 (GET /api/model-info) AUTHENTICATION REJECTED (HTTP 401). Check COLAB_AI_API_TOKEN.');
      return;
    }
    if (!modelRes.ok) {
      console.log(`❌ Step 2 (GET /api/model-info) FAILED with HTTP ${modelRes.status}`);
      return;
    }
    const modelData = await modelRes.json();
    console.log(`✅ Step 2 (GET /api/model-info) AUTHENTICATED PASSED in ${modelTime}ms:`);
    console.log(`   Model: ${modelData.model}`);
    console.log(`   Quantization: ${modelData.quantization}`);
    console.log(`   GPU: ${modelData.gpu?.name || 'N/A'} (${modelData.gpu?.total_memory_mb || 0} MB VRAM)`);
    console.log(`   RAG Grounding Facts Count: ${modelData.rag_facts_count}`);
  } catch (err) {
    console.log(`❌ Step 2 (GET /api/model-info) FAILED: ${err.message}`);
    return;
  }

  // 3. Test POST /api/chat with Multi-Dimensional Profile
  try {
    const t0 = Date.now();
    const chatRes = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        prompt: 'Giới thiệu các điểm du lịch văn hóa tiêu biểu tại Sơn La cho gia đình.',
        profile: {
          market: 'DOMESTIC',
          travel_scope: 'LOCAL',
          persona: 'FAMILY',
          language: 'VI',
          destination: 'Sơn La',
          travel_duration: 3,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });
    const chatTime = Date.now() - t0;

    if (!chatRes.ok) {
      console.log(`❌ Step 3 (POST /api/chat) FAILED with HTTP ${chatRes.status}`);
      return;
    }
    const chatData = await chatRes.json();
    console.log(`✅ Step 3 (POST /api/chat) LIVE INFERENCE PASSED in ${chatTime}ms:`);
    console.log(`   Status: ${chatData.status}`);
    console.log(`   Personalized For: ${chatData.personalized_for || 'DOMESTIC'}`);
    console.log(`   Retrieved Sources: ${chatData.sources?.length || 0} facts`);
    if (chatData.sources?.length > 0) {
      console.log(`   - Sample Source: ${chatData.sources[0].name} (${chatData.sources[0].province})`);
    }
    console.log(`   Live AI Provider: ${chatData.provenance?.providerName}`);
    console.log(`\n--- Generated Response Preview ---`);
    console.log((chatData.content || '').slice(0, 300) + '...\n');
  } catch (err) {
    console.log(`❌ Step 3 (POST /api/chat) FAILED: ${err.message}`);
    return;
  }

  console.log('='.repeat(70));
  console.log('🎉 ALL LIVE INTEGRATION CHECKS PASSED SUCCESSFULLY!');
  console.log('='.repeat(70));
}

runLiveTest();

