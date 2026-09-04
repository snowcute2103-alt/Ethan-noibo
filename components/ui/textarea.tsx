import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-24 w-full resize-y rounded-[var(--ui-radius-control)] border border-input bg-surface px-3 py-2 text-base leading-relaxed text-ink outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-[var(--theme-ease)] placeholder:text-muted focus-visible:border-blue focus-visible:ring-2 focus-visible:ring-blue/20 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60 sm:text-sm motion-reduce:transition-none',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
