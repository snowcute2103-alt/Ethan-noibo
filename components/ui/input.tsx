import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-[var(--ui-radius-control)] border border-input bg-surface px-3 py-2 text-base text-ink outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-[var(--theme-ease)] file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-muted focus-visible:border-blue focus-visible:ring-2 focus-visible:ring-blue/20 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60 max-[1024px]:h-[44px] sm:text-sm motion-reduce:transition-none',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
