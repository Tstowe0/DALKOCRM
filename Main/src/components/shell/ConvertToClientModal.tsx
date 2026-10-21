"use client";

import { useState } from "react";
import { TMS_STATUSES, parseTmsStatus } from "@/domain/status";
import {
  POPUP_BTN_CANCEL,
  POPUP_BTN_PRIMARY,
  PopupWindow,
} from "@/components/shell/PopupWindow";
import {
  FieldError,
  FieldLabel,
  inputClass,
} from "@/components/shell/formFields";

type Props = {
  open: boolean;
  companyName: string;
  currentStatus: string;
  onClose: () => void;
  onProceed: (tmsStatus: string) => Promise<void>;
};

/**
 * Convert to Client window — Leads / Prospects list and Add Lead / Add Prospect
 * header. Written specs require fields + Proceed; TMS Status is the Client-only
 * field named in the Library (screenshot fields otherwise).
 */
export function ConvertToClientModal({
  open,
  companyName,
  currentStatus,
  onClose,
  onProceed,
}: Props) {
  const [tmsStatus, setTmsStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function proceed() {
    const next = parseTmsStatus(tmsStatus);
    if (!next) {
      setError("TMS Status is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onProceed(next);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Convert failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PopupWindow
      title="Convert to Client"
      zClass="z-[100]"
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
            onClick={() => void proceed()}
          >
            Proceed
          </button>
        </>
      }
    >
      <div className="space-y-3">
          <label className="block text-sm">
            <FieldLabel>Company</FieldLabel>
            <input
              className={inputClass(undefined, "bg-[#f3f3f3]")}
              value={companyName}
              readOnly
            />
          </label>
          <label className="block text-sm">
            <FieldLabel>Current Status</FieldLabel>
            <input
              className={inputClass(undefined, "bg-[#f3f3f3]")}
              value={currentStatus}
              readOnly
            />
          </label>
          <label className="block text-sm">
            <FieldLabel required>TMS Status</FieldLabel>
            <select
              className={inputClass(error ?? undefined)}
              value={tmsStatus}
              onChange={(e) => {
                setTmsStatus(e.target.value);
                setError(null);
              }}
            >
              <option value=""></option>
              {TMS_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {error ? (
              <FieldError error={error} />
            ) : (
              <span className="mt-1 block text-xs text-[var(--color-blue)]/55">
                Status will be set to Client. TMS Status is Active or Deactivated.
              </span>
            )}
          </label>
      </div>
    </PopupWindow>
  );
}
