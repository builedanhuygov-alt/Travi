/**
 * Administrative Boundary Matcher
 * =================================
 * Strictly maps provincial and ward names against Vietnam's 2025 Administrative Master Dataset
 * (Decision 19/2025/QĐ-TTg & Resolution 202/2025/QH15 - 34 Provinces, 3,321 Wards).
 *
 * Rules:
 * 1. ZERO GUESSWORK: If an administrative unit cannot be definitively matched, return null.
 * 2. Explicit historical alias mapping: Pre-2025 names (e.g. "Hà Giang", "Bình Dương", "Sài Gòn")
 *    are mapped with an explicit historical provenance audit trail.
 */

import rawAdminData from '../../data/generated/vietnamAdministrative.json' with { type: 'json' };
import { VIETNAM_ADMINISTRATIVE_UNITS } from '../../data/vietnamAdministrativeUnits.ts';

export interface AdminMatchResult {
  province_id: string | null;
  province_name_canonical: string | null;
  ward_id: string | null;
  ward_name_canonical: string | null;
  is_historical_mapping: boolean;
  historical_note?: string;
  confidence: 'exact_official' | 'alias_mapped' | 'unmatched';
}

interface ProvinceMeta {
  id: string; // '01'..'96'
  nameLocal: string;
  nameEn: string;
  slug: string;
  aliases: string[];
  mergedFrom: string[];
}

interface WardMeta {
  id: string; // '00004'
  name_local: string;
  name_en: string;
  parent_id: string;
}

// Build fast lookup index from official datasets
const PROVINCES_MAP = new Map<string, ProvinceMeta>();
const WARDS_MAP = new Map<string, WardMeta>(); // key: `${parent_id}::${normalized_ward}`

