/** Light PoC helpers from Design Rules / Library General Formatting */

export function toAllCaps(value: string): string {
  return value.toUpperCase();
}

export function formatPhoneUs(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function normalizeDateInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return trimmed;
  const mm = m[1].padStart(2, "0");
  const dd = m[2].padStart(2, "0");
  let yyyy = m[3];
  if (yyyy.length === 2) {
    const n = Number(yyyy);
    yyyy = n >= 70 ? `19${yyyy}` : `20${yyyy}`;
  }
  return `${mm}/${dd}/${yyyy}`;
}

export function parseCurrency(value: string): number | null {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/** Spec: list alphabetically */
export const LEAD_SOURCES = [
  "Advertisement",
  "Client Referral",
  "Cold Call",
  "Email Marketing",
  "Employee Referral",
  "External Referral",
  "Other",
  "Purchased List",
  "Supplier Referral",
  "Trade Show",
  "Web Research",
  "Website Visitor",
] as const;

export const CLIENT_TYPES = ["Standard", "Parent", "Subsidiary"] as const;

export const SALES_TERRITORIES = [
  "International",
  "Northeast",
  "Northwest",
  "Southeast",
  "Southwest",
].sort((a, b) => a.localeCompare(b));

export const INDUSTRIES = [
  "Agriculture",
  "Automotive",
  "Cement",
  "Chemicals",
  "Clothing/Apparel",
  "Computer/Electronic",
  "Distributor",
  "Fabricated Metal Products",
  "Food Manufacturing",
  "Forestry/Logging",
  "Furniture",
  "Govt/Military",
  "Healthcare",
  "Household Goods",
  "Logistics Company",
  "Lumber/Building Supplies",
  "Machinery",
  "Manufacturing",
  "Metal Manufacturing",
  "Mining",
  "Non-Rail Misc",
  "Oil/Gas",
  "Paper Manufacturing",
  "Passenger Rail",
  "Pet Supplies",
  "Petroleum/Coal Product Manufacturing",
  "Pipeline",
  "Plastic/Rubber Products Manufacturing",
  "Power Generation",
  "Rail",
  "Rail – New Car",
  "Rail – Parts",
  "Rail – Repair",
  "Rail – Shortline",
  "Retail",
  "Track/MOW",
  "Wood Product Manufact",
];

/** Spec placeholder was "__"; PoC uses 100 until design sets final */
export const ATTACHMENT_FILE_NAME_MAX = 100;

export const SEARCH_BY_OPTIONS = [
  "Company Name",
  "Source",
  "Client Type",
  "Parent Account",
  "Industry",
  "Sales Territory",
  "Office",
  "Country",
  "State",
  "City",
  "Postal",
  "Contact Name",
  "Contact Email",
  "Contact Phone No",
  "Contact Owner",
  "Created Date",
].sort((a, b) => a.localeCompare(b));

/** Prospects list Search By — Source labeled Prospect Source per Library */
export const PROSPECT_SEARCH_BY_OPTIONS = [
  "Company Name",
  "Prospect Source",
  "Client Type",
  "Parent Account",
  "Industry",
  "Sales Territory",
  "Office",
  "Country",
  "State",
  "City",
  "Postal",
  "Contact Name",
  "Contact Email",
  "Contact Phone No",
  "Contact Owner",
  "Created Date",
].sort((a, b) => a.localeCompare(b));

/** Clients First Draft — no Source column; search still allows Client Source */
export const CLIENT_SEARCH_BY_OPTIONS = [
  "Company Name",
  "Client Source",
  "Client Type",
  "Parent Account",
  "Industry",
  "Sales Territory",
  "Office",
  "Country",
  "State",
  "City",
  "Postal",
  "Contact Name",
  "Contact Email",
  "Contact Phone No",
  "Contact Owner",
  "Created Date",
].sort((a, b) => a.localeCompare(b));

export type SearchByOption = (typeof SEARCH_BY_OPTIONS)[number];

/** Log table: mm/dd/yyyy h:mm AM/PM */
export function formatLogDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return mm + "/" + dd + "/" + yyyy + " " + h + ":" + min + " " + ampm;
}
