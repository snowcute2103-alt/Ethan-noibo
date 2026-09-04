import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('relative w-full rounded-[var(--ui-radius-control)] border p-4 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-5 [&>svg~*]:pl-8', {
  variants: {
    variant: {
      default: 'border-[var(--theme-border)] bg-surface text-ink',
      info: 'border-blue/25 bg-info-soft text-ink [&>svg]:text-blue',
      warning: 'border-gold/40 bg-warning-soft text-warning-foreground [&>svg]:text-warning-foreground',
      destructive: 'border-destructive/30 bg-destructive-soft text-destructive [&>svg]:text-destructive',
      success: 'border-success/30 bg-success-soft text-success [&>svg]:text-success',
    },
  },
  defaultVariants: { variant: 'default' },
});

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('mb-1 font-heading font-semibold leading-none text-current', className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('leading-relaxed text-pretty [&_p]:leading-relaxed', className)} {...props} />
  )
);
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
