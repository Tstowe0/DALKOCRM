"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  POPUP_BTN_CANCEL,
  POPUP_BTN_GOLD,
  POPUP_BTN_PRIMARY,
  PopupWindow,
} from "@/components/shell/PopupWindow";
import { FieldError, FieldLabel } from "@/components/shell/formFields";

type Props = {
  open: boolean;
  title: string;
  hint: string;
  downloadLabel?: string;
  onDownloadTemplate?: () => void;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
};

function isCsv(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel"
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function downloadCsvTemplate(
  filename: string,
  headers: string[],
  sample: string[]
) {
  const cell = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  const csv = `\uFEFF${headers.map(cell).join(",")}\r\n${sample.map(cell).join(",")}\r\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportCsvModal({
  open,
  title,
  hint,
  downloadLabel = "Download template",
  onDownloadTemplate,
  onClose,
  onImport,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setDragOver(false);
      setBusy(false);
      setError(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [open]);

  if (!open) return null;

  function takeFile(next: File | null) {
    if (!next) return;
    if (!isCsv(next)) {
      setError("Choose a .csv file");
      return;
    }
    setError(null);
    setFile(next);
  }

  async function submit() {
    if (!file) {
      setError("CSV file is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onImport(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PopupWindow
      title={title}
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
            onClick={() => void submit()}
          >
            {busy ? "Importing…" : "Import"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-[var(--color-table-line)]">
          {hint}
        </p>

        {onDownloadTemplate ? (
          <button
            type="button"
            onClick={onDownloadTemplate}
            className={`inline-flex w-full items-center justify-center gap-2 ${POPUP_BTN_GOLD}`}
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              aria-hidden
            >
              <path
                d="M10 3v10m0 0 3.5-3.5M10 13 6.5 9.5M4 16.5h12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {downloadLabel}
          </button>
        ) : null}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => {
            takeFile(e.target.files?.[0] ?? null);
            e.currentTarget.value = "";
          }}
        />

        <div>
          <FieldLabel required>CSV file</FieldLabel>
          {file ? (
          <div className="flex items-center gap-3 rounded border border-[var(--color-blue)]/20 bg-[var(--color-table-tint)]/50 px-3 py-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[var(--color-blue)] text-[10px] font-bold text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              CSV
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--color-blue)]">
                {file.name}
              </p>
              <p className="text-xs text-[var(--color-table-line)]">
                {formatSize(file.size)} · ready to import
              </p>
            </div>
            <button
              type="button"
              className="h-8 shrink-0 rounded border border-[var(--color-blue)]/25 bg-white px-2.5 text-xs font-semibold text-[var(--color-blue)]"
              onClick={() => inputRef.current?.click()}
            >
              Change
            </button>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              takeFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragOver
                ? "border-[var(--color-gold)] bg-[var(--color-gold)]/15"
                : error
                  ? "border-[var(--color-danger)]/50 bg-white"
                  : "border-[var(--color-blue)]/25 bg-[#F7F8FC] hover:border-[var(--color-blue)]/50 hover:bg-[var(--color-table-tint)]/40"
            }`}
          >
            <span className="text-xs text-[var(--color-table-line)]">
              Drop a CSV here, or
            </span>
            <span
              className="inline-flex h-9 items-center rounded bg-[var(--color-blue)] px-4 text-sm font-semibold text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Choose CSV file
            </span>
          </label>
        )}
          <FieldError error={error ?? undefined} />
        </div>
      </div>
    </PopupWindow>
  );
}
