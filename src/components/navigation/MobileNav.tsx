import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, MapPin, Sparkles, BookOpen, Bookmark } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const tabs = [
    { name: 'Khám phá', path: '/', icon: Compass },
    { name: 'Điểm đến', path: '/explore', icon: MapPin },
    { name: 'Trải nghiệm', path: '/experiences', icon: Sparkles },
    { name: 'Câu chuyện', path: '/stories', icon: BookOpen },
    { name: 'Đã lưu', path: '/discoveries', icon: Bookmark, isHighlighted: true },
  ];

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-[#243049]/90 bg-[#080D18]/95 backdrop-blur-2xl px-2 py-2 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[54px] min-h-[48px] px-2 py-1 rounded-xl transition-all duration-200 select-none ${
                  isActive
                    ? 'text-white'
                    : 'text-[#9BA9C3] hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                      tab.isHighlighted
                        ? isActive
                          ? 'bg-gradient-to-tr from-[#3DDC97] to-[#48E3EF] text-[#080D18] shadow-md shadow-[#3DDC97]/30 scale-105'
                          : 'bg-[#18253E] text-[#48E3EF] border border-[#48E3EF]/30'
                        : isActive
                        ? 'bg-white/10 text-[#3DDC97]'
                        : ''
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {isActive && !tab.isHighlighted && (
                      <span className="absolute -bottom-1 left-1/2 h-1 w-2.5 -translate-x-1/2 rounded-full bg-[#3DDC97]" />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium mt-1 tracking-tight ${isActive ? 'text-white font-semibold' : 'text-[#9BA9C3]'}`}>
                    {tab.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
