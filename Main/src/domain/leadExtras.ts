/** Shared Add Lead section constants — safe for client components (no DB). */

export const ACTIVITY_TYPES = ["Call", "Event", "Meeting", "Task"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const NOTE_CHAR_LIMIT = 200;

/** Client First Draft Claims & Disputes sample values */
export const CLAIM_TYPES = ["Billing", "Damage", "Misc"] as const;
export const CLAIM_TOPICS = [
  "Wrong Account",
  "Product Damaged",
  "Missing Shipment",
] as const;
