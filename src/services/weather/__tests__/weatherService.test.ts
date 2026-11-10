import { describe, it, expect } from 'vitest';
import { assessDestinationWeather } from '../weatherService.ts';

describe('Weather Intelligence Service', () => {
  it('identifies Autumn (Oct) in North Vietnam as optimal golden season', () => {
    const weather = assessDestinationWeather('Hà Nội', 10);
    expect(weather.climateZone).toBe('North Vietnam');
    expect(weather.isOptimalSeason).toBe(true);
    expect(weather.suitabilityScore).toBeGreaterThanOrEqual(90);
    expect(weather.seasonName).toContain('Mùa Thu Vàng');
    expect(weather.rainRisk).toBe('Low');
  });

  it('identifies monsoon/rainy season in Central Vietnam during October/November', () => {
    const weather = assessDestinationWeather('Huế', 10);
    expect(weather.climateZone).toBe('Central Vietnam');
    expect(weather.isOptimalSeason).toBe(false);
    expect(weather.rainRisk).toBe('High');
    expect(weather.advisory).toContain('mưa lũ');
  });

  it('identifies dry sunny beach season in Central Vietnam during April', () => {
    const weather = assessDestinationWeather('Đà Nẵng', 4);
    expect(weather.climateZone).toBe('Central Vietnam');
    expect(weather.isOptimalSeason).toBe(true);
    expect(weather.suitabilityScore).toBeGreaterThanOrEqual(90);
  });

  it('identifies dry season in South Vietnam during January', () => {
    const weather = assessDestinationWeather('TP. Hồ Chí Minh', 1);
    expect(weather.climateZone).toBe('South Vietnam');
    expect(weather.isOptimalSeason).toBe(true);
  });

  it('identifies Highlands climate zone for Da Lat and Dak Lak', () => {
    const weather = assessDestinationWeather('Đà Lạt', 12);
    expect(weather.climateZone).toBe('Highlands');
    expect(weather.isOptimalSeason).toBe(true);
    expect(weather.seasonName).toContain('Dã Quỳ');
  });
});

