"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  emptyLabel?: string;
};

/** Compact multi-select that matches list-filter UX without tall native listboxes */
export function MultiCheckDropdown({
  label,
  options,
  value,
  onChange,
  emptyLabel = "All",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const summary =
    value.length === 0
      ? emptyLabel
      : value.length === 1
        ? value[0]
        : `${value.length} selected`;

  return (
    <div className="relative flex min-w-0 items-center gap-1.5" ref={ref}>
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-blue)]/70">
        {label}
      </span>
      <button
        type="button"
        className="flex h-8 min-w-[7.5rem] max-w-[11rem] items-center justify-between gap-1.5 rounded border border-[var(--color-blue)]/25 bg-white px-2 text-left text-sm text-[var(--color-blue)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="truncate">{summary}</span>
        <span className="text-[10px] opacity-60">▾</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-56 min-w-[11rem] overflow-auto rounded border border-[var(--color-blue)]/20 bg-white py-1 shadow-md">
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--color-table-tint)]"
            onClick={() => onChange([])}
          >
            {emptyLabel}
          </button>
          <div className="my-1 border-t border-[var(--color-blue)]/10" />
          {options.map((opt) => {
            const checked = value.includes(opt);
            return (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--color-table-tint)]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked) onChange(value.filter((v) => v !== opt));
                    else onChange([...value, opt]);
                  }}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}