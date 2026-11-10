/**
 * Travi Vietnam Travel AI Assistant Engine
 *
 * Requirements:
 * 1. Expert assistance focused on Vietnam tourism:
 *    - Destination discovery & routing
 *    - Regional gastronomy & street food secrets
 *    - Cultural etiquette, temple customs & tipping
 *    - Weather patterns, microclimates & typhoon seasons
 *    - Transportation guidance (Reunification Express, sleeper bus, Grab)
 *    - Budget planning (VND exchange, realistic daily costs)
 *    - Travel preparation (e-visa, SIM cards, currency)
 * 2. Modular provider architecture:
 *    - Deterministic expert knowledge engine by default
 *    - Optional server-side AI model through secure backend gateway (/api/ai/chat)
 * 3. Never pretend an unconfigured live AI request succeeded.
 * 4. Zero client-side API secrets. All upstream LLM credentials remain exclusively server-side.
 */

import { vietnamDestinations } from '../../data/vietnamData.ts';
import { culturalDataService } from '../cultural/culturalDataService.ts';
import { tourismDataService } from '../tourism/tourismDataService.ts';

export interface TravelAssistantContext {
  destination?: string;
  durationDays?: number;
  travelPace?: string;
  budgetRange?: string;
  travelStyle?: string;
  customerType?: 'INTERNATIONAL' | 'DOMESTIC' | 'LOCAL' | 'INTERPROVINCIAL';
  profile?: {
    customer_type?: 'INTERNATIONAL' | 'DOMESTIC' | 'LOCAL' | 'INTERPROVINCIAL';
    origin_country?: string;
    origin_province?: string;
    destination?: string;
    preferred_language?: string;
    budget?: string;
    travel_duration?: number;
    interests?: string[];
  };
}

export interface AiAssistantResponse {
  content: string;
  suggestions: string[];
  personalized_for?: string;
  itineraryTeaser?: {
    destination: string;
    duration: string;
    highlights: string[];
  };
  sources?: Array<{
    name: string;
    province?: string;
    source: string;
    coordinate_status?: string;
  }>;
  provenance: {
    providerName: string;
    isLiveAi: boolean;
    modeDescription: string;
  };
}

interface KnowledgeTopic {
  patterns: RegExp[];
  title: string;
  response: (query: string, context?: TravelAssistantContext) => string;
  suggestions: string[];
  teaserDestination?: string;
}

