"use client";

import { useEffect, useState } from "react";
import { useActor } from "@/lib/use-actor";
import {
  EmailLookupModal,
  type EmailLookupCompany,
  type EmailLookupTarget,
} from "@/components/shell/EmailLookupModal";
import type { ContactListRow } from "@/data/contacts";
import { listEmailLookupAction } from "@/app/leads/actions";
import {
  POPUP_BTN_CANCEL,
  POPUP_BTN_PRIMARY,
  PopupWindow,
} from "@/components/shell/PopupWindow";
import { FieldError, FieldLabel, inputClass } from "@/components/shell/formFields";


type Props = {
  open: boolean;
  onClose: () => void;
  to?: string;
  bcc?: string;
  subject?: string;
  attachmentName?: string;
  defaultCompanyId?: string;
  onSend?: (payload: {
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
    from: string;
  }) => Promise<void> | void;
};

function appendEmails(current: string, added: string[]) {
  const existing = current
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const email of added) {
    if (!existing.some((e) => e.toLowerCase() === email.toLowerCase())) {
      existing.push(email);
    }
  }
  return existing.join("; ");
}

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
  defaultCompanyId,
  onSend,
}: Props) {
  const { email: actorEmail } = useActor();
  const [fromVal, setFrom] = useState(actorEmail);
  const [toVal, setTo] = useState(to);
  const [cc, setCc] = useState("");
  const [bccVal, setBcc] = useState(bcc);
  const [subj, setSubj] = useState(subject);
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [lookup, setLookup] = useState<EmailLookupTarget | null>(null);
  const [lookupRows, setLookupRows] = useState<ContactListRow[] | null>(null);
  const [lookupCompanies, setLookupCompanies] = useState<EmailLookupCompany[]>(
    []
  );

  useEffect(() => {
    if (open && actorEmail) setFrom(actorEmail);
  }, [open, actorEmail]);

  if (!open) return null;

  async function openLookup(target: EmailLookupTarget) {
    if (!lookupRows) {
      const data = await listEmailLookupAction();
      setLookupRows(data.contacts);
      setLookupCompanies(data.companies);
    }
    setLookup(target);
  }

  async function send() {
    const next: Record<string, string> = {};
    if (!fromVal.trim()) next.from = "From is required";
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
        from: fromVal.trim(),
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const lookupBtn =
    "h-8 shrink-0 rounded border border-[var(--color-blue)]/25 bg-white px-2 text-xs font-semibold text-[var(--color-blue)]";

  return (
    <>
    <PopupWindow
      title="New Email"
      zClass="z-[100]"
      maxWidthClass="max-w-2xl"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={POPUP_BTN_CANCEL} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            className={POPUP_BTN_PRIMARY}
            onClick={() => void send()}
          >
            Send
          </button>
        </>
      }
    >
      <div className="space-y-3">
          <label className="block text-sm">
            <FieldLabel required>From</FieldLabel>
            <input
              className={inputClass(errors.from, "normal-case")}
              value={fromVal}
              onChange={(e) => setFrom(e.target.value)}
            />
            <FieldError error={errors.from} />
          </label>

          <div className="block text-sm">
            <FieldLabel>To</FieldLabel>
            <div className="flex gap-2">
              <button
                type="button"
                title="Email Lookup"
                className={lookupBtn}
                onClick={() => void openLookup("to")}
              >
                To
              </button>
              <input
                className={inputClass(errors.to, "normal-case")}
                value={toVal}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <FieldError error={errors.to} />
          </div>

          <div className="block text-sm">
            <FieldLabel>Bcc</FieldLabel>
            <div className="flex gap-2">
              <button
                type="button"
                title="Email Lookup"
                className={lookupBtn}
                onClick={() => void openLookup("bcc")}
              >
                Bcc
              </button>
              <input
                className={inputClass(undefined, "normal-case")}
                value={bccVal}
                onChange={(e) => setBcc(e.target.value)}
              />
            </div>
          </div>

          <div className="block text-sm">
            <FieldLabel>Cc</FieldLabel>
            <div className="flex gap-2">
              <button
                type="button"
                title="Email Lookup"
                className={lookupBtn}
                onClick={() => void openLookup("cc")}
              >
                Cc
              </button>
              <input
                className={inputClass(undefined, "normal-case")}
                value={cc}
                onChange={(e) => setCc(e.target.value)}
              />
            </div>
          </div>

          <label className="block text-sm">
            <FieldLabel required>Subject</FieldLabel>
            <input
              className={inputClass(errors.subject)}
              value={subj}
              onChange={(e) => setSubj(e.target.value)}
            />
            <FieldError error={errors.subject} />
          </label>
          {attachmentName ? (
            <div className="rounded border border-[var(--color-gold)]/50 bg-[var(--color-gold)]/15 px-3 py-2 text-xs text-[var(--color-blue)]">
              Attachment: {attachmentName}
            </div>
          ) : null}
          <label className="block text-sm">
            <FieldLabel>Message</FieldLabel>
            <textarea
              className={`${inputClass()} min-h-[160px]`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
      </div>
    </PopupWindow>

      {lookup && lookupRows ? (
        <EmailLookupModal
          open
          target={lookup}
          defaultCompanyId={defaultCompanyId}
          companies={lookupCompanies}
          contacts={lookupRows}
          onClose={() => setLookup(null)}
          onAdd={(emails) => {
            if (lookup === "to") setTo((v) => appendEmails(v, emails));
            if (lookup === "cc") setCc((v) => appendEmails(v, emails));
            if (lookup === "bcc") setBcc((v) => appendEmails(v, emails));
          }}
        />
      ) : null}
    </>
  );
}
