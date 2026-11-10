import fs from 'fs';
import path from 'path';
import type { UnifiedTourismPoi } from '../src/types/tourismPoi.ts';
import type { AdministrativeDataset, AdministrativeProvince, AdministrativeWard } from '../src/types/administrative.ts';

// Determine file locations
const WORKSPACE_DIR = 'd:\\Travi';
const OUTPUT_DIR = path.join(WORKSPACE_DIR, 'src', 'data', 'generated');

const VN_JSON_CANDIDATES = [
  'C:\\Users\\danhu\\Downloads\\vn.json',
  'C:\\Users\\danhu\\.gemini\\antigravity\\brain\\74de1c27-94a1-4f1e-a550-38b22fd77976\\.user_uploaded\\media_1794318064858_e354793c.json',
  path.join(WORKSPACE_DIR, 'data', 'vn.json'),
];

const SON_LA_CSV_CANDIDATES = [
  'C:\\Users\\danhu\\.gemini\\antigravity\\brain\\74de1c27-94a1-4f1e-a550-38b22fd77976\\.user_uploaded\\media_1794318064724_03bf6231.csv',
  'C:\\Users\\danhu\\Downloads\\Du_lieu_Khu_du_lich,_Diem_du_lich_10_11_2026_20_18_48(du_lieu).csv',
  path.join(WORKSPACE_DIR, 'data', 'son_la_tourism_normalized_utf8.csv'),
];

const STARTER_CSV_CANDIDATES = [
  path.join(WORKSPACE_DIR, 'data', 'vietnam_tourism_starter.csv'),
  'C:\\Users\\danhu\\Downloads\\vietnam_tourism_starter.csv',
];

const QA_TRAIN_CANDIDATES = [
  path.join(WORKSPACE_DIR, 'data', 'train_vietnam_tourism.json'),
  'C:\\Users\\danhu\\Downloads\\train_vietnam_tourism.json',
];

const QA_VALID_CANDIDATES = [
  path.join(WORKSPACE_DIR, 'data', 'valid_vietnam_tourism.json'),
  'C:\\Users\\danhu\\Downloads\\valid_vietnam_tourism.json',
];

