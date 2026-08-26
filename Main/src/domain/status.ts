/** Status pipeline from Library Design Rules / Add Lead specs */

export const ALL_STATUSES = [
  "New Lead",
  "Contact",
  "Qualify",
  "Present",
  "Proposal",
  "Pursuit",
  "Negotiate",
  "On Board",
  "Client",
] as const;

export type CompanyStatus = (typeof ALL_STATUSES)[number];

/** Add Lead Status dropdown — these only */
export const LEAD_STATUSES: CompanyStatus[] = [
  "New Lead",
  "Contact",
  "Qualify",
];

export const PROSPECT_STATUSES: CompanyStatus[] = [
  "Present",
  "Proposal",
  "Pursuit",
  "Negotiate",
  "On Board",
];

export type CompanyKind = "Lead" | "Prospect" | "Client";

export function kindFromStatus(status: string): CompanyKind {
  if (status === "Client") return "Client";
  if ((PROSPECT_STATUSES as string[]).includes(status)) return "Prospect";
  return "Lead";
}

export function isLeadStatus(status: string): boolean {
  return (LEAD_STATUSES as string[]).includes(status);
}

export function isProspectStatus(status: string): boolean {
  return (PROSPECT_STATUSES as string[]).includes(status);
}

export function isClientStatus(status: string): boolean {
  return status === "Client";
}

/** Clients list Status filter — TMS Active/Deactivated (First Draft) */
export const TMS_STATUSES = ["Active", "Deactivated"] as const;

export type TmsStatus = (typeof TMS_STATUSES)[number];

export function normalizeTmsStatus(value: string | null | undefined): TmsStatus {
  if (value === "Deactivated") return "Deactivated";
  return "Active";
}

/** Route to the correct company detail based on pipeline status */
export function companyDetailHref(status: string, companyId: string): string {
  const kind = kindFromStatus(status);
  if (kind === "Client") return `/clients/${companyId}`;
  if (kind === "Prospect") return `/prospects/${companyId}`;
  return `/leads/${companyId}`;
}

/**
 * Flow chart steps from Add Lead spec.
 * Stored status for onboard step is "On Board"; display label is "Onboard".
 * Final step display is "Convert to Client" (spec typo: Conver).
 */
export const STATUS_FLOW_STEPS = [
  "New Lead",
  "Contact",
  "Qualify",
  "Present",
  "Proposal",
  "Pursuit",
  "Negotiate",
  "On Board",
  "Client",
] as const;

export function flowStepLabel(step: string): string {
  if (step === "On Board") return "Onboard";
  if (step === "Client") return "Convert to Client";
  return step;
}

export type FlowStepState = "current" | "done" | "future";

export function flowStepState(
  step: string,
  currentStatus: string
): FlowStepState {
  const currentIdx = STATUS_FLOW_STEPS.indexOf(
    currentStatus as (typeof STATUS_FLOW_STEPS)[number]
  );
  const stepIdx = STATUS_FLOW_STEPS.indexOf(
    step as (typeof STATUS_FLOW_STEPS)[number]
  );
  if (currentIdx < 0 || stepIdx < 0) return "future";
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "current";
  return "future";
}