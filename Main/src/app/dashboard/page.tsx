import { DashboardBoard } from "@/components/dashboard/DashboardBoard";
import { getDashboardSnapshot } from "@/data/dashboard";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <DashboardBoard snapshot={getDashboardSnapshot()} />;
}
