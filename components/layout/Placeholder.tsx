import { Construction } from 'lucide-react';

export function Placeholder({ title }: { title: string }) {
  return (
    <section className="glass mt-2 flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
      <Construction className="size-8 text-run-ink" aria-hidden />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">This page is being built.</p>
    </section>
  );
}
