import type {
  AdaptiveDestinationRecommendation,
  AdaptiveItineraryDay,
  AdaptiveItineraryResult,
  AdaptiveRouteMetrics,
  CustomerType,
  TransportationPreference,
  UserTravelProfile,
} from '../../types/adaptiveTravel.ts';
import { classifyCustomerType } from './customerClassifier.ts';
import { assessDestinationWeather } from '../weather/weatherService.ts';
import { tourismDataService } from '../tourism/tourismDataService.ts';
import { vietnamDestinations } from '../../data/vietnamData.ts';
import { calculateHaversineDistance, estimateDriveTimeHours } from '../map/routeEngine.ts';

function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * Weights per Customer Type according to recommendation priorities
 */
interface CustomerWeightConfig {
  culturalHeritageWeight: number;
  gastronomyWeight: number;
  natureOutdoorWeight: number;
  hiddenGemWeight: number;
  budgetAwarenessWeight: number;
  routeTransitWeight: number;
}

const WEIGHT_CONFIGS: Record<CustomerType, CustomerWeightConfig> = {
  INTERNATIONAL: {
    culturalHeritageWeight: 0.35,
    gastronomyWeight: 0.20,
    natureOutdoorWeight: 0.20,
    hiddenGemWeight: 0.05,
    budgetAwarenessWeight: 0.10,
    routeTransitWeight: 0.10,
  },
  DOMESTIC: {
    culturalHeritageWeight: 0.20,
    gastronomyWeight: 0.30,
    natureOutdoorWeight: 0.25,
    hiddenGemWeight: 0.10,
    budgetAwarenessWeight: 0.15,
    routeTransitWeight: 0.00,
  },
  LOCAL: {
    culturalHeritageWeight: 0.10,
    gastronomyWeight: 0.25,
    natureOutdoorWeight: 0.20,
    hiddenGemWeight: 0.35,
    budgetAwarenessWeight: 0.10,
    routeTransitWeight: 0.00,
  },
  INTERPROVINCIAL: {
    culturalHeritageWeight: 0.20,
    gastronomyWeight: 0.20,
    natureOutdoorWeight: 0.25,
    hiddenGemWeight: 0.10,
    budgetAwarenessWeight: 0.10,
    routeTransitWeight: 0.15,
  },
};

/**
 * Known provincial coordinates for route distance estimation
 */
const PROVINCIAL_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'ha noi': { lat: 21.0285, lng: 105.8542 },
  'son la': { lat: 21.3256, lng: 103.9144 },
  'tp. ho chi minh': { lat: 10.8231, lng: 106.6297 },
  'ho chi minh': { lat: 10.8231, lng: 106.6297 },
  'saigon': { lat: 10.8231, lng: 106.6297 },
  'da nang': { lat: 16.0544, lng: 108.2022 },
  'thua thien hue': { lat: 16.4637, lng: 107.5909 },
  'hue': { lat: 16.4637, lng: 107.5909 },
  'quang nam': { lat: 15.5994, lng: 108.2818 },
  'quang binh': { lat: 17.4691, lng: 106.6225 },
  'ninh binh': { lat: 20.2506, lng: 105.9745 },
  'lao cai': { lat: 22.4856, lng: 103.9707 },
  'ha giang': { lat: 22.8233, lng: 104.9839 },
  'khanh hoa': { lat: 12.2388, lng: 109.1967 },
  'lam dong': { lat: 11.9404, lng: 108.4583 },
  'kien giang': { lat: 10.0125, lng: 105.0809 },
};

