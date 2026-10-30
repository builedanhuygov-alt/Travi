/**
 * Vietnam Cultural Itinerary Generator — Smart Trip Planner Engine
 *
 * Requirements:
 * 1. Generate coherent day-by-day itineraries tailored to:
 *    - Starting location (Hanoi, Saigon, Da Nang, or international)
 *    - Destination or multi-stop route
 *    - Duration (1 to 14 days)
 *    - Budget range (Budget Backpacker / Comfort Explorer / Luxury Heritage)
 *    - Travel pace (Unhurried / Deliberate / Expedition)
 *    - Cultural interests & food preferences
 *    - Transportation preferences (Reunification Express rail, sleeper bus, private transfer, motorbike, flights)
 * 2. Transparently explain how the itinerary aligns with traveler preferences.
 * 3. Clearly mark estimates and provide estimated budget breakdowns in VND and USD.
 * 4. Never claim bookings or reservations have been made.
 * 5. Allow travelers to edit stops and save directly to My Trips.
 */

import { vietnamDestinations } from '../../data/vietnamData.ts';
import type { TripDay, TripDayActivity, Trip } from '../../types/index.ts';

export type BudgetRange =
  | 'Budget Backpacker'
  | 'Comfort Explorer'
  | 'Luxury Heritage'
  | 'Mid-range'
  | 'Comfort'
  | 'Luxury'
  | 'Artisanal Heritage';

export type TravelPace =
  | 'Unhurried'
  | 'Deliberate'
  | 'Expedition'
  | 'Moderate'
  | 'Fast-paced';
export type TransportPreference =
  | 'Reunification Express Train'
  | 'Scenic Limousine Sleeper Bus'
  | 'Private Car & Driver'
  | 'Motorbike Loop'
  | 'Domestic Flights';

export interface ItineraryActivity extends TripDayActivity {
  id: string;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
  title: string;
  description: string;
  culturalPillar: string;
  matchedInterest?: string;
  estimatedDuration: string;
  unverifiedEstimateNotice: string;
  costEstimateVND?: number;
}

export interface ItineraryDay extends TripDay {
  dayNumber: number;
  title: string;
  theme: string;
  interestExplanation: string;
  activities: ItineraryActivity[];
  estimatedDailyBudgetVND?: number;
  notes?: string;
}

export interface BudgetBreakdown {
  currency: string;
  totalEstimateVND: number;
  totalEstimateUSD: number;
  perPersonDailyVND: number;
  accommodationTotalVND: number;
  diningTotalVND: number;
  activitiesTotalVND: number;
  localTransportTotalVND: number;
  disclaimer: string;
}

export interface ItineraryDraft {
  id: string;
  title: string;
  destinationName: string;
  country: string;
  destinationId?: string;
  durationDays: number;
  budgetRange: BudgetRange;
  travelPace: TravelPace;
  startingLocation: string;
  transportPreference: TransportPreference;
  matchedCulturalInterests: string[];
  foodAndExperienceFocus: string[];
  days: ItineraryDay[];
  budgetBreakdown: BudgetBreakdown;
  feasibilityStatus?: 'Feasible Itinerary' | 'Requires Manual Review (Regional Distance Alert)';
  feasibilityWarning?: string;
  disclaimers: {
    bookingNotice: string;
    estimationNotice: string;
    engineNotice: string;
    routingNotice: string;
  };
  createdAt: string;
  isEdited?: boolean;
}

export interface GenerateItineraryParams {
  destination: string; // destination ID or custom string
  durationDays: number;
  budgetRange: BudgetRange;
  travelPace: TravelPace;
  culturalInterests: string[];
  foodPreferences?: string[];
  startingLocation?: string;
  travelersCount?: number;
  transportPreference?: TransportPreference;
}

