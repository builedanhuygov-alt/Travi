import React, { useEffect, useState } from 'react';
import { checkServerAiStatus } from '../../services/ai/vietnamAiService';

export type AiStatusState = 'AI_ONLINE' | 'AI_OFFLINE' | 'AI_CONNECTING';

interface AiStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export const AiStatusIndicator: React.FC<AiStatusIndicatorProps> = ({
  className = '',
  showLabel = true,
}) => {
  const [aiState, setAiState] = useState<AiStatusState>('AI_CONNECTING');
  const [providerLabel, setProviderLabel] = useState<string>('Đang kiểm tra kết nối AI...');

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      try {
        const info = await checkServerAiStatus();
        if (isMounted) {
          setAiState(info.state);
          if (info.state === 'AI_ONLINE') {
            setProviderLabel('AI Online • Qwen2 GPU');
          } else {
            setProviderLabel('AI Offline • Chế độ Chuyên gia xác thực');
          }
        }
      } catch {
        if (isMounted) {
          setAiState('AI_OFFLINE');
          setProviderLabel('AI Offline • Chế độ Chuyên gia xác thực');
        }
      }
    }

    loadStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const config = {
    AI_ONLINE: {
      dotColor: 'bg-[#10B981]',
      pingColor: 'bg-[#10B981]/50',
      borderColor: 'border-[#10B981]/30',
      badgeBg: 'bg-[#10B981]/10',
      textColor: 'text-[#10B981]',
      text: 'AI Online',
      tooltip: 'Mô hình Qwen2-7B đang kết nối trực tiếp từ máy chủ GPU chuyên dụng.',
    },
    AI_OFFLINE: {
      dotColor: 'bg-amber-400',
      pingColor: 'bg-amber-400/30',
      borderColor: 'border-amber-400/30',
      badgeBg: 'bg-amber-400/10',
      textColor: 'text-amber-300',
      text: 'AI Offline',
      tooltip: 'Máy chủ GPU tạm dừng. Travi tự động vận hành với Bộ tri thức chuyên gia đối soát.',
    },
    AI_CONNECTING: {
      dotColor: 'bg-[#48E3EF]',
      pingColor: 'bg-[#48E3EF]/50',
      borderColor: 'border-[#48E3EF]/30',
      badgeBg: 'bg-[#48E3EF]/10',
      textColor: 'text-[#48E3EF]',
      text: 'AI Connecting',
      tooltip: 'Đang kiểm tra trạng thái dịch vụ suy luận AI...',
    },
  }[aiState];

  return (
    <div
      title={config.tooltip}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-mono transition-all ${config.borderColor} ${config.badgeBg} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {aiState !== 'AI_OFFLINE' && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pingColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`} />
      </span>

      {showLabel && (
        <span className={`font-semibold ${config.textColor}`}>
          {config.text}
        </span>
      )}

      {showLabel && (
        <span className="hidden sm:inline text-[10px] text-[#9BA9C3] border-l border-white/10 pl-2">
          {providerLabel}
        </span>
      )}
    </div>
  );
};

