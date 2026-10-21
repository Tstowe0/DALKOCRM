import { getDb } from "@/lib/db";
import { listUpcomingActivities } from "@/data/activities";
import {
  ALL_STATUSES,
  isClientStatus,
  isLeadStatus,
  isProspectStatus,
} from "@/domain/status";

export function getDashboardSnapshot() {
  const statusRows = getDb()
    .prepare(
      `SELECT status, COUNT(*) AS n FROM companies GROUP BY status`
    )
    .all() as Array<{ status: string; n: number }>;
  const byStatus = new Map(statusRows.map((r) => [r.status, r.n]));

  const pipeline = ALL_STATUSES.map((status) => ({
    status,
    count: byStatus.get(status) ?? 0,
  }));

  const totals = {
    leads: pipeline
      .filter((p) => isLeadStatus(p.status))
      .reduce((n, p) => n + p.count, 0),
    prospects: pipeline
      .filter((p) => isProspectStatus(p.status))
      .reduce((n, p) => n + p.count, 0),
    clients: pipeline
      .filter((p) => isClientStatus(p.status))
      .reduce((n, p) => n + p.count, 0),
    contacts: (
      getDb().prepare(`SELECT COUNT(*) AS n FROM contacts`).get() as { n: number }
    ).n,
    claims: (
      getDb().prepare(`SELECT COUNT(*) AS n FROM claims`).get() as { n: number }
    ).n,
    campaigns: (
      getDb().prepare(`SELECT COUNT(*) AS n FROM campaigns`).get() as {
        n: number;
      }
    ).n,
  };

  return {
    totals,
    pipeline,
    upcoming: listUpcomingActivities(12),
  };
}
