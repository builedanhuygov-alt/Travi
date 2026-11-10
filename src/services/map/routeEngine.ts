import type { NorthDestinationRecord, RouteCalculationResult, RouteWaypoint } from '../../types/northMap.ts';

/**
 * Calculates straight-line geographic distance between two coordinates using the Haversine formula.
 * Returns distance in kilometers (km) rounded to 1 decimal place.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Determines whether a route segment spans predominantly mountainous Northwest/Northeast terrain
 * or flat delta expressways.
 */
export function detectTerrainCharacteristics(
  destinations: NorthDestinationRecord[]
): 'mountain_pass' | 'delta_highway' | 'mixed_terrain' {
  const mountainSubregions = ['Tây Bắc', 'Đông Bắc'];
  const deltaSubregions = ['Đồng bằng sông Hồng', 'Ven biển Bắc Bộ'];

  const hasMountain = destinations.some((d) => mountainSubregions.includes(d.subregion));
  const hasDelta = destinations.some((d) => deltaSubregions.includes(d.subregion));

  if (hasMountain && !hasDelta) return 'mountain_pass';
  if (!hasMountain && hasDelta) return 'delta_highway';
  return 'mixed_terrain';
}

/**
 * Estimates driving travel time based on terrain characteristics and road curvature factors in Northern Vietnam.
 * Note: Mountain routes in Northwest/Northeast have high winding curvature (winding factor ~1.6 - 1.8x straight line)
 * and lower average speed (~35-45 km/h) compared to expressways (CT05, CT04, CT01 ~75-90 km/h).
 */
export function estimateDriveTimeHours(
  geographicDistanceKm: number,
  terrain: 'mountain_pass' | 'delta_highway' | 'mixed_terrain'
): number {
  if (geographicDistanceKm <= 0) return 0;

  let windingFactor = 1.35;
  let avgSpeedKmh = 50;

  switch (terrain) {
    case 'mountain_pass':
      windingFactor = 1.7; // High pass winding
      avgSpeedKmh = 38; // 35-40 km/h on mountain passes
      break;
    case 'delta_highway':
      windingFactor = 1.25; // Expressway / national highway
      avgSpeedKmh = 65; // 60-70 km/h
      break;
    case 'mixed_terrain':
    default:
      windingFactor = 1.45;
      avgSpeedKmh = 48;
      break;
  }

  const estimatedRoadKm = geographicDistanceKm * windingFactor;
  const hours = estimatedRoadKm / avgSpeedKmh;
  return Math.round(hours * 10) / 10;
}

/**
 * Calculates multi-point route metrics.
 * By default computes exact geographic Haversine distance and terrain estimates.
 */
export function calculateRouteSummary(
  destinations: NorthDestinationRecord[]
): RouteCalculationResult {
  if (destinations.length < 2) {
    const waypoints: RouteWaypoint[] = destinations.map((dest, idx) => ({
      destination: dest,
      order: idx + 1,
    }));
    return {
      waypoints,
      totalGeographicDistanceKm: 0,
      estimatedDriveTimeHours: 0,
      terrainType: detectTerrainCharacteristics(destinations),
      distanceType: 'straight_line_geographic',
      coordinates: destinations.map((d) => [d.latitude, d.longitude]),
    };
  }

  let totalDist = 0;
  for (let i = 0; i < destinations.length - 1; i++) {
    const d1 = destinations[i];
    const d2 = destinations[i + 1];
    totalDist += calculateHaversineDistance(d1.latitude, d1.longitude, d2.latitude, d2.longitude);
  }

  const roundedDistance = Math.round(totalDist * 10) / 10;
  const terrain = detectTerrainCharacteristics(destinations);
  const estimatedHours = estimateDriveTimeHours(roundedDistance, terrain);

  const waypoints: RouteWaypoint[] = destinations.map((dest, idx) => ({
    destination: dest,
    order: idx + 1,
  }));

  return {
    waypoints,
    totalGeographicDistanceKm: roundedDistance,
    estimatedDriveTimeHours: estimatedHours,
    terrainType: terrain,
    distanceType: 'straight_line_geographic',
    coordinates: destinations.map((d) => [d.latitude, d.longitude]),
  };
}

/**
 * Attempts to fetch real network driving geometry from OSRM public router.
 * If network request fails or times out, gracefully falls back to straight-line geographic waypoints.
 */
export async function fetchOsrmDrivingRoute(
  destinations: NorthDestinationRecord[]
): Promise<{ coordinates: [number, number][]; distanceKm: number; durationHours: number; isNetworkRoute: boolean }> {
  if (destinations.length < 2) {
    return {
      coordinates: destinations.map((d) => [d.latitude, d.longitude]),
      distanceKm: 0,
      durationHours: 0,
      isNetworkRoute: false,
    };
  }

  try {
    const coordString = destinations.map((d) => `${d.longitude},${d.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second safety timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`OSRM HTTP error: ${res.status}`);

    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0];
      // OSRM returns coordinates as [lng, lat], Leaflet polyline expects [lat, lng]
      const latLngs: [number, number][] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]]
      );
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
      const durationHours = Math.round((route.duration / 3600) * 10) / 10;

      return {
        coordinates: latLngs,
        distanceKm,
        durationHours,
        isNetworkRoute: true,
      };
    }
  } catch {
    // Graceful fallback to straight geographic line
  }

  const summary = calculateRouteSummary(destinations);
  return {
    coordinates: summary.coordinates,
    distanceKm: summary.totalGeographicDistanceKm,
    durationHours: summary.estimatedDriveTimeHours || 0,
    isNetworkRoute: false,
  };
}
