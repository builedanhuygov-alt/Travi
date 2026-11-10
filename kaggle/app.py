"""
TRAVI AI ASSISTANT — KAGGLE GPU INFERENCE BACKEND (Qwen2-7B-Instruct)
=====================================================================
FastAPI Service with Ollama backend, In-memory Vietnam Tourism RAG,
Token Authentication, Concurrency Semaphore, and Streaming SSE support.

Hardware Target: Kaggle Tesla P100 16GB (or T4 16GB)
Model: Qwen2-7B-Instruct (Q4_0 Quantized GGUF, ~4.5GB VRAM)
"""

import os
import sys
import json
import time
import asyncio
import logging
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

import secrets

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("travi-kaggle-gpu")

# Configuration from environment: NEVER use a predictable hardcoded default
TRAVI_DEMO_API_KEY = os.getenv("TRAVI_DEMO_API_KEY")
if not TRAVI_DEMO_API_KEY:
    TRAVI_DEMO_API_KEY = secrets.token_urlsafe(24)
    logger.info("No pre-shared token provided. Generated cryptographically secure session token.")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "qwen2:7b")
MAX_CONCURRENT_REQUESTS = int(os.getenv("MAX_CONCURRENT_REQUESTS", "2"))
REQUEST_TIMEOUT_SECONDS = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "60.0"))

# Concurrency limiter to protect 16GB P100 VRAM from thrashing
inference_semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

# GPU inspection state
gpu_info: Dict[str, Any] = {
    "detected": False,
    "name": "Unknown",
    "total_memory_mb": 0,
    "cuda_available": False,
}

def verify_gpu_environment():
    """Verify actual CUDA GPU availability. Do not assume GPU was assigned."""
    global gpu_info
    try:
        import torch
        if torch.cuda.is_available():
            gpu_count = torch.cuda.device_count()
            device_name = torch.cuda.get_device_name(0)
            vram_bytes = torch.cuda.get_device_properties(0).total_memory
            vram_mb = int(vram_bytes / (1024 * 1024))
            gpu_info = {
                "detected": True,
                "cuda_available": True,
                "device_count": gpu_count,
                "name": device_name,
                "total_memory_mb": vram_mb,
            }
            logger.info(f"Verified GPU: {device_name} ({vram_mb} MB VRAM)")
        else:
            gpu_info = {
                "detected": False,
                "cuda_available": False,
                "name": "No CUDA device found",
                "total_memory_mb": 0,
            }
            logger.warning("No CUDA GPU detected! Kaggle session is running in CPU mode.")
    except Exception as e:
        logger.error(f"Failed to inspect GPU with PyTorch: {e}")
        gpu_info["error"] = str(e)

# In-memory Tourism RAG Corpus
rag_corpus: List[Dict[str, Any]] = []

