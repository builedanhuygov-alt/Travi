import React, { useState, useMemo } from 'react';
import {
  Heart,
  Plus,
  MapPin,
  X,
  Users,
  Info
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Input } from '../components/ui/Input.tsx';
import { ImageWithFallback } from '../components/ui/ImageWithFallback.tsx';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { triggerToast } from '../lib/toast.ts';

export const SocialPage: React.FC = () => {
  const { dispatches, createDispatch, toggleLikeDispatch } = useDemoStore();
  const [activeCircle, setActiveCircle] = useState('All');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // New dispatch form
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newText, setNewText] = useState('');
  const [newTag, setNewTag] = useState('Slow Gastronomy');

  const circles = [
    {
      name: 'Kyoto Tea & Architecture Circle',
      tag: 'Zen Architecture',
      members: 142,
      curator: 'Master Kenzo',
      description: 'Private discussions on machiya restorations, sukiya architecture, and ceremonial Uji harvests.',
    },
    {
      name: 'Alpine & High-Pass Trailfinders',
      tag: 'Frontier Ridge',
      members: 98,
      curator: 'Elena Z.',
      description: 'Hut-to-hut routes across the Swiss Valais and Icelandic volcanic plateaus.',
    },
    {
      name: 'Ancestral Gastronomy Guild',
      tag: 'Slow Gastronomy',
      members: 215,
      curator: 'Marco & Chloe',
      description: 'Unpublished trattorias, wild foraging, and natural wine producers.',
    },
  ];

  const filteredDispatches = useMemo(() => {
    if (activeCircle === 'All') return dispatches;
    return dispatches.filter((d) => d.tags.some((t) => t.toLowerCase().includes(activeCircle.toLowerCase())));
  }, [dispatches, activeCircle]);

  const handlePostDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;

    createDispatch({
      author: 'Minh Duy',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      role: 'Architect & Explorer',
      location: newLocation.trim() || 'Global Sanctuary',
      title: newTitle.trim(),
      text: newText.trim(),
      tags: [newTag, 'First-Hand Dispatch'],
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800&auto=format&fit=crop',
    });

    triggerToast('Dispatch Published', `"${newTitle}" shared with your travel circle.`, 'success');
    setNewTitle('');
    setNewLocation('');
    setNewText('');
    setIsShareModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        badge="Explorer Collectives"
        badgeVariant="violet"
        title="Travel Circles & Field Dispatches"
        description="Direct observations, unvarnished recommendations, and curated notes shared between deliberate travelers."
        action={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsShareModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Post Field Dispatch
          </Button>
        }
      />

      {/* Honest Boundary Callout */}
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-[#9875FF]/30 bg-[#9875FF]/5 p-4 text-xs text-[#9BA9C3]">
        <Info className="h-5 w-5 text-[#9875FF] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white block mb-0.5">
            Architecture Boundary: Local Community Sandbox
          </span>
          <p className="font-light leading-relaxed">
            In Foundation v0.2, dispatches and likes are maintained in your local demo sandbox. Multi-user live broadcast feeds and circle memberships will activate with Cloud Firestore under `/dispatches/*` rules in future backend milestones.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Dispatches Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-white">
              Recent Field Dispatches
            </h2>
            <span className="text-xs text-[#9BA9C3]">
              {filteredDispatches.length} Dispatch{filteredDispatches.length > 1 ? 'es' : ''} in View
            </span>
          </div>

          {filteredDispatches.map((post) => (
            <Card key={post.id} variant="default" className="border-[#243049] p-6 space-y-4">
              {/* Author Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={post.avatar}
                    alt={post.author}
                    className="h-10 w-10 rounded-full object-cover border border-[#3DDC97]/50"
                  />
                  <div>
                    <span className="font-medium text-white block text-sm">{post.author}</span>
                    <span className="text-[11px] text-[#9BA9C3]">{post.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#3DDC97]">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{post.location}</span>
                </div>
              </div>

              {/* Title & Body */}
              <div>
                <h3 className="font-serif text-lg font-medium text-white mb-2">{post.title}</h3>
                <p className="text-xs text-[#C4D0E5] font-light leading-relaxed">{post.text}</p>
              </div>

              {/* Image if available */}
              {post.image && (
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#10182A]">
                  <ImageWithFallback
                    src={post.image}
                    alt={post.title}
                    fallbackTitle={post.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Tags & Like Interaction */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#243049]/50 text-xs text-[#9BA9C3]">
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="neutral" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => toggleLikeDispatch(post.id)}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                      post.isLiked ? 'text-rose-400 font-semibold' : 'text-[#9BA9C3] hover:text-white'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span>{post.likes}</span>
                  </button>

                  <span className="text-[11px] text-[#9BA9C3]/70 font-mono">{post.createdAt}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Right Column: Travel Circles */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-white">
              Curated Circles
            </h2>
            <Badge variant="cyan" size="sm">
              3 Circles
            </Badge>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveCircle('All')}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                activeCircle === 'All'
                  ? 'bg-[#3DDC97] text-[#111111]'
                  : 'bg-[#121C30] text-[#9BA9C3] border border-[#243049]'
              }`}
            >
              All Circles
            </button>
            <button
              type="button"
              onClick={() => setActiveCircle('Gastronomy')}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                activeCircle === 'Gastronomy'
                  ? 'bg-[#3DDC97] text-[#111111]'
                  : 'bg-[#121C30] text-[#9BA9C3] border border-[#243049]'
              }`}
            >
              Gastronomy
            </button>
            <button
              type="button"
              onClick={() => setActiveCircle('Zen')}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                activeCircle === 'Zen'
                  ? 'bg-[#3DDC97] text-[#111111]'
                  : 'bg-[#121C30] text-[#9BA9C3] border border-[#243049]'
              }`}
            >
              Architecture
            </button>
          </div>

          <div className="space-y-4">
            {circles.map((c) => (
              <Card key={c.name} variant="default" className="border-[#243049] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#48E3EF]" />
                    <h3 className="font-serif text-sm font-semibold text-white">{c.name}</h3>
                  </div>
                  <span className="text-[10px] text-[#3DDC97] font-mono">{c.members} Explorers</span>
                </div>

                <p className="text-xs text-[#9BA9C3] font-light leading-relaxed">
                  {c.description}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-[#9BA9C3] border-t border-[#243049]/40">
                  <span>Curator: <strong className="text-white font-medium">{c.curator}</strong></span>
                  <span className="text-[#3DDC97]">Invited Collective</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Post Dispatch Modal */}
      {isShareModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-post-title"
        >
          <Card variant="default" className="relative w-full max-w-lg border-[#243049] p-6 shadow-2xl animate-modal-in">
            <div className="flex items-center justify-between border-b border-[#243049] pb-4 mb-5">
              <h3 id="modal-post-title" className="font-serif text-xl font-medium text-white">
                Share Field Dispatch
              </h3>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="rounded-lg p-1 text-[#9BA9C3] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePostDispatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-white mb-1.5">Dispatch Headline *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Dawn Access Secret at Daitoku-ji"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">Sanctuary Location *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Higashiyama, Kyoto"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  leftIcon={<MapPin className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">Circle Classification</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full rounded-xl border border-[#243049] bg-[#121C30] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#3DDC97]"
                >
                  <option value="Slow Gastronomy">Slow Gastronomy</option>
                  <option value="Zen Architecture">Zen Architecture</option>
                  <option value="Frontier Ridge">Frontier Ridge</option>
                  <option value="Local Farmsteads">Local Farmsteads</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">Field Observation Notes *</label>
                <textarea
                  rows={4}
                  required
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full rounded-xl border border-[#243049] bg-[#121C30] p-3 text-xs text-white focus:outline-none focus:border-[#3DDC97]"
                  placeholder="Share non-commercial advice, timing recommendations, or artisan contacts..."
                />
              </div>

              <div className="pt-4 border-t border-[#243049] flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" size="md" onClick={() => setIsShareModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Broadcast Dispatch
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SocialPage;
