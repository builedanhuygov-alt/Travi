import { describe, it, expect } from 'vitest';
import {
  classifyCustomerType,
  resolveMultiDimensionalProfile,
} from '../customerClassifier.ts';

describe('Adaptive Travel Intelligence — Customer Classifier', () => {
  it('classifies foreign traveler as INTERNATIONAL based on origin country', () => {
    const result = classifyCustomerType({
      origin_country: 'France',
      origin_province: 'Paris',
      destination: 'Hà Nội',
      preferred_language: 'fr',
    });

    expect(result.detected_type).toBe('INTERNATIONAL');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.is_overridden).toBe(false);
  });

  it('classifies traveler as INTERNATIONAL based on language when origin country is omitted', () => {
    const result = classifyCustomerType({
      destination: 'Đà Nẵng',
      preferred_language: 'en',
    });

    expect(result.detected_type).toBe('INTERNATIONAL');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('classifies traveler exploring within same province as LOCAL', () => {
    const result = classifyCustomerType({
      origin_country: 'Vietnam',
      origin_province: 'Sơn La',
      destination: 'Sơn La',
      preferred_language: 'vi',
    });

    expect(result.detected_type).toBe('LOCAL');
    expect(result.confidence).toBe(0.95);
    expect(result.reasons[0]).toContain('Sơn La');
  });

  it('classifies multi-day traveler across different provinces as INTERPROVINCIAL', () => {
    const result = classifyCustomerType({
      origin_country: 'Vietnam',
      origin_province: 'Hà Nội',
      destination: 'Sơn La',
      travel_duration: 4,
      preferred_language: 'vi',
    });

    expect(result.detected_type).toBe('INTERPROVINCIAL');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('respects explicit user override with 1.0 confidence', () => {
    const result = classifyCustomerType({
      customer_type: 'LOCAL',
      origin_country: 'United States',
      origin_province: 'California',
      destination: 'Hà Nội',
    });

    expect(result.detected_type).toBe('LOCAL');
    expect(result.confidence).toBe(1.0);
    expect(result.is_overridden).toBe(true);
  });

  it('resolves multi-dimensional profile allowing distinct attributes to coexist', () => {
    const multi = resolveMultiDimensionalProfile({
      origin_country: 'Vietnam',
      origin_province: 'Sơn La',
      destination: 'Mộc Châu, Sơn La',
      preferred_language: 'vi',
      travel_companions: 'Family',
      budget: 'Moderate',
      travel_duration: 2,
    });

    expect(multi.market).toBe('DOMESTIC');
    expect(multi.travel_scope).toBe('LOCAL');
    expect(multi.persona).toBe('FAMILY');
    expect(multi.language).toBe('VI');
    expect(multi.origin_location.province).toBe('Sơn La');
    expect(multi.destination_location.province).toBe('Mộc Châu, Sơn La');
  });

  it('supports explicit multi-dimensional overrides independently', () => {
    const multi = resolveMultiDimensionalProfile({
      market: 'INTERNATIONAL',
      travel_scope: 'LOCAL',
      persona: 'BACKPACKER',
      language: 'EN',
      destination: 'Hà Nội',
    });

    expect(multi.market).toBe('INTERNATIONAL');
    expect(multi.travel_scope).toBe('LOCAL');
    expect(multi.persona).toBe('BACKPACKER');
    expect(multi.language).toBe('EN');
  });
});

