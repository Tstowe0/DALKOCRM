"use client";

import { useMemo, useState } from "react";
import type { Attachment } from "@/data/attachments";
import { ATTACHMENT_FILE_NAME_MAX } from "@/domain/formatting";
import { MoreMenu } from "@/components/shell/MoreMenu";
import { useDialog } from "@/components/shell/dialogs";
import { FieldError, FieldLabel, inputClass } from "@/components/shell/formFields";

type Props = {
  attachments: Attachment[];
  onUpload: (formData: FormData) => Promise<void>;
  onRename: (attachmentId: string, formData: FormData) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
  onEmail?: (attachment: Attachment) => void;
  /** When true, only show the upload window (list More → Add Attachment) */
  uploadOnly?: boolean;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export function AttachmentsPanel({
  attachments,
  onUpload,
  onRename,
  onDelete,
  onEmail,
  uploadOnly = false,
}: Props) {
  const { confirm } = useDialog();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState<"idle" | "loading" | "completed">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);

  const overLimit = fileName.length > ATTACHMENT_FILE_NAME_MAX;

  const previewLabel = useMemo(() => {
    if (!file) return null;
    return `${file.name} (${Math.round(file.size / 1024)} KB)`;
  }, [file]);

  function pickFile(next: File | null) {
    setFile(next);
    setFileName(next?.name ?? "");
    setMessage(null);
    setProgress("idle");
  }

  async function saveUpload() {
    if (!file) {
      setMessage("A file must be uploaded");
      return;
    }
    if (!fileName.trim()) {
      setMessage("File name is required");
      return;
    }
    if (overLimit) {
      setMessage(
        `Character limit of ${ATTACHMENT_FILE_NAME_MAX} exceeded`
      );
      return;
    }
    setProgress("loading");
    setMessage(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("fileName", fileName.trim());
      await onUpload(fd);
      setProgress("completed");
      pickFile(null);
      setMessage("Completed");
      setTimeout(() => setProgress("idle"), 800);
    } catch (err) {
      setProgress("idle");
      setMessage(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`rounded border-2 border-dashed p-4 ${
          dragOver
            ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10"
            : "border-[var(--color-table-line)]/40"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) pickFile(dropped);
        }}
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Select Files</span>
            <input
              type="file"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="block min-w-[220px] flex-1 text-sm">
            <FieldLabel required>File Name</FieldLabel>
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className={inputClass(
                overLimit || message === "File name is required"
                  ? message || "invalid"
                  : undefined
              )}
            />
            {overLimit ? (
              <FieldError
                error={`Character limit of ${ATTACHMENT_FILE_NAME_MAX} exceeded`}
              />
            ) : message === "File name is required" ? (
              <FieldError error={message} />
            ) : null}
          </label>
          <button
            type="button"
            onClick={saveUpload}
            disabled={progress === "loading"}
            className="rounded bg-[var(--color-blue)] px-4 py-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-white disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={async () => {
              if (file || fileName) {
                const choice = await confirm(
                  "Changes have not been saved. Click OK to proceed without saving, or Cancel to stay."
                );
                if (!choice) return;
              }
              pickFile(null);
            }}
            className="rounded border border-[var(--color-table-line)]/40 px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--color-table-line)]">
          Drag & drop supported. Scan device flow is out of scope for local PoC
          (no scanner hardware).
        </p>
        {progress !== "idle" ? (
          <div className="mt-3">
            <div className="mb-1 text-xs font-semibold text-[var(--color-blue)]">
              {progress === "loading" ? "Loading" : "Completed"}
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-[#e5e5e5]">
              <div
                className={`h-full bg-[var(--color-blue)] transition-all ${
                  progress === "completed" ? "w-full" : "w-2/3 animate-pulse"
                }`}
              />
            </div>
          </div>
        ) : null}
        {message &&
        progress === "idle" &&
        message !== "File name is required" ? (
          <p
            className={`mt-2 text-xs italic ${
              message === "A file must be uploaded"
                ? "text-[var(--color-danger)]"
                : "text-[var(--color-blue)]"
            }`}
          >
            {message}
          </p>
        ) : null}
        {previewLabel ? (
          <div className="mt-3 rounded border border-[var(--color-table-line)]/20 bg-[#fafafa] p-2 text-xs">
            Preview: {previewLabel}
          </div>
        ) : null}
      </div>

      {uploadOnly ? null : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-table-line)]/30 text-[var(--color-table-line)]">
              <th className="py-2 pr-2">File Name</th>
              <th className="w-10 py-2"></th>
              <th className="py-2 pr-2">Uploaded Date</th>
              <th className="py-2">Uploaded By</th>
            </tr>
          </thead>
          <tbody>
            {attachments.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-[var(--color-table-line)]">
                  No attachments yet.
                </td>
              </tr>
            ) : (
              attachments.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-[var(--color-table-line)]/15"
                >
                  <td className="py-2 pr-2">
                    {renamingId === a.id ? (
                      <form
                        className="flex flex-wrap items-center gap-2"
                        noValidate
                        onSubmit={(e) => {
                          const fd = new FormData(e.currentTarget);
                          if (!String(fd.get("fileName") ?? "").trim()) {
                            e.preventDefault();
                            setRenameError("File name is required");
                          }
                        }}
                        action={async (fd) => {
                          await onRename(a.id, fd);
                          setRenamingId(null);
                          setRenameError(null);
                        }}
                      >
                        <input
                          name="fileName"
                          defaultValue={a.fileName.replace(/\.[^.]+$/, "")}
                          className={inputClass(
                            renamingId === a.id
                              ? renameError ?? undefined
                              : undefined
                          )}
                          maxLength={ATTACHMENT_FILE_NAME_MAX}
                          onChange={() => setRenameError(null)}
                        />
                        <span className="text-xs text-[var(--color-table-line)]">
                          {a.fileName.includes(".")
                            ? `.${a.fileName.split(".").pop()}`
                            : ""}
                        </span>
                        <button
                          type="submit"
                          className="text-xs text-[var(--color-blue)]"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="text-xs"
                          onClick={() => {
                            setRenamingId(null);
                            setRenameError(null);
                          }}
                        >
                          Cancel
                        </button>
                        {renamingId === a.id ? (
                          <FieldError error={renameError ?? undefined} />
                        ) : null}
                      </form>
                    ) : (
                      a.fileName
                    )}
                  </td>
                  <td className="py-2">
                    <MoreMenu
                      title="More options"
                      items={[
                        {
                          label: "View",
                          href: `/api/attachments/${a.id}`,
                          external: true,
                        },
                        {
                          label: "Email",
                          onClick: () => onEmail?.(a),
                        },
                        {
                          label: "Rename",
                          onClick: () => setRenamingId(a.id),
                        },
                        {
                          label: "Delete",
                          danger: true,
                          onClick: async () => {
                            const ok = await confirm(
                              "The selected file will be permanently deleted. Do you wish to proceed?"
                            );
                            if (ok) await onDelete(a.id);
                          },
                        },
                      ]}
                    />
                  </td>
                  <td className="py-2 pr-2">{formatDate(a.uploadedAt)}</td>
                  <td className="py-2">{a.uploadedBy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}