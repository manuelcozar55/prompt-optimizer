"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DOMAINS = ["code", "writing", "agentic", "research", "creative", "analytical"];

export function DomainPicker({
  value,
  confidence,
  onChange,
}: {
  value: string;
  confidence?: number;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-36 text-xs font-mono" aria-label="Domain">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DOMAINS.map((d) => (
            <SelectItem key={d} value={d} className="text-xs font-mono">
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {confidence !== undefined && (
        <span
          className={`text-xs font-mono ${confidence < 0.7 ? "text-amber-500" : "text-zinc-500"}`}
        >
          {(confidence * 100).toFixed(0)}%
        </span>
      )}
    </div>
  );
}
