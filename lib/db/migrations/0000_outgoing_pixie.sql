CREATE TABLE `eval_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ts` integer DEFAULT (unixepoch()) NOT NULL,
	`pass_rate` real NOT NULL,
	`results` text
);
--> statement-breakpoint
CREATE TABLE `optimizations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trace_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`input` text NOT NULL,
	`output` text NOT NULL,
	`rubric_score` text,
	`domain` text NOT NULL,
	`effort` text NOT NULL,
	`total_tokens` integer DEFAULT 0,
	`total_cost_usd` real DEFAULT 0,
	`duration_ms` integer DEFAULT 0,
	`favorited` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `optimizations_trace_id_unique` ON `optimizations` (`trace_id`);--> statement-breakpoint
CREATE TABLE `pipeline_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`optimization_id` integer NOT NULL,
	`phase` integer NOT NULL,
	`status` text NOT NULL,
	`tokens` text,
	`cost_usd` real DEFAULT 0,
	`latency_ms` integer DEFAULT 0,
	FOREIGN KEY (`optimization_id`) REFERENCES `optimizations`(`id`) ON UPDATE no action ON DELETE no action
);
