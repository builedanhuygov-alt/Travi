import { describe, it, expect } from 'vitest';
import {
  generateVietnamAiResponse,
  getVietnamAiProviderStatus,
} from '../vietnamAiService.ts';

describe('Vietnam AI Assistant Service Architecture (Phase 4C)', () => {
  it('reports deterministic fallback status when no external API key is configured', () => {
    const status = getVietnamAiProviderStatus();
    expect(status.provider).toBe('deterministic-expert');
    expect(status.isExternalApiConfigured).toBe(false);
    expect(status.modelLabel).toContain('Deterministic Expert Engine');
  });

  it('answers local food recommendations using verified culinary lineages', async () => {
    const response = await generateVietnamAiResponse('What are the best food dishes in Hanoi?');

    expect(response.content).toContain('Phở Bát Đàn');
    expect(response.content).toContain('Bún Chả');
    expect(response.isDeterministicFallback).toBe(true);
    expect(response.suggestedActions.length).toBeGreaterThan(0);
    expect(response.suggestedActions.some((a) => a.action === 'explore')).toBe(true);
  });

  it('provides cultural etiquette and respectful travel guidelines', async () => {
    const response = await generateVietnamAiResponse('What is the temple etiquette in Vietnam?');

    expect(response.content).toContain('Temples & Pagodas');
    expect(response.content).toContain('Respect for Elders');
    expect(response.isDeterministicFallback).toBe(true);
  });

  it('provides weather and seasonal advice across North, Central, and South microclimates', async () => {
    const response = await generateVietnamAiResponse('What is the best weather season to visit Vietnam?');

    expect(response.content).toContain('North Vietnam');
    expect(response.content).toContain('Central Vietnam');
    expect(response.content).toContain('South Vietnam');
    expect(response.content).toContain('October');
  });

  it('provides transportation and route guidance with estimate notices', async () => {
    const response = await generateVietnamAiResponse('How should I travel between Hanoi and Ha Giang?');

    expect(response.content).toContain('Sleeper Limousine Bus');
    expect(response.content).toContain('Reunification Express');
  });
});
