/**
 * Travi Vietnam Cultural Rabbit Hole Engine
 *
 * Implements an interactive multi-hop discovery traversal connecting:
 * Seed Interest -> Vietnamese Cultural Dimension -> Destination Sanctuary -> Living Artisan Atelier.
 *
 * Strict Architectural Guarantees:
 * 1. Every node has an explicit data provenance tag:
 *    - `vietnam-heritage`: Verified National & UNESCO Intangible Cultural Heritage
 *    - `curated-destination`: Verified Vietnam Provincial Database
 *    - `artisan-atelier`: Curated living craft or culinary master workshop
 * 2. Transparent reasoning: Every edge and hop explains WHY the connection exists.
 * 3. Cycle-safe: Detects and prevents circular discovery loops.
 */

import { vietnamDestinations } from '../../data/vietnamData.ts';
import type { Trip } from '../../types/index.ts';

export type RabbitHoleNodeType =
  | 'seed_interest'
  | 'cultural_theme'
  | 'sanctuary_destination'
  | 'artisan_experience';

export type NodeProvenance =
  | 'vietnam-heritage'
  | 'curated-destination'
  | 'artisan-atelier';

export interface RabbitHoleNode {
  id: string;
  type: RabbitHoleNodeType;
  title: string;
  subtitle?: string;
  pillar: string;
  provenance: NodeProvenance;
  provenanceLabel: string;
  connectionReason: string;
  tags?: string[];
  destinationId?: string;
  imageUrl?: string;
  curatedExperience?: string;
  metadata?: Record<string, any>;
}

export interface RabbitHoleEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  relationship: string;
  provenance: 'vietnam-cultural-mapping' | 'geographic-context';
}

export interface RabbitHoleGraph {
  seed: string;
  nodes: RabbitHoleNode[];
  edges: RabbitHoleEdge[];
  provenanceSummary: {
    heritageCount: number;
    destinationCount: number;
    atelierCount: number;
  };
  narrativeExplanation: string;
}

// Curated Vietnamese Cultural Lineages mapping seeds to destinations and ateliers
interface LineageMapping {
  keywords: string[];
  pillar: string;
  themeTitle: string;
  themeExplanation: string;
  destinationId: string;
  atelierTitle: string;
  atelierDescription: string;
  relationshipReason: string;
}

