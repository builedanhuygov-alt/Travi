# TRAVI — ON-DEMAND GOOGLE COLAB QWEN2 AI SERVER SETUP GUIDE

This guide provides end-to-end instructions for deploying and connecting the **Travi Vietnam Travel Assistant** to a free Google Colab GPU runtime (NVIDIA T4 15GB VRAM) running **Qwen2-7B-Instruct** with Ollama and Vietnam Tourism RAG.

---

## 1. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      GOOGLE COLAB GPU RUNTIME                          │
│                        (Tesla T4 15GB VRAM)                            │
│                                                                        │
│  ┌────────────────────────┐         ┌───────────────────────────────┐  │
│  │     Ollama Server      │  HTTP   │       FastAPI Service         │  │
│  │ (127.0.0.1:11434 local)│<------->│       (127.0.0.1:8000)        │  │
│  │  Qwen2-7B-Instruct     │         │ - Bearer Token Authentication │  │
│  │  Q4_0 (~4.5GB VRAM)    │         │ - Adaptive Customer Profiles  │  │
│  │  keep_alive: -1        │         │ - Concurrency Semaphore (2)   │  │
│  │  NO external port      │         │ - Vietnam RAG + Provenance    │  │
│  └────────────────────────┘         │ - /health, /api/model-info    │  │
│                                     │ - POST /api/chat              │  │
│                                     └──────────────▲────────────────┘  │
│                                                    │                   │
│                                     ┌──────────────┴────────────────┐  │
│                                     │     Cloudflare Tunnel         │  │
│                                     │  (pycloudflared - temporary)  │  │
│                                     └──────────────▲────────────────┘  │
└────────────────────────────────────────────────────┼───────────────────┘
                                                     │ HTTPS (Encrypted)
                                                     │
                             ┌───────────────────────┴───────────────────────┐
                             │                                               │
                             ▼                                               ▼
            ┌──────────────────────────────────┐            ┌─────────────────────────────────┐
            │   Travi Cloud Functions Backend  │            │   Travi Local Dev Proxy / Vite  │
            │        (functions/index.js)      │            │      (server/devAiProxy.js)     │
            │   COLAB_AI_BASE_URL = <tunnel>   │            │   COLAB_AI_BASE_URL = <tunnel>  │
            │   COLAB_AI_API_TOKEN = <secret>  │            │   COLAB_AI_API_TOKEN = <secret> │
            │   COLAB_AI_ENABLED = true        │            │   COLAB_AI_ENABLED = true       │
            └────────────────▲─────────────────┘            └────────────────▲────────────────┘
                             │                                               │
                             └───────────────────────┬───────────────────────┘
                                                     │ Local /api/ai/chat
                                                     ▼
                                    ┌─────────────────────────────────┐
                                    │      Travi Frontend (React)     │
                                    │    - AI Status Indicator        │
                                    │      (Online / Offline / Connecting)
                                    │    - Adaptive Customer Profiles │
                                    │    - Zero Client-side Secrets   │
                                    └─────────────────────────────────┘
```

---

## 2. Hardware Target & VRAM Footprint

| Specification | Google Colab Allocation | Actual Model Usage | Headroom Remaining |
| :--- | :--- | :--- | :--- |
| **GPU Model** | NVIDIA Tesla T4 | Active & Verified via PyTorch | — |
| **Total VRAM** | 15,360 MB (~15 GB) | — | — |
| **Model Weight** | `qwen2:7b` (Q4_0 Quantized GGUF) | **~4,480 MB (~4.4 GB)** | **~10.8 GB** |
| **KV-Cache (32k context)** | FP16 context cache | **~2,100 MB** | **~8.7 GB** |
| **PyTorch / CUDA Base** | Context & Buffers | **~450 MB** | **~8.2 GB** |
| **Concurrency Ceiling** | Max 2 simultaneous inferences | Protected by `asyncio.Semaphore(2)` | Zero OOM risk |

---

## 3. Starting the Colab AI Server

### Step 3.1: Open Notebook on Google Colab
1. Navigate to [Google Colab](https://colab.research.google.com).
2. Click **Upload** and upload `colab/travi_colab_qwen2.ipynb`.
3. In the Colab menu, select **Runtime** → **Change runtime type**.
4. Set **Hardware accelerator** to **T4 GPU** and click **Save**.

### Step 3.2: Run Notebook Cells
Execute Cells 1 through 6 sequentially:
1. **Cell 1 (Hardware Pre-check):** Verifies that CUDA T4 is active with ~15GB VRAM.
2. **Cell 2 (Dependencies):** Installs FastAPI, Uvicorn, httpx, pycloudflared, and Ollama.
3. **Cell 3 (Ollama Daemon):** Starts Ollama on `127.0.0.1:11434` in the background.
4. **Cell 4 (Model Warm-up):** Pulls `qwen2:7b` and pins it to VRAM with `keep_alive: -1`.
5. **Cell 5 (Generate app.py):** Writes the FastAPI service with RAG grounding and Adaptive Customer Profile logic.
6. **Cell 6 (Start Server & Tunnel):** Starts Uvicorn and establishes a temporary Cloudflare HTTPS tunnel.

Output from Cell 6 will print:
```
===========================================================================
🚀 TRAVI GOOGLE COLAB GPU INFERENCE BACKEND IS ONLINE!
Public HTTPS Endpoint: https://random-subdomain.trycloudflare.com
API Authentication Token: travi-colab-qwen2-secret-2026
Health Check URL: https://random-subdomain.trycloudflare.com/health
Chat Endpoint: https://random-subdomain.trycloudflare.com/api/chat
===========================================================================
```

---

## 4. Connecting Travi to the Colab Server

### In Local Development (`.env` file)
Add or update the following variables in your `.env` file (server-side only):
```env
COLAB_AI_BASE_URL="https://your-temporary-subdomain.trycloudflare.com"
COLAB_AI_API_TOKEN="travi-colab-qwen2-secret-2026"
COLAB_AI_ENABLED=true
```

Then start the Travi development environment:
```bash
npm run dev
# The proxy server (server/devAiProxy.js) reads these variables automatically.
```

### In Production (Firebase Functions)
Set the secret parameters in Firebase environment:
```bash
firebase functions:secrets:set COLAB_AI_BASE_URL
firebase functions:secrets:set COLAB_AI_API_TOKEN
firebase functions:secrets:set COLAB_AI_ENABLED
```

---

## 5. Stopping the Server

When finished with the demo session:
1. In Google Colab, select **Runtime** → **Disconnect and delete runtime**.
2. The temporary tunnel immediately terminates.
3. Travi automatically detects that the endpoint is unreachable and switches cleanly to **AI Offline** (Verified Deterministic Expert Engine) with zero crashes or broken UI flows.

