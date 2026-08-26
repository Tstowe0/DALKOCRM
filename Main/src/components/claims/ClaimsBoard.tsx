"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ClaimListRow } from "@/data/claims";
import { companyDetailHref } from "@/domain/status";
import { formatLogDateTime, toAllCaps } from "@/domain/formatting";
import { CLAIM_TOPICS, CLAIM_TYPES } from "@/domain/leadExtras";

type SearchRow = { id: string; field: string; value: string };
type CompanyOption = { id: string; companyName: string };

type Props = {
  initialRows: ClaimListRow[];
  companies: CompanyOption[];
  initialCompanyId?: string;
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (claimId: string, formData: FormData) => Promise<void>;
  deleteAction: (claimId: string) => Promise<void>;
  massDeleteAction: (ids: string[]) => Promise<void>;
};

const SEARCH_BY = ["Type", "Topic", "Load No", "Company"].sort((a, b) =>
  a.localeCompare(b)
);
const PAGE_SIZES = [10, 25, 50, 100];

export function ClaimsBoard({
  initialRows,
  companies,
  initialCompanyId,
  createAction,
  updateAction,
  deleteAction,
  massDeleteAction,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [searches, setSearches] = useState<SearchRow[]>([
    { id: "s1", field: "Type", value: "" },
  ]);
  const [applied, setApplied] = useState({
    searches: [{ id: "s1", field: "Type", value: "" }] as SearchRow[],
    companyId: initialCompanyId ?? "",
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState("modifiedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"add" | ClaimListRow | null>(null);

  const filtered = useMemo(() => {
    return initialRows.filter((row) => {
      if (applied.companyId && row.companyId !== applied.companyId) return false;
      for (const s of applied.searches) {
        if (!s.field || !s.value.trim()) continue;
        const v = s.value.trim().toUpperCase();
        switch (s.field) {
          case "Type":
            if (!row.type.toUpperCase().includes(v)) return false;
            break;
          case "Topic":
            if (!row.topic.toUpperCase().includes(v)) return false;
            break;
          case "Load No":
            if (!row.loadNo.toUpperCase().includes(v)) return false;
            break;
          case "Company":
            if (!row.companyName.toUpperCase().includes(v)) return false;
            break;
          default:
            break;
        }
      }
      return true;
    });
  }, [initialRows, applied]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = String((a as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[sortKey] ?? "");
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(page, pageCount);
  const pageRows = sorted.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);
  const allPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function runFind() {
    const missing = searches.some((s) => s.field && !s.value.trim());
    if (missing) {
      window.alert("Please enter search criteria");
      return;
    }
    setApplied({
      searches: searches.map((s) => ({ ...s })),
      companyId: initialCompanyId ?? "",
    });
    setPage(1);
    setSelected(new Set());
  }

  function requireSelection(): string[] | null {
    if (selected.size === 0) {
      window.alert("Please select Claim(s) to continue");
      return null;
    }
    return [...selected];
  }

  function exportSelected() {
    const ids = requireSelection();
    if (!ids) return;
    const rows = sorted.filter((r) => ids.includes(r.id));
    const headers = [
      "Type",
      "Topic",
      "Load No",
      "Company",
      "Created By",
      "Created",
      "Last Modified By",
      "Modified",
    ];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.type,
          r.topic,
          r.loadNo,
          r.companyName,
          r.createdBy,
          formatLogDateTime(r.createdAt),
          r.modifiedBy,
          formatLogDateTime(r.modifiedAt),
        ]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "claims-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveModal(fd: FormData) {
    if (modal === "add") await createAction(fd);
    else if (modal && typeof modal === "object")
      await updateAction(modal.id, fd);
    setModal(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-blue)]">
            Claims
          </h1>
          <p className="text-sm text-[var(--color-table-line)]">
            {initialCompanyId
              ? "Filtered to selected company — from Client Claims & Disputes"
              : "Global Claims list (Appearance nav; columns from Client First Draft)"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            title="Add Claim"
            className="inline-flex h-9 items-center rounded bg-[var(--color-blue)] px-4 font-[family-name:var(--font-heading)] text-sm font-semibold text-white"
            onClick={() => setModal("add")}
          >
            Add Claim
          </button>
          <select
            className="h-9 rounded border border-[var(--color-blue)]/25 bg-white px-2 text-sm text-[var(--color-blue)]"
            defaultValue=""
            onChange={(e) => {
              const action = e.target.value;
              e.target.value = "";
              if (!action) return;
              const ids = requireSelection();
              if (!ids) return;
              if (action === "Export") exportSelected();
              if (action === "Mass Delete") {
                const ok = window.confirm(
                  "The selected Claims will be permanently deleted. Do you wish to continue?"
                );
                if (!ok) return;
                startTransition(async () => {
                  await massDeleteAction(ids);
                  setSelected(new Set());
                  router.refresh();
                });
              }
            }}
          >
            <option value="">Actions</option>
            <option value="Export">Export</option>
            <option value="Mass Delete">Mass Delete</option>
          </select>
        </div>
      </div>

      <div className="rounded border border-[var(--color-blue)]/15 bg-white px-3 py-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {searches.map((row, idx) => (
            <div key={row.id} className="flex flex-wrap items-center gap-1.5">
              {idx === 0 ? (
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-blue)]/70">
                  Search by
                </span>
              ) : (
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-blue)]/40">
                  and
                </span>
              )}
              <select
                className="h-8 w-[9rem] shrink-0 rounded border border-[var(--color-blue)]/25 bg-white px-2 text-sm"
                value={row.field}
                onChange={(e) => {
                  const next = [...searches];
                  next[idx] = { ...row, field: e.target.value, value: "" };
                  setSearches(next);
                }}
              >
                {SEARCH_BY.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <input
                className="h-8 w-40 rounded border border-[var(--color-blue)]/25 px-2 text-sm"
                value={row.value}
                onChange={(e) => {
                  const next = [...searches];
                  next[idx] = { ...row, value: e.target.value };
                  setSearches(next);
                }}
              />
              {searches.length > 1 ? (
                <button
                  type="button"
                  className="text-sm text-[var(--color-blue)]/50"
                  onClick={() =>
                    setSearches((prev) => prev.filter((s) => s.id !== row.id))
                  }
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            className="h-8 w-8 rounded border border-[var(--color-blue)]/25 text-sm font-bold"
            onClick={() =>
              setSearches((prev) => [
                ...prev,
                { id: `s${Date.now()}`, field: "Type", value: "" },
              ])
            }
          >
            +
          </button>
          <button
            type="button"
            className="h-8 rounded bg-[var(--color-blue)] px-3 text-sm font-semibold text-white"
            onClick={runFind}
          >
            Find
          </button>
          {initialCompanyId ? (
            <Link
              href="/claims"
              className="text-sm font-semibold text-[var(--color-blue)] underline-offset-2 hover:underline"
            >
              Clear company filter
            </Link>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-[var(--color-table-line)]/20 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-table-line)]/30 bg-[#fafafa] text-[var(--color-table-line)]">
              <th className="px-2 py-2">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) pageRows.forEach((r) => next.add(r.id));
                    else pageRows.forEach((r) => next.delete(r.id));
                    setSelected(next);
                  }}
                  aria-label="Select all"
                />
              </th>
              <th className="w-10 px-2 py-2" />
              {(
                [
                  ["type", "Type"],
                  ["topic", "Topic"],
                  ["loadNo", "Load No"],
                  ["companyName", "Company"],
                  ["createdBy", "Created By"],
                  ["createdAt", "Created"],
                  ["modifiedBy", "Last Modified By"],
                  ["modifiedAt", "Modified"],
                ] as const
              ).map(([key, label]) => (
                <th key={key} className="px-3 py-2">
                  <button type="button" onClick={() => toggleSort(key)}>
                    {label}
                    {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const moreItems = [
                {
                  label: "Delete",
                  run: () => {
                    void (async () => {
                      const ok = window.confirm(
                        "The selected Claim will be permanently deleted. Do you wish to continue?"
                      );
                      if (!ok) return;
                      await deleteAction(row.id);
                      router.refresh();
                    })();
                  },
                },
                {
                  label: "Edit",
                  run: () => setModal(row),
                },
              ].sort((a, b) => a.label.localeCompare(b.label));

              return (
                <Fragment key={row.id}>
                  <tr className="border-b border-[var(--color-table-line)]/15 hover:bg-[var(--color-blue)]/5">
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={(e) => {
                          const next = new Set(selected);
                          if (e.target.checked) next.add(row.id);
                          else next.delete(row.id);
                          setSelected(next);
                        }}
                      />
                    </td>
                    <td className="relative px-2 py-2">
                      <button
                        type="button"
                        title="More Options"
                        className="rounded px-2 hover:bg-black/5"
                        onClick={() =>
                          setOpenMenu((id) => (id === row.id ? null : row.id))
                        }
                      >
                        ⋯
                      </button>
                      {openMenu === row.id ? (
                        <div className="absolute left-0 z-30 mt-1 min-w-[140px] rounded border bg-white py-1 shadow-sm">
                          {moreItems.map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              className="block w-full px-3 py-1.5 text-left hover:bg-black/5"
                              onClick={() => {
                                setOpenMenu(null);
                                item.run();
                              }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 font-semibold">{row.type}</td>
                    <td className="px-3 py-2">{row.topic}</td>
                    <td className="px-3 py-2">{row.loadNo || "—"}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={companyDetailHref(
                          row.companyStatus,
                          row.companyId
                        )}
                        className="font-semibold text-[var(--color-blue)] underline-offset-2 hover:underline"
                      >
                        {row.companyName}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{row.createdBy}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatLogDateTime(row.createdAt)}
                    </td>
                    <td className="px-3 py-2">{row.modifiedBy}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatLogDateTime(row.modifiedAt)}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
            {Array.from({
              length: Math.max(0, pageSize - pageRows.length),
            }).map((_, i) => (
              <tr
                key={`blank-${i}`}
                className="border-b border-[var(--color-table-line)]/15"
                aria-hidden
              >
                <td className="px-2 py-2">
                  <span className="inline-block h-4 w-4" />
                </td>
                <td className="px-2 py-2" />
                <td className="px-3 py-2">&nbsp;</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-[var(--color-table-line)]">
          {sorted.length} claim(s){pending ? " · updating…" : ""}
        </p>
        <div className="flex items-center gap-2">
          <label>
            Items Per Page{" "}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded border px-2 py-1"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <span>
            Page {pageSafe} of {pageCount}
          </span>
          <button
            type="button"
            className="rounded border px-2 py-1"
            disabled={pageSafe <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1"
            disabled={pageSafe >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            ›
          </button>
        </div>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded border border-[var(--color-blue)]/30 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2
                className="text-sm font-bold text-[var(--color-blue)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {modal === "add" ? "Add Claim" : "Edit Claim"}
              </h2>
              <button type="button" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <p className="mb-3 text-xs text-[var(--color-table-line)]">
              Add/Edit form fields are not in the Library — PoC uses Type, Topic,
              and Load No from the Client First Draft table.
            </p>
            <form
              className="space-y-3"
              action={async (fd) => {
                await saveModal(fd);
              }}
            >
              <label className="block text-sm">
                <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                  Company
                </span>
                <select
                  name="companyId"
                  required
                  className="w-full rounded border border-[var(--color-blue)]/25 px-2 py-1.5 text-sm"
                  defaultValue={
                    modal === "add"
                      ? initialCompanyId || ""
                      : modal.companyId
                  }
                >
                  <option value=""></option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                  Type
                </span>
                <select
                  name="type"
                  required
                  className="w-full rounded border border-[var(--color-blue)]/25 px-2 py-1.5 text-sm"
                  defaultValue={modal === "add" ? "" : modal.type}
                >
                  <option value=""></option>
                  {CLAIM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                  Topic
                </span>
                <select
                  name="topic"
                  required
                  className="w-full rounded border border-[var(--color-blue)]/25 px-2 py-1.5 text-sm"
                  defaultValue={modal === "add" ? "" : modal.topic}
                >
                  <option value=""></option>
                  {CLAIM_TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                  Load No
                </span>
                <input
                  name="loadNo"
                  defaultValue={modal === "add" ? "" : modal.loadNo}
                  className="w-full rounded border border-[var(--color-blue)]/25 px-2 py-1.5 text-sm uppercase"
                  onBlur={(e) => {
                    e.currentTarget.value = toAllCaps(e.currentTarget.value);
                  }}
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="h-9 rounded border px-3 text-sm"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 rounded bg-[var(--color-gold)] px-3 text-sm font-bold text-[var(--color-blue)]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