export class AdaptiveRecommendationService {
  /**
   * Generates ranked destination and POI recommendations customized
   * to the user's detected/confirmed customer type.
   */
  public async getAdaptiveRecommendations(
    profile: UserTravelProfile
  ): Promise<{
    customerClassification: ReturnType<typeof classifyCustomerType>;
    recommendations: AdaptiveDestinationRecommendation[];
    weatherAssessment: ReturnType<typeof assessDestinationWeather>;
    routeMetrics?: AdaptiveRouteMetrics;
  }> {
    const classification = classifyCustomerType(profile);
    const customerType = classification.detected_type;
    const weights = WEIGHT_CONFIGS[customerType];

    const weather = assessDestinationWeather(profile.destination);
    const route = this.calculateRouteMetrics(profile.origin_province, profile.destination);

    const candidates: AdaptiveDestinationRecommendation[] = [];

    // 1. Gather candidates from curated National Destinations
    for (const dest of vietnamDestinations) {
      const matchScore = this.scoreDestination(dest, profile, customerType, weights, weather);
      if (matchScore.overallScore > 30) {
        candidates.push({
          id: dest.id,
          name: dest.name,
          vietnameseName: dest.vietnameseName,
          provinceOrRegion: dest.provinceOrMunicipality,
          subregion: dest.region,
          category: dest.categories[0] || 'Heritage & History',
          overallScore: matchScore.overallScore,
          customerTypeAlignmentScore: matchScore.customerTypeScore,
          interestMatchScore: matchScore.interestScore,
          budgetAlignmentScore: matchScore.budgetScore,
          weatherScore: weather.suitabilityScore,
          matchReasons: matchScore.reasons,
          customerTypeHighlight: matchScore.customerTypeHighlight,
          suggestedDuration: `${dest.estimatedVisitDays} ngày`,
          mustTryLocalFood: dest.mustTryFood.map((f) => `${f.name} (${f.vietnameseName})`),
          culturalHighlights: dest.attractions.slice(0, 3).map((a) => a.name),
          weatherInfo: weather,
          routeInfo: route,
          image: dest.heroImage,
          verificationStatus: 'verified',
          coordinateConfidence: 'exact',
          source: dest.provenanceMetadata.sourceName,
          isPoi: false,
        });
      }
    }

    // 2. Gather candidates from shared POI database (e.g. Sơn La & regional POIs)
    let pois = tourismDataService.getPois({
      province: profile.destination,
    });

    if (profile.interests && profile.interests.length > 0) {
      const matchedByInterest = pois.filter((poi) =>
        profile.interests.some((interest) => {
          const iNorm = normalizeText(interest);
          return (
            normalizeText(poi.category).includes(iNorm) ||
            normalizeText(poi.shortDescription).includes(iNorm) ||
            normalizeText(poi.longDescription).includes(iNorm) ||
            poi.experiences.some((ex) => normalizeText(ex).includes(iNorm))
          );
        })
      );
      if (matchedByInterest.length > 0) {
        pois = matchedByInterest;
      }
    }

    for (const poi of pois.slice(0, 8)) {
      const poiScore = this.scorePoi(poi, profile, customerType, weights);
      candidates.push({
        id: poi.id,
        name: poi.name,
        vietnameseName: poi.vietnameseName,
        provinceOrRegion: poi.provinceOrRegion,
        subregion: poi.subregion,
        category: poi.category,
        overallScore: poiScore.overallScore,
        customerTypeAlignmentScore: poiScore.customerTypeScore,
        interestMatchScore: poiScore.interestScore,
        budgetAlignmentScore: poiScore.budgetScore,
        weatherScore: weather.suitabilityScore,
        matchReasons: poiScore.reasons,
        customerTypeHighlight: poiScore.customerTypeHighlight,
        suggestedDuration: poi.recommendedDuration,
        mustTryLocalFood: poi.localFood,
        culturalHighlights: poi.culturalHighlights,
        weatherInfo: weather,
        routeInfo: route,
        image: poi.image,
        verificationStatus: poi.verificationStatus,
        coordinateConfidence: poi.coordinateConfidence,
        source: poi.source,
        isPoi: true,
      });
    }

    // Sort descending by overallScore
    candidates.sort((a, b) => b.overallScore - a.overallScore);

    return {
      customerClassification: classification,
      recommendations: candidates.slice(0, 10),
      weatherAssessment: weather,
      routeMetrics: route,
    };
  }

