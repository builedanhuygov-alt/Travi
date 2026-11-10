/**
 * TRAVI — Vietnam Maritime Sovereignty & Islands Configuration
 * Official Cartographic & Administrative Reference for Vietnamese Archipelagos
 *
 * Source Provenance:
 * 1. Ủy ban Biên giới Quốc gia — Bộ Ngoại giao nước CHXHCN Việt Nam
 * 2. Nghị định số 07/NĐ-CP ngày 23/01/1997 của Chính phủ (Thành lập Huyện Hoàng Sa, TP. Đà Nẵng)
 * 3. Nghị định số 65/CP ngày 05/10/1993 & Quyết định 193-HĐBT ngày 09/12/1982 của Hội đồng Bộ trưởng (Thành lập Huyện Trường Sa, Tỉnh Khánh Hòa)
 * 4. Cục Đo đạc, Bản đồ và Thông tin địa lý Việt Nam — Bộ Tài nguyên và Môi trường
 */

export interface IslandFeature {
  id: string;
  name: string;
  vietnameseName: string;
  latitude: number;
  longitude: number;
  featureDescription: string;
  isAdministrativeCenter?: boolean;
  status: 'verified';
  sourceReference: string;
}

export interface VietnamArchipelagoRecord {
  id: 'hoang-sa' | 'truong-sa';
  /** Exact official Vietnamese label required by cartographic guidelines */
  officialLabel: string;
  shortName: string;
  administrativeUnit: string;
  governingProvinceOrCity: string;
  legalFoundation: string;
  centroid: [number, number]; // [Latitude, Longitude]
  defaultZoom: number;
  bounds: [[number, number], [number, number]]; // [[minLat, minLng], [maxLat, maxLng]]
  explanatoryCaption: string;
  sources: {
    title: string;
    authority: string;
    documentRef: string;
  }[];
  keyIslands: IslandFeature[];
}

