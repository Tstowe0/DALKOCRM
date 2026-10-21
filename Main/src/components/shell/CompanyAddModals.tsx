"use client";

import { useState } from "react";
import { formatPhoneUs, toAllCaps } from "@/domain/formatting";
import { ACTIVITY_TYPES } from "@/domain/leadExtras";
import { useActor } from "@/lib/use-actor";
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

function Shell({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <PopupWindow
      title={title}
      zClass="z-[100]"
      maxWidthClass="max-w-xl"
      onClose={onClose}
      footer={footer}
    >
      {children}
    </PopupWindow>
  );
}

type AddProps = {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSaved: () => void;
};

export function AddContactWindow({
  companyName,
  onClose,
  onSaved,
  onAdd,
}: AddProps & { onAdd: (formData: FormData) => Promise<void> }) {
  const { fullName: owner } = useActor();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  return (
    <Shell
      title="Add Contact"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={POPUP_BTN_CANCEL} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="list-add-contact"
            className={POPUP_BTN_PRIMARY}
            disabled={busy}
          >
            Save
          </button>
        </>
      }
    >
      <form
        id="list-add-contact"
        className="space-y-3"
        noValidate
        onSubmit={(e) =>
          blockIfMissing(e, [["name", "Name"]], setFieldErrors)
        }
        action={async (fd) => {
          setBusy(true);
          setError(null);
          try {
            await onAdd(fd);
            onSaved();
            onClose();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Save failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-xs text-[var(--color-blue)]/60">
          Company: <span className="font-semibold">{companyName}</span>
        </p>
        {(
          [
            ["name", "Name", true],
            ["title", "Title", false],
            ["email", "Primary Email", false],
            ["phone", "Office Phone", false],
            ["mobile", "Mobile", false],
            ["contactOwner", "Contact Owner", false],
          ] as const
        ).map(([name, label, required]) => (
          <label key={name} className="block text-sm">
            <FieldLabel required={required}>{label}</FieldLabel>
            <input
              name={name}
              defaultValue={name === "contactOwner" ? owner : ""}
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
          <input type="checkbox" name="isPrimary" />
          Primary Contact
        </label>
        {error ? (
          <p className="text-xs italic text-[var(--color-danger)]">{error}</p>
        ) : null}
      </form>
    </Shell>
  );
}

export function AddCampaignWindow({
  companyName,
  onClose,
  onSaved,
  onAdd,
}: AddProps & { onAdd: (formData: FormData) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  return (
    <Shell
      title="Add Campaign"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={POPUP_BTN_CANCEL} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="list-add-campaign"
            className={POPUP_BTN_PRIMARY}
            disabled={busy}
          >
            Save
          </button>
        </>
      }
    >
      <form
        id="list-add-campaign"
        className="space-y-3"
        noValidate
        onSubmit={(e) =>
          blockIfMissing(e, [["campaignName", "Campaign Name"]], setFieldErrors)
        }
        action={async (fd) => {
          setBusy(true);
          setError(null);
          try {
            await onAdd(fd);
            onSaved();
            onClose();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Save failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-xs text-[var(--color-blue)]/60">
          Company: <span className="font-semibold">{companyName}</span>
        </p>
        <label className="block text-sm">
          <FieldLabel required>Campaign Name</FieldLabel>
          <input
            name="campaignName"
            className={inputClass(fieldErrors.campaignName, "uppercase")}
            onBlur={(e) => {
              e.target.value = toAllCaps(e.target.value);
            }}
          />
          <FieldError error={fieldErrors.campaignName} />
        </label>
        <label className="block text-sm">
          <FieldLabel>Template Name</FieldLabel>
          <input
            name="templateName"
            className={inputClass(undefined, "uppercase")}
            onBlur={(e) => {
              e.target.value = toAllCaps(e.target.value);
            }}
          />
        </label>
        {error ? (
          <p className="text-xs italic text-[var(--color-danger)]">{error}</p>
        ) : null}
      </form>
    </Shell>
  );
}

export function ScheduleActivityWindow({
  companyName,
  onClose,
  onSaved,
  onAdd,
}: AddProps & { onAdd: (formData: FormData) => Promise<void> }) {
  const { fullName: owner } = useActor();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Shell
      title="Schedule Activity"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={POPUP_BTN_CANCEL} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="list-add-activity"
            className={POPUP_BTN_PRIMARY}
            disabled={busy}
          >
            Save
          </button>
        </>
      }
    >
      <form
        id="list-add-activity"
        className="space-y-3"
        noValidate
        action={async (fd) => {
          setBusy(true);
          setError(null);
          try {
            await onAdd(fd);
            onSaved();
            onClose();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Save failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-xs text-[var(--color-blue)]/60">
          Company: <span className="font-semibold">{companyName}</span>
        </p>
        <label className="block text-sm">
          <FieldLabel>Type</FieldLabel>
          <select name="type" className={inputClass()} defaultValue="Call">
            {[...ACTIVITY_TYPES].sort((a, b) => a.localeCompare(b)).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
            Due Date
          </span>
          <input name="dueDate" placeholder="mm/dd/yyyy" className={inputClass(undefined, "normal-case")} />
        </label>
        <label className="block text-sm">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
            Priority
          </span>
          <input name="priority" className={inputClass(undefined, "uppercase")} />
        </label>
        <label className="block text-sm">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
            Purpose
          </span>
          <input name="purpose" className={inputClass(undefined, "uppercase")} />
        </label>
        <label className="block text-sm">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
            Status
          </span>
          <input name="status" defaultValue="OPEN" className={inputClass(undefined, "uppercase")} />
        </label>
        <label className="block text-sm">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
            Activity Owner
          </span>
          <input
            name="activityOwner"
            defaultValue={owner}
            className={inputClass(undefined, "uppercase")}
          />
        </label>
        {error ? (
          <p className="text-xs italic text-[var(--color-danger)]">{error}</p>
        ) : null}
      </form>
    </Shell>
  );
}