  /**
   * Generates an adaptive day-by-day itinerary tailored to customer type.
   */
  public async generateAdaptiveItinerary(
    profile: UserTravelProfile
  ): Promise<AdaptiveItineraryResult> {
    const classification = classifyCustomerType(profile);
    const customerType = classification.detected_type;
    const weather = assessDestinationWeather(profile.destination);
    const route = this.calculateRouteMetrics(profile.origin_province, profile.destination);

    const durationDays = Math.max(1, Math.min(profile.travel_duration || 3, 14));
    const budgetTier = profile.budget || 'Moderate';

    // Daily budget benchmarks in VND
    const dailyBudgetMap: Record<CustomerType, Record<string, number>> = {
      INTERNATIONAL: { Budget: 800000, Moderate: 1800000, Luxury: 4500000 },
      DOMESTIC: { Budget: 500000, Moderate: 1200000, Luxury: 3000000 },
      LOCAL: { Budget: 300000, Moderate: 700000, Luxury: 1800000 },
      INTERPROVINCIAL: { Budget: 650000, Moderate: 1500000, Luxury: 3500000 },
    };

    const dailyCost = dailyBudgetMap[customerType][budgetTier] || 1200000;
    const totalCostVND = dailyCost * durationDays;
    const totalCostUSD = Math.round(totalCostVND / 25400);

    // Retrieve grounding destination or POI
    const destNorm = normalizeText(profile.destination);
    const matchedDest = vietnamDestinations.find((d) =>
      normalizeText(d.name).includes(destNorm) || normalizeText(d.vietnameseName).includes(destNorm)
    ) || vietnamDestinations[0];

    const matchedPois = tourismDataService.getPois({ province: profile.destination });

    const days: AdaptiveItineraryDay[] = [];

    for (let dayNum = 1; dayNum <= durationDays; dayNum++) {
      const dayActivities: AdaptiveItineraryDay['activities'] = [];
      let dayTitle = '';
      let dayTheme = '';
      let dayRationale = '';

      if (dayNum === 1) {
        dayTitle = `Khởi hành & Tiếp cận ${matchedDest.name}`;
        dayTheme = 'Di chuyển, Check-in & Chào sân Ẩm thực';
        dayRationale = this.getDayRationale(customerType, 1);

        dayActivities.push({
          timeOfDay: 'Morning',
          title: route ? `Khởi hành từ ${route.origin} đến ${route.destination}` : `Di chuyển đến ${matchedDest.name}`,
          description: route
            ? `Hành trình ước tính ${route.estimatedTravelTimeHours} giờ (${route.estimatedRoadDistanceKm} km). Phương tiện đề xuất: ${route.recommendedTransport}.`
            : 'Nhận phòng, nghỉ ngơi sau hành trình và thưởng thức tách trà/cà phê bản địa.',
          location: matchedDest.provinceOrMunicipality,
          estimatedDuration: '3 - 4 Giờ',
          estimatedCostVND: 250000,
        });

        const foodItem = matchedDest.mustTryFood[0]?.name || 'Ẩm thực địa phương';
        dayActivities.push({
          timeOfDay: 'Evening',
          title: `Khám phá ẩm thực: ${foodItem}`,
          description: `Thưởng thức ${foodItem} tại các quán ăn danh tiếng lâu đời trong khu phố truyền thống.`,
          location: matchedDest.provinceOrMunicipality,
          estimatedDuration: '2 Giờ',
          estimatedCostVND: 120000,
        });
      } else if (dayNum === durationDays && durationDays > 1) {
        dayTitle = 'Lắng đọng Văn hóa & Mua sắm Đặc sản';
        dayTheme = 'Nghệ thuật Thủ công, Quà bản địa & Chia tay';
        dayRationale = this.getDayRationale(customerType, durationDays);

        dayActivities.push({
          timeOfDay: 'Morning',
          title: 'Dạo chợ truyền thống hoặc ghé làng nghề thủ công',
          description: 'Trực tiếp giao lưu với người dân bản địa, mua sắm thổ cẩm, trà shan tuyết hoặc gia vị Tây Bắc.',
          location: matchedDest.provinceOrMunicipality,
          estimatedDuration: '2.5 Giờ',
          estimatedCostVND: 150000,
        });

        dayActivities.push({
          timeOfDay: 'Afternoon',
          title: 'Hành trình trở về & Hoàn tất chuyến đi',
          description: 'Sắp xếp hành lý, check-out và di chuyển về điểm xuất phát.',
          location: matchedDest.provinceOrMunicipality,
          estimatedDuration: '3 Giờ',
          estimatedCostVND: 200000,
        });
      } else {
        // Core exploration days
        const poiIndex = (dayNum - 2) % (matchedPois.length || 1);
        const poi = matchedPois[poiIndex];
        const poiName = poi ? poi.vietnameseName : matchedDest.attractions[dayNum % matchedDest.attractions.length]?.name || 'Điểm tham quan danh thắng';

        dayTitle = `Khám phá Điểm nhấn: ${poiName}`;
        dayTheme = 'Thiên nhiên, Văn hóa & Trải nghiệm thực địa';
        dayRationale = this.getDayRationale(customerType, dayNum);

        dayActivities.push({
          timeOfDay: 'Morning',
          title: `Tham quan ${poiName}`,
          description: poi
            ? poi.shortDescription
            : 'Chiêm ngưỡng thắng cảnh thiên nhiên và lưu giữ những khung hình tuyệt đẹp.',
          location: poi?.address || matchedDest.provinceOrMunicipality,
          estimatedDuration: '3.5 Giờ',
          estimatedCostVND: 100000,
          unverifiedNotice: poi?.coordinateConfidence === 'none' ? 'Tọa độ GPS cổng vào đang chờ đối soát thực địa' : undefined,
        });

        dayActivities.push({
          timeOfDay: 'Afternoon',
          title: 'Trải nghiệm văn hóa & Hoạt động ngoài trời',
          description: 'Tham gia các hoạt động sinh hoạt cùng đồng bào hoặc đi bộ dạo quanh thung lũng.',
          location: matchedDest.provinceOrMunicipality,
          estimatedDuration: '2.5 Giờ',
          estimatedCostVND: 180000,
        });
      }

      days.push({
        dayNumber: dayNum,
        title: dayTitle,
        theme: dayTheme,
        rationaleForCustomerType: dayRationale,
        activities: dayActivities,
        dailyEstimatedCostVND: dailyCost,
      });
    }

    const adaptiveSummary = this.getAdaptiveSummary(customerType, matchedDest.name, durationDays, budgetTier);

    return {
      id: `itinerary-${Date.now().toString(36)}`,
      customerType,
      destination: matchedDest.name,
      durationDays,
      budgetTier,
      title: `Lịch trình Thích ứng ${durationDays} Ngày tại ${matchedDest.vietnameseName}`,
      summary: adaptiveSummary.summary,
      adaptiveRationale: adaptiveSummary.rationale,
      days,
      weatherAdvisory: weather,
      routeSummary: route,
      totalEstimatedCostVND: totalCostVND,
      totalEstimatedCostUSD: totalCostUSD,
      costDisclaimer:
        'Ước tính chi phí dựa trên mức chuẩn thực tế (khách sạn/homestay, ăn uống 3 bữa, vé tham quan và di chuyển nội vùng). Không bao gồm vé máy bay khứ hồi hoặc chi tiêu cá nhân xa xỉ.',
      dataSources: [
        'Cơ sở dữ liệu Du lịch Travi Verified Catalog',
        'Sở Văn hóa Thể thao và Du lịch địa phương',
        'Tổng cục Thống kê & Chuẩn hóa Hành chính 2025',
      ],
      provenance: {
        generator: 'Travi Adaptive Travel Intelligence Pipeline',
        isLiveAiGenerated: false,
        hasRetrievedGrounding: true,
      },
    };
  }