export const VIETNAM_ARCHIPELAGOS: Record<'hoangSa' | 'truongSa', VietnamArchipelagoRecord> = {
  hoangSa: {
    id: 'hoang-sa',
    officialLabel: 'QUẦN ĐẢO HOÀNG SA – VIỆT NAM',
    shortName: 'Hoàng Sa',
    administrativeUnit: 'Huyện Hoàng Sa',
    governingProvinceOrCity: 'Thành phố Đà Nẵng',
    legalFoundation: 'Nghị định số 07/NĐ-CP ngày 23/01/1997 của Chính phủ',
    centroid: [16.5333, 111.6000], // Đảo Hoàng Sa (Pattle Island)
    defaultZoom: 8,
    bounds: [
      [15.75, 111.15],
      [17.15, 112.85],
    ],
    explanatoryCaption:
      'Quần đảo Hoàng Sa là phần lãnh thổ thiêng liêng, không thể tách rời của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. Về mặt hành chính, toàn bộ quần đảo thuộc Huyện đảo Hoàng Sa, trực thuộc Ủy ban Nhân dân Thành phố Đà Nẵng.',
    sources: [
      {
        title: 'Chủ quyền Việt Nam đối với hai quần đảo Hoàng Sa và Trường Sa',
        authority: 'Ủy ban Biên giới Quốc gia — Bộ Ngoại giao Việt Nam',
        documentRef: 'Sách trắng / Cổng Thông tin Điện tử Bộ Ngoại giao (mofa.gov.vn)',
      },
      {
        title: 'Thành lập đơn vị hành chính Huyện Hoàng Sa',
        authority: 'Chính phủ nước Cộng hòa Xã hội Chủ nghĩa Việt Nam',
        documentRef: 'Nghị định số 07/NĐ-CP ngày 23/01/1997',
      },
    ],
    keyIslands: [
      {
        id: 'dao-hoang-sa',
        name: 'Hoang Sa Island (Pattle Island)',
        vietnameseName: 'Đảo Hoàng Sa',
        latitude: 16.5333,
        longitude: 111.6000,
        featureDescription: 'Đảo chính thuộc nhóm Lưỡi Liềm (Trăng Khuyết) của quần đảo Hoàng Sa',
        isAdministrativeCenter: true,
        status: 'verified',
        sourceReference: 'Cục Đo đạc, Bản đồ và Thông tin địa lý Việt Nam',
      },
      {
        id: 'dao-tri-ton',
        name: 'Triton Island',
        vietnameseName: 'Đảo Tri Tôn',
        latitude: 15.7833,
        longitude: 111.2000,
        featureDescription: 'Đảo nằm ở cực tây nam của quần đảo Hoàng Sa',
        status: 'verified',
        sourceReference: 'Ủy ban Biên giới Quốc gia',
      },
      {
        id: 'dao-phu-lam',
        name: 'Woody Island',
        vietnameseName: 'Đảo Phú Lâm',
        latitude: 16.8333,
        longitude: 112.3333,
        featureDescription: 'Đảo thuộc nhóm An Vĩnh của quần đảo Hoàng Sa',
        status: 'verified',
        sourceReference: 'Ủy ban Biên giới Quốc gia',
      },
      {
        id: 'dao-cay',
        name: 'Tree Island',
        vietnameseName: 'Đảo Cây (Đảo Ba Đầu)',
        latitude: 16.9833,
        longitude: 112.2667,
        featureDescription: 'Đảo cát và rạn san hô phía bắc nhóm An Vĩnh',
        status: 'verified',
        sourceReference: 'Ủy ban Biên giới Quốc gia',
      },
      {
        id: 'dao-linh-con',
        name: 'Lincoln Island',
        vietnameseName: 'Đảo Linh Côn',
        latitude: 16.6667,
        longitude: 112.7333,
        featureDescription: 'Đảo nằm ở cực đông của quần đảo Hoàng Sa',
        status: 'verified',
        sourceReference: 'Cục Đo đạc, Bản đồ và Thông tin địa lý Việt Nam',
      },
    ],
  },
  truongSa: {
    id: 'truong-sa',
    officialLabel: 'QUẦN ĐẢO TRƯỜNG SA – VIỆT NAM',
    shortName: 'Trường Sa',
    administrativeUnit: 'Huyện Trường Sa',
    governingProvinceOrCity: 'Tỉnh Khánh Hòa',
    legalFoundation: 'Nghị định số 65/CP ngày 05/10/1993 & Quyết định 193-HĐBT ngày 09/12/1982',
    centroid: [8.6440, 111.9200], // Đảo Trường Sa Lớn (Thị trấn Trường Sa)
    defaultZoom: 8,
    bounds: [
      [7.50, 111.50],
      [11.60, 117.30],
    ],
    explanatoryCaption:
      'Quần đảo Trường Sa là phần lãnh thổ thiêng liêng, không thể tách rời của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. Về mặt hành chính, toàn bộ quần đảo thuộc Huyện đảo Trường Sa, trực thuộc Ủy ban Nhân dân Tỉnh Khánh Hòa.',
    sources: [
      {
        title: 'Chủ quyền Việt Nam đối với hai quần đảo Hoàng Sa và Trường Sa',
        authority: 'Ủy ban Biên giới Quốc gia — Bộ Ngoại giao Việt Nam',
        documentRef: 'Sách trắng / Cổng Thông tin Điện tử Bộ Ngoại giao (mofa.gov.vn)',
      },
      {
        title: 'Thành lập huyện Trường Sa thuộc tỉnh Khánh Hòa',
        authority: 'Chính phủ nước Cộng hòa Xã hội Chủ nghĩa Việt Nam',
        documentRef: 'Nghị định số 65/CP ngày 05/10/1993 & Quyết định 193-HĐBT',
      },
    ],
    keyIslands: [
      {
        id: 'dao-truong-sa-lon',
        name: 'Spratly Island',
        vietnameseName: 'Đảo Trường Sa Lớn',
        latitude: 8.6440,
        longitude: 111.9200,
        featureDescription: 'Thủ phủ hành chính của huyện đảo Trường Sa, có đường băng và cầu cảng',
        isAdministrativeCenter: true,
        status: 'verified',
        sourceReference: 'UBND Huyện Trường Sa, Tỉnh Khánh Hòa',
      },
      {
        id: 'dao-song-tu-tay',
        name: 'Southwest Cay',
        vietnameseName: 'Đảo Song Tử Tây',
        latitude: 11.4292,
        longitude: 114.3325,
        featureDescription: 'Xã đảo nằm ở cực bắc của quần đảo Trường Sa, có ngọn hải đăng lớn',
        status: 'verified',
        sourceReference: 'Cục Đo đạc, Bản đồ và Thông tin địa lý Việt Nam',
      },
      {
        id: 'dao-nam-yet',
        name: 'Namyit Island',
        vietnameseName: 'Đảo Nam Yết',
        latitude: 10.1794,
        longitude: 114.3622,
        featureDescription: 'Đảo thuộc cụm Nam Yết, trung tâm bảo tồn sinh học biển nhiệt đới',
        status: 'verified',
        sourceReference: 'Ủy ban Biên giới Quốc gia',
      },
      {
        id: 'dao-sinh-ton',
        name: 'Sin Cowe Island',
        vietnameseName: 'Đảo Sinh Tồn',
        latitude: 9.8853,
        longitude: 114.3300,
        featureDescription: 'Xã đảo Sinh Tồn, quần thể đảo và rạn san hô trung tâm',
        status: 'verified',
        sourceReference: 'UBND Huyện Trường Sa',
      },
      {
        id: 'dao-son-ca',
        name: 'Sand Cay',
        vietnameseName: 'Đảo Sơn Ca',
        latitude: 10.3781,
        longitude: 114.4800,
        featureDescription: 'Đảo cát xanh rì rào với thảm thực vật phong phú, có hải đăng Sơn Ca',
        status: 'verified',
        sourceReference: 'Cục Đo đạc, Bản đồ và Thông tin địa lý Việt Nam',
      },
      {
        id: 'dao-an-bang',
        name: 'Amboyna Cay',
        vietnameseName: 'Đảo An Bang',
        latitude: 7.8922,
        longitude: 112.9220,
        featureDescription: 'Đảo tiền tiêu phía nam của quần đảo Trường Sa với ngọn hải đăng sừng sững',
        status: 'verified',
        sourceReference: 'Ủy ban Biên giới Quốc gia',
      },
      {
        id: 'dao-phan-vinh',
        name: 'Pearson Reef Island',
        vietnameseName: 'Đảo Phan Vinh',
        latitude: 8.9667,
        longitude: 113.6833,
        featureDescription: 'Đảo mang tên Anh hùng Lực lượng Vũ trang Nhân dân Nguyễn Phan Vinh',
        status: 'verified',
        sourceReference: 'Ủy ban Biên giới Quốc gia',
      },
    ],
  },
};
