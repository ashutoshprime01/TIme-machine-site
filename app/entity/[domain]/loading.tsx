export default function EntityLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="h-4 w-20 rounded bg-panel animate-pulse-soft" />
      <div className="mt-3 h-10 w-72 rounded bg-panel animate-pulse-soft" />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl border border-line bg-panel animate-pulse-soft" />
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-mist" role="status">
        Finding historical captures…
      </p>
    </div>
  );
}
