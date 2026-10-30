import React, { useState, useMemo } from 'react';
import {
  Star,
  MapPin,
  ArrowRight,
  X,
  Users,
  Clock,
  Info,
  Check
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { ImageWithFallback } from '../components/ui/ImageWithFallback.tsx';
import { sampleExperiences } from '../data/sampleData.ts';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { triggerToast } from '../lib/toast.ts';
import type { Experience } from '../types/index.ts';

export const ExperiencesPage: React.FC = () => {
  const { inquiries, createInquiry } = useDemoStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [guestsCount, setGuestsCount] = useState(2);
  const [preferredDate, setPreferredDate] = useState('2026-11-15');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const categories = ['All', 'Gastronomy', 'Heritage', 'Art & Craft', 'Wild & Nature', 'Wellness'];

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return sampleExperiences;
    return sampleExperiences.filter((exp) => exp.category === selectedCategory);
  }, [selectedCategory]);

  const handleOpenBooking = (exp: Experience) => {
    setSelectedExperience(exp);
    setBookingConfirmed(false);
  };

  const handleConfirmInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExperience) return;

    // Calculate simulated price
    const basePriceNum = parseInt(selectedExperience.pricePerPerson.replace(/[^0-9]/g, '')) || 150;
    const total = `$${basePriceNum * guestsCount}`;

    createInquiry({
      experienceId: selectedExperience.id,
      experienceTitle: selectedExperience.title,
      date: preferredDate,
      guestsCount,
      totalPrice: total,
    });

    setBookingConfirmed(true);
    triggerToast(
      'Atelier Inquiry Drafted',
      `Inquiry for ${selectedExperience.title} (${guestsCount} guests) recorded in your demo dossier.`,
      'success'
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        badge="Vietnam Artisanal Heritage"
        badgeVariant="green"
        title="Curated Masterclasses & Local Experiences"
        description="Direct engagements with Bát Tràng ceramic masters, Hội An silk lantern artisans, Huế royal gastronomy custodians, and Mekong floating orchard cultivators."
      />

      {/* Honest Boundary Callout */}
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-[#3DDC97]/30 bg-[#3DDC97]/5 p-4 text-xs text-[#9BA9C3]">
        <Info className="h-5 w-5 text-[#3DDC97] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white block mb-0.5">
            Architecture Boundary: Verified Vietnam Masterclasses & Experiences
          </span>
          <p className="font-light leading-relaxed">
            All experiences are verified authentic cultural ateliers across Vietnam connected to real destinations. Atelier inquiries ({inquiries.length} logged) are recorded locally in your ledger. Production payment escrows are deferred to future booking provider integration.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-all select-none cursor-pointer ${
                isActive
                  ? 'bg-[#3DDC97] text-[#111111] font-semibold shadow-md shadow-[#3DDC97]/25'
                  : 'bg-[#121C30] text-[#9BA9C3] border border-[#243049] hover:text-white hover:border-white/30'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Experiences Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filtered.map((exp) => (
          <Card
            key={exp.id}
            variant="interactive"
            className="flex flex-col sm:flex-row overflow-hidden border border-[#243049] hover:border-[#3DDC97]/40"
            onClick={() => handleOpenBooking(exp)}
          >
            {/* Image */}
            <div className="relative w-full sm:w-2/5 aspect-[16/10] sm:aspect-auto bg-[#10182A]">
              <ImageWithFallback
                src={exp.image}
                alt={exp.title}
                fallbackTitle={exp.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <Badge variant="cyan" size="sm">
                  {exp.category}
                </Badge>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between text-xs text-[#9BA9C3] mb-1.5">
                  <div className="flex items-center gap-1 text-[#3DDC97]">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{exp.location}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-white">
                    <Star className="h-3 w-3 fill-[#3DDC97] text-[#3DDC97]" />
                    <span>{exp.rating}</span>
                  </div>
                </div>

                <h3 className="font-serif text-lg font-medium text-white group-hover:text-[#3DDC97] transition-colors leading-snug mb-2">
                  {exp.title}
                </h3>

                <p className="text-xs text-[#9BA9C3] font-light line-clamp-2 leading-relaxed mb-4">
                  {exp.highlight}
                </p>

                {/* Host Badge */}
                <div className="rounded-xl border border-[#243049]/60 bg-[#0E1626] p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-white block">{exp.hostName}</span>
                    <span className="text-[11px] text-[#9BA9C3]">{exp.hostTitle}</span>
                  </div>
                  <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                    {exp.groupSize}
                  </Badge>
                </div>
              </div>

              {/* Price & Action */}
              <div className="mt-5 pt-3 border-t border-[#243049]/50 flex items-center justify-between">
                <div>
                  <span className="font-serif text-lg font-bold text-white">{exp.pricePerPerson}</span>
                  <span className="text-[11px] text-[#9BA9C3]"> / guest</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#3DDC97] font-medium group-hover:translate-x-1 transition-transform">
                  <span>Reserve Atelier</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Atelier Inquiry Drawer */}
      {selectedExperience && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="atelier-title"
        >
          <div className="fixed inset-0 cursor-pointer" onClick={() => setSelectedExperience(null)} />

          <div className="relative z-10 flex h-full w-full max-w-lg flex-col bg-[#0A101D] border-l border-[#243049] shadow-2xl overflow-y-auto animate-drawer-in">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#243049] bg-[#0A101D]/90 px-6 py-4 backdrop-blur-md">
              <Badge variant="cyan" size="sm">
                {selectedExperience.category} Masterclass
              </Badge>
              <button
                type="button"
                onClick={() => setSelectedExperience(null)}
                className="rounded-lg p-1.5 text-[#9BA9C3] hover:text-white"
                aria-label="Close atelier details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative aspect-[16/9] w-full bg-[#10182A]">
              <ImageWithFallback
                src={selectedExperience.image}
                alt={selectedExperience.title}
                fallbackTitle={selectedExperience.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A101D] via-transparent to-black/30" />
              <div className="absolute bottom-4 left-6 right-6">
                <span className="text-xs text-[#3DDC97] font-mono">{selectedExperience.location}</span>
                <h2 id="atelier-title" className="font-serif text-2xl font-medium text-white mt-0.5">
                  {selectedExperience.title}
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Highlight & Host Info */}
              <div>
                <h4 className="text-[10px] uppercase font-mono tracking-wider text-[#9BA9C3] mb-1">
                  Atelier Highlights
                </h4>
                <p className="text-xs font-light text-white leading-relaxed">
                  {selectedExperience.highlight}
                </p>
              </div>

              <div className="rounded-2xl border border-[#243049] bg-[#121C30] p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#48E3EF] block">Artisan Custodian</span>
                  <span className="font-serif text-base font-semibold text-white mt-0.5 block">
                    {selectedExperience.hostName}
                  </span>
                  <span className="text-[11px] text-[#9BA9C3]">{selectedExperience.hostTitle}</span>
                </div>
                <div className="text-right">
                  <span className="block font-serif text-lg font-bold text-[#3DDC97]">{selectedExperience.pricePerPerson}</span>
                  <span className="text-[10px] text-[#9BA9C3]">Standard Atelier Rate</span>
                </div>
              </div>

              {/* Logistics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#243049] bg-[#0E1626] p-3 text-center">
                  <Clock className="h-4 w-4 text-[#3DDC97] mx-auto mb-1" />
                  <span className="block text-[10px] text-[#9BA9C3] uppercase">Duration</span>
                  <span className="font-medium text-white">{selectedExperience.duration}</span>
                </div>
                <div className="rounded-xl border border-[#243049] bg-[#0E1626] p-3 text-center">
                  <Users className="h-4 w-4 text-[#48E3EF] mx-auto mb-1" />
                  <span className="block text-[10px] text-[#9BA9C3] uppercase">Intimacy Level</span>
                  <span className="font-medium text-white">{selectedExperience.groupSize}</span>
                </div>
              </div>

              {/* Inquiry Form */}
              {bookingConfirmed ? (
                <div className="rounded-2xl border border-[#3DDC97]/40 bg-[#3DDC97]/10 p-5 text-center space-y-2 animate-fade-in">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#3DDC97] text-[#111111]">
                    <Check className="h-5 w-5" />
                  </div>
                  <h4 className="font-serif text-base font-medium text-white">
                    Atelier Inquiry Formally Logged
                  </h4>
                  <p className="text-xs text-[#C4D0E5] font-light leading-relaxed">
                    Your simulated inquiry for {guestsCount} guest(s) on {preferredDate} is saved in your local demo store. No financial charge was made.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedExperience(null)}
                    className="mt-2"
                  >
                    Close Dossier
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleConfirmInquiry} className="rounded-2xl border border-[#243049] bg-[#121C30] p-5 space-y-4">
                  <h4 className="font-serif text-sm font-semibold text-white">
                    Submit Simulated Atelier Inquiry
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#9BA9C3] mb-1">Preferred Date</label>
                      <input
                        type="date"
                        required
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full rounded-xl border border-[#243049] bg-[#0A101D] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3DDC97]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#9BA9C3] mb-1">Guests Count</label>
                      <select
                        value={guestsCount}
                        onChange={(e) => setGuestsCount(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#243049] bg-[#0A101D] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3DDC97]"
                      >
                        {[1, 2, 3, 4, 6].map((num) => (
                          <option key={num} value={num}>
                            {num} Guest{num > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-white font-medium border-t border-[#243049]/60">
                    <span>Estimated Total:</span>
                    <span className="font-serif text-base text-[#3DDC97]">
                      ${(parseInt(selectedExperience.pricePerPerson.replace(/[^0-9]/g, '')) || 150) * guestsCount}
                    </span>
                  </div>

                  <Button type="submit" variant="primary" size="md" className="w-full">
                    Confirm Simulated Inquiry
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperiencesPage;
