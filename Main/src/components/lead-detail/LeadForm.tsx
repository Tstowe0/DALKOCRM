"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusFlow } from "@/components/lead-detail/StatusFlow";
import { CollapsibleSection } from "@/components/shell/CollapsibleSection";
import { AttachmentsPanel } from "@/components/lead-detail/AttachmentsPanel";
import { SpecField } from "@/components/lead-detail/SpecField";
import { NewEmailModal } from "@/components/shell/NewEmailModal";
import {
  ActivitiesSection,
  CampaignsSection,
  ChangeLogSection,
  ClaimsSection,
  ContactLogSection,
  ContactsSection,
  EmailsSection,
  NotesSection,
  SubsidiariesSection,
} from "@/components/lead-detail/LeadSections";
import type { Company, SubsidiaryRow } from "@/data/companies";
import type { Contact } from "@/data/contacts";
import type { Attachment } from "@/data/attachments";
import type { LeadEmail } from "@/data/emails";
import type { Activity } from "@/data/activities";
import type { Campaign } from "@/data/campaigns";
import type { Claim } from "@/data/claims";
import type { ContactLog } from "@/data/contactLogs";
import type { Note } from "@/data/notes";
import type { ChangeLog } from "@/data/changeLogs";
import {
  CLIENT_TYPES,
  INDUSTRIES,
  LEAD_SOURCES,
  SALES_TERRITORIES,
  formatCurrency,
  normalizeDateInput,
  toAllCaps,
} from "@/domain/formatting";
import {
  LEAD_STATUSES,
  PROSPECT_STATUSES,
  TMS_STATUSES,
  normalizeTmsStatus,
} from "@/domain/status";

type Props = {
  kind?: "lead" | "prospect" | "client";
  mode: "create" | "edit";
  company?: Company;
  contacts?: Contact[];
  attachments?: Attachment[];
  subsidiaries?: SubsidiaryRow[];
  emails?: LeadEmail[];
  activities?: Activity[];
  campaigns?: Campaign[];
  claims?: Claim[];
  contactLogs?: ContactLog[];
  notes?: Note[];
  changeLogs?: ChangeLog[];
  parents: { id: string; companyName: string }[];
  createAction?: (formData: FormData) => Promise<void>;
  onSaveField?: (field: string, value: string | string[]) => Promise<void>;
  addContactAction?: (formData: FormData) => Promise<void>;
  updateContactAction?: (contactId: string, formData: FormData) => Promise<void>;
  removeContactAction?: (contactId: string) => Promise<void>;
  uploadAttachmentAction?: (formData: FormData) => Promise<void>;
  renameAttachmentAction?: (
    attachmentId: string,
    formData: FormData
  ) => Promise<void>;
  deleteAttachmentAction?: (attachmentId: string) => Promise<void>;
  uploadLogoAction?: (formData: FormData) => Promise<void>;
  convertToProspectAction?: () => Promise<void>;
  convertToClientAction?: () => Promise<void>;
  deleteAction?: () => Promise<void>;
  composeEmailAction?: (payload: {
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
  }) => Promise<void>;
  uploadEmailAction?: (formData: FormData) => Promise<void>;
  deleteEmailAction?: (emailId: string) => Promise<void>;
  createActivityAction?: (formData: FormData) => Promise<void>;
  updateActivityAction?: (
    activityId: string,
    formData: FormData
  ) => Promise<void>;
  deleteActivityAction?: (activityId: string) => Promise<void>;
  addCampaignAction?: (formData: FormData) => Promise<void>;
  removeCampaignAction?: (campaignId: string) => Promise<void>;
  addClaimAction?: (formData: FormData) => Promise<void>;
  updateClaimAction?: (claimId: string, formData: FormData) => Promise<void>;
  removeClaimAction?: (claimId: string) => Promise<void>;
  createContactLogAction?: (formData: FormData) => Promise<void>;
  updateContactLogAction?: (logId: string, formData: FormData) => Promise<void>;
  deleteContactLogAction?: (logId: string) => Promise<void>;
  addNoteAction?: (body: string) => Promise<void>;
  deleteNoteAction?: (noteId: string) => Promise<void>;
};

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 flex items-center gap-2 font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-blue)]">
      <span className="inline-block h-4 w-1 rounded bg-[var(--color-gold)]" />
      {children}
    </h3>
  );
}

function BorderedBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-[var(--color-blue)]/20 p-3">
      <SubHead>{title}</SubHead>
      {children}
    </div>
  );
}

