import * as React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function Field({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex min-w-0 flex-col gap-2', className)} {...props} />;
}

function FieldGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('grid gap-4', className)} {...props} />;
}

function FieldContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex min-w-0 flex-col gap-1', className)} {...props} />;
}

const FieldLabel = Label;

function FieldDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm leading-relaxed text-muted text-pretty', className)} {...props} />;
}

function FieldError({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p role="alert" className={cn('text-sm font-medium text-destructive', className)} {...props} />;
}

function FieldSet({ className, ...props }: React.FieldsetHTMLAttributes<HTMLFieldSetElement>) {
  return <fieldset className={cn('grid gap-4', className)} {...props} />;
}

function FieldLegend({ className, ...props }: React.HTMLAttributes<HTMLLegendElement>) {
  return <legend className={cn('font-heading text-base font-semibold text-navy', className)} {...props} />;
}

export { Field, FieldGroup, FieldContent, FieldLabel, FieldDescription, FieldError, FieldSet, FieldLegend };
