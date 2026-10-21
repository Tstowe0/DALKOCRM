"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CampaignListRow } from "@/data/campaigns";
import { companyDetailHref } from "@/domain/status";
import { toAllCaps } from "@/domain/formatting";
import { MoreMenu } from "@/components/shell/MoreMenu";
import { useDialog } from "@/components/shell/dialogs";
import {
  POPUP_BTN_CANCEL,
  POPUP_BTN_PRIMARY,
  PopupWindow,
} from "@/components/shell/PopupWindow";
import {
  FieldError,
  FieldLabel,
  blockIfMissing,
  inputClass,
} from "@/components/shell/formFields";
import {
  downloadCsvTemplate,
  ImportCsvModal,
} from "@/components/shell/ImportCsvModal";

type SearchRow = {
  id: string;
  field: string;
  value: string;
};

type CompanyOption = { id: string; companyName: string };

type Props = {
  initialRows: CampaignListRow[];
  companies: CompanyOption[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (campaignId: string, formData: FormData) => Promise<void>;
  deleteAction: (campaignId: string) => Promise<void>;
  massDeleteAction: (ids: string[]) => Promise<void>;
  importCsvAction: (formData: FormData) => Promise<{ created: number }>;
};

const SEARCH_BY = ["Campaign Name", "Template Name", "Company"].sort((a, b) =>
  a.localeCompare(b)
);
const PAGE_SIZES = [10, 25, 50, 100];

export function CampaignsBoard({
  initialRows,
  companies,
  createAction,
  updateAction,
  deleteAction,
  massDeleteAction,
  importCsvAction,
}: Props) {
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const [pending, startTransition] = useTransition();
  const [searches, setSearches] = useState<SearchRow[]>([
    { id: "s1", field: "Campaign Name", value: "" },
  ]);
  const [applied, setApplied] = useState({
    searches: [{ id: "s1", field: "Campaign Name", value: "" }] as SearchRow[],
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState("campaignName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<"add" | CampaignListRow | null>(null);
  const [viewOnly, setViewOnly] = useState(false);

  useEffect(() => {
    setFieldErrors({});
  }, [modal]);

  const filtered = useMemo(() => {
    return initialRows.filter((row) => {
      for (const s of applied.searches) {
        if (!s.field || !s.value.trim()) continue;
        const v = s.value.trim().toUpperCase();
        switch (s.field) {
          case "Campaign Name":
            if (!row.campaignName.toUpperCase().includes(v)) return false;
            break;
          case "Template Name":
            if (!row.templateName.toUpperCase().includes(v)) return false;
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
      void alert("Please enter search criteria");
      return;
    }
    setApplied({ searches: searches.map((s) => ({ ...s })) });
    setPage(1);
    setSelected(new Set());
  }

  function requireSelection(): string[] | null {
    if (selected.size === 0) {
      void alert("Please select Campaign(s) to continue");
      return null;
    }
    return [...selected];
  }

  function exportSelected() {
    const ids = requireSelection();
    if (!ids) return;
    const rows = sorted.filter((r) => ids.includes(r.id));
    const headers = ["Campaign Name", "Template Name", "Company"];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [r.campaignName, r.templateName, r.companyName]
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
    a.download = "campaigns-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveModal(fd: FormData) {
    if (modal === "add") await createAction(fd);
    else if (modal && typeof modal === "object")
      await updateAction(modal.id, fd);
    setModal(null);
    setViewOnly(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-blue)]">
            Campaigns
          </h1>
          <p className="text-sm text-[var(--color-table-line)]">
            Outreach campaigns linked to companies (PoC from company Campaigns
            section — no dedicated Library list doc)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            title="Add Campaign"
            className="inline-flex h-9 items-center rounded bg-[var(--color-blue)] px-4 font-[family-name:var(--font-heading)] text-sm font-semibold text-white"
            onClick={() => {
              setViewOnly(false);
              setModal("add");
            }}
          >
            Add Campaign
          </button>
          <button
            type="button"
            title="Upload Campaigns from CSV"
            className="inline-flex h-9 items-center rounded border border-[var(--color-blue)]/25 bg-white px-4 text-sm text-[var(--color-blue)]"
            onClick={() => setImportOpen(true)}
          >
            Import Campaigns
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
                void (async () => {
                  const ok = await confirm(
                    "The selected Campaigns will be permanently deleted. Do you wish to continue?"
                  );
                  if (!ok) return;
                  startTransition(async () => {
                    await massDeleteAction(ids);
                    setSelected(new Set());
                    router.refresh();
                  });
                })();
              }
            }}
          >
            <option value="">Actions</option>
            <option value="Export">Export</option>
            <option value="Mass Delete">Mass Delete</option>
          </select>
        </div>
      </div>

      {message ? (
        <p className="rounded border border-[var(--color-blue)]/20 bg-[var(--color-table-tint)]/50 px-3 py-2 text-sm text-[var(--color-blue)]">
          {message}
        </p>
      ) : null}

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
                className="h-8 w-[10rem] shrink-0 rounded border border-[var(--color-blue)]/25 bg-white px-2 text-sm text-[var(--color-blue)]"
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
                className="h-8 w-44 rounded border border-[var(--color-blue)]/25 px-2 text-sm"
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
                  title="Remove search option"
                  className="text-sm text-[var(--color-blue)]/50 hover:text-[var(--color-blue)]"
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
            title="Add search criteria"
            className="h-8 w-8 rounded border border-[var(--color-blue)]/25 text-sm font-bold text-[var(--color-blue)]"
            onClick={() =>
              setSearches((prev) => [
                ...prev,
                {
                  id: `s${Date.now()}`,
                  field: "Campaign Name",
                  value: "",
                },
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
                  ["campaignName", "Campaign Name"],
                  ["templateName", "Template Name"],
                  ["companyName", "Company"],
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
              const companyHref = companyDetailHref(
                row.companyStatus,
                row.companyId
              );
              const moreItems = [
                {
                  label: "Edit",
                  run: () => {
                    setViewOnly(false);
                    setModal(row);
                  },
                },
                {
                  label: "Remove",
                  run: () => {
                    void (async () => {
                      const ok = await confirm(
                        "The selected Campaign will be permanently deleted. Do you wish to continue?"
                      );
                      if (!ok) return;
                      await deleteAction(row.id);
                      router.refresh();
                    })();
                  },
                },
                {
                  label: "View",
                  run: () => {
                    setViewOnly(true);
                    setModal(row);
                  },
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
                    <td className="px-2 py-2">
                      <MoreMenu
                        title="More Options"
                        items={moreItems.map((item) => ({
                          label: item.label,
                          onClick: item.run,
                          danger: item.label === "Delete",
                        }))}
                      />
                    </td>
                    <td className="px-3 py-2 font-semibold text-[var(--color-blue)]">
                      <button
                        type="button"
                        className="underline-offset-2 hover:underline"
                        onClick={() => {
                          setViewOnly(false);
                          setModal(row);
                        }}
                      >
                        {row.campaignName}
                      </button>
                    </td>
                    <td className="px-3 py-2">{row.templateName || "—"}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={companyHref}
                        className="font-semibold text-[var(--color-blue)] underline-offset-2 hover:underline"
                      >
                        {row.companyName}
                      </Link>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-[var(--color-table-line)]">
          {sorted.length} campaign(s){pending ? " · updating…" : ""}
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
          <button
            type="button"
            className="rounded border px-2 py-1"
            disabled={pageSafe <= 1}
            onClick={() => setPage(1)}
          >
            «
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1"
            disabled={pageSafe <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          <span>
            Page {pageSafe} of {pageCount}
          </span>
          <button
            type="button"
            className="rounded border px-2 py-1"
            disabled={pageSafe >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            ›
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1"
            disabled={pageSafe >= pageCount}
            onClick={() => setPage(pageCount)}
          >
            »
          </button>
        </div>
      </div>

      {modal ? (
        <PopupWindow
          title={
            modal === "add"
              ? "Add Campaign"
              : viewOnly
                ? "View Campaign"
                : "Edit Campaign"
          }
          maxWidthClass="max-w-md"
          onClose={() => {
            setModal(null);
            setViewOnly(false);
          }}
          footer={
            viewOnly && modal !== "add" ? (
              <button
                type="button"
                className={POPUP_BTN_CANCEL}
                onClick={() => {
                  setModal(null);
                  setViewOnly(false);
                }}
              >
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={POPUP_BTN_CANCEL}
                  onClick={() => {
                    setModal(null);
                    setViewOnly(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="campaign-board-form"
                  className={POPUP_BTN_PRIMARY}
                >
                  Save
                </button>
              </>
            )
          }
        >
            {viewOnly && modal !== "add" ? (
              <div className="space-y-2 text-sm text-[var(--color-blue)]">
                <p>
                  <span className="text-[11px] font-semibold uppercase text-[var(--color-blue)]/70">
                    Campaign Name
                  </span>
                  <br />
                  <span className="font-semibold">{modal.campaignName}</span>
                </p>
                <p>
                  <span className="text-[11px] font-semibold uppercase text-[var(--color-blue)]/70">
                    Template Name
                  </span>
                  <br />
                  {modal.templateName || "—"}
                </p>
                <p>
                  <span className="text-[11px] font-semibold uppercase text-[var(--color-blue)]/70">
                    Company
                  </span>
                  <br />
                  {modal.companyName}
                </p>
              </div>
            ) : (
              <form
                id="campaign-board-form"
                className="space-y-3"
                noValidate
                onSubmit={(e) =>
                  blockIfMissing(
                    e,
                    [
                      ["companyId", "Company"],
                      ["campaignName", "Campaign Name"],
                    ],
                    setFieldErrors
                  )
                }
                action={async (fd) => {
                  await saveModal(fd);
                }}
              >
                <label className="block text-sm">
                  <FieldLabel required>Company</FieldLabel>
                  <select
                    name="companyId"
                    className={inputClass(fieldErrors.companyId)}
                    defaultValue={modal === "add" ? "" : modal.companyId}
                  >
                    <option value=""></option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                  <FieldError error={fieldErrors.companyId} />
                </label>
                <label className="block text-sm">
                  <FieldLabel required>Campaign Name</FieldLabel>
                  <input
                    name="campaignName"
                    defaultValue={modal === "add" ? "" : modal.campaignName}
                    className={inputClass(fieldErrors.campaignName, "uppercase")}
                    onBlur={(e) => {
                      e.currentTarget.value = toAllCaps(e.currentTarget.value);
                    }}
                  />
                  <FieldError error={fieldErrors.campaignName} />
                </label>
                <label className="block text-sm">
                  <FieldLabel>Template Name</FieldLabel>
                  <input
                    name="templateName"
                    defaultValue={modal === "add" ? "" : modal.templateName}
                    className={inputClass(undefined, "uppercase")}
                    onBlur={(e) => {
                      e.currentTarget.value = toAllCaps(e.currentTarget.value);
                    }}
                  />
                </label>
              </form>
            )}
        </PopupWindow>
      ) : null}

      <ImportCsvModal
        open={importOpen}
        title="Import Campaigns"
        hint="Download the template, fill in your rows, then upload the CSV. Campaign Name and Company are required. Company must match an existing company name."
        downloadLabel="Download Campaigns template"
        onDownloadTemplate={() =>
          downloadCsvTemplate(
            "mycrm-campaign-import-template.csv",
            ["Campaign Name", "Template Name", "Company"],
            ["Q1 OUTREACH", "INTRO EMAIL", "EXAMPLE LOGISTICS LLC"]
          )
        }
        onClose={() => setImportOpen(false)}
        onImport={async (file) => {
          const fd = new FormData();
          fd.set("file", file);
          const result = await importCsvAction(fd);
          setImportOpen(false);
          setMessage(`Imported ${result.created} campaign(s).`);
          router.refresh();
        }}
      />
    </div>
  );
}
