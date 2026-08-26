import { flowStepLabel, flowStepState, STATUS_FLOW_STEPS } from "@/domain/status";

export function StatusFlow({ currentStatus }: { currentStatus: string }) {
  return (
    <ol className="flex w-full list-none flex-wrap gap-px overflow-hidden rounded border border-[var(--color-blue)]/25 bg-[var(--color-blue)]/15 p-0">
      {STATUS_FLOW_STEPS.map((step) => {
        const state = flowStepState(step, currentStatus || "New Lead");
        const className =
          state === "current"
            ? "bg-[var(--color-blue)] text-white"
            : state === "done"
              ? "bg-[#c8c8c8] text-[var(--color-blue)]"
              : "bg-white text-[var(--color-blue)]";
        return (
          <li
            key={step}
            className={`min-w-[4.5rem] flex-1 px-1.5 py-1.5 text-center font-[family-name:var(--font-heading)] text-[10px] font-semibold uppercase leading-tight tracking-wide ${className}`}
          >
            {flowStepLabel(step)}
          </li>
        );
      })}
    </ol>
  );
}
