interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-2xl text-neutral-600">
        ◎
      </div>
      <p className="font-medium text-neutral-300">{title}</p>
      {description && <p className="mt-1 text-sm text-neutral-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
