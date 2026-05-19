import { Button } from "@/components/ui/button";

export default function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-lg font-semibold">Admin</h1>
      <section>
        <h2 className="text-sm font-semibold text-zinc-200">Cache metrics</h2>
        <p className="text-xs text-zinc-500">
          Hit rate, write/read ratio, alerts (read from /api/admin/cache-metrics).
        </p>
      </section>
      <section>
        <h2 className="text-sm font-semibold text-zinc-200">Master prompt optimization (GEPA)</h2>
        <form action="/api/admin/optimize-master-prompt" method="post">
          <Button size="sm" type="submit">
            Queue offline run
          </Button>
        </form>
      </section>
    </div>
  );
}
