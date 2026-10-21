"use client";

/** Red bar + "{Label} is required" — Design Rules required fields. */

export const FIELD_INPUT =
  "w-full rounded border border-[var(--color-blue)]/25 px-2 py-1.5 text-sm outline-none focus:border-[var(--color-blue)]";

export function RequiredMark() {
  return (
    <span className="inline-block h-3.5 w-1 rounded bg-[var(--color-danger)]" />
  );
}

export function FieldLabel({
  required,
  children,
}: {
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold uppercase text-[var(--color-blue)]/75">
      {required ? <RequiredMark /> : null}
      {children}
    </span>
  );
}

export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <span className="mt-1 block text-xs italic text-[var(--color-danger)]">
      {error}
    </span>
  );
}

export function inputClass(error?: string, extra = "") {
  return `${FIELD_INPUT} ${extra} ${error ? "border-[var(--color-danger)]" : ""}`.trim();
}

export function missingRequired(
  source: FormData | Record<string, string>,
  fields: Array<[name: string, label: string]>
): Record<string, string> {
  const get =
    source instanceof FormData
      ? (name: string) => String(source.get(name) ?? "")
      : (name: string) => source[name] ?? "";
  const next: Record<string, string> = {};
  for (const [name, label] of fields) {
    if (!get(name).trim()) next[name] = `${label} is required`;
  }
  return next;
}

/** Use with noValidate. Returns false when submit should stop. */
export function blockIfMissing(
  e: React.FormEvent<HTMLFormElement>,
  fields: Array<[string, string]>,
  setErrors: (errors: Record<string, string>) => void,
  extra?: (fd: FormData, errors: Record<string, string>) => void
): boolean {
  const fd = new FormData(e.currentTarget);
  const next = missingRequired(fd, fields);
  extra?.(fd, next);
  setErrors(next);
  if (Object.keys(next).length) {
    e.preventDefault();
    return false;
  }
  return true;
}
