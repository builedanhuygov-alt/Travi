import React from 'react';
import { Compass, Sparkles } from 'lucide-react';

export const RouteLoadingFallback: React.FC = () => {
  return (
    <div
      className="min-h-[70vh] w-full flex flex-col items-center justify-center px-4 py-20 text-center animate-fade-in"
      role="status"
      aria-label="Loading page content"
    >
      <div className="relative flex items-center justify-center mb-6">
        {/* Ambient glow rings */}
        <div className="absolute h-24 w-24 rounded-full bg-gradient-to-tr from-[#3DDC97]/20 via-[#48E3EF]/20 to-[#9875FF]/20 blur-xl animate-pulse" />
        
        {/* Concentric rotating rings */}
        <div className="absolute h-16 w-16 rounded-full border border-[#48E3EF]/30 animate-ping opacity-20" />
        <div className="h-14 w-14 rounded-2xl border border-[#3DDC97]/50 bg-[#0E1626]/90 backdrop-blur-md flex items-center justify-center text-[#3DDC97] shadow-lg shadow-[#3DDC97]/15">
          <Compass className="h-6 w-6 text-[#3DDC97] animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 text-[#48E3EF] text-xs font-mono tracking-widest uppercase">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Trí Tuệ Du Lịch Văn Hóa TRAVI</span>
      </div>

      <h3 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-white">
        Đang Định Dạng Không Gian Văn Hóa
      </h3>
      <p className="mt-2 text-xs text-[#9BA9C3] max-w-sm leading-relaxed">
        Kết nối dữ liệu điểm đến xác thực, phong vị bản địa và gu văn hóa riêng của bạn.
      </p>

      {/* Shimmering indicator line */}
      <div className="mt-6 w-48 h-1 rounded-full bg-[#121C30] overflow-hidden">
        <div className="h-full w-full travi-skeleton" />
      </div>
    </div>
  );
};

export default RouteLoadingFallback;
