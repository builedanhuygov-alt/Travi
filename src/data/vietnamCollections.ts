import type { DiscoveryCollection } from '../types/discovery.ts';

export const curatedEditorialCollections: DiscoveryCollection[] = [
  {
    id: 'col-northern-karst',
    title: 'The Great Northern Karst & Cloud Loop',
    description:
      'From the thousand-year literature courtyards of Hanoi to the tectonic canyons of Mã Pí Lèng and the terraced cloud amphitheatres of Sa Pa.',
    coverImage: 'https://images.unsplash.com/photo-1570784332176-fdd73da66f03?q=80&w=1200&auto=format&fit=crop',
    destinationIds: ['ha-noi', 'ha-giang', 'sa-pa', 'ninh-binh'],
    experienceIds: ['exp-bat-trang-pottery', 'exp-lung-tam-hemp', 'exp-ha-giang-ma-pi-leng-skywalk', 'exp-ninh-binh-trang-an-rowing'],
    storyIds: ['story-lung-tam-hemp-indigo', 'story-dong-van-karst-geopark'],
    isCuratedEditorial: true,
    createdAt: '2026-10-20',
    updatedAt: '2026-10-30',
  },
  {
    id: 'col-imperial-heritage',
    title: 'Imperial Citadels & Lantern Guilds of Central Vietnam',
    description:
      'Immerse in the royal geomancy of the Perfume River, the ancient lantern alleys of Hội An, and centuries of dynastic court cuisine.',
    coverImage: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=1200&auto=format&fit=crop',
    destinationIds: ['hue', 'hoi-an', 'da-nang'],
    experienceIds: ['exp-hue-royal-banquet', 'exp-hue-perfume-river-ca-hue', 'exp-hoi-an-lantern', 'exp-hoi-an-full-moon-lantern'],
    storyIds: ['story-hue-garden-houses'],
    isCuratedEditorial: true,
    createdAt: '2026-10-15',
    updatedAt: '2026-10-30',
  },
  {
    id: 'col-southern-waterways',
    title: 'Mekong River Rhythms & Southern Archipelagos',
    description:
      'Float through the wholesale barges of Cái Răng, savor herbal duck noodles in Chợ Lớn, and snorkel secluded coral bays in Phú Quốc.',
    coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop',
    destinationIds: ['tp-ho-chi-minh', 'can-tho', 'phu-quoc'],
    experienceIds: ['exp-cai-rang-floating-market', 'exp-saigon-cho-lon-street-food', 'exp-phu-quoc-coral-snorkeling'],
    storyIds: ['story-cai-rang-dawn-waterways'],
    isCuratedEditorial: true,
    createdAt: '2026-10-10',
    updatedAt: '2026-10-30',
  },
  {
    id: 'col-craft-lineages',
    title: 'Artisanal Lineages & Living Craft Masters',
    description:
      'Hands-on immersion with 800-year pottery wheels in Bát Tràng, White Hmong indigo vats in Lùng Tám, and bamboo lantern joinery.',
    coverImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1200&auto=format&fit=crop',
    destinationIds: ['ha-noi', 'ha-giang', 'hoi-an'],
    experienceIds: ['exp-bat-trang-pottery', 'exp-lung-tam-hemp', 'exp-hoi-an-lantern'],
    storyIds: ['story-hanoi-pho-lineages', 'story-lung-tam-hemp-indigo'],
    isCuratedEditorial: true,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-30',
  },
];
