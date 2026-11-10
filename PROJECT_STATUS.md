# Project Status — TRAVI 2.0: Vietnam Discovery Platform

**Date**: 2026-10-31  
**Project**: TRAVI — Vietnam Discovery Platform  
**Product Positioning**: "Discover Vietnam Beyond the Ordinary."  
**Core Promise**: Help people discover places, local experiences, food, culture, heritage, and stories across Vietnam through curated content, trustworthy information, and personalized discovery.  
**Target Firebase Project ID**: `travi-app-23th10`  
**Milestone**: TRAVI 2.0 — DISCOVERY-FIRST STRATEGIC PRODUCT TRANSFORMATION  
**Explicit Status**: `VERIFIED & PRODUCTION READY` (0 Lint Warnings/Errors, 100% Automated Test Suites Passing, Clean Production Bundle)

---

## 1. Executive Summary: Discovery-First Product Transformation

Travi has evolved from a trip-planning-first tool into a **flagship Vietnam Discovery Platform**.
- **Primary Product**: Discovery — curated sanctuaries, living craft lineages, regional gastronomic lineages, and in-depth cultural stories across Vietnam.
- **Secondary Capability**: Trip Planning — algorithmic day-by-day itineraries and budget breakdowns.
- **Explicit Non-Goals Maintained**: TRAVI is NOT an OTA, hotel-booking clone, generic AI chatbot, static directory, or social media clone.

---

## 2. Six Core Product Modules Overview

### A. Discover Feed (`/`)
- Magazine-style editorial discovery homepage with lead editorial narrative.
- Audience Perspective Filter (Young & Solo, Families & Groups, International, Culture & Heritage).
- Mixed editorial and deterministic scored recommendation lane with human-readable explanation pills.
- Curated showcases: Hidden & Lesser-Known Sanctuaries, Living Craft Workshops & Masters, Authentic Regional Gastronomy, and Seasonal Collections.
- Save & Share actions with real toast feedback. Zero fake engagement numbers, zero inert controls.

### B. Destination Intelligence (`/destinations/:id`, `/destination/:id`)
- Comprehensive destination profiles with historical administrative units (Resolution No. 202/2025/QH15) vs. historical aliases (Thăng Long, Gia Định, Faifo, Cố Đô Hoa Lư).
- Direct linkage to standalone craft masterclasses from `vietnamExperiences.ts`.
- Direct linkage to long-form editorial narratives from `vietnamStories.ts`.
- "Mark as Explored" and "Save" controls connected to the traveler's personal ledger.
- Nearby destinations discovery in the same region.
- Rigorous source attribution and last-verified timestamps.

### C. Experience Discovery (`/experiences`)
- Dedicated discovery system spanning all 8 core disciplines: Food & Culinary, Culture & Heritage, Nature & Adventure, Arts & Crafts, Local Life, Festivals & Events, Wellness & Retreats, and Family & Leisure.
- Multi-facet filters: Search query, category pills, region selector, and time-of-day filter.
- Experience Detail Drawer: Highlights, host/craftsman credits, duration, VND cost indicator, provenance metadata, and destination jump.
- Transparent Ledger Inquiry drafting without false claims of payment escrows.

### D. Explore Map (`/explore?view=map`)
- Custom Mercator SVG projection cartography covering Vietnam [8.2°N – 23.6°N, 102.0°E – 110.2°E].
- Layer toggles: Destinations, Standalone Experiences, Food Lineages, and Attractions.
- Interactive pin selection with detail preview overlay, coordinates, and nearby discovery carousel.
- Zero fake claims of live crowds or road routing.

### E. Travi Stories (`/stories`, `/stories/:id`)
- Long-form editorial publication module documented with cultural archivists and elders.
- Categories: Local Culture, Food Origins, Heritage & Lineage, Craft Villages, Photo Essay, and Travel Guides.
- Editorial reading experience: Drop caps, pull quotes, photo essay blocks, author/editor bylines, read times, and archival references (VICAS, VCCA).

### F. My Discoveries (`/discoveries`, `/saved`)
- Unified personal discovery hub: Saved Destinations, Saved Experiences, Saved Stories / Reading List.
- Custom Curated Collections: Grouping destinations, experiences, and stories with shareable preview links.
- Explored Places Tracker: Visual progress tracking across Vietnam's 34 administrative units with percentage coverage.
- Travelers can save and organize without ever being forced to create a trip.

---

## 3. Discovery Intelligence & Vietnam Discovery Graph

- **Graph Model**: Stable normalized relationships across 34 administrative units, 4 regions, destinations, attractions, dishes, craft ateliers, and stories.
- **Engine**: `src/services/recommendations/discoveryEngine.ts` provides multi-signal, explainable scoring:
  - Interest match (35%)
  - Audience persona alignment (25%)
  - Editorial trust & provenance (20%)
  - Region relevance (10%)
  - Novelty / Hidden gem boost (10%)
- **Zero Hallucination**: Purely deterministic scoring with explainable badges.

---

## 4. Quality Gates Status

| Gate | Tool | Status | Results |
|---|---|---|---|
| **Linting** | `oxlint` | **PASS** | 0 warnings, 0 errors (149 files inspected) |
| **Testing** | `vitest run` | **PASS** | 100% test suites pass (34 files, 273 tests) |
| **Build** | `tsc -b && vite build` | **PASS** | Clean production bundle in ~1.08s |

---

## 5. On-Demand Google Colab Qwen2 AI Server Integration

- **Architecture**: `Travi Frontend → Travi Backend Proxy / Cloud Functions → Cloudflare HTTPS Tunnel → Google Colab FastAPI → Ollama → Qwen2-7B-Instruct + Vietnam Tourism RAG`
- **Model**: `qwen2:7b` (Qwen2-7B-Instruct Q4_0 quantized GGUF, ~4.5 GB VRAM) on free NVIDIA T4 GPU (15GB GDDR6 VRAM) with `keep_alive: -1`.
- **Backend Adapter**: `src/services/ai/colabAiAdapter.ts` implementing `checkColabAIStatus()`, `generateColabAIResponse()`, and `getColabAIModelInfo()`.
- **Adaptive Personalization**: Full support for 4 customer profile segments (`INTERNATIONAL`, `DOMESTIC`, `LOCAL`, `INTERPROVINCIAL`).
- **Offline / Online Safeguard**: Seamless fallback to Deterministic Expert Engine when Colab session terminates; zero client-side secret exposure.
- **UI Status Badge**: Integrated `AiStatusIndicator` in `CopilotPage.tsx` reflecting `AI Online`, `AI Offline`, and `AI Connecting`.
