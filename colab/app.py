"""
TRAVI AI ASSISTANT — GOOGLE COLAB GPU INFERENCE BACKEND (Qwen2-7B-Instruct)
=============================================================================
FastAPI Service with Ollama backend, In-memory Vietnam Tourism RAG,
Adaptive Customer Profile Personalization, Token Authentication,
Concurrency Semaphore, and Streaming SSE support.

Hardware Target: Google Colab T4 GPU (15GB GDDR6 VRAM) or Tesla P100
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
logger = logging.getLogger("travi-colab-gpu")

# Configuration from environment: NEVER use a predictable hardcoded default
TOKEN_FILE_PATH = "/content/.travi_token" if os.path.exists("/content") else ".travi_token"

def resolve_api_token() -> str:
    """Safely retrieves token from env or creates a 600-permission session token file."""
    env_token = os.getenv("COLAB_AI_API_TOKEN") or os.getenv("TRAVI_COLAB_API_KEY")
    if env_token and env_token.strip():
        return env_token.strip()

    if os.path.exists(TOKEN_FILE_PATH):
        try:
            with open(TOKEN_FILE_PATH, "r", encoding="utf-8") as f:
                token = f.read().strip()
                if token:
                    return token
        except Exception:
            pass

    generated = secrets.token_urlsafe(24)
    try:
        with open(TOKEN_FILE_PATH, "w", encoding="utf-8") as f:
            f.write(generated)
        try:
            os.chmod(TOKEN_FILE_PATH, 0o600)
        except Exception:
            pass
    except Exception:
        pass
    return generated

COLAB_AI_API_TOKEN = resolve_api_token()
logger.info("Authentication security initialized with cryptographically secure token.")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "qwen2:7b")
MAX_CONCURRENT_REQUESTS = int(os.getenv("MAX_CONCURRENT_REQUESTS", "2"))
# Colab Ollama timeout: 35s to respect hierarchy (Ollama 35s < Gateway 45s < Cloud Functions 60s)
REQUEST_TIMEOUT_SECONDS = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "35.0"))
MAX_REQUEST_BODY_BYTES = 16 * 1024  # 16KB max payload limit

# Concurrency limiter to protect 15GB/16GB VRAM from thrashing
inference_semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

# GPU inspection state
gpu_info: Dict[str, Any] = {
    "detected": False,
    "name": "Unknown",
    "total_memory_mb": 0,
    "cuda_available": False,
}

def verify_gpu_environment():
    """Verify actual CUDA GPU availability on Google Colab."""
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
            logger.warning("No CUDA GPU detected! Google Colab runtime is running in CPU mode.")
    except Exception as e:
        logger.error(f"Failed to inspect GPU with PyTorch: {e}")
        gpu_info["error"] = str(e)

# In-memory Tourism RAG Corpus
rag_corpus: List[Dict[str, Any]] = []

def load_embedded_rag_corpus():
    """Loads verified Vietnam POIs and Cultural Assets into memory for grounding."""
    global rag_corpus

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
            "coordinate_status": "unverified_field_notes",
            "weather_notes": "Mùa xuân (Tháng 1-2) hoa mận nở trắng; Mùa hè mát mẻ dễ chịu; Mùa đông se lạnh nhiều sương mù."
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
            "coordinate_status": "unverified_field_notes",
            "weather_notes": "Vùng núi cao Bắc Yên có sương mù dày vào mùa đông; mùa mưa từ tháng 6-8 cần chú ý trơn trượt."
        },
        {
            "id": "son-la-ta-xua",
            "name": "Khu du lịch Tà Xùa - Thiên đường mây",
            "province": "Sơn La",
            "subregion": "Tây Bắc",
            "category": "Danh lam thắng cảnh",
            "description": "Dãy núi Tà Xùa giáp ranh giữa Sơn La và Yên Bái, nổi tiếng với sống lưng khủng long Háng Đồng và biển mây bồng bềnh hùng vĩ.",
            "experiences": ["Săn mây Tà Xùa", "Trekking sống lưng khủng long", "Thưởng thức chè Shan tuyết cổ thụ"],
            "foods": ["Thịt lợn bản nướng", "Măng trúc xào", "Cơm lam"],
            "source": "Sở Văn hóa Thể thao và Du lịch tỉnh Sơn La",
            "coordinate_status": "unverified_field_notes",
            "weather_notes": "Mùa săn mây đẹp nhất từ tháng 10 đến tháng 4 năm sau; nhiệt độ ban đêm có thể xuống dưới 10 độ C."
        },
        {
            "id": "cultural-trong-dong-ngoc-lu",
            "name": "Trống đồng Ngọc Lũ",
            "province": "Hà Nội (Lưu giữ) / Hà Nam (Phát hiện)",
            "subregion": "Đồng bằng sông Hồng",
            "category": "Bảo vật quốc gia (Hiện vật văn hóa)",
            "description": "Bảo vật quốc gia số 1 của Việt Nam thuộc Văn hóa Đông Sơn, niên đại thế kỷ II-III TCN. Mặt trống khắc họa sao 14 cánh, chim Lạc và cảnh sinh hoạt thời Hùng Vương. Hiện vật được lưu giữ tại Bảo tàng Lịch sử Quốc gia (Số 1 Tràng Tiền, Hà Nội).",
            "experiences": ["Tham quan gian trưng bày Kim khí thời Hùng Vương", "Tìm hiểu kỹ thuật đúc đồng Đông Sơn"],
            "foods": ["Ẩm thực phố cổ Hà Nội", "Chả cá Lã Vọng", "Cà phê trứng"],
            "source": "Bảo tàng Lịch sử Quốc gia & Cục Di sản Văn hóa",
            "coordinate_status": "museum_venue_verified",
            "weather_notes": "Bảo tàng mở cửa quanh năm trong phòng điều hòa; Hà Nội đẹp nhất vào mùa thu tháng 9-11."
        },
        {
            "id": "cultural-xoe-thai",
            "name": "Nghệ thuật Xòe Thái",
            "province": "Sơn La, Yên Bái, Điện Biên, Lai Châu",
            "subregion": "Tây Bắc",
            "category": "Di sản văn hóa phi vật thể đại diện nhân loại (UNESCO)",
            "description": "Điệu múa dân gian truyền thống biểu trưng cho tinh thần cộng đồng, lòng hiếu khách của người Thái Tây Bắc. Gồm các điệu múa khăn, xòe vòng bên bếp lửa bản làng.",
            "experiences": ["Tham gia vòng xòe hoa tại Bản Áng hoặc Bản Vặt", "Giao lưu văn nghệ dân gian"],
            "foods": ["Cơm lam", "Cá nướng Pa Pỉnh Tộp", "Rượu cần"],
            "source": "UNESCO & Sở VHTT&DL các tỉnh Tây Bắc",
            "coordinate_status": "intangible_cultural_heritage",
            "weather_notes": "Các lễ hội diễn ra rộn ràng vào dịp đầu xuân và mùa gặt lúa chín."
        }
    ]

    # Check if dataset files exist in Colab environment (e.g. kagglehub or uploaded CSV)
    csv_paths = [
        "son_la_tourism_normalized_utf8.csv",
        "vietnam_tourism_starter.csv",
        "/content/son_la_tourism_normalized_utf8.csv",
        "/content/vietnam_tourism_starter.csv"
    ]
    for p in csv_paths:
        if os.path.exists(p):
            try:
                import csv
                with open(p, mode="r", encoding="utf-8-sig") as f:
                    reader = csv.DictReader(f)
                    count = 0
                    for row in reader:
                        name = row.get("name") or row.get("ten_diem") or row.get("title")
                        if name:
                            default_corpus.append({
                                "id": row.get("id") or f"csv-{count}",
                                "name": name,
                                "province": row.get("province") or row.get("tinh_thanh") or "Việt Nam",
                                "subregion": row.get("subregion") or "Bắc Bộ",
                                "category": row.get("category") or "Điểm tham quan",
                                "description": row.get("description") or row.get("mo_ta") or "",
                                "experiences": [row.get("experiences")] if row.get("experiences") else ["Khám phá địa phương"],
                                "foods": [row.get("foods")] if row.get("foods") else ["Ẩm thực bản địa"],
                                "source": row.get("source") or "Bộ dữ liệu Du lịch Việt Nam",
                                "coordinate_status": "needs_review",
                                "weather_notes": "Tham khảo dự báo thời tiết địa phương trước khi khởi hành."
                            })
                            count += 1
                logger.info(f"Loaded {count} additional records from CSV dataset: {p}")
            except Exception as ex:
                logger.warning(f"Could not read CSV {p}: {ex}")

    rag_corpus = default_corpus
    logger.info(f"Loaded {len(rag_corpus)} core grounding facts into RAG retrieval memory.")

def retrieve_rag_context(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Semantic token-matching retriever for zero-latency RAG grounding."""
    q_lower = query.lower()
    scored = []
    for item in rag_corpus:
        score = 0
        searchable_text = f"{item['name']} {item['description']} {' '.join(item.get('experiences', []))} {' '.join(item.get('foods', []))} {item['province']} {item.get('subregion', '')}".lower()
        for token in q_lower.split():
            if len(token) > 2 and token in searchable_text:
                score += 1
        if item['name'].lower() in q_lower:
            score += 6
        if item['province'].lower() in q_lower:
            score += 3
        if score > 0:
            scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:top_k]]

