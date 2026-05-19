import { Button } from "@/components/ui/button";

export default function EvalsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-lg font-semibold">Evals</h1>
      <p className="text-sm text-zinc-400">
        Golden suite: 30 cases across 6 domains. Pass-rate threshold policy enforces -5pp regression
        blocking.
      </p>
      <form action="/api/evals/run" method="post">
        <Button type="submit" size="sm">
          Run golden suite
        </Button>
      </form>
      <a className="text-xs text-zinc-500 underline" href="/evals/calibration">
        View calibration report
      </a>
    </div>
  );
}
