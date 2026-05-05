interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
        style={{
          background: '#f4efe4',
          border: '1px solid #e0d3c0',
          color: '#c9a435',
        }}
      >
        ◎
      </div>
      <p
        className="font-semibold"
        style={{ fontFamily: 'Georgia, serif', color: '#2b1a10', fontSize: 15 }}
      >
        {title}
      </p>
      {description && (
        <p className="mt-1 text-sm" style={{ color: '#9b7b5c' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