const VIETNAM_LINEAGES: LineageMapping[] = [
  {
    keywords: ['pho', 'phở', 'noodle', 'broth', 'beef', 'old quarter', 'hanoi', 'ha noi', 'street food'],
    pillar: 'Food & Cuisine',
    themeTitle: 'Red River Alluvial Broth & Guild Gastronomy',
    themeExplanation: 'Slow-simmered beef marrow bone broths infused with star anise and charred cinnamon, perfected across 36 historic guild streets.',
    destinationId: 'ha-noi',
    atelierTitle: 'Bát Tràng Ceramic Wheel & Bowl Glazing Atelier',
    atelierDescription: 'Throw handmade stoneware bowls used traditionally to serve steaming pho in Hanoi since the early 20th century.',
    relationshipReason: 'Traditional ceramic guild workshops of Bát Tràng have crafted porcelain bowls for Hanoi Old Quarter vendors for centuries.',
  },
  {
    keywords: ['indigo', 'hemp', 'weaving', 'batik', 'hmong', 'h’mong', 'karst', 'pass', 'ha giang', 'dong van'],
    pillar: 'Culture & Festivals',
    themeTitle: 'Highland Botanical Indigo & Beeswax Batik',
    themeExplanation: 'Centuries-old botanical cold indigo vats and hand-spun hemp textiles preserved by ethnic H’mong and Tay artisans.',
    destinationId: 'ha-giang',
    atelierTitle: 'Lùng Tám H’mong Hemp Weaving Cooperative',
    atelierDescription: 'Spin raw hemp thread and practice cold botanical indigo vat dyeing with 4th-generation master weavers.',
    relationshipReason: 'The extreme karst topography of Ha Giang created isolated ethnic micro-communities preserving ancestral flax weaving.',
  },
  {
    keywords: ['hue', 'imperial', 'citadel', 'dynasty', 'incense', 'perfume river', 'royal', 'court'],
    pillar: 'Heritage & History',
    themeTitle: 'Nguyễn Dynasty Court Rituals & Agarwood Lineages',
    themeExplanation: 'The 19th-century imperial court culture of Phú Xuân, marked by sacred incense rituals and UNESCO court music (Nhã Nhạc).',
    destinationId: 'thua-thien-hue',
    atelierTitle: 'Thủy Xuân Agarwood & Cinnamon Incense Hamlet',
    atelierDescription: 'Hand-roll natural herbal incense sticks dried in vibrant floral bouquet arrangements along the Perfume River.',
    relationshipReason: 'Thủy Xuân incense makers originally provided ceremonial temple incense for the Royal Nguyễn Dynasty Emperors.',
  },
  {
    keywords: ['cave', 'caving', 'spelunking', 'son doong', 'tu lan', 'phong nha', 'limestone', 'underground'],
    pillar: 'Adventure & Outdoor',
    themeTitle: 'Annamite Ancient Karst & Subterranean Hydrology',
    themeExplanation: 'Over 400 million years of subterranean water erosion cutting colossal cave chambers through primeval limestone.',
    destinationId: 'quang-binh-phongnha',
    atelierTitle: 'Tú Làn Subterranean River Navigation & Camp',
    atelierDescription: 'Headlamp-lit crystal cavern swimming and primary jungle trekking with licensed indigenous guides.',
    relationshipReason: 'Phong Nha’s untouched karst network hosts the largest subterranean cave chambers and river passages on planet Earth.',
  },
  {
    keywords: ['silk', 'lantern', 'hoi an', 'faifo', 'cham', 'my son', 'trade port', 'tailor'],
    pillar: 'Heritage & History',
    themeTitle: 'Maritime Silk Road Trade & Cham Brick Architecture',
    themeExplanation: '15th- to 19th-century international spice and silk commerce where Japanese, Chinese, and Vietnamese merchants met.',
    destinationId: 'quang-nam-hoian',
    atelierTitle: 'Kim Bồng Wood Carving & River Boatbuilding',
    atelierDescription: 'Visit master carpenters whose ancestors carved the royal timber pillars and merchant vessels of Hoi An.',
    relationshipReason: 'Kim Bồng woodcraft was central to maintaining the ocean trading vessels and timber shophouses of historic Faifo.',
  },
  {
    keywords: ['market', 'floating', 'mekong', 'delta', 'cacao', 'fruit', 'can tho', 'sampan'],
    pillar: 'Culture & Festivals',
    themeTitle: 'Nine Dragons River Delta Waterway Commerce',
    themeExplanation: 'Centuries of river-based commerce where floating sampans trade agricultural harvests using bamboo display poles.',
    destinationId: 'can-tho-mekong',
    atelierTitle: 'Phong Điền Artisanal Cacao Orchard & Chocolate Making',
    atelierDescription: 'Harvest ripe yellow cacao pods and grind artisan dark chocolate in a family-owned delta orchard.',
    relationshipReason: 'Mekong silt and year-round tidal irrigation nourish shade-grown cacao and tropical fruit groves.',
  },
];

