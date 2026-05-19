export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db/client";
import { optimizations } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export default async function HistoryPage() {
  const rows = await db
    .select()
    .from(optimizations)
    .orderBy(desc(optimizations.createdAt))
    .limit(50);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-lg font-semibold mb-4">History</h1>
      <div className="border border-zinc-800 rounded-md divide-y divide-zinc-800">
        {rows.length === 0 && (
          <div className="p-6 text-sm text-zinc-500 font-mono">
            No optimizations yet. Run one from the Editor.
          </div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="p-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <Badge>{r.domain}</Badge>
              <span className="font-mono text-xs text-zinc-500">{r.traceId.slice(0, 16)}</span>
              <span className="truncate max-w-md text-zinc-300">{r.input.slice(0, 80)}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
              <span>${(r.totalCostUsd ?? 0).toFixed(4)}</span>
              <span>{r.totalTokens} tok</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
