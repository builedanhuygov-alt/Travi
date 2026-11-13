import React, { useState } from 'react';
import {
  MapPin,
  Camera,
  Plus,
  X,
  Trash2,
  Sparkles,
  Info,
  Quote,
  RotateCcw
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Input } from '../components/ui/Input.tsx';
import { ImageWithFallback } from '../components/ui/ImageWithFallback.tsx';
import { useDemoStore } from '../services/storage/demoStore.ts';
import { triggerToast } from '../lib/toast.ts';

export const MemoriesPage: React.FC = () => {
  const { memories, createMemory, deleteMemory, resetToDemoDefaults } = useDemoStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New memory form
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newBadge, setNewBadge] = useState('Không gian Tâm linh');

  const badgeOptions = [
    'Không gian Tâm linh',
    'Xưởng Nghệ nhân',
    'Đỉnh trời Biên ải',
    'Sắc vàng Miền duyên hải',
    'Di sản Sống',
    'Ký ức Ẩm thực',
  ];

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newLocation.trim()) return;

    const created = createMemory({
      title: newTitle.trim(),
      location: newLocation.trim(),
      country: newLocation.includes(',') ? newLocation.split(',')[1].trim() : 'Việt Nam',
      date: new Date().toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' }),
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop',
      note: newNote.trim() || 'Khoảnh khắc tĩnh lặng, thong thả khắc sâu vào ký ức.',
      badge: newBadge,
    });

    triggerToast('Đã lưu khoảnh khắc', `"${created.title}" đã được thêm vào dòng thời gian cảm xúc.`, 'success');
    setNewTitle('');
    setNewLocation('');
    setNewNote('');
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    deleteMemory(id);
    triggerToast('Đã xóa khoảnh khắc', `"${title}" đã được xóa khỏi dòng thời gian.`, 'neutral');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        badge="Kho Kỷ Niệm Cảm Xúc"
        badgeVariant="violet"
        title="Dòng Thời Gian & Kỷ Niệm Chuyến Đi"
        description="Lưu giữ những rung cảm thong thả trong chuyến hành trình: tiếng chuông chùa sớm, màn sương giăng trên đỉnh đèo và những ấm trà than hồng."
        action={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Ghi Lại Kỷ Niệm Mới
          </Button>
        }
      />

      {/* Boundary Callout: Local Sandbox vs Future Cloud Sync */}
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-[#9875FF]/30 bg-[#9875FF]/5 p-4 text-xs text-[#9BA9C3]">
        <Info className="h-5 w-5 text-[#9875FF] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white block mb-0.5">
            Phạm Vi Kiến Trúc: Bộ Nhớ Cục Bộ Thử Nghiệm
          </span>
          <p className="font-light leading-relaxed">
            Trong phiên bản Nền tảng v0.2, các kỷ niệm được lưu trữ trong bộ nhớ trình duyệt cục bộ của bạn. Tính năng tải ảnh độ phân giải cao lên Cloud Storage và định vị vệ tinh trực tiếp sẽ kích hoạt ở các giai đoạn tiếp theo theo quy tắc bảo mật Firebase riêng biệt (`storage.rules`).
          </p>
        </div>
      </div>

      {/* Metrics Counter Card */}
      <div className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="flat" className="p-4 border-[#243049] text-center">
          <span className="block font-serif text-2xl font-bold text-white">{memories.length}</span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#9BA9C3]">Khoảnh khắc đã lưu</span>
        </Card>
        <Card variant="flat" className="p-4 border-[#243049] text-center">
          <span className="block font-serif text-2xl font-bold text-[#3DDC97]">100%</span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#9BA9C3]">Trọn vẹn cảm xúc</span>
        </Card>
        <Card variant="flat" className="p-4 border-[#243049] text-center">
          <span className="block font-serif text-2xl font-bold text-[#48E3EF]">Cục bộ</span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#9BA9C3]">Bộ nhớ trải nghiệm</span>
        </Card>
        <Card variant="flat" className="p-4 border-[#243049] text-center">
          <span className="block font-serif text-2xl font-bold text-[#9875FF]">0ms</span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#9BA9C3]">Độ trễ ngoại tuyến</span>
        </Card>
      </div>

      {/* Timeline Section */}
      {memories.length > 0 ? (
        <div className="relative pl-6 sm:pl-8 border-l border-[#243049] space-y-10">
          {memories.map((mem, index) => (
            <div key={mem.id} className="relative group">
              {/* Timeline Connector Dot */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-6 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#080D18] bg-[#3DDC97] text-[#111111] shadow-md shadow-[#3DDC97]/20 font-bold text-[10px]">
                {index + 1}
              </div>

              {/* Memory Card */}
              <Card variant="default" className="border-[#243049] overflow-hidden p-0 group-hover:border-[#3DDC97]/40 transition-colors">
                <div className="flex flex-col md:flex-row">
                  {/* Photo Container */}
                  <div className="relative md:w-2/5 aspect-[16/10] md:aspect-auto bg-[#10182A]">
                    <ImageWithFallback
                      src={mem.image}
                      alt={mem.title}
                      fallbackTitle={mem.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="violet" size="sm">
                        {mem.badge}
                      </Badge>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#9BA9C3] mb-2">
                        <div className="flex items-center gap-1.5 text-[#3DDC97]">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{mem.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px]">{mem.date}</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(mem.id, mem.title)}
                            className="text-[#9BA9C3] hover:text-rose-400 p-1 rounded transition-colors"
                            title="Xóa kỷ niệm"
                            aria-label={`Xóa ${mem.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-serif text-xl sm:text-2xl font-medium text-white mb-3">
                        {mem.title}
                      </h3>

                      {/* Sensory Quote Box */}
                      <div className="relative rounded-xl border border-[#243049] bg-[#0E1626] p-4 text-xs font-light text-[#C4D0E5] italic leading-relaxed">
                        <Quote className="h-4 w-4 text-[#3DDC97]/40 mb-1" />
                        "{mem.note}"
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#243049]/40 flex items-center justify-between text-[11px] text-[#9BA9C3]">
                      <span>Lưu giữ trong sổ hành trình cục bộ</span>
                      <span className="text-[#3DDC97]">Bản ghi đã đối soát</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        /* Meaningful Empty State */
        <Card variant="flat" className="flex flex-col items-center justify-center p-12 text-center border-[#243049] my-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#9875FF]/10 text-[#9875FF] mb-4">
            <Camera className="h-8 w-8" />
          </div>
          <h3 className="font-serif text-2xl font-medium text-white mb-2">
            Dòng Thời Gian Cảm Xúc Đang Trống
          </h3>
          <p className="max-w-md text-xs text-[#9BA9C3] mb-6 font-light leading-relaxed">
            Bạn chưa ghi lại kỷ niệm chuyến đi nào. Hãy ghi lại một khoảnh khắc đáng nhớ hoặc khôi phục dữ liệu mẫu để trải nghiệm.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Ghi Kỷ Niệm Đầu Tiên
            </Button>
            <Button variant="secondary" size="md" onClick={resetToDemoDefaults} leftIcon={<RotateCcw className="h-4 w-4" />}>
              Khôi Phục Dữ Liệu Mẫu
            </Button>
          </div>
        </Card>
      )}

      {/* Log Memory Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-memory-title"
        >
          <Card variant="default" className="relative w-full max-w-lg border-[#243049] p-6 shadow-2xl animate-modal-in">
            <div className="flex items-center justify-between border-b border-[#243049] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#9875FF]" />
                <h3 id="modal-memory-title" className="font-serif text-xl font-medium text-white">
                  Ghi Lại Kỷ Niệm Cảm Xúc
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-[#9BA9C3] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Tên kỷ niệm *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ví dụ: Sương sớm trên dòng sông Nho Quế"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Địa điểm & Vùng miền *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ví dụ: Cao nguyên đá Đồng Văn, Hà Giang"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  leftIcon={<MapPin className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Phân loại cảm xúc
                </label>
                <select
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  className="w-full rounded-xl border border-[#243049] bg-[#121C30] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#3DDC97]"
                >
                  {badgeOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Nhật ký cảm xúc (Âm thanh, hương vị, ánh sáng)
                </label>
                <textarea
                  rows={4}
                  required
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full rounded-xl border border-[#243049] bg-[#121C30] p-3 text-xs text-white focus:outline-none focus:border-[#3DDC97]"
                  placeholder="Những chi tiết giác quan nào đã giữ trọn sự hiện diện của bạn? (Ví dụ: Mùi hương trầm thoang thoảng; tiếng nước sông vọng lại từ vách đá vôi dựng đứng...)"
                />
              </div>

              <div className="pt-4 border-t border-[#243049] flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Lưu Kỷ Niệm
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MemoriesPage;
