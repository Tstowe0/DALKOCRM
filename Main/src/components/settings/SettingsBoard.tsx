"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiKeyRow } from "@/data/apiKeys";
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
  microsoft: {
    appName: string;
    tenantId: string;
    clientId: string;
    secretConfigured: boolean;
  };
  apiKeys: ApiKeyRow[];
  createApiKeyAction: (formData: FormData) => Promise<{
    secret: string;
    last4: string;
  }>;
  deleteApiKeyAction: (id: string) => Promise<void>;
};

export function SettingsBoard({
  microsoft,
  apiKeys,
  createApiKeyAction,
  deleteApiKeyAction,
}: Props) {
  const router = useRouter();
  const { confirm } = useDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  return (
    <div className="space-y-5">
      <h1
        className="text-2xl font-bold text-[var(--color-blue)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Site Settings
      </h1>
      <p className="text-sm text-[var(--color-blue)]/65">
        CRM configuration. Who can open this page is under Site Permissions.
      </p>

      <Section title="Microsoft Sign-In">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase text-[var(--color-blue)]/55">
              App
            </dt>
            <dd className="mt-0.5 text-[var(--color-blue)]">{microsoft.appName}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase text-[var(--color-blue)]/55">
              Client secret
            </dt>
            <dd className="mt-0.5 text-[var(--color-blue)]">
              {microsoft.secretConfigured ? "Configured" : "Missing"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[11px] font-semibold uppercase text-[var(--color-blue)]/55">
              Tenant ID
            </dt>
            <dd className="mt-0.5 break-all font-mono text-xs text-[var(--color-blue)]">
              {microsoft.tenantId || "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[11px] font-semibold uppercase text-[var(--color-blue)]/55">
              Application (client) ID
            </dt>
            <dd className="mt-0.5 break-all font-mono text-xs text-[var(--color-blue)]">
              {microsoft.clientId || "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-[var(--color-blue)]/50">
          The Microsoft client secret stays in .env.local. It is not shown or
          edited here.
        </p>
      </Section>

      <Section title="API Keys">
        <p className="mb-3 text-sm text-[var(--color-blue)]/70">
          Keys for later integrations (TMS, inbound API). The full value is
          shown once when you create it.
        </p>
        <form
          className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          noValidate
          onSubmit={(e) =>
            blockIfMissing(e, [["label", "Name"]], setFieldErrors)
          }
          action={async (fd) => {
            setBusy(true);
            setError(null);
            setRevealed(null);
            try {
              const created = await createApiKeyAction(fd);
              setRevealed(created.secret);
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block text-sm">
            <FieldLabel required>Name</FieldLabel>
            <input
              name="label"
              className={inputClass(fieldErrors.label)}
              placeholder="TMS"
            />
            <FieldError error={fieldErrors.label} />
          </label>
          <label className="block text-sm">
            <FieldLabel>Secret (optional)</FieldLabel>
            <input
              name="secret"
              className={inputClass(undefined, "font-mono")}
              placeholder="Leave blank to generate"
            />
          </label>
          <div className="flex items-end">
            <button type="submit" className={btnGold} disabled={busy}>
              {busy ? "Saving…" : "Add key"}
            </button>
          </div>
        </form>
        {error ? (
          <p className="mb-3 text-xs italic text-[var(--color-danger)]">{error}</p>
        ) : null}
        {revealed ? (
          <div className="mb-4 rounded border border-[var(--color-gold)] bg-[var(--color-table-tint)] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase text-[var(--color-blue)]/65">
              Copy this key now
            </p>
            <p className="mt-1 break-all font-mono text-sm text-[var(--color-blue)]">
              {revealed}
            </p>
          </div>
        ) : null}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-blue)]/15 text-[11px] uppercase text-[var(--color-blue)]/55">
              <th className="py-2 font-semibold">Name</th>
              <th className="py-2 font-semibold">Key</th>
              <th className="py-2 font-semibold">Created</th>
              <th className="py-2 font-semibold">By</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {apiKeys.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-[var(--color-blue)]/45">
                  No API keys yet.
                </td>
              </tr>
            ) : (
              apiKeys.map((key) => (
                <tr key={key.id} className="border-b border-[var(--color-blue)]/10">
                  <td className="py-2">{key.label}</td>
                  <td className="py-2 font-mono text-xs">••••{key.last4}</td>
                  <td className="py-2 text-xs">
                    {formatLogDateTime(key.createdAt)}
                  </td>
                  <td className="py-2 text-xs">{key.createdBy}</td>
                  <td className="py-2 text-right">
                    <form
                      action={async () => {
                        const ok = await confirm("Delete this API key?");
                        if (!ok) return;
                        await deleteApiKeyAction(key.id);
                        setRevealed(null);
                        router.refresh();
                      }}
                    >
                      <button type="submit" className={btnOutline}>
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Section>
    </div>
  );
}