export const CONCIERGE_DISCLAIMERS = {
  bookingNotice:
    'No bookings, tickets, or hotel reservations have been made. This itinerary is an editorial planning draft.',
  estimationNotice:
    'Travel times, opening hours, accessibility, distances, and prices are unverified estimates without live GPS navigation telemetry.',
  engineNotice:
    'Synthesized via Travi Vietnam Smart Trip Planner Engine, aligning authentic regional Vietnamese heritage with your pacing.',
  routingNotice:
    'Route Honesty Notice: No live turn-by-turn road navigation provider is connected. Transit durations are linear approximations and subject to real-world topography, mountain passes, and ferry schedules.',
} as const;

// Knowledge templates for primary Vietnam destinations
interface DestinationDayTemplate {
  theme: string;
  interestCategory: string;
  morning: { title: string; desc: string; pillar: string; est: string; cost: number };
  afternoon: { title: string; desc: string; pillar: string; est: string; cost: number };
  evening: { title: string; desc: string; pillar: string; est: string; cost: number };
}

const VIETNAM_DAY_TEMPLATES: Record<string, DestinationDayTemplate[]> = {
  'ha-noi': [
    {
      theme: 'Thăng Long Ancient Guilds & Literature Heritage',
      interestCategory: 'Heritage & History',
      morning: {
        title: '08:00 AM — Dawn Pho Ritual & Hoàn Kiếm Lake Stroll',
        desc: 'Begin with piping hot Phở Bò Gia Truyền on Bát Đàn street, followed by a peaceful walk across the scarlet Thê Húc bridge.',
        pillar: 'Food & Cuisine',
        est: '2.5 Hours',
        cost: 75000,
      },
      afternoon: {
        title: '01:30 PM — Temple of Literature & Doctor Stelae Courtyards',
        desc: 'Explore Vietnam’s first imperial university founded in 1070, contemplating stone turtles carrying stelae of doctoral scholars.',
        pillar: 'Heritage & History',
        est: '2.0 Hours',
        cost: 30000,
      },
      evening: {
        title: '06:30 PM — Hanoi Egg Coffee & Evening Old Quarter Street Food',
        desc: 'Sip legendary whipped egg yolk coffee at Café Giảng, followed by charcoal-grilled Bún Chả near the historic guild lanes.',
        pillar: 'Food & Cuisine',
        est: '2.5 Hours',
        cost: 110000,
      },
    },
    {
      theme: 'Red River Artisan Ceramics & French Boulevard Architecture',
      interestCategory: 'Art & Craft',
      morning: {
        title: '08:30 AM — Bát Tràng Ceramic Wheel Atelier Session',
        desc: 'Cross the Long Biên bridge to throw alluvial clay on foot-wheels with 5th-generation pottery masters.',
        pillar: 'Living Crafts & Ateliers',
        est: '3.0 Hours',
        cost: 180000,
      },
      afternoon: {
        title: '02:00 PM — French Colonial Architecture & National Fine Arts Museum',
        desc: 'Wander shaded Phan Đình Phùng boulevards and examine ancient Champa sandstone and lacquer masterworks at the Fine Arts Museum.',
        pillar: 'Architecture & Spaces',
        est: '2.5 Hours',
        cost: 40000,
      },
      evening: {
        title: '07:00 PM — West Lake (Hồ Tây) Sunset & Chả Cá Lăng',
        desc: 'Sunset tea by the ancient Trấn Quốc Pagoda, dining on turmeric fish sizzled with dill and scallions.',
        pillar: 'Food & Cuisine',
        est: '2.0 Hours',
        cost: 160000,
      },
    },
  ],

  'ha-giang': [
    {
      theme: 'Happiness Road Ascent & Heaven Gate Passes',
      interestCategory: 'Nature & Mountains',
      morning: {
        title: '08:00 AM — Departure from Ha Giang City through Bắc Sum Pass',
        desc: 'Climb dramatic switchbacks to Quản Bạ Heaven’s Gate overlooking twin fairy limestone hills.',
        pillar: 'Nature & Mountains',
        est: '3.5 Hours',
        cost: 50000,
      },
      afternoon: {
        title: '01:30 PM — Lùng Tám H’mong Hemp Weaving Atelier',
        desc: 'Learn ancient hemp peeling, hand thread-spinning, and natural cold vat indigo dyeing with cooperative weavers.',
        pillar: 'Living Crafts & Ateliers',
        est: '2.5 Hours',
        cost: 100000,
      },
      evening: {
        title: '06:30 PM — Hearthside Homestay Supper in Yên Minh',
        desc: 'Share wood-fired black chicken hotpot, wild forest mustard greens, and fragrant local corn wine with local hosts.',
        pillar: 'Food & Cuisine',
        est: '2.0 Hours',
        cost: 150000,
      },
    },
    {
      theme: 'The Great Karst Canyon & Sovereign Frontier',
      interestCategory: 'Adventure & Outdoor',
      morning: {
        title: '07:30 AM — Mã Pí Lèng Skywalk & Panoramic Overlook',
        desc: 'Walk along the cliffside path 1,500m above sea level gazing straight down into Tu Sản canyon.',
        pillar: 'Nature & Mountains',
        est: '3.0 Hours',
        cost: 40000,
      },
      afternoon: {
        title: '01:00 PM — Tu Sản Emerald River Boat Navigation',
        desc: 'Descend to the jade waters of the Nho Quế river for a scenic boat cruise through the narrow limestone gorge.',
        pillar: 'Adventure & Outdoor',
        est: '2.5 Hours',
        cost: 120000,
      },
      evening: {
        title: '06:30 PM — Đồng Văn Ancient Stone Quarter Gathering',
        desc: 'Explore 100-year-old clay and stone houses, tasting freshly grilled buckwheat seed cakes around open coals.',
        pillar: 'Heritage & History',
        est: '2.0 Hours',
        cost: 80000,
      },
    },
  ],

  'thua-thien-hue': [
    {
      theme: 'Nguyễn Imperial Majesty & Purple Forbidden City',
      interestCategory: 'Heritage & History',
      morning: {
        title: '08:00 AM — Imperial City (Đại Nội) & Meridian Gate Walk',
        desc: 'Enter the walled royal fortress, inspecting the Thai Hoa Palace throne room and Nine Dynastic Urns.',
        pillar: 'Heritage & History',
        est: '3.0 Hours',
        cost: 200000,
      },
      afternoon: {
        title: '01:30 PM — Perfume River Dragon Boat to Chùa Thiên Mụ',
        desc: 'Cruise past garden villas to the iconic 7-story octagonal pagoda overlooking the river bend.',
        pillar: 'Architecture & Spaces',
        est: '2.5 Hours',
        cost: 100000,
      },
      evening: {
        title: '06:30 PM — Imperial Royal Cuisine & Spicy Bún Bò Huế',
        desc: 'Taste rich lemongrass beef noodle broth followed by delicate steamed Bánh Bèo, Nậm, Lọc on Cồn Hến island.',
        pillar: 'Food & Cuisine',
        est: '2.0 Hours',
        cost: 90000,
      },
    },
    {
      theme: 'Forest Mausoleums & Incense Hamlet Traditions',
      interestCategory: 'Living Crafts & Ateliers',
      morning: {
        title: '08:30 AM — Tự Đức Emperor Pine Forest Mausoleum',
        desc: 'Wander the poetic pavilion and lotus lake where the poet-emperor retreated to compose verse.',
        pillar: 'Heritage & History',
        est: '2.5 Hours',
        cost: 150000,
      },
      afternoon: {
        title: '01:30 PM — Thủy Xuân Herbal Agarwood Incense Crafting',
        desc: 'Learn the ancestral craft of rolling cinnamon, star anise, and agarwood paste onto colorful bamboo incense bouquets.',
        pillar: 'Living Crafts & Ateliers',
        est: '2.0 Hours',
        cost: 50000,
      },
      evening: {
        title: '06:30 PM — Traditional Hue Folk Music Singing on the River',
        desc: 'Listen to acoustic traditional court lutes and folk singing while floating on candle-lit wooden sampans.',
        pillar: 'Music & Traditional Soundscapes',
        est: '2.0 Hours',
        cost: 120000,
      },
    },
  ],

  'quang-nam-hoian': [
    {
      theme: 'Ancient Silk Port & Japanese Covered Bridge Alleys',
      interestCategory: 'Heritage & History',
      morning: {
        title: '08:00 AM — Pedestrian Morning in the Ancient Shophouses',
        desc: 'Stroll the quiet ochre streets before crowds arrive; visit the 17th-century Japanese Covered Bridge and Tấn Ký House.',
        pillar: 'Heritage & History',
        est: '2.5 Hours',
        cost: 120000,
      },
      afternoon: {
        title: '01:30 PM — Kim Bồng Carpentry & Master Wood Joinery',
        desc: 'Take a short wooden ferry across the Thu Bồn to meet woodcarvers and traditional fishing boat builders.',
        pillar: 'Living Crafts & Ateliers',
        est: '2.5 Hours',
        cost: 50000,
      },
      evening: {
        title: '06:30 PM — Lantern Twilight & Authentic Cao Lầu Noodles',
        desc: 'Watch thousands of silk lanterns glow along the river while dining on signature chewy Cao Lầu noodles with char siu pork.',
        pillar: 'Food & Cuisine',
        est: '2.5 Hours',
        cost: 85000,
      },
    },
  ],

  'quang-binh-phongnha': [
    {
      theme: 'Deep Limestone Caverns & River Speleology',
      interestCategory: 'Adventure & Outdoor',
      morning: {
        title: '08:00 AM — Paradise Cave (Động Thiên Đường) Exploration',
        desc: 'Descend into colossal subterranean cathedral chambers adorned with thousands of crystalline mineral stalagmites.',
        pillar: 'Nature & Mountains',
        est: '3.5 Hours',
        cost: 250000,
      },
      afternoon: {
        title: '01:30 PM — Son River Boat & Phong Nha Water Cave',
        desc: 'Glide on wooden motorboats into the underground river cavern surrounded by dark water and limestone vaults.',
        pillar: 'Adventure & Outdoor',
        est: '2.5 Hours',
        cost: 150000,
      },
      evening: {
        title: '06:30 PM — Riverside Wild River Fish & Jungle Herb Feast',
        desc: 'Dine on fresh Son river carp and wild mountain ferns (rau dớn) seasoned with local chili garlic dip.',
        pillar: 'Food & Cuisine',
        est: '2.0 Hours',
        cost: 140000,
      },
    },
  ],

  'tp-ho-chi-minh': [
    {
      theme: 'Historic Saigon Boulevards & Alleyway Food Safaris',
      interestCategory: 'Food & Cuisine',
      morning: {
        title: '08:00 AM — Saigon Notre-Dame & Central Post Office Promenade',
        desc: 'Walk through French colonial landmarks and sip iced milk coffee (cà phê sữa đá) under centuries-old tamarind trees.',
        pillar: 'Architecture & Spaces',
        est: '2.5 Hours',
        cost: 40000,
      },
      afternoon: {
        title: '01:30 PM — Historic Chợ Lớn (Chinatown) & Thiên Hậu Pagoda',
        desc: 'Wander ancient medicine dispensaries, hanging coiled incense temples, and bustling wholesale silk markets.',
        pillar: 'Culture & Festivals',
        est: '3.0 Hours',
        cost: 30000,
      },
      evening: {
        title: '06:30 PM — Back-Alley Broken Rice (Cơm Tấm) & Sizzling Bánh Xèo',
        desc: 'Indulge in charcoal-grilled pork chop broken rice followed by crispy Southern pancakes wrapped in mustard greens.',
        pillar: 'Food & Cuisine',
        est: '2.5 Hours',
        cost: 110000,
      },
    },
  ],

  'can-tho-mekong': [
    {
      theme: 'Mekong River Rhythms & Dawn Floating Market',
      interestCategory: 'Culture & Festivals',
      morning: {
        title: '05:30 AM — Dawn Longtail Boat to Cái Răng Floating Market',
        desc: 'Witness morning wholesale fruit trade on the river, tasting hot noodle soup passed boat-to-boat in morning mist.',
        pillar: 'Culture & Festivals',
        est: '3.5 Hours',
        cost: 150000,
      },
      afternoon: {
        title: '01:30 PM — Shade-Grown Cacao Orchard Harvest & Dark Chocolate',
        desc: 'Walk through family-owned cacao groves, taste fresh sweet white pulp, and grind pure dark chocolate.',
        pillar: 'Living Crafts & Ateliers',
        est: '2.5 Hours',
        cost: 60000,
      },
      evening: {
        title: '06:30 PM — Riverside Crispy Gourami & Sunset Cocktails',
        desc: 'Roll crispy fried elephant ear fish in fresh rice paper with starfruit, herbs, and sweet-salty tamarind dip.',
        pillar: 'Food & Cuisine',
        est: '2.0 Hours',
        cost: 140000,
      },
    },
  ],

  'kien-giang-phuquoc': [
    {
      theme: 'Turquoise Coral Bays & Heritage Fish Sauce Lineages',
      interestCategory: 'Beaches & Islands',
      morning: {
        title: '08:30 AM — An Thới Wooden Boat Coral Snorkeling Cruise',
        desc: 'Sail to secluded coral reefs and shallow turquoise lagoons around May Rut and Gam Ghi islets.',
        pillar: 'Nature & Mountains',
        est: '4.0 Hours',
        cost: 350000,
      },
      afternoon: {
        title: '02:00 PM — Ancestral 15-Ton Wooden Barrel Fish Sauce Vaults',
        desc: 'Tour historic barrel houses fermenting black anchovies and salt for 12 months in giant litsea timber vats.',
        pillar: 'Living Crafts & Ateliers',
        est: '1.5 Hours',
        cost: 20000,
      },
      evening: {
        title: '06:30 PM — Sunset Herring Salad & Night Market Grilled Squid',
        desc: 'Taste raw herring salad with grated fresh coconut, followed by charcoal-grilled eggs squid with green pepper dip.',
        pillar: 'Food & Cuisine',
        est: '2.5 Hours',
        cost: 180000,
      },
    },
  ],
};

