import type { NorthDestinationRecord } from '../../types/northMap.ts';

export interface MarkerCluster {
  id: string;
  isCluster: true;
  latitude: number;
  longitude: number;
  count: number;
  destinations: NorthDestinationRecord[];
  subregions: string[];
}

export interface SingleMarker {
  id: string;
  isCluster: false;
  destination: NorthDestinationRecord;
}

export type DisplayMarkerItem = MarkerCluster | SingleMarker;

/**
 * Projects latitude/longitude to Mercator pixel coordinates at a given zoom level.
 */
function latLngToPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = 256 * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = (1 - mercN / Math.PI) * 0.5 * scale;
  return { x, y };
}

/**
 * Clusters destination records based on screen pixel proximity at the current zoom level.
 * @param destinations List of destinations to cluster
 * @param zoom Current map zoom level (typically 5 to 18)
 * @param clusterRadiusPx Pixel radius threshold within which points are grouped (default 55px)
 * @param enabled Whether clustering is active (if false, returns all points as single markers)
 */
export function clusterDestinations(
  destinations: NorthDestinationRecord[],
  zoom: number,
  clusterRadiusPx = 55,
  enabled = true
): DisplayMarkerItem[] {
  if (!enabled || zoom >= 10 || destinations.length <= 1) {
    return destinations.map((d) => ({
      id: d.id,
      isCluster: false,
      destination: d,
    }));
  }

  const assigned = new Set<string>();
  const results: DisplayMarkerItem[] = [];

  // Project all points to pixel space once
  const projected = destinations.map((d) => ({
    record: d,
    pixel: latLngToPixel(d.latitude, d.longitude, zoom),
  }));

  for (let i = 0; i < projected.length; i++) {
    const p1 = projected[i];
    if (assigned.has(p1.record.id)) continue;

    const clusterGroup: NorthDestinationRecord[] = [p1.record];
    assigned.add(p1.record.id);

    for (let j = i + 1; j < projected.length; j++) {
      const p2 = projected[j];
      if (assigned.has(p2.record.id)) continue;

      const dx = p1.pixel.x - p2.pixel.x;
      const dy = p1.pixel.y - p2.pixel.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= clusterRadiusPx) {
        clusterGroup.push(p2.record);
        assigned.add(p2.record.id);
      }
    }

    if (clusterGroup.length > 1) {
      // Calculate cluster centroid
      const avgLat =
        clusterGroup.reduce((sum, item) => sum + item.latitude, 0) / clusterGroup.length;
      const avgLng =
        clusterGroup.reduce((sum, item) => sum + item.longitude, 0) / clusterGroup.length;

      const uniqueSubregions = Array.from(new Set(clusterGroup.map((c) => c.subregion)));

      results.push({
        id: `cluster-${p1.record.id}-${clusterGroup.length}`,
        isCluster: true,
        latitude: avgLat,
        longitude: avgLng,
        count: clusterGroup.length,
        destinations: clusterGroup,
        subregions: uniqueSubregions,
      });
    } else {
      results.push({
        id: p1.record.id,
        isCluster: false,
        destination: p1.record,
      });
    }
  }

  return results;
}
