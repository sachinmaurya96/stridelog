import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('glass flex flex-col items-center gap-3 rounded-2xl px-6 py-10 text-center', className)}>
      <span className="relative grid size-16 place-items-center rounded-2xl bg-run-gradient text-ink-on-accent shadow-lg shadow-run/25">
        <Icon className="size-8" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </section>
  );
}
