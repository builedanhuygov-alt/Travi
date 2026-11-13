/**
 * Coordinate Validator
 * ====================
 * Distinguishes geographic validity from ground-truth verification confidence.
 *
 * Vietnam Geographic Bounding Box (including mainland & close islands):
 * - Latitude: 8.0° N to 24.0° N
 * - Longitude: 102.0° E to 110.5° E
 */

import type { CoordinateConfidence, CoordinateValidity } from '../../types/nationalTourism.ts';

export interface CoordinateValidationResult {
  latitude: number | null;
  longitude: number | null;
  validity: CoordinateValidity;
  confidence: CoordinateConfidence;
  validation_notes: string;
}

export const VIETNAM_GEO_BOUNDS = {
  MIN_LAT: 8.0,
  MAX_LAT: 24.0,
  MIN_LON: 102.0,
  MAX_LON: 110.5,
};

/**
 * Validates and assesses coordinate numbers against Vietnam territorial bounds.
 * Does NOT elevate confidence without authoritative verification evidence.
 */
export function validateCoordinates(
  lat: number | null | undefined,
  lon: number | null | undefined,
  declaredConfidence?: CoordinateConfidence | string | null,
  verificationContext?: string | null
): CoordinateValidationResult {
  // Case 1: Missing coordinates
  if (lat === null || lat === undefined || lon === null || lon === undefined || isNaN(lat) || isNaN(lon)) {
    return {
      latitude: null,
      longitude: null,
      validity: 'missing',
      confidence: 'none',
      validation_notes: 'Coordinates missing or null. Strictly marked as confidence: none. Must not render map pin.',
    };
  }

  // Case 2: Out of bounds (e.g. inverted lat/lon, or coordinates in foreign territories)
  if (
    lat < VIETNAM_GEO_BOUNDS.MIN_LAT ||
    lat > VIETNAM_GEO_BOUNDS.MAX_LAT ||
    lon < VIETNAM_GEO_BOUNDS.MIN_LON ||
    lon > VIETNAM_GEO_BOUNDS.MAX_LON
  ) {
    return {
      latitude: null, // Zero tolerance: strip out-of-bounds coordinates to avoid map rendering corruption
      longitude: null,
      validity: 'out_of_bounds',
      confidence: 'none',
      validation_notes: `Coordinates (${lat}, ${lon}) fall outside Vietnam bounding box [${VIETNAM_GEO_BOUNDS.MIN_LAT} - ${VIETNAM_GEO_BOUNDS.MAX_LAT} N, ${VIETNAM_GEO_BOUNDS.MIN_LON} - ${VIETNAM_GEO_BOUNDS.MAX_LON} E]. Stripped for safety.`,
    };
  }

  // Case 3: Valid numeric coordinates within Vietnam bounds
  // Resolve confidence strictly: declared confidence is respected only if valid; default is 'approximate' or 'none'
  let resolvedConfidence: CoordinateConfidence = 'approximate';

  if (declaredConfidence === 'exact') {
    resolvedConfidence = 'exact';
  } else if (declaredConfidence === 'approximate') {
    resolvedConfidence = 'approximate';
  } else if (declaredConfidence === 'province_level') {
    resolvedConfidence = 'province_level';
  } else if (declaredConfidence === 'none') {
    resolvedConfidence = 'none';
  } else {
    // If unverified context or field notes indicate uncertainty
    if (verificationContext && /unverified|field_notes|needs_review/i.test(verificationContext)) {
      resolvedConfidence = 'none';
    }
  }

  return {
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lon.toFixed(6)),
    validity: 'valid',
    confidence: resolvedConfidence,
    validation_notes: `Mathematically valid coordinates within Vietnam bounds. Confidence evaluated as: ${resolvedConfidence}.`,
  };
}
