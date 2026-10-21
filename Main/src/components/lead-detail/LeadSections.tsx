"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreMenu } from "@/components/shell/MoreMenu";
import { NewEmailModal } from "@/components/shell/NewEmailModal";
import { ContactLookupModal } from "@/components/shell/ContactLookupModal";
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
  missingRequired,
} from "@/components/shell/formFields";
import { SortTh, useSortableRows } from "@/components/shell/useSortableRows";
import type { LeadEmail } from "@/data/emails";
import type { Activity } from "@/data/activities";
import type { Campaign } from "@/data/campaigns";
import type { Claim } from "@/data/claims";
import type { ContactLog } from "@/data/contactLogs";
import type { Note } from "@/data/notes";
import type { ChangeLog } from "@/data/changeLogs";
import type { Contact } from "@/data/contacts";
import type { SubsidiaryRow } from "@/data/companies";
import { formatLogDateTime, formatPhoneUs, toAllCaps } from "@/domain/formatting";
import {
  ACTIVITY_TYPES,
  CLAIM_TOPICS,
  CLAIM_TYPES,
  NOTE_CHAR_LIMIT,
} from "@/domain/leadExtras";
import Link from "next/link";

const btnGold =
  "h-8 rounded bg-[var(--color-gold)] px-3 font-[family-name:var(--font-heading)] text-xs font-bold text-[var(--color-blue)]";
const btnOutline =
  "h-8 rounded border border-[var(--color-blue)]/25 bg-white px-3 text-xs font-semibold text-[var(--color-blue)]";
const input =
  "w-full rounded border border-[var(--color-blue)]/25 px-2 py-1.5 text-sm outline-none focus:border-[var(--color-blue)]";

