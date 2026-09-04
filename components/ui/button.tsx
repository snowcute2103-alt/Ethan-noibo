import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--ui-radius-control)] px-4 text-sm font-semibold transition-[transform,background-color,color,border-color,box-shadow] duration-200 ease-[var(--theme-ease)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-px disabled:pointer-events-none disabled:opacity-50 max-[1024px]:min-h-[44px] max-[1024px]:min-w-[44px] max-[1024px]:px-3 max-[1024px]:text-xs motion-reduce:transform-none motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-navy text-white hover:bg-blue',
        secondary: 'bg-surface-2 text-navy hover:bg-[var(--theme-border)]',
        outline: 'border border-[var(--theme-border)] bg-surface text-navy hover:border-blue hover:text-blue',
        ghost: 'bg-transparent text-navy hover:bg-surface-2 hover:text-blue',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        link: 'min-h-0 bg-transparent px-0 text-blue underline-offset-4 hover:translate-y-0 hover:underline active:translate-y-0',
      },
      size: {
        default: 'h-11 py-2.5',
        sm: 'h-9 min-h-9 px-3 text-xs',
        lg: 'h-12 px-6',
        icon: 'h-11 w-11 px-0',
        'icon-sm': 'h-9 min-h-9 w-9 px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
