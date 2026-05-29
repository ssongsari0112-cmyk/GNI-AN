import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'olive' | 'blue' | 'gray' | 'green' | 'orange' | 'red';
}

export function Badge({ variant = 'olive', className, children, ...props }: BadgeProps) {
  const variants = {
    olive: 'bg-[#EEF5D6] text-[#5a7012] border border-[#D9E6B7]',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    gray: 'bg-gray-100 text-gray-600 border border-gray-200',
    green: 'bg-green-50 text-green-700 border border-green-200',
    orange: 'bg-orange-50 text-orange-600 border border-orange-200',
    red: 'bg-red-50 text-red-600 border border-red-200',
  };

  return (
    <span
      className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