function calculateBudgetBreakdown(
  durationDays: number,
  budgetRange: BudgetRange,
  travelersCount = 1,
  totalActivitiesVND = 0
): BudgetBreakdown {
  let dailyHotelVND = 500000;
  let dailyDiningVND = 250000;
  let dailyTransportVND = 150000;

  if (budgetRange === 'Comfort Explorer') {
    dailyHotelVND = 1200000;
    dailyDiningVND = 500000;
    dailyTransportVND = 300000;
  } else if (budgetRange === 'Luxury Heritage') {
    dailyHotelVND = 3500000;
    dailyDiningVND = 1200000;
    dailyTransportVND = 700000;
  }

  const accommodationTotal = dailyHotelVND * durationDays;
  const diningTotal = dailyDiningVND * durationDays * travelersCount;
  const transportTotal = dailyTransportVND * durationDays * travelersCount;
  const activitiesTotal = (totalActivitiesVND || 200000 * durationDays) * travelersCount;

  const grandTotalVND = accommodationTotal + diningTotal + transportTotal + activitiesTotal;
  const grandTotalUSD = Math.round(grandTotalVND / 25400); // realistic VND to USD exchange rate
  const perPersonDailyVND = Math.round(grandTotalVND / (durationDays * travelersCount));

  return {
    currency: 'VND / USD',
    totalEstimateVND: grandTotalVND,
    totalEstimateUSD: grandTotalUSD,
    perPersonDailyVND,
    accommodationTotalVND: accommodationTotal,
    diningTotalVND: diningTotal,
    activitiesTotalVND: activitiesTotal,
    localTransportTotalVND: transportTotal,
    disclaimer: 'Estimates based on regional averages in Vietnam. Local prices vary by season and booking date.',
  };
}