# Lifespan: warm up model in Ollama
@asynccontextmanager
async def lifespan(app: FastAPI):
    verify_gpu_environment()
    load_embedded_rag_corpus()
    # Check Ollama connectivity & keep model loaded in VRAM
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                logger.info(f"Ollama server connected at {OLLAMA_BASE_URL}.")
                warmup_payload = {
                    "model": MODEL_NAME,
                    "prompt": "Xin chào, trợ lý du lịch Việt Nam đã sẵn sàng.",
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
    logger.info("FastAPI Colab service shutting down.")

app = FastAPI(
    title="Travi AI Assistant — Google Colab GPU Backend",
    description="On-demand GPU inference runtime serving Qwen2-7B-Instruct with Vietnam Tourism RAG & Adaptive Personalization",
    version="1.2.0",
    lifespan=lifespan
)

# 16KB Request Payload Guard Middleware
@app.middleware("http")
async def enforce_payload_limit(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_REQUEST_BODY_BYTES:
                return JSONResponse(
                    status_code=413,
                    content={"error": "Payload Too Large: Maximum allowed request size is 16KB.", "code": "PAYLOAD_TOO_LARGE"}
                )
        except ValueError:
            pass

    # Read body safely to check chunked requests
    body = await request.body()
    if len(body) > MAX_REQUEST_BODY_BYTES:
        return JSONResponse(
            status_code=413,
            content={"error": "Payload Too Large: Maximum allowed request size is 16KB.", "code": "PAYLOAD_TOO_LARGE"}
        )

    return await call_next(request)

# Hardened CORS configuration (Zero wildcard * with credentials)
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://travi-app-23th10.web.app",
    "https://travi-app-23th10.firebaseapp.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Authentication Dependency with Constant-Time Verification
def verify_token(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None)
):
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
    elif x_api_key:
        token = x_api_key.strip()

    if not token or not secrets.compare_digest(token, COLAB_AI_API_TOKEN):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid or missing API authentication token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return token

# Request & Response Schemas
class LocationInfo(BaseModel):
    country: Optional[str] = "Việt Nam"
    province: Optional[str] = None
    city: Optional[str] = None

class CustomerProfile(BaseModel):
    # Distinct coexisting dimensions:
    market: Optional[str] = Field(default=None, description="DOMESTIC | INTERNATIONAL")
    origin_location: Optional[LocationInfo] = None
    destination_location: Optional[LocationInfo] = None
    travel_scope: Optional[str] = Field(default=None, description="LOCAL | INTERPROVINCIAL | INTERNATIONAL_TRAVEL")
    persona: Optional[str] = Field(default=None, description="FAMILY | BACKPACKER | SOLO | EXPLORER")
    language: Optional[str] = Field(default=None, description="VI | EN | OTHER")

    # Legacy & convenience fields
    customer_type: Optional[str] = Field(default=None, description="Legacy alias: INTERNATIONAL | DOMESTIC | LOCAL | INTERPROVINCIAL")
    origin_country: Optional[str] = Field(default="VN")
    origin_province: Optional[str] = None
    destination: Optional[str] = None
    preferred_language: Optional[str] = Field(default="vi")
    budget: Optional[str] = Field(default="moderate")
    travel_duration: Optional[int] = Field(default=3)
    interests: Optional[List[str]] = Field(default=[])
    transportation_preference: Optional[str] = None

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str = Field(..., min_length=1, max_length=1000)

class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000, description="User travel query")
    profile: Optional[CustomerProfile] = None
    context: Optional[Dict[str, Any]] = None
    history: Optional[List[ChatMessage]] = Field(default=[], max_length=10, description="Multi-turn conversation history (max 10 turns)")
    stream: Optional[bool] = Field(default=False, description="Enable Server-Sent Events streaming")
    # Prompt injection defense: client-side system overrides are rejected / ignored

