import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <section className="glass mx-auto mt-6 flex max-w-md flex-col items-center gap-3 rounded-2xl p-8 text-center">
      <Compass className="size-10 text-run-ink" aria-hidden />
      <h2 className="text-lg font-semibold">Off the map</h2>
      <p className="text-sm text-muted-foreground">This page doesn&apos;t exist. Let&apos;s get you back on route.</p>
      <Button asChild className="mt-2">
        <Link href="/">Back to dashboard</Link>
      </Button>
    </section>
  );
}