export function generateCulturalItineraryDraft(params: GenerateItineraryParams): ItineraryDraft {
  const {
    destination,
    durationDays,
    budgetRange,
    travelPace,
    culturalInterests = [],
    foodPreferences = [],
    startingLocation = 'Hà Nội, Vietnam',
    travelersCount = 1,
    transportPreference = 'Reunification Express Train',
  } = params;

  // Resolve matching Vietnam destination
  const matchedDest =
    vietnamDestinations.find(
      (d) =>
        d.id === destination.toLowerCase().trim() ||
        d.name.toLowerCase().includes(destination.toLowerCase().trim()) ||
        destination.toLowerCase().includes(d.name.toLowerCase())
    );

  const destinationName = matchedDest
    ? matchedDest.name
    : destination.toLowerCase().includes('kyoto')
    ? 'Kyoto, Japan'
    : destination;
  const destId = matchedDest ? matchedDest.id : 'ha-noi';
  const country = destination.toLowerCase().includes('kyoto') ? 'Japan' : 'Vietnam';

  // Feasibility Check: Evaluate origin vs destination regional separation
  let feasibilityStatus: 'Feasible Itinerary' | 'Requires Manual Review (Regional Distance Alert)' = 'Feasible Itinerary';
  let feasibilityWarning: string | undefined = undefined;

  const originLower = startingLocation.toLowerCase();
  const destRegion = matchedDest?.region;

  const isOriginSouth = originLower.includes('hồ chí minh') || originLower.includes('saigon') || originLower.includes('cần thơ');
  const isOriginNorth = originLower.includes('hà nội') || originLower.includes('hanoi');

  if (isOriginSouth && destRegion === 'Northern Vietnam' && durationDays <= 2 && transportPreference !== 'Domestic Flights') {
    feasibilityStatus = 'Requires Manual Review (Regional Distance Alert)';
    feasibilityWarning = 'Overland transit between Southern Vietnam and Northern High Mountains requires minimum 2 full travel days (>1,800km). Without direct domestic flights, this short itinerary is not physically feasible.';
  } else if (isOriginNorth && destRegion === 'Southern Vietnam' && durationDays <= 2 && transportPreference === 'Motorbike Loop') {
    feasibilityStatus = 'Requires Manual Review (Regional Distance Alert)';
    feasibilityWarning = 'Motorbike transit from Northern to Southern Vietnam exceeds 1,700km and requires minimum 10+ travel days. Domestic flights with on-site motorbike rental recommended.';
  }

  const templates = VIETNAM_DAY_TEMPLATES[destId] || VIETNAM_DAY_TEMPLATES['ha-noi'];

  const days: ItineraryDay[] = [];
  let totalActivitiesCost = 0;

  for (let dayNum = 1; dayNum <= durationDays; dayNum++) {
    const templateIndex = (dayNum - 1) % templates.length;
    const t = templates[templateIndex];

    const isCycling = dayNum > templates.length;
    const titleSuffix = isCycling ? ` (Part ${dayNum})` : '';

    const activities: ItineraryActivity[] = [
      {
        id: `act-${dayNum}-1`,
        timeOfDay: 'Morning',
        title: `${t.morning.title}${titleSuffix}`,
        description: t.morning.desc,
        culturalPillar: t.morning.pillar,
        matchedInterest: culturalInterests[0] || t.morning.pillar,
        estimatedDuration: t.morning.est,
        unverifiedEstimateNotice: 'Opening hours and schedules subject to local variations.',
        costEstimateVND: t.morning.cost,
      },
      ...(travelPace === 'Unhurried'
        ? []
        : [
            {
              id: `act-${dayNum}-2`,
              timeOfDay: 'Afternoon' as const,
              title: `${t.afternoon.title}${titleSuffix}`,
              description: t.afternoon.desc,
              culturalPillar: t.afternoon.pillar,
              matchedInterest: culturalInterests[1] || t.afternoon.pillar,
              estimatedDuration: t.afternoon.est,
              unverifiedEstimateNotice: 'Verify tickets locally or through official site counters.',
              costEstimateVND: t.afternoon.cost,
            },
          ]),
      {
        id: `act-${dayNum}-3`,
        timeOfDay: 'Evening',
        title: `${t.evening.title}${titleSuffix}`,
        description: t.evening.desc,
        culturalPillar: t.evening.pillar,
        matchedInterest: foodPreferences[0] || t.evening.pillar,
        estimatedDuration: t.evening.est,
        unverifiedEstimateNotice: 'Street food stall availability varies by weather and evening hour.',
        costEstimateVND: t.evening.cost,
      },
    ];

    const dayCost = activities.reduce((sum, act) => sum + (act.costEstimateVND || 0), 0);
    totalActivitiesCost += dayCost;

    days.push({
      dayNumber: dayNum,
      title: `Day ${dayNum}: ${t.theme}${titleSuffix}`,
      theme: `${t.theme}${titleSuffix}`,
      interestExplanation: `Curated for an ${travelPace.toLowerCase()} pace, reflecting traveler cultural interests and highlighting ${t.interestCategory} with signature local specialties.`,
      activities,
      estimatedDailyBudgetVND: dayCost,
    });
  }

  const budgetBreakdown = calculateBudgetBreakdown(
    durationDays,
    budgetRange,
    travelersCount,
    totalActivitiesCost
  );

  return {
    id: `draft-vn-${Date.now()}`,
    title: `${durationDays}-Day ${destinationName} Cultural Exploration`,
    destinationName,
    country,
    destinationId: destId,
    durationDays,
    budgetRange,
    travelPace,
    startingLocation,
    transportPreference,
    matchedCulturalInterests: culturalInterests.length > 0 ? culturalInterests : (matchedDest?.categories || ['Heritage & History']),
    foodAndExperienceFocus: foodPreferences.length > 0 ? foodPreferences : (matchedDest?.mustTryFood.map((f) => f.name) || ['Local Specialties']),
    days,
    budgetBreakdown,
    feasibilityStatus,
    feasibilityWarning,
    disclaimers: CONCIERGE_DISCLAIMERS,
    createdAt: new Date().toISOString(),
  };
}