export function LeadForm({
  kind = "lead",
  mode,
  company,
  contacts = [],
  attachments = [],
  subsidiaries = [],
  emails = [],
  activities = [],
  campaigns = [],
  claims = [],
  contactLogs = [],
  notes = [],
  changeLogs = [],
  parents,
  createAction,
  onSaveField,
  addContactAction,
  updateContactAction,
  removeContactAction,
  uploadAttachmentAction,
  renameAttachmentAction,
  deleteAttachmentAction,
  uploadLogoAction,
  convertToProspectAction,
  convertToClientAction,
  deleteAction,
  composeEmailAction,
  uploadEmailAction,
  deleteEmailAction,
  createActivityAction,
  updateActivityAction,
  deleteActivityAction,
  addCampaignAction,
  removeCampaignAction,
  addClaimAction,
  updateClaimAction,
  removeClaimAction,
  createContactLogAction,
  updateContactLogAction,
  deleteContactLogAction,
  addNoteAction,
  deleteNoteAction,
}: Props) {
  const router = useRouter();
  const isProspect = kind === "prospect";
  const isClient = kind === "client";
  const entity = isClient ? "Client" : isProspect ? "Prospect" : "Lead";
  const basePath = isClient
    ? "/clients"
    : isProspect
      ? "/prospects"
      : "/leads";
  const statusOptions = isProspect ? PROSPECT_STATUSES : LEAD_STATUSES;
  const [clientType, setClientType] = useState(company?.clientType ?? "");
  const [status, setStatus] = useState(
    company?.status ??
      (isClient ? "Client" : isProspect ? "Present" : "New Lead")
  );
  const [tmsStatus, setTmsStatus] = useState(
    normalizeTmsStatus(company?.tmsStatus)
  );
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [emailAttach, setEmailAttach] = useState<Attachment | null>(null);
  const [sameAsMailing, setSameAsMailing] = useState(
    company?.physicalSameAsMailing ?? true
  );
  const [noteDraft, setNoteDraft] = useState("");

  const title = useMemo(() => {
    if (mode === "create") {
      if (isClient) return "ADD CLIENT";
      if (isProspect) return "ADD PROSPECT";
      return "ADD LEAD";
    }
    return (
      company?.companyName ||
      (isClient ? "CLIENT" : isProspect ? "PROSPECT" : "LEAD")
    );
  }, [mode, company?.companyName, isProspect, isClient]);

  function markDirty() {
    if (mode === "create") setDirty(true);
  }

  function handleBack() {
    if (noteDraft.trim()) {
      window.alert(
        `The Note that was entered has not been added to the ${entity}. Click the Add Note button before leaving to add the note to the ${entity}'s file.`
      );
      return;
    }
    if (mode === "create" && dirty) {
      const proceed = window.confirm(
        "The data entered has not been saved. Do you wish to proceed?"
      );
      if (!proceed) return;
    }
    router.push(basePath);
  }

  function onCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    if (!String(fd.get("clientType"))) next.clientType = "Client Type is required";
    if (
      String(fd.get("clientType")) === "Subsidiary" &&
      !String(fd.get("parentAccountId"))
    ) {
      next.parentAccountId = "Parent Account is required";
    }
    if (!String(fd.get("companyName") ?? "").trim()) {
      next.companyName = "Company Name is required";
    }
    if (!String(fd.get("salesperson") ?? "").trim()) {
      next.salesperson = "Salesperson is required";
    }
    if (!String(fd.get("status") ?? "").trim()) {
      next.status = "Status is required";
    }
    setErrors(next);
    if (Object.keys(next).length) e.preventDefault();
  }

  async function saveField(field: string, value: string | string[]) {
    if (!onSaveField) return;
    await onSaveField(field, value);
    if (field === "status") setStatus(String(value));
    if (field === "tmsStatus") setTmsStatus(normalizeTmsStatus(String(value)));
    if (field === "clientType") setClientType(String(value));
    if (field === "companyName") router.refresh();
    router.refresh();
  }

  const body = (
    <>
      <div className="overflow-hidden rounded border border-[var(--color-blue)]/20 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--color-blue)] px-3 py-2 text-white">
          <h1 className="font-[family-name:var(--font-heading)] text-base font-bold tracking-wide">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5">
            {mode === "create" ? (
              <button
                type="submit"
                className="h-8 rounded bg-[var(--color-gold)] px-4 font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-blue)]"
              >
                Save
              </button>
            ) : (
              <>
                {convertToProspectAction ? (
                  <button
                    type="button"
                    className="h-8 rounded border border-white/30 bg-white/10 px-3 text-xs font-semibold hover:bg-white/20"
                    onClick={async () => {
                      await convertToProspectAction();
                    }}
                  >
                    Convert to Prospect
                  </button>
                ) : null}
                {convertToClientAction ? (
                  <button
                    type="button"
                    className="h-8 rounded border border-white/30 bg-white/10 px-3 text-xs font-semibold hover:bg-white/20"
                    onClick={async () => {
                      await convertToClientAction();
                    }}
                  >
                    Convert to Client
                  </button>
                ) : null}
                <button
                  type="button"
                  className="h-8 rounded border border-red-300/50 bg-red-600/80 px-3 text-xs font-semibold hover:bg-red-600"
                  onClick={async () => {
                    const ok = window.confirm(
                      `The selected ${entity}(s) will be permanently deleted. Do you wish to continue?`
                    );
                    if (!ok || !deleteAction) return;
                    try {
                      await deleteAction();
                      router.push(basePath);
                    } catch (e) {
                      window.alert(
                        e instanceof Error ? e.message : "Delete failed"
                      );
                    }
                  }}
                >
                  Delete
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleBack}
              className="h-8 rounded border border-white/40 bg-white px-3 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-blue)]"
            >
              Back
            </button>
          </div>
        </div>
        <div className="px-3 py-3">
          <StatusFlow currentStatus={status} />
          {toast ? (
            <p className="mt-2 text-xs italic text-[var(--color-blue)]">{toast}</p>
          ) : null}
        </div>
      </div>

      <CollapsibleSection title="Company Information">
        <div className="mb-4 flex flex-wrap items-start gap-4">
          <div className="flex h-[88px] w-[88px] shrink-0 flex-col items-center justify-center overflow-hidden rounded border border-dashed border-[var(--color-blue)]/30 bg-[var(--color-table-tint)]/40 text-center text-[10px] text-[var(--color-blue)]/60">
            {company?.logoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/files/${company.logoPath}`}
                alt="Logo"
                className="h-full w-full object-contain"
              />
            ) : (
              <span title="Upload company logo">Logo Upload</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {mode === "edit" && uploadLogoAction ? (
              <form
                action={uploadLogoAction}
                className="flex flex-wrap items-end gap-2 text-sm"
              >
                <label className="block">
                  <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-blue)]/75">
                    Company Logo
                  </span>
                  <input type="file" name="logo" accept="image/*" required />
                </label>
                <button
                  type="submit"
                  title="Upload company logo"
                  className="h-8 rounded bg-[var(--color-gold)] px-3 font-[family-name:var(--font-heading)] text-xs font-bold text-[var(--color-blue)]"
                >
                  Upload Logo
                </button>
              </form>
            ) : (
              <p className="text-xs text-[var(--color-blue)]/55">
                Logo upload is available after the {entity} is saved.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
        <BorderedBlock title={`${entity} Classification`}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {isClient ? (
            <>
              {mode === "create" ? (
                <div className="block text-sm">
                  <span className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-blue)]/75">
                    <span className="inline-block h-3.5 w-1 rounded bg-[var(--color-danger)]" />
                    Status
                  </span>
                  <input type="hidden" name="status" value="Client" />
                  <div className="min-h-[34px] rounded border border-[var(--color-blue)]/15 bg-[var(--color-table-tint)]/35 px-2 py-1.5 text-[var(--color-blue)]">
                    Client
                  </div>
                </div>
              ) : (
                <SpecField
                  label="Status"
                  name="status"
                  required
                  mode={mode}
                  displayValue="Client"
                  options={[{ value: "Client", label: "Client" }]}
                />
              )}
              <SpecField
                label="TMS Status"
                name="tmsStatus"
                required
                mode={mode}
                displayValue={tmsStatus}
                error={errors.tmsStatus}
                options={TMS_STATUSES.map((s) => ({ value: s, label: s }))}
                onCreateChange={(v) => {
                  setTmsStatus(normalizeTmsStatus(v));
                  markDirty();
                }}
                onSaveField={saveField}
              />
            </>
          ) : (
            <SpecField
              label="Status"
              name="status"
              required
              mode={mode}
              displayValue={status}
              error={errors.status}
              options={statusOptions.map((s) => ({ value: s, label: s }))}
              onCreateChange={(v) => {
                setStatus(v);
                markDirty();
              }}
              onSaveField={saveField}
            />
          )}
          <SpecField
            label={
              isClient
                ? "Client Source"
                : isProspect
                  ? "Prospect Source"
                  : "Lead Source"
            }
            name="leadSource"
            mode={mode}
            displayValue={company?.leadSource ?? ""}
            options={LEAD_SOURCES.map((s) => ({ value: s, label: s }))}
            onCreateChange={markDirty}
            onSaveField={saveField}
          />
          <SpecField
            label="Client Type"
            name="clientType"
            required
            mode={mode}
            displayValue={clientType}
            error={errors.clientType}
            options={CLIENT_TYPES.map((t) => ({ value: t, label: t }))}
            onCreateChange={(v) => {
              setClientType(v);
              markDirty();
            }}
            onSaveField={saveField}
          />
          {clientType === "Subsidiary" ? (
            <SpecField
              label="Parent Account"
              name="parentAccountId"
              required
              mode={mode}
              displayValue={company?.parentAccountId ?? ""}
              error={errors.parentAccountId}
              options={parents.map((p) => ({
                value: p.id,
                label: p.companyName,
              }))}
              onCreateChange={markDirty}
              onSaveField={saveField}
            />
          ) : mode === "create" ? (
            <input type="hidden" name="parentAccountId" value="" />
          ) : null}
          <SpecField
            label="Company Name"
            name="companyName"
            required
            mode={mode}
            uppercase
            displayValue={company?.companyName ?? ""}
            error={errors.companyName}
            transform={toAllCaps}
            onCreateChange={markDirty}
            onSaveField={saveField}
          />
        </div>
        </BorderedBlock>

        <BorderedBlock title="Company Profile">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SpecField
            label="Industry"
            name="industry"
            mode={mode}
            displayValue={(company?.industry ?? []).join(", ")}
            selectedValues={company?.industry ?? []}
            multiple
            options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
            onCreateChange={markDirty}
            onSaveField={async (name, value) => {
              const arr = Array.isArray(value) ? value : [String(value)];
              await saveField(name, arr);
            }}
          />
          <SpecField
            label="Annual Revenue"
            name="annualRevenue"
            mode={mode}
            displayValue={formatCurrency(company?.annualRevenue ?? null)}
            transform={(raw) =>
              formatCurrency(parseFloat(raw.replace(/[^0-9.-]/g, "")) || null)
            }
            placeholder="$0.00"
            onCreateChange={markDirty}
            onSaveField={async (name, value) => {
              await saveField(name, String(value).replace(/[^0-9.-]/g, ""));
            }}
          />
          <SpecField
            label="Website"
            name="website"
            mode={mode}
            displayValue={company?.website ?? ""}
            onCreateChange={markDirty}
            onSaveField={saveField}
          />
          <SpecField
            label="LinkedIn"
            name="linkedin"
            mode={mode}
            displayValue={company?.linkedin ?? ""}
            onCreateChange={markDirty}
            onSaveField={saveField}
          />
          <SpecField
            label="Sales Territory"
            name="salesTerritory"
            mode={mode}
            displayValue={company?.salesTerritory ?? ""}
            options={SALES_TERRITORIES.map((t) => ({ value: t, label: t }))}
            onCreateChange={markDirty}
            onSaveField={saveField}
          />
          <SpecField
            label="Salesperson"
            name="salesperson"
            required
            mode={mode}
            uppercase
            displayValue={company?.salesperson ?? "DEMO SALESPERSON"}
            error={errors.salesperson}
            transform={toAllCaps}
            onCreateChange={markDirty}
            onSaveField={saveField}
          />
          <SpecField
            label="Office"
            name="office"
            mode={mode}
            uppercase
            displayValue={company?.office ?? ""}
            transform={toAllCaps}
            onCreateChange={markDirty}
            onSaveField={saveField}
          />
          <SpecField
            label="Last Contact"
            name="lastContact"
            mode={mode}
            displayValue={company?.lastContact ?? ""}
            placeholder="mm/dd/yyyy"
            transform={normalizeDateInput}
            onCreateChange={markDirty}
            onSaveField={saveField}
          />
        </div>
        </BorderedBlock>

        <div className="grid gap-4 md:grid-cols-2">
          <BorderedBlock title="Mailing Address">
            <div className="space-y-2.5">
            {(
              [
                ["mailingCountry", "Country", company?.mailingCountry ?? ""],
                ["mailingAddress1", "Address 1", company?.mailingAddress1 ?? ""],
                ["mailingAddress2", "Address 2", company?.mailingAddress2 ?? ""],
                ["mailingCity", "City", company?.mailingCity ?? ""],
                ["mailingState", "State", company?.mailingState ?? ""],
                ["mailingPostal", "Postal", company?.mailingPostal ?? ""],
              ] as const
            ).map(([name, label, value]) => (
              <SpecField
                key={name}
                label={label}
                name={name}
                mode={mode}
                uppercase
                displayValue={value}
                transform={toAllCaps}
                onCreateChange={markDirty}
                onSaveField={saveField}
              />
            ))}
            </div>
          </BorderedBlock>
          <BorderedBlock title="Physical Address">
            <div className="space-y-2.5">
            {mode === "create" ? (
              <label className="mb-1 flex items-center gap-2 text-sm text-[var(--color-blue)]">
                <input
                  type="checkbox"
                  name="physicalSameAsMailing"
                  checked={sameAsMailing}
                  onChange={(e) => {
                    setSameAsMailing(e.target.checked);
                    markDirty();
                  }}
                />
                Same as Mailing Address
              </label>
            ) : (
              <SpecField
                label="Same as Mailing Address"
                name="physicalSameAsMailing"
                mode={mode}
                displayValue={
                  company?.physicalSameAsMailing ? "true" : "false"
                }
                options={[
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ]}
                onSaveField={async (name, value) => {
                  setSameAsMailing(String(value) === "true");
                  await saveField(name, String(value));
                }}
              />
            )}
            {!sameAsMailing ? (
              (
                [
                  ["physicalCountry", "Country", company?.physicalCountry ?? ""],
                  [
                    "physicalAddress1",
                    "Address 1",
                    company?.physicalAddress1 ?? "",
                  ],
                  [
                    "physicalAddress2",
                    "Address 2",
                    company?.physicalAddress2 ?? "",
                  ],
                  ["physicalCity", "City", company?.physicalCity ?? ""],
                  ["physicalState", "State", company?.physicalState ?? ""],
                  ["physicalPostal", "Postal", company?.physicalPostal ?? ""],
                ] as const
              ).map(([name, label, value]) => (
                <SpecField
                  key={name}
                  label={label}
                  name={name}
                  mode={mode}
                  uppercase
                  displayValue={value}
                  transform={toAllCaps}
                  onCreateChange={markDirty}
                  onSaveField={saveField}
                />
              ))
            ) : (
              <p className="text-xs italic text-[var(--color-blue)]/50">
                {mode === "create"
                  ? "Physical address will match mailing when saved."
                  : "Using mailing address."}
              </p>
            )}
            </div>
          </BorderedBlock>
        </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Contacts">
        {mode === "create" || !addContactAction || !removeContactAction ? (
          <p className="rounded border border-dashed border-[var(--color-blue)]/20 bg-[var(--color-table-tint)]/30 px-3 py-4 text-sm text-[var(--color-blue)]/65">
            Save the Lead first, then add contacts here.
          </p>
        ) : (
          <ContactsSection
            contacts={contacts}
            companyName={company?.companyName ?? ""}
            onAdd={addContactAction}
            onUpdate={async (id, fd) => {
              if (updateContactAction) await updateContactAction(id, fd);
            }}
            onDelete={removeContactAction}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Subsidiary Companies" defaultOpen={false}>
        <SubsidiariesSection rows={subsidiaries} />
      </CollapsibleSection>

      <CollapsibleSection title="Attachments">
        {mode === "create" || !uploadAttachmentAction ? (
          <p className="rounded border border-dashed border-[var(--color-blue)]/20 bg-[var(--color-table-tint)]/30 px-3 py-4 text-sm text-[var(--color-blue)]/65">
            Save the Lead first to upload attachments.
          </p>
        ) : (
          <AttachmentsPanel
            attachments={attachments}
            onUpload={uploadAttachmentAction}
            onRename={renameAttachmentAction!}
            onDelete={deleteAttachmentAction!}
            onEmail={(a) => setEmailAttach(a)}
          />
        )}
      </CollapsibleSection>

      {emailAttach ? (
        <NewEmailModal
          key={emailAttach.id}
          open
          subject={emailAttach.fileName}
          attachmentName={emailAttach.fileName}
          onClose={() => setEmailAttach(null)}
          onSend={
            composeEmailAction
              ? async (payload) => {
                  await composeEmailAction({
                    ...payload,
                    subject: payload.subject || emailAttach.fileName,
                  });
                  setEmailAttach(null);
                }
              : undefined
          }
        />
      ) : null}

      <CollapsibleSection title="Emails" defaultOpen={false}>
        {mode === "create" || !composeEmailAction ? (
          <p className="rounded border border-dashed border-[var(--color-blue)]/20 bg-[var(--color-table-tint)]/30 px-3 py-4 text-sm text-[var(--color-blue)]/65">
            Save the Lead first to manage emails.
          </p>
        ) : (
          <EmailsSection
            emails={emails}
            onCompose={composeEmailAction}
            onUpload={uploadEmailAction!}
            onDelete={deleteEmailAction!}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Activities" defaultOpen={false}>
        {mode === "create" || !createActivityAction ? (
          <p className="rounded border border-dashed border-[var(--color-blue)]/20 bg-[var(--color-table-tint)]/30 px-3 py-4 text-sm text-[var(--color-blue)]/65">
            Save the Lead first to manage activities.
          </p>
        ) : (
          <ActivitiesSection
            activities={activities}
            onCreate={createActivityAction}
            onUpdate={updateActivityAction!}
            onDelete={deleteActivityAction!}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Campaigns" defaultOpen={false}>
        {mode === "create" || !addCampaignAction ? (
          <p className="rounded border border-dashed border-[var(--color-blue)]/20 bg-[var(--color-table-tint)]/30 px-3 py-4 text-sm text-[var(--color-blue)]/65">
            Save the Lead first to manage campaigns.
          </p>
        ) : (
          <CampaignsSection
            campaigns={campaigns}
            onAdd={addCampaignAction}
            onRemove={removeCampaignAction!}
          />
        )}
      </CollapsibleSection>

      {isClient ? (
        <CollapsibleSection
          title="Claims & Disputes (most recent)"
          defaultOpen={false}
        >
          {mode === "create" || !addClaimAction || !company ? (
            <p className="rounded border border-dashed border-[var(--color-blue)]/20 bg-[var(--color-table-tint)]/30 px-3 py-4 text-sm text-[var(--color-blue)]/65">
              Save the Client first to manage claims.
            </p>
          ) : (
            <ClaimsSection
              claims={claims}
              companyId={company.id}
              onAdd={addClaimAction}
              onUpdate={updateClaimAction!}
              onRemove={removeClaimAction!}
            />
          )}
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection title="Contact Log" defaultOpen={false}>
        {mode === "create" || !createContactLogAction ? (
          <p className="rounded border border-dashed border-[var(--color-blue)]/20 bg-[var(--color-table-tint)]/30 px-3 py-4 text-sm text-[var(--color-blue)]/65">
            Save the Lead first to manage the contact log.
          </p>
        ) : (
          <ContactLogSection
            logs={contactLogs}
            contacts={contacts}
            companyName={company?.companyName ?? ""}
            onCreate={createContactLogAction}
            onUpdate={updateContactLogAction!}
            onDelete={deleteContactLogAction!}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Notes" defaultOpen={false}>
        {mode === "create" || !addNoteAction ? (
          <p className="rounded border border-dashed border-[var(--color-blue)]/20 bg-[var(--color-table-tint)]/30 px-3 py-4 text-sm text-[var(--color-blue)]/65">
            Save the Lead first to add notes.
          </p>
        ) : (
          <NotesSection
            notes={notes}
            onAdd={addNoteAction}
            onDelete={deleteNoteAction!}
            onDraftChange={setNoteDraft}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Log" defaultOpen={false}>
        <ChangeLogSection logs={changeLogs} />
      </CollapsibleSection>

      {mode === "create" ? (
        <div className="sticky bottom-3 z-20 flex justify-end gap-2 rounded border border-[var(--color-blue)]/20 bg-white/95 px-3 py-2 shadow-md backdrop-blur">
          <button
            type="button"
            onClick={handleBack}
            className="h-9 rounded border border-[var(--color-blue)]/25 px-4 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-blue)]"
          >
            Back
          </button>
          <button
            type="submit"
            className="h-9 rounded bg-[var(--color-gold)] px-5 font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-blue)]"
          >
            Save
          </button>
        </div>
      ) : null}
    </>
  );

  if (mode === "create" && createAction) {
    return (
      <form
        action={createAction}
        onSubmit={onCreateSubmit}
        onChange={markDirty}
        className="space-y-3"
      >
        {body}
      </form>
    );
  }

  return <div className="space-y-3">{body}</div>;
}