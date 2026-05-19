export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-lg font-semibold">Compare run {id}</h1>
      <p className="text-sm text-zinc-500">Tournament side-by-side view (3 model outputs).</p>
    </div>
  );
}
