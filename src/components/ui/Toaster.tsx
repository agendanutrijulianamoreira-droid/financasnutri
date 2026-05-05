import { useToastStore } from '../../store/useToastStore';
import type { Toast } from '../../store/useToastStore';

const styles = {
  success: {
    bg: '#ffffff',
    border: '#4a6741',
    accent: '#4a6741',
    icon: '✓',
    titleColor: '#2b1a10',
    msgColor: '#5e4a3c',
  },
  warning: {
    bg: '#ffffff',
    border: '#b7882c',
    accent: '#b7882c',
    icon: '⚠',
    titleColor: '#2b1a10',
    msgColor: '#5e4a3c',
  },
  error: {
    bg: '#ffffff',
    border: '#c0392b',
    accent: '#c0392b',
    icon: '✕',
    titleColor: '#2b1a10',
    msgColor: '#5e4a3c',
  },
  info: {
    bg: '#ffffff',
    border: '#c9a435',
    accent: '#c9a435',
    icon: 'ℹ',
    titleColor: '#2b1a10',
    msgColor: '#5e4a3c',
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const s = styles[toast.type];

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        width: 320,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderLeft: `4px solid ${s.accent}`,
        borderRadius: 10,
        padding: '14px 16px',
        boxShadow: '0 4px 16px rgba(43,26,16,0.12)',
      }}
    >
      <span
        style={{
          flexShrink: 0,
          marginTop: 1,
          fontWeight: 700,
          fontSize: 13,
          color: s.accent,
        }}
      >
        {s.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: s.titleColor }}>
          {toast.title}
        </p>
        {toast.message && (
          <p style={{ margin: '3px 0 0', fontSize: 12, color: s.msgColor, lineHeight: 1.5 }}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Fechar"
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          color: '#9b7b5c',
          padding: '2px 4px',
          borderRadius: 4,
          lineHeight: 1,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#2b1a10')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#9b7b5c')}
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
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