export function convertDraftToTrip(draft: ItineraryDraft): Trip {
  const coverImage =
    vietnamDestinations.find((d) => d.id === draft.destinationId)?.heroImage ||
    'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800&auto=format&fit=crop';

  const dayNotes: Record<number, string> = {};
  draft.days.forEach((day, index) => {
    if (day.notes) {
      dayNotes[day.dayNumber || index + 1] = day.notes;
    }
  });

  return {
    id: `trip-${Date.now()}`,
    title: draft.title,
    destination: draft.destinationName.includes(',') ? draft.destinationName : `${draft.destinationName}, Vietnam`,
    country: draft.country,
    startDate: 'Planned Journey',
    endDate: `${draft.durationDays} Days`,
    status: 'planning',
    coverImage,
    daysCount: draft.durationDays,
    travelersCount: 1,
    itineraryStops: draft.days.map((d) => d.theme || d.activities[0]?.title || 'Exploration'),
    destinationId: draft.destinationId,
    tags: draft.matchedCulturalInterests,
    highlights: draft.days.map((d) => d.theme),
    days: draft.days,
    dayNotes: Object.keys(dayNotes).length > 0 ? dayNotes : undefined,
    notes: `Pace: ${draft.travelPace} • Budget: ${draft.budgetRange} • Starting: ${draft.startingLocation} • Total Est: ${draft.budgetBreakdown.totalEstimateVND.toLocaleString()} VND.`,
  };
}

export const generateItinerary = generateCulturalItineraryDraft;

