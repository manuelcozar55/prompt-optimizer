export default function CalibrationPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-3">
      <h1 className="text-lg font-semibold">Judge calibration</h1>
      <p className="text-sm text-zinc-400">
        Per-dimension precision/recall/F1 against human labels. Threshold: F1 ≥ 0.85 to ship.
      </p>
      <p className="text-xs text-zinc-500 font-mono">
        Run <code>pnpm calibrate-judge</code> to refresh.
      </p>
    </div>
  );
}