  private scoreDestination(
    dest: (typeof vietnamDestinations)[0],
    profile: UserTravelProfile,
    customerType: CustomerType,
    _weights: CustomerWeightConfig,
    weather: ReturnType<typeof assessDestinationWeather>
  ): {
    overallScore: number;
    customerTypeScore: number;
    interestScore: number;
    budgetScore: number;
    reasons: string[];
    customerTypeHighlight: string;
  } {
    const reasons: string[] = [];
    let customerTypeScore = 70;
    let customerTypeHighlight = '';

    // 1. Customer Type scoring
    switch (customerType) {
      case 'INTERNATIONAL':
        customerTypeScore = dest.isCurated ? 92 : 80;
        customerTypeHighlight =
          'Phù hợp cho du khách quốc tế với bề dày di sản văn hóa, có chỉ dẫn tiếng Anh và dịch vụ đón tiếp tiêu chuẩn.';
        reasons.push('Điểm đến văn hóa đặc sắc với chiều sâu lịch sử và ẩm thực dễ tiếp cận.');
        break;

      case 'DOMESTIC':
        customerTypeScore = 88;
        customerTypeHighlight =
          'Phù hợp du khách Việt Nam với các món đặc sản trứ danh, thắng cảnh nổi tiếng và chi phí hợp lý.';
        reasons.push(`Đặc sản ẩm thực độc đáo: ${dest.mustTryFood.slice(0, 2).map((f) => f.name).join(', ')}.`);
        break;

      case 'LOCAL':
        customerTypeScore = 78;
        customerTypeHighlight =
          'Điểm dã ngoại và trải nghiệm thư giãn cuối tuần không tốn nhiều thời gian di chuyển.';
        reasons.push('Thời gian thăm thú linh hoạt, thích hợp cho chuyến đi 1-2 ngày.');
        break;

      case 'INTERPROVINCIAL':
        customerTypeScore = 90;
        customerTypeHighlight =
          'Tuyến liên tỉnh thuận tiện kết nối bằng tàu hỏa hoặc xe limousine giường nằm cao cấp.';
        reasons.push('Vị trí chiến lược dễ dàng kết hợp vào hành trình liên vùng.');
        break;
    }

    // 2. Interest alignment
    let interestScore = 70;
    if (profile.interests && profile.interests.length > 0) {
      let matches = 0;
      for (const interest of profile.interests) {
        const iNorm = normalizeText(interest);
        const hasMatch =
          dest.categories.some((c) => normalizeText(c).includes(iNorm)) ||
          dest.attractions.some((a) => normalizeText(a.name).includes(iNorm)) ||
          normalizeText(dest.description).includes(iNorm);
        if (hasMatch) matches++;
      }
      interestScore = Math.min(95, 60 + matches * 15);
      if (matches > 0) {
        reasons.push(`Phù hợp với sở thích: ${profile.interests.join(', ')}.`);
      }
    }

    // 3. Budget alignment
    let budgetScore = 80;
    if (profile.budget === 'Budget') {
      budgetScore = dest.budgetEstimates.budgetDailyVND < 900000 ? 90 : 70;
    } else if (profile.budget === 'Luxury') {
      budgetScore = dest.budgetEstimates.luxuryDailyVND > 3000000 ? 95 : 75;
    }

    // Blend final overall score
    const overallScore = Math.round(
      customerTypeScore * 0.4 +
        interestScore * 0.35 +
        budgetScore * 0.15 +
        weather.suitabilityScore * 0.1
    );

    return {
      overallScore,
      customerTypeScore,
      interestScore,
      budgetScore,
      reasons,
      customerTypeHighlight,
    };
  }

