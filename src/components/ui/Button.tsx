'use client';

import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost';
}

export function Button({ variant = 'default', className = '', type = 'button', ...props }: ButtonProps) {
  const base =
    'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  const variantClass =
    variant === 'ghost'
      ? 'bg-transparent text-ink border border-grid-line hover:bg-paper-deep'
      : 'bg-accent text-white hover:opacity-90';

  return <button type={type} className={`${base} ${variantClass} ${className}`} {...props} />;
}
