import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-[var(--ui-radius-control)] bg-[var(--theme-border)] motion-reduce:animate-none',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