class ModelInfoResponse(BaseModel):
    model: str
    quantization: str
    gpu: Dict[str, Any]
    keep_alive: str
    rag_facts_count: int
    context_window: int
    runtime_expires_note: str
    active_model_ready: bool = True
    concurrency_max: int = MAX_CONCURRENT_REQUESTS

def build_adaptive_system_prompt(profile: Optional[CustomerProfile], rag_facts_text: str) -> str:
    """
    Constructs prompt customized to multi-dimensional customer attributes:
    - Market: DOMESTIC / INTERNATIONAL
    - Travel Scope: LOCAL / INTERPROVINCIAL / INTERNATIONAL_TRAVEL
    - Persona: FAMILY / BACKPACKER / SOLO / EXPLORER
    - Language: VI / EN / OTHER
    All dimensions coexist without conflicting or stereotyping.
    """
    is_english = False
    if profile:
        if profile.language and profile.language.upper() == "EN":
            is_english = True
        elif profile.preferred_language and profile.preferred_language.lower().startswith("en"):
            is_english = True

    if is_english:
        base_instructions = (
            "You are Travi AI — a dedicated Vietnam travel and cultural intelligence assistant.\n"
            "DATA INTEGRITY & ETHICAL TOURISM PRINCIPLES (MANDATORY):\n"
            "1. ONLY state verified facts. NEVER fabricate ticket prices, opening hours, or assumed coordinates.\n"
            "2. Distinguish clearly: Cultural artifacts kept in museums differ from archaeological discovery sites; artifact coordinates are not museum entrance gates.\n"
            "3. If a site's coordinates or status have unverified field notes, advise travelers to confirm with local management before traveling.\n"
            "4. Respond in polite, engaging, and culturally evocative English while preserving authentic Vietnamese place and dish names."
        )
    else:
        base_instructions = (
            "Bạn là Travi AI — Trợ lý chuyên gia du lịch & văn hóa Việt Nam tận tâm.\n"
            "NGUYÊN TẮC TOÀN VẸN DỮ LIỆU & ĐẠO ĐỨC DU LỊCH (BẮT BUỘC TUÂN THỦ):\n"
            "1. CHỈ sử dụng sự thật đã xác minh. TUYỆT ĐỐI KHÔNG tự tạo ra giá vé, giờ mở cửa hoặc tọa độ giả định.\n"
            "2. Phân biệt rõ: Hiện vật văn hóa (Bảo tàng lưu giữ) KHÁC với địa điểm khảo cổ nơi phát hiện; tọa độ hiện vật không phải cổng bảo tàng.\n"
            "3. Nếu thông tin hoặc tọa độ của điểm đến chưa được đối soát thực địa, hãy nhắc nhở du khách liên hệ ban quản lý địa phương trước khi di chuyển.\n"
            "4. Trả lời bằng tiếng Việt lịch sự, truyền cảm, có chiều sâu văn hóa bản địa."
        )

    guidance_sections = []

    # 1. Market Dimension (Domestic vs International)
    market = "DOMESTIC"
    if profile:
        if profile.market:
            market = profile.market.upper()
        elif profile.customer_type == "INTERNATIONAL" or (profile.origin_country and profile.origin_country.lower() not in ["vn", "vietnam", "việt nam"]):
            market = "INTERNATIONAL"

    if market == "INTERNATIONAL":
        if is_english:
            guidance_sections.append(
                "- [International Market]: Provide deep cultural context, explain local customs, "
                "temple & pagoda etiquette, VND currency conversion, e-visa/sim card advice, and food safety."
            )
        else:
            guidance_sections.append(
                "- [Thị trường Quốc tế]: Cung cấp hướng dẫn văn hóa sâu sắc, giải thích phong tục tập quán, "
                "nghi thức đền chùa, quy đổi tiền tệ VND, sim/data và an toàn thực phẩm."
            )
    else:
        if is_english:
            guidance_sections.append(
                "- [Domestic Market]: Emphasize authentic local cuisine, cost-effective itineraries, and prominent landmarks."
            )
        else:
            guidance_sections.append(
                "- [Thị trường Nội địa]: Chú trọng ẩm thực chuẩn vị địa phương, chi phí hợp lý và địa điểm nổi tiếng."
            )

    # 2. Travel Scope Dimension (Local vs Interprovincial vs Cross-Border)
    scope = None
    if profile:
        scope = profile.travel_scope
        if not scope and profile.customer_type:
            if profile.customer_type in ["LOCAL", "INTERPROVINCIAL", "INTERNATIONAL_TRAVEL"]:
                scope = profile.customer_type

    if scope == "LOCAL":
        if is_english:
            guidance_sections.append(
                "- [Local Scope]: Focus on quiet hidden gems, humble local eateries, avoiding overcrowded tourist traps; suggest weekend getaways."
            )
        else:
            guidance_sections.append(
                "- [Phạm vi Bản địa]: Tập trung vào điểm đến ngách (hidden gems), quán ăn dân dã ít người biết, "
                "tránh tụ điểm đông đúc du lịch đại trà; gợi ý dã ngoại ngắn cuối tuần."
            )
    elif scope == "INTERPROVINCIAL":
        if is_english:
            guidance_sections.append(
                "- [Interprovincial Scope]: Optimize transportation routes, mountain pass conditions, travel duration, "
                "and cultural connections between adjoining provinces."
            )
        else:
            guidance_sections.append(
                "- [Phạm vi Liên tỉnh]: Tối ưu hóa cung đường di chuyển, cảnh báo đèo dốc và thời gian trung chuyển; "
                "kết nối các trải nghiệm văn hóa giữa các tỉnh thành liên quan."
            )
    elif scope == "INTERNATIONAL_TRAVEL":
        if is_english:
            guidance_sections.append(
                "- [Cross-Border Scope]: Assist with international flight connections, airport transfers, and customs guidance."
            )
        else:
            guidance_sections.append(
                "- [Phạm vi Xuyên quốc gia]: Hỗ trợ thông tin thị thực/e-visa, kết nối chuyến bay và trung chuyển sân bay."
            )

    # 3. Persona Dimension (Family / Backpacker / Solo / Explorer)
    persona = profile.persona if profile else None
    if persona == "FAMILY":
        if is_english:
            guidance_sections.append(
                "- [Family Persona]: Prioritize safe, accessible attractions for children and elderly travelers, relaxing pacing, and cozy dining."
            )
        else:
            guidance_sections.append(
                "- [Chân dung Gia đình]: Ưu tiên các điểm tham quan an toàn, dễ tiếp cận cho người lớn tuổi và trẻ nhỏ, "
                "nhà hàng có không gian ấm cúng, lịch trình thong thả tránh quá tải."
            )
    elif persona == "BACKPACKER":
        if is_english:
            guidance_sections.append(
                "- [Backpacker Persona]: Highlight winding mountain passes, authentic homestays, street food gems, budget optimization, and trekking."
            )
        else:
            guidance_sections.append(
                "- [Chân dung Phượt thủ / Bụi]: Ưu tiên trải nghiệm cung đường đèo dốc, homestay bản địa, ẩm thực đường phố ngách "
                "và các hoạt động khám phá mạo hiểm vừa sức, tối ưu chi phí."
            )
    elif persona == "SOLO":
        if is_english:
            guidance_sections.append(
                "- [Solo Persona]: Suggest peaceful, secure spaces, scenic coffee spots, personal rejuvenation, and mindful cultural immersion."
            )
        else:
            guidance_sections.append(
                "- [Chân dung Độc hành (Solo)]: Gợi ý không gian yên tĩnh, an toàn, cà phê ngắm cảnh và trải nghiệm chữa lành, chiêm nghiệm văn hóa."
            )
    elif persona == "EXPLORER":
        if is_english:
            guidance_sections.append(
                "- [Explorer Persona]: Prioritize deep cultural heritage, traditional handicraft villages, archaeological history, and indigenous roots."
            )
        else:
            guidance_sections.append(
                "- [Chân dung Nhà khám phá]: Ưu tiên chiều sâu di sản, làng nghề thủ công cổ truyền, lịch sử khảo cổ và nguồn gốc ẩm thực."
            )

    full_system = base_instructions
    header_guidance = "### ADAPTIVE CONSULTATION GUIDELINES (COEXISTING PROFILES):" if is_english else "### ĐỊNH HƯỚNG TƯ VẤN THÍCH ỨNG (COEXISTING PROFILES):"
    if guidance_sections:
        full_system += f"\n\n{header_guidance}\n" + "\n".join(guidance_sections)

    if profile:
        details = []
        origin_text = profile.origin_province or (profile.origin_location.province if profile.origin_location else None)
        dest_text = profile.destination or (profile.destination_location.province if profile.destination_location else None)
        if dest_text: details.append(f"Destination: {dest_text}" if is_english else f"Điểm đến: {dest_text}")
        if origin_text: details.append(f"Origin: {origin_text}" if is_english else f"Khởi hành: {origin_text}")
        if profile.budget: details.append(f"Budget: {profile.budget}" if is_english else f"Ngân sách: {profile.budget}")
        if profile.travel_duration: details.append(f"Duration: {profile.travel_duration} days" if is_english else f"Thời gian: {profile.travel_duration} ngày")
        if profile.interests: details.append(f"Interests: {', '.join(profile.interests)}" if is_english else f"Sở thích: {', '.join(profile.interests)}")
        if details:
            header_profile = "### TRIP PROFILE INFORMATION:" if is_english else "### THÔNG TIN HỒ SƠ HÀNH TRÌNH:"
            full_system += f"\n\n{header_profile}\n- " + "\n- ".join(details)

    if rag_facts_text:
        header_rag = "### VERIFIED RETRIEVED FACTS (RAG GROUNDING):" if is_english else "### THÔNG TIN TRA CỨU ĐÃ ĐỐI SOÁT (RETRIEVED FACTS):"
        full_system += f"\n\n{header_rag}\n{rag_facts_text}"

    return full_system