const TOPICS: KnowledgeTopic[] = [
  {
    patterns: [/etiquette/i, /customs?/i, /temple/i, /shoes?/i, /pagoda/i, /dress code/i, /tipping/i, /buddhis/i],
    title: 'Cultural Etiquette & Sacred Sites in Vietnam',
    response: () => `### Cultural Etiquette & Customs in Vietnam

Traveling with respect opens doors to genuine warmth across Vietnam:

1. **Sacred Temples & Pagodas:**
   - **Dress Code:** Always cover shoulders and knees. Remove sunglasses and hats before entering prayer halls.
   - **Footwear:** Remove your shoes when you see a shoe rack outside shrines, private homes, and select traditional tea houses.
   - **Thresholds:** Step *over* the raised wooden door threshold (ngưỡng cửa)—never step directly onto it, as tradition holds this treads on the guardian spirit.

2. **Respect for Elders & Everyday Social Etiquette:**
   - **Respect for Elders:** Always greet the oldest person first, bow slightly, and offer food or tea using both hands.
   - **Two-Hand Giving:** When handing over cash, business cards, or receiving tea, use both hands or support your right elbow with your left hand as a sign of respect.
   - **Pointing:** Point with your entire open hand (palm down) rather than a single finger.
   - **The Head:** Avoid touching anyone's head (including children), as it is regarded as the highest spiritual point of the body.

3. **Tipping Culture:**
   - Tipping is not traditionally expected in street food stalls or casual eateries, but rounding up the bill is appreciated.
   - For private guides, drivers, and massage/spa therapists, customary tips (e.g., 50,000 — 100,000 VND for drivers, 100,000 — 200,000 VND for private tour guides) are customary and deeply valued.`,
    suggestions: [
      'What are the best street food stalls in Hanoi?',
      'How does the train system work in Vietnam?',
      'Best season to visit Ha Giang and the North?',
    ],
  },
  {
    patterns: [/food/i, /\beat(ing)?\b/i, /pho/i, /phở/i, /dish/i, /cuisine/i, /bun bo/i, /banh mi/i, /coffee/i, /egg coffee/i],
    title: 'Vietnamese Gastronomy & Regional Specialties',
    response: () => `### The Tripartite Flavor Map of Vietnam

Vietnamese cuisine is celebrated worldwide for its balance of the five elemental tastes (yin-yang harmony, fresh herbs, and zero heaviness):

1. **Northern Vietnam (Delicate & Savory):**
   - **Phở Bát Đàn & Phở Thìn:** Clear, aromatic beef marrow bone broth simmered for 12+ hours with charred ginger, cinnamon, and star anise. Eaten at dawn in Hanoi Old Quarter.
   - **Bún Chả:** Charcoal-grilled pork patties and belly served in warm tangy fish sauce with fresh rice vermicelli and heaps of herbs.
   - **Cà Phê Trứng (Egg Coffee):** Invented in Hanoi in 1946; whipped egg yolk meringue atop robust drip coffee.

2. **Central Vietnam (Spicy, Complex & Royal):**
   - **Bún Bò Huế:** Thick rice noodles in a rich lemongrass and fermented shrimp paste broth with beef shank.
   - **Cao Lầu (Hội An):** Chewy noodles kneaded with ash water from Cham island trees and Bá Lễ well water, topped with five-spice char siu pork.
   - **Mì Quảng:** Turmeric-tinted noodles in shallow savory pork-shrimp gravy with toasted sesame rice crackers.

3. **Southern Vietnam (Sweet, Vibrant & Herbaceous):**
   - **Cơm Tấm (Saigon Broken Rice):** Fractured grains with charcoal-grilled marinated pork chop, steamed egg loaf, and scallion oil.
   - **Bánh Xèo:** Giant crispy golden crepes filled with pork belly and shrimp, wrapped in wild mustard leaves.
   - **Hủ Tiếu Nam Vang:** Clear tapioca noodles with minced pork and quail eggs passed from boat-to-boat at delta floating markets.`,
    suggestions: [
      'Tell me about Hue imperial royal dining',
      'How to safely enjoy street food in Saigon?',
      'Plan a 7-day culinary trip in Vietnam',
    ],
    teaserDestination: 'thua-thien-hue',
  },
  {
    patterns: [/weather/i, /season/i, /monsoon/i, /rain/i, /typhoon/i, /when to visit/i, /best time/i, /climate/i],
    title: 'Vietnam Seasonal Weather Patterns & Microclimates',
    response: () => `### Understanding Vietnam's Three Distinct Climate Zones

Because Vietnam stretches over 1,650 km north-to-south, there is no single "bad time" to visit—when it is rainy in one region, another is bathed in sunshine!

1. **North Vietnam (Northern Vietnam - Hanoi, Ha Giang, Sapa, Ha Long Bay):**
   - **Autumn (September to October / November):** The golden season. Crisp, breezy, dry weather (18°C - 25°C) with ripe golden rice terraces in Mù Cang Chải and buckwheat blossoms in Hà Giang during October.
   - **Winter (Dec — Feb):** Cool to cold (10°C - 16°C) with frequent mists. Occasional snow atop Fansipan.
   - **Spring (Mar — Apr):** Mild and pleasant with blooming flowers.
   - **Summer (May — Aug):** Hot and humid with sudden afternoon tropical downpours.

2. **Central Vietnam (Hue, Da Nang, Hoi An, Phong Nha, Quy Nhon):**
   - **Dry Season (Feb — Aug):** Sunny, warm coastal weather ideal for swimming at My Khe, caving in Phong Nha, and evening walks in Hoi An.
   - **Wet Season (Sep — Nov):** Annual monsoon rains and occasional typhoons. Central rivers may flood temporarily.

3. **South Vietnam (Southern Vietnam - Saigon, Mekong Delta, Phu Quoc, Con Dao):**
   - **Dry Season (Nov — Apr):** Constant tropical sunshine (26°C - 32°C), low humidity, and glass-calm waters around Phu Quoc and Con Dao.
   - **Green / Rainy Season (May — Oct):** Brief 30-minute refreshing afternoon tropical showers that quickly give way to evening sunshine.`,
    suggestions: [
      'What should I pack for Northern Vietnam in November?',
      'Is Phu Quoc good to visit in January?',
      'Best places to visit in Central Vietnam',
    ],
  },
  {
    patterns: [/train/i, /reunification/i, /rail/i, /transport/i, /bus/i, /limousine/i, /grab/i, /flight/i, /motorbike/i, /\btravel\b/i, /how to get/i, /route/i, /between/i],
    title: 'Transportation & Transit Guide Across Vietnam',
    response: () => `### Navigating Transit in Vietnam

1. **The Reunification Express Train (Đường sắt Bắc Nam):**
   - Vietnam's historic 1,726 km railway connects Hanoi to Ho Chi Minh City.
   - **Must-Ride Scenic Segment:** The 3-hour journey between **Hue and Da Nang** over the **Hải Vân Pass**, winding along sheer coastal cliffs overlooking turquoise sea coves.
   - **Classes:** 4-berth soft sleeper compartments (Khoang 4 giường) are clean, air-conditioned, and comfortable for overnight trips.

2. **Sleeper Limousine Bus (VIP Cabin):**
   - Modern Sleeper Limousine Bus vehicles feature individual curtained pods with USB chargers, reading lights, and reclining massage beds.
   - Excellent for routes between Hanoi and Ha Giang (6h) or Hanoi to Sapa (5h).

3. **Domestic Flights:**
   - Vietnam Airlines, Bamboo Airways, and Vietjet operate high-frequency direct flights between Hanoi (HAN), Da Nang (DAD), and Saigon (SGN) in ~1h 15m.
   - Perfect for hopping between distant regions when time is limited.

4. **In-City Transit:**
   - **Grab:** Download the Grab app upon arrival; it provides upfront metered pricing for GrabBike (scooters) and GrabCar with zero language barrier or haggling.`,
    suggestions: [
      'How to book train tickets from Hue to Da Nang?',
      'Can foreigners rent motorbikes in Ha Giang?',
      'What are the visa requirements for Vietnam?',
    ],
  },
  {
    patterns: [/visa/i, /sim card/i, /money/i, /vnd/i, /currency/i, /atm/i, /cash/i, /exchange/i, /prepare/i, /esim/i],
    title: 'Practical Travel Preparation: Visas, Currency & Connectivity',
    response: () => `### Essential Vietnam Travel Preparation

1. **Vietnam E-Visa:**
   - Citizens of all countries can apply for a **90-day multiple-entry e-visa** through the official Vietnam Immigration portal.
   - **Rule:** Apply at least 1-2 weeks before departure. Ensure your passport has at least 6 months validity and two blank pages.

2. **Currency & Money (Vietnamese Đồng — VND):**
   - **Current Benchmark Rate:** $1 USD $\\approx$ 25,400 VND | €1 EUR $\\approx$ 27,200 VND.
   - **Cash is King:** While hotels and modern restaurants accept Visa/Mastercard, street food vendors, local markets, and rural homestays deal strictly in cash.
   - **ATMs:** Widely available in all cities (TPBank, VPBank, Vietcombank). Notify your home bank before traveling to prevent fraud blocks.
   - **Note Denominations:** Banknotes are polymer (10,000 to 500,000 VND). Be careful not to confuse the green 10,000 VND note with the green 100,000 VND note!

3. **SIM Cards & Connectivity:**
   - Viettel, Vinaphone, and Mobifone offer the strongest 4G/5G coverage, even in remote highland valleys of Ha Giang.
   - Purchase physical SIM cards at airport arrival counters or install an eSIM before departure.`,
    suggestions: [
      'What is a realistic daily travel budget for Vietnam?',
      'What should I know about cultural etiquette in pagodas?',
      'Create an itinerary for 10 days in Vietnam',
    ],
  },
  {
    patterns: [/budget/i, /cost/i, /price/i, /expensive/i, /cheap/i, /daily cost/i, /how much/i],
    title: 'Realistic Daily Travel Budgets for Vietnam',
    response: () => `### Realistic Travel Budgets in Vietnam (per person / day)

Vietnam remains one of the world's most rewarding high-value travel destinations:

1. **Budget Backpacker ($25 — $40 USD / 600,000 — 1,000,000 VND):**
   - Clean boutique hostel dorm or authentic family stilt homestay ($10 - $18)
   - Fantastic street food meals: Phở, Bánh Mì, Bún Chả, iced coffee ($8 - $12)
   - Local transit by GrabBike and public buses ($4 - $6)

2. **Comfort Explorer ($60 — $120 USD / 1,500,000 — 3,000,000 VND):**
   - Beautiful 3-4 star boutique hotel or heritage villa ($35 - $70)
   - Sit-down regional specialty dining and craft cafés ($20 - $35)
   - Private Grab rides, high-speed train tickets, and museum passes ($15 - $25)

3. **Luxury Heritage ($160 — $350+ USD / 4,000,000 — 9,000,000+ VND):**
   - World-class luxury colonial resort (e.g. Sofitel Legend Metropole, Azerai La Residence Hue) ($150 - $300+)
   - High-end tasting menus, private boat charters on Ha Long Bay / Thu Bồn ($50 - $100)
   - Dedicated private car and bilingual driver-guide ($40 - $70)`,
    suggestions: [
      'How to plan a 10-day trip from Hanoi to Saigon?',
      'What are the best food spots in Hanoi?',
      'How to book trains in Vietnam?',
    ],
  },
];

