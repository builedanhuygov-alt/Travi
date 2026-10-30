import { describe, it, expect } from 'vitest';
import {
  exploreCulturalRabbitHole,
  synthesizeRabbitHoleItinerary,
} from '../culturalRabbitHoleEngine.ts';

describe('Vietnam Cultural Rabbit Hole Engine', () => {
  it('1. Explores a multi-hop discovery graph from a seed cultural interest', async () => {
    const graph = await exploreCulturalRabbitHole('Phở Hà Nội');

    expect(graph).toBeDefined();
    expect(graph.seed).toBe('Phở Hà Nội');
    expect(graph.nodes.length).toBeGreaterThanOrEqual(4);
    expect(graph.edges.length).toBeGreaterThanOrEqual(3);

    // Seed node
    const seedNode = graph.nodes[0];
    expect(seedNode.type).toBe('seed_interest');
    expect(seedNode.title).toBe('Phở Hà Nội');

    // Theme node
    const themeNode = graph.nodes.find((n) => n.type === 'cultural_theme');
    expect(themeNode).toBeDefined();
    expect(themeNode?.provenance).toBe('vietnam-heritage');

    // Destination node
    const destNode = graph.nodes.find((n) => n.type === 'sanctuary_destination');
    expect(destNode).toBeDefined();
    expect(destNode?.destinationId).toBeDefined();

    // Atelier node
    const atelierNode = graph.nodes.find((n) => n.type === 'artisan_experience');
    expect(atelierNode).toBeDefined();
    expect(atelierNode?.provenance).toBe('artisan-atelier');
  });

  it('2. Enforces explicit provenance tags and transparent reasoning on every node and edge', async () => {
    const graph = await exploreCulturalRabbitHole('Hemp weaving in Hà Giang');

    for (const node of graph.nodes) {
      expect(node.provenance).toMatch(/^(vietnam-heritage|curated-destination|artisan-atelier)$/);
      expect(node.provenanceLabel).toMatch(/^\[.+\]$/);
      expect(node.connectionReason.length).toBeGreaterThan(5);
    }

    for (const edge of graph.edges) {
      expect(edge.provenance).toMatch(/^(vietnam-cultural-mapping|geographic-context)$/);
      expect(edge.relationship.length).toBeGreaterThan(5);
    }
  });

  it('3. Generates a narrative explanation connecting the cultural journey', async () => {
    const graph = await exploreCulturalRabbitHole('Huế royal incense');
    expect(graph.narrativeExplanation).toBeDefined();
    expect(graph.narrativeExplanation).toContain('Huế royal incense');
  });

  it('4. Synthesizes a valid Vietnam Trip draft from discovered cultural nodes', async () => {
    const graph = await exploreCulturalRabbitHole('Mekong floating market');
    const trip = synthesizeRabbitHoleItinerary(graph);

    expect(trip.id).toBeDefined();
    expect(trip.country).toBe('Vietnam');
    expect(trip.status).toBe('planning');
    expect(trip.itineraryStops?.length).toBeGreaterThanOrEqual(2);
    expect(trip.notes).toBe(graph.narrativeExplanation);
  });
});
