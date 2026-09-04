// Knowledge-status badges — plan §2: every statement is labeled FACT,
// INFERENCE or HYPOTHESIS, and speculation is never presented as history.

export function StatusBadge({ status }: { status: "FACT" | "INFERENCE" | "HYPOTHESIS" }) {
  const styles: Record<typeof status, string> = {
    FACT: "border-azure/40 bg-azure/10 text-azure",
    INFERENCE: "border-amber/40 bg-amber/10 text-amber-bright",
    HYPOTHESIS: "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${styles[status]}`}
    >
      {status}
    </span>
  );
}
