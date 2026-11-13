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
      name: 'Nhóm Kiến Trúc & Trà Đạo Cổ Truyền',
      tag: 'Kiến trúc Cổ truyền',
      members: 142,
      curator: 'Nghệ nhân Kenzo',
      description: 'Thảo luận chuyên sâu về trùng tu nhà cổ, kiến trúc truyền thống và các vụ thu hoạch trà nguyên bản.',
    },
    {
      name: 'Cộng Đồng Khám Phá Đèo Mây & Vùng Cao',
      tag: 'Đỉnh trời Biên ải',
      members: 98,
      curator: 'Elena Z.',
      description: 'Cung đường trekking qua các bản làng xa xôi và cao nguyên đá hùng vĩ.',
    },
    {
      name: 'Hội Quán Ẩm Thực Cổ Truyền',
      tag: 'Ẩm thực Chậm',
      members: 215,
      curator: 'Minh Duy & Mai',
      description: 'Những quán ăn gia truyền ẩn mình, nguồn nguyên liệu tự nhiên và nghệ thuật ẩm thực dân gian.',
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
      role: 'Kiến trúc sư & Nhà nghiên cứu văn hóa',
      location: newLocation.trim() || 'Điểm dừng văn hóa',
      title: newTitle.trim(),
      text: newText.trim(),
      tags: [newTag, 'Ghi chép thực địa'],
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800&auto=format&fit=crop',
    });

    triggerToast('Đã đăng bài viết', `"${newTitle}" đã được chia sẻ với cộng đồng du lịch.`, 'success');
    setNewTitle('');
    setNewLocation('');
    setNewText('');
    setIsShareModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        badge="Cộng Đồng Khám Phá"
        badgeVariant="violet"
        title="Cộng Đồng Du Lịch & Ghi Chép Thực Địa"
        description="Góc nhìn thực tế, những gợi ý chân thực và ghi chép sâu sắc được chia sẻ giữa những du khách thấu cảm."
        action={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsShareModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Đăng Ghi Chép Mới
          </Button>
        }
      />

      {/* Honest Boundary Callout */}
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-[#9875FF]/30 bg-[#9875FF]/5 p-4 text-xs text-[#9BA9C3]">
        <Info className="h-5 w-5 text-[#9875FF] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white block mb-0.5">
            Phạm Vi Kiến Trúc: Cộng Đồng Thử Nghiệm Cục Bộ
          </span>
          <p className="font-light leading-relaxed">
            Trong phiên bản Nền tảng v0.2, các bài ghi chép và lượt thích được lưu trữ trong không gian thử nghiệm cục bộ của bạn. Bảng tin phát sóng trực tiếp đa người dùng và nhóm thành viên sẽ kích hoạt cùng Cloud Firestore theo quy tắc `/dispatches/*` ở các giai đoạn backend tiếp theo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Dispatches Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-white">
              Ghi Chép Thực Địa Gần Đây
            </h2>
            <span className="text-xs text-[#9BA9C3]">
              {filteredDispatches.length} Bài viết đang hiển thị
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
              Nhóm Tuyển Chọn
            </h2>
            <Badge variant="cyan" size="sm">
              3 Nhóm cộng đồng
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
              Tất cả nhóm
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
              Ẩm thực
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
              Kiến trúc
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
                  <span className="text-[10px] text-[#3DDC97] font-mono">{c.members} Thành viên</span>
                </div>

                <p className="text-xs text-[#9BA9C3] font-light leading-relaxed">
                  {c.description}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-[#9BA9C3] border-t border-[#243049]/40">
                  <span>Người điều phối: <strong className="text-white font-medium">{c.curator}</strong></span>
                  <span className="text-[#3DDC97]">Nhóm tuyển chọn</span>
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
                Chia Sẻ Ghi Chép Thực Địa
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
                <label className="block text-xs font-medium text-white mb-1.5">Tiêu đề ghi chép *</label>
                <Input
                  type="text"
                  required
                  placeholder="Ví dụ: Bí quyết ngắm bình minh trên đèo Mã Pí Lèng"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">Địa điểm thực tế *</label>
                <Input
                  type="text"
                  required
                  placeholder="Ví dụ: Mèo Vạc, Hà Giang"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  leftIcon={<MapPin className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">Phân loại nhóm</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full rounded-xl border border-[#243049] bg-[#121C30] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#3DDC97]"
                >
                  <option value="Slow Gastronomy">Ẩm thực Chậm</option>
                  <option value="Zen Architecture">Kiến trúc Cổ truyền</option>
                  <option value="Frontier Ridge">Đỉnh trời Biên ải</option>
                  <option value="Local Farmsteads">Nông trại & Làng quê Bản địa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">Ghi chép quan sát thực địa *</label>
                <textarea
                  rows={4}
                  required
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full rounded-xl border border-[#243049] bg-[#121C30] p-3 text-xs text-white focus:outline-none focus:border-[#3DDC97]"
                  placeholder="Chia sẻ những lưu ý phi thương mại, thời điểm lý tưởng hoặc liên hệ nghệ nhân bản địa..."
                />
              </div>

              <div className="pt-4 border-t border-[#243049] flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" size="md" onClick={() => setIsShareModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Đăng Ghi Chép
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