  private scorePoi(
    poi: ReturnType<typeof tourismDataService.getPoiById> extends infer T ? (T extends undefined ? never : T) : never,
    _profile: UserTravelProfile,
    customerType: CustomerType,
    _weights: CustomerWeightConfig
  ): {
    overallScore: number;
    customerTypeScore: number;
    interestScore: number;
    budgetScore: number;
    reasons: string[];
    customerTypeHighlight: string;
  } {
    const reasons: string[] = [];
    let customerTypeScore = 75;
    let customerTypeHighlight = '';

    if (customerType === 'LOCAL') {
      customerTypeScore = 94;
      customerTypeHighlight = 'Điểm đến bản địa chưa bị thương mại hóa, lý tưởng cho người địa phương đổi gió cuối tuần.';
      reasons.push('Điểm đến độc đáo thuộc cơ sở dữ liệu Sở VHTT&DL, không đông đúc bẫy du lịch.');
    } else if (customerType === 'DOMESTIC') {
      customerTypeScore = 85;
      customerTypeHighlight = 'Khám phá văn hóa bản sắc địa phương chân thực.';
      reasons.push(`Trải nghiệm ẩm thực dân tộc: ${poi.localFood.slice(0, 2).join(', ')}.`);
    } else if (customerType === 'INTERNATIONAL') {
      customerTypeScore = 80;
      customerTypeHighlight = 'Trải nghiệm cộng đồng nguyên bản vùng cao.';
      reasons.push('Minh chứng văn hóa các dân tộc thiểu số Tây Bắc.');
    } else {
      customerTypeScore = 86;
      customerTypeHighlight = 'Điểm dừng chân đặc sắc trong lộ trình xuyên tỉnh.';
      reasons.push('Kết nối thuận tiện trong cung đường Tây Bắc.');
    }

    const overallScore = Math.round(customerTypeScore * 0.6 + 80 * 0.4);

    return {
      overallScore,
      customerTypeScore,
      interestScore: 80,
      budgetScore: 85,
      reasons,
      customerTypeHighlight,
    };
  }

