import { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-grid-line bg-surface p-4 sm:p-5 ${className}`}
      {...props}
    />
  );
}
