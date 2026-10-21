"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminRow } from "@/data/admins";
import { formatLogDateTime } from "@/domain/formatting";
import { Section } from "@/components/settings/Section";
import { useDialog } from "@/components/shell/dialogs";
import {
  FieldError,
  FieldLabel,
  blockIfMissing,
  inputClass,
} from "@/components/shell/formFields";

const btnGold =
  "h-9 rounded bg-[var(--color-gold)] px-4 font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-blue)]";
const btnOutline =
  "h-9 rounded border border-[var(--color-blue)]/25 bg-white px-4 text-sm font-semibold text-[var(--color-blue)]";

type Props = {
  admins: AdminRow[];
  addAdminAction: (formData: FormData) => Promise<void>;
  removeAdminAction: (email: string) => Promise<void>;
};

export function PermissionsBoard({
  admins,
  addAdminAction,
  removeAdminAction,
}: Props) {
  const router = useRouter();
  const { confirm } = useDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  return (
    <div className="space-y-5">
      <h1
        className="text-2xl font-bold text-[var(--color-blue)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Site Permissions
      </h1>
      <p className="text-sm text-[var(--color-blue)]/65">
        Who can open Site Settings and Site Permissions. Screen-level roles
        come later.
      </p>

      <Section title="Administrators">
        <p className="mb-3 text-sm text-[var(--color-blue)]/70">
          These people can open the Site menu. They must sign in with Microsoft
          (@shipdalko.com).
        </p>
        <form
          className="mb-4 flex flex-wrap items-end gap-2"
          noValidate
          onSubmit={(e) =>
            blockIfMissing(e, [["email", "Email"]], setFieldErrors)
          }
          action={async (fd) => {
            setBusy(true);
            setError(null);
            try {
              await addAdminAction(fd);
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Add failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="min-w-[240px] flex-1 text-sm">
            <FieldLabel required>Email</FieldLabel>
            <input
              name="email"
              type="email"
              className={inputClass(fieldErrors.email, "normal-case")}
              placeholder="name@shipdalko.com"
            />
            <FieldError error={fieldErrors.email} />
          </label>
          <button type="submit" className={btnGold} disabled={busy}>
            {busy ? "Adding…" : "Add admin"}
          </button>
        </form>
        {error ? (
          <p className="mb-3 text-xs italic text-[var(--color-danger)]">{error}</p>
        ) : null}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-blue)]/15 text-[11px] uppercase text-[var(--color-blue)]/55">
              <th className="py-2 font-semibold">Email</th>
              <th className="py-2 font-semibold">Added</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.email} className="border-b border-[var(--color-blue)]/10">
                <td className="py-2">
                  {admin.email}
                  {admin.locked ? (
                    <span className="ml-2 text-[11px] uppercase text-[var(--color-blue)]/45">
                      Locked
                    </span>
                  ) : null}
                </td>
                <td className="py-2 text-xs">
                  {admin.addedBy === "SYSTEM"
                    ? "Bootstrap"
                    : `${admin.addedBy} · ${formatLogDateTime(admin.addedAt)}`}
                </td>
                <td className="py-2 text-right">
                  {admin.locked ? (
                    <span className="text-xs text-[var(--color-blue)]/40">—</span>
                  ) : (
                    <form
                      action={async () => {
                        const ok = await confirm(
                          `Remove ${admin.email} as an administrator?`
                        );
                        if (!ok) return;
                        try {
                          await removeAdminAction(admin.email);
                          router.refresh();
                        } catch (e) {
                          setError(
                            e instanceof Error ? e.message : "Remove failed"
                          );
                        }
                      }}
                    >
                      <button type="submit" className={btnOutline}>
                        Remove
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}
