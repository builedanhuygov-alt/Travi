import { describe, it, expect } from 'vitest';
import { adaptiveRecommendationService } from '../adaptiveRecommendationService.ts';

describe('Adaptive Recommendation Service & Itinerary Generator', () => {
  it('generates adaptive recommendations prioritizing living heritage for INTERNATIONAL visitors', async () => {
    const result = await adaptiveRecommendationService.getAdaptiveRecommendations({
      customer_type: 'INTERNATIONAL',
      origin_country: 'Germany',
      destination: 'Hà Nội',
      preferred_language: 'en',
      budget: 'Luxury',
      travel_duration: 5,
      interests: ['Heritage & History', 'Culture & Festivals'],
    });

    expect(result.customerClassification.detected_type).toBe('INTERNATIONAL');
    expect(result.recommendations.length).toBeGreaterThan(0);

    const topRec = result.recommendations[0];
    expect(topRec.customerTypeHighlight).toContain('quốc tế');
    expect(topRec.overallScore).toBeGreaterThan(60);
    expect(result.weatherAssessment).toBeDefined();
  });

  it('generates adaptive recommendations prioritizing hidden gems for LOCAL visitors', async () => {
    const result = await adaptiveRecommendationService.getAdaptiveRecommendations({
      customer_type: 'LOCAL',
      origin_country: 'Vietnam',
      origin_province: 'Sơn La',
      destination: 'Sơn La',
      preferred_language: 'vi',
      budget: 'Budget',
      travel_duration: 2,
      interests: ['Hidden Gems', 'Nature & Mountains'],
    });

    expect(result.customerClassification.detected_type).toBe('LOCAL');
    expect(result.recommendations.length).toBeGreaterThan(0);

    const poiRec = result.recommendations.find((r) => r.isPoi);
    expect(poiRec).toBeDefined();
    expect(poiRec?.customerTypeAlignmentScore).toBeGreaterThanOrEqual(80);
  });

  it('generates day-by-day adaptive itinerary with route metrics and weather advisory', async () => {
    const itinerary = await adaptiveRecommendationService.generateAdaptiveItinerary({
      customer_type: 'INTERPROVINCIAL',
      origin_province: 'Hà Nội',
      destination: 'Sơn La',
      preferred_language: 'vi',
      budget: 'Moderate',
      travel_duration: 3,
      interests: ['Nature & Mountains', 'Food & Cuisine'],
    });

    expect(itinerary.durationDays).toBe(3);
    expect(itinerary.days.length).toBe(3);
    expect(itinerary.customerType).toBe('INTERPROVINCIAL');
    expect(itinerary.totalEstimatedCostVND).toBeGreaterThan(0);
    expect(itinerary.routeSummary).toBeDefined();
    expect(itinerary.routeSummary?.estimatedRoadDistanceKm).toBeGreaterThan(100);
    expect(itinerary.weatherAdvisory).toBeDefined();
    expect(itinerary.costDisclaimer).toContain('Ước tính');
  });
});

