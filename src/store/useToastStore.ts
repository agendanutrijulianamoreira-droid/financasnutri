import { create } from 'zustand';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
}

interface ToastStore {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  push(toast) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = toast.duration ?? 4000;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },

  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

/** Convenience helper — use outside React components */
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().push({ type: 'success', title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().push({ type: 'warning', title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().push({ type: 'error', title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().push({ type: 'info', title, message }),
};
