export type ToastType = 'success' | 'info' | 'warning' | 'neutral';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
}

// Global event bus for lightweight, zero-dependency feedback toasts
export function triggerToast(title: string, description?: string, type: ToastType = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('travi-toast', {
        detail: {
          id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title,
          description,
          type,
        },
      })
    );
  }
}
