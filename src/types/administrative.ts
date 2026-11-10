/**
 * Vietnam Administrative Schema (Post-2025 Restructure per Decision 19/2025/QĐ-TTg)
 * Represents 34 centrally-governed provinces/cities and 3,321 communes/wards.
 * Used strictly for address normalization, lookup, and administrative boundaries.
 * NOT to be confused with visitable POIs.
 */

export interface AdministrativeProvince {
  id: string; // e.g. "01", "14"
  nameLocal: string; // e.g. "Hà Nội", "Sơn La"
  nameEn: string; // e.g. "Hanoi", "Son La"
  slug: string; // e.g. "ha-noi-01", "son-la-14"
  lat: number;
  lon: number;
  subregion?: string; // e.g. "Đồng bằng sông Hồng", "Tây Bắc"
}

export interface AdministrativeWard {
  id: string; // e.g. "00004"
  nameLocal: string; // e.g. "Ba Đình", "Mộc Châu"
  nameEn: string;
  slug: string;
  parentId: string; // Province ID, e.g. "01"
  parentNameLocal: string;
  parentNameEn: string;
  lat: number;
  lon: number;
}

export interface AdministrativeDataset {
  meta: {
    country: string;
    version: string;
    stats: {
      province: number;
      ward: number;
    };
    source: {
      name: string;
      url: string;
      license: string;
      note: string;
    };
    generated: string;
  };
  provinces: AdministrativeProvince[];
  wards: AdministrativeWard[];
}