def load_embedded_rag_corpus():
    """Loads verified Vietnam POIs and Cultural Assets into memory for grounding."""
    global rag_corpus
    # Embedded fallback corpus with key Son La & Cultural assets
    default_corpus = [
        {
            "id": "son-la-moc-chau",
            "name": "Khu du lịch Quốc gia Mộc Châu",
            "province": "Sơn La",
            "subregion": "Tây Bắc",
            "category": "Khu du lịch quốc gia",
            "description": "Cao nguyên Mộc Châu nổi tiếng với đồi chè trái tim, thung lũng mận Nà Ka, rừng thông bản Áng và thác Dải Yếm. Khí hậu mát mẻ quanh năm.",
            "experiences": ["Ngắm hoa mận", "Hái chè", "Uống sữa tươi Mộc Châu", "Khám phá bản làng Thái"],
            "foods": ["Bê chao Mộc Châu", "Cá suối nướng Pa Pỉnh Tộp", "Thịt trâu gác bếp", "Xôi ngũ sắc"],
            "source": "Sở Văn hóa Thể thao và Du lịch tỉnh Sơn La",
            "coordinate_status": "unverified_field_notes"
        },
        {
            "id": "son-la-hang-a-phu",
            "name": "Điểm du lịch Hang vợ chồng A Phủ",
            "province": "Sơn La",
            "subregion": "Tây Bắc",
            "category": "Điểm du lịch",
            "description": "Nằm tại bản Hồng Ngài, xã Bắc Yên. Hang A Phủ có cảnh quan địa chất độc đáo, gắn liền với tác phẩm văn học Vợ chồng A Phủ của Tô Hoài.",
            "experiences": ["Tham quan hang động", "Tìm hiểu văn hóa dân tộc H'Mông"],
            "foods": ["Thịt trâu sấy", "Rượu ngô Bắc Yên", "Gà đen bản địa"],
            "source": "Sở Văn hóa Thể thao và Du lịch tỉnh Sơn La",
            "coordinate_status": "unverified_field_notes"
        },
        {
            "id": "cultural-trong-dong-ngoc-lu",
            "name": "Trống đồng Ngọc Lũ",
            "province": "Hà Nội (Lưu giữ) / Hà Nam (Phát hiện)",
            "subregion": "Đồng bằng sông Hồng",
            "category": "Bảo vật quốc gia (Hiện vật văn hóa)",
            "description": "Bảo vật quốc gia số 1 của Việt Nam thuộc Văn hóa Đông Sơn, niên đại thế kỷ II-III TCN. Mặt trống khắc họa sao 14 cánh, chim Lạc và cảnh sinh hoạt thời Hùng Vương. Hiện vật được lưu giữ tại Bảo tàng Lịch sử Quốc gia (Số 1 Tràng Tiền, Hà Nội).",
            "experiences": ["Tham quan gian trưng bày Kim khí thời Hùng Vương"],
            "foods": ["Ẩm thực phố cổ Hà Nội"],
            "source": "Bảo tàng Lịch sử Quốc gia & Cục Di sản Văn hóa",
            "coordinate_status": "museum_venue_verified"
        },
        {
            "id": "cultural-xoe-thai",
            "name": "Nghệ thuật Xòe Thái",
            "province": "Sơn La, Yên Bái, Điện Biên, Lai Châu",
            "subregion": "Tây Bắc",
            "category": "Di sản văn hóa phi vật thể đại diện nhân loại (UNESCO)",
            "description": "Điệu múa dân gian truyền thống biểu trưng cho tinh thần cộng đồng, lòng hiếu khách của người Thái Tây Bắc. Gồm các điệu múa khăn, xòe vòng bên bếp lửa bản làng.",
            "experiences": ["Tham gia vòng xòe hoa tại Bản Áng hoặc Bản Vặt", "Giao lưu văn nghệ dân gian"],
            "foods": ["Cơm lam", "Cá nướng Pa Pỉnh Tộp"],
            "source": "UNESCO & Sở VHTT&DL các tỉnh Tây Bắc",
            "coordinate_status": "intangible_cultural_heritage"
        }
    ]
    rag_corpus = default_corpus
    logger.info(f"Loaded {len(rag_corpus)} core grounding facts into RAG retrieval memory.")

def retrieve_rag_context(query: str, top_k: int = 2) -> List[Dict[str, Any]]:
    """Simple semantic token-matching retriever for zero-latency RAG grounding."""
    q_lower = query.lower()
    scored = []
    for item in rag_corpus:
        score = 0
        searchable_text = f"{item['name']} {item['description']} {' '.join(item['experiences'])} {' '.join(item['foods'])} {item['province']} {item['subregion']}".lower()
        for token in q_lower.split():
            if len(token) > 2 and token in searchable_text:
                score += 1
        if item['name'].lower() in q_lower:
            score += 5
        if score > 0:
            scored.append((score, item))
    
    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:top_k]]

# Lifespan: warm up model in Ollama
@asynccontextmanager
async def lifespan(app: FastAPI):
    verify_gpu_environment()
    load_embedded_rag_corpus()
    # Check Ollama connectivity & keep model loaded
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                logger.info(f"Ollama server connected at {OLLAMA_BASE_URL}.")
                # Warm up model with keep_alive: -1
                warmup_payload = {
                    "model": MODEL_NAME,
                    "prompt": "Xin chào",
                    "keep_alive": -1,
                    "stream": False
                }
                logger.info(f"Warming up {MODEL_NAME} with keep_alive: -1...")
                warmup_resp = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=warmup_payload, timeout=60.0)
                if warmup_resp.status_code == 200:
                    logger.info(f"Model {MODEL_NAME} successfully loaded and pinned in VRAM.")
            else:
                logger.warning(f"Ollama responded with status {resp.status_code}")
        except Exception as e:
            logger.error(f"Could not connect to Ollama: {e}. Ensure Ollama is running.")
    yield
    logger.info("FastAPI service shutting down.")

