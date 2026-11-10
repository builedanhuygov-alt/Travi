import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Sparkles, ShieldCheck } from 'lucide-react';
import { TraviLogo } from '../brand/TraviLogo.tsx';

const CURRENT_YEAR = 2026;

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#243049]/60 bg-[#060A14] pt-16 pb-24 lg:pb-16 text-[#9BA9C3]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <TraviLogo size="lg" variant="lockup" />
            </Link>
            <p className="max-w-md text-sm font-light text-[#9BA9C3] leading-relaxed">
              TRAVI là nền tảng khám phá điểm đến, văn hóa và trải nghiệm bản địa Việt Nam. Được xây dựng dành cho những người lữ hành tìm kiếm chiều sâu văn hóa đích thực và những câu chuyện bản địa sống động.
            </p>

            {/* Design System Swatches from Original Asset */}
            <div className="mt-6 flex items-center gap-2">
              <span className="text-[11px] text-[#9BA9C3]/70 font-mono uppercase tracking-wider mr-1">Bảng màu:</span>
              <span title="Midnight Navy (#080D18)" className="h-4 w-4 rounded-full border border-white/20 bg-[#080D18]" />
              <span title="Circle Green (#3DDC97)" className="h-4 w-4 rounded-full border border-black/20 bg-[#3DDC97]" />
              <span title="Leaf Cyan (#48E3EF)" className="h-4 w-4 rounded-full border border-black/20 bg-[#48E3EF]" />
              <span title="Ink Outline (#111111)" className="h-4 w-4 rounded-full border border-white/20 bg-[#111111]" />
              <span title="Pure Paper (#FFFFFF)" className="h-4 w-4 rounded-full border border-black/20 bg-[#FFFFFF]" />
            </div>
          </div>

          {/* Discovery Pillars */}
          <div>
            <h3 className="font-serif text-sm font-semibold tracking-wide text-white uppercase">
              Khám phá
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/explore" className="transition-colors hover:text-[#3DDC97]">
                  Điểm đến toàn quốc
                </Link>
              </li>
              <li>
                <Link to="/map/north" className="transition-colors hover:text-[#3DDC97] flex items-center gap-1.5">
                  <span>Bản đồ miền Bắc</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#3DDC97]/20 text-[#3DDC97] font-semibold">Mới</span>
                </Link>
              </li>
              <li>
                <Link to="/tourism-data" className="transition-colors hover:text-[#3DDC97] flex items-center gap-1.5">
                  <span>Dữ liệu Du lịch & Di sản</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#48E3EF]/20 text-[#48E3EF] font-semibold">34 Tỉnh</span>
                </Link>
              </li>
              <li>
                <Link to="/experiences" className="transition-colors hover:text-[#3DDC97]">
                  Trải nghiệm & Làng nghề
                </Link>
              </li>
              <li>
                <Link to="/stories" className="transition-colors hover:text-[#3DDC97]">
                  Câu chuyện văn hóa
                </Link>
              </li>
              <li>
                <Link to="/copilot" className="transition-colors hover:text-[#3DDC97]">
                  Lên lịch trình khám phá
                </Link>
              </li>
            </ul>
          </div>

          {/* Journal & Journeys */}
          <div>
            <h3 className="font-serif text-sm font-semibold tracking-wide text-white uppercase">
              Hành trình
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/discoveries" className="transition-colors hover:text-[#3DDC97]">
                  Bộ sưu tập đã lưu
                </Link>
              </li>
              <li>
                <Link to="/trips" className="transition-colors hover:text-[#3DDC97]">
                  Kế hoạch chuyến đi
                </Link>
              </li>
              <li>
                <Link to="/memories" className="transition-colors hover:text-[#3DDC97]">
                  Dấu chân thời gian
                </Link>
              </li>
              <li>
                <Link to="/profile" className="transition-colors hover:text-[#3DDC97]">
                  Gu văn hóa cá nhân
                </Link>
              </li>
            </ul>
          </div>

          {/* Philosophy & Foundation */}
          <div>
            <h3 className="font-serif text-sm font-semibold tracking-wide text-white uppercase">
              Tôn chỉ
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-center gap-1.5 text-white/80">
                <ShieldCheck className="h-4 w-4 text-[#3DDC97]" />
                <span>Không bẫy du lịch</span>
              </li>
              <li className="flex items-center gap-1.5 text-white/80">
                <Sparkles className="h-4 w-4 text-[#48E3EF]" />
                <span>Nghệ nhân & Bản địa trực tiếp</span>
              </li>
              <li className="flex items-center gap-1.5 text-white/80">
                <Compass className="h-4 w-4 text-[#9875FF]" />
                <span>Du lịch tôn trọng di sản</span>
              </li>
              <li className="pt-2 text-xs text-[#9BA9C3]/70">
                Nền tảng Khám phá TRAVI 2026
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-[#243049]/40 pt-8 text-xs text-[#9BA9C3]/60">
          <p>© {CURRENT_YEAR} TRAVI. Mỗi miền đất, một câu chuyện. Bảo lưu mọi quyền.</p>
          <div className="mt-4 sm:mt-0 flex items-center gap-6">
            <span>Dữ liệu 34 đơn vị hành chính</span>
            <span>Hỗ trợ giảm chuyển động</span>
            <span>Khả năng hoạt động ngoại tuyến</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
