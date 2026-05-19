// Source: Anthropic Agent SDK compaction docs
export interface Turn {
  role: "user" | "assistant";
  content: string;
}

export async function compactHistory(history: Turn[], maxTurns: number = 30): Promise<Turn[]> {
  if (history.length <= maxTurns) return history;
  const toCompact = history.slice(0, history.length - 10);
  const recent = history.slice(history.length - 10);
  const summary = `<compacted_history>\n${toCompact
    .map((t) => `[${t.role}]: ${t.content.slice(0, 200)}...`)
    .join("\n")}\n</compacted_history>`;
  return [{ role: "user", content: summary }, ...recent];
}
