'use client';
import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface CollapsibleProps {
  trigger: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function Collapsible({ trigger, children, defaultOpen = false, className, triggerClassName }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={clsx('', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          'w-full flex items-center gap-1 text-left text-sm text-gray-600 hover:text-gray-800 transition-colors py-1',
          triggerClassName
        )}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {trigger}
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}
