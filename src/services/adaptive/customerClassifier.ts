import type {
  CustomerClassificationResult,
  CustomerType,
  UserTravelProfile,
  TravelMarket,
  TravelScope,
  TravelPersona,
  TravelLanguage,
  LocationHierarchy,
} from '../../types/adaptiveTravel.ts';

const ALL_CUSTOMER_TYPES: CustomerType[] = [
  'INTERNATIONAL',
  'DOMESTIC',
  'LOCAL',
  'INTERPROVINCIAL',
];

function normalizeText(str?: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase();
}

const VIETNAM_COUNTRY_KEYWORDS = [
  'vietnam',
  'viet nam',
  'vn',
  'việt nam',
  'vietnamese',
];

/**
 * Classifies a traveler into one of 4 customer types based on origin,
 * destination, residency context, and language preferences.
 * Does NOT rely on nationality alone. Allows explicit user override.
 */
export function classifyCustomerType(
  profile: Partial<UserTravelProfile>
): CustomerClassificationResult {
  // 1. Explicit user override takes highest precedence
  if (profile.customer_type && ALL_CUSTOMER_TYPES.includes(profile.customer_type)) {
    return {
      detected_type: profile.customer_type,
      confidence: 1.0,
      reasons: [
        `Người dùng đã chủ động xác nhận nhóm khách du lịch: ${profile.customer_type}.`,
      ],
      is_overridden: true,
      available_types: ALL_CUSTOMER_TYPES,
    };
  }

  const originCountryNorm = normalizeText(profile.origin_country);
  const originProvinceNorm = normalizeText(profile.origin_province);
  const destinationNorm = normalizeText(profile.destination);
  const language = profile.preferred_language || 'vi';

  const reasons: string[] = [];

  // 2. Check if traveler originates from outside Vietnam
  const isForeignCountry =
    originCountryNorm.length > 0 &&
    !VIETNAM_COUNTRY_KEYWORDS.includes(originCountryNorm);

  if (isForeignCountry) {
    reasons.push(
      `Điểm khởi hành quốc tế (${profile.origin_country || 'nước ngoài'}). Ưu tiên ngôn ngữ đa ngữ, chiều sâu văn hóa và hướng dẫn thực địa.`
    );
    return {
      detected_type: 'INTERNATIONAL',
      confidence: 0.95,
      reasons,
      is_overridden: false,
      available_types: ALL_CUSTOMER_TYPES,
    };
  }

  // 3. Foreign language indicator when origin country is not specified
  if (!originCountryNorm && (language === 'en' || language === 'fr' || language === 'ja' || language === 'ko' || language === 'zh')) {
    reasons.push(
      `Ngôn ngữ ưu tiên (${language.toUpperCase()}) và chưa xác định tỉnh thành cư trú tại Việt Nam.`
    );
    return {
      detected_type: 'INTERNATIONAL',
      confidence: 0.85,
      reasons,
      is_overridden: false,
      available_types: ALL_CUSTOMER_TYPES,
    };
  }

  // 4. Check if traveler is exploring within their home province / local area
  const isSameProvince =
    originProvinceNorm.length > 0 &&
    destinationNorm.length > 0 &&
    (originProvinceNorm === destinationNorm ||
      originProvinceNorm.includes(destinationNorm) ||
      destinationNorm.includes(originProvinceNorm));

  if (isSameProvince) {
    reasons.push(
      `Điểm khởi hành và điểm đến cùng nằm trong địa bàn ${profile.origin_province}. Ưu tiên điểm đến chưa phổ biến (hidden gems), trải nghiệm cuối tuần và ẩm thực địa phương.`
    );
    return {
      detected_type: 'LOCAL',
      confidence: 0.95,
      reasons,
      is_overridden: false,
      available_types: ALL_CUSTOMER_TYPES,
    };
  }

  // 5. Interprovincial vs Domestic distinction
  // When origin province is known and different from destination province
  if (originProvinceNorm.length > 0 && destinationNorm.length > 0 && !isSameProvince) {
    const isMultiDay = (profile.travel_duration || 1) >= 2;
    if (isMultiDay) {
      reasons.push(
        `Hành trình di chuyển giữa các tỉnh (${profile.origin_province} → ${profile.destination}) kéo dài ${profile.travel_duration} ngày. Ưu tiên tối ưu hóa lộ trình liên tỉnh, phương tiện trung chuyển và trải nghiệm vùng miền.`
      );
      return {
        detected_type: 'INTERPROVINCIAL',
        confidence: 0.9,
        reasons,
        is_overridden: false,
        available_types: ALL_CUSTOMER_TYPES,
      };
    } else {
      reasons.push(
        `Chuyến du lịch trong nước từ ${profile.origin_province} đến ${profile.destination}. Ưu tiên ngân sách tối ưu, ẩm thực đặc sản và danh lam thắng cảnh tiêu biểu.`
      );
      return {
        detected_type: 'DOMESTIC',
        confidence: 0.88,
        reasons,
        is_overridden: false,
        available_types: ALL_CUSTOMER_TYPES,
      };
    }
  }

  // 6. Default fallback for Vietnamese travelers
  reasons.push(
    'Khách du lịch nội địa khám phá danh lam thắng cảnh Việt Nam với cấu trúc lịch trình cân bằng và chi phí hợp lý.'
  );
  return {
    detected_type: 'DOMESTIC',
    confidence: 0.8,
    reasons,
    is_overridden: false,
    available_types: ALL_CUSTOMER_TYPES,
  };
}

