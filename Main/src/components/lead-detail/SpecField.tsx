"use client";

import { useEffect, useState } from "react";

const inputClass =
  "w-full rounded border border-[var(--color-blue)]/25 bg-white px-2 py-1.5 text-sm outline-none focus:border-[var(--color-blue)] focus:ring-1 focus:ring-[var(--color-gold)]/40 disabled:bg-[#f3f3f3]";

type Props = {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  mode: "create" | "edit";
  /** create mode uses uncontrolled defaultValue via children or value */
  displayValue: string;
  /** transform before save / blur */
  transform?: (raw: string) => string;
  uppercase?: boolean;
  type?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  multiple?: boolean;
  selectedValues?: string[];
  onCreateChange?: (value: string) => void;
  onSaveField?: (name: string, value: string | string[]) => Promise<void>;
  /** custom control for create mode (e.g. checkbox area) */
  createControl?: React.ReactNode;
  /** when true, field is always editable in edit mode too (rare) */
  alwaysOpen?: boolean;
};

export function SpecField({
  label,
  name,
  required,
  error,
  mode,
  displayValue,
  transform,
  uppercase,
  type = "text",
  placeholder,
  options,
  multiple,
  selectedValues,
  onCreateChange,
  onSaveField,
  createControl,
  alwaysOpen,
}: Props) {
  const [editing, setEditing] = useState(mode === "create" || alwaysOpen);
  const [draft, setDraft] = useState(displayValue);
  const [draftMulti, setDraftMulti] = useState<string[]>(selectedValues ?? []);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>(error);

  useEffect(() => {
    if (!editing) {
      setDraft(displayValue);
      setDraftMulti(selectedValues ?? []);
    }
  }, [displayValue, selectedValues, editing]);

  useEffect(() => {
    setLocalError(error);
  }, [error]);

  async function save() {
    if (!onSaveField) return;
    if (required) {
      const empty = multiple
        ? draftMulti.length === 0
        : !draft.trim();
      if (empty) {
        setLocalError(`${label} is required`);
        return;
      }
    }
    setSaving(true);
    try {
      const value = multiple
        ? draftMulti
        : transform
          ? transform(draft)
          : uppercase
            ? draft.toUpperCase()
            : draft;
      if (!multiple && typeof value === "string") setDraft(value);
      await onSaveField(name, value);
      setEditing(false);
      setLocalError(undefined);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(displayValue);
    setDraftMulti(selectedValues ?? []);
    setEditing(false);
    setLocalError(undefined);
  }

  const showLocked = mode === "edit" && !editing && !alwaysOpen;

  return (
    <div className="block text-sm">
      <div className="mb-0.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-blue)]/75">
          {required ? (
            <span className="inline-block h-3.5 w-1 rounded bg-[var(--color-danger)]" />
          ) : null}
          {label}
        </span>
        {mode === "edit" && !alwaysOpen && onSaveField ? (
          showLocked ? (
            <button
              type="button"
              title="Edit"
              className="font-[family-name:var(--font-heading)] text-[11px] font-semibold text-[var(--color-blue)] hover:underline"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          ) : (
            <span className="flex gap-2">
              <button
                type="button"
                title="Save Changes"
                disabled={saving}
                className="font-[family-name:var(--font-heading)] text-[11px] font-semibold text-[var(--color-blue)] hover:underline"
                onClick={save}
              >
                Save Changes
              </button>
              <button
                type="button"
                title="Cancel Edit"
                className="text-[11px] text-[var(--color-blue)]/60 hover:underline"
                onClick={cancel}
              >
                Cancel Edit
              </button>
            </span>
          )
        ) : null}
      </div>

      {createControl && mode === "create" ? (
        createControl
      ) : showLocked ? (
        <div
          className={`${inputClass} min-h-[34px] border-[var(--color-blue)]/15 bg-[var(--color-table-tint)]/35 text-[var(--color-blue)] ${uppercase ? "uppercase" : ""}`}
        >
          {multiple
            ? (selectedValues ?? []).join(", ") || "—"
            : options?.find((o) => o.value === displayValue)?.label ||
              displayValue ||
              "—"}
        </div>
      ) : options && !multiple ? (
        <select
          name={mode === "create" ? name : undefined}
          className={`${inputClass} ${uppercase ? "uppercase" : ""} ${localError ? "border-[var(--color-danger)]" : ""}`}
          value={mode === "create" ? undefined : draft}
          defaultValue={mode === "create" ? displayValue : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            onCreateChange?.(e.target.value);
          }}
        >
          <option value=""></option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : options && multiple ? (
        <div
          className={`max-h-28 overflow-auto rounded border border-[var(--color-blue)]/25 bg-white px-2 py-1.5 ${localError ? "border-[var(--color-danger)]" : ""}`}
        >
          {mode === "create"
            ? options.map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-2 py-0.5 text-sm normal-case"
                >
                  <input
                    type="checkbox"
                    name={name}
                    value={o.value}
                    defaultChecked={(selectedValues ?? []).includes(o.value)}
                    onChange={() => onCreateChange?.(o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))
            : options.map((o) => {
                const checked = draftMulti.includes(o.value);
                return (
                  <label
                    key={o.value}
                    className="flex cursor-pointer items-center gap-2 py-0.5 text-sm normal-case"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setDraftMulti(
                          checked
                            ? draftMulti.filter((v) => v !== o.value)
                            : [...draftMulti, o.value]
                        );
                      }}
                    />
                    <span>{o.label}</span>
                  </label>
                );
              })}
        </div>
      ) : (
        <input
          name={mode === "create" ? name : undefined}
          type={type}
          placeholder={placeholder}
          className={`${inputClass} ${uppercase ? "uppercase" : "normal-case"} ${localError ? "border-[var(--color-danger)]" : ""}`}
          value={mode === "edit" ? draft : undefined}
          defaultValue={mode === "create" ? displayValue : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            onCreateChange?.(e.target.value);
          }}
          onBlur={(e) => {
            if (mode === "create" || editing) {
              let v = e.target.value;
              if (transform) v = transform(v);
              else if (uppercase) v = v.toUpperCase();
              e.target.value = v;
              setDraft(v);
            }
          }}
        />
      )}

      {localError ? (
        <span className="mt-0.5 block text-xs italic text-[var(--color-danger)]">
          {localError}
        </span>
      ) : null}
    </div>
  );
}