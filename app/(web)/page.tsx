"use client";
import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EffortSelector, type EffortLevel } from "@/components/EffortSelector";
import { BudgetDisplay } from "@/components/BudgetDisplay";
import { PipelineTrace, type PhaseStatus } from "@/components/PipelineTrace";
import { DomainPicker } from "@/components/DomainPicker";
import { ScoreRadar } from "@/components/ScoreRadar";
import { DiffViewer } from "@/components/DiffViewer";
import type { PipelineEvent } from "@/lib/llm/streaming";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-zinc-900 rounded-md border border-zinc-800 animate-pulse" />
  ),
});

type DimScore = { pass: boolean; rationale?: string };

interface ResultData {
  initialScore?: { dimensions: Record<string, DimScore>; overall: number };
  finalScore?: { dimensions: Record<string, DimScore>; overall: number };
  domain?: string;
  confidence?: number;
}

export default function HomePage() {
  const [prompt, setPrompt] = useState(
    "Refactor this code to be more robust and improve the performance."
  );
  const [effort, setEffort] = useState<EffortLevel>("balanced");
  const [tournament, setTournament] = useState(false);
  const [domain, setDomain] = useState("code");
  const [confidence, setConfidence] = useState<number | undefined>();
  const [phaseStatus, setPhaseStatus] = useState<Record<number, PhaseStatus>>({});
  const [costUsd, setCostUsd] = useState(0);
  const [result, setResult] = useState<ResultData>({});
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const optimize = useCallback(async () => {
    setRunning(true);
    setErrorMsg(null);
    setPhaseStatus({});
    setResult({});
    setOptimizedPrompt("");
    setCostUsd(0);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const resp = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, effort, tournament, domain_override: domain }),
        signal: ac.signal,
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.text();
        setErrorMsg(err || "Request failed");
        setRunning(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as PipelineEvent;
            setPhaseStatus((prev) => ({ ...prev, [event.phase]: event.status }));
            setCostUsd(event.cost_usd);
            if (event.data) {
              const d = event.data as Record<string, unknown>;
              if (d.domain) setDomain(d.domain as string);
              if (typeof d.confidence === "number") setConfidence(d.confidence);
              if (d.initialScore) setResult((p) => ({ ...p, initialScore: d.initialScore as ResultData["initialScore"] }));
            }
            if (event.status === "error") setErrorMsg(event.partial);
          } catch {
            // ignore
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setErrorMsg((e as Error).message);
    } finally {
      setRunning(false);
    }
  }, [prompt, effort, tournament, domain]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-100">Editor</h1>
          <div className="flex items-center gap-3">
            <DomainPicker value={domain} confidence={confidence} onChange={setDomain} />
            <EffortSelector value={effort} onChange={setEffort} />
            <label className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <input
                type="checkbox"
                checked={tournament}
                onChange={(e) => setTournament(e.target.checked)}
                aria-label="Enable tournament"
              />
              tournament
            </label>
            <BudgetDisplay actualUsd={costUsd} tournament={tournament} />
            <Button onClick={optimize} disabled={running} size="sm" aria-label="Optimize prompt">
              {running ? "Optimizing..." : "Optimize"}
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-zinc-800 overflow-hidden">
          <MonacoEditor
            height="240px"
            defaultLanguage="markdown"
            value={prompt}
            onChange={(v) => setPrompt(v ?? "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              wordWrap: "on",
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        {errorMsg && (
          <div role="alert" className="text-red-400 text-xs font-mono">
            {errorMsg}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 rounded-md border border-zinc-800 p-4">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Pipeline</h2>
          <PipelineTrace phaseStatus={phaseStatus} />
        </div>
        <div className="md:col-span-2 rounded-md border border-zinc-800 p-4">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Rubric (7-D)</h2>
          {result.initialScore && result.finalScore ? (
            <ScoreRadar
              before={result.initialScore.dimensions}
              after={result.finalScore.dimensions}
            />
          ) : (
            <div className="text-xs text-zinc-500 font-mono">
              Awaiting first optimization to render before/after radar.
            </div>
          )}
        </div>
      </section>

      {optimizedPrompt && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">Diff</h2>
            <div className="flex items-center gap-2">
              <Badge>{domain}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(optimizedPrompt)}
                aria-label="Copy optimized prompt"
              >
                Copy markdown
              </Button>
            </div>
          </div>
          <DiffViewer before={prompt} after={optimizedPrompt} />
        </section>
      )}
    </div>
  );
}
