interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: string;
}

export function EmptyState({ title, description, action, icon = '◎' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
        style={{
          background: 'linear-gradient(135deg, #fef9c3 0%, #f4efe4 100%)',
          border: '1px solid #e0d3c0',
          color: '#c9a435',
          boxShadow: '0 2px 8px rgba(201,164,53,0.12)',
        }}
      >
        {icon}
      </div>
      <p
        className="font-semibold"
        style={{ fontFamily: 'Georgia, serif', color: '#2b1a10', fontSize: 16 }}
      >
        {title}
      </p>
      {description && (
        <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: '#9b7b5c' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
