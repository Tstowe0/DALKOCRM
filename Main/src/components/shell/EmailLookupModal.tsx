"use client";

import { useEffect, useMemo, useState } from "react";
import type { ContactListRow } from "@/data/contacts";
import { SALES_TERRITORIES } from "@/domain/formatting";
import {
  POPUP_BTN_CANCEL,
  POPUP_BTN_PRIMARY,
  PopupWindow,
} from "@/components/shell/PopupWindow";

export type EmailLookupCompany = { id: string; companyName: string };

export type EmailLookupTarget = "to" | "cc" | "bcc";

type SearchRow = { id: string; field: string; value: string };

const SEARCH_BY = [
  "Contact Name",
  "Contact Owner",
  "Office",
  "Phone",
  "Sales Territory",
  "Salesperson",
  "Title",
].sort((a, b) => a.localeCompare(b));

const PAGE_SIZES = [10, 25, 50, 100];

type Props = {
  open: boolean;
  target: EmailLookupTarget;
  defaultCompanyId?: string;
  companies: EmailLookupCompany[];
  contacts: ContactListRow[];
  onClose: () => void;
  onAdd: (emails: string[]) => void;
};

/**
 * Email Lookup — Add Lead / Leads written contract.
 * Schema does not have First/Last Name, Department, Reports To, or Contact Source.
 */
