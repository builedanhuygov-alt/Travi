import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Star,
  Heart,
  Sparkles,
  Utensils,
  Landmark,
  Compass,
  Bus,
  ShieldAlert,
  Clock,
  Share2,
  Check,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  FileText
} from 'lucide-react';

import { vietnamDestinations } from '../data/vietnamData.ts';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { triggerToast } from '../lib/toast.ts';

export const DestinationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { savedDestIds, toggleSaveDestination } = useDemoStore();
  const [copiedLink, setCopiedLink] = useState(false);

  // Lookup destination by id or alias
  const destination =
    vietnamDestinations.find((d) => d.id === id) ||
    vietnamDestinations.find((d) => d.id.includes(id || '')) ||
    vietnamDestinations[0];

  const isSaved = savedDestIds.includes(destination.id);

  // Find related destinations in the same region
  const relatedDestinations = vietnamDestinations
    .filter((d) => d.id !== destination.id && d.region === destination.region)
    .slice(0, 3);

  const handleToggleSave = () => {
    toggleSaveDestination(destination.id);
    triggerToast(
      isSaved ? `Removed ${destination.name} from saved` : `Saved ${destination.name} to My Journeys`,
      'info'
    );
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      triggerToast('Link copied to clipboard', 'info');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleStartPlanning = () => {
    navigate(`/copilot?destination=${encodeURIComponent(destination.name)}`);
  };

  return (
    <div className="min-h-screen bg-[#080D18] text-[#F4F7FF] pb-24">
      {/* Top Back Navigation Bar */}
      <div className="sticky top-20 z-30 border-b border-[#243049]/80 bg-[#080D18]/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#9BA9C3] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Discover Vietnam</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#243049] bg-[#0E1626] px-3 py-1.5 text-xs text-[#9BA9C3] hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-[#3DDC97]" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                isSaved
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                  : 'border-[#243049] bg-[#0E1626] text-[#9BA9C3] hover:text-white hover:border-white/20'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-current text-rose-500' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Visual Section */}
      <div className="relative h-[65vh] min-h-[460px] w-full overflow-hidden bg-[#0A101D]">
        <img
          src={destination.heroImage}
          alt={destination.name}
          className="h-full w-full object-cover object-center brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080D18] via-[#080D18]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080D18]/80 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-7xl">
            {/* Badges & Region */}
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <Badge variant="outline" className="text-xs text-[#3DDC97] border-[#3DDC97]/40 bg-[#080D18]/80 backdrop-blur-md">
                <MapPin className="h-3 w-3 mr-1" />
                {destination.provinceOrMunicipality}
              </Badge>
              <Badge variant="neutral" className="text-xs text-[#C4D0E5] bg-[#0E1626]/80 backdrop-blur-md border-[#243049]">
                {destination.region}
              </Badge>
              {destination.verificationStatus === 'Verified Editorial' ? (
                <span className="inline-flex items-center gap-1 text-xs text-[#3DDC97] bg-[#3DDC97]/10 px-2.5 py-0.5 rounded-full border border-[#3DDC97]/30 backdrop-blur-sm">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Editorial
                </span>
              ) : (
                <span
                  title={destination.provenanceMetadata?.verificationNotes}
                  className="inline-flex items-center gap-1 text-xs text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-0.5 rounded-full border border-[#F59E0B]/30 backdrop-blur-sm cursor-help"
                >
                  <AlertCircle className="h-3 w-3" />
                  Under Editorial Review
                </span>
              )}
              {destination.isFormerProvince && destination.formerProvinceName && (
                <span className="text-xs text-[#F59E0B] bg-[#080D18]/80 px-2.5 py-0.5 rounded-full border border-[#F59E0B]/30 backdrop-blur-sm">
                  Former Province: {destination.formerProvinceName}
                </span>
              )}
              {destination.historicalNames && destination.historicalNames[0] && (
                <span className="text-xs text-[#9BA9C3] bg-black/50 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                  Historical: {destination.historicalNames[0]}
                </span>
              )}
            </div>


            {/* Destination Titles */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-white mb-2">
              {destination.name}
            </h1>
            <p className="text-lg sm:text-xl text-[#3DDC97] font-serif italic mb-4">
              {destination.vietnameseName}
            </p>

            <p className="max-w-3xl text-sm sm:text-base text-[#C4D0E5] font-light leading-relaxed mb-6">
              {destination.tagline}
            </p>

            {/* Quick Summary Pill Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/15 text-xs text-[#C4D0E5]">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-[#3DDC97] text-[#3DDC97]" />
                <span className="font-semibold text-white">{destination.rating}</span>
                <span className="text-[#9BA9C3]">({destination.reviewsCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#3DDC97]" />
                <span>Best Season: <strong className="text-white">{destination.bestSeason}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#3DDC97]" />
                <span>Recommended Stay: <strong className="text-white">{destination.estimatedVisitDays} Days</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Attribution */}
        <div className="absolute top-4 right-4 z-20 text-[10px] text-white/70 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
          Photo by {destination.imageAttribution.photographer} • Unsplash
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Story & Dossier Column */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            {/* Editorial Overview */}
            <section className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 sm:p-8 backdrop-blur-xl">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] mb-2 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Editorial Story & Heritage
              </h2>
              <h3 className="font-serif text-2xl font-medium text-white mb-4">
                The Essence of {destination.name}
              </h3>
              <p className="text-sm sm:text-base text-[#C4D0E5] leading-relaxed mb-6 font-light">
                {destination.description}
              </p>

              {destination.historicalContext && (
                <div className="rounded-xl border border-[#243049] bg-[#080D18]/80 p-5 mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-[#3DDC97]" />
                    Historical Context & Dynastic Lineage
                  </h4>
                  <p className="text-xs sm:text-sm text-[#9BA9C3] leading-relaxed">
                    {destination.historicalContext}
                  </p>
                </div>
              )}
            </section>

            {/* Must-Try Regional Gastronomy */}
            <section className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 sm:p-8 backdrop-blur-xl">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] mb-2 flex items-center gap-2">
                <Utensils className="h-3.5 w-3.5" />
                Flavors of the Land
              </h2>
              <h3 className="font-serif text-2xl font-medium text-white mb-6">
                Must-Try Culinary Specialties
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {destination.mustTryFood.map((food, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-[#243049] bg-[#080D18] p-4 hover:border-[#3DDC97]/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-white">{food.name}</h4>
                        <span className="text-[11px] font-mono font-medium text-[#3DDC97] shrink-0">
                          {food.estimatedPriceVND}
                        </span>
                      </div>
                      <p className="text-xs text-[#3DDC97] italic mb-2">{food.vietnameseName}</p>
                      <p className="text-xs text-[#9BA9C3] leading-relaxed mb-3">{food.description}</p>
                    </div>

                    {food.recommendedVenues && food.recommendedVenues.length > 0 && (
                      <div className="pt-2 border-t border-[#243049]/60 text-[11px] text-[#C4D0E5]">
                        <span className="text-[#9BA9C3]">Recommended: </span>
                        {food.recommendedVenues.join(' • ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Key Attractions */}
            <section className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 sm:p-8 backdrop-blur-xl">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] mb-2 flex items-center gap-2">
                <Compass className="h-3.5 w-3.5" />
                Iconic Landmarks
              </h2>
              <h3 className="font-serif text-2xl font-medium text-white mb-6">
                Curated Cultural & Natural Sites
              </h3>

              <div className="space-y-4">
                {destination.attractions.map((att) => (
                  <div
                    key={att.id}
                    className="flex flex-col sm:flex-row gap-4 rounded-xl border border-[#243049] bg-[#080D18] p-4 hover:border-[#3DDC97]/40 transition-colors"
                  >
                    <div className="relative h-40 sm:h-auto sm:w-48 shrink-0 rounded-lg overflow-hidden border border-white/5">
                      <img src={att.image} alt={att.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] text-[#3DDC97] border-[#3DDC97]/30">
                            {att.category}
                          </Badge>
                          <span className="text-[11px] text-[#9BA9C3]">• {att.estimatedDuration}</span>
                        </div>
                        <h4 className="text-base font-bold text-white">{att.name}</h4>
                        <p className="text-xs text-[#3DDC97] italic mb-2">{att.vietnameseName}</p>
                        <p className="text-xs text-[#C4D0E5] leading-relaxed mb-3">{att.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#243049]/60 pt-2.5 text-xs text-[#9BA9C3]">
                        <span>Fee: <strong className="text-white">{att.ticketPriceNote || 'Free'}</strong></span>
                        <div className="flex items-center gap-1.5">
                          {att.highlights.slice(0, 2).map((h, i) => (
                            <span key={i} className="text-[10px] bg-[#121C2F] px-2 py-0.5 rounded text-[#C4D0E5]">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Living Experiences & Craft Villages */}
            {destination.localExperiences && destination.localExperiences.length > 0 && (
              <section className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 sm:p-8 backdrop-blur-xl">
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#3DDC97] mb-2 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Living Craft & Ateliers
                </h2>
                <h3 className="font-serif text-2xl font-medium text-white mb-6">
                  Hands-On Master Experiences
                </h3>

                <div className="space-y-4">
                  {destination.localExperiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="rounded-xl border border-[#243049] bg-[#080D18] p-5 hover:border-[#3DDC97]/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <Badge variant="outline" className="text-[10px] text-[#48E3EF] border-[#48E3EF]/30 mb-1">
                            {exp.category}
                          </Badge>
                          <h4 className="text-base font-bold text-white">{exp.title}</h4>
                          <p className="text-xs text-[#3DDC97] italic">{exp.vietnameseTitle}</p>
                        </div>
                        {exp.estimatedCostVND && (
                          <span className="text-xs font-mono text-[#3DDC97] font-semibold bg-[#3DDC97]/10 px-2.5 py-1 rounded-lg border border-[#3DDC97]/20">
                            {exp.estimatedCostVND}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-[#C4D0E5] leading-relaxed mb-3">
                        {exp.description}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-[#9BA9C3]">
                        <MapPin className="h-3.5 w-3.5 text-[#3DDC97]" />
                        <span>Location: {exp.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar: Planning Widget, Weather & Logistics */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Planning CTA Card */}
            <div className="sticky top-36 rounded-2xl border border-[#3DDC97]/40 bg-gradient-to-b from-[#101D30] to-[#0A1220] p-6 shadow-2xl backdrop-blur-xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#3DDC97] bg-[#3DDC97]/10 px-2.5 py-1 rounded-full border border-[#3DDC97]/30">
                AI Smart Itinerary
              </span>

              <h3 className="font-serif text-2xl font-medium text-white mt-3 mb-2">
                Plan a Journey to {destination.name}
              </h3>
              <p className="text-xs text-[#C4D0E5] leading-relaxed mb-5 font-light">
                Generate an editable day-by-day itinerary calibrated to your duration, budget, and travel pacing.
              </p>

              <div className="space-y-3 mb-6 text-xs text-[#C4D0E5] border-t border-b border-[#243049] py-4">
                <div className="flex justify-between">
                  <span className="text-[#9BA9C3]">Backpacker Budget:</span>
                  <span className="font-mono text-white">~{destination.budgetEstimates.budgetDailyVND.toLocaleString()} VND / day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9BA9C3]">Comfort Explorer:</span>
                  <span className="font-mono text-white">~{destination.budgetEstimates.moderateDailyVND.toLocaleString()} VND / day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9BA9C3]">Luxury Heritage:</span>
                  <span className="font-mono text-white">~{destination.budgetEstimates.luxuryDailyVND.toLocaleString()} VND / day</span>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleStartPlanning}
                className="w-full bg-gradient-to-r from-[#10B981] to-[#3DDC97] text-[#080D18] hover:opacity-95 font-semibold text-xs shadow-lg shadow-[#3DDC97]/20"
              >
                <span>Build {destination.name} Itinerary</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Practical Logistics & Transit */}
            <div className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 backdrop-blur-xl">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Bus className="h-4 w-4 text-[#3DDC97]" />
                Transportation Access
              </h4>

              <div className="space-y-3 text-xs text-[#C4D0E5]">
                <div>
                  <span className="text-[#9BA9C3] block font-medium">From Hanoi:</span>
                  <span className="leading-relaxed">{destination.transportationAdvice.fromHanoi}</span>
                </div>
                <div>
                  <span className="text-[#9BA9C3] block font-medium">From Saigon:</span>
                  <span className="leading-relaxed">{destination.transportationAdvice.fromSaigon}</span>
                </div>
                <div>
                  <span className="text-[#9BA9C3] block font-medium">Local Transit:</span>
                  <span className="leading-relaxed">{destination.transportationAdvice.localTransit}</span>
                </div>
              </div>
            </div>

            {/* Cultural Etiquette Tips */}
            <div className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 backdrop-blur-xl">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#F59E0B]" />
                Local Etiquette & Advice
              </h4>

              <ul className="space-y-2.5 text-xs text-[#C4D0E5]">
                {destination.culturalEtiquetteTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3DDC97] mt-1.5 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2025 Administrative Geography & Editorial Provenance */}
            <div className="rounded-2xl border border-[#243049] bg-[#0E1626]/80 p-6 backdrop-blur-xl">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#48E3EF]" />
                2025 Administrative Geography
              </h4>

              <div className="space-y-3 text-xs text-[#C4D0E5]">
                <div>
                  <span className="text-[#9BA9C3] block font-medium">Official Administrative Unit:</span>
                  <span className="text-white font-medium">
                    {destination.officialAdministrativeName} ({destination.administrativeType})
                  </span>
                </div>

                <div>
                  <span className="text-[#9BA9C3] block font-medium">Containment & Merger Status:</span>
                  <span className="leading-relaxed text-[#C4D0E5]">
                    {destination.administrativeRelationship}
                  </span>
                </div>

                <div className="border-t border-[#243049]/60 pt-3">
                  <div className="flex items-center justify-between gap-1.5 text-[11px] text-[#9BA9C3] mb-1.5">
                    <span className="flex items-center gap-1.5 font-semibold text-white">
                      <FileText className="h-3.5 w-3.5 text-[#3DDC97]" />
                      Editorial Provenance & Audit
                    </span>
                    {(destination.coordinatePrecision || destination.provenanceMetadata?.coordinatePrecision) && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#48E3EF]">
                        {destination.coordinatePrecision || destination.provenanceMetadata?.coordinatePrecision}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#9BA9C3] leading-relaxed">
                    Source:{' '}
                    {destination.provenanceMetadata?.sourceUrl ? (
                      <a
                        href={destination.provenanceMetadata.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3DDC97] underline hover:text-[#52eeaa]"
                      >
                        {destination.provenanceMetadata.sourceName || destination.provenanceMetadata.source} ↗
                      </a>
                    ) : (
                      <strong className="text-white">
                        {destination.provenanceMetadata?.sourceName || destination.provenanceMetadata?.source}
                      </strong>
                    )}
                  </p>
                  <p className="text-[11px] text-[#9BA9C3] mt-0.5">
                    Verified: {destination.provenanceMetadata?.lastVerifiedAt || destination.provenanceMetadata?.verifiedDate} • Status: {destination.verificationStatus}
                  </p>
                </div>

                {destination.provenanceMetadata?.verificationNotes && (
                  <div className="rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-3 text-[11px] text-[#F59E0B] leading-relaxed flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{destination.provenanceMetadata.verificationNotes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Related Nearby Destinations */}
        {relatedDestinations.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#243049]/60">
            <h3 className="font-serif text-2xl font-medium text-white mb-6">
              More Sanctuaries in {destination.region}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedDestinations.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/destinations/${rel.id}`}
                  className="group relative flex flex-col rounded-2xl border border-[#243049] bg-[#0E1626] overflow-hidden hover:border-[#3DDC97]/50 transition-all"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <img
                      src={rel.heroImage}
                      alt={rel.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E1626] via-transparent to-transparent" />
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] text-[#3DDC97] font-medium uppercase tracking-wider">
                      {rel.provinceOrMunicipality}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1 group-hover:text-[#3DDC97] transition-colors">
                      {rel.name}
                    </h4>
                    <p className="text-xs text-[#9BA9C3] line-clamp-2 mt-1">{rel.tagline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DestinationDetailPage;
