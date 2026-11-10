import type { Locale, TranslationDictionary } from './types.ts';
import { translations, viTranslations } from './translations.ts';

let currentLocale: Locale = 'vi';

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('travi_locale');
    if (saved === 'vi' || saved === 'en') {
      currentLocale = saved;
    }
  }
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('travi_locale', locale);
    window.dispatchEvent(new CustomEvent('travi-locale-change', { detail: { locale } }));
  }
}

export function getTranslations(locale?: Locale): TranslationDictionary {
  const active = locale || getLocale();
  return translations[active] || viTranslations;
}

export const t = getTranslations('vi');

/**
 * Format currency in Vietnamese Dong (VND)
 */
export function formatVND(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return 'Chưa cập nhật';
  const numeric = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
  if (isNaN(numeric) || numeric === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numeric);
}

/**
 * Format date in natural Vietnamese style (dd/MM/yyyy)
 */
export function formatDateVI(dateString: string | undefined | null): string {
  if (!dateString) return 'Chưa xác định';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Translate Vietnam administrative region names into standard Vietnamese
 */
export function translateRegion(region: string): string {
  switch (region) {
    case 'Northern Vietnam':
      return 'Bắc Bộ';
    case 'Central Vietnam':
      return 'Trung Bộ';
    case 'Central Highlands':
      return 'Tây Nguyên';
    case 'Southern Vietnam':
      return 'Nam Bộ';
    default:
      return region;
  }
}

/**
 * Translate Vietnam destination categories into standard Vietnamese
 */
export function translateCategory(category: string): string {
  switch (category) {
    case 'Nature & Mountains':
      return 'Thiên nhiên & Núi non';
    case 'Beaches & Islands':
      return 'Biển & Hải đảo';
    case 'Heritage & History':
      return 'Di sản & Lịch sử';
    case 'Food & Cuisine':
    case 'Cuisine':
      return 'Ẩm thực & Món ngon';
    case 'Culture & Festivals':
      return 'Văn hóa & Lễ hội';
    case 'Adventure & Outdoor':
    case 'Outdoor':
      return 'Phiêu lưu & Khám phá';
    case 'Relaxation & Wellness':
    case 'Wellness':
      return 'Nghỉ dưỡng & Sức khỏe';
    case 'Hidden Gems':
      return 'Miền đất ít người biết';
    case 'Photography & Scenic':
      return 'Nhiếp ảnh & Thắng cảnh';
    case 'Craft Village':
      return 'Làng nghề truyền thống';
    case 'Local Market':
      return 'Chợ truyền thống';
    case 'Festival':
      return 'Lễ hội truyền thống';
    default:
      return category;
  }
}

/**
 * Translate provenance tier into standard Vietnamese
 */
export function translateProvenanceStatus(status: string): string {
  switch (status) {
    case 'Verified Official':
    case 'Verified Official Record':
    case 'Official Government Record':
      return 'Nguồn chính thức';
    case 'Verified Editorial':
      return 'Nội dung biên tập';
    case 'Curated Partner':
    case 'Community':
      return 'Đóng góp cộng đồng';
    case 'AI Assisted Draft':
      return 'Nội dung do AI hỗ trợ';
    case 'Under Editorial Review':
    case 'Unverified':
    default:
      return 'Chưa xác minh';
  }
}

/**
 * Translate experience categories into standard Vietnamese
 */
export function translateExperienceCategory(category: string): string {
  switch (category) {
    case 'Food & Culinary':
      return 'Ẩm thực & Món ngon';
    case 'Culture & Heritage':
      return 'Văn hóa & Di sản';
    case 'Nature & Adventure':
      return 'Thiên nhiên & Phiêu lưu';
    case 'Arts & Crafts':
      return 'Thủ công & Làng nghề';
    case 'Local Life':
      return 'Nhịp sống bản địa';
    case 'Festivals & Events':
      return 'Lễ hội & Sự kiện';
    case 'Wellness & Retreats':
      return 'Nghỉ dưỡng & Thư thái';
    case 'Family & Leisure':
      return 'Gia đình & Giải trí';
    default:
      return category;
  }
}

/**
 * Translate story categories into standard Vietnamese
 */
export function translateStoryCategory(category: string): string {
  switch (category) {
    case 'Local Culture':
      return 'Văn hóa bản địa';
    case 'Food Origins':
      return 'Nguồn gốc món ăn';
    case 'Heritage & Lineage':
      return 'Di sản & Dòng dõi';
    case 'Craft Villages':
      return 'Làng nghề truyền thống';
    case 'Photo Essay':
      return 'Ký sự ảnh';
    case 'Travel Guide':
      return 'Cẩm nang khám phá';
    default:
      return category;
  }
}

/**
 * Translate best time of day into standard Vietnamese
 */
export function translateTimeOfDay(time: string): string {
  switch (time) {
    case 'Morning':
      return 'Buổi sáng';
    case 'Afternoon':
      return 'Buổi chiều';
    case 'Evening':
      return 'Buổi tối';
    case 'Full Day':
      return 'Cả ngày';
    case 'Seasonal':
      return 'Theo mùa vụ';
    default:
      return time;
  }
}