function formatShortDate(isoOrMdY: string) {
  if (!isoOrMdY) return "-";
  if (/^\d{4}-/.test(isoOrMdY)) {
    const d = new Date(isoOrMdY);
    if (!Number.isNaN(d.getTime())) {
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${mm}/${dd}/${d.getFullYear()}`;
    }
  }
  return isoOrMdY;
}

function ModalShell({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <PopupWindow
      title={title}
      zClass="z-[100]"
      maxWidthClass={wide ? "max-w-3xl" : "max-w-xl"}
      onClose={onClose}
      footer={footer}
    >
      {children}
    </PopupWindow>
  );
}

/* Contacts */
export function ContactsSection({
  contacts,
  companyName,
  onAdd,
  onUpdate,
  onDelete,
}: {
  contacts: Contact[];
  companyName: string;
  onAdd: (fd: FormData) => Promise<void>;
  onUpdate: (id: string, fd: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const { confirm } = useDialog();
  const [modal, setModal] = useState<"add" | Contact | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [emailTo, setEmailTo] = useState<string | null>(null);
  const { sorted, sortKey, sortDir, toggle } = useSortableRows(contacts, "name", "asc");

  async function save(fd: FormData) {
    if (modal === "add") await onAdd(fd);
    else if (modal && typeof modal === "object") await onUpdate(modal.id, fd);
    setModal(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          title="Add New Contact"
          className={btnGold}
          onClick={() => {
            setFieldErrors({});
            setModal("add");
          }}
        >
          Add New Contact
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-blue)]/20">
              <SortTh label="Name" column="name" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
              <th className="w-8 py-2" />
              <SortTh label="Title" column="title" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
              <SortTh label="Email" column="email" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
              <SortTh label="Phone No" column="phone" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
              <SortTh label="Mobile" column="mobile" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
              <SortTh
                label="Contact Owner"
                column="contactOwner"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-3 text-[var(--color-blue)]/50">
                  No contacts yet.
                </td>
              </tr>
            ) : (
              sorted.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-blue)]/10">
                  <td className="py-2 pr-1 font-semibold">{c.name}</td>
                  <td className="py-2">
                    <MoreMenu
                      items={[
                        { label: "Edit/View", onClick: () => setModal(c) },
                        {
                          label: "Email",
                          onClick: () => setEmailTo(c.email || ""),
                        },
                        {
                          label: "Delete",
                          danger: true,
                          onClick: async () => {
                            const ok = await confirm(
                              "The selected contact will be permanently deleted. Do you wish to proceed?"
                            );
                            if (!ok) return;
                            await onDelete(c.id);
                            router.refresh();
                          },
                        },
                      ]}
                    />
                  </td>
                  <td className="py-2 pr-2">{c.title || "-"}</td>
                  <td className="py-2 pr-2 normal-case">{c.email || "-"}</td>
                  <td className="py-2 pr-2">{c.phone || "-"}</td>
                  <td className="py-2 pr-2">{c.mobile || "-"}</td>
                  <td className="py-2">{c.contactOwner || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal ? (
        <ModalShell
          wide
          title={modal === "add" ? "New Contact" : "Edit/View Contact"}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className={POPUP_BTN_CANCEL} onClick={() => setModal(null)}>
                Cancel
              </button>
              <button type="submit" form="contact-modal-form" className={POPUP_BTN_PRIMARY}>
                Save
              </button>
            </>
          }
        >
          <form
            id="contact-modal-form"
            className="space-y-3"
            noValidate
            onSubmit={(e) =>
              blockIfMissing(e, [["name", "Name"]], setFieldErrors)
            }
            action={async (fd) => {
              await save(fd);
            }}
          >
            <p className="text-xs text-[var(--color-blue)]/60">
              Company: <span className="font-semibold">{companyName}</span>
            </p>
            {(
              [
                ["name", "Name", modal === "add" ? "" : modal.name, true],
                ["title", "Title", modal === "add" ? "" : modal.title, false],
                ["email", "Primary Email", modal === "add" ? "" : modal.email, false],
                ["phone", "Office Phone", modal === "add" ? "" : modal.phone, false],
                ["mobile", "Mobile", modal === "add" ? "" : modal.mobile, false],
                [
                  "contactOwner",
                  "Contact Owner",
                  modal === "add" ? "" : modal.contactOwner,
                  false,
                ],
              ] as const
            ).map(([name, label, value, required]) => (
              <label key={name} className="block text-sm">
                <FieldLabel required={required}>{label}</FieldLabel>
                <input
                  name={name}
                  defaultValue={value}
                  className={inputClass(
                    fieldErrors[name],
                    name === "email" ? "normal-case" : "uppercase"
                  )}
                  onBlur={(e) => {
                    if (name === "phone" || name === "mobile") {
                      e.target.value = formatPhoneUs(e.target.value);
                    } else if (name !== "email") {
                      e.target.value = toAllCaps(e.target.value);
                    }
                  }}
                />
                <FieldError error={fieldErrors[name]} />
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
          </form>
        </ModalShell>
      ) : null}

      {emailTo !== null ? (
        <NewEmailModal
          key={emailTo}
          open
          to={emailTo}
          onClose={() => setEmailTo(null)}
        />
      ) : null}
    </div>
  );
}

/* Subsidiaries */
export function SubsidiariesSection({ rows }: { rows: SubsidiaryRow[] }) {
  const { sorted, sortKey, sortDir, toggle } = useSortableRows(
    rows,
    "companyName",
    "asc"
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-blue)]/20">
            <SortTh
              label="Company"
              column="companyName"
              sortKey={sortKey}
              sortDir={sortDir}
              onToggle={toggle}
            />
            <SortTh label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
            <SortTh
              label="TMS Status"
              column="tmsStatus"
              sortKey={sortKey}
              sortDir={sortDir}
              onToggle={toggle}
            />
            <SortTh
              label="Primary Contact"
              column="primaryContact"
              sortKey={sortKey}
              sortDir={sortDir}
              onToggle={toggle}
            />
            <SortTh
              label="Salesperson"
              column="salesperson"
              sortKey={sortKey}
              sortDir={sortDir}
              onToggle={toggle}
            />
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-3 text-[var(--color-blue)]/50">
                No subsidiary companies.
              </td>
            </tr>
          ) : (
            sorted.map((r) => (
              <tr key={r.id} className="border-b border-[var(--color-blue)]/10">
                <td className="py-2 pr-2 font-semibold">{r.companyName}</td>
                <td className="py-2 pr-2">{r.status}</td>
                <td className="py-2 pr-2">{r.tmsStatus || "-"}</td>
                <td className="py-2 pr-2">{r.primaryContact || "-"}</td>
                <td className="py-2">{r.salesperson || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* Emails */
export function EmailsSection({
  emails,
  onCompose,
  onUpload,
  onDelete,
}: {
  emails: LeadEmail[];
  onCompose: (payload: {
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
  }) => Promise<void>;
  onUpload: (fd: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const [composeOpen, setComposeOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [view, setView] = useState<LeadEmail | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const { sorted, sortKey, sortDir, toggle } = useSortableRows(emails, "sentAt", "desc");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          title="New Email"
          className={btnGold}
          onClick={() => setComposeOpen(true)}
        >
          Compose Email
        </button>
        <button
          type="button"
          title="Upload Email"
          className={btnOutline}
          onClick={() => setUploadOpen(true)}
        >
          Upload Email
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-blue)]/20">
              <SortTh
                label="Subject"
                column="subject"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <th className="w-8 py-2" />
              <SortTh label="Date" column="sentAt" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
              <SortTh
                label="To"
                column="toAddress"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <SortTh
                label="From"
                column="fromAddress"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <SortTh
                label="Attachment"
                column="hasAttachment"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-3 text-[var(--color-blue)]/50">
                  No emails yet.
                </td>
              </tr>
            ) : (
              sorted.map((e) => (
                <tr key={e.id} className="border-b border-[var(--color-blue)]/10">
                  <td className="py-2 pr-1">{e.subject}</td>
                  <td className="py-2">
                    <MoreMenu
                      items={[
                        { label: "View", onClick: () => setView(e) },
                        {
                          label: "Delete",
                          danger: true,
                          onClick: async () => {
                            const ok = await confirm(
                              "The selected file will be permanently deleted. Do you wish to proceed?"
                            );
                            if (!ok) return;
                            await onDelete(e.id);
                            router.refresh();
                          },
                        },
                      ]}
                    />
                  </td>
                  <td className="py-2 pr-2">{formatShortDate(e.sentAt)}</td>
                  <td className="py-2 pr-2 normal-case">{e.toAddress || "-"}</td>
                  <td className="py-2 pr-2 normal-case">{e.fromAddress || "-"}</td>
                  <td className="py-2">{e.hasAttachment ? "\u2713" : ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {composeOpen ? (
        <NewEmailModal
          open
          onClose={() => setComposeOpen(false)}
          onSend={async (payload) => {
            await onCompose(payload);
            setComposeOpen(false);
            router.refresh();
          }}
        />
      ) : null}

      {uploadOpen ? (
        <ModalShell
          title="Upload Email"
          onClose={() => {
            setUploadOpen(false);
            setFile(null);
            setDragOver(false);
          }}
          footer={
            <>
              <button
                type="button"
                className={POPUP_BTN_CANCEL}
                onClick={() => {
                  setUploadOpen(false);
                  setFile(null);
                  setDragOver(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={POPUP_BTN_PRIMARY}
                onClick={async () => {
                  if (!file) {
                    await alert("A file must be uploaded");
                    return;
                  }
                  const fd = new FormData();
                  fd.set("file", file);
                  await onUpload(fd);
                  setUploadOpen(false);
                  setFile(null);
                  setDragOver(false);
                  router.refresh();
                }}
              >
                Save
              </button>
            </>
          }
        >
          <div
            className={`rounded border-2 border-dashed p-4 text-sm ${
              dragOver
                ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10"
                : "border-[var(--color-blue)]/25"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
          >
            <label className="block">
              <span className="mb-1 block font-medium">Select Files</span>
              <input
                type="file"
                accept=".eml,.msg,.txt,.pdf,.html"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="mt-2 text-xs text-[var(--color-blue)]/55">
              Drag and drop supported.
            </p>
            {file ? <p className="mt-2 text-xs">Selected: {file.name}</p> : null}
          </div>
        </ModalShell>
      ) : null}

      {view ? (
        <ModalShell
          title="View Email"
          onClose={() => setView(null)}
          footer={
            <button type="button" className={POPUP_BTN_CANCEL} onClick={() => setView(null)}>
              Close
            </button>
          }
        >
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[11px] font-semibold uppercase text-[var(--color-blue)]/70">
                Subject
              </dt>
              <dd>{view.subject}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase text-[var(--color-blue)]/70">
                From
              </dt>
              <dd className="normal-case">{view.fromAddress || "-"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase text-[var(--color-blue)]/70">
                To
              </dt>
              <dd className="normal-case">{view.toAddress || "-"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase text-[var(--color-blue)]/70">
                Message
              </dt>
              <dd className="whitespace-pre-wrap normal-case">
                {view.body || (view.fileName ? `(Uploaded file: ${view.fileName})` : "-")}
              </dd>
            </div>
          </dl>
        </ModalShell>
      ) : null}
    </div>
  );
}

/* Activities */
export function ActivitiesSection({
  activities,
  onCreate,
  onUpdate,
  onDelete,
}: {
  activities: Activity[];
  onCreate: (fd: FormData) => Promise<void>;
  onUpdate: (id: string, fd: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const { confirm } = useDialog();
  const [menuOpen, setMenuOpen] = useState(false);
  const [edit, setEdit] = useState<Activity | { type: string } | null>(null);
  const { sorted, sortKey, sortDir, toggle } = useSortableRows(
    activities,
    "dueDate",
    "desc"
  );

  return (
    <div className="space-y-3">
      <div className="relative flex justify-end">
        <button
          type="button"
          title="Add New Activity"
          className={btnGold}
          onClick={() => setMenuOpen((v) => !v)}
        >
          Add Activity
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-9 z-20 min-w-[140px] rounded border border-[var(--color-blue)]/20 bg-white py-1 shadow-md">
            {[...ACTIVITY_TYPES].sort((a, b) => a.localeCompare(b)).map((t) => (
              <button
                key={t}
                type="button"
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-black/5"
                onClick={() => {
                  setMenuOpen(false);
                  setEdit({ type: t });
                }}
              >
                {t}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-blue)]/20">
              <SortTh label="Type" column="type" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
              <th className="w-8 py-2" />
              <SortTh
                label="Due Date"
                column="dueDate"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <SortTh
                label="Priority"
                column="priority"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <SortTh
                label="Purpose"
                column="purpose"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <SortTh label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
              <SortTh
                label="Activity Owner"
                column="activityOwner"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-3 text-[var(--color-blue)]/50">
                  No activities yet.
                </td>
              </tr>
            ) : (
              sorted.map((a) => (
                <tr key={a.id} className="border-b border-[var(--color-blue)]/10">
                  <td className="py-2 pr-1 font-semibold">{a.type}</td>
                  <td className="py-2">
                    <MoreMenu
                      items={[
                        { label: "View/Update", onClick: () => setEdit(a) },
                        {
                          label: "Delete",
                          danger: true,
                          onClick: async () => {
                            const ok = await confirm(
                              "The selected activity will be permanently deleted. Do you wish to proceed?"
                            );
                            if (!ok) return;
                            await onDelete(a.id);
                            router.refresh();
                          },
                        },
                      ]}
                    />
                  </td>
                  <td className="py-2 pr-2">{a.dueDate || "-"}</td>
                  <td className="py-2 pr-2">{a.priority || "-"}</td>
                  <td className="py-2 pr-2">{a.purpose || "-"}</td>
                  <td className="py-2 pr-2">{a.status || "-"}</td>
                  <td className="py-2">{a.activityOwner || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {edit ? (
        <ModalShell
          wide
          title={"id" in edit ? "View/Update Activity" : `Add ${edit.type}`}
          onClose={() => setEdit(null)}
          footer={
            <>
              <button type="button" className={POPUP_BTN_CANCEL} onClick={() => setEdit(null)}>
                Cancel
              </button>
              <button type="submit" form="activity-form" className={POPUP_BTN_PRIMARY}>
                Save
              </button>
            </>
          }
        >
          <form
            id="activity-form"
            className="grid gap-3 sm:grid-cols-2"
            noValidate
            action={async (fd) => {
              if ("id" in edit) await onUpdate(edit.id, fd);
              else await onCreate(fd);
              setEdit(null);
              router.refresh();
            }}
          >
            <input type="hidden" name="type" value={edit.type} />
            {(
              [
                ["dueDate", "Due Date", "id" in edit ? edit.dueDate : "", "mm/dd/yyyy"],
                ["priority", "Priority", "id" in edit ? edit.priority : "", ""],
                ["purpose", "Purpose", "id" in edit ? edit.purpose : "", ""],
                ["status", "Status", "id" in edit ? edit.status : "OPEN", ""],
                [
                  "activityOwner",
                  "Activity Owner",
                  "id" in edit ? edit.activityOwner : "",
                  "",
                ],
              ] as const
            ).map(([name, label, value, ph]) => (
              <label key={name} className="block text-sm">
                <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                  {label}
                </span>
                <input
                  name={name}
                  defaultValue={value}
                  placeholder={ph}
                  className={`${input} uppercase`}
                />
              </label>
            ))}
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}

/* Campaigns */
export function CampaignsSection({
  campaigns,
  onAdd,
  onRemove,
}: {
  campaigns: Campaign[];
  onAdd: (fd: FormData) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Campaign | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { sorted, sortKey, sortDir, toggle } = useSortableRows(
    campaigns,
    "campaignName",
    "asc"
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          title="Add Campaign"
          className={btnGold}
          onClick={() => {
            setFieldErrors({});
            setOpen(true);
          }}
        >
          Add Campaign
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-blue)]/20">
              <SortTh
                label="Campaign Name"
                column="campaignName"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <th className="w-8 py-2" />
              <SortTh
                label="Template Name"
                column="templateName"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-3 text-[var(--color-blue)]/50">
                  No campaigns yet.
                </td>
              </tr>
            ) : (
              sorted.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-blue)]/10">
                  <td className="py-2 pr-1 font-semibold">{c.campaignName}</td>
                  <td className="py-2">
                    <MoreMenu
                      items={[
                        { label: "View", onClick: () => setView(c) },
                        {
                          label: "Remove",
                          danger: true,
                          onClick: async () => {
                            await onRemove(c.id);
                            router.refresh();
                          },
                        },
                      ]}
                    />
                  </td>
                  <td className="py-2">{c.templateName || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open ? (
        <ModalShell
          wide
          title="Add Campaign"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button type="button" className={POPUP_BTN_CANCEL} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="campaign-form" className={POPUP_BTN_PRIMARY}>
                Save
              </button>
            </>
          }
        >
          <form
            id="campaign-form"
            className="space-y-3"
            noValidate
            onSubmit={(e) =>
              blockIfMissing(e, [["campaignName", "Campaign Name"]], setFieldErrors)
            }
            action={async (fd) => {
              await onAdd(fd);
              setOpen(false);
              router.refresh();
            }}
          >
            <label className="block text-sm">
              <FieldLabel required>Campaign Name</FieldLabel>
              <input
                name="campaignName"
                className={inputClass(fieldErrors.campaignName, "uppercase")}
              />
              <FieldError error={fieldErrors.campaignName} />
            </label>
            <label className="block text-sm">
              <FieldLabel>Template Name</FieldLabel>
              <input name="templateName" className={`${input} uppercase`} />
            </label>
          </form>
        </ModalShell>
      ) : null}

      {view ? (
        <ModalShell
          title="View Campaign"
          onClose={() => setView(null)}
          footer={
            <button type="button" className={POPUP_BTN_CANCEL} onClick={() => setView(null)}>
              Close
            </button>
          }
        >
          <p className="text-sm">
            <span className="font-semibold">{view.campaignName}</span>
            <br />
            Template: {view.templateName || "-"}
          </p>
        </ModalShell>
      ) : null}
    </div>
  );
}

/* Claims & Disputes — Client First Draft */
export function ClaimsSection({
  claims,
  companyId,
  onAdd,
  onUpdate,
  onRemove,
}: {
  claims: Claim[];
  companyId: string;
  onAdd: (fd: FormData) => Promise<void>;
  onUpdate: (id: string, fd: FormData) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const { confirm } = useDialog();
  const [modal, setModal] = useState<"add" | Claim | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { sorted, sortKey, sortDir, toggle } = useSortableRows(
    claims,
    "modifiedAt",
    "desc"
  );

  async function save(fd: FormData) {
    if (modal === "add") await onAdd(fd);
    else if (modal && typeof modal === "object") await onUpdate(modal.id, fd);
    setModal(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          title="Add Claim"
          className={btnGold}
          onClick={() => {
            setFieldErrors({});
            setModal("add");
          }}
        >
          Add Claim
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-blue)]/20">
              <SortTh
                label="Type"
                column="type"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <th className="w-8 py-2" />
              <SortTh
                label="Topic"
                column="topic"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <SortTh
                label="Load No"
                column="loadNo"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <SortTh
                label="Created By"
                column="createdBy"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <SortTh
                label="Created"
                column="createdAt"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <SortTh
                label="Last Modified By"
                column="modifiedBy"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <SortTh
                label="Modified"
                column="modifiedAt"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-3 text-[var(--color-blue)]/50">
                  No claims yet.
                </td>
              </tr>
            ) : (
              sorted.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-blue)]/10">
                  <td className="py-2 pr-1 font-semibold">{c.type}</td>
                  <td className="py-2">
                    <MoreMenu
                      items={[
                        { label: "Edit", onClick: () => setModal(c) },
                        {
                          label: "Delete",
                          danger: true,
                          onClick: async () => {
                            const ok = await confirm(
                              "The selected Claim will be permanently deleted. Do you wish to continue?"
                            );
                            if (!ok) return;
                            await onRemove(c.id);
                            router.refresh();
                          },
                        },
                      ]}
                    />
                  </td>
                  <td className="py-2 pr-2">{c.topic}</td>
                  <td className="py-2 pr-2">{c.loadNo || "-"}</td>
                  <td className="py-2 pr-2">{c.createdBy}</td>
                  <td className="py-2 pr-2 whitespace-nowrap">
                    {formatLogDateTime(c.createdAt)}
                  </td>
                  <td className="py-2 pr-2">{c.modifiedBy}</td>
                  <td className="py-2 whitespace-nowrap">
                    {formatLogDateTime(c.modifiedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Link
          href={`/claims?companyId=${encodeURIComponent(companyId)}`}
          className="text-sm font-semibold text-[var(--color-blue)] underline-offset-2 hover:underline"
        >
          All Claims
        </Link>
      </div>

      {modal ? (
        <ModalShell
          wide
          title={modal === "add" ? "Add Claim" : "Edit Claim"}
          onClose={() => setModal(null)}
          footer={
            <>
              <button
                type="button"
                className={POPUP_BTN_CANCEL}
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button type="submit" form="claim-form" className={POPUP_BTN_PRIMARY}>
                Save
              </button>
            </>
          }
        >
          <form
            id="claim-form"
            className="space-y-3"
            noValidate
            onSubmit={(e) =>
              blockIfMissing(
                e,
                [
                  ["type", "Type"],
                  ["topic", "Topic"],
                ],
                setFieldErrors
              )
            }
            action={async (fd) => {
              await save(fd);
            }}
          >
            <label className="block text-sm">
              <FieldLabel required>Type</FieldLabel>
              <select
                name="type"
                className={inputClass(fieldErrors.type)}
                defaultValue={modal === "add" ? "" : modal.type}
              >
                <option value=""></option>
                {CLAIM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <FieldError error={fieldErrors.type} />
            </label>
            <label className="block text-sm">
              <FieldLabel required>Topic</FieldLabel>
              <select
                name="topic"
                className={inputClass(fieldErrors.topic)}
                defaultValue={modal === "add" ? "" : modal.topic}
              >
                <option value=""></option>
                {CLAIM_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <FieldError error={fieldErrors.topic} />
            </label>
            <label className="block text-sm">
              <FieldLabel>Load No</FieldLabel>
              <input
                name="loadNo"
                defaultValue={modal === "add" ? "" : modal.loadNo}
                className={`${input} uppercase`}
                onBlur={(e) => {
                  e.currentTarget.value = toAllCaps(e.currentTarget.value);
                }}
              />
            </label>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}

/* Contact Log */
export function ContactLogSection({
  logs,
  contacts,
  companyName,
  onCreate,
  onUpdate,
  onDelete,
}: {
  logs: ContactLog[];
  contacts: Contact[];
  companyName: string;
  onCreate: (fd: FormData) => Promise<void>;
  onUpdate: (id: string, fd: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const { confirm } = useDialog();
  const [edit, setEdit] = useState<ContactLog | "new" | null>(null);
  const [contactName, setContactName] = useState("");
  const [lookupOpen, setLookupOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { sorted, sortKey, sortDir, toggle } = useSortableRows(logs, "logDate", "desc");

  function openNew() {
    setContactName("");
    setEdit("new");
  }

  function openEdit(log: ContactLog) {
    setContactName(log.contactName);
    setEdit(log);
  }

  function closeModal() {
    setEdit(null);
    setLookupOpen(false);
    setContactName("");
    setFieldErrors({});
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" title="Add log entry" className={btnGold} onClick={openNew}>
          Add
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-blue)]/20">
              <SortTh
                label="Contact"
                column="contactName"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <th className="w-8 py-2" />
              <SortTh label="Type" column="logType" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
              <SortTh
                label="Purpose"
                column="purpose"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <SortTh
                label="Subject"
                column="subject"
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggle}
              />
              <SortTh label="Date" column="logDate" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
              <SortTh label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-3 text-[var(--color-blue)]/50">
                  No contact log entries.
                </td>
              </tr>
            ) : (
              sorted.map((l) => (
                <tr key={l.id} className="border-b border-[var(--color-blue)]/10">
                  <td className="py-2 pr-1 font-semibold">{l.contactName}</td>
                  <td className="py-2">
                    <MoreMenu
                      items={[
                        { label: "View/Update", onClick: () => openEdit(l) },
                        {
                          label: "Delete",
                          danger: true,
                          onClick: async () => {
                            const ok = await confirm(
                              "The selected log entry will be permanently deleted. Do you wish to proceed?"
                            );
                            if (!ok) return;
                            await onDelete(l.id);
                            router.refresh();
                          },
                        },
                      ]}
                    />
                  </td>
                  <td className="py-2 pr-2">{l.logType}</td>
                  <td className="py-2 pr-2">{l.purpose || "-"}</td>
                  <td className="py-2 pr-2">{l.subject}</td>
                  <td className="py-2 pr-2">{l.logDate}</td>
                  <td className="py-2">{l.status || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {edit ? (
        <ModalShell
          wide
          title={edit === "new" ? "Add Contact Log" : "View/Update Contact Log"}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className={POPUP_BTN_CANCEL} onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" form="clog-form" className={POPUP_BTN_PRIMARY}>
                Save
              </button>
            </>
          }
        >
          <form
            id="clog-form"
            className="grid gap-3 sm:grid-cols-2"
            noValidate
            onSubmit={(e) => {
              const fd = new FormData(e.currentTarget);
              fd.set("contactName", contactName);
              const next = missingRequired(fd, [
                ["contactName", "Contact"],
                ["subject", "Subject"],
                ["logDate", "Date"],
              ]);
              setFieldErrors(next);
              if (Object.keys(next).length) e.preventDefault();
            }}
            action={async (fd) => {
              fd.set("contactName", contactName);
              if (edit === "new") await onCreate(fd);
              else await onUpdate(edit.id, fd);
              closeModal();
              router.refresh();
            }}
          >
            <input type="hidden" name="contactName" value={contactName} />
            <div className="sm:col-span-2">
              <FieldLabel required>Contact</FieldLabel>
              <div className="flex gap-2">
                <input
                  name="contactNameDisplay"
                  value={contactName}
                  onChange={(e) => setContactName(toAllCaps(e.target.value))}
                  className={inputClass(fieldErrors.contactName, "uppercase")}
                />
                <button
                  type="button"
                  className={btnOutline}
                  onClick={() => setLookupOpen(true)}
                >
                  Lookup
                </button>
              </div>
              <FieldError error={fieldErrors.contactName} />
            </div>

            <label className="block text-sm">
              <FieldLabel>Type</FieldLabel>
              <select
                name="logType"
                defaultValue={edit === "new" ? "Call" : edit.logType}
                className={input}
              >
                {["Call", "Email", "Meeting", "In Person", "Other"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                Purpose
              </span>
              <input
                name="purpose"
                defaultValue={edit === "new" ? "" : edit.purpose}
                className={`${input} uppercase`}
              />
            </label>

            <label className="block text-sm sm:col-span-2">
              <FieldLabel required>Subject</FieldLabel>
              <input
                name="subject"
                maxLength={100}
                defaultValue={edit === "new" ? "" : edit.subject}
                className={inputClass(fieldErrors.subject, "uppercase")}
              />
              <FieldError error={fieldErrors.subject} />
            </label>

            <label className="block text-sm">
              <FieldLabel required>Date</FieldLabel>
              <input
                name="logDate"
                defaultValue={edit === "new" ? "" : edit.logDate}
                placeholder="mm/dd/yyyy"
                className={inputClass(fieldErrors.logDate, "normal-case")}
              />
              <FieldError error={fieldErrors.logDate} />
            </label>

            <label className="block text-sm">
              <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                Status
              </span>
              <input
                name="status"
                defaultValue={edit === "new" ? "" : edit.status}
                className={`${input} uppercase`}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                Start Time
              </span>
              <input
                name="startTime"
                type="time"
                defaultValue={edit === "new" ? "" : edit.startTime}
                className={`${input} normal-case`}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                End Time
              </span>
              <input
                name="endTime"
                type="time"
                defaultValue={edit === "new" ? "" : edit.endTime}
                className={`${input} normal-case`}
              />
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
                Details/Notes
              </span>
              <textarea
                name="details"
                defaultValue={edit === "new" ? "" : edit.details}
                className={`${input} min-h-[80px] normal-case`}
              />
            </label>
          </form>
        </ModalShell>
      ) : null}

      <ContactLookupModal
        open={lookupOpen}
        contacts={contacts}
        companyName={companyName}
        onClose={() => setLookupOpen(false)}
        onSelect={(c) => {
          setContactName(c.name);
          setLookupOpen(false);
        }}
      />
    </div>
  );
}

/* Notes */
export function NotesSection({
  notes,
  onAdd,
  onDelete,
  onDraftChange,
}: {
  notes: Note[];
  onAdd: (body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDraftChange?: (draft: string) => void;
}) {
  const router = useRouter();
  const { confirm } = useDialog();
  const [draft, setDraft] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const remaining = NOTE_CHAR_LIMIT - draft.length;
  const over = remaining <= 0;

  function updateDraft(next: string) {
    const clipped = next.slice(0, NOTE_CHAR_LIMIT);
    setDraft(clipped);
    onDraftChange?.(clipped);
  }

  return (
    <div className="space-y-4">
      <div>
        <div
          className={`mb-1 flex items-center gap-1 text-xs font-semibold ${
            over ? "text-[var(--color-danger)]" : "text-[var(--color-blue)]/70"
          }`}
        >
          <span className="inline-block h-3.5 w-1 rounded bg-[var(--color-danger)]" />
          Character Limit ({Math.max(0, remaining)} of {NOTE_CHAR_LIMIT})
        </div>
        <textarea
          value={draft}
          maxLength={NOTE_CHAR_LIMIT}
          onChange={(e) => {
            setNoteError(null);
            updateDraft(e.target.value);
          }}
          className={`${inputClass(noteError ?? undefined)} min-h-[72px] normal-case`}
        />
        <FieldError error={noteError ?? undefined} />
        <button
          type="button"
          className={`${btnGold} mt-2`}
          onClick={async () => {
            if (!draft.trim()) {
              setNoteError("Note is required");
              return;
            }
            setNoteError(null);
            await onAdd(draft.trim());
            updateDraft("");
            router.refresh();
          }}
        >
          Add Note
        </button>
      </div>
      <div className="space-y-2">
        {notes.length === 0 ? (
          <p className="text-sm text-[var(--color-blue)]/50">No notes yet.</p>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="rounded border border-[var(--color-blue)]/15 bg-[var(--color-table-tint)]/25 px-3 py-2 text-sm"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="text-[11px] text-[var(--color-blue)]/60">
                  {n.createdBy} - {formatLogDateTime(n.createdAt)}
                </span>
                <button
                  type="button"
                  className="text-xs text-[var(--color-danger)]"
                  onClick={async () => {
                    const ok = await confirm(
                      "The selected note will be deleted permanently. Do you wish to proceed?"
                    );
                    if (!ok) return;
                    await onDelete(n.id);
                    router.refresh();
                  }}
                >
                  Delete
                </button>
              </div>
              <p className="normal-case whitespace-pre-wrap">{n.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* Change Log */
export function ChangeLogSection({ logs }: { logs: ChangeLog[] }) {
  const { sorted, sortKey, sortDir, toggle } = useSortableRows(
    logs,
    "modifiedAt",
    "desc"
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-blue)]/20">
            <SortTh
              label="Modification"
              column="modification"
              sortKey={sortKey}
              sortDir={sortDir}
              onToggle={toggle}
            />
            <SortTh
              label="Modified By"
              column="modifiedBy"
              sortKey={sortKey}
              sortDir={sortDir}
              onToggle={toggle}
            />
            <SortTh
              label="Modified"
              column="modifiedAt"
              sortKey={sortKey}
              sortDir={sortDir}
              onToggle={toggle}
            />
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-3 text-[var(--color-blue)]/50">
                No changes logged yet.
              </td>
            </tr>
          ) : (
            sorted.map((l) => (
              <tr key={l.id} className="border-b border-[var(--color-blue)]/10">
                <td className="py-2 pr-2">{l.modification}</td>
                <td className="py-2 pr-2">{l.modifiedBy}</td>
                <td className="py-2">{formatLogDateTime(l.modifiedAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
