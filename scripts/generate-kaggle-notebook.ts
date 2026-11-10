import fs from 'fs';
import path from 'path';

const appPyPath = path.resolve('kaggle', 'app.py');
const appPyContent = fs.readFileSync(appPyPath, 'utf8');

const notebook = {
  cells: [
    {
      cell_type: 'markdown',
      metadata: {},
      source: [
        '# TRAVI — FREE GPU DEMO DEPLOYMENT\n',
        '### Qwen2-7B-Instruct on Kaggle Tesla P100 16GB with Ollama & Vietnam Tourism RAG\n',
        '\n',
        'This notebook sets up a free, high-performance, temporary inference backend for the Travi Vietnam Travel platform.\n',
        '- **Hardware:** Tesla P100 16GB (or T4 16GB)\n',
        '- **LLM:** `qwen2:7b` (Qwen2-7B-Instruct Q4_0, ~4.5 GB VRAM)\n',
        '- **Inference Engine:** Ollama with persistent VRAM pinning (`keep_alive: -1`)\n',
        '- **Backend:** FastAPI with Concurrency Semaphore (2), Token Auth, and Streaming SSE\n',
        '- **Tunnel:** Cloudflare Tunnel (`pycloudflared`) providing an authenticated HTTPS endpoint.\n'
      ]
    },
    {
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        '# STEP 1: VERIFY HARDWARE & GPU AVAILABILITY\n',
        '# Rule: Verify actual GPU availability before loading the model. Do not assume a GPU was assigned.\n',
        'import torch\n',
        'import subprocess\n',
        'import sys\n',
        '\n',
        'print("=== CHECKING CUDA GPU RUNTIME ===")\n',
        'if not torch.cuda.is_available():\n',
        '    raise SystemError("FATAL: No CUDA GPU detected. Please go to Kaggle notebook Settings -> Accelerator -> GPU P100 or T4 x2.")\n',
        '\n',
        'gpu_name = torch.cuda.get_device_name(0)\n',
        'vram_mb = int(torch.cuda.get_device_properties(0).total_memory / (1024 * 1024))\n',
        'print(f"SUCCESS: Detected {gpu_name} with {vram_mb} MB VRAM.")\n',
        'subprocess.run(["nvidia-smi"])\n'
      ]
    },
    {
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        '# STEP 2: INSTALL DEPENDENCIES & OLLAMA SERVER\n',
        '!pip install -q fastapi uvicorn httpx pydantic pycloudflared nest-asyncio\n',
        '\n',
        '# Install official Ollama binary\n',
        '!curl -fsSL https://ollama.com/install.sh | sh\n'
      ]
    },
    {
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        '# STEP 3: START OLLAMA DAEMON IN BACKGROUND\n',
        '# Note: Ollama binds strictly to 127.0.0.1:11434 and is NEVER exposed publicly\n',
        'import subprocess\n',
        'import time\n',
        'import httpx\n',
        '\n',
        'print("Starting Ollama daemon on 127.0.0.1:11434...")\n',
        'ollama_proc = subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)\n',
        '\n',
        '# Wait for Ollama to become ready\n',
        'for attempt in range(15):\n',
        '    try:\n',
        '        resp = httpx.get("http://127.0.0.1:11434/api/tags", timeout=2.0)\n',
        '        if resp.status_code == 200:\n',
        '            print("Ollama daemon is healthy and ready.")\n',
        '            break\n',
        '    except Exception:\n',
        '        pass\n',
        '    time.sleep(1)\n',
        'else:\n',
        '    raise RuntimeError("Ollama failed to start in time.")\n'
      ]
    },
    {
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        '# STEP 4: PULL QWEN2-7B-INSTRUCT & PIN TO VRAM\n',
        'print("Pulling qwen2:7b (Qwen2-7B-Instruct Q4_0 quantization)...")\n',
        'subprocess.run(["ollama", "pull", "qwen2:7b"], check=True)\n',
        'print("Model pulled successfully.")\n',
        '\n',
        '# Pre-load into GPU VRAM with infinite keep_alive\n',
        'warmup_req = {\n',
        '    "model": "qwen2:7b",\n',
        '    "prompt": "Xin chào, sẵn sàng phục vụ du lịch Việt Nam.",\n',
        '    "keep_alive": -1,\n',
        '    "stream": False\n',
        '}\n',
        'resp = httpx.post("http://127.0.0.1:11434/api/generate", json=warmup_req, timeout=60.0)\n',
        'print("Model loaded into VRAM. Response:", resp.json().get("response", "").strip())\n',
        '!nvidia-smi\n'
      ]
    },
    {
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        '# STEP 5: SAVE FASTAPI BACKEND APPLICATION SCRIPT\n',
        'with open("app.py", "w", encoding="utf-8") as f:\n',
        '    f.write(' + JSON.stringify(appPyContent) + ')\n',
        'print("Saved app.py with RAG Grounding and Token Security.")\n'
      ]
    },
    {
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        '# STEP 6: START FASTAPI & LAUNCH SECURE CLOUDFLARE TUNNEL\n',
        'import threading\n',
        'import uvicorn\n',
        'from pycloudflared import try_cloudflare\n',
        '\n',
        '# Start Uvicorn in background thread\n',
        'def run_server():\n',
        '    uvicorn.run("app:app", host="127.0.0.1", port=8000, log_level="warning")\n',
        '\n',
        't = threading.Thread(target=run_server, daemon=True)\n',
        't.start()\n',
        'time.sleep(3)\n',
        '\n',
        '# Establish temporary HTTPS tunnel\n',
        'tunnel = try_cloudflare(port=8000)\n',
        'public_url = tunnel.tunnel.strip()\n',
        '\n',
        'print("=" * 70)\n',
        'print("TRAVI KAGGLE GPU INFERENCE BACKEND IS ONLINE!")\n',
        'print(f"Public HTTPS Endpoint: {public_url}")\n',
        'print(f"API Authentication Token: travi-gpu-demo-secret-2026")\n',
        'print(f"Health Check URL: {public_url}/health")\n',
        'print(f"Chat Endpoint: {public_url}/api/chat")\n',
        'print("NOTE: This endpoint is temporary and active as long as this Kaggle kernel runs.")\n',
        'print("=" * 70)\n'
      ]
    },
    {
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        '# STEP 7: COMPREHENSIVE AUTOMATED SELF-TESTS\n',
        'import httpx\n',
        'headers = {"Authorization": "Bearer travi-gpu-demo-secret-2026"}\n',
        'client = httpx.Client(base_url="http://127.0.0.1:8000", headers=headers, timeout=30.0)\n',
        '\n',
        '# Test 1: Health check\n',
        'h = client.get("/health").json()\n',
        'print("Test 1 - Health:", h["status"], "GPU:", h["gpu"]["name"])\n',
        'assert h["status"] == "healthy"\n',
        '\n',
        '# Test 2: Auth rejection\n',
        'unauth = httpx.get("http://127.0.0.1:8000/api/model-info")\n',
        'print("Test 2 - Auth Guard Status:", unauth.status_code)\n',
        'assert unauth.status_code == 401\n',
        '\n',
        '# Test 3: Model info with auth\n',
        'info = client.get("/api/model-info").json()\n',
        'print("Test 3 - Model:", info["model"], "Quantization:", info["quantization"])\n',
        '\n',
        '# Test 4: Vietnamese Conversation & RAG Retrieval\n',
        'chat_req = {\n',
        '    "prompt": "Giới thiệu về Trống đồng Ngọc Lũ và bảo tàng lưu giữ hiện vật này.",\n',
        '    "context": {"destination": "ha-noi"},\n',
        '    "stream": False\n',
        '}\n',
        'ans = client.post("/api/chat", json=chat_req).json()\n',
        'print("Test 4 - RAG Grounded Answer preview:")\n',
        'print(ans["content"][:250] + "...")\n',
        'print("Retrieved Sources:", ans.get("sources"))\n',
        'assert len(ans.get("sources", [])) > 0\n',
        '\n',
        'print("\\nALL BACKEND TESTS PASSED!")\n'
      ]
    }
  ],
  metadata: {
    kernelspec: {
      display_name: 'Python 3',
      language: 'python',
      name: 'python3'
    },
    language_info: {
      name: 'python',
      version: '3.10.12'
    }
  },
  nbformat: 4,
  nbformat_minor: 5
};

fs.writeFileSync(path.resolve('kaggle', 'travi_gpu_demo.ipynb'), JSON.stringify(notebook, null, 2), 'utf8');
console.log('Generated kaggle/travi_gpu_demo.ipynb successfully.');

