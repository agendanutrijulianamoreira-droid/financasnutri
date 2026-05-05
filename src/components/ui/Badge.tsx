interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'brand';
}

const variants = {
  default: 'bg-neutral-800 text-neutral-300',
  success: 'bg-green-950 text-green-400',
  danger: 'bg-red-950 text-red-400',
  warning: 'bg-amber-950 text-amber-400',
  brand: 'bg-brand-900/40 text-brand-400',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
