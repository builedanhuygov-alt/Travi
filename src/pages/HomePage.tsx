import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  Sparkles,
  MapPin,
  Bot,
  Clock,
  Users,
  Search,
  Heart,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Card } from '../components/ui/Card.tsx';
import { ImageWithFallback } from '../components/ui/ImageWithFallback.tsx';
import { sampleDestinations } from '../data/sampleData.ts';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { triggerToast } from '../lib/toast.ts';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { savedDestIds, toggleSaveDestination } = useDemoStore();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const handleQuickChipSearch = (term: string) => {
    navigate(`/explore?search=${encodeURIComponent(term)}`);
  };

  const featurePillars = [
    {
      title: 'Living Heritage',
      desc: 'Imperial citadels of Huế, lantern-lit alleys of Hội An, and thousand-year craft guilds of Thăng Long.',
      icon: Compass,
      route: '/explore',
      color: 'text-[#3DDC97]',
      accentBg: 'bg-[#3DDC97]/10',
      borderAccent: 'hover:border-[#3DDC97]/40',
    },
    {
      title: 'Smart Trip Planner',
      desc: 'Algorithmic day-by-day itineraries with pacing, regional routing, and transparent budget breakdowns.',
      icon: MapPin,
      route: '/copilot',
      color: 'text-[#48E3EF]',
      accentBg: 'bg-[#48E3EF]/10',
      borderAccent: 'hover:border-[#48E3EF]/40',
    },
    {
      title: 'Vietnam Interactive Map',
      desc: 'Mercator SVG cartography mapping Vietnam with genuine provincial coordinates and regional filtering.',
      icon: Clock,
      route: '/explore?view=map',
      color: 'text-[#9875FF]',
      accentBg: 'bg-[#9875FF]/10',
      borderAccent: 'hover:border-[#9875FF]/40',
    },
    {
      title: 'Authentic Gastronomy',
      desc: 'Explore North-to-South culinary lineages: Phở Hà Nội, Bún Bò Huế, Cao Lầu, and Mekong floating markets.',
      icon: Sparkles,
      route: '/experiences',
      color: 'text-[#3DDC97]',
      accentBg: 'bg-[#3DDC97]/10',
      borderAccent: 'hover:border-[#3DDC97]/40',
    },
    {
      title: 'Vietnam AI Assistant',
      desc: 'Contextual AI concierge advising on microclimates, cultural etiquette, local passes, and itineraries.',
      icon: Bot,
      route: '/copilot',
      color: 'text-[#48E3EF]',
      accentBg: 'bg-[#48E3EF]/10',
      borderAccent: 'hover:border-[#48E3EF]/40',
    },
    {
      title: 'My Curated Journeys',
      desc: 'Persistent trip builder with editable stops, saved destinations, and transparent local storage.',
      icon: Users,
      route: '/trips',
      color: 'text-[#9875FF]',
      accentBg: 'bg-[#9875FF]/10',
      borderAccent: 'hover:border-[#9875FF]/40',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* ========================================================================= */}
      {/* 1. Cinematic Hero Section */}
      {/* ========================================================================= */}
      <section className="relative min-h-[85vh] sm:min-h-[88vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-20">
        {/* Background Visual Layer */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2000&auto=format&fit=crop"
            alt="Hạ Long Bay Karst Sanctuary Vietnam"
            fallbackTitle="Hạ Long Bay Vietnam"
            fallbackColor="#0D1625"
            className="h-full w-full object-cover scale-105 filter brightness-70 contrast-110"
          />
          {/* Multi-layered cinematic gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080D18] via-[#080D18]/65 to-black/55" />
          <div className="absolute inset-0 bg-radial at-center from-transparent via-[#080D18]/30 to-[#080D18]" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 mx-auto max-w-4xl text-center flex flex-col items-center">
          {/* Brand Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white backdrop-blur-md mb-6 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#3DDC97] animate-pulse" />
            <span className="font-mono uppercase tracking-widest text-[10px]">
              AI-Powered Vietnam Travel Platform
            </span>
          </div>

          {/* Value Proposition Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-white leading-[1.08] mb-6 drop-shadow-md">
            Discover Vietnam. <br />
            <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#F4F7FF] via-[#3DDC97] to-[#48E3EF]">
              Plan Your Journey. Experience More.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-sm sm:text-base font-light text-[#C4D0E5] leading-relaxed mb-8 drop-shadow-sm">
            Explore Vietnam&apos;s provincial destinations, living craft villages, limestone karst sanctuaries, and UNESCO heritage across the S-shaped land.
          </p>

          {/* Central Search Form */}
          <form
            onSubmit={handleHeroSearch}
            className="w-full max-w-xl rounded-2xl border border-white/20 bg-[#0E1626]/85 p-2 backdrop-blur-xl shadow-2xl transition-all duration-300 focus-within:border-[#3DDC97] focus-within:ring-2 focus-within:ring-[#3DDC97]/20 mb-4"
          >
            <div className="flex items-center gap-2">
              <div className="pl-3 text-[#3DDC97]">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Vietnam destinations, dishes, craft villages (e.g. Hội An, Phở, Bát Tràng)..."
                className="w-full bg-transparent px-2 py-2 text-xs sm:text-sm text-white placeholder-[#9BA9C3] focus:outline-none"
                aria-label="Search Vietnam destinations"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="shrink-0"
              >
                Explore
              </Button>
            </div>
          </form>

          {/* Primary Journey CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/explore?studio=true')}
              leftIcon={<SlidersHorizontal className="h-3.5 w-3.5 text-[#3DDC97]" />}
              className="border-[#3DDC97]/40 hover:bg-[#3DDC97]/10 text-white text-xs"
            >
              Vietnam Travel Profile Studio (8 Cultural Pillars)
            </Button>
          </div>

          {/* Quick Inspiration Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#9BA9C3]">
            <span className="text-[11px] font-mono uppercase text-[#9BA9C3]/70">Highlights:</span>
            {['Hạ Long Karst', 'Hà Giang Loop', 'Hội An Lanterns', 'Tràng An Sanctuary', 'Phú Quốc Coral'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickChipSearch(tag)}
                className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] text-white/90 hover:border-[#3DDC97] hover:text-[#3DDC97] transition-colors cursor-pointer backdrop-blur-sm"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Scroll Indicator Pill */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[11px] font-mono text-[#9BA9C3]/70 uppercase tracking-widest">
          <span>Scroll to Discover</span>
          <ChevronRight className="h-3 w-3 rotate-90" />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. Curated Sanctuaries Showcase */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#3DDC97] uppercase tracking-wider mb-2 font-mono">
              <Sparkles className="h-4 w-4" />
              <span>Vietnam Destination Index</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white">
              Curated Vietnam Destinations
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#9BA9C3] font-light max-w-xl">
              Hand-verified destinations selected for historical resonance, UNESCO recognition, authentic gastronomy, and living craft traditions.
            </p>
          </div>

          <Link to="/explore">
            <Button variant="secondary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Explore All Destinations
            </Button>
          </Link>
        </div>

        {/* Featured 3 Showcase Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {sampleDestinations.slice(0, 3).map((dest) => {
            const isSaved = savedDestIds.includes(dest.id);
            return (
              <Card
                key={dest.id}
                variant="interactive"
                className="group flex flex-col overflow-hidden border border-[#243049] hover:border-[#3DDC97]/40"
                onClick={() => navigate(`/explore?selected=${dest.id}`)}
              >
                <div className="relative aspect-[16/10] bg-[#10182A]">
                  <ImageWithFallback
                    src={dest.heroImage}
                    alt={dest.name}
                    fallbackTitle={dest.name}
                    fallbackColor={dest.fallbackColor}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121C30] via-transparent to-black/30" />

                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                    <Badge variant="neutral" size="sm" className="backdrop-blur-md bg-[#080D18]/85 text-white font-medium border-white/10">
                      <MapPin className="h-3 w-3 text-[#3DDC97] mr-1" />
                      {dest.country}
                    </Badge>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextSaved = toggleSaveDestination(dest.id);
                        if (nextSaved) triggerToast('Saved to My Trips', `${dest.name} bookmarked.`, 'success');
                        else triggerToast('Removed from Saved', `${dest.name} removed.`, 'neutral');
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                        isSaved
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                          : 'bg-[#080D18]/70 text-white/80 hover:bg-white hover:text-rose-500'
                      }`}
                      aria-label={isSaved ? 'Remove from saved' : 'Save sanctuary'}
                    >
                      <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3.5">
                    <span className="rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm border border-white/10">
                      {dest.vibe}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="font-serif text-xl font-medium text-white group-hover:text-[#3DDC97] transition-colors">
                      {dest.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#9BA9C3] line-clamp-2 font-light leading-relaxed">
                      {dest.tagline}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#243049]/50 flex items-center justify-between text-xs text-[#9BA9C3]">
                    <span className="font-light">{dest.idealDays} Days Stay</span>
                    <span className="text-[#3DDC97] font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Details <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. Cultural Personalization & Ethos Pillars */}
      {/* ========================================================================= */}
      <section className="border-t border-[#243049]/60 bg-[#060A14] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-widest text-[#48E3EF] mb-2 block">
              The Travi Vietnam Ethos
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-3">
              Crafted for Immersion, Not Commercial Checklists
            </h2>
            <p className="text-xs sm:text-sm text-[#9BA9C3] font-light leading-relaxed">
              Travi connects modern travelers directly with ancestral craft guilds, karst waterways, imperial heritage, and regional gastronomy across Vietnam.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featurePillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Link key={pillar.title} to={pillar.route} className="block group">
                  <Card
                    variant="default"
                    className={`h-full p-6 transition-all duration-300 border-[#243049] ${pillar.borderAccent} group-hover:-translate-y-1`}
                  >
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${pillar.accentBg} ${pillar.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-lg font-medium text-white group-hover:text-[#3DDC97] transition-colors mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-[#9BA9C3] font-light leading-relaxed">
                      {pillar.desc}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. Editorial Call-to-Action */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-[#243049] bg-gradient-to-r from-[#10182A] via-[#0E1626] to-[#080D18] p-8 sm:p-14 text-center">
          <div className="relative z-10 max-w-2xl mx-auto">
            <Badge variant="cyan" size="sm" className="mb-4 uppercase tracking-widest font-mono text-[10px]">
              Discover Vietnam
            </Badge>
            <h2 className="font-serif text-3xl sm:text-5xl font-medium text-white mb-4 leading-tight">
              Begin Your Journey Across Vietnam
            </h2>
            <p className="text-xs sm:text-sm text-[#9BA9C3] font-light mb-8 max-w-lg mx-auto leading-relaxed">
              Explore living heritage, craft an algorithmic day-by-day itinerary, and experience the S-shaped land with depth and intention.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/explore">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Discover Vietnam
                </Button>
              </Link>
              <Link to="/copilot">
                <Button variant="secondary" size="lg">
                  Smart Trip Planner
                </Button>
              </Link>
            </div>
          </div>

          {/* Ambient glow */}
          <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-[#3DDC97]/10 blur-3xl pointer-events-none" />
          <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-[#48E3EF]/10 blur-3xl pointer-events-none" />
        </div>
      </section>
    </div>
  );
};