export class VietnamTravelAiService {
  public async generateAnswer(
    userQuery: string,
    context?: TravelAssistantContext
  ): Promise<AiAssistantResponse> {
    // 1. Client-Side Input Validation (reject empty or oversized input)
    if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
      return {
        content: 'Please enter a question or topic about traveling in Vietnam.',
        suggestions: ['What are the key temple customs?', 'Best street food in Hanoi?', 'How to book trains?'],
        provenance: {
          providerName: 'Travi Vietnam Expert Knowledge Engine',
          isLiveAi: false,
          modeDescription: 'Deterministic Expert Knowledge Base (Active & Verified)',
        },
      };
    }

    const trimmedRaw = userQuery.trim();
    const trimmed = trimmedRaw.toLowerCase();
    if (trimmedRaw.length > 1000) {
      return {
        content: 'Your query exceeds the maximum allowed length of 1,000 characters. Please provide a more concise travel question.',
        suggestions: ['Best 7-day Vietnam itinerary', 'Hanoi street food secrets', 'Temple dress code guidelines'],
        provenance: {
          providerName: 'Travi Vietnam Expert Knowledge Engine',
          isLiveAi: false,
          modeDescription: 'Input Validation Safety Guard',
        },
      };
    }

    // 2. Query Secure Server-Side AI Gateway (/api/ai/chat)
    // Private LLM secrets live exclusively in server-side environment (VIETNAM_AI_API_KEY).
    // Never read client-side VITE_* AI secrets.
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const serverRes = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: trimmedRaw,
          context,
          profile: context?.profile || {
            customer_type: context?.customerType || 'DOMESTIC',
            destination: context?.destination,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data.status === 'success' && data.content) {
          return {
            content: data.content,
            sources: data.sources || [],
            suggestions: data.suggestions || ['Tell me more', 'Suggest an itinerary stop'],
            personalized_for: data.personalized_for,
            provenance: {
              providerName: data.provenance?.providerName || 'Travi Vietnam Live AI Provider (Server-Side)',
              isLiveAi: true,
              modeDescription: data.provenance?.modeDescription || 'Live LLM Inference via Secure Backend Gateway',
            },
          };
        }
        // If server returns status === 'unconfigured', fall through silently to deterministic engine
      }
    } catch {
      // Server offline, timed out, or unconfigured: fall through cleanly to deterministic expert engine
    }


    // Deterministic Expert Engine matching
    for (const topic of TOPICS) {
      if (topic.patterns.some((pattern) => pattern.test(trimmed))) {
        const content = topic.response(userQuery, context);
        let teaser: AiAssistantResponse['itineraryTeaser'] = undefined;

        if (topic.teaserDestination) {
          const dest = vietnamDestinations.find((d) => d.id === topic.teaserDestination);
          if (dest) {
            teaser = {
              destination: dest.name,
              duration: `${dest.estimatedVisitDays} Days`,
              highlights: dest.attractions.map((a) => a.name).slice(0, 3),
            };
          }
        }

        return {
          content,
          suggestions: topic.suggestions,
          itineraryTeaser: teaser,
          provenance: {
            providerName: 'Travi Vietnam Expert Knowledge Engine',
            isLiveAi: false,
            modeDescription: 'Deterministic Expert Knowledge Base (Active & Verified)',
          },
        };
      }
    }

    // Cultural Heritage Assets Grounding (Cultural Data API Integration)
    const culturalResp = await culturalDataService.getAssets({ q: trimmedRaw, limit: 1 });
    if (culturalResp.items && culturalResp.items.length > 0) {
      const asset = culturalResp.items[0];
      const venue = asset.visitableVenue;
      const venueText = venue
        ? `\n- **Địa điểm tham quan trưng bày (Visitable Venue):** ${venue.poiName}\n- **Địa chỉ cổng vào:** ${venue.entranceAddress}\n- **Giờ mở cửa:** ${venue.openingHoursNote}\n*(Lưu ý phân biệt: Tọa độ/địa điểm phát hiện cổ vật không phải là tọa độ lối vào bảo tàng.)*`
        : '\n*(Hiện vật được bảo quản trong kho lưu trữ chuyên dụng, chưa mở cửa tham quan công cộng rộng rãi.)*';

      return {
        content: `### Di sản & Bảo vật Văn hóa: ${asset.vietnameseName} (${asset.name})

${asset.fullDescription}

- **Loại hình di sản:** ${asset.assetType === 'artifact' ? 'Hiện vật / Cổ vật' : asset.assetType === 'monument' ? 'Công trình di tích / Bia ký' : 'Di sản phi vật thể'}
- **Niên đại:** ${asset.dating}
- **Thời kỳ / Nền văn hóa:** ${asset.cultureOrPeriod}
- **Giá trị văn hóa nổi bật:** ${asset.culturalSignificance}
- **Đơn vị lưu giữ / Bảo tồn (Cultural Institution):** ${asset.holdingInstitution.name} (${asset.holdingInstitution.address}, ${asset.holdingInstitution.city})
${venueText}
- **Chứng nhận Quốc gia / UNESCO:** ${asset.nationalTreasureDecision || 'Di sản văn hóa chính thức'}
- **Nguồn xác thực:** ${asset.provenance.sourceName}`,
        suggestions: [
          `Tìm hiểu thêm về ${asset.holdingInstitution.name}`,
          'Các bảo vật quốc gia khác của văn hóa Đông Sơn',
          'Khám phá các bảo tàng lịch sử tiêu biểu tại Hà Nội',
        ],
        provenance: {
          providerName: 'Travi Vietnam Cultural Data Provider',
          isLiveAi: false,
          modeDescription: `Cultural Heritage Knowledge Base [Mode: ${culturalResp.mode}]`,
        },
      };
    }

    // Unified POI Grounding (Sơn La & Vietnam Regional Datasets)
    const matchingPois = tourismDataService.getPois({ searchQuery: trimmedRaw });
    if (matchingPois.length > 0) {
      const poi = matchingPois[0];
      const coordNotice = tourismDataService.canDisplayOnMap(poi)
        ? `- **Tọa độ GPS:** ${poi.latitude}, ${poi.longitude} (Độ tin cậy: ${poi.coordinateConfidence})`
        : `> [!NOTE]\n> **Tọa độ thực địa:** Đang được đối soát thực địa với Sở VHTT&DL tỉnh ${poi.provinceOrRegion}. Travi tuân thủ nguyên tắc toàn vẹn dữ liệu: không tự ý giả lập tọa độ cổng vào sai lệch.`;

      return {
        content: `### Thông tin Điểm đến: ${poi.vietnameseName}

${poi.longDescription || poi.shortDescription}

- **Tỉnh / Thành phố:** ${poi.provinceOrRegion} • Vùng: ${poi.subregion}
- **Phân loại điểm đến:** ${poi.category}
- **Địa chỉ:** ${poi.address || 'Đang cập nhật'}
- **Thời điểm lý tưởng:** ${poi.bestSeason}
- **Trải nghiệm tiêu biểu:** ${poi.experiences.join(', ')}
- **Ẩm thực đặc sản:** ${poi.localFood.join(', ')}
- **Nét văn hóa nổi bật:** ${poi.culturalHighlights.join(' • ')}
- **Trạng thái kiểm duyệt:** ${poi.verificationStatus === 'verified' ? 'Đã xác minh chính thức' : 'Bản ghi gốc Sở VHTT&DL (Đang trong quy trình kiểm duyệt thực địa)'}
- **Nguồn dữ liệu:** ${poi.source}

${coordNotice}`,
        suggestions: [
          `Khám phá thêm các điểm đến tại ${poi.provinceOrRegion}`,
          `Đặc sản ẩm thực vùng ${poi.subregion}`,
          'Kinh nghiệm du lịch Mộc Châu Sơn La',
        ],
        provenance: {
          providerName: 'Travi Unified Tourism POI Repository',
          isLiveAi: false,
          modeDescription: 'Authoritative Local Tourism Database (PII Sanitized & Verified)',
        },
      };
    }

    // Default conversational response tailored to Vietnam
    const matchedDest = vietnamDestinations.find((d) =>
      trimmed.includes(d.name.toLowerCase()) || trimmed.includes(d.vietnameseName.toLowerCase())
    );

    if (matchedDest) {
      return {
        content: `### Discovering ${matchedDest.name} (${matchedDest.vietnameseName})

${matchedDest.description}

- **Province / Unit:** ${matchedDest.provinceOrMunicipality} • ${matchedDest.region}
- **Best Season to Visit:** ${matchedDest.bestSeason} (${matchedDest.weatherNote})
- **Recommended Pacing:** ${matchedDest.estimatedVisitDays} days (${matchedDest.editorialSummary})
- **Must-Try Local Flavors:** ${matchedDest.mustTryFood.map((f) => `${f.name} (${f.vietnameseName})`).join(' • ')}
- **Signature Highlights:** ${matchedDest.attractions.map((a) => a.name).join(', ')}

Would you like to build a day-by-day itinerary for ${matchedDest.name}?`,
        suggestions: [
          `Build a ${matchedDest.estimatedVisitDays}-day itinerary for ${matchedDest.name}`,
          `What are the must-try foods in ${matchedDest.name}?`,
          `How to get to ${matchedDest.name}?`,
        ],
        itineraryTeaser: {
          destination: matchedDest.name,
          duration: `${matchedDest.estimatedVisitDays} Days`,
          highlights: matchedDest.attractions.map((a) => a.name).slice(0, 3),
        },
        provenance: {
          providerName: 'Travi Vietnam Expert Knowledge Engine',
          isLiveAi: false,
          modeDescription: 'Deterministic Expert Knowledge Base (Active & Verified)',
        },
      };
    }

    return {
      content: `I am your **Travi Vietnam Travel Assistant**, dedicated exclusively to helping you discover authentic Vietnamese culture, destinations, and cuisine.

Here are a few ways I can help you plan your journey:
1. **Destination Discovery:** Ask about any of Vietnam's 34 provincial destinations from the misty northern karst peaks of Hà Giang to the quiet coral bays of Côn Đảo.
2. **Regional Gastronomy:** Discover where to find authentic Phở Bò in Hanoi, Royal Court cuisine in Hue, or fresh floating market noodles in the Mekong Delta.
3. **Smart Trip Planning:** Ask for a 3-day, 7-day, or 14-day day-by-day itinerary with realistic pacing and budget breakdowns.
4. **Local Logistics:** Guidance on the Reunification Express train, VIP sleeper buses, e-visa guidelines, and temple etiquette.

What would you like to explore first?`,
      suggestions: [
        'Best 7-day itinerary for first-time visitors to Vietnam?',
        'What are the key cultural etiquette rules for temples?',
        'Tell me about the food culture in Hanoi and Hue',
      ],
      provenance: {
        providerName: 'Travi Vietnam Expert Knowledge Engine',
        isLiveAi: false,
        modeDescription: 'Deterministic Expert Knowledge Base (Active & Verified)',
      },
    };
  }
  public async generateResponse(
    userQuery: string,
    context?: TravelAssistantContext
  ): Promise<AiAssistantResponse> {
    return this.generateAnswer(userQuery, context);
  }
}

