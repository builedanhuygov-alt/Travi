import React, { useEffect, useState } from 'react';
import {
  X,
  TrendingUp,
  Calendar,
  Compass,
  Sun
} from 'lucide-react';
import { Badge } from '../ui/Badge.tsx';
import { Button } from '../ui/Button.tsx';

interface CulturalPulseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination?: (destId: string) => void;
}

interface SeasonalPulseItem {
  id: string;
  seasonName: string;
  months: string;
  title: string;
  vietnameseTitle: string;
  region: string;
  destinationId: string;
  destinationName: string;
  weatherSummary: string;
  highlights: string[];
  imageUrl: string;
}

const SEASONAL_PULSE_DATA: SeasonalPulseItem[] = [
  {
    id: 'pulse-autumn-highlands',
    seasonName: 'Mùa Vàng Vùng Cao & Hoa Tam Giác Mạch',
    months: 'Tháng 9 — Tháng 11',
    title: 'Ruộng Bậc Thang Miền Núi & Đèo Đá Tây Bắc',
    vietnameseTitle: 'Mùa Lúa Vàng & Hoa Tam Giác Mạch',
    region: 'Miền Bắc Việt Nam',
    destinationId: 'ha-giang',
    destinationName: 'Hà Giang & Mù Cang Chải',
    weatherSummary: 'Không khí vùng cao khô ráo, se lạnh (16°C - 23°C), tầm nhìn qua đèo thông thoáng và các thung lũng lúa chín vàng rực rỡ.',
    highlights: [
      'Mùa lúa chín vàng trải dài trên các sườn đèo Khau Phạ và ruộng bậc thang Mù Cang Chải',
      'Mùa hoa tam giác mạch nhuộm hồng cao nguyên đá Đồng Văn',
      'Du thuyền ngắm hẻm vực Tu Sản trên dòng sông Nho Quế biếc xanh trong nắng sớm',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'pulse-spring-festivals',
    seasonName: 'Mùa Lễ Hội Mùa Xuân & Di Sản Cố Đô',
    months: 'Tháng 1 — Tháng 4',
    title: 'Đền Đài Cố Đô & Thương Cảng Cổ Hội An',
    vietnameseTitle: 'Mùa Lễ Hội Cố Đô & Phố Cổ Thu Bồn',
    region: 'Miền Trung Việt Nam',
    destinationId: 'thua-thien-hue',
    destinationName: 'Cố Đô Huế & Hội An',
    weatherSummary: 'Thời tiết dịu mát dễ chịu (20°C - 26°C), hoa ngô đồng nở rộ và gió biển trong lành.',
    highlights: [
      'Thả hoa đăng truyền thống đêm rằm trên dòng sông Thu Bồn phố cổ',
      'Phơi hương trầm ngũ sắc tuyệt đẹp tại làng hương Thủy Xuân',
      'Đạp xe thong thả qua các làng rau truyền thống và vườn cung đình Huế',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'pulse-island-calm',
    seasonName: 'Mùa Biển Đảo Nắng Ấm Phương Nam',
    months: 'Tháng 11 — Tháng 4',
    title: 'Biển Đảo Xanh Ngọc & Khu Bảo Tồn Hải Dương',
    vietnameseTitle: 'Biển Đảo Trời Trong & Bãi Sao',
    region: 'Miền Nam Việt Nam',
    destinationId: 'kien-giang-phuquoc',
    destinationName: 'Đảo Phú Quốc & Côn Đảo',
    weatherSummary: 'Biển phẳng lặng như gương, làn nước xanh ngọc lam, nắng ấm (27°C - 31°C) và độ ẩm thấp dễ chịu.',
    highlights: [
      'Lặn ngắm san hô tại quần đảo An Thới và Bãi Sao',
      'Thưởng thức hải sản tươi ngon lúc hoàng hôn trên bãi biển cát trắng',
      'Trekking khám phá rừng nguyên sinh và các cung đường ven biển thanh bình',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'pulse-caving-window',
    seasonName: 'Mùa Thám Hiểm Hang Động Đỉnh Cao',
    months: 'Tháng 3 — Tháng 8',
    title: 'Hệ Thống Hang Động Thế Giới & Sông Ngầm Rừng Sâu',
    vietnameseTitle: 'Mùa Thám Hiểm Hang Động Quảng Bình',
    region: 'Miền Trung Việt Nam',
    destinationId: 'quang-binh-phongnha',
    destinationName: 'Phong Nha - Kẻ Bàng & Sơn Đoòng',
    weatherSummary: 'Mực nước trong hệ thống sông ngầm ổn định, đường rừng khô ráo, thời tiết thuận lợi cho thám hiểm chuyên sâu.',
    highlights: [
      'Bơi trong lòng sông ngầm ngọc bích với đèn đội đầu tại hệ thống hang Tú Làn',
      'Chiêm ngưỡng những khối thạch nhũ khổng lồ tráng lệ trong Động Thiên Đường',
      'Trekking xuyên qua rừng nguyên sinh bạt ngàn giữa các thung lũng đá vôi hàng triệu năm',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=800&auto=format&fit=crop',
  },
];

export const CulturalPulseModal: React.FC<CulturalPulseModalProps> = ({
  isOpen,
  onClose,
  onSelectDestination,
}) => {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(SEASONAL_PULSE_DATA[0].id);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentItem = SEASONAL_PULSE_DATA.find((item) => item.id === selectedSeasonId) || SEASONAL_PULSE_DATA[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pulse-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[#243049] bg-[#0A101D] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#243049]/80 px-6 py-4 bg-[#0E1626]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#3DDC97]/20 to-[#48E3EF]/20 border border-[#3DDC97]/40 text-[#3DDC97]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 id="pulse-modal-title" className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Nhịp điệu du lịch & Mùa lễ hội Việt Nam
                <Badge variant="outline" className="text-[10px] text-[#3DDC97] border-[#3DDC97]/30">
                  Lịch mùa thực tế
                </Badge>
              </h2>
              <p className="text-xs text-[#9BA9C3]">
                Khám phá các mùa du lịch lý tưởng, mùa thu hoạch và khí hậu đặc trưng từng vùng miền Việt Nam.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close seasonal pulse"
            className="rounded-lg p-2 text-[#9BA9C3] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Seasonal Selector Tabs */}
        <div className="flex border-b border-[#243049]/60 px-6 bg-[#080D18] overflow-x-auto no-scrollbar">
          {SEASONAL_PULSE_DATA.map((item) => {
            const isSelected = item.id === selectedSeasonId;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedSeasonId(item.id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                  isSelected
                    ? 'border-[#3DDC97] text-[#3DDC97] bg-[#3DDC97]/5'
                    : 'border-transparent text-[#9BA9C3] hover:text-white'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{item.vietnameseTitle || item.seasonName}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 relative rounded-xl overflow-hidden border border-[#243049] aspect-[4/3] md:aspect-auto">
              <img
                src={currentItem.imageUrl}
                alt={currentItem.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3DDC97] bg-[#0E1626]/80 px-2.5 py-1 rounded-full border border-[#3DDC97]/30">
                  {currentItem.months}
                </span>
                <h3 className="text-sm font-bold text-white mt-2">{currentItem.destinationName}</h3>
                <p className="text-xs text-[#9BA9C3]">{currentItem.region}</p>
              </div>
            </div>

            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] text-[#48E3EF] border-[#48E3EF]/30">
                    {currentItem.seasonName}
                  </Badge>
                  <span className="text-xs text-[#9BA9C3]">• {currentItem.months}</span>
                </div>

                <h3 className="text-lg font-bold text-white mt-1">{currentItem.title}</h3>
                <p className="text-xs text-[#3DDC97] font-medium italic mb-3">{currentItem.vietnameseTitle}</p>

                <div className="rounded-xl border border-[#243049] bg-[#0E1626] p-3.5 mb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                    <Sun className="h-4 w-4 text-[#F59E0B]" />
                    <span>Khí hậu & Điều kiện thời tiết</span>
                  </div>
                  <p className="text-xs text-[#9BA9C3] leading-relaxed">
                    {currentItem.weatherSummary}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9BA9C3] mb-2">
                    Hiện tượng & Trải nghiệm mùa đặc trưng
                  </h4>
                  <ul className="space-y-2">
                    {currentItem.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#E2E8F0]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3DDC97] mt-1.5 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-[#243049]/60 mt-6 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    if (onSelectDestination) {
                      onSelectDestination(currentItem.destinationId);
                    }
                    onClose();
                  }}
                  className="bg-[#3DDC97] text-[#080D18] hover:bg-[#32B87D] font-semibold text-xs"
                >
                  <Compass className="h-4 w-4 mr-1.5" />
                  Khám phá {currentItem.destinationName}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
