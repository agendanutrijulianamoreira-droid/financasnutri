import { useToastStore } from '../../store/useToastStore';
import type { Toast } from '../../store/useToastStore';

const styles = {
  success: {
    container: 'border-green-700 bg-green-950',
    icon: '✓',
    iconClass: 'text-green-400',
    title: 'text-green-300',
    message: 'text-green-500',
  },
  warning: {
    container: 'border-amber-700 bg-amber-950',
    icon: '⚠',
    iconClass: 'text-amber-400',
    title: 'text-amber-300',
    message: 'text-amber-500',
  },
  error: {
    container: 'border-red-700 bg-red-950',
    icon: '✕',
    iconClass: 'text-red-400',
    title: 'text-red-300',
    message: 'text-red-500',
  },
  info: {
    container: 'border-brand-700 bg-brand-950',
    icon: 'ℹ',
    iconClass: 'text-brand-400',
    title: 'text-brand-300',
    message: 'text-brand-500',
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const s = styles[toast.type];

  return (
    <div
      className={`flex w-80 items-start gap-3 rounded-xl border p-4 shadow-2xl ${s.container}`}
      role="alert"
    >
      <span className={`mt-0.5 flex-shrink-0 text-base font-bold ${s.iconClass}`}>{s.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${s.title}`}>{toast.title}</p>
        {toast.message && (
          <p className={`mt-0.5 text-xs leading-relaxed ${s.message}`}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        className="flex-shrink-0 text-xs text-neutral-600 hover:text-neutral-400"
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
