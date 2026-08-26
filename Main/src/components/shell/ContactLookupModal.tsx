"use client";

import { useMemo, useState } from "react";
import type { Contact } from "@/data/contacts";

const btnGold =
  "h-8 rounded bg-[var(--color-gold)] px-3 font-[family-name:var(--font-heading)] text-xs font-bold text-[var(--color-blue)]";
const btnOutline =
  "h-8 rounded border border-[var(--color-blue)]/25 bg-white px-3 text-xs font-semibold text-[var(--color-blue)]";
const input =
  "w-full rounded border border-[var(--color-blue)]/25 px-2 py-1.5 text-sm outline-none focus:border-[var(--color-blue)]";

type Props = {
  open: boolean;
  contacts: Contact[];
  companyName: string;
  onClose: () => void;
  onSelect: (contact: Contact) => void;
};

/**
 * Contact Lookup — Library: populate Contact Log Contact field from company contacts.
 */
export function ContactLookupModal({
  open,
  contacts,
  companyName,
  onClose,
  onSelect,
}: Props) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toUpperCase();
    if (!needle) return contacts;
    return contacts.filter(
      (c) =>
        c.name.includes(needle) ||
        c.email.toUpperCase().includes(needle) ||
        c.title.includes(needle) ||
        c.phone.includes(needle)
    );
  }, [contacts, q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded border border-[var(--color-blue)]/30 bg-white shadow-xl">
        <div className="flex items-center justify-between bg-[var(--color-blue)] px-4 py-2.5 text-white">
          <h2
            className="text-sm font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Contact Lookup
          </h2>
          <button type="button" className="text-lg leading-none" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="space-y-3 border-b border-[var(--color-blue)]/10 px-4 py-3">
          <p className="text-xs text-[var(--color-blue)]/60">
            Company: <span className="font-semibold">{companyName}</span>
          </p>
          <label className="block text-sm">
            <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
              Search
            </span>
            <input
              className={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, email, title, phone"
              autoFocus
            />
          </label>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-[#f7f8fb]">
              <tr className="border-b border-[var(--color-blue)]/20 text-[11px] uppercase tracking-wide text-[var(--color-blue)]/70">
                <th className="px-4 py-2">Name</th>
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-[var(--color-blue)]/50">
                    No contacts match.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--color-blue)]/10 hover:bg-[var(--color-table-tint)]/40"
                  >
                    <td className="px-4 py-2 font-semibold">{c.name}</td>
                    <td className="px-2 py-2">{c.title || "—"}</td>
                    <td className="px-2 py-2 normal-case">{c.email || "—"}</td>
                    <td className="px-2 py-2">{c.phone || "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        className={btnGold}
                        onClick={() => {
                          onSelect(c);
                          onClose();
                        }}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-[var(--color-blue)]/10 px-4 py-3">
          <button type="button" className={btnOutline} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
