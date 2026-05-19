export interface PipelineEvent {
  phase: 1 | 2 | 3 | 4 | 5 | 6;
  status: "running" | "ok" | "skipped" | "await_override" | "error";
  partial: string;
  tokens: { in: number; out: number; cached_read: number; cached_write: number };
  cost_usd: number;
  latency_ms: number;
  data?: Record<string, unknown>;
}

export function encodeSSE(event: PipelineEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function createSSEStream(): {
  readable: ReadableStream;
  emit: (event: PipelineEvent) => void;
  close: () => void;
} {
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });
  return {
    readable,
    emit: (event) => controller?.enqueue(encoder.encode(encodeSSE(event))),
    close: () => controller?.close(),
  };
}