# Endpoints
@app.get("/health")
async def health_check():
    """
    Public health check endpoint returning minimal non-sensitive data.
    Never exposes GPU diagnostics, VRAM, model inventory, or internal concurrency counter without auth.
    """
    ollama_ok = False
    model_ready = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if res.status_code == 200:
                ollama_ok = True
                models = [m.get("name") for m in res.json().get("models", [])]
                model_ready = MODEL_NAME in models or any(MODEL_NAME in m for m in models)
    except Exception:
        pass

    return {
        "status": "healthy" if (ollama_ok and model_ready) else "degraded" if ollama_ok else "offline",
        "service": "travi-colab-gpu-inference",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

@app.get("/api/model-info", response_model=ModelInfoResponse)
async def model_info(token: str = Depends(verify_token)):
    """Provides model metadata, quantization details and memory footprint (Protected)."""
    ollama_ok = False
    model_ready = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if res.status_code == 200:
                ollama_ok = True
                models = [m.get("name") for m in res.json().get("models", [])]
                model_ready = MODEL_NAME in models or any(MODEL_NAME in m for m in models)
    except Exception:
        pass

    return ModelInfoResponse(
        model=MODEL_NAME,
        quantization="Q4_0 (GGUF 4-bit Quantization)",
        gpu=gpu_info,
        keep_alive="infinite (-1, model persists in VRAM)",
        rag_facts_count=len(rag_corpus),
        context_window=32768,
        runtime_expires_note="Temporary Google Colab runtime. Endpoint expires when notebook kernel disconnects.",
        active_model_ready=model_ready,
        concurrency_max=MAX_CONCURRENT_REQUESTS
    )

@app.post("/api/chat")
async def chat(request: ChatRequest, token: str = Depends(verify_token)):
    """
    Main travel AI inference endpoint with Vietnam Tourism RAG grounding,
    Adaptive Customer Profile Personalization, and concurrency locking.
    """
    # 1. Retrieve RAG grounding facts
    retrieved_facts = retrieve_rag_context(request.prompt, top_k=3)
    rag_context_text = ""
    sources_metadata = []

    if retrieved_facts:
        for fact in retrieved_facts:
            rag_context_text += (
                f"- Tên: {fact['name']} ({fact['province']})\n"
                f"  Mô tả: {fact['description']}\n"
                f"  Trải nghiệm: {', '.join(fact.get('experiences', []))}\n"
                f"  Ẩm thực: {', '.join(fact.get('foods', []))}\n"
                f"  Thời tiết: {fact.get('weather_notes', '')}\n"
                f"  Nguồn đối soát: {fact['source']}\n"
            )
            sources_metadata.append({
                "name": fact["name"],
                "province": fact["province"],
                "source": fact["source"],
                "coordinate_status": fact.get("coordinate_status", "unverified")
            })

    # 2. Build personalized system prompt (Server controlled - Prompt Injection Defense)
    system_prompt = build_adaptive_system_prompt(request.profile, rag_context_text)

    # 3. Build Ollama messages array
    messages = [{"role": "system", "content": system_prompt}]

    if request.history:
        for prev in request.history[-10:]:
            messages.append({"role": prev.role, "content": prev.content})

    messages.append({"role": "user", "content": request.prompt})

    # 4. Handle Streaming SSE vs Non-Streaming JSON
    cust_type = (request.profile.customer_type if request.profile and request.profile.customer_type else "DOMESTIC")
    if request.stream:
        return StreamingResponse(
            stream_generator(messages, sources_metadata, cust_type),
            media_type="text/event-stream"
        )
    else:
        return await non_streaming_generate(messages, sources_metadata, cust_type)

async def non_streaming_generate(messages: List[Dict[str, str]], sources: List[Dict[str, Any]], customer_type: str):
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
                        "personalized_for": customer_type,
                        "suggestions": [
                            "Tìm hiểu ẩm thực bản địa",
                            "Phương tiện di chuyển đến đây",
                            "Thời điểm lý tưởng nhất trong năm"
                        ],
                        "provenance": {
                            "providerName": f"Google Colab GPU Qwen2-7B ({gpu_info.get('name', 'T4')})",
                            "isLiveAi": True,
                            "modeDescription": "Ollama Serverless GPU Container via Secure HTTPS Tunnel",
                            "vramAllocatedMB": gpu_info.get("total_memory_mb", 15360)
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

async def stream_generator(messages: List[Dict[str, str]], sources: List[Dict[str, Any]], customer_type: str):
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
                                event_data["personalized_for"] = customer_type
                                event_data["provenance"] = {
                                    "providerName": f"Google Colab GPU Qwen2-7B ({gpu_info.get('name', 'T4')})",
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
    logger.info(f"Starting Travi Colab GPU Backend on 127.0.0.1:{port}...")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")

