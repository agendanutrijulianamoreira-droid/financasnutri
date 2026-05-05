interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'brand' | 'gold';
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:  'bg-cream-200 text-brown-600',
  success:  'bg-success-100 text-success-500',
  danger:   'bg-danger-100 text-danger-500',
  warning:  'bg-warning-100 text-warning-500',
  brand:    'bg-brand-100 text-brand-700',
  gold:     'bg-brand-500 text-brown-900 font-semibold',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
