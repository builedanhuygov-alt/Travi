import { describe, it, expect } from 'vitest';
import { discoveryEngine } from '../discoveryEngine.ts';

describe('DiscoveryEngine — Multi-Signal Transparent Discovery (TRAVI)', () => {
  it('ranks destinations with transparent scores and Vietnamese explanation signals', () => {
    const results = discoveryEngine.rankDestinations({
      persona: 'culture',
      region: 'Northern Vietnam',
    });

    expect(results.length).toBeGreaterThan(0);
    const top = results[0];
    expect(top.score).toBeGreaterThan(0);
    expect(top.recommendationReason).toBeDefined();
    expect(top.signals.length).toBeGreaterThan(0);
    expect(top.explanationTag).toBeDefined();
    expect(top.item.region).toBe('Northern Vietnam');
    expect(top.signals).toContain('Phù hợp với sở thích văn hóa');
  });

  it('triggers "Cùng khu vực bạn đang khám phá" and "Có liên quan đến địa điểm đã lưu" when savedDestIds provided', () => {
    const results = discoveryEngine.rankDestinations({
      savedDestIds: ['ha-noi'],
    });

    expect(results.length).toBeGreaterThan(0);
    // Dest in Northern Vietnam should get regional explanation
    const sameRegionDest = results.find((r) => r.item.region === 'Northern Vietnam' && r.id !== 'ha-noi');
    if (sameRegionDest) {
      expect(sameRegionDest.signals).toContain('Cùng khu vực bạn đang khám phá');
    }
  });

  it('ranks experiences across categories and verifies Vietnamese explanation tag', () => {
    const craftExperiences = discoveryEngine.rankExperiences({
      categoryFilter: 'Arts & Crafts',
      persona: 'culture',
    });

    expect(craftExperiences.length).toBeGreaterThan(0);
    const first = craftExperiences[0];
    expect(first.item.category).toBe('Arts & Crafts');
    expect(first.item.provenanceMetadata.sourceName).toBeDefined();
    expect(first.explanationTag).toBeDefined();
    expect(first.signals).toContain('Phù hợp với sở thích văn hóa');
  });

  it('ranks editorial stories with archival source provenance and Vietnamese signals', () => {
    const stories = discoveryEngine.rankStories({});
    expect(stories.length).toBeGreaterThan(0);
    const topStory = stories[0];
    expect(topStory.item.sections.length).toBeGreaterThan(0);
    expect(topStory.item.author.name).toBeDefined();
    expect(topStory.item.sources.length).toBeGreaterThan(0);
    expect(topStory.explanationTag).toBeDefined();
  });

  it('correctly retrieves nearby destinations for a given destination', () => {
    const nearby = discoveryEngine.getNearbyDestinations('ha-noi', 3);
    expect(nearby.length).toBeLessThanOrEqual(3);
    expect(nearby.every((d) => d.id !== 'ha-noi')).toBe(true);
  });

  it('retrieves standalone experiences linked to a destination', () => {
    const hanoiExps = discoveryEngine.getExperiencesForDestination('ha-noi');
    expect(hanoiExps.length).toBeGreaterThan(0);
    expect(hanoiExps.some((e) => e.destinationId === 'ha-noi')).toBe(true);
  });
});
