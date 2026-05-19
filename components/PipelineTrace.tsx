"use client";
import { motion } from "framer-motion";

const PHASES = [
  { id: 1, label: "Parse & Detect" },
  { id: 2, label: "Context Budget" },
  { id: 3, label: "Enrich" },
  { id: 4, label: "Domain Overlay" },
  { id: 5, label: "Self-Critique" },
  { id: 6, label: "Tournament" },
];

export type PhaseStatus = "idle" | "running" | "ok" | "skipped" | "error" | "await_override";

export function PipelineTrace({ phaseStatus }: { phaseStatus: Record<number, PhaseStatus> }) {
  return (
    <div className="flex flex-col gap-2" role="list" aria-label="Pipeline phases">
      {PHASES.map((p) => {
        const status = phaseStatus[p.id] ?? "idle";
        return (
          <motion.div
            key={p.id}
            role="listitem"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: status === "idle" ? 0.4 : 1 }}
            className="flex items-center gap-3 text-sm"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                status === "ok"
                  ? "bg-emerald-500"
                  : status === "running"
                  ? "bg-blue-500 animate-pulse"
                  : status === "error"
                  ? "bg-red-500"
                  : status === "await_override"
                  ? "bg-amber-500"
                  : status === "skipped"
                  ? "bg-zinc-600"
                  : "bg-zinc-700"
              }`}
              aria-label={status}
            />
            <span className="font-mono text-xs text-zinc-400 w-4">{p.id}</span>
            <span className={status === "running" ? "text-zinc-100" : "text-zinc-500"}>
              {p.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