export interface ResolvedMultiDimensionalProfile {
  market: TravelMarket;
  origin_location: LocationHierarchy;
  destination_location: LocationHierarchy;
  travel_scope: TravelScope;
  persona: TravelPersona;
  language: TravelLanguage;
  detected_type: CustomerType;
  reasons: string[];
}

/**
 * Resolves distinct coexisting dimensions:
 * - Market: DOMESTIC / INTERNATIONAL
 * - Origin / Destination: country, province, city
 * - Travel Scope: LOCAL / INTERPROVINCIAL / INTERNATIONAL_TRAVEL
 * - Persona: FAMILY / BACKPACKER / SOLO / EXPLORER
 * - Language: VI / EN / OTHER
 */
export function resolveMultiDimensionalProfile(
  profile: Partial<UserTravelProfile>
): ResolvedMultiDimensionalProfile {
  const classification = classifyCustomerType(profile);
  const detectedType = classification.detected_type;

  // 1. Market
  const originCountryNorm = normalizeText(profile.origin_country);
  const isForeign = originCountryNorm.length > 0 && !VIETNAM_COUNTRY_KEYWORDS.includes(originCountryNorm);
  const market: TravelMarket = profile.market || (isForeign ? 'INTERNATIONAL' : 'DOMESTIC');

  // 2. Locations
  const origin_location: LocationHierarchy = profile.origin_location || {
    country: profile.origin_country || (isForeign ? 'Quốc tế' : 'Việt Nam'),
    province: profile.origin_province,
  };
  const destination_location: LocationHierarchy = profile.destination_location || {
    country: 'Việt Nam',
    province: profile.destination,
  };

  // 3. Travel Scope
  let travel_scope: TravelScope = profile.travel_scope || (
    isForeign
      ? 'INTERNATIONAL_TRAVEL'
      : detectedType === 'LOCAL'
      ? 'LOCAL'
      : 'INTERPROVINCIAL'
  );

  // 4. Persona
  let persona: TravelPersona = profile.persona || 'EXPLORER';
  if (!profile.persona) {
    if (profile.travel_companions === 'Family') {
      persona = 'FAMILY';
    } else if (profile.travel_companions === 'Solo') {
      persona = 'SOLO';
    } else if (profile.budget === 'Budget' || profile.transportation_preference === 'Motorbike Loop') {
      persona = 'BACKPACKER';
    } else {
      persona = 'EXPLORER';
    }
  }

  // 5. Language
  let language: TravelLanguage = profile.language || (
    profile.preferred_language === 'en'
      ? 'EN'
      : profile.preferred_language && profile.preferred_language !== 'vi'
      ? 'OTHER'
      : 'VI'
  );

  return {
    market,
    origin_location,
    destination_location,
    travel_scope,
    persona,
    language,
    detected_type: detectedType,
    reasons: classification.reasons,
  };
}

