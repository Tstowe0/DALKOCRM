"use client";

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export function useSortableRows<T>(
  rows: T[],
  initialKey: keyof T & string,
  initialDir: SortDir = "asc"
) {
  const [sortKey, setSortKey] = useState<keyof T & string>(initialKey);
  const [sortDir, setSortDir] = useState<SortDir>(initialDir);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const as = av == null ? "" : String(av);
      const bs = bv == null ? "" : String(bv);
      const cmp = as.localeCompare(bs, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggle(key: keyof T & string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return { sorted, sortKey, sortDir, toggle };
}

export function SortTh<T extends string>({
  label,
  column,
  sortKey,
  sortDir,
  onToggle,
  className = "",
}: {
  label: string;
  column: T;
  sortKey: string;
  sortDir: SortDir;
  onToggle: (key: T) => void;
  className?: string;
}) {
  const active = sortKey === column;
  return (
    <th className={`py-2 pr-2 ${className}`}>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-blue)]/70 hover:text-[var(--color-blue)]"
        onClick={() => onToggle(column)}
      >
        {label}
        <span className="text-[9px] opacity-70">
          {active ? (sortDir === "asc" ? "▲" : "▼") : "◇"}
        </span>
      </button>
    </th>
  );
}