  private calculateRouteMetrics(
    originProvince?: string,
    destinationProvince?: string
  ): AdaptiveRouteMetrics | undefined {
    if (!originProvince || !destinationProvince) return undefined;

    const origNorm = normalizeText(originProvince);
    const destNorm = normalizeText(destinationProvince);

    const origCoords = PROVINCIAL_COORDINATES[origNorm];
    const destCoords = PROVINCIAL_COORDINATES[destNorm];

    if (!origCoords || !destCoords) {
      return {
        origin: originProvince,
        destination: destinationProvince,
        straightLineDistanceKm: 180,
        estimatedRoadDistanceKm: 260,
        estimatedTravelTimeHours: 5.5,
        recommendedTransport: 'Scenic Limousine Sleeper Bus',
        terrainType: 'mixed_terrain',
        notes: 'Khoảng cách ước tính giữa hai tỉnh. Khuyến nghị kiểm tra lộ trình thực tế trước khi xuất phát.',
      };
    }

    const straightDist = calculateHaversineDistance(
      origCoords.lat,
      origCoords.lng,
      destCoords.lat,
      destCoords.lng
    );

    const isMountain =
      /son la|lao cai|ha giang|dien bien|lai chau|hoa binh|cao bang|bac kan/.test(origNorm) ||
      /son la|lao cai|ha giang|dien bien|lai chau|hoa binh|cao bang|bac kan/.test(destNorm);

    const terrainType = isMountain ? 'mountain_pass' : 'delta_highway';
    const driveHours = estimateDriveTimeHours(straightDist, terrainType);
    const roadKm = Math.round(straightDist * (isMountain ? 1.65 : 1.25));

    let recTransport: TransportationPreference = 'Private Car & Driver';
    if (straightDist > 500) {
      recTransport = 'Domestic Flights';
    } else if (straightDist > 200) {
      recTransport = isMountain ? 'Scenic Limousine Sleeper Bus' : 'Reunification Express Train';
    } else {
      recTransport = 'Private Car & Driver';
    }

    return {
      origin: originProvince,
      destination: destinationProvince,
      straightLineDistanceKm: straightDist,
      estimatedRoadDistanceKm: roadKm,
      estimatedTravelTimeHours: driveHours,
      recommendedTransport: recTransport,
      terrainType,
      notes: isMountain
        ? 'Tuyến đường đèo núi uốn lượn, tốc độ trung bình 35-45 km/h. Khuyến nghị nghỉ chân giữa chặng.'
        : 'Tuyến quốc lộ/cao tốc đồng bằng thông thoáng, tốc độ trung bình 65-80 km/h.',
    };
  }