export const vietnamAiService = new VietnamTravelAiService();

export function getVietnamAiProviderStatus() {
  return {
    provider: 'deterministic-expert',
    isExternalApiConfigured: false,
    modelLabel: 'Deterministic Expert Engine (Active & Verified)',
    backendGateway: 'Secure Server-Side AI Gateway (/api/ai/chat)',
    securityPolicy: 'Zero client-side secrets. LLM credentials managed server-side.',
  };
}

export async function checkServerAiStatus(): Promise<{
  state: 'AI_ONLINE' | 'AI_OFFLINE' | 'AI_CONNECTING';
  status: string;
  isAvailable: boolean;
  provider: string;
  model: string;
  gpu?: { name: string; detected: boolean };
}> {
  try {
    const res = await fetch('/api/ai/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return {
    state: 'AI_OFFLINE',
    status: 'offline',
    isAvailable: false,
    provider: 'Travi Vietnam Expert Knowledge Engine',
    model: 'Deterministic Expert Engine (Active & Verified)',
  };
}

export async function generateVietnamAiResponse(
  query: string,
  context?: TravelAssistantContext
) {
  const result = await vietnamAiService.generateAnswer(query, context);
  return {
    ...result,
    isDeterministicFallback: !result.provenance.isLiveAi,
    suggestedActions: [
      { label: 'Explore Destinations', action: 'explore' },
      { label: 'Plan Itinerary', action: 'plan' },
    ],
  };
}
