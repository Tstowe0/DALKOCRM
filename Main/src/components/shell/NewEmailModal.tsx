"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Pre-filled To / Bcc addresses */
  to?: string;
  bcc?: string;
  subject?: string;
  /** Optional attachment file name shown as chip */
  attachmentName?: string;
  /** Called on Send — PoC cannot deliver mail; parent may persist a stub record */
  onSend?: (payload: {
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
  }) => Promise<void> | void;
};

/**
 * New Email window — UI contract from Leads / Add Lead specs.
 * Delivery is environment-blocked (no SMTP); Send confirms compose + closes.
 */
export function NewEmailModal({
  open,
  onClose,
  to = "",
  bcc = "",
  subject = "",
  attachmentName,
  onSend,
}: Props) {
  const [toVal, setTo] = useState(to);
  const [cc, setCc] = useState("");
  const [bccVal, setBcc] = useState(bcc);
  const [subj, setSubj] = useState(subject);
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function send() {
    const next: Record<string, string> = {};
    if (!toVal.trim() && !bccVal.trim()) {
      next.to = "To or Bcc is required";
    }
    if (!subj.trim()) next.subject = "Subject is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await onSend?.({
        to: toVal.trim(),
        cc: cc.trim(),
        bcc: bccVal.trim(),
        subject: subj.trim(),
        body,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded border border-[var(--color-blue)]/25 px-2 py-1.5 text-sm";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded border border-[var(--color-blue)]/30 bg-white shadow-lg">
        <div className="flex items-center justify-between bg-[var(--color-blue)] px-4 py-2 text-white">
          <h2
            className="text-sm font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            New Email
          </h2>
          <button type="button" className="text-lg leading-none" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="space-y-3 overflow-auto p-4">
          <label className="block text-sm">
            <span className="mb-1 flex items-center gap-1 font-medium text-[var(--color-blue)]/80">
              <span className="inline-block h-4 w-1 rounded bg-[var(--color-danger)]" />
              To
            </span>
            <input
              className={`${field} ${errors.to ? "border-[var(--color-danger)]" : ""}`}
              value={toVal}
              onChange={(e) => setTo(e.target.value)}
            />
            {errors.to ? (
              <span className="mt-1 block text-xs italic text-[var(--color-danger)]">
                {errors.to}
              </span>
            ) : null}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--color-blue)]/80">
              Cc
            </span>
            <input className={field} value={cc} onChange={(e) => setCc(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--color-blue)]/80">
              Bcc
            </span>
            <input
              className={field}
              value={bccVal}
              onChange={(e) => setBcc(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 flex items-center gap-1 font-medium text-[var(--color-blue)]/80">
              <span className="inline-block h-4 w-1 rounded bg-[var(--color-danger)]" />
              Subject
            </span>
            <input
              className={`${field} ${errors.subject ? "border-[var(--color-danger)]" : ""}`}
              value={subj}
              onChange={(e) => setSubj(e.target.value)}
            />
            {errors.subject ? (
              <span className="mt-1 block text-xs italic text-[var(--color-danger)]">
                {errors.subject}
              </span>
            ) : null}
          </label>
          {attachmentName ? (
            <div className="rounded border border-[var(--color-gold)]/50 bg-[var(--color-gold)]/15 px-3 py-2 text-xs text-[var(--color-blue)]">
              Attachment: {attachmentName}
            </div>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--color-blue)]/80">
              Message
            </span>
            <textarea
              className={`${field} min-h-[160px]`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--color-blue)]/10 px-4 py-3">
          <button
            type="button"
            className="h-9 rounded border border-[var(--color-blue)]/25 px-4 text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            className="h-9 rounded bg-[var(--color-blue)] px-4 text-sm font-semibold text-white disabled:opacity-50"
            style={{ fontFamily: "var(--font-heading)" }}
            onClick={send}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}