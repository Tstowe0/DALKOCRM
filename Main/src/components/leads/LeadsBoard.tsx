"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeadListRow } from "@/data/companies";
import {
  LEAD_STATUSES,
  PROSPECT_STATUSES,
  TMS_STATUSES,
  normalizeTmsStatus,
} from "@/domain/status";
import {
  CLIENT_SEARCH_BY_OPTIONS,
  CLIENT_TYPES,
  LEAD_SOURCES,
  PROSPECT_SEARCH_BY_OPTIONS,
  SALES_TERRITORIES,
  SEARCH_BY_OPTIONS,
  normalizeDateInput,
} from "@/domain/formatting";
import { AttachmentsPanel } from "@/components/lead-detail/AttachmentsPanel";
import { MultiCheckDropdown } from "@/components/leads/MultiCheckDropdown";
import { NewEmailModal } from "@/components/shell/NewEmailModal";

type SearchRow = {
  id: string;
  field: string;
  value: string;
  valueTo?: string;
};

export type CompaniesBoardVariant = "lead" | "prospect" | "client";

type Props = {
  variant?: CompaniesBoardVariant;
  initialRows: LeadListRow[];
  salespeople: string[];
  importCsvAction: (formData: FormData) => Promise<{ created: number }>;
  uploadAttachmentAction: (
    companyId: string,
    formData: FormData
  ) => Promise<void>;
  convertToProspectAction?: (id: string) => Promise<void>;
  convertToClientAction?: (id: string) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  massDeleteAction: (ids: string[]) => Promise<void>;
  massConvertAction?: (ids: string[]) => Promise<void>;
};

const PAGE_SIZES = [10, 25, 50, 100];