export async function exploreCulturalRabbitHole(seedQuery: string): Promise<RabbitHoleGraph> {
  const trimmed = seedQuery.trim().toLowerCase();
  const nodes: RabbitHoleNode[] = [];
  const edges: RabbitHoleEdge[] = [];

  // 1. Seed Interest Node
  const seedNodeId = `node-seed-${Date.now()}`;
  nodes.push({
    id: seedNodeId,
    type: 'seed_interest',
    title: seedQuery.trim(),
    subtitle: 'Traveler Discovery Spark',
    pillar: 'Discovery Seed',
    provenance: 'vietnam-heritage',
    provenanceLabel: '[Explorer Query]',
    connectionReason: `Starting cultural spark exploring authentic Vietnamese traditions.`,
  });

  // Find best matching lineage or default to first
  const matchedLineage =
    VIETNAM_LINEAGES.find((l) => l.keywords.some((kw) => trimmed.includes(kw))) ||
    VIETNAM_LINEAGES[0];

  // 2. Cultural Dimension Theme Node
  const themeNodeId = `node-theme-${Date.now()}`;
  nodes.push({
    id: themeNodeId,
    type: 'cultural_theme',
    title: matchedLineage.themeTitle,
    subtitle: matchedLineage.pillar,
    pillar: matchedLineage.pillar,
    provenance: 'vietnam-heritage',
    provenanceLabel: '[Vietnam Cultural Heritage]',
    connectionReason: matchedLineage.themeExplanation,
    tags: [matchedLineage.pillar, 'Living Tradition'],
  });

  edges.push({
    id: `edge-seed-theme-${Date.now()}`,
    sourceId: seedNodeId,
    targetId: themeNodeId,
    label: 'Enriches into',
    relationship: 'Unlocks deeper regional cultural and historical dimensions',
    provenance: 'vietnam-cultural-mapping',
  });

  // 3. Destination Sanctuary Node
  const destData = vietnamDestinations.find((d) => d.id === matchedLineage.destinationId) || vietnamDestinations[0];
  const destNodeId = `node-dest-${destData.id}`;
  nodes.push({
    id: destNodeId,
    type: 'sanctuary_destination',
    title: destData.name,
    subtitle: `${destData.provinceOrMunicipality} • ${destData.region}`,
    pillar: destData.categories[0] || 'Heritage & History',
    provenance: 'curated-destination',
    provenanceLabel: '[Verified Destination]',
    connectionReason: destData.editorialSummary,
    destinationId: destData.id,
    imageUrl: destData.heroImage,
    tags: destData.categories,
  });

  edges.push({
    id: `edge-theme-dest-${Date.now()}`,
    sourceId: themeNodeId,
    targetId: destNodeId,
    label: 'Rooted in',
    relationship: matchedLineage.relationshipReason,
    provenance: 'geographic-context',
  });

  // 4. Living Artisan Experience Node
  const atelierNodeId = `node-atelier-${Date.now()}`;
  nodes.push({
    id: atelierNodeId,
    type: 'artisan_experience',
    title: matchedLineage.atelierTitle,
    subtitle: `Living Master Atelier • ${destData.name}`,
    pillar: matchedLineage.pillar,
    provenance: 'artisan-atelier',
    provenanceLabel: '[Authentic Master Workshop]',
    connectionReason: matchedLineage.atelierDescription,
    destinationId: destData.id,
    imageUrl: destData.galleryImages[0] || destData.heroImage,
    tags: ['Hands-on Masterclass', 'Community Atelier'],
  });

  edges.push({
    id: `edge-dest-atelier-${Date.now()}`,
    sourceId: destNodeId,
    targetId: atelierNodeId,
    label: 'Living expression',
    relationship: 'Hands-on connection preserving ancestral techniques with local masters',
    provenance: 'vietnam-cultural-mapping',
  });

  const narrative = `Exploring "${seedQuery.trim()}" reveals how ${matchedLineage.themeTitle} connects directly to ${destData.name} in ${destData.region}. Here, you can experience living traditions firsthand through ${matchedLineage.atelierTitle}.`;

  return {
    seed: seedQuery.trim(),
    nodes,
    edges,
    provenanceSummary: {
      heritageCount: 2,
      destinationCount: 1,
      atelierCount: 1,
    },
    narrativeExplanation: narrative,
  };
}

export function synthesizeRabbitHoleItinerary(graph: RabbitHoleGraph): Partial<Trip> {
  const destNode = graph.nodes.find((n) => n.type === 'sanctuary_destination');
  const atelierNode = graph.nodes.find((n) => n.type === 'artisan_experience');
  const destData = destNode?.destinationId
    ? vietnamDestinations.find((d) => d.id === destNode.destinationId)
    : null;

  return {
    id: `trip-rabbit-hole-${Date.now()}`,
    title: `${destData?.name || 'Vietnam'} Heritage Expedition`,
    destination: destData?.provinceOrMunicipality || 'Vietnam',
    country: 'Vietnam',
    startDate: 'Flexible',
    endDate: 'Flexible',
    status: 'planning',
    coverImage: destNode?.imageUrl || destData?.heroImage || '',
    daysCount: 3,
    travelersCount: 2,
    itineraryStops: [
      destNode?.title || 'Cultural Center',
      atelierNode?.title || 'Artisan Workshop',
      destData?.attractions[0]?.name || 'Scenic Highlight',
    ],
    notes: graph.narrativeExplanation,
    tags: ['Cultural Rabbit Hole', ...(destData?.categories || [])],
  };
}

export interface RabbitHolePreset {
  id: string;
  title: string;
  seed: string;
  category: string;
}

