'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer relative inline-flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-input bg-surface text-primary-foreground outline-none transition-[border-color,background-color,box-shadow] duration-150 ease-[var(--theme-ease)] after:absolute after:-inset-3 focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-navy data-[state=checked]:bg-navy data-[state=indeterminate]:border-gold data-[state=indeterminate]:bg-gold data-[state=indeterminate]:text-navy motion-reduce:transition-none',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="grid place-items-center">
      {props.checked === 'indeterminate' ? <Minus className="size-3.5" /> : <Check className="size-3.5" />}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
