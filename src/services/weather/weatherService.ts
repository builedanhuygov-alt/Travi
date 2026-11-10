import type { WeatherAssessment } from '../../types/adaptiveTravel.ts';

function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

type ClimateZone = 'North Vietnam' | 'Central Vietnam' | 'South Vietnam' | 'Highlands';

function detectClimateZone(destination: string): ClimateZone {
  const norm = normalizeText(destination);
  if (/da lat|dak lak|gia lai|kon tum|buon ma thuot|pleiku|dak nong|lam dong/.test(norm)) {
    return 'Highlands';
  }
  if (/hue|da nang|hoi an|quang nam|quang binh|quang tri|nha trang|phu yen|binh dinh|quy nhon|phan thiet|ninh thuan/.test(norm)) {
    return 'Central Vietnam';
  }
  if (/saigon|ho chi minh|can tho|mekong|phu quoc|con dao|vung tau|an giang|ben tre|kien giang/.test(norm)) {
    return 'South Vietnam';
  }
  return 'North Vietnam';
}

/**
 * Assesses the weather suitability and seasonal recommendations for a destination.
 * Based on authentic meteorological patterns across Vietnam's 4 primary climate zones.
 */
export function assessDestinationWeather(
  destination: string,
  targetMonth?: number
): WeatherAssessment {
  const currentMonth = targetMonth && targetMonth >= 1 && targetMonth <= 12
    ? targetMonth
    : new Date().getMonth() + 1;

  const climateZone = detectClimateZone(destination);

  let isOptimalSeason = false;
  let suitabilityScore = 75;
  let seasonName = '';
  let advisory = '';
  let temperatureRange = '';
  let rainRisk: 'Low' | 'Moderate' | 'High' = 'Low';

  switch (climateZone) {
    case 'North Vietnam': {
      if (currentMonth >= 9 && currentMonth <= 11) {
        isOptimalSeason = true;
        suitabilityScore = 95;
        seasonName = 'Mùa Thu Vàng (Golden Autumn)';
        temperatureRange = '19°C — 26°C';
        rainRisk = 'Low';
        advisory =
          'Thời điểm vàng lý tưởng nhất trong năm: trời hanh khô, nắng nhẹ, lúa chín vàng tại các bậc thang và hoa tam giác mạch bung nở.';
      } else if (currentMonth >= 12 || currentMonth <= 2) {
        isOptimalSeason = false;
        suitabilityScore = 70;
        seasonName = 'Mùa Đông Vùng Cao (Winter Frost & Mist)';
        temperatureRange = '10°C — 17°C (vùng cao 5°C - 10°C)';
        rainRisk = 'Low';
        advisory =
          'Thời tiết se lạnh đến rét buốt kèm sương mù. Nên trang bị áo ấm nhiều lớp, áo gió chống ẩm khi khám phá đèo núi.';
      } else if (currentMonth >= 3 && currentMonth <= 4) {
        isOptimalSeason = true;
        suitabilityScore = 85;
        seasonName = 'Mùa Xuân Hoa Nở (Spring Blossom)';
        temperatureRange = '18°C — 25°C';
        rainRisk = 'Moderate';
        advisory =
          'Thời tiết mát mẻ, trăm hoa đua nở (hoa ban, hoa mận, hoa đào). Thỉnh thoảng có mưa phùn nhẹ đầu xuân.';
      } else {
        isOptimalSeason = false;
        suitabilityScore = 65;
        seasonName = 'Mùa Hè Nhiệt Đới (Tropical Summer)';
        temperatureRange = '27°C — 35°C';
        rainRisk = 'High';
        advisory =
          'Thời tiết nóng ẩm, thỉnh thoảng có mưa rào nhiệt đới vào buổi chiều tối. Nên mang theo áo mưa nhẹ và theo dõi cảnh báo sạt lở đèo núi.';
      }
      break;
    }

    case 'Central Vietnam': {
      if (currentMonth >= 2 && currentMonth <= 8) {
        isOptimalSeason = true;
        suitabilityScore = 92;
        seasonName = 'Mùa Khô Nắng Đẹp (Dry Beach Season)';
        temperatureRange = '25°C — 34°C';
        rainRisk = 'Low';
        advisory =
          'Biển trong xanh, nắng rực rỡ, lý tưởng tuyệt đối để tắm biển, thám hiểm hang động Phong Nha và đi bộ phố cổ Hội An về đêm.';
      } else {
        isOptimalSeason = false;
        suitabilityScore = 55;
        seasonName = 'Mùa Mưa Bão Miền Trung (Monsoon & Flood Season)';
        temperatureRange = '22°C — 27°C';
        rainRisk = 'High';
        advisory =
          'Mùa cao điểm mưa lũ và ảnh hưởng bão nhiệt đới. Cần theo dõi chặt chẽ dự báo thủy triều và hạn chế các hoạt động đi thuyền trên sông hay hang động.';
      }
      break;
    }

    case 'South Vietnam': {
      if (currentMonth >= 11 || currentMonth <= 4) {
        isOptimalSeason = true;
        suitabilityScore = 95;
        seasonName = 'Mùa Nắng Phương Nam (Southern Dry Season)';
        temperatureRange = '26°C — 33°C';
        rainRisk = 'Low';
        advisory =
          'Nắng vàng rực rỡ, độ ẩm dễ chịu, biển Côn Đảo và Phú Quốc sóng êm phẳng lặng như gương.';
      } else {
        isOptimalSeason = true;
        suitabilityScore = 80;
        seasonName = 'Mùa Mưa Xanh (Green Refreshing Season)';
        temperatureRange = '25°C — 32°C';
        rainRisk = 'Moderate';
        advisory =
          'Mưa rào nhiệt đới ngắn (khoảng 30-45 phút vào đầu giờ chiều), sau đó trời nhanh chóng tạnh ráo, cây trái miền Tây vào mùa trĩu quả.';
      }
      break;
    }

    case 'Highlands': {
      if (currentMonth >= 11 || currentMonth <= 3) {
        isOptimalSeason = true;
        suitabilityScore = 94;
        seasonName = 'Mùa Khô Tây Nguyên & Mùa Dã Quỳ';
        temperatureRange = '15°C — 26°C';
        rainRisk = 'Low';
        advisory =
          'Khí hậu mát lành, nắng trong, mùa hoa dã quỳ nở rộ khắp các triền đồi đất đỏ bazan và mùa thu hoạch cà phê rộn ràng.';
      } else {
        isOptimalSeason = false;
        suitabilityScore = 70;
        seasonName = 'Mùa Mưa Tây Nguyên';
        temperatureRange = '18°C — 26°C';
        rainRisk = 'High';
        advisory =
          'Đường đất đỏ có thể trơn trượt vào những ngày mưa lớn. Ưu tiên các điểm trải nghiệm trong nhà, bảo tàng văn hóa cồng chiêng và quán cà phê nông trại.';
      }
      break;
    }
  }

  return {
    destination,
    targetMonth: currentMonth,
    isOptimalSeason,
    suitabilityScore,
    seasonName,
    climateZone,
    advisory,
    temperatureRange,
    rainRisk,
  };
}

