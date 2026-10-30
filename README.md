# Travi — AI-Powered Vietnam Travel Platform
> **Discover Vietnam. Plan Your Journey. Experience More.**  
> An AI-powered Vietnam travel discovery and trip-planning platform focused exclusively on the S-shaped land.

---

## 1. Product Overview & Vision

Conventional travel apps push generic tourist traps, commercial sponsored listings, or superficial top-10 lists. **Travi** is built for depth, intention, and cultural immersion across Vietnam.

Travi connects modern travelers directly with Vietnam's 34 provincial destinations, UNESCO World Heritage sites, thousand-year-old artisanal guild villages, karst limestone sanctuaries, and living culinary lineages from North to South.

### Core Capabilities

1. **Discover Vietnam**:
   - Comprehensive destination database covering Vietnam's 34 provincial-level units.
   - Historical administrative designations preserved (e.g., Thăng Long for Hanoi, Gia Định for Saigon, Faifo for Hội An, Cố Đô Hoa Lư for Ninh Bình).
   - Multi-dimensional filtering by region (North, Central, South), category (Heritage, Nature, Gastronomy, etc.), and travel style.
   - Authentic regional gastronomy dossiers (Phở Bát Đàn, Bún Bò Huế, Cao Lầu Hội An, Cơm Tấm Sài Gòn).
   - Rich editorial destination dossiers with high-resolution imagery and genuine Unsplash attributions.

2. **Smart Trip Planner**:
   - Algorithmic day-by-day itinerary synthesis based on starting hub, travel duration, budget tier, and travel pace.
   - Segmented morning, afternoon, and evening activities with estimated durations and geographic grouping.
   - Transparent VND/USD budget breakdowns covering accommodations, dining, activities, and local transit.
   - Editable itinerary stops: add, delete, reorder, and save directly to your persistent journey ledger.
   - Honest logistical disclaimers noting that timings and prices represent unverified estimates.

3. **Vietnam AI Assistant**:
   - Contextual travel concierge specializing in Vietnam tourism.
   - Advises on regional microclimates (Northern monsoon vs. Central rainy seasons vs. Southern dry season).
   - Cultural etiquette guidance for pagodas, ancestral temples, ethnic villages, and dining customs.
   - Pluggable modular provider architecture: runs in **Deterministic Expert Engine** mode when no external API key is supplied, with zero synthetic hallucinations.

4. **Vietnam Interactive Map**:
   - Zero-dependency Mercator SVG interactive cartography calibrated precisely to Vietnam's geographic boundaries (8.2°N – 23.6°N, 102.0°E – 110.2°E).
   - Genuine latitude/longitude coordinates for all 34 provincial destinations.
   - Interactive marker selection, hover previews, regional filtering, and 60fps pan/zoom.
   - Zero private API keys exposed to frontend code.

5. **Vietnam Local Experiences**:
   - Curated masterclasses and traditional craft hamlets connected directly to real destinations (e.g., Bát Tràng ceramics, Hội An silk lanterns, Thủy Xuân incense, Lùng Tám H’mong hemp weaving).
   - Direct atelier inquiry logging in the traveler's persistent ledger.

6. **My Journeys Ledger**:
   - Offline-resilient local persistence for saved destinations, customized itineraries, and travel notes.
   - Seamless Firebase authentication and cloud sync when credentials are configured (`travi-app-23th10`).

---

## 2. Architecture & Data Model

```
Browser Client (React 19 + TypeScript + Vite)
  │
  ├── Discover Vietnam (/explore)
  │     ├── VietnamInteractiveMap (Mercator SVG Cartography)
  │     ├── DestinationCard & Detail Dossier (/destination/:id)
  │     └── TasteProfileModal (8 Vietnamese Cultural Pillars)
  │
  ├── Smart Trip Planner & AI Assistant (/copilot)
  │     ├── AgenticTripBuilder (8-Stage Autonomous Synthesis)
  │     ├── VietnamAiAssistant (Modular Conversational Engine)
  │     └── ItineraryGenerator (Day-by-Day Route & Budget Builder)
  │
  ├── Local Experiences & Masterclasses (/experiences)
  │
  └── My Journeys Ledger (/trips)
        │
        ├── Local Demo Store (localStorage fallback)
        └── Cloud Firestore (Scoped user isolation /users/{uid}/*)
```

### Destination Schema (`src/types/vietnam.ts`)

Every destination in Travi conforms to a normalized, typed data contract:
- `id`: Stable kebab-case identifier.
- `name`: Official Vietnamese name with diacritics.
- `historicalName`: Former administrative designations where applicable.
- `provinceOrMunicipality`: Current provincial unit.
- `region`: `North` | `Central` | `South`.
- `categories`: Array of curated categories (Nature, Beaches, Heritage, Food, Culture, Adventure, Wellness, Hidden Gems).
- `coordinates`: Exact `{ latitude, longitude }` geocodes.
- `editorialSummary` & `longDescription`: Storytelling copy.
- `mustTryFood`: Signature regional dishes and authentic eateries.
- `attractions`: Key landmarks with historical significance.
- `localExperiences`: Traditional craft ateliers and unique encounters.
- `bestSeason`: Microclimate-aware optimal visiting window.
- `estimatedStayDuration`: Realistic recommended days.
- `priceLevel`: Relative price tier.

---

## 3. Technology Stack & Quality Toolchain

- **Frontend**: React 19, TypeScript, Vite.
- **Styling**: TailwindCSS with bespoke editorial color palette (`#080D18` Obsidian, `#121C30` Navy, `#3DDC97` Jade Green, `#48E3EF` Cyan).
- **Icons & Motion**: Lucide React, Framer Motion.
- **Persistence**: Firebase Auth & Firestore (`travi-app-23th10`) + LocalStorage demo store.
- **Testing & Linting**: Vitest, Oxlint.

### Quality Gates Verification
```bash
# Linting (0 warnings, 0 errors)
npm run lint

# Automated Test Suite (100% pass)
npm run test

# Production Build Bundle
npm run build
```

---

## 4. Getting Started

### Prerequisites
- Node.js LTS (v24.x recommended)
- npm (v11.x recommended)

### Development Server
```bash
npm run dev
```
Open `http://localhost:5173` to explore Travi.