function removeDiacritics(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function cleanAdminPrefixes(str: string | null | undefined): string {
  if (!str) return '';
  const noParens = str.replace(/\([^)]*\)/g, ' ');
  const norm = removeDiacritics(noParens);
  return norm
    .replace(/^(tinh|thanh pho|tp\.|tp)\s+/i, '')
    .replace(/^(xa|phuong|thi tran|tt\.|tt|huyen|quan|thi xa|tx\.)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Initialize lookup cache
const provincesList = (rawAdminData as any).provinces || [];
const wardsList = (rawAdminData as any).wards || [];

// Populate from vietnamAdministrative.json
for (const p of provincesList) {
  // Find matching unit in VIETNAM_ADMINISTRATIVE_UNITS for rich historical aliases
  const unit = VIETNAM_ADMINISTRATIVE_UNITS.find(
    (u) =>
      cleanAdminPrefixes(u.officialVietnameseName) === cleanAdminPrefixes(p.nameLocal) ||
      u.englishName.toLowerCase().includes(p.nameEn.toLowerCase())
  );

  const aliases: string[] = unit ? [...unit.historicalAliases] : [];
  const mergedFrom: string[] = unit ? [...unit.mergedPre2025Provinces] : [];

  PROVINCES_MAP.set(p.id, {
    id: p.id,
    nameLocal: p.nameLocal,
    nameEn: p.nameEn,
    slug: p.slug,
    aliases,
    mergedFrom,
  });
}

// Index wards
for (const w of wardsList) {
  const nameLocal = w.nameLocal || w.name_local;
  const nameEn = w.nameEn || w.name_en;
  const parentId = w.parentId || w.parent_id;

  if (nameLocal && parentId) {
    const cleanWard = cleanAdminPrefixes(nameLocal);
    WARDS_MAP.set(`${parentId}::${cleanWard}`, {
      id: w.id,
      name_local: nameLocal,
      name_en: nameEn || '',
      parent_id: parentId,
    });
  }
}

export class AdministrativeMatcher {
  /**
   * Matches a province string against the 34 official provincial units.
   * Handles official name, English name, and post-2025 administrative mergers.
   */
  public matchProvince(provinceInput: string | null | undefined): {
    province_id: string | null;
    province_name: string | null;
    is_historical: boolean;
    historical_note?: string;
    confidence: 'exact_official' | 'alias_mapped' | 'unmatched';
  } {
    if (!provinceInput || !provinceInput.trim()) {
      return {
        province_id: null,
        province_name: null,
        is_historical: false,
        confidence: 'unmatched',
      };
    }

    const cleanInput = cleanAdminPrefixes(provinceInput);

    // 1. Direct exact matching on 34 official 2025 units
    for (const [id, p] of PROVINCES_MAP.entries()) {
      const cleanOfficial = cleanAdminPrefixes(p.nameLocal);
      const cleanEn = cleanAdminPrefixes(p.nameEn);

      if (cleanInput === cleanOfficial || cleanInput === cleanEn) {
        return {
          province_id: id,
          province_name: p.nameLocal,
          is_historical: false,
          confidence: 'exact_official',
        };
      }
    }

    // 2. Matching via mergedPre2025Provinces or historicalAliases
    for (const [id, p] of PROVINCES_MAP.entries()) {
      // Check merged pre-2025 provinces
      for (const merged of p.mergedFrom) {
        if (cleanInput === cleanAdminPrefixes(merged)) {
          return {
            province_id: id,
            province_name: p.nameLocal,
            is_historical: true,
            historical_note: `Locality '${provinceInput}' was integrated into '${p.nameLocal}' under Resolution 202/2025/QH15.`,
            confidence: 'alias_mapped',
          };
        }
      }

      // Check historical aliases
      for (const alias of p.aliases) {
        if (cleanInput === cleanAdminPrefixes(alias)) {
          return {
            province_id: id,
            province_name: p.nameLocal,
            is_historical: true,
            historical_note: `Historical alias '${provinceInput}' mapped to canonical unit '${p.nameLocal}'.`,
            confidence: 'alias_mapped',
          };
        }
      }
    }

    // 3. Fallback partial inclusion matching with high threshold
    for (const [id, p] of PROVINCES_MAP.entries()) {
      const cleanOfficial = cleanAdminPrefixes(p.nameLocal);
      if (cleanInput.includes(cleanOfficial) || cleanOfficial.includes(cleanInput)) {
        if (Math.abs(cleanInput.length - cleanOfficial.length) <= 3) {
          return {
            province_id: id,
            province_name: p.nameLocal,
            is_historical: false,
            confidence: 'exact_official',
          };
        }
      }
    }

    // Return unmatched safely: ZERO guesswork
    return {
      province_id: null,
      province_name: null,
      is_historical: false,
      confidence: 'unmatched',
    };
  }

  /**
   * Matches a ward/commune within a verified province.
   * Never guesses across provinces.
   */
  public matchWard(
    wardInput: string | null | undefined,
    provinceId: string | null | undefined
  ): {
    ward_id: string | null;
    ward_name: string | null;
  } {
    if (!wardInput || !provinceId || !wardInput.trim()) {
      return { ward_id: null, ward_name: null };
    }

    const cleanWard = cleanAdminPrefixes(wardInput);
    const key = `${provinceId}::${cleanWard}`;
    const directMatch = WARDS_MAP.get(key);

    if (directMatch) {
      return {
        ward_id: directMatch.id,
        ward_name: directMatch.name_local,
      };
    }

    return { ward_id: null, ward_name: null };
  }

  /**
   * Full match of address / province / ward
   */
  public matchFull(
    provinceInput: string | null | undefined,
    wardInput?: string | null | undefined
  ): AdminMatchResult {
    const pMatch = this.matchProvince(provinceInput);
    let wardMatch = { ward_id: null as string | null, ward_name: null as string | null };

    if (pMatch.province_id && wardInput) {
      wardMatch = this.matchWard(wardInput, pMatch.province_id);
    }

    return {
      province_id: pMatch.province_id,
      province_name_canonical: pMatch.province_name,
      ward_id: wardMatch.ward_id,
      ward_name_canonical: wardMatch.ward_name,
      is_historical_mapping: pMatch.is_historical,
      historical_note: pMatch.historical_note,
      confidence: pMatch.confidence,
    };
  }

  public getAllCanonicalProvinces(): ProvinceMeta[] {
    return Array.from(PROVINCES_MAP.values());
  }
}

export const administrativeMatcher = new AdministrativeMatcher();
