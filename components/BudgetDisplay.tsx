"use client";

export function BudgetDisplay({
  estimatedUsd,
  actualUsd,
  tournament,
}: {
  estimatedUsd?: number;
  actualUsd?: number;
  tournament: boolean;
}) {
  const cap = tournament ? 0.5 : 0.2;
  const display = actualUsd ?? estimatedUsd;
  return (
    <div
      className="flex items-center gap-2 text-xs font-mono text-zinc-500"
      aria-label="Budget display"
    >
      <span>~${display?.toFixed(4) ?? "—"}</span>
      <span className="text-zinc-700">/</span>
      <span className="text-zinc-600">${cap.toFixed(2)} cap</span>
      {actualUsd && actualUsd > cap * 0.8 && (
        <span className="text-amber-500" role="alert">
          near limit
        </span>
      )}
    </div>
  );
}