function findFirstExistingFile(candidates: string[]): string | null {
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return null;
}

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function generateSlug(text: string): string {
  return removeVietnameseTones(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseSemicolonCSV(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some((col) => col.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((col) => col.length > 0)) {
      rows.push(currentRow);
    }
  }
  return rows;
}

function mapSonLaCategory(rawType1: string, rawType2: string): string {
  const combined = `${rawType1} ${rawType2}`.toLowerCase();
  if (combined.includes('quốc gia')) return 'Khu du lịch quốc gia';
  if (combined.includes('cấp tỉnh')) return 'Khu du lịch cấp tỉnh';
  if (combined.includes('di tích')) return 'Di tích lịch sử - văn hóa';
  if (combined.includes('st') || combined.includes('sinh thái')) return 'Du lịch sinh thái';
  if (combined.includes('cd') || combined.includes('cộng đồng')) return 'Du lịch cộng đồng';
  if (combined.includes('vh') || combined.includes('văn hóa')) return 'Du lịch văn hóa - tâm linh';
  if (combined.includes('tn-kp') || combined.includes('khám phá')) return 'Du lịch mạo hiểm - trải nghiệm';
  if (combined.includes('nông thôn') || combined.includes('cn')) return 'Du lịch nông thôn';
  return 'Điểm du lịch';
}

function mapSubregionByProvince(provinceName: string): string {
  const norm = removeVietnameseTones(provinceName).toLowerCase();
  if (/son la|dien bien|lai chau|hoa binh|lao cai|yen bai/.test(norm)) return 'Tây Bắc';
  if (/ha noi|hai phong|hai duong|hung yen|nam dinh|ninh binh|thai binh|vinh phuc|bac ninh|ha nam/.test(norm))
    return 'Đồng bằng sông Hồng';
  if (/quang ninh|lang son|cao bang|bac kan|thai nguyen|tuyen quang|ha giang|bac giang|phu tho/.test(norm))
    return 'Đông Bắc';
  if (/thanh hoa|nghe an|ha tinh|quang binh|quang tri|thua thien hue/.test(norm))
    return 'Bắc Trung Bộ';
  if (/da nang|quang nam|quang ngai|binh dinh|phu yen|khanh hoa|ninh thuan|binh thuan/.test(norm))
    return 'Duyên hải Nam Trung Bộ';
  if (/kon tum|gia lai|dak lak|dak nong|lam dong/.test(norm))
    return 'Tây Nguyên';
  if (/ho chi minh|ba ria|binh duong|binh phuoc|dong nai|tay ninh/.test(norm))
    return 'Đông Nam Bộ';
  return 'Đồng bằng sông Cửu Long';
}

export async function runImportPipeline(options: { dryRun?: boolean } = {}) {
  const dryRun = options.dryRun || process.argv.includes('--dry-run');
  console.log(`=== TRAVI DATA IMPORT PIPELINE [Dry Run: ${dryRun}] ===`);

  const importLog = {
    timestamp: new Date().toISOString(),
    dryRun,
    datasets: {
      administrative: { status: 'pending', file: null as string | null, provinces: 0, wards: 0 },
      sonLaTourism: { status: 'pending', file: null as string | null, recordsCount: 0, piiFieldsRedacted: 0 },
      tourismStarter: { status: 'not_found', file: null as string | null, recordsCount: 0, note: '' },
      tourismQaDataset: { status: 'not_found', file: null as string | null, recordsCount: 0, note: '' },
    },
    totalPoisProduced: 0,
    errors: [] as string[],
  };

  // 1. Process Vietnam Administrative Dataset (vn.json)
  const vnJsonPath = findFirstExistingFile(VN_JSON_CANDIDATES);
  let adminDataset: AdministrativeDataset | null = null;

  if (vnJsonPath) {
    try {
      console.log(`Loading Administrative Data from: ${vnJsonPath}`);
      const rawVn = JSON.parse(fs.readFileSync(vnJsonPath, 'utf8'));

      const rawProvinces = rawVn.data?.province || [];
      const rawWards = rawVn.data?.ward || [];

      const provinces: AdministrativeProvince[] = rawProvinces.map((p: any) => ({
        id: p.id,
        nameLocal: p.name_local,
        nameEn: p.name_en,
        slug: p.slug,
        lat: p.lat,
        lon: p.lon,
        subregion: mapSubregionByProvince(p.name_local),
      }));

      const wards: AdministrativeWard[] = rawWards.map((w: any) => ({
        id: w.id,
        nameLocal: w.name_local,
        nameEn: w.name_en,
        slug: w.slug,
        parentId: w.parent_id,
        parentNameLocal: w.parent_name_local,
        parentNameEn: w.parent_name_en,
        lat: w.lat,
        lon: w.lon,
      }));

      adminDataset = {
        meta: {
          country: rawVn.meta?.country || 'vn',
          version: rawVn.meta?.version || '1.0.0',
          stats: {
            province: provinces.length,
            ward: wards.length,
          },
          source: rawVn.meta?.source || {
            name: 'Decision 19/2025/QĐ-TTg',
            url: '',
            license: 'Government Reference',
            note: '34 centrally-governed provinces/cities post-2025',
          },
          generated: new Date().toISOString().split('T')[0],
        },
        provinces,
        wards,
      };

      importLog.datasets.administrative = {
        status: 'success',
        file: vnJsonPath,
        provinces: provinces.length,
        wards: wards.length,
      };
      console.log(`Loaded ${provinces.length} provinces and ${wards.length} wards.`);
    } catch (err: any) {
      console.error('Failed to parse vn.json:', err);
      importLog.errors.push(`vn.json parsing error: ${err.message}`);
      importLog.datasets.administrative.status = 'error';
    }
  } else {
    importLog.datasets.administrative.status = 'not_found';
    console.warn('vn.json was not found in candidate paths.');
  }

  // 2. Process Sơn La Tourism Dataset
  const sonLaPath = findFirstExistingFile(SON_LA_CSV_CANDIDATES);
  const unifiedPois: UnifiedTourismPoi[] = [];
  let piiStrippedCount = 0;

  if (sonLaPath) {
    try {
      console.log(`Loading Sơn La Tourism Dataset from: ${sonLaPath}`);
      const rawCsv = fs.readFileSync(sonLaPath, 'utf8');
      const rows = parseSemicolonCSV(rawCsv);
      const dataRows = rows.slice(1).filter((r) => r[1] && r[1].trim().length > 0);

      dataRows.forEach((r, index) => {
        const rawName = r[1].trim();
        const rawType1 = r[2] || '';
        const rawType2 = r[3] || '';
        const rawAddress = r[4] || '';
        const rawValues = r[5] || '';
        const rawStatus = r[6] || '';
        const rawManaging = r[7] || '';
        const rawLegalRep = r[8] || '';
        // PII columns 9 (CCCD/CMND) and 10 (Phone)
        const rawCccd = r[9] || '';
        const rawPhone = r[10] || '';
        const rawAdditional = r[11] || '';
        const _rawNotes = r[12] || '';

        if (rawCccd.length > 0 || rawPhone.length > 0) {
          piiStrippedCount++;
        }

        const slug = `son-la-${generateSlug(rawName)}`;
        const category = mapSonLaCategory(rawType1, rawType2);

        // Extract key attractions or services from text
        const keyAttractions: string[] = [];
        if (rawAdditional) {
          rawAdditional
            .split(/[,;\n]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 2 && s.length < 50)
            .forEach((item) => {
              if (!keyAttractions.includes(item)) keyAttractions.push(item);
            });
        }
        if (keyAttractions.length === 0) {
          keyAttractions.push(rawName);
        }

        const longDescription = [rawValues, rawAdditional].filter(Boolean).join('\n\n');
        const shortDescription = rawValues.length > 220 ? `${rawValues.slice(0, 217)}...` : rawValues || rawName;

        const experiences: string[] = [];
        if (rawType2) {
          rawType2.split(/[;,]/).forEach((ex) => {
            const trimmed = ex.trim();
            if (trimmed.length > 1) experiences.push(trimmed);
          });
        }

        const poi: UnifiedTourismPoi = {
          id: `poi-son-la-${String(index + 1).padStart(3, '0')}`,
          name: rawName,
          vietnameseName: rawName,
          slug,
          provinceOrRegion: 'Sơn La',
          subregion: 'Tây Bắc',
          latitude: null, // Strict Data Integrity: No fake coordinates
          longitude: null,
          category,
          shortDescription,
          longDescription,
          bestSeason: 'Tháng 10 - Tháng 4 (Mùa hoa cải, hoa mơ mận và lễ hội vùng cao)',
          recommendedDuration: 'Nửa ngày đến 1 ngày',
          keyAttractions,
          image: null, // Strict Data Integrity: No fake images
          experiences: experiences.length > 0 ? experiences : ['Tham quan', 'Khám phá văn hóa bản địa'],
          localFood: ['Thịt trâu gác bếp', 'Cá suối nướng Pa Pỉnh Tộp', 'Bê chao Mộc Châu', 'Nậm pịa', 'Xôi ngũ sắc'],
          culturalHighlights: [
            'Bản sắc văn hóa đồng bào Thái, Mông, Mường',
            'Nghệ thuật Xòe Thái (Di sản UNESCO)',
            'Lễ hội Hết Chá',
          ],
          source: 'Sở Văn hóa, Thể thao và Du lịch tỉnh Sơn La',
          sourceUrl: 'https://dulichsonla.gov.vn',
          sourceType: 'official_gov',
          verificationStatus: 'needs_review', // Official draft - awaiting field verification
          coordinateConfidence: 'none', // Strictly unverified
          confidenceScore: 65,
          historicalAliases: [],
          parentDestinationId: 'dest-son-la',
          officialRecognition: rawType1 || 'Điểm du lịch theo thống kê quản lý ngành',
          sourceCount: 1,
          communityMentioned: true,
          reviewNotes:
            'Dữ liệu hồ sơ quản lý du lịch Sơn La. Đã gỡ bỏ toàn bộ CCCD/CMND và số điện thoại cá nhân. Tọa độ GPS chưa xác minh trên thực địa; không hiển thị ghim tọa độ sai lệch.',
          lastReviewedDate: '2026-11-10',
          address: rawAddress,
          operatingStatus: rawStatus || 'Đang hoạt động',
          managingEntity: [rawManaging, rawLegalRep ? `Người đại diện: ${rawLegalRep}` : '']
            .filter(Boolean)
            .join(' - '),
        };

        unifiedPois.push(poi);
      });

      importLog.datasets.sonLaTourism = {
        status: 'success',
        file: sonLaPath,
        recordsCount: unifiedPois.length,
        piiFieldsRedacted: piiStrippedCount,
      };
      console.log(`Processed ${unifiedPois.length} Sơn La POIs. Redacted PII in ${piiStrippedCount} records.`);
    } catch (err: any) {
      console.error('Failed to parse Sơn La CSV:', err);
      importLog.errors.push(`Sơn La CSV parsing error: ${err.message}`);
      importLog.datasets.sonLaTourism.status = 'error';
    }
  } else {
    importLog.datasets.sonLaTourism.status = 'not_found';
    console.warn('Sơn La tourism CSV was not found.');
  }

  // 3. Check for Vietnam Tourism Starter Dataset
  const starterPath = findFirstExistingFile(STARTER_CSV_CANDIDATES);
  if (starterPath) {
    importLog.datasets.tourismStarter = {
      status: 'found_pending_parse',
      file: starterPath,
      recordsCount: 0,
      note: 'Starter dataset detected.',
    };
  } else {
    importLog.datasets.tourismStarter = {
      status: 'not_found',
      file: null,
      recordsCount: 0,
      note: 'File vietnam_tourism_starter.csv was not provided in workspace or attachments. Reported as missing per Data Integrity policy.',
    };
  }

  // 4. Check for Tourism QA Datasets (train/valid)
  const qaTrainPath = findFirstExistingFile(QA_TRAIN_CANDIDATES);
  const qaValidPath = findFirstExistingFile(QA_VALID_CANDIDATES);
  if (qaTrainPath || qaValidPath) {
    importLog.datasets.tourismQaDataset = {
      status: 'found',
      file: qaTrainPath || qaValidPath,
      recordsCount: 0,
      note: 'QA files found.',
    };
  } else {
    importLog.datasets.tourismQaDataset = {
      status: 'not_found',
      file: null,
      recordsCount: 0,
      note: 'Files train_vietnam_tourism.json and valid_vietnam_tourism.json not provided in workspace or attachments. Reported as missing per Data Integrity policy.',
    };
  }

  importLog.totalPoisProduced = unifiedPois.length;

  // 5. Write outputs if not dryRun
  if (!dryRun) {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    if (adminDataset) {
      const adminOut = path.join(OUTPUT_DIR, 'vietnamAdministrative.json');
      fs.writeFileSync(adminOut, JSON.stringify(adminDataset, null, 2), 'utf8');
      console.log(`Wrote administrative dataset to: ${adminOut}`);
    }

    const poisOut = path.join(OUTPUT_DIR, 'vietnamPois.json');
    fs.writeFileSync(poisOut, JSON.stringify(unifiedPois, null, 2), 'utf8');
    console.log(`Wrote ${unifiedPois.length} POIs to: ${poisOut}`);

    const summaryOut = path.join(OUTPUT_DIR, 'importSummary.json');
    fs.writeFileSync(summaryOut, JSON.stringify(importLog, null, 2), 'utf8');
    console.log(`Wrote import summary to: ${summaryOut}`);
  } else {
    console.log('DRY RUN complete. No files written to disk.');
  }

  return {
    adminDataset,
    unifiedPois,
    importLog,
  };
}

// Direct execution guard
if (process.argv[1] && process.argv[1].endsWith('import-vietnam-data.ts')) {
  runImportPipeline()
    .then(() => {
      console.log('Pipeline finished successfully.');
    })
    .catch((err) => {
      console.error('Pipeline failed:', err);
      process.exit(1);
    });
}