export function LeadsBoard({
  variant = "lead",
  initialRows,
  salespeople,
  importCsvAction,
  uploadAttachmentAction,
  convertToProspectAction,
  convertToClientAction,
  deleteAction,
  massDeleteAction,
  massConvertAction,
}: Props) {
  const isProspect = variant === "prospect";
  const isClient = variant === "client";
  const entity = isClient ? "Client" : isProspect ? "Prospect" : "Lead";
  const plural = isClient ? "Clients" : isProspect ? "Prospects" : "Leads";
  const basePath = isClient ? "/clients" : isProspect ? "/prospects" : "/leads";
  const statuses = isClient
    ? [...TMS_STATUSES]
    : isProspect
      ? [...PROSPECT_STATUSES]
      : [...LEAD_STATUSES];
  const searchByOptions = isClient
    ? CLIENT_SEARCH_BY_OPTIONS
    : isProspect
      ? PROSPECT_SEARCH_BY_OPTIONS
      : SEARCH_BY_OPTIONS;
  const showSourceColumn = !isClient;
  const showMassConvert = Boolean(massConvertAction);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [salespersonFilter, setSalespersonFilter] = useState<string[]>([]);
  const [searches, setSearches] = useState<SearchRow[]>([
    { id: "s1", field: "Company Name", value: "" },
  ]);
  const [applied, setApplied] = useState({
    statuses: [] as string[],
    salespeople: [] as string[],
    searches: [{ id: "s1", field: "Company Name", value: "" }] as SearchRow[],
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>("companyName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [attachFor, setAttachFor] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [emailOpen, setEmailOpen] = useState<{
    to?: string;
    bcc?: string;
    subject?: string;
  } | null>(null);

  const filtered = useMemo(() => {
    return initialRows.filter((row) => {
      if (applied.statuses.length) {
        if (isClient) {
          if (!applied.statuses.includes(normalizeTmsStatus(row.tmsStatus))) {
            return false;
          }
        } else if (!applied.statuses.includes(row.status)) {
          return false;
        }
      }
      if (
        applied.salespeople.length &&
        !applied.salespeople.includes(row.salesperson)
      ) {
        return false;
      }
      for (const s of applied.searches) {
        if (!s.field) continue;
        if (s.field === "Created Date") {
          if (!s.value && !s.valueTo) continue;
        } else if (!s.value.trim()) {
          continue;
        }
        const v = s.value.trim().toUpperCase();
        switch (s.field) {
          case "Company Name":
            if (!row.companyName.toUpperCase().includes(v)) return false;
            break;
          case "Source":
          case "Prospect Source":
          case "Client Source":
            if (row.leadSource.toUpperCase() !== v && !row.leadSource.toUpperCase().includes(v))
              return false;
            break;
          case "Client Type":
            if (row.clientType.toUpperCase() !== v) return false;
            break;
          case "Industry":
            if (!row.industry.some((i) => i.toUpperCase().includes(v)))
              return false;
            break;
          case "Sales Territory":
            if (
              row.salesTerritory.toUpperCase() !== v &&
              !row.salesTerritory.toUpperCase().includes(v)
            )
              return false;
            break;
          case "Office":
            if (!row.office.toUpperCase().includes(v)) return false;
            break;
          case "Country":
            if (
              !row.mailingCountry.toUpperCase().includes(v) &&
              !row.physicalCountry.toUpperCase().includes(v)
            )
              return false;
            break;
          case "State":
            if (
              !row.mailingState.toUpperCase().includes(v) &&
              !row.physicalState.toUpperCase().includes(v)
            )
              return false;
            break;
          case "City":
            if (
              !row.mailingCity.toUpperCase().includes(v) &&
              !row.physicalCity.toUpperCase().includes(v)
            )
              return false;
            break;
          case "Postal":
            if (
              !row.mailingPostal.toUpperCase().includes(v) &&
              !row.physicalPostal.toUpperCase().includes(v)
            )
              return false;
            break;
          case "Contact Name":
            if (!row.primaryContactName.toUpperCase().includes(v)) return false;
            break;
          case "Contact Email":
            if (!row.primaryEmail.toUpperCase().includes(v)) return false;
            break;
          case "Contact Phone No":
            if (!row.primaryPhone.toUpperCase().includes(v)) return false;
            break;
          case "Created Date": {
            const t = new Date(row.createdAt).getTime();
            if (s.value) {
              const [mm, dd, yyyy] = normalizeDateInput(s.value).split("/");
              const from = new Date(`${yyyy}-${mm}-${dd}T00:00:00`).getTime();
              if (t < from) return false;
            }
            if (s.valueTo) {
              const [mm, dd, yyyy] = normalizeDateInput(s.valueTo).split("/");
              const to = new Date(`${yyyy}-${mm}-${dd}T23:59:59`).getTime();
              if (t > to) return false;
            }
            break;
          }
          default:
            break;
        }
      }
      return true;
    });
  }, [initialRows, applied, isClient]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av = String((a as Record<string, unknown>)[sortKey] ?? "");
      let bv = String((b as Record<string, unknown>)[sortKey] ?? "");
      if (isClient && sortKey === "status") {
        av = normalizeTmsStatus(a.tmsStatus);
        bv = normalizeTmsStatus(b.tmsStatus);
      }
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir, isClient]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(page, pageCount);
  const pageRows = sorted.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function runFind() {
    const missing = searches.some((s) => {
      if (s.field === "Created Date") return false;
      return s.field && !s.value.trim();
    });
    if (missing) {
      window.alert("Please enter search criteria");
      return;
    }
    setApplied({
      statuses: [...statusFilter],
      salespeople: [...salespersonFilter],
      searches: searches.map((s) => ({ ...s })),
    });
    setPage(1);
    setSelected(new Set());
  }

  function requireSelection(): string[] | null {
    if (selected.size === 0) {
      window.alert(`Please select ${entity}(s) to continue`);
      return null;
    }
    return [...selected];
  }

  function exportSelected() {
    const ids = requireSelection();
    if (!ids) return;
    const rows = sorted.filter((r) => ids.includes(r.id));
    const headers = [
      "Company Name",
      "Status",
      "Sales Territory",
      "Salesperson",
      "Office",
      isClient ? "Client Source" : "Prospect Source",
      "Client Type",
      "Last Contacted",
      "Industry",
      "Annual Revenue",
      "Website",
      "Primary Contact",
      "Primary Email",
      "Primary Phone",
    ];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.companyName,
          isClient ? normalizeTmsStatus(r.tmsStatus) : r.status,
          r.salesTerritory,
          r.salesperson,
          r.office,
          r.leadSource,
          r.clientType,
          r.lastContact,
          r.industry.join("; "),
          r.annualRevenue ?? "",
          r.website,
          r.primaryContactName,
          r.primaryEmail,
          r.primaryPhone,
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
    a.download = isClient
      ? "clients-export.csv"
      : isProspect
        ? "prospects-export.csv"
        : "leads-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-blue)]">
            {plural}
          </h1>
          <p className="text-sm text-[var(--color-table-line)]">
            {isClient
              ? "Companies with Status Client — list Status is TMS Active / Deactivated"
              : isProspect
                ? "Companies with Status Present, Proposal, Pursuit, Negotiate, or On Board"
                : "Companies with Status New Lead, Contact, or Qualify"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`${basePath}/new`}
            title={`Add new ${entity}`}
            className="inline-flex h-9 items-center rounded bg-[var(--color-blue)] px-4 font-[family-name:var(--font-heading)] text-sm font-semibold text-white"
          >
            Add {entity}
          </Link>
          <button
            type="button"
            title={`Upload ${plural} from CSV`}
            className="inline-flex h-9 items-center rounded border border-[var(--color-blue)]/25 bg-white px-4 text-sm text-[var(--color-blue)]"
            onClick={() => setImportOpen(true)}
          >
            Import {plural}
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
                  `The selected ${plural} will be permanently deleted. Do you wish to continue?`
                );
                if (!ok) return;
                startTransition(async () => {
                  try {
                    await massDeleteAction(ids);
                    setSelected(new Set());
                    router.refresh();
                  } catch (err) {
                    window.alert(
                      err instanceof Error ? err.message : "Delete failed"
                    );
                  }
                });
              }
              if (action === "Mass Convert") {
                if (!massConvertAction) return;
                const ok = window.confirm(
                  `The selected ${plural} will be converted to Clients. Do you wish to continue?`
                );
                if (!ok) return;
                startTransition(async () => {
                  await massConvertAction(ids);
                  setSelected(new Set());
                  router.refresh();
                });
              }
              if (action === "Mass Email") {
                const bcc = initialRows
                  .filter((r) => ids.includes(r.id) && r.primaryEmail)
                  .map((r) => r.primaryEmail)
                  .join("; ");
                setEmailOpen({
                  bcc,
                  subject: "DALKO MyCRM",
                });
              }
            }}
          >
            <option value="">Actions</option>
            <option value="Export">Export</option>
            {showMassConvert ? (
              <option value="Mass Convert">Mass Convert</option>
            ) : null}
            <option value="Mass Delete">Mass Delete</option>
            <option value="Mass Email">Mass Email</option>
          </select>
        </div>
      </div>

      <div className="rounded border border-[var(--color-blue)]/15 bg-white px-3 py-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <MultiCheckDropdown
            label="Status"
            options={[...statuses]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <MultiCheckDropdown
            label="Salesperson"
            options={salespeople}
            value={salespersonFilter}
            onChange={setSalespersonFilter}
          />

          <span className="hidden h-5 w-px bg-[var(--color-blue)]/15 sm:block" />

          {searches.map((row, idx) => (
            <div
              key={row.id}
              className="flex min-w-0 flex-wrap items-center gap-1.5"
            >
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
                className="h-8 w-[9.5rem] shrink-0 rounded border border-[var(--color-blue)]/25 bg-white px-2 text-sm text-[var(--color-blue)]"
                value={row.field}
                onChange={(e) => {
                  const next = [...searches];
                  next[idx] = { ...row, field: e.target.value, value: "" };
                  setSearches(next);
                }}
              >
                {searchByOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              {row.field === "Source" ||
              row.field === "Prospect Source" ||
              row.field === "Client Source" ? (
                <select
                  className="h-8 w-44 rounded border border-[var(--color-blue)]/25 px-2 text-sm"
                  value={row.value}
                  onChange={(e) => {
                    const next = [...searches];
                    next[idx] = { ...row, value: e.target.value };
                    setSearches(next);
                  }}
                >
                  <option value=""></option>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : row.field === "Client Type" ? (
                <select
                  className="h-8 w-36 rounded border border-[var(--color-blue)]/25 px-2 text-sm"
                  value={row.value}
                  onChange={(e) => {
                    const next = [...searches];
                    next[idx] = { ...row, value: e.target.value };
                    setSearches(next);
                  }}
                >
                  <option value=""></option>
                  {CLIENT_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : row.field === "Sales Territory" ? (
                <select
                  className="h-8 w-36 rounded border border-[var(--color-blue)]/25 px-2 text-sm"
                  value={row.value}
                  onChange={(e) => {
                    const next = [...searches];
                    next[idx] = { ...row, value: e.target.value };
                    setSearches(next);
                  }}
                >
                  <option value=""></option>
                  {SALES_TERRITORIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : row.field === "Created Date" ? (
                <div className="flex gap-1.5">
                  <input
                    placeholder="From"
                    className="h-8 w-28 rounded border border-[var(--color-blue)]/25 px-2 text-sm"
                    value={row.value}
                    onChange={(e) => {
                      const next = [...searches];
                      next[idx] = { ...row, value: e.target.value };
                      setSearches(next);
                    }}
                    onBlur={(e) => {
                      const next = [...searches];
                      next[idx] = {
                        ...row,
                        value: normalizeDateInput(e.target.value),
                      };
                      setSearches(next);
                    }}
                  />
                  <input
                    placeholder="To"
                    className="h-8 w-28 rounded border border-[var(--color-blue)]/25 px-2 text-sm"
                    value={row.valueTo ?? ""}
                    onChange={(e) => {
                      const next = [...searches];
                      next[idx] = { ...row, valueTo: e.target.value };
                      setSearches(next);
                    }}
                    onBlur={(e) => {
                      const next = [...searches];
                      next[idx] = {
                        ...row,
                        valueTo: normalizeDateInput(e.target.value),
                      };
                      setSearches(next);
                    }}
                  />
                </div>
              ) : (
                <input
                  className="h-8 w-44 rounded border border-[var(--color-blue)]/25 px-2 text-sm uppercase"
                  value={row.value}
                  onChange={(e) => {
                    const next = [...searches];
                    next[idx] = { ...row, value: e.target.value };
                    setSearches(next);
                  }}
                />
              )}

              <button
                type="button"
                title="Remove search option"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[var(--color-blue)]/15 text-sm text-[var(--color-danger)] disabled:opacity-30"
                onClick={() =>
                  setSearches((rows) => rows.filter((r) => r.id !== row.id))
                }
                disabled={searches.length === 1}
              >
                ×
              </button>
            </div>
          ))}

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              className="h-8 rounded border border-[var(--color-blue)]/25 bg-white px-2.5 text-sm text-[var(--color-blue)]"
              onClick={() =>
                setSearches((rows) => [
                  ...rows,
                  {
                    id: `s${Date.now()}`,
                    field: "Company Name",
                    value: "",
                  },
                ])
              }
            >
              Add Search by
            </button>
            <button
              type="button"
              onClick={runFind}
              className="h-8 rounded bg-[var(--color-gold)] px-4 font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-blue)]"
            >
              Find
            </button>
          </div>
        </div>
      </div>

      {message ? (
        <p className="text-xs italic text-[var(--color-blue)]">{message}</p>
      ) : null}

      {attachFor ? (
        <div className="rounded border border-[var(--color-blue)] bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-[var(--color-blue)]">
              Upload Attachment
            </h2>
            <button
              type="button"
              className="text-sm"
              onClick={() => setAttachFor(null)}
            >
              Close
            </button>
          </div>
          <AttachmentsPanel
            uploadOnly
            attachments={[]}
            onUpload={async (fd) => {
              await uploadAttachmentAction(attachFor, fd);
              setAttachFor(null);
              setMessage("Attachment saved.");
              router.refresh();
            }}
            onRename={async () => {}}
            onDelete={async () => {}}
          />
        </div>
      ) : null}

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
              <th className="w-10 px-2 py-2"></th>
              {(
                (
                  [
                    ["companyName", "Company"],
                    ["status", "Status"],
                    ["primaryContactName", "Primary Contact"],
                    ["primaryEmail", "Primary Email"],
                    ["primaryPhone", "Primary Phone"],
                    ...(showSourceColumn
                      ? ([["leadSource", "Source"]] as const)
                      : []),
                    ["salesperson", "Salesperson"],
                  ] as Array<readonly [string, string]>
                )
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
            {pageRows.map((lead) => {
                const isOpen = expanded.has(lead.id);
                const statusDisplay = isClient
                  ? normalizeTmsStatus(lead.tmsStatus)
                  : lead.status;
                const moreItems: Array<{ label: string; run: () => void }> = [
                  {
                    label: "Add Attachment",
                    run: () => setAttachFor(lead.id),
                  },
                  {
                    label: "Add Campaign",
                    run: () => router.push("/campaigns"),
                  },
                  {
                    label: "Add Contact",
                    run: () => router.push(`${basePath}/${lead.id}`),
                  },
                  ...(convertToClientAction
                    ? [
                        {
                          label: "Convert to Client",
                          run: () =>
                            startTransition(async () => {
                              await convertToClientAction(lead.id);
                              router.refresh();
                            }),
                        },
                      ]
                    : []),
                  ...(convertToProspectAction
                    ? [
                        {
                          label: "Convert to Prospect",
                          run: () =>
                            startTransition(async () => {
                              await convertToProspectAction(lead.id);
                              router.refresh();
                            }),
                        },
                      ]
                    : []),
                  {
                    label: "Delete",
                    run: () => {
                      void (async () => {
                        try {
                          const ok = window.confirm(
                            `The selected ${entity}(s) will be permanently deleted. Do you wish to continue?`
                          );
                          if (!ok) return;
                          await deleteAction(lead.id);
                          router.refresh();
                        } catch (err) {
                          window.alert(
                            err instanceof Error
                              ? err.message
                              : "Delete failed"
                          );
                        }
                      })();
                    },
                  },
                  {
                    label: "Schedule Activity",
                    run: () =>
                      setMessage(
                        "Schedule Activity — reserved until Activities section is built."
                      ),
                  },
                  {
                    label: "Send Email",
                    run: () =>
                      setEmailOpen({
                        to: lead.primaryEmail || "",
                        subject: lead.companyName,
                      }),
                  },
                ].sort((a, b) => a.label.localeCompare(b.label));

                return (
                  <Fragment key={lead.id}>
                    <tr className="border-b border-[var(--color-table-line)]/15 hover:bg-[var(--color-blue)]/5">
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(lead.id)}
                          onChange={(e) => {
                            const next = new Set(selected);
                            if (e.target.checked) next.add(lead.id);
                            else next.delete(lead.id);
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
                            setOpenMenu((id) =>
                              id === lead.id ? null : lead.id
                            )
                          }
                        >
                          ⋯
                        </button>
                        {openMenu === lead.id ? (
                          <div className="absolute left-0 z-30 mt-1 min-w-[180px] rounded border border-[var(--color-table-line)]/30 bg-white py-1 text-left shadow-sm">
                            <Link
                              href={`${basePath}/${lead.id}`}
                              className="block px-3 py-1.5 hover:bg-black/5"
                              onClick={() => setOpenMenu(null)}
                            >
                              Edit/View
                            </Link>
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
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="font-semibold text-[var(--color-blue)] underline-offset-2 hover:underline"
                          onClick={() => {
                            setExpanded((prev) => {
                              const next = new Set(prev);
                              if (next.has(lead.id)) next.delete(lead.id);
                              else next.add(lead.id);
                              return next;
                            });
                          }}
                        >
                          {lead.companyName}
                        </button>
                      </td>
                      <td className="px-3 py-2">{statusDisplay}</td>
                      <td className="px-3 py-2">{lead.primaryContactName}</td>
                      <td className="px-3 py-2 normal-case">
                        {lead.primaryEmail}
                      </td>
                      <td className="px-3 py-2">{lead.primaryPhone}</td>
                      {showSourceColumn ? (
                        <td className="px-3 py-2">{lead.leadSource}</td>
                      ) : null}
                      <td className="px-3 py-2">{lead.salesperson}</td>
                    </tr>
                    {isOpen ? (
                      <tr className="border-b border-[var(--color-table-line)]/15 bg-[#f7f8fb]">
                        <td
                          colSpan={showSourceColumn ? 9 : 8}
                          className="px-6 py-3 text-sm"
                        >
                          <div className="grid gap-2 md:grid-cols-4">
                            <div>
                              <span className="text-[var(--color-table-line)]">
                                Industry:{" "}
                              </span>
                              {lead.industry.join(", ") || "—"}
                            </div>
                            <div>
                              <span className="text-[var(--color-table-line)]">
                                Website:{" "}
                              </span>
                              <span className="normal-case">
                                {lead.website || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--color-table-line)]">
                                Sales Territory:{" "}
                              </span>
                              {lead.salesTerritory || "—"}
                            </div>
                            <div>
                              <span className="text-[var(--color-table-line)]">
                                Last Contact:{" "}
                              </span>
                              {lead.lastContact || "—"}
                            </div>
                          </div>
                          <Link
                            href={`${basePath}/${lead.id}`}
                            className="mt-2 inline-block text-xs font-semibold text-[var(--color-blue)]"
                          >
                            Open full {entity} →
                          </Link>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            {Array.from({ length: Math.max(0, pageSize - pageRows.length) }).map(
              (_, i) => (
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
                  {showSourceColumn ? <td className="px-3 py-2" /> : null}
                  <td className="px-3 py-2" />
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-[var(--color-table-line)]">
          {sorted.length} {isClient ? "client" : isProspect ? "prospect" : "lead"}
          (s)
          {pending ? " · updating…" : ""}
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
            Page{" "}
            <input
              className="w-12 rounded border px-1 py-0.5 text-center"
              value={pageSafe}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (n >= 1 && n <= pageCount) setPage(n);
              }}
            />{" "}
            of {pageCount}
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

      {importOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded border border-[var(--color-blue)]/30 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2
                className="text-sm font-bold text-[var(--color-blue)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Import {plural}
              </h2>
              <button type="button" onClick={() => setImportOpen(false)}>
                ×
              </button>
            </div>
            <p className="mb-3 text-xs text-[var(--color-table-line)]">
              Upload a CSV with headers matching Export columns (Company Name,
              Status,{" "}
              {isClient
                ? "Client Source"
                : isProspect
                  ? "Prospect Source"
                  : "Source"}
              , etc.). Full legacy Excel import rules from the current CRM are
              not in the Library docs.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                setImportBusy(true);
                startTransition(async () => {
                  try {
                    const result = await importCsvAction(fd);
                    setImportOpen(false);
                    setMessage(
                      `Imported ${result.created} ${
                        isClient
                          ? "client"
                          : isProspect
                            ? "prospect"
                            : "lead"
                      }(s).`
                    );
                    router.refresh();
                  } catch (err) {
                    window.alert(
                      err instanceof Error ? err.message : "Import failed"
                    );
                  } finally {
                    setImportBusy(false);
                  }
                });
              }}
              className="space-y-3"
            >
              <input type="file" name="file" accept=".csv,text/csv" required />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="h-9 rounded border px-3 text-sm"
                  onClick={() => setImportOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importBusy}
                  className="h-9 rounded bg-[var(--color-blue)] px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Import
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {emailOpen ? (
        <NewEmailModal
          key={`${emailOpen.to ?? ""}|${emailOpen.bcc ?? ""}|${emailOpen.subject ?? ""}`}
          open
          to={emailOpen.to}
          bcc={emailOpen.bcc}
          subject={emailOpen.subject}
          onClose={() => setEmailOpen(null)}
        />
      ) : null}
    </div>
  );
}