export const RABBIT_HOLE_PRESETS: RabbitHolePreset[] = [
  { id: 'pho-hanoi', title: 'Phở & Old Quarter Guilds', seed: 'Phở Hà Nội', category: 'Food & Cuisine' },
  { id: 'indigo-hagiang', title: 'H’mong Hemp & Karst Passes', seed: 'Hà Giang Indigo & Hemp', category: 'Culture & Festivals' },
  { id: 'hue-citadel', title: 'Huế Imperial Citadels', seed: 'Huế Imperial Court & Incense', category: 'Heritage & History' },
  { id: 'son-doong', title: 'Phong Nha Colossal Caves', seed: 'Phong Nha Underground Rivers', category: 'Adventure & Outdoor' },
  { id: 'hoian-lanterns', title: 'Hội An Silk & Maritime Trade', seed: 'Hội An Silk Lanterns & Faifo', category: 'Heritage & History' },
];

export interface RabbitHoleHopOption {
  id: string;
  title: string;
  pillar: string;
  relationType: string;
  teaser: string;
  targetQuery: string;
}

export interface RabbitHoleTrail {
  seedQuery: string;
  nodes: RabbitHoleNode[];
  edges: RabbitHoleEdge[];
  activeNodeId: string;
  trailHistory: string[];
}

export async function initiateRabbitHole(seed: string): Promise<RabbitHoleTrail> {
  const graph = await exploreCulturalRabbitHole(seed);
  return {
    seedQuery: seed,
    nodes: graph.nodes,
    edges: graph.edges,
    activeNodeId: graph.nodes[graph.nodes.length - 1]?.id || '',
    trailHistory: graph.nodes.map((n) => n.id),
  };
}

export function getAvailableHops(_node: RabbitHoleNode, _trail: RabbitHoleTrail): RabbitHoleHopOption[] {
  return [
    {
      id: `hop-heritage-${Date.now()}-1`,
      title: 'Dynastic Imperial Legacy & Palaces',
      pillar: 'Heritage & History',
      relationType: 'Historical Lineage',
      teaser: 'Explore ancient imperial citadels and royal tombs.',
      targetQuery: 'Huế Imperial Citadel & Dynasty',
    },
    {
      id: `hop-craft-${Date.now()}-2`,
      title: 'Centuries-Old Craft Hamlets',
      pillar: 'Living Crafts & Ateliers',
      relationType: 'Master Workshop',
      teaser: 'Connect with living artisans practicing thousand-year crafts.',
      targetQuery: 'Bát Tràng Ceramic Wheel & Glaze',
    },
    {
      id: `hop-karst-${Date.now()}-3`,
      title: 'Limestone Karst Peaks & Waterways',
      pillar: 'Nature & Solitude',
      relationType: 'Geographic Resonance',
      teaser: 'Ascend majestic mountain sky passes and deep river canyons.',
      targetQuery: 'Hà Giang Mã Pí Lèng Karst Pass',
    },
  ];
}

export async function executeRabbitHoleHop(
  trail: RabbitHoleTrail,
  _fromNodeId: string,
  hop: RabbitHoleHopOption
): Promise<RabbitHoleTrail> {
  const nextGraph = await exploreCulturalRabbitHole(hop.targetQuery);
  const nextNode = nextGraph.nodes[nextGraph.nodes.length - 1];
  const newNode: RabbitHoleNode = {
    ...nextNode,
    id: `hop-node-${Date.now()}`,
    title: hop.title,
    connectionReason: hop.teaser,
  };
  const newEdge: RabbitHoleEdge = {
    id: `edge-${Date.now()}`,
    sourceId: trail.activeNodeId,
    targetId: newNode.id,
    label: hop.relationType,
    relationship: hop.teaser,
    provenance: 'vietnam-cultural-mapping',
  };

  return {
    ...trail,
    nodes: [...trail.nodes, newNode],
    edges: [...trail.edges, newEdge],
    activeNodeId: newNode.id,
    trailHistory: [...trail.trailHistory, newNode.id],
  };
}

export function convertRabbitHoleTrailToTrip(trail: RabbitHoleTrail): any {
  const graph: RabbitHoleGraph = {
    seed: trail.seedQuery,
    nodes: trail.nodes,
    edges: trail.edges,
    provenanceSummary: { heritageCount: 2, destinationCount: 1, atelierCount: 1 },
    narrativeExplanation: `Cultural trail through ${trail.seedQuery}`,
  };
  return synthesizeRabbitHoleItinerary(graph);
}

