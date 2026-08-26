"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ContactListRow } from "@/data/contacts";
import { companyDetailHref } from "@/domain/status";
import { formatPhoneUs, toAllCaps } from "@/domain/formatting";
import { MultiCheckDropdown } from "@/components/leads/MultiCheckDropdown";
import { NewEmailModal } from "@/components/shell/NewEmailModal";
import { AttachmentsPanel } from "@/components/lead-detail/AttachmentsPanel";

type SearchRow = {
  id: string;
  field: string;
  value: string;
};

type CompanyOption = { id: string; companyName: string; status: string };

type Props = {
  initialRows: ContactListRow[];
  owners: string[];
  companies: CompanyOption[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (contactId: string, formData: FormData) => Promise<void>;
  deleteAction: (contactId: string) => Promise<void>;
  massDeleteAction: (ids: string[]) => Promise<void>;
  importCsvAction: (formData: FormData) => Promise<{ created: number }>;
  uploadAttachmentAction: (
    companyId: string,
    formData: FormData
  ) => Promise<void>;
};

const SEARCH_BY = [
  "Name",
  "Company",
  "Email",
  "Phone",
  "Mobile",
  "Owner",
  "Title",
].sort((a, b) => a.localeCompare(b));

const PAGE_SIZES = [10, 25, 50, 100];

export function ContactsBoard({
  initialRows,
  owners,
  companies,
  createAction,
  updateAction,
  deleteAction,
  massDeleteAction,
  importCsvAction,
  uploadAttachmentAction,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [ownerFilter, setOwnerFilter] = useState<string[]>([]);
  const [searches, setSearches] = useState<SearchRow[]>([
    { id: "s1", field: "Name", value: "" },
  ]);
  const [applied, setApplied] = useState({
    owners: [] as string[],
    searches: [{ id: "s1", field: "Name", value: "" }] as SearchRow[],
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [attachFor, setAttachFor] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState<{
    to?: string;
    bcc?: string;
    subject?: string;
  } | null>(null);
  const [modal, setModal] = useState<"add" | ContactListRow | null>(null);

  const filtered = useMemo(() => {
    return initialRows.filter((row) => {
      if (
        applied.owners.length &&
        !applied.owners.includes(row.contactOwner)
      ) {
        return false;
      }
      for (const s of applied.searches) {
        if (!s.field || !s.value.trim()) continue;
        const v = s.value.trim().toUpperCase();
        switch (s.field) {
          case "Name":
            if (!row.name.toUpperCase().includes(v)) return false;
            break;
          case "Company":
            if (!row.companyName.toUpperCase().includes(v)) return false;
            break;
          case "Email":
            if (!row.email.toUpperCase().includes(v)) return false;
            break;
          case "Phone":
            if (!row.phone.toUpperCase().includes(v)) return false;
            break;
          case "Mobile":
            if (!row.mobile.toUpperCase().includes(v)) return false;
            break;
          case "Owner":
            if (!row.contactOwner.toUpperCase().includes(v)) return false;
            break;
          case "Title":
            if (!row.title.toUpperCase().includes(v)) return false;
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
      owners: [...ownerFilter],
      searches: searches.map((s) => ({ ...s })),
    });
    setPage(1);
    setSelected(new Set());
  }

  function requireSelection(): string[] | null {
    if (selected.size === 0) {
      window.alert("Please select Contact(s) to continue");
      return null;
    }
    return [...selected];
  }

  function exportSelected() {
    const ids = requireSelection();
    if (!ids) return;
    const rows = sorted.filter((r) => ids.includes(r.id));
    const headers = [
      "Name",
      "Company",
      "Primary Contact",
      "Email",
      "Phone",
      "Mobile",
      "Owner",
      "Title",
    ];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.name,
          r.companyName,
          r.isPrimary ? "Y" : "",
          r.email,
          r.phone,
          r.mobile,
          r.contactOwner,
          r.title,
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
    a.download = "contacts-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveModal(fd: FormData) {
    if (modal === "add") await createAction(fd);
    else if (modal && typeof modal === "object") await updateAction(modal.id, fd);
    setModal(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-blue)]">
            Contacts
          </h1>
          <p className="text-sm text-[var(--color-table-line)]">
            People linked to Leads, Prospects, and Clients
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            title="Add new Contact"
            className="inline-flex h-9 items-center rounded bg-[var(--color-blue)] px-4 font-[family-name:var(--font-heading)] text-sm font-semibold text-white"
            onClick={() => setModal("add")}
          >
            Add Contact
          </button>
          <button
            type="button"
            title="Upload Contacts from CSV"
            className="inline-flex h-9 items-center rounded border border-[var(--color-blue)]/25 bg-white px-4 text-sm text-[var(--color-blue)]"
            onClick={() => setImportOpen(true)}
          >
            Import Contacts
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
                  "The selected Contacts will be permanently deleted. Do you wish to continue?"
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
              if (action === "Mass Email") {
                const bcc = initialRows
                  .filter((r) => ids.includes(r.id) && r.email)
                  .map((r) => r.email)
                  .join("; ");
                setEmailOpen({ bcc, subject: "DALKO MyCRM" });
              }
            }}
          >
            <option value="">Actions</option>
            <option value="Export">Export</option>
            <option value="Mass Delete">Mass Delete</option>
            <option value="Mass Email">Mass Email</option>
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
          <MultiCheckDropdown
            label="Contact Owner"
            options={owners}
            value={ownerFilter}
            onChange={setOwnerFilter}
          />
          <span className="hidden h-5 w-px bg-[var(--color-blue)]/15 sm:block" />
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
                className="h-8 w-[9.5rem] shrink-0 rounded border border-[var(--color-blue)]/25 bg-white px-2 text-sm text-[var(--color-blue)]"
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
                { id: `s${Date.now()}`, field: "Name", value: "" },
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

      {attachFor ? (
        <div className="rounded border border-[var(--color-blue)]/20 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--color-blue)]">
              Add Attachment
            </h2>
            <button type="button" className="text-sm" onClick={() => setAttachFor(null)}>
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
              <th className="w-10 px-2 py-2" />
              {(
                [
                  ["name", "Name"],
                  ["companyName", "Company"],
                  ["isPrimary", "Primary Contact"],
                  ["email", "Email"],
                  ["phone", "Phone"],
                  ["mobile", "Mobile"],
                  ["contactOwner", "Owner"],
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
              const isOpen = expanded.has(row.id);
              const companyHref = companyDetailHref(
                row.companyStatus,
                row.companyId
              );
              const moreItems: Array<{ label: string; run: () => void }> = [
                {
                  label: "Add Campaign",
                  run: () => router.push("/campaigns"),
                },
                {
                  label: "Add Document",
                  run: () => setAttachFor(row.companyId),
                },
                {
                  label: "Delete",
                  run: () => {
                    void (async () => {
                      const ok = window.confirm(
                        "The selected Contact(s) will be permanently deleted. Do you wish to continue?"
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
                      to: row.email || "",
                      subject: row.companyName,
                    }),
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
                        <div className="absolute left-0 z-30 mt-1 min-w-[180px] rounded border border-[var(--color-table-line)]/30 bg-white py-1 text-left shadow-sm">
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
                            if (next.has(row.id)) next.delete(row.id);
                            else next.add(row.id);
                            return next;
                          });
                        }}
                      >
                        {row.name}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={companyHref}
                        className="font-semibold text-[var(--color-blue)] underline-offset-2 hover:underline"
                      >
                        {row.companyName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.isPrimary ? "✓" : ""}
                    </td>
                    <td className="px-3 py-2 normal-case">{row.email}</td>
                    <td className="px-3 py-2">{row.phone}</td>
                    <td className="px-3 py-2">{row.mobile}</td>
                    <td className="px-3 py-2">{row.contactOwner}</td>
                  </tr>
                  {isOpen ? (
                    <tr className="border-b border-[var(--color-table-line)]/15 bg-[#f7f8fb]">
                      <td colSpan={9} className="px-6 py-3 text-sm">
                        <div className="grid gap-2 md:grid-cols-4">
                          <div>
                            <span className="text-[var(--color-table-line)]">
                              Title:{" "}
                            </span>
                            {row.title || "—"}
                          </div>
                          <div>
                            <span className="text-[var(--color-table-line)]">
                              Department:{" "}
                            </span>
                            —
                          </div>
                          <div>
                            <span className="text-[var(--color-table-line)]">
                              Salesperson:{" "}
                            </span>
                            {row.salesperson || "—"}
                          </div>
                          <div>
                            <span className="text-[var(--color-table-line)]">
                              Last Contact:{" "}
                            </span>
                            {row.lastContact || "—"}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="mt-2 text-xs font-semibold text-[var(--color-blue)]"
                          onClick={() => setModal(row)}
                        >
                          Edit/View Contact →
                        </button>
                      </td>
                    </tr>
                  ) : null}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-[var(--color-table-line)]">
          {sorted.length} contact(s){pending ? " · updating…" : ""}
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

      {modal ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded border border-[var(--color-blue)]/30 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2
                className="text-sm font-bold text-[var(--color-blue)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {modal === "add" ? "New Contact" : "Edit/View Contact"}
              </h2>
              <button type="button" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
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
                  defaultValue={modal === "add" ? "" : modal.companyId}
                >
                  <option value=""></option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </label>
              {(
                [
                  ["name", "Name", modal === "add" ? "" : modal.name, true],
                  ["title", "Title", modal === "add" ? "" : modal.title, false],
                  [
                    "email",
                    "Primary Email",
                    modal === "add" ? "" : modal.email,
                    false,
                  ],
                  [
                    "phone",
                    "Office Phone",
                    modal === "add" ? "" : modal.phone,
                    false,
                  ],
                  [
                    "mobile",
                    "Mobile",
                    modal === "add" ? "" : modal.mobile,
                    false,
                  ],
                  [
                    "contactOwner",
                    "Contact Owner",
                    modal === "add" ? "" : modal.contactOwner,
                    false,
                  ],
                ] as const
              ).map(([name, label, value, required]) => (
                <label key={name} className="block text-sm">
                  <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                    {label}
                  </span>
                  <input
                    name={name}
                    required={required}
                    defaultValue={value}
                    className={`w-full rounded border border-[var(--color-blue)]/25 px-2 py-1.5 text-sm ${
                      name === "email" ? "normal-case" : "uppercase"
                    }`}
                    onBlur={(e) => {
                      if (name === "email") return;
                      if (name === "phone" || name === "mobile") {
                        e.currentTarget.value = formatPhoneUs(
                          e.currentTarget.value
                        );
                      } else {
                        e.currentTarget.value = toAllCaps(e.currentTarget.value);
                      }
                    }}
                  />
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm text-[var(--color-blue)]">
                <input
                  type="checkbox"
                  name="isPrimary"
                  defaultChecked={modal === "add" ? false : modal.isPrimary}
                />
                Primary Contact
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

      {importOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded border border-[var(--color-blue)]/30 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2
                className="text-sm font-bold text-[var(--color-blue)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Import Contacts
              </h2>
              <button type="button" onClick={() => setImportOpen(false)}>
                ×
              </button>
            </div>
            <p className="mb-3 text-xs text-[var(--color-table-line)]">
              CSV headers: Name, Company, Email, Phone, Mobile, Owner, Title,
              Primary Contact. Company must match an existing company name.
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
                    setMessage(`Imported ${result.created} contact(s).`);
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
