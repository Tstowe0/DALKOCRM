"use client";

import { useState } from "react";

export function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
  actions,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="mb-2.5 overflow-hidden rounded border border-[var(--color-blue)]/20 bg-white shadow-sm">
      <div className="flex items-center bg-[var(--color-blue)] text-white">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 px-3 py-1.5 text-left font-[family-name:var(--font-heading)] text-sm font-semibold"
        >
          <span className="inline-flex h-4 w-4 items-center justify-center text-[10px] opacity-90">
            {open ? "▼" : "▶"}
          </span>
          {title}
        </button>
        {actions ? (
          <div className="flex items-center gap-2 px-3 py-1">{actions}</div>
        ) : null}
      </div>
      {open ? <div className="px-3 py-3 sm:px-4">{children}</div> : null}
    </section>
  );
}
