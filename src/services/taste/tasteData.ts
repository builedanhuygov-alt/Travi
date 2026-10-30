import type { TasteProfile } from '../../types/index.ts';

export interface TastePillarConfig {
  id: keyof Omit<TasteProfile, 'updatedAt' | 'isCustomized'>;
  label: string;
  tagline: string;
  badge: string;
  options: {
    id: string;
    label: string;
    description: string;
  }[];
}

export const TASTE_PILLARS: TastePillarConfig[] = [
  {
    id: 'films',
    label: 'Storytelling & Cinema',
    tagline: 'Visual narratives, poetic pacing, and cultural memory that move you.',
    badge: 'Visual Narrative',
    options: [
      { id: 'film-tonkin', label: 'Indochine Poetic Landscapes & Nostalgia', description: 'Emerald limestone waters, French colonial verandahs, and river mists' },
      { id: 'film-rural', label: 'Pastoral Vietnam & Rural Realism', description: 'Water buffalo, golden harvest paddies, and village communal houses' },
      { id: 'film-slow-doc', label: 'Heritage & Craft Documentaries', description: 'Deep observation of master ceramicists, weavers, and ancestral woodworkers' },
      { id: 'film-epics', label: 'Dynastic Imperial Chronicles', description: 'Walled citadels, court rituals, royal scholars, and ancient poetry' },
      { id: 'film-highland', label: 'Highland Frontier Epics', description: 'Cloud-shrouded limestone passes, ethnic horse paths, and fire hearths' },
      { id: 'film-urban', label: 'Contemporary Saigon & Hanoi Rhythms', description: 'Bustling alleyway street life, scooter choreographies, and twilight coffee' },
    ],
  },
  {
    id: 'music',
    label: 'Music & Traditional Soundscapes',
    tagline: 'The auditory textures and ambient frequencies you travel with.',
    badge: 'Acoustic Soul',
    options: [
      { id: 'mus-nha-nhac', label: 'Hue Imperial Court Music (Nhã Nhạc)', description: 'UNESCO-recognized royal bronze gongs, clappers, and court strings' },
      { id: 'mus-quan-ho', label: 'Quan Họ Folk Antiphonal Singing', description: 'Sweet call-and-response vocal poetry from ancient Kinh Bắc villages' },
      { id: 'mus-dan-bau', label: 'Đàn Bầu Monochord & Traditional Bamboo Flutes', description: 'Bending single-string harmonics and meditative mountain flutes' },
      { id: 'mus-gong', label: 'Central Highlands Sacred Gong Polyphony', description: 'Resonant bronze and brass gongs echoing through Ede longhouses' },
      { id: 'mus-don-ca', label: 'Đờn Ca Tài Tử Southern Chamber Folk', description: 'Moon lutes and melancholic acoustic ballads along Mekong canals' },
      { id: 'mus-ambient', label: 'Ambient Temple Chants & Dawn River Sounds', description: 'Monastic bell chimes, river bird calls, and rhythmic paddle strokes' },
    ],
  },
  {
    id: 'food',
    label: 'Food & Regional Gastronomy',
    tagline: 'Hyper-regional broths, street market secrets, and ancestral terroir.',
    badge: 'Palate Terroir',
    options: [
      { id: 'food-pho', label: 'Northern Pho & Simmered Bone Broths', description: 'Star anise, charred ginger, tender brisket, and hand-cut rice noodles' },
      { id: 'food-hue', label: 'Hue Imperial Cuisine & Lemongrass Broths', description: 'Spicy Bún Bò Huế, delicate Bánh Bèo, and royal culinary presentation' },
      { id: 'food-street', label: 'Saigon Alleyway Broken Rice & Sizzling Pancakes', description: 'Charcoal-grilled pork chops, crispy Bánh Xèo, and fresh herb bouquets' },
      { id: 'food-tea', label: 'Centuries-Old Shan Tuyết Tea & Arabica Coffee', description: 'Wild mossy mountain tea trees in Ha Giang and volcanic basalt coffee' },
      { id: 'food-ferment', label: 'Heritage Fish Sauce & Wild Herb Lineages', description: '12-month barrel fermented anchovies from Phu Quoc and mountain pepper' },
      { id: 'food-mekong', label: 'Mekong Floating Market Delicacies', description: 'Freshwater fish, crisp gourami, sesbania flowers, and fruit orchards' },
    ],
  },
  {
    id: 'architecture',
    label: 'Architecture & Spaces',
    tagline: 'Spatial vernaculars, timber joinery, and sacred structures.',
    badge: 'Spatial Heritage',
    options: [
      { id: 'arch-guild', label: 'Hanoi Tube Houses & Ancient Guild Quarters', description: 'Narrow timber and clay shophouses framing inner courtyards' },
      { id: 'arch-citadel', label: 'Imperial Citadels & Royal Mausoleums', description: 'Walled royal compounds, feng shui geomancy, and lotus moats in Hue' },
      { id: 'arch-cham', label: 'Ancient Champa Red-Brick Temples', description: 'Mortarless fired-brick towers in Mỹ Sơn, Quy Nhơn, and Nha Trang' },
      { id: 'arch-stilt', label: 'Highland Wooden Stilt Houses & Ede Longhouses', description: 'Hand-hewn timber beams, thatched roofs, and matrilineal ladders' },
      { id: 'arch-french', label: 'Indochine French Colonial & Art Deco Villas', description: 'Louvered shutters, ochre plaster, and high arched colonnades' },
      { id: 'arch-pagoda', label: 'Timber Pagodas & Courtyard Shrines', description: 'Multi-tiered curved roofs, guardian dragons, and bell pavilions' },
    ],
  },
  {
    id: 'art',
    label: 'Living Crafts & Ateliers',
    tagline: 'Ancestral handicrafts, textiles, and tactile materials.',
    badge: 'Tactile Art',
    options: [
      { id: 'art-indigo', label: 'Botanical Indigo Dyeing & H’mong Hemp Weaving', description: 'Beeswax batik drawing and natural cold vat indigo dyeing' },
      { id: 'art-ceramic', label: 'Bát Tràng Alluvial Clay Wheel Pottery', description: 'Hand-thrown stoneware, cobalt blue glazes, and wood-fired kilns' },
      { id: 'art-incense', label: 'Hand-Rolled Agarwood & Herbal Incense', description: 'Cinnamon and star anise incense bouquets dried under the Hue sun' },
      { id: 'art-silk', label: 'Hội An Silk Weaving & Lantern Craft', description: 'Silkworm cocoons, foot looms, and bamboo lantern framing' },
      { id: 'art-wood', label: 'Kim Bồng Master Wood Joinery & Boatbuilding', description: 'Carved temple pillars and traditional Thu Bồn river craft' },
      { id: 'art-lacquer', label: 'Traditional Vietnamese Lacquer Painting (Sơn Mài)', description: 'Polished sap layers, eggshell inlays, and gold leaf burnishing' },
    ],
  },
  {
    id: 'history',
    label: 'History & Dynastic Eras',
    tagline: 'Historical epochs, legendary kingdoms, and cultural memory.',
    badge: 'Epoch & Heritage',
    options: [
      { id: 'hist-dynasties', label: 'Millennium of Independent Dynasties (Lý, Trần, Lê)', description: 'Thăng Long scholars, Confucian exams, and battlefield defenses' },
      { id: 'hist-nguyen', label: 'Nguyễn Dynasty & Royal Phú Xuân Court', description: 'The 19th-century empire, court robes, calligraphy, and poetry' },
      { id: 'hist-champa', label: 'Maritime Champa Kingdoms (Vijaya, Kauthara, Panduranga)', description: 'Sanskrit inscriptions, maritime trade, and sacred Shiva shrines' },
      { id: 'hist-trade-ports', label: 'Faifo & Maritime Silk Road Trading Era', description: 'Centuries of international commerce in Hoi An with Japan and Europe' },
      { id: 'hist-revo', label: '20th-Century Historical Turning Points', description: 'Pác Bó cave cradle, Điện Biên Phủ, and the Reunification Express' },
    ],
  },
  {
    id: 'nature',
    label: 'Nature, Karsts & Terrains',
    tagline: 'Geological wonders, microclimates, and flora.',
    badge: 'Living Earth',
    options: [
      { id: 'nat-karst', label: 'Towering Limestone Karsts & Deep River Canyons', description: 'Ha Giang’s Ma Pi Leng, Ha Long Bay, and Ninh Binh pinnacles' },
      { id: 'nat-caves', label: 'Subterranean River Caves & Speleology', description: 'Phong Nha-Kẻ Bàng, Sơn Đoòng, and crystal limestone caverns' },
      { id: 'nat-terraces', label: 'Mountain Rice Terraces & Cloud Valleys', description: 'Cascading agricultural stairways in Mù Cang Chải and Sa Pa' },
      { id: 'nat-islands', label: 'Turquoise Coral Archipelagoes & White Sands', description: 'Côn Đảo turtle sanctuaries and Phú Quốc palm-fringed bays' },
      { id: 'nat-pines', label: 'Cool Pine Highlands & Misty Waterfalls', description: 'High-altitude plateaus in Dalat and Mang Den with fresh breezes' },
      { id: 'nat-mangrove', label: 'Mekong Delta Mangroves & Lotus Lakes', description: 'Flooded cajuput forests, duckweed waterways, and river deltas' },
    ],
  },
  {
    id: 'localCulture',
    label: 'Local Rhythms & Travel Pace',
    tagline: 'Everyday life, social rituals, and preferred rhythm.',
    badge: 'Social Rhythm',
    options: [
      { id: 'pace-dawn', label: 'Dawn Market Awakenings & Morning Lake Walks', description: 'Rise with morning market vendors and tai chi practitioners at dawn' },
      { id: 'pace-hearth', label: 'Hearthside Highland Homestays', description: 'Evenings around wood fires with ethnic Tay, Dao, and H’mong families' },
      { id: 'pace-unhurried', label: 'Unhurried Alley Cycling & Café Solitude', description: 'Two deep cultural encounters per day with ample time for serendipity' },
      { id: 'pace-river', label: 'River Sampan Navigation & Fishing Hamlets', description: 'Drifting down quiet canals with local boaters and tidal rhythms' },
      { id: 'pace-expedition', label: 'High Pass Motorcycle & Trail Expeditions', description: 'Active days conquering mountain switchbacks and scenic overlooks' },
    ],
  },
];

