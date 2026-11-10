import { describe, it, expect } from 'vitest';
import { generateVietnamAiResponse } from '../vietnamAiService';

describe('Vietnam AI Grounding with Cultural & Tourism POI Datasets', () => {
  it('grounds queries about Trống đồng Ngọc Lũ with verified cultural provenance', async () => {
    const res = await generateVietnamAiResponse('Trống đồng Ngọc Lũ');
    expect(res.content).toContain('Trống đồng Ngọc Lũ');
    expect(res.content).toContain('Đông Sơn');
    expect(res.content).toContain('Bảo tàng Lịch sử Quốc gia');
    expect(res.content).toContain('Số 1 Tràng Tiền');
    expect(res.content).toContain('không phải là tọa độ lối vào bảo tàng');
    expect(res.provenance.providerName).toContain('Cultural Data Provider');
  });

  it('grounds queries about Sơn La POIs with unverified coordinate safety notices', async () => {
    const res = await generateVietnamAiResponse('Hang vợ chồng A Phủ');
    expect(res.content).toContain('Hang vợ chồng A Phủ');
    expect(res.content).toContain('Sơn La');
    expect(res.content).toContain('Tây Bắc');
    expect(res.content).toContain('không tự ý giả lập tọa độ cổng vào sai lệch');
    expect(res.provenance.providerName).toContain('Unified Tourism POI Repository');
  });
});

