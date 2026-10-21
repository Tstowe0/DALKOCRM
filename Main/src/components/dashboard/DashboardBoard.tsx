import Link from "next/link";
import type { getDashboardSnapshot } from "@/data/dashboard";
import { companyDetailHref } from "@/domain/status";

type Snapshot = ReturnType<typeof getDashboardSnapshot>;

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded border border-[var(--color-blue)]/20 bg-white">
      <div className="bg-[var(--color-blue)] px-4 py-2">
        <h2
          className="text-sm font-bold text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Stat({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="rounded border border-[var(--color-blue)]/15 bg-[var(--color-table-tint)] px-3 py-3 hover:border-[var(--color-blue)]/40"
    >
      <p className="text-[11px] font-semibold uppercase text-[var(--color-blue)]/55">
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-bold text-[var(--color-blue)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {value}
      </p>
    </Link>
  );
}

function Funnel({
  leads,
  prospects,
  clients,
}: {
  leads: number;
  prospects: number;
  clients: number;
}) {
  const layers = [
    {
      href: "/leads",
      label: `Leads: ${leads}`,
      className: "bg-[var(--color-gold-light)] text-[var(--color-blue)]",
      clip: "polygon(4% 0, 96% 0, 86% 100%, 14% 100%)",
    },
    {
      href: "/prospects",
      label: `Prospects: ${prospects}`,
      className: "bg-[var(--color-gold)] text-[var(--color-blue)]",
      clip: "polygon(14% 0, 86% 0, 72% 100%, 28% 100%)",
    },
    {
      href: "/clients",
      label: `Clients: ${clients}`,
      className: "bg-[var(--color-blue)] text-white",
      clip: "polygon(28% 0, 72% 0, 62% 100%, 38% 100%)",
    },
  ] as const;

  return (
    <div
      className="mx-auto flex w-full max-w-[260px] flex-col gap-1"
      aria-label={`Leads ${leads}, Prospects ${prospects}, Clients ${clients}`}
    >
      {layers.map((layer) => (
        <Link
          key={layer.href}
          href={layer.href}
          className={`flex h-12 items-center justify-center text-xs font-bold ${layer.className}`}
          style={{
            clipPath: layer.clip,
            fontFamily: "var(--font-heading)",
          }}
        >
          {layer.label}
        </Link>
      ))}
    </div>
  );
}

export function DashboardBoard({ snapshot }: { snapshot: Snapshot }) {
  return (
    <div className="space-y-5">
      <h1
        className="text-2xl font-bold text-[var(--color-blue)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat href="/leads" label="Leads" value={snapshot.totals.leads} />
        <Stat
          href="/prospects"
          label="Prospects"
          value={snapshot.totals.prospects}
        />
        <Stat href="/clients" label="Clients" value={snapshot.totals.clients} />
        <Stat
          href="/contacts"
          label="Contacts"
          value={snapshot.totals.contacts}
        />
        <Stat
          href="/campaigns"
          label="Campaigns"
          value={snapshot.totals.campaigns}
        />
        <Stat href="/claims" label="Claims" value={snapshot.totals.claims} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Prospective Business">
          <Funnel
            leads={snapshot.totals.leads}
            prospects={snapshot.totals.prospects}
            clients={snapshot.totals.clients}
          />
          <p className="mt-2 text-center text-[11px] text-[var(--color-blue)]/50">
            All prospective business. Clients are the last layer.
          </p>
        </Card>

        <Card title="Upcoming Activities">
          {snapshot.upcoming.length === 0 ? (
            <p className="text-sm text-[var(--color-blue)]/50">
              No open activities scheduled.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-blue)]/15 text-[11px] uppercase text-[var(--color-blue)]/55">
                  <th className="py-2 font-semibold">Due</th>
                  <th className="py-2 font-semibold">Type</th>
                  <th className="py-2 font-semibold">Company</th>
                  <th className="py-2 font-semibold">Owner</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.upcoming.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--color-blue)]/10"
                  >
                    <td className="py-2 text-xs">{row.dueDate || "—"}</td>
                    <td className="py-2">{row.type}</td>
                    <td className="py-2">
                      <Link
                        href={companyDetailHref(row.companyStatus, row.companyId)}
                        className="font-semibold hover:underline"
                      >
                        {row.companyName}
                      </Link>
                    </td>
                    <td className="py-2 text-xs">{row.activityOwner || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