  private getDayRationale(customerType: CustomerType, dayNumber: number): string {
    switch (customerType) {
      case 'INTERNATIONAL':
        return dayNumber === 1
          ? 'Ưu tiên nhịp độ nhẹ nhàng để thích nghi múi giờ, làm quen văn hóa giao tiếp và thưởng thức ẩm thực truyền thống dễ chịu.'
          : 'Đi sâu vào các di tích di sản quốc gia và làng nghề có thợ thủ công bản địa.';
      case 'DOMESTIC':
        return dayNumber === 1
          ? 'Tập trung vào thưởng thức các món ăn đặc sản nổi danh và check-in các thắng cảnh biểu tượng của tỉnh.'
          : 'Tối ưu hóa thời gian khám phá ẩm thực vùng miền và các danh thắng thiên nhiên.';
      case 'LOCAL':
        return 'Tập trung vào các điểm đến yên tĩnh, chưa bị thương mại hóa, thưởng thức bữa ăn bình dị và không gian thư giãn cuối tuần.';
      case 'INTERPROVINCIAL':
        return 'Lộ trình tối ưu khoảng cách di chuyển giữa các trạm, bố trí thời gian nghỉ ngơi hợp lý sau chặng đi đường dài.';
    }
  }

  private getAdaptiveSummary(
    customerType: CustomerType,
    destName: string,
    durationDays: number,
    budgetTier: string
  ): { summary: string; rationale: string } {
    switch (customerType) {
      case 'INTERNATIONAL':
        return {
          summary: `Hành trình ${durationDays} ngày khám phá chiều sâu văn hóa và vẻ đẹp thiên nhiên tại ${destName}, thiết kế riêng cho du khách quốc tế với nhịp độ thư thái và hướng dẫn thực địa chi tiết.`,
          rationale:
            'Ưu tiên giải thích nguồn gốc lịch sử, nghi thức văn hóa bản địa, lựa chọn các điểm tham quan đã xác thực lối vào và hỗ trợ song ngữ.',
        };
      case 'DOMESTIC':
        return {
          summary: `Chuyến du ngoạn ${durationDays} ngày tại ${destName} với sự kết hợp hài hòa giữa ẩm thực tinh hoa, danh lam thắng cảnh tiêu biểu và chi phí (${budgetTier}) hợp lý nhất.`,
          rationale:
            'Tập trung tối đa vào trải nghiệm ẩm thực bản địa chính gốc, địa điểm chụp ảnh lưu niệm đẹp và các tiện ích phù hợp gia đình hoặc nhóm bạn.',
        };
      case 'LOCAL':
        return {
          summary: `Kế hoạch nghỉ dưỡng ${durationDays} ngày tìm về chốn bình yên ngay tại ${destName}, khám phá những góc khuất thiên nhiên mộc mạc và ẩm thực dân dã mà ít khách vãng lai biết tới.`,
          rationale:
            'Tránh xa các tụ điểm du lịch đông đúc; tôn vinh các homestay sinh thái, đồi chè, suối tự nhiên và các quán ăn truyền thống của người bản địa.',
        };
      case 'INTERPROVINCIAL':
        return {
          summary: `Lịch trình liên tỉnh ${durationDays} ngày kết nối mượt mà tới ${destName}, tối ưu hóa thời gian trung chuyển và bao trọn các trải nghiệm vùng miền đặc sắc nhất.`,
          rationale:
            'Phân bổ thời gian khoa học cho các chặng di chuyển liên tỉnh, gợi ý phương tiện vận tải đường dài thuận tiện và đảm bảo sức khỏe dẻo dai cho cả chuyến đi.',
        };
    }
  }
}

export const adaptiveRecommendationService = new AdaptiveRecommendationService();