export function EmailLookupModal({
  open,
  target,
  defaultCompanyId,
  companies,
  contacts,
  onClose,
  onAdd,
}: Props) {
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? "");
  const [allCompanies, setAllCompanies] = useState(!defaultCompanyId);
  const [searches, setSearches] = useState<SearchRow[]>([
    { id: "s1", field: "Contact Name", value: "" },
  ]);
  const [applied, setApplied] = useState({
    companyId: defaultCompanyId ?? "",
    allCompanies: !defaultCompanyId,
    searches: [{ id: "s1", field: "Contact Name", value: "" }] as SearchRow[],
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<"name" | "companyName" | "title" | "email" | "contactOwner">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCompanyId(defaultCompanyId ?? "");
      setAllCompanies(!defaultCompanyId);
      setApplied({
        companyId: defaultCompanyId ?? "",
        allCompanies: !defaultCompanyId,
        searches: [{ id: "s1", field: "Contact Name", value: "" }],
      });
      setSearches([{ id: "s1", field: "Contact Name", value: "" }]);
      setSelected(new Set());
      setPage(1);
      setError(null);
    }
  }, [open, defaultCompanyId]);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (!applied.allCompanies) {
        if (!applied.companyId) return false;
        if (c.companyId !== applied.companyId) return false;
      }
      for (const s of applied.searches) {
        if (!s.field || !s.value.trim()) continue;
        const v = s.value.trim().toUpperCase();
        switch (s.field) {
          case "Contact Name":
            if (!c.name.includes(v)) return false;
            break;
          case "Title":
            if (!c.title.includes(v)) return false;
            break;
          case "Phone":
            if (!c.phone.includes(v) && !c.mobile.includes(v)) return false;
            break;
          case "Contact Owner":
            if (!c.contactOwner.includes(v)) return false;
            break;
          case "Sales Territory":
            if (!c.salesTerritory.toUpperCase().includes(v)) return false;
            break;
          case "Salesperson":
            if (!c.salesperson.includes(v)) return false;
            break;
          case "Office":
            if (!c.office.includes(v)) return false;
            break;
          default:
            break;
        }
      }
      return Boolean(c.email.trim());
    });
  }, [contacts, applied]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = String(a[sortKey] ?? "").toUpperCase();
      const bv = String(b[sortKey] ?? "").toUpperCase();
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(page, pageCount);
  const pageRows = sorted.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);
  const allFilteredSelected =
    sorted.length > 0 && sorted.every((r) => selected.has(r.id));

  if (!open) return null;

  function find() {
    if (!allCompanies && !companyId) {
      setError("A company or All must be selected");
      return;
    }
    setError(null);
    setApplied({ companyId, allCompanies, searches });
    setPage(1);
  }

  function ok() {
    const emails = contacts
      .filter((c) => selected.has(c.id) && c.email.trim())
      .map((c) => c.email.trim());
    if (!emails.length) {
      setError("Please select a contact email");
      return;
    }
    onAdd(emails);
    onClose();
  }

  const input =
    "h-8 rounded border border-[var(--color-blue)]/25 bg-white px-2 text-sm text-[var(--color-blue)]";

  return (
    <PopupWindow
      title={
        <>
          Email Lookup
          <span className="ml-2 text-xs font-normal opacity-80">
            ({target === "to" ? "To" : target === "cc" ? "Cc" : "Bcc"})
          </span>
        </>
      }
      zClass="z-[120]"
      maxWidthClass="max-w-4xl"
      padded={false}
      onClose={onClose}
      footerClassName="flex flex-wrap items-center justify-between gap-2"
      footer={
        <>
          <div className="flex items-center gap-2 text-xs text-[var(--color-blue)]/70">
            <select
              className={input}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>
              Page {pageSafe} of {pageCount}
            </span>
            <button type="button" disabled={pageSafe <= 1} onClick={() => setPage(1)}>
              |&lt;
            </button>
            <button
              type="button"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              &lt;
            </button>
            <button
              type="button"
              disabled={pageSafe >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              &gt;
            </button>
            <button
              type="button"
              disabled={pageSafe >= pageCount}
              onClick={() => setPage(pageCount)}
            >
              &gt;|
            </button>
          </div>
          <div className="flex gap-2">
            <button type="button" className={POPUP_BTN_CANCEL} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              title="Add email address(s)"
              className={POPUP_BTN_PRIMARY}
              onClick={ok}
            >
              OK
            </button>
          </div>
        </>
      }
    >
      <div className="space-y-3 border-b border-[var(--color-blue)]/10 px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[220px] flex-1 text-sm">
              <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                Company
              </span>
              <select
                className={`${input} w-full disabled:bg-[#f3f3f3]`}
                value={companyId}
                disabled={allCompanies}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <option value=""> </option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pb-1 text-sm text-[var(--color-blue)]">
              <input
                type="checkbox"
                checked={allCompanies}
                onChange={(e) => {
                  setAllCompanies(e.target.checked);
                  if (e.target.checked) setCompanyId("");
                }}
              />
              All
            </label>
          </div>

          {searches.map((row, i) => (
            <div key={row.id} className="flex flex-wrap items-end gap-2">
              <label className="text-sm">
                <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                  Search By
                </span>
                <select
                  className={input}
                  value={row.field}
                  onChange={(e) => {
                    const next = [...searches];
                    next[i] = { ...row, field: e.target.value };
                    setSearches(next);
                  }}
                >
                  {SEARCH_BY.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label className="min-w-[180px] flex-1 text-sm">
                <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                  Search
                </span>
                {row.field === "Sales Territory" ? (
                  <select
                    className={`${input} w-full`}
                    value={row.value}
                    onChange={(e) => {
                      const next = [...searches];
                      next[i] = { ...row, value: e.target.value };
                      setSearches(next);
                    }}
                  >
                    <option value=""> </option>
                    {SALES_TERRITORIES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={`${input} w-full`}
                    value={row.value}
                    onChange={(e) => {
                      const next = [...searches];
                      next[i] = { ...row, value: e.target.value };
                      setSearches(next);
                    }}
                  />
                )}
              </label>
              {searches.length > 1 ? (
                <button
                  type="button"
                  className="mb-0.5 h-8 px-2 text-sm text-[var(--color-blue)]"
                  onClick={() => setSearches(searches.filter((s) => s.id !== row.id))}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="h-8 rounded border border-[var(--color-blue)]/25 px-3 text-xs font-semibold text-[var(--color-blue)]"
              onClick={() =>
                setSearches((rows) => [
                  ...rows,
                  { id: `s${Date.now()}`, field: "Contact Name", value: "" },
                ])
              }
            >
              Add Search By
            </button>
            <button
              type="button"
              className="h-8 rounded bg-[var(--color-blue)] px-3 text-xs font-semibold text-white"
              onClick={find}
            >
              Find
            </button>
          </div>
          {error ? (
            <p className="text-xs italic text-[var(--color-danger)]">{error}</p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-[#f7f8fb]">
              <tr className="border-b border-[var(--color-blue)]/20 text-[11px] uppercase tracking-wide text-[var(--color-blue)]/70">
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelected(new Set(sorted.map((r) => r.id)));
                      } else {
                        setSelected(new Set());
                      }
                    }}
                  />
                </th>
                {(
                  [
                    ["companyName", "Company"],
                    ["name", "Contact Name"],
                    ["title", "Title"],
                    ["email", "Email Address"],
                    ["contactOwner", "Contact Owner"],
                  ] as const
                ).map(([key, label]) => (
                  <th key={key} className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (sortKey === key) {
                          setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                        } else {
                          setSortKey(key);
                          setSortDir("asc");
                        }
                      }}
                    >
                      {label}
                      {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-[var(--color-blue)]/50">
                    No contacts match.
                  </td>
                </tr>
              ) : (
                pageRows.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--color-blue)]/10 hover:bg-[var(--color-table-tint)]/40"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={(e) => {
                          const next = new Set(selected);
                          if (e.target.checked) next.add(c.id);
                          else next.delete(c.id);
                          setSelected(next);
                        }}
                      />
                    </td>
                    <td className="px-2 py-2">{c.companyName}</td>
                    <td className="px-2 py-2 font-semibold">{c.name}</td>
                    <td className="px-2 py-2">{c.title || "—"}</td>
                    <td className="px-2 py-2 normal-case">{c.email}</td>
                    <td className="px-2 py-2">{c.contactOwner || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

    </PopupWindow>
  );
}
