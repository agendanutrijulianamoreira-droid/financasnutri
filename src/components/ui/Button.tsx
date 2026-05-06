import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brown-900 text-white hover:bg-brown-800 disabled:bg-brown-700 tracking-wide uppercase',
  secondary:
    'border border-cream-400 bg-white text-brown-700 hover:bg-cream-100 hover:border-brown-300 disabled:opacity-50',
  gold:
    'bg-brand-500 text-brown-900 hover:bg-brand-400 disabled:opacity-50 tracking-wide uppercase font-semibold',
  danger:
    'bg-danger-500 text-white hover:bg-danger-400 disabled:opacity-50',
  ghost:
    'text-brown-500 hover:bg-cream-200 hover:text-brown-800 disabled:opacity-50',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-[11px]',
  md: 'px-4 py-2 text-xs',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-300 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