app = FastAPI(
    title="Travi AI Assistant — Kaggle GPU Backend",
    description="Dedicated free GPU runtime serving Qwen2-7B-Instruct with Vietnam Tourism RAG",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
        "https://travi-app-23th10.web.app",
        "https://travi-app-23th10.firebaseapp.com",
        "*"  # Safe for temporary demo tunnel with bearer auth token
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Authentication Dependency
def verify_token(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None)
):
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
    elif x_api_key:
        token = x_api_key.strip()

    if not token or token != TRAVI_DEMO_API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid or missing API authentication token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return token

# Request & Response Schemas
class ChatContext(BaseModel):
    destination: Optional[str] = None
    durationDays: Optional[int] = None
    travelPace: Optional[str] = None
    budgetRange: Optional[str] = None
    travelStyle: Optional[str] = None

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str = Field(..., max_length=1500)

class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000, description="User travel query")
    context: Optional[ChatContext] = None
    history: Optional[List[ChatMessage]] = Field(default=[], description="Multi-turn conversation history")
    stream: Optional[bool] = Field(default=False, description="Enable Server-Sent Events streaming")
    system: Optional[str] = Field(
        default=None,
        description="Optional override for system prompt instructions"
    )

class ModelInfoResponse(BaseModel):
    model: str
    quantization: str
    gpu: Dict[str, Any]
    keep_alive: str
    rag_facts_count: int
    context_window: int
    runtime_expires_note: str

# Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint providing GPU, VRAM and inference service health."""
    ollama_ok = False
    models_available = []
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if res.status_code == 200:
                ollama_ok = True
                models_available = [m.get("name") for m in res.json().get("models", [])]
    except Exception:
        pass

    return {
        "status": "healthy" if ollama_ok else "degraded",
        "service": "travi-kaggle-gpu-inference",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "gpu": gpu_info,
        "ollama": {
            "reachable": ollama_ok,
            "models": models_available,
            "active_model": MODEL_NAME
        },
        "concurrency": {
            "max": MAX_CONCURRENT_REQUESTS,
            "available": inference_semaphore._value
        }
    }

@app.get("/api/model-info", response_model=ModelInfoResponse)
async def model_info(token: str = Depends(verify_token)):
    """Provides model metadata, quantization details and memory footprint."""
    return ModelInfoResponse(
        model=MODEL_NAME,
        quantization="Q4_0 (GGUF 4-bit Quantization)",
        gpu=gpu_info,
        keep_alive="infinite (-1, model persists in VRAM)",
        rag_facts_count=len(rag_corpus),
        context_window=32768,
        runtime_expires_note="Temporary Kaggle runtime. Endpoint will expire when notebook kernel terminates."
    )

@app.post("/api/chat")
async def chat(request: ChatRequest, token: str = Depends(verify_token)):
    """
    Main travel AI inference endpoint with Vietnam Tourism RAG grounding,
    semaphore concurrency limit, timeout handling, and streaming SSE support.
    """
    # 1. Retrieve RAG grounding facts
    retrieved_facts = retrieve_rag_context(request.prompt, top_k=2)
    rag_context_text = ""
    sources_metadata = []

    if retrieved_facts:
        rag_context_text = "### THÔNG TIN TRA CỨU ĐÃ ĐỐI SOÁT (RETRIEVED FACTS):\n"
        for fact in retrieved_facts:
            rag_context_text += (
                f"- Tên: {fact['name']} ({fact['province']})\n"
                f"  Mô tả: {fact['description']}\n"
                f"  Trải nghiệm: {', '.join(fact.get('experiences', []))}\n"
                f"  Ẩm thực: {', '.join(fact.get('foods', []))}\n"
                f"  Nguồn đối soát: {fact['source']}\n"
            )
            sources_metadata.append({
                "name": fact["name"],
                "province": fact["province"],
                "source": fact["source"],
                "coordinate_status": fact.get("coordinate_status", "unverified")
            })

    # 2. Construct System Prompt with Anti-Hallucination Constraints
    system_prompt = (
        "Bạn là Travi AI — Trợ lý chuyên gia du lịch & văn hóa Việt Nam tận tâm.\n"
        "NGUYÊN TẮC TOÀN VẸN DỮ LIỆU & ĐẠO ĐỨC DU LỊCH (BẮT BUỘC TUÂN THỦ):\n"
        "1. CHỈ sử dụng sự thật đã xác minh. TUYỆT ĐỐI KHÔNG tự tạo ra giá vé, giờ mở cửa hoặc tọa độ giả định.\n"
        "2. Phân biệt rõ: Hiện vật văn hóa (Bảo tàng lưu giữ) KHÁC với địa điểm khảo cổ nơi phát hiện; tọa độ hiện vật không phải cổng bảo tàng.\n"
        "3. Nếu thông tin hoặc tọa độ của điểm đến chưa được đối soát thực địa, hãy nhắc nhở du khách liên hệ ban quản lý địa phương trước khi di chuyển.\n"
        "4. Trả lời bằng tiếng Việt lịch sự, truyền cảm, có chiều sâu văn hóa bản địa."
    )

    if rag_context_text:
        system_prompt += f"\n\n{rag_context_text}"

    # 3. Build Ollama messages array
    messages = [{"role": "system", "content": system_prompt}]
    
    # Append multi-turn history if provided
    if request.history:
        for prev in request.history[-6:]:  # Keep last 3 turns
            messages.append({"role": prev.role, "content": prev.content})

    # Append current user prompt
    messages.append({"role": "user", "content": request.prompt})

    # 4. Handle Streaming SSE vs Non-Streaming JSON
    if request.stream:
        return StreamingResponse(
            stream_generator(messages, sources_metadata),
            media_type="text/event-stream"
        )
    else:
        return await non_streaming_generate(messages, sources_metadata)

