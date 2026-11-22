import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-5xl font-bold tabular-nums">StrideLog</h1>
      <Button>Theme check</Button>
      <Button className="bg-run-gradient text-ink-on-accent">Start Run</Button>
      <Button className="bg-walk-gradient text-ink-on-accent">Start Walk</Button>
    </main>
  );
}
