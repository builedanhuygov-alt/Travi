import React, { useState, useMemo } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Clock,
  Sparkles,
  Bot,
  Users,
  Menu,
  X,
  Play,
  SlidersHorizontal,
  GitBranch
} from 'lucide-react';
import { TraviLogo } from '../brand/TraviLogo.tsx';
import { useDemoStore } from '../../services/storage/demoStore.ts';
import { useAuth } from '../../services/firebase/useAuth.ts';
import { TasteProfileModal } from '../taste/TasteProfileModal.tsx';
import { CulturalRabbitHoleModal } from '../rabbithole/CulturalRabbitHoleModal.tsx';

interface NavbarProps {
  onOpenBrandIntro?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBrandIntro }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTasteModalOpen, setIsTasteModalOpen] = useState(false);
  const [isRabbitHoleOpen, setIsRabbitHoleOpen] = useState(false);
  const location = useLocation();
  const { trips, tasteProfile } = useDemoStore();
  const { user, session } = useAuth();

  const activePillarsCount = useMemo(() => {
    const pillars = ['films', 'music', 'food', 'architecture', 'art', 'history', 'nature', 'localCulture'] as const;
    return pillars.filter((p) => Array.isArray(tasteProfile[p]) && tasteProfile[p].length > 0).length;
  }, [tasteProfile]);

  const navLinks = [
    { name: 'Explore', path: '/explore', icon: Compass, badge: null },
    { name: 'My Trips', path: '/trips', icon: MapPin, badge: trips.length > 0 ? trips.length.toString() : null },
    { name: 'Memories', path: '/memories', icon: Clock, badge: null },
    { name: 'Experiences', path: '/experiences', icon: Sparkles, badge: null },
    { name: 'Concierge', path: '/copilot', icon: Bot, badge: 'Planner' },
    { name: 'Social', path: '/social', icon: Users, badge: null },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#243049]/80 bg-[#080D18]/90 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          to="/"
          className="group flex items-center transition-opacity hover:opacity-95"
          aria-label="Travi Home"
        >
          <TraviLogo size="md" variant="lockup" showTagline={true} />
        </Link>

        {/* Desktop Primary Navigation with Fluid Pill Design */}
        <nav className="hidden lg:flex items-center gap-1 rounded-2xl border border-[#243049]/70 bg-[#0E1626]/80 p-1.5 backdrop-blur-md shadow-inner shadow-black/20">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              location.pathname === link.path ||
              (link.path === '/copilot' && location.pathname === '/concierge');

            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-[#18253E] text-white shadow-sm shadow-black/40 border border-white/5'
                    : 'text-[#9BA9C3] hover:text-[#F4F7FF] hover:bg-white/5'
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive ? 'text-[#3DDC97]' : 'text-[#9BA9C3]'
                  }`}
                />
                <span>{link.name}</span>

                {link.badge && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold leading-tight ${
                      link.badge === 'AI' || link.badge === 'Planner'
                        ? 'bg-[#48E3EF]/20 text-[#48E3EF] border border-[#48E3EF]/30'
                        : 'bg-[#3DDC97]/20 text-[#3DDC97] border border-[#3DDC97]/30'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}

                {isActive && (
                  <span className="absolute bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#3DDC97] to-[#48E3EF]" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right Secondary Utilities */}
        <div className="flex items-center gap-2.5">
          {/* Brand Intro Replay Button */}
          {onOpenBrandIntro && (
            <button
              onClick={onOpenBrandIntro}
              id="btn-play-brand-intro"
              title="Replay Travi Logo Transition Experience"
              type="button"
              className="hidden sm:flex items-center gap-2 rounded-xl border border-[#243049] bg-[#121C30] px-3 py-1.5 text-xs font-medium text-[#9BA9C3] transition-all hover:border-[#48E3EF]/50 hover:text-white hover:bg-[#1A2640] cursor-pointer"
            >
              <Play className="h-3 w-3 fill-[#48E3EF] text-[#48E3EF]" />
              <span className="hidden md:inline">Logo Motion</span>
            </button>
          )}

          {/* Cultural Rabbit Hole Quick Launcher Button */}
          <button
            onClick={() => setIsRabbitHoleOpen(true)}
            id="btn-rabbit-hole"
            title="Explore Cross-Domain Cultural Rabbit Hole"
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-[#9875FF]/40 bg-[#121C30] px-3 py-1.5 text-xs font-medium text-[#C4D0E5] transition-all hover:border-[#9875FF] hover:text-white hover:bg-[#1A2640] cursor-pointer"
          >
            <GitBranch className="h-3.5 w-3.5 text-[#9875FF]" />
            <span className="hidden sm:inline">Rabbit Hole</span>
          </button>

          {/* Taste Studio Quick Tuning Button */}
          <button
            onClick={() => setIsTasteModalOpen(true)}
            id="btn-taste-studio"
            title="Tune 8-Pillar Cultural Taste Profile"
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-[#243049] bg-[#121C30] px-3 py-1.5 text-xs font-medium text-[#9BA9C3] transition-all hover:border-[#3DDC97]/50 hover:text-white hover:bg-[#1A2640] cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#3DDC97]" />
            <span className="hidden sm:inline">Taste Studio</span>
            <span className="rounded-full bg-[#3DDC97]/20 border border-[#3DDC97]/30 px-1.5 py-0.2 text-[10px] font-mono text-[#3DDC97] font-semibold">
              {activePillarsCount}/8
            </span>
          </button>

          {/* Profile Navigation Button */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl border p-1.5 pr-2.5 text-xs font-medium transition-all ${
                isActive
                  ? 'border-[#3DDC97] bg-[#1A2640] text-white shadow-sm'
                  : 'border-[#243049] bg-[#121C30] text-[#9BA9C3] hover:text-white hover:border-white/30'
              }`
            }
          >
            {user && session?.photoURL ? (
              <img src={session.photoURL} alt="Avatar" className="h-7 w-7 rounded-lg object-cover border border-[#3DDC97]" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#3DDC97] to-[#48E3EF] text-[#080D18] font-bold text-xs shadow-sm">
                {user ? (session?.displayName?.slice(0, 2).toUpperCase() || 'TR') : 'GE'}
              </div>
            )}
            <span className="hidden md:inline font-medium">
              {user ? (session?.displayName || 'Explorer') : 'Guest Explorer'}
            </span>
            {!user && (
              <span className="hidden xl:inline rounded bg-[#18253E] px-1.5 py-0.2 text-[9px] font-mono text-[#48E3EF] border border-[#48E3EF]/30">
                Demo
              </span>
            )}
          </NavLink>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#243049] bg-[#121C30] text-[#9BA9C3] lg:hidden hover:text-white cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-[#243049] bg-[#0E1626]/95 backdrop-blur-xl px-4 py-5 lg:hidden animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;

              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#18253E] text-white border border-[#3DDC97]/30'
                      : 'text-[#9BA9C3] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-[#3DDC97]' : 'text-[#9BA9C3]'}`} />
                    <span>{link.name}</span>
                  </div>

                  {link.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        link.badge === 'AI' || link.badge === 'Planner'
                          ? 'bg-[#48E3EF]/20 text-[#48E3EF]'
                          : 'bg-[#3DDC97]/20 text-[#3DDC97]'
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {onOpenBrandIntro && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBrandIntro();
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#243049] bg-[#121C30] py-3 text-sm font-medium text-white hover:bg-[#1A2640] cursor-pointer"
              >
                <Play className="h-4 w-4 fill-[#48E3EF] text-[#48E3EF]" />
                <span>Watch Logo Motion</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsRabbitHoleOpen(true);
              }}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-[#9875FF]/40 bg-[#121C30] py-3 text-sm font-medium text-[#C4D0E5] hover:bg-[#1A2640] cursor-pointer"
            >
              <GitBranch className="h-4 w-4 text-[#9875FF]" />
              <span>Cultural Rabbit Hole</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsTasteModalOpen(true);
              }}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-[#3DDC97]/40 bg-[#121C30] py-3 text-sm font-medium text-[#3DDC97] hover:bg-[#1A2640] cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Tune Taste Profile ({activePillarsCount}/8)</span>
            </button>
          </div>
        </div>
      )}

      {/* Taste Profile Tuning Modal */}
      {isTasteModalOpen && (
        <TasteProfileModal
          isOpen={isTasteModalOpen}
          onClose={() => setIsTasteModalOpen(false)}
        />
      )}

      {/* Cultural Rabbit Hole Modal */}
      {isRabbitHoleOpen && (
        <CulturalRabbitHoleModal
          isOpen={isRabbitHoleOpen}
          onClose={() => setIsRabbitHoleOpen(false)}
        />
      )}
    </header>
  );
};
