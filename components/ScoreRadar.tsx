"use client";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

const DIMS = [
  "clarity",
  "specificity",
  "completeness",
  "groundedness",
  "testability",
  "robustness",
  "cost_efficiency",
];

type DimScore = { pass: boolean };

export function ScoreRadar({
  before,
  after,
}: {
  before: Record<string, DimScore>;
  after: Record<string, DimScore>;
}) {
  const data = DIMS.map((d) => ({
    dim: d.replace("_", " "),
    before: (before[d]?.pass ? 1 : 0) * 100,
    after: (after[d]?.pass ? 1 : 0) * 100,
  }));

  return (
    <div className="w-full h-64" aria-label="Rubric score radar chart">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis dataKey="dim" tick={{ fill: "#71717a", fontSize: 10 }} />
          <Radar name="Before" dataKey="before" stroke="#52525b" fill="#52525b" fillOpacity={0.2} />
          <Radar name="After" dataKey="after" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
