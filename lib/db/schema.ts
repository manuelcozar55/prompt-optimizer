import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const optimizations = sqliteTable("optimizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  traceId: text("trace_id").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  input: text("input").notNull(),
  output: text("output").notNull(),
  rubricScore: text("rubric_score"),
  domain: text("domain").notNull(),
  effort: text("effort").notNull(),
  totalTokens: integer("total_tokens").default(0),
  totalCostUsd: real("total_cost_usd").default(0),
  durationMs: integer("duration_ms").default(0),
  favorited: integer("favorited", { mode: "boolean" }).default(false),
});

export const pipelineEvents = sqliteTable("pipeline_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  optimizationId: integer("optimization_id")
    .notNull()
    .references(() => optimizations.id),
  phase: integer("phase").notNull(),
  status: text("status").notNull(),
  tokens: text("tokens"),
  costUsd: real("cost_usd").default(0),
  latencyMs: integer("latency_ms").default(0),
});

export const evalRuns = sqliteTable("eval_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ts: integer("ts", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  passRate: real("pass_rate").notNull(),
  results: text("results"),
});
