import * as React from 'react';
import { cn } from '@/lib/utils';

function Empty({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex min-h-40 flex-col items-center justify-center gap-3 px-6 py-10 text-center', className)}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex max-w-md flex-col items-center gap-1.5', className)} {...props} />;
}

function EmptyMedia({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('grid size-11 place-items-center rounded-full bg-surface-2 text-muted [&_svg]:size-5', className)}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-heading text-base font-semibold text-navy', className)} {...props} />;
}

function EmptyDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm leading-relaxed text-muted text-pretty', className)} {...props} />;
}

function EmptyContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-wrap items-center justify-center gap-3', className)} {...props} />;
}

export { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent };
