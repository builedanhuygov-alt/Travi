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
              Travi curates immersive cultural discoveries, slow travel journeys, and artisanal traditions. Built for the deliberate traveler seeking authenticity beyond algorithmic uniformity.
            </p>

            {/* Design System Swatches from Original Asset */}
            <div className="mt-6 flex items-center gap-2">
              <span className="text-[11px] text-[#9BA9C3]/70 font-mono uppercase tracking-wider mr-1">Palette:</span>
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
              Discovery
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/explore" className="transition-colors hover:text-[#3DDC97]">
                  Personalized Culture
                </Link>
              </li>
              <li>
                <Link to="/experiences" className="transition-colors hover:text-[#3DDC97]">
                  Artisan Workshops
                </Link>
              </li>
              <li>
                <Link to="/copilot" className="transition-colors hover:text-[#3DDC97]">
                  Copilot Assistant
                </Link>
              </li>
              <li>
                <Link to="/explore?category=Gastronomy" className="transition-colors hover:text-[#3DDC97]">
                  Heritage Gastronomy
                </Link>
              </li>
            </ul>
          </div>

          {/* Journal & Journeys */}
          <div>
            <h3 className="font-serif text-sm font-semibold tracking-wide text-white uppercase">
              Journeys
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/trips" className="transition-colors hover:text-[#3DDC97]">
                  Saved Itineraries
                </Link>
              </li>
              <li>
                <Link to="/memories" className="transition-colors hover:text-[#3DDC97]">
                  Travel Timeline
                </Link>
              </li>
              <li>
                <Link to="/social" className="transition-colors hover:text-[#3DDC97]">
                  Travel Companions
                </Link>
              </li>
              <li>
                <Link to="/profile" className="transition-colors hover:text-[#3DDC97]">
                  Travel DNA & Stats
                </Link>
              </li>
            </ul>
          </div>

          {/* Philosophy & Foundation */}
          <div>
            <h3 className="font-serif text-sm font-semibold tracking-wide text-white uppercase">
              Ethos
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-center gap-1.5 text-white/80">
                <ShieldCheck className="h-4 w-4 text-[#3DDC97]" />
                <span>Zero Tourist Traps</span>
              </li>
              <li className="flex items-center gap-1.5 text-white/80">
                <Sparkles className="h-4 w-4 text-[#48E3EF]" />
                <span>Artisan Direct</span>
              </li>
              <li className="flex items-center gap-1.5 text-white/80">
                <Compass className="h-4 w-4 text-[#9875FF]" />
                <span>Low Impact Travel</span>
              </li>
              <li className="pt-2 text-xs text-[#9BA9C3]/70">
                Travi System Foundation v0.1
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-[#243049]/40 pt-8 text-xs text-[#9BA9C3]/60">
          <p>© {CURRENT_YEAR} Travi. Travel Beyond the Ordinary. All rights reserved.</p>
          <div className="mt-4 sm:mt-0 flex items-center gap-6">
            <span>Clean Architecture V0.1</span>
            <span>Reduced Motion Aware</span>
            <span>Offline Resilient</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
