import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative inline-flex min-w-0">
      <select
        ref={ref}
        className={cn(
          'h-11 w-full appearance-none rounded-[var(--ui-radius-control)] border border-input bg-surface py-2 pl-3 pr-9 text-base text-ink outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-[var(--theme-ease)] focus-visible:border-blue focus-visible:ring-2 focus-visible:ring-blue/20 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60 sm:text-sm motion-reduce:transition-none',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
      />
    </div>
  )
);
NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
