import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, error, required, children }: FieldProps) {
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
        style={{ color: '#7d6250', letterSpacing: '0.07em' }}
      >
        {label}
        {required && <span style={{ color: '#c0392b', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs" style={{ color: '#c0392b' }}>
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  display: 'block',
  width: '100%',
  borderRadius: 8,
  border: '1px solid #e0d3c0',
  background: '#f9f6f0',
  padding: '8px 12px',
  fontSize: 13.5,
  color: '#2b1a10',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'Inter, system-ui, sans-serif',
};

function useInputStyle() {
  return {
    className: 'w-full',
    style: inputBase,
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      (e.currentTarget as HTMLElement).style.borderColor = '#c9a435';
      (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(201,164,53,0.12)';
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      (e.currentTarget as HTMLElement).style.borderColor = '#e0d3c0';
      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
    },
  };
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { style, onFocus, onBlur } = useInputStyle();
  return (
    <input
      style={style}
      onFocus={onFocus}
      onBlur={onBlur}
      {...props}
      className={props.className ?? ''}
    />
  );
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const { style, onFocus, onBlur } = useInputStyle();
  return (
    <select
      style={{ ...style, cursor: 'pointer' }}
      onFocus={onFocus}
      onBlur={onBlur}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { style, onFocus, onBlur } = useInputStyle();
  return (
    <textarea
      style={{ ...style, resize: 'none' }}
      rows={3}
      onFocus={onFocus}
      onBlur={onBlur}
      {...props}
    />
  );
}
