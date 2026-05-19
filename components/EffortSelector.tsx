"use client";
import { Button } from "@/components/ui/button";

const EFFORTS = [
  { value: "fast", label: "Fast", desc: "Haiku, minimal thinking" },
  { value: "balanced", label: "Balanced", desc: "Sonnet, medium effort" },
  { value: "deep", label: "Deep", desc: "Opus, high effort" },
  { value: "max", label: "Max", desc: "Opus, maximum effort" },
] as const;

export type EffortLevel = (typeof EFFORTS)[number]["value"];

export function EffortSelector({
  value,
  onChange,
}: {
  value: EffortLevel;
  onChange: (v: EffortLevel) => void;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label="Effort level">
      {EFFORTS.map((e) => (
        <Button
          key={e.value}
          variant={value === e.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(e.value)}
          title={e.desc}
          aria-pressed={value === e.value}
          className="text-xs font-mono"
        >
          {e.label}
        </Button>
      ))}
    </div>
  );
}
