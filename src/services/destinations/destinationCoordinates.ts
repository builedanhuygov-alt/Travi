/**
 * Verified Geographic Coordinates for Vietnam Destinations
 * Provides real latitude and longitude mapping for Vietnam provinces and regions.
 */

import { vietnamDestinations } from '../../data/vietnamData.ts';

export interface DestinationCoordinates {
  id: string;
  lat: number;
  lng: number;
  culturalRegionName: string;
}

export const DESTINATION_COORDINATES: Record<string, DestinationCoordinates> = {};

// Populate verified coordinates from Vietnam Destination database
vietnamDestinations.forEach((dest) => {
  DESTINATION_COORDINATES[dest.id] = {
    id: dest.id,
    lat: dest.coordinates.lat,
    lng: dest.coordinates.lng,
    culturalRegionName: `${dest.provinceOrMunicipality} • ${dest.region}`,
  };
});

// Alias mapping for flexible resolution (e.g. 'hanoi' -> 'ha-noi')
const ALIASES: Record<string, string> = {
  hanoi: 'ha-noi',
  hagiang: 'ha-giang',
  sapa: 'lao-cai-sapa',
  ninhbinh: 'ninh-binh',
  halong: 'quang-ninh-halong',
  caobang: 'cao-bang',
  mucangchai: 'yen-bai-mucangchai',
  hue: 'thua-thien-hue',
  hoian: 'quang-nam-hoian',
  danang: 'da-nang',
  phongnha: 'quang-binh-phongnha',
  quynhon: 'binh-dinh-quynhon',
  nhatrang: 'khanh-hoa-nhatrang',
  dalat: 'lam-dong-dalat',
  buonmathuot: 'dak-lak-buonmathuot',
  mangden: 'kon-tum-mangden',
  saigon: 'tp-ho-chi-minh',
  hcmc: 'tp-ho-chi-minh',
  cantho: 'can-tho-mekong',
  phuquoc: 'kien-giang-phuquoc',
  condao: 'ba-ria-condao',
  chaudoc: 'an-giang-chaudoc',
};

export function getDestinationCoordinates(idOrAlias: string): DestinationCoordinates | null {
  const normalized = idOrAlias.toLowerCase().trim();
  const resolvedId = ALIASES[normalized] || normalized;
  return DESTINATION_COORDINATES[resolvedId] || null;
}

// Deprecated backward-compatible aliases
export const SANCTUARY_COORDINATES = DESTINATION_COORDINATES;
export const getSanctuaryCoordinates = getDestinationCoordinates;
