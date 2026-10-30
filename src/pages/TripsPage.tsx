import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  ArrowRight,
  Clock,
  Compass,
  X,
  Sparkles,
  Trash2,
  Edit3,
  AlertTriangle,
  Bookmark,
  ChevronRight
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Input } from '../components/ui/Input.tsx';
import { ImageWithFallback } from '../components/ui/ImageWithFallback.tsx';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { triggerToast } from '../lib/toast.ts';
import type { Trip } from '../types/index.ts';

export const TripsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { trips, savedDestinations, createTrip, updateTrip, deleteTrip, toggleSaveDestination } = useDemoStore();

  const VALID_TABS = ['all', 'upcoming', 'planning', 'completed', 'saved'] as const;
  type TabKey = (typeof VALID_TABS)[number];
  const tabParam = searchParams.get('tab') as TabKey | null;
  const [internalTab, setInternalTab] = useState<TabKey>('all');
  const statusFilter: TabKey = tabParam && VALID_TABS.includes(tabParam) ? tabParam : internalTab;

  const handleSelectTab = (tabKey: TabKey) => {
    if (searchParams.has('tab')) {
      setSearchParams(
        (prev) => {
          prev.delete('tab');
          return prev;
        },
        { replace: true }
      );
    }
    setInternalTab(tabKey);
  };
  
  // Initial URL query prefill check
  const prefillDest = searchParams.get('destination') || '';
  const initialShouldOpen = searchParams.get('create') === 'true';

  // Modals & Drawers state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialShouldOpen);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);

  // Form states for Creation
  const [title, setTitle] = useState(() => (prefillDest ? `Expedition to ${prefillDest.split(',')[0]}` : ''));
  const [destination, setDestination] = useState(prefillDest);
  const [startDate, setStartDate] = useState('');
  const [daysCount, setDaysCount] = useState(7);
  const [travelersCount, setTravelersCount] = useState(2);
  const [stopsText, setStopsText] = useState('Arrival & Tea Welcome, Artisan Workshop, Highland Walk');

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    if (searchParams.has('create') || searchParams.has('destination')) {
      setSearchParams(
        (prev) => {
          prev.delete('create');
          prev.delete('destination');
          return prev;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);

  // Accessible keyboard dismissal for active modals & drawers
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (tripToDelete) {
          setTripToDelete(null);
        } else if (editingTrip) {
          setEditingTrip(null);
        } else if (viewingTrip) {
          setViewingTrip(null);
        } else if (isCreateModalOpen) {
          handleCloseCreateModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tripToDelete, editingTrip, viewingTrip, isCreateModalOpen, handleCloseCreateModal]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    if (statusFilter === 'all') return trips;
    if (statusFilter === 'saved') return [];
    return trips.filter((t) => t.status === statusFilter);
  }, [trips, statusFilter]);

  // Handle Trip Creation
  const handleCreateTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim()) return;

    const stops = stopsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newTrip = createTrip({
      title: title.trim(),
      destination: destination.trim(),
      country: destination.includes(',') ? destination.split(',')[1].trim() : 'Vietnam',
      startDate: startDate.trim() || 'Autumn 2026',
      endDate: 'TBD',
      status: 'planning',
      coverImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800&auto=format&fit=crop',
      daysCount: Number(daysCount) || 7,
      travelersCount: Number(travelersCount) || 2,
      itineraryStops: stops.length > 0 ? stops : ['Arrival Sanctuary', 'Local Crafts', 'Contemplative Evening'],
    });

    triggerToast('Journey Created', `"${newTrip.title}" has been saved to your itinerary ledger.`, 'success');
    setTitle('');
    setDestination('');
    setStartDate('');
    handleCloseCreateModal();
  };

  // Handle Trip Editing Submit
  const handleEditTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;

    updateTrip(editingTrip.id, editingTrip);
    triggerToast('Journey Updated', `Changes to "${editingTrip.title}" were saved locally.`, 'success');
    
    // Also update viewing drawer if open
    if (viewingTrip && viewingTrip.id === editingTrip.id) {
      setViewingTrip(editingTrip);
    }
    setEditingTrip(null);
  };

  // Handle Trip Deletion
  const handleConfirmDelete = () => {
    if (!tripToDelete) return;
    deleteTrip(tripToDelete.id);
    triggerToast('Journey Removed', `"${tripToDelete.title}" was removed from your ledger.`, 'neutral');
    if (viewingTrip && viewingTrip.id === tripToDelete.id) {
      setViewingTrip(null);
    }
    setTripToDelete(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <PageHeader
        badge="Itinerary Studio"
        badgeVariant="cyan"
        title="My Curated Journeys"
        description="A deliberate archive of upcoming expeditions, draft itineraries, and bookmarked sanctuaries saved across reloads."
        action={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
            id="btn-create-trip"
          >
            Plan New Journey
          </Button>
        }
      />

      {/* Status Filter Tabs */}
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-[#243049]/60 pb-3">
        {[
          { key: 'all', label: 'All Journeys', count: trips.length },
          { key: 'upcoming', label: 'Upcoming', count: trips.filter((t) => t.status === 'upcoming').length },
          { key: 'planning', label: 'In Planning', count: trips.filter((t) => t.status === 'planning').length },
          { key: 'completed', label: 'Archived Memories', count: trips.filter((t) => t.status === 'completed').length },
          { key: 'saved', label: 'Saved Sanctuaries', count: savedDestinations.length },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleSelectTab(tab.key as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all select-none cursor-pointer ${
                isActive
                  ? 'bg-[#18253E] text-white border border-[#3DDC97]/40 shadow-sm'
                  : 'text-[#9BA9C3] hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  isActive ? 'bg-[#3DDC97]/20 text-[#3DDC97]' : 'bg-[#121C30] text-[#9BA9C3]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {statusFilter === 'saved' ? (
        /* Saved Sanctuaries View */
        <div>
          {savedDestinations.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {savedDestinations.map((dest) => (
                <Card
                  key={dest.id}
                  variant="interactive"
                  className="flex flex-col overflow-hidden border border-[#243049]"
                >
                  <div className="relative aspect-[16/10] bg-[#10182A]">
                    <ImageWithFallback
                      src={dest.heroImage}
                      alt={dest.name}
                      fallbackTitle={dest.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="green" size="sm">
                        {dest.country}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <h3 className="font-serif text-xl font-medium text-white">{dest.name}</h3>
                      <p className="mt-1 text-xs text-[#9BA9C3] line-clamp-2 font-light">{dest.tagline}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#243049] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          toggleSaveDestination(dest.id);
                          triggerToast('Sanctuary Removed', `${dest.name} unbookmarked.`, 'neutral');
                        }}
                        className="text-xs text-rose-400 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/explore?selected=${dest.id}`}
                          className="rounded-lg border border-[#243049] bg-[#121C30] px-2.5 py-1.5 text-xs text-[#9BA9C3] hover:text-white hover:border-white/30 transition-colors"
                        >
                          View Details
                        </Link>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setDestination(`${dest.name}, ${dest.country}`);
                            setTitle(`Expedition to ${dest.name}`);
                            setIsCreateModalOpen(true);
                          }}
                          rightIcon={<Plus className="h-3.5 w-3.5" />}
                        >
                          Plan Journey
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Empty State for Saved Sanctuaries */
            <Card variant="flat" className="flex flex-col items-center justify-center p-12 text-center border-[#243049]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#48E3EF]/10 text-[#48E3EF] mb-3">
                <Bookmark className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-xl font-medium text-white mb-1">
                No Bookmarked Sanctuaries
              </h3>
              <p className="max-w-md text-xs text-[#9BA9C3] mb-6 font-light">
                As you browse the Explore section, click the heart icon on any destination to save it here for future itinerary planning.
              </p>
              <Link to="/explore">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Explore Sanctuaries
                </Button>
              </Link>
            </Card>
          )}
        </div>
      ) : filteredTrips.length > 0 ? (
        /* Trips Cards Grid */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrips.map((trip) => (
            <Card
              key={trip.id}
              variant="interactive"
              className="group flex flex-col overflow-hidden border border-[#243049] hover:border-[#3DDC97]/40"
              onClick={() => setViewingTrip(trip)}
            >
              {/* Photo & Status Banner */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#10182A]">
                <ImageWithFallback
                  src={trip.coverImage}
                  alt={trip.title}
                  fallbackTitle={trip.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121C30] via-transparent to-black/30" />

                <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                  <Badge
                    variant={
                      trip.status === 'upcoming'
                        ? 'green'
                        : trip.status === 'planning'
                        ? 'cyan'
                        : 'neutral'
                    }
                    size="sm"
                    className="backdrop-blur-md uppercase tracking-wider font-mono text-[9px]"
                  >
                    {trip.status === 'upcoming'
                      ? 'Upcoming'
                      : trip.status === 'planning'
                      ? 'In Planning'
                      : 'Completed'}
                  </Badge>
                </div>

                {/* Edit & Delete Quick Hover Actions */}
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTrip({ ...trip });
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#080D18]/80 text-[#9BA9C3] hover:text-white hover:bg-[#3DDC97]/20 transition-colors backdrop-blur-sm"
                    title="Edit itinerary details"
                    aria-label={`Edit ${trip.title}`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTripToDelete(trip);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#080D18]/80 text-[#9BA9C3] hover:text-rose-400 hover:bg-rose-500/20 transition-colors backdrop-blur-sm"
                    title="Delete journey"
                    aria-label={`Delete ${trip.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-3 left-3.5 text-xs text-white/90 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#3DDC97]" />
                  <span className="font-medium drop-shadow-sm">{trip.destination}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <h3 className="font-serif text-xl font-medium tracking-tight text-white group-hover:text-[#3DDC97] transition-colors">
                    {trip.title}
                  </h3>

                  {/* Metadata Chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#9BA9C3]">
                    <div className="flex items-center gap-1 font-light">
                      <Calendar className="h-3.5 w-3.5 text-[#3DDC97]" />
                      <span>{trip.startDate}</span>
                    </div>
                    <div className="flex items-center gap-1 font-light">
                      <Clock className="h-3.5 w-3.5 text-[#48E3EF]" />
                      <span>{trip.daysCount} Days</span>
                    </div>
                    <div className="flex items-center gap-1 font-light">
                      <Users className="h-3.5 w-3.5 text-[#9875FF]" />
                      <span>{trip.travelersCount} Travelers</span>
                    </div>
                  </div>

                  {/* Itinerary Stops Progress Nodes */}
                  <div className="mt-4 space-y-1.5 border-t border-[#243049]/50 pt-3">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#9BA9C3]">
                      Planned Sanctuary Stops:
                    </span>
                    <div className="space-y-1">
                      {trip.itineraryStops.slice(0, 3).map((stop, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-[#C4D0E5]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#3DDC97]" />
                          <span className="truncate">{stop}</span>
                        </div>
                      ))}
                      {trip.itineraryStops.length > 3 && (
                        <span className="text-[10px] text-[#9BA9C3] pl-3.5">
                          +{trip.itineraryStops.length - 3} additional stops
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between pt-3 border-t border-[#243049]/50 text-xs text-[#3DDC97] font-medium">
                  <span>View Itinerary Dossier</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Meaningful Empty State for Status Filters */
        <Card variant="flat" className="flex flex-col items-center justify-center p-12 text-center border-[#243049] my-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3DDC97]/10 text-[#3DDC97] mb-4">
            <Compass className="h-8 w-8" />
          </div>
          <h3 className="font-serif text-2xl font-medium text-white mb-2">
            No Journeys Under "{statusFilter.toUpperCase()}"
          </h3>
          <p className="max-w-md text-xs text-[#9BA9C3] mb-6 font-light leading-relaxed">
            {statusFilter === 'all'
              ? 'You have not scheduled any journeys yet. Start crafting your personalized itinerary or browse curated sanctuaries.'
              : `You have no journeys currently marked as ${statusFilter}. Plan a new journey or change your view filter.`}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Plan New Journey
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleSelectTab('all')}
            >
              Show All Journeys
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 1. Trip Detail / Itinerary Preview Drawer */}
      {/* ========================================================================= */}
      {viewingTrip && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-trip-title"
        >
          <div className="fixed inset-0 cursor-pointer" onClick={() => setViewingTrip(null)} />

          <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-[#0A101D] border-l border-[#243049] shadow-2xl overflow-y-auto animate-drawer-in">
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#243049] bg-[#0A101D]/90 px-6 py-4 backdrop-blur-md">
              <Badge
                variant={viewingTrip.status === 'upcoming' ? 'green' : 'cyan'}
                size="sm"
                className="uppercase tracking-wider font-mono text-[10px]"
              >
                {viewingTrip.status}
              </Badge>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTrip({ ...viewingTrip });
                  }}
                  className="rounded-lg border border-[#243049] bg-[#121C30] p-2 text-[#9BA9C3] hover:text-white"
                  title="Edit journey"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewingTrip(null)}
                  className="rounded-lg border border-[#243049] bg-[#121C30] p-2 text-[#9BA9C3] hover:text-white"
                  aria-label="Close dossier"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative aspect-[16/9] w-full bg-[#10182A]">
              <ImageWithFallback
                src={viewingTrip.coverImage}
                alt={viewingTrip.title}
                fallbackTitle={viewingTrip.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A101D] via-transparent to-black/30" />
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-1.5 text-xs text-[#3DDC97] mb-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{viewingTrip.destination}</span>
                </div>
                <h2 id="view-trip-title" className="font-serif text-2xl font-medium text-white">
                  {viewingTrip.title}
                </h2>
              </div>
            </div>

            {/* Dossier Content */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Timing & Logistics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#243049] bg-[#121C30] p-3 text-center">
                  <span className="block text-[10px] uppercase text-[#9BA9C3]">Timeline</span>
                  <span className="font-semibold text-white mt-0.5 block">{viewingTrip.startDate}</span>
                </div>
                <div className="rounded-xl border border-[#243049] bg-[#121C30] p-3 text-center">
                  <span className="block text-[10px] uppercase text-[#9BA9C3]">Duration</span>
                  <span className="font-semibold text-[#3DDC97] mt-0.5 block">{viewingTrip.daysCount} Days</span>
                </div>
                <div className="rounded-xl border border-[#243049] bg-[#121C30] p-3 text-center">
                  <span className="block text-[10px] uppercase text-[#9BA9C3]">Travelers</span>
                  <span className="font-semibold text-[#48E3EF] mt-0.5 block">{viewingTrip.travelersCount} Guests</span>
                </div>
              </div>

              {/* Day-by-Day Stops Timeline */}
              <div className="rounded-2xl border border-[#243049] bg-[#121C30] p-5">
                <div className="flex items-center gap-2 mb-4 text-[#3DDC97]">
                  <Compass className="h-4 w-4" />
                  <h3 className="font-serif text-base font-medium text-white">
                    Milestone Stops & Experiences
                  </h3>
                </div>

                <div className="relative pl-6 space-y-4 border-l border-[#243049]">
                  {viewingTrip.itineraryStops.map((stop, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3DDC97] text-[9px] font-bold text-[#111111]">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-semibold text-white">{stop}</h4>
                      <p className="text-[11px] text-[#9BA9C3] font-light mt-0.5">
                        Day {idx + 1}: Unhurried cultural immersion with verified artisan custodians.
                      </p>
                      {viewingTrip.dayNotes?.[idx + 1] && (
                        <div className="mt-1.5 rounded-lg border border-[#48E3EF]/30 bg-[#48E3EF]/5 p-2 text-[11px] text-[#C4D0E5]">
                          <span className="text-[#48E3EF] font-mono text-[10px] block uppercase font-medium">Personal Note:</span>
                          <p className="font-light">{viewingTrip.dayNotes[idx + 1]}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pacing Advice Note */}
              <div className="rounded-2xl border border-[#48E3EF]/30 bg-[#48E3EF]/5 p-4 text-[#9BA9C3]">
                <span className="text-white font-medium block mb-1">Travi Deliberate Pacing Notice:</span>
                <p className="font-light leading-relaxed">
                  This itinerary is throttled to maximum 2 major cultural stops per day to preserve space for unexpected discoveries and natural dialogue.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="sticky bottom-0 z-20 flex items-center justify-between border-t border-[#243049] bg-[#0A101D] p-5 backdrop-blur-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTripToDelete(viewingTrip)}
                leftIcon={<Trash2 className="h-4 w-4 text-rose-400" />}
                className="text-rose-400 hover:bg-rose-500/10"
              >
                Delete Journey
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setEditingTrip({ ...viewingTrip })}
                leftIcon={<Edit3 className="h-4 w-4" />}
              >
                Edit Itinerary
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Create Trip Modal */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-create-title"
        >
          <Card variant="default" className="relative w-full max-w-lg border-[#243049] p-6 shadow-2xl animate-modal-in">
            <div className="flex items-center justify-between border-b border-[#243049] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#3DDC97]" />
                <h3 id="modal-create-title" className="font-serif text-xl font-medium text-white">
                  Plan New Journey
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="rounded-lg p-1 text-[#9BA9C3] hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTripSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Journey Title *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Kyoto Tea & Zen Monasteries"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Sanctuary Destination *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Kyoto & Uji, Japan"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  leftIcon={<MapPin className="h-4 w-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">
                    Start Season / Date
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Oct 15, 2026"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">
                    Days Duration
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={daysCount}
                    onChange={(e) => setDaysCount(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">
                    Travelers
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={travelersCount}
                    onChange={(e) => setTravelersCount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Planned Itinerary Stops (Comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={stopsText}
                  onChange={(e) => setStopsText(e.target.value)}
                  className="w-full rounded-xl border border-[#243049] bg-[#121C30] p-3 text-xs text-white focus:outline-none focus:border-[#3DDC97] focus:ring-1 focus:ring-[#3DDC97]"
                  placeholder="e.g. Dawn Bamboo Grove, Private Tea Tasting, Historic Machiya"
                />
              </div>

              <div className="pt-4 border-t border-[#243049] flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={handleCloseCreateModal}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Save Journey
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Edit Trip Modal */}
      {/* ========================================================================= */}
      {editingTrip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-title"
        >
          <Card variant="default" className="relative w-full max-w-lg border-[#243049] p-6 shadow-2xl animate-modal-in">
            <div className="flex items-center justify-between border-b border-[#243049] pb-4 mb-5">
              <h3 id="modal-edit-title" className="font-serif text-xl font-medium text-white">
                Edit Journey Itinerary
              </h3>
              <button
                type="button"
                onClick={() => setEditingTrip(null)}
                className="rounded-lg p-1 text-[#9BA9C3] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditTripSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Title
                </label>
                <Input
                  type="text"
                  required
                  value={editingTrip.title}
                  onChange={(e) => setEditingTrip({ ...editingTrip, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Destination
                </label>
                <Input
                  type="text"
                  required
                  value={editingTrip.destination}
                  onChange={(e) => setEditingTrip({ ...editingTrip, destination: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">
                    Journey Status
                  </label>
                  <select
                    value={editingTrip.status}
                    onChange={(e) => setEditingTrip({ ...editingTrip, status: e.target.value as any })}
                    className="w-full rounded-xl border border-[#243049] bg-[#121C30] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#3DDC97]"
                  >
                    <option value="planning">In Planning</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed / Archive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">
                    Dates
                  </label>
                  <Input
                    type="text"
                    value={editingTrip.startDate}
                    onChange={(e) => setEditingTrip({ ...editingTrip, startDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Stops (Comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={editingTrip.itineraryStops.join(', ')}
                  onChange={(e) =>
                    setEditingTrip({
                      ...editingTrip,
                      itineraryStops: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full rounded-xl border border-[#243049] bg-[#121C30] p-3 text-xs text-white focus:outline-none focus:border-[#3DDC97]"
                />
              </div>

              <div className="pt-4 border-t border-[#243049] flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setEditingTrip(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Update Journey
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Delete Confirmation Modal */}
      {/* ========================================================================= */}
      {tripToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <Card variant="default" className="w-full max-w-md border-rose-500/30 p-6 shadow-2xl animate-modal-in">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="rounded-xl bg-rose-500/10 p-2.5">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 id="delete-dialog-title" className="font-serif text-lg font-medium text-white">
                Remove Journey from Ledger?
              </h3>
            </div>

            <p className="text-xs text-[#9BA9C3] font-light leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-white font-medium">"{tripToDelete.title}"</strong>? This will remove all planned stops and itinerary notes from your local demo storage.
            </p>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setTripToDelete(null)}
              >
                Keep Journey
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmDelete}
                className="bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
              >
                Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TripsPage;
