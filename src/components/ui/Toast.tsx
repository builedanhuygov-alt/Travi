import React, { useEffect, useState } from 'react';
import { CheckCircle2, Info, AlertCircle, X, Sparkles } from 'lucide-react';
import type { ToastMessage } from '../../lib/toast.ts';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastMessage>;
      if (!customEvent.detail) return;
      const newToast = customEvent.detail;
      setToasts((prev) => [...prev.slice(-3), newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3500);
    };

    window.addEventListener('travi-toast', handleToast);
    return () => window.removeEventListener('travi-toast', handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle2 className="h-4 w-4 text-[#3DDC97] shrink-0" />,
    info: <Sparkles className="h-4 w-4 text-[#48E3EF] shrink-0" />,
    warning: <AlertCircle className="h-4 w-4 text-[#F5A623] shrink-0" />,
    neutral: <Info className="h-4 w-4 text-[#9BA9C3] shrink-0" />,
  };

  const borderMap = {
    success: 'border-[#3DDC97]/40 bg-[#0E1626]/95',
    info: 'border-[#48E3EF]/40 bg-[#0E1626]/95',
    warning: 'border-[#F5A623]/40 bg-[#0E1626]/95',
    neutral: 'border-[#243049] bg-[#0E1626]/95',
  };

  return (
    <div
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const type = toast.type || 'success';
        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-modal-in ${borderMap[type]}`}
          >
            <div className="mt-0.5">{iconMap[type]}</div>
            <div className="flex-1 pr-1">
              <h4 className="text-xs font-semibold text-white tracking-wide">
                {toast.title}
              </h4>
              {toast.description && (
                <p className="mt-0.5 text-[11px] text-[#9BA9C3] leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-[#9BA9C3] hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