async def non_streaming_generate(messages: List[Dict[str, str]], sources: List[Dict[str, Any]]):
    """Executes non-streaming completion with concurrency lock and timeout."""
    try:
        async with asyncio.timeout(REQUEST_TIMEOUT_SECONDS):
            async with inference_semaphore:
                async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
                    payload = {
                        "model": MODEL_NAME,
                        "messages": messages,
                        "stream": False,
                        "keep_alive": -1,
                        "options": {
                            "temperature": 0.6,
                            "top_p": 0.9,
                            "num_ctx": 4096
                        }
                    }
                    response = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
                    if response.status_code != 200:
                        raise HTTPException(
                            status_code=502,
                            detail=f"Ollama upstream error: {response.text}"
                        )
                    data = response.json()
                    content = data.get("message", {}).get("content", "")

                    return {
                        "status": "success",
                        "content": content,
                        "reply": content,
                        "sources": sources,
                        "suggestions": [
                            "Tìm hiểu ẩm thực bản địa",
                            "Phương tiện di chuyển đến đây",
                            "Thời điểm lý tưởng nhất trong năm"
                        ],
                        "provenance": {
                            "providerName": f"Kaggle GPU Qwen2-7B ({gpu_info.get('name', 'P100')})",
                            "isLiveAi": True,
                            "modeDescription": "Ollama Serverless GPU Container via Secure Tunnel",
                            "vramAllocatedMB": gpu_info.get("total_memory_mb", 16280)
                        }
                    }
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail=f"Inference timed out after {REQUEST_TIMEOUT_SECONDS}s."
        )
    except Exception as e:
        logger.error(f"Inference execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def stream_generator(messages: List[Dict[str, str]], sources: List[Dict[str, Any]]):
    """Yields Server-Sent Events (SSE) token chunks as generated by Ollama."""
    try:
        async with inference_semaphore:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
                payload = {
                    "model": MODEL_NAME,
                    "messages": messages,
                    "stream": True,
                    "keep_alive": -1,
                    "options": {
                        "temperature": 0.6,
                        "top_p": 0.9,
                        "num_ctx": 4096
                    }
                }
                async with client.stream("POST", f"{OLLAMA_BASE_URL}/api/chat", json=payload) as resp:
                    if resp.status_code != 200:
                        yield f"data: {json.dumps({'error': 'Upstream Ollama streaming failed'})}\n\n"
                        return

                    async for line in resp.aiter_lines():
                        if not line:
                            continue
                        try:
                            chunk = json.loads(line)
                            token = chunk.get("message", {}).get("content", "")
                            done = chunk.get("done", False)
                            event_data = {
                                "chunk": token,
                                "done": done
                            }
                            if done:
                                event_data["sources"] = sources
                                event_data["provenance"] = {
                                    "providerName": f"Kaggle GPU Qwen2-7B ({gpu_info.get('name', 'P100')})",
                                    "isLiveAi": True
                                }
                            yield f"data: {json.dumps(event_data)}\n\n"
                            if done:
                                break
                        except Exception:
                            continue
    except Exception as err:
        yield f"data: {json.dumps({'error': str(err)})}\n\n"

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    logger.info(f"Starting Travi GPU Backend on 127.0.0.1:{port}...")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")