export const TASTE_PRESETS: {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  description: string;
  profile: Partial<TasteProfile>;
}[] = [
  {
    id: 'preset-highland',
    name: 'Northern Karst & Highland Explorer',
    tagline: 'Towering limestone canyons, H’mong hemp ateliers, and cool pass breezes.',
    badge: 'Highland Frontier',
    description: 'Designed for explorers drawn to dramatic geological cliffs, ethnic weaving traditions, and wild mountain tea.',
    profile: {
      films: ['Highland Frontier Epics', 'Heritage & Craft Documentaries'],
      music: ['Đàn Bầu Monochord & Traditional Bamboo Flutes', 'Ambient Temple Chants & Dawn River Sounds'],
      food: ['Northern Pho & Simmered Bone Broths', 'Centuries-Old Shan Tuyết Tea & Arabica Coffee'],
      architecture: ['Highland Wooden Stilt Houses & Ede Longhouses'],
      art: ['Botanical Indigo Dyeing & H’mong Hemp Weaving'],
      history: ['Millennium of Independent Dynasties (Lý, Trần, Lê)'],
      nature: ['Towering Limestone Karsts & Deep River Canyons', 'Mountain Rice Terraces & Cloud Valleys'],
      localCulture: ['Hearthside Highland Homestays', 'High Pass Motorcycle & Trail Expeditions'],
    },
  },
  {
    id: 'preset-heritage',
    name: 'Central Heritage & Imperial Gastronome',
    tagline: 'Royal citadels, ancient trade ports, and delicate imperial gastronomy.',
    badge: 'Royal & Silk Road',
    description: 'A curated journey through the dynastic courts of Hue, the silk lanterns of Hoi An, and sacred Champa temples.',
    profile: {
      films: ['Dynastic Imperial Chronicles', 'Heritage & Craft Documentaries'],
      music: ['Hue Imperial Court Music (Nhã Nhạc)'],
      food: ['Hue Imperial Cuisine & Lemongrass Broths', 'Heritage Fish Sauce & Wild Herb Lineages'],
      architecture: ['Imperial Citadels & Royal Mausoleums', 'Ancient Champa Red-Brick Temples'],
      art: ['Hội An Silk Weaving & Lantern Craft', 'Hand-Rolled Agarwood & Herbal Incense'],
      history: ['Nguyễn Dynasty & Royal Phú Xuân Court', 'Faifo & Maritime Silk Road Trading Era'],
      nature: ['Turquoise Coral Archipelagoes & White Sands'],
      localCulture: ['Unhurried Alley Cycling & Café Solitude'],
    },
  },
  {
    id: 'preset-mekong-coastal',
    name: 'Mekong Waterways & Island Sanctuaries',
    tagline: 'Dawn floating markets, coastal turtle reserves, and fresh tropical fruit.',
    badge: 'Water & Islands',
    description: 'For travelers seeking the unhurried pulse of the Mekong Delta, water coconut canals, and island serenity.',
    profile: {
      films: ['Pastoral Vietnam & Rural Realism'],
      music: ['Đờn Ca Tài Tử Southern Chamber Folk', 'Ambient Temple Chants & Dawn River Sounds'],
      food: ['Mekong Floating Market Delicacies', 'Saigon Alleyway Broken Rice & Sizzling Pancakes'],
      architecture: ['Indochine French Colonial & Art Deco Villas'],
      art: ['Traditional Vietnamese Lacquer Painting (Sơn Mài)'],
      history: ['Faifo & Maritime Silk Road Trading Era'],
      nature: ['Turquoise Coral Archipelagoes & White Sands', 'Mekong Delta Mangroves & Lotus Lakes'],
      localCulture: ['Dawn Market Awakenings & Morning Lake Walks', 'River Sampan Navigation & Fishing Hamlets'],
    },
  },
  {
    id: 'preset-speleology',
    name: 'Wild Caving & Nature Speleologist',
    tagline: 'Subterranean rivers, primeval rain canopies, and hidden mineral caves.',
    badge: 'Wilderness',
    description: 'Focused on world-class cave exploration in Phong Nha, trekking untouched jungle valleys, and karst geology.',
    profile: {
      films: ['Heritage & Craft Documentaries'],
      music: ['Ambient Temple Chants & Dawn River Sounds'],
      food: ['Northern Pho & Simmered Bone Broths'],
      architecture: ['Ancient Champa Red-Brick Temples'],
      art: ['Botanical Indigo Dyeing & H’mong Hemp Weaving'],
      history: ['20th-Century Historical Turning Points'],
      nature: ['Subterranean River Caves & Speleology', 'Towering Limestone Karsts & Deep River Canyons'],
      localCulture: ['High Pass Motorcycle & Trail Expeditions'],
    },
  },
];

export const EMPTY_TASTE_PROFILE: TasteProfile = {
  films: [],
  music: [],
  food: [],
  architecture: [],
  art: [],
  history: [],
  nature: [],
  localCulture: [],
  isCustomized: false,
};

export const CURATED_DEMO_TASTE_PROFILE: TasteProfile = {
  ...TASTE_PRESETS[0].profile,
  films: TASTE_PRESETS[0].profile.films || [],
  music: TASTE_PRESETS[0].profile.music || [],
  food: TASTE_PRESETS[0].profile.food || [],
  architecture: TASTE_PRESETS[0].profile.architecture || [],
  art: TASTE_PRESETS[0].profile.art || [],
  history: TASTE_PRESETS[0].profile.history || [],
  nature: TASTE_PRESETS[0].profile.nature || [],
  localCulture: TASTE_PRESETS[0].profile.localCulture || [],
  updatedAt: new Date().toISOString(),
  isCustomized: true,
};
