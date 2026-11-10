import type { TraviStory } from '../types/discovery.ts';

export const traviStories: TraviStory[] = [
  {
    id: 'story-hanoi-pho-lineages',
    slug: 'the-100-year-broth-lineages-of-hanoi',
    title: 'The 100-Year Broth Lineages of Hanoi Old Quarter',
    subtitle: 'From dawn wood fires to generational bone cauldrons: how one street soup became the sensory soul of a nation.',
    excerpt:
      'Long before phở was celebrated across global capitals, it began as a humble dawn ritual carried through the French-colonial guild streets on bamboo shoulder poles called phở gánh.',
    category: 'Food Origins',
    region: 'Northern Vietnam',
    destinationIds: ['ha-noi'],
    experienceIds: ['exp-hanoi-pho-lineage'],
    author: {
      name: 'Lê Hoàng Minh',
      role: 'Gastronomy Archivist & Cultural Writer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    },
    editor: {
      name: 'Nguyễn Thị Bích Vân',
      role: 'Editor-in-Chief, Travi Vietnam',
    },
    publishedAt: '2026-10-24',
    readTimeMinutes: 6,
    heroImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1400&auto=format&fit=crop',
    imageAttribution: {
      photographer: 'Ammy Ngo',
      source: 'Unsplash',
      license: 'Free Unsplash License',
    },
    featured: true,
    tags: ['Culinary Heritage', 'Hanoi Old Quarter', 'Broth Culture', 'Gastronomy'],
    sections: [
      {
        heading: 'The Dawn of Phở Gánh',
        content:
          'In the early 1900s, as Hanoi awakened under misty autumn skies, the first sounds on Hàng Chiếu and Bát Đàn were not church bells or streetcars, but the hollow wooden click of street soup vendors. Men from Nam Định and rural Hà Đông balanced two woven bamboo baskets on a single shoulder yoke: one housing a smoldering charcoal brazier under an iron pot of marrow broth, the other carrying hand-sliced rice noodles, scallions, and ceramic bowls.',
      },
      {
        quote:
          'A true bowl of Hanoi phở is not embellished with hoisin sauce or mountains of cilantro. Its virtue lies in translucent clarity, charred ginger aroma, and beef sweetness that lingers on the palate long after the bowl is drained.',
      },
      {
        heading: 'The Science of the 24-Hour Simmer',
        content:
          'To understand the broth is to understand patience. Ox bones and beef marrow knuckles are blanched twice before being simmered over low charcoal embers for eighteen to twenty-four hours. Whole cassia cinnamon bark, charred ginger knobs, dried shallots, and cracked black cardamom pods are added in small muslin pouches. The heat must never boil aggressively; the liquid rolls in a slow, almost imperceptible simmer to prevent cloudiness.',
      },
      {
        heading: 'Two Schools: Bát Đàn vs. Lò Đúc',
        content:
          'Hanoi natives fiercely debate the two great philosophies of pho. Phở Gia Truyền on Bát Đàn represents the classical school: tender poached beef flank sliced paper-thin across silky noodles in a clear, delicately aromatic broth. Three kilometers south, Phở Thìn on Lò Đúc invented the flash-fried school (phở tái lăn): beef quickly seared in a smoking wok with garlic and ginger before meeting the broth, imparting a rich caramelized savoriness beloved by generations of night owls.',
      },
    ],
    sources: [
      {
        title: 'Hanoi Street Gastronomy & Phở Origins',
        publisher: 'Vietnam National Institute of Culture and Arts Studies (VICAS)',
        url: 'https://vicas.org.vn',
      },
      {
        title: 'Monograph on Hanoi Urban Culinary History (1900–1954)',
        publisher: 'Hanoi Publishing House',
      },
    ],
  },
  {
    id: 'story-lung-tam-hemp-indigo',
    slug: 'indigo-and-hemp-the-ancient-weaving-of-lung-tam',
    title: 'Indigo & Hemp: The Ancient Weaving of Lùng Tám',
    subtitle: 'High in the northern karst highlands of Hà Giang, White Hmong women preserve a 41-step textile ritual passed down through matrilineal song.',
    excerpt:
      'In the cloud-veiled valleys beneath the Quản Bạ Twin Mountains, the rhythmic clatter of wooden foot-looms tells a story of survival, identity, and botanical genius.',
    category: 'Craft Villages',
    region: 'Northern Vietnam',
    destinationIds: ['ha-giang'],
    experienceIds: ['exp-lung-tam-hemp'],
    author: {
      name: 'Vũ Đăng Khoa',
      role: 'Highland Heritage Documentarian',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    },
    editor: {
      name: 'Nguyễn Thị Bích Vân',
      role: 'Editor-in-Chief, Travi Vietnam',
    },
    publishedAt: '2026-10-18',
    readTimeMinutes: 7,
    heroImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1400&auto=format&fit=crop',
    imageAttribution: {
      photographer: 'Tron Le',
      source: 'Unsplash',
      license: 'Free Unsplash License',
    },
    featured: true,
    tags: ['Ethnic Crafts', 'White Hmong', 'Natural Indigo', 'Sustainable Textiles'],
    sections: [
      {
        heading: 'The Sacred Plant of the Clouds',
        content:
          'For the Hmong people of the northern karst, hemp (cây lanh) is more than a fiber: it is the bridge between the mortal realm and ancestors. A Hmong proverb states: "A girl who does not know how to weave hemp cannot find a husband, and a soul without hemp garments cannot find its way back to the ancestral mountains." Hemp stalks grow in stony soil without chemical fertilizers, harvested by hand when the highland mists recede in late summer.',
      },
      {
        heading: '41 Steps of Living Mastery',
        content:
          'From raw green stalk to finished indigo jacket requires forty-one distinct artisanal procedures. The stalk is dried, stripped into razor-thin ribbons, boiled in wood ash water, and rolled between two massive cylindrical limestone boulders to break down lignins until the fibers resemble fine silk. Only then are they spun into continuous yarn on four-spindle spinning wheels.',
      },
      {
        quote:
          'Indigo is not an industrial dye; it is a living fermentation. It responds to the temperature of the air, the hardness of mountain spring water, and the quiet patience of the hands that tend the vat.',
      },
      {
        heading: 'The Geometry of Beeswax Batik',
        content:
          'Using miniature copper-tipped pens filled with molten beeswax, artisan women draw intricate geometric motifs freehand onto the raw linen. When dipped repeatedly into cold wooden tubs of fermented wild indigo (Chàm), the wax resists the deep navy dye. Boiling the textile in spring water melts the wax, unveiling brilliant stark white spirals, sunbursts, and crop symbols.',
      },
    ],
    sources: [
      {
        title: 'Traditional Textile Technology of the Hmong in Ha Giang',
        publisher: 'Vietnam Museum of Ethnology',
        url: 'https://vme.org.vn',
      },
      {
        title: 'Geopark Ethnic Craft Cooperatives Annual Report',
        publisher: 'Dong Van Karst Plateau UNESCO Geopark',
      },
    ],
  },
  {
    id: 'story-hue-garden-houses',
    slug: 'the-garden-houses-of-kim-long',
    title: 'The Garden Houses of Kim Long: Preserving Royal Huế’s Living Architecture',
    subtitle: 'Behind green tea hedges along the Perfume River, timber-frame nhà vườn harmonize geomancy, feng shui, and aristocratic leisure.',
    excerpt:
      'While the Imperial Citadel housed the monarch, the surrounding riverside communes nurtured a civilized pastoral lifestyle defined by wooden joinery, private orchards, and chamber music.',
    category: 'Heritage & Lineage',
    region: 'Central Vietnam',
    destinationIds: ['hue'],
    experienceIds: ['exp-hue-royal-banquet', 'exp-hue-perfume-river-ca-hue'],
    author: {
      name: 'Trần Bửu Thọ',
      role: 'Huế Architectural Historian',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    },
    publishedAt: '2026-10-12',
    readTimeMinutes: 5,
    heroImage: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=1400&auto=format&fit=crop',
    imageAttribution: {
      photographer: 'Minh Pham',
      source: 'Unsplash',
      license: 'Free Unsplash License',
    },
    featured: false,
    tags: ['Hue Heritage', 'Garden Houses', 'Traditional Architecture', 'Nguyen Dynasty'],
    sections: [
      {
        heading: 'The Architecture of Harmony',
        content:
          'A Huế garden house (nhà vườn) is never just a building; it is a miniature universe structured according to classical geomancy (phong thủy). A brick screen wall (bình phong) guards the entrance against malefic spirits, standing before a reflective lotus pool that gathers positive energy. Beyond lies the central three-bay, two-wing timber pavilion (nhà rường) crafted entirely from ironwood (gỗ lim) using mortise-and-tenon joints without a single iron nail.',
      },
      {
        heading: 'Orchards as Living Air Conditioners',
        content:
          'Surrounding the wooden dwelling is a deliberate canopy of fruit trees: fragrant Thanh Trà pomelos, betel nut palms, starfruit, and sweet jackfruit. During Central Vietnam’s scorching summer months, this lush microclimate lowers ambient temperature by four to six degrees Celsius, while cooling breezes from the Perfume River circulate freely through carved wooden fretwork.',
      },
    ],
    sources: [
      {
        title: 'Nha Ruong and Garden House Preservation Project in Thua Thien Hue',
        publisher: 'Hue Monuments Conservation Centre',
        url: 'https://hueworldheritage.org.vn',
      },
    ],
  },
  {
    id: 'story-cai-rang-dawn-waterways',
    slug: 'floating-dawn-on-the-mekong',
    title: 'Floating Dawn on the Mekong: Life on the Cái Răng Waterways',
    subtitle: 'Navigating the morning wholesale labyrinth where river currents dictate commerce, cuisine, and family roots.',
    excerpt:
      'Before sunrise in Cần Thơ, longtail engine growls echo across the Hậu River as hundreds of wooden barges gather in a floating choreography perfected over two centuries.',
    category: 'Local Culture',
    region: 'Southern Vietnam',
    destinationIds: ['can-tho'],
    experienceIds: ['exp-cai-rang-floating-market'],
    author: {
      name: 'Nguyễn Thị Bích Vân',
      role: 'Editor-in-Chief & Cultural Essayist',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
    },
    publishedAt: '2026-10-05',
    readTimeMinutes: 5,
    heroImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1400&auto=format&fit=crop',
    imageAttribution: {
      photographer: 'Adrien Olichon',
      source: 'Unsplash',
      license: 'Free Unsplash License',
    },
    featured: true,
    tags: ['Mekong Delta', 'River Culture', 'Cần Thơ', 'Living Traditions'],
    sections: [
      {
        heading: 'Cây Bẹo: The Visual Signboard of the River',
        content:
          'In the roar of marine diesel motors and sloshing river waves, traditional shouting is futile. Long ago, Mekong boatmen devised "cây bẹo": a slender bamboo pole erect at the bow of each vessel, from which a sample of the cargo is hung. If sweet potatoes dangle aloft, the barge carries tubers; if fragrant pineapples from Hậu Giang spin in the breeze, the boat is loaded with fruit. It is an honest, wordless visual contract.',
      },
      {
        heading: 'The World’s Most Agile Kitchens',
        content:
          'Small sampans zip between the ponderous cargo barges, piloted with extraordinary agility. Onboard sits a small charcoal burner, a pot of bubbling broth, fresh herbs, and rice noodles. The boat cook balances a hot bowl of hủ tiếu in one hand while maneuvering her foot against the steering paddle, passing steaming breakfast directly through open cabin windows.',
      },
    ],
    sources: [
      {
        title: 'Mekong River Culture & Intangible Heritage Documentation',
        publisher: 'Can Tho Cultural Heritage Department',
      },
    ],
  },
  {
    id: 'story-dong-van-karst-geopark',
    slug: 'the-stone-geopark-of-dong-van',
    title: 'The Stone Geopark of Đồng Văn: A Journey Through 400 Million Years',
    subtitle: 'How ancient devonian oceans sculpted northern Vietnam’s most dramatic limestone landscape and resilient ethnic civilizations.',
    excerpt:
      'At the northernmost apex of Vietnam, mountains do not roll gently; they jut into the stratosphere like jagged teeth of petrified black dragons.',
    category: 'Photo Essay',
    region: 'Northern Vietnam',
    destinationIds: ['ha-giang'],
    experienceIds: ['exp-ha-giang-ma-pi-leng-skywalk'],
    author: {
      name: 'Vũ Đăng Khoa',
      role: 'Highland Heritage Documentarian',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    },
    publishedAt: '2026-09-28',
    readTimeMinutes: 6,
    heroImage: 'https://images.unsplash.com/photo-1570784332176-fdd73da66f03?q=80&w=1400&auto=format&fit=crop',
    imageAttribution: {
      photographer: 'Gia Luan',
      source: 'Unsplash',
      license: 'Free Unsplash License',
    },
    featured: false,
    tags: ['Geology', 'UNESCO Geopark', 'Mã Pí Lèng', 'Adventure'],
    sections: [
      {
        heading: 'Fossils in the Mountain Clouds',
        content:
          'Four hundred million years ago, this highland realm lay submerged beneath a warm tropical sea. Today, as you touch the limestone boulders beside the Mã Pí Lèng pass, you can trace fossilized shells of brachiopods and ancient sea lilies (crinoids) locked in stone at 1,500 meters altitude.',
      },
      {
        heading: 'Life on the Rock Pockets',
        content:
          'Farming in this terrain defies imagination. Hmong families carry baskets of rich soil up sheer cliffs, depositing handfuls into tiny natural rock pockets (thổ nhưỡng hốc đá) to plant single stalks of maize. When spring arrives, bright yellow corn silk and peach blossoms burst into bloom against dark grey limestone in an unforgettable visual testament to human perseverance.',
      },
    ],
    sources: [
      {
        title: 'Geological Evolution of the Dong Van Karst Plateau',
        publisher: 'Vietnam Institute of Geosciences and Mineral Resources (VIGMR)',
        url: 'https://vigmr.vn',
      },
    ],
  },
];
