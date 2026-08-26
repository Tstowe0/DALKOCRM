import { getDb } from "@/lib/db";
import { newId } from "@/lib/ids";
import {
  isLeadStatus,
  isProspectStatus,
  isClientStatus,
  LEAD_STATUSES,
  PROSPECT_STATUSES,
  kindFromStatus,
  normalizeTmsStatus,
} from "@/domain/status";
import { addChangeLog } from "@/data/changeLogs";

export type Company = {
  id: string;
  companyName: string;
  status: string;
  leadSource: string;
  clientType: string;
  parentAccountId: string | null;
  industry: string[];
  annualRevenue: number | null;
  website: string;
  linkedin: string;
  salesTerritory: string;
  salesperson: string;
  office: string;
  lastContact: string;
  mailingCountry: string;
  mailingAddress1: string;
  mailingAddress2: string;
  mailingCity: string;
  mailingState: string;
  mailingPostal: string;
  physicalSameAsMailing: boolean;
  physicalCountry: string;
  physicalAddress1: string;
  physicalAddress2: string;
  physicalCity: string;
  physicalState: string;
  physicalPostal: string;
  logoPath: string | null;
  tmsStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyInput = Omit<
  Company,
  "id" | "createdAt" | "updatedAt" | "logoPath"
> & {
  id?: string;
  logoPath?: string | null;
};

type CompanyRow = {
  id: string;
  company_name: string;
  status: string;
  lead_source: string;
  client_type: string;
  parent_account_id: string | null;
  industry: string;
  annual_revenue: number | null;
  website: string;
  linkedin: string;
  sales_territory: string;
  salesperson: string;
  office: string;
  last_contact: string;
  mailing_country: string;
  mailing_address1: string;
  mailing_address2: string;
  mailing_city: string;
  mailing_state: string;
  mailing_postal: string;
  physical_same_as_mailing: number;
  physical_country: string;
  physical_address1: string;
  physical_address2: string;
  physical_city: string;
  physical_state: string;
  physical_postal: string;
  logo_path: string | null;
  tms_status?: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: CompanyRow): Company {
  let industry: string[] = [];
  try {
    industry = JSON.parse(row.industry || "[]");
  } catch {
    industry = [];
  }
  return {
    id: row.id,
    companyName: row.company_name,
    status: row.status,
    leadSource: row.lead_source,
    clientType: row.client_type,
    parentAccountId: row.parent_account_id,
    industry,
    annualRevenue: row.annual_revenue,
    website: row.website,
    linkedin: row.linkedin,
    salesTerritory: row.sales_territory,
    salesperson: row.salesperson,
    office: row.office,
    lastContact: row.last_contact,
    mailingCountry: row.mailing_country,
    mailingAddress1: row.mailing_address1,
    mailingAddress2: row.mailing_address2,
    mailingCity: row.mailing_city,
    mailingState: row.mailing_state,
    mailingPostal: row.mailing_postal,
    physicalSameAsMailing: Boolean(row.physical_same_as_mailing),
    physicalCountry: row.physical_country,
    physicalAddress1: row.physical_address1,
    physicalAddress2: row.physical_address2,
    physicalCity: row.physical_city,
    physicalState: row.physical_state,
    physicalPostal: row.physical_postal,
    logoPath: row.logo_path,
    tmsStatus: row.tms_status ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function filterCompanies(
  predicate: (c: Company) => boolean,
  filters?: {
    statuses?: string[];
    salespeople?: string[];
    searchClauses?: SearchClause[];
  }
): Company[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM companies ORDER BY company_name COLLATE NOCASE`)
    .all() as CompanyRow[];

  return rows
    .map(mapRow)
    .filter(predicate)
    .filter((c) => {
      if (filters?.statuses?.length && !filters.statuses.includes(c.status)) {
        return false;
      }
      if (
        filters?.salespeople?.length &&
        !filters.salespeople.includes(c.salesperson)
      ) {
        return false;
      }
      if (filters?.searchClauses?.length) {
        return filters.searchClauses.every((clause) =>
          matchesSearchClause(c, clause)
        );
      }
      return true;
    });
}

export function listLeads(filters?: {
  statuses?: string[];
  salespeople?: string[];
  searchClauses?: SearchClause[];
}): Company[] {
  return filterCompanies((c) => isLeadStatus(c.status), filters);
}

export function listProspects(filters?: {
  statuses?: string[];
  salespeople?: string[];
  searchClauses?: SearchClause[];
}): Company[] {
  return filterCompanies((c) => isProspectStatus(c.status), filters);
}

export function listClients(filters?: {
  tmsStatuses?: string[];
  salespeople?: string[];
  searchClauses?: SearchClause[];
}): Company[] {
  return filterCompanies((c) => isClientStatus(c.status), {
    salespeople: filters?.salespeople,
    searchClauses: filters?.searchClauses,
  }).filter((c) => {
    if (!filters?.tmsStatuses?.length) return true;
    return filters.tmsStatuses.includes(normalizeTmsStatus(c.tmsStatus));
  });
}

export type SearchClause = {
  field: string;
  value: string;
  valueTo?: string;
};

function matchesSearchClause(c: Company, clause: SearchClause): boolean {
  const v = clause.value.trim().toUpperCase();
  if (!v && clause.field !== "Created Date") return true;
  const contacts = getDb()
    .prepare(`SELECT * FROM contacts WHERE company_id = ?`)
    .all(c.id) as {
    name: string;
    email: string;
    phone: string;
    contact_owner: string;
  }[];

  switch (clause.field) {
    case "Company Name":
      return c.companyName.toUpperCase().includes(v);
    case "Source":
    case "Prospect Source":
    case "Client Source":
      return c.leadSource.toUpperCase() === v || c.leadSource.toUpperCase().includes(v);
    case "Client Type":
      return c.clientType.toUpperCase() === v;
    case "Parent Account": {
      if (!c.parentAccountId) return false;
      const parent = getCompany(c.parentAccountId);
      return Boolean(
        parent && parent.companyName.toUpperCase().includes(v)
      );
    }
    case "Industry":
      return c.industry.some((i) => i.toUpperCase().includes(v));
    case "Sales Territory":
      return c.salesTerritory.toUpperCase() === v || c.salesTerritory.toUpperCase().includes(v);
    case "Office":
      return c.office.toUpperCase().includes(v);
    case "Country":
      return (
        c.mailingCountry.toUpperCase().includes(v) ||
        c.physicalCountry.toUpperCase().includes(v)
      );
    case "State":
      return (
        c.mailingState.toUpperCase().includes(v) ||
        c.physicalState.toUpperCase().includes(v)
      );
    case "City":
      return (
        c.mailingCity.toUpperCase().includes(v) ||
        c.physicalCity.toUpperCase().includes(v)
      );
    case "Postal":
      return (
        c.mailingPostal.toUpperCase().includes(v) ||
        c.physicalPostal.toUpperCase().includes(v)
      );
    case "Contact Name":
      return contacts.some((ct) => ct.name.toUpperCase().includes(v));
    case "Contact Email":
      return contacts.some((ct) => ct.email.toUpperCase().includes(v));
    case "Contact Phone No":
      return contacts.some((ct) => ct.phone.toUpperCase().includes(v));
    case "Contact Owner":
      return contacts.some((ct) => ct.contact_owner.toUpperCase().includes(v));
    case "Created Date": {
      const from = clause.value.trim();
      const to = (clause.valueTo ?? "").trim();
      const created = c.createdAt.slice(0, 10);
      // createdAt is ISO; compare loosely via Date
      const createdTime = new Date(c.createdAt).getTime();
      if (from) {
        const [mm, dd, yyyy] = from.split("/");
        const fromTime = new Date(`${yyyy}-${mm}-${dd}T00:00:00`).getTime();
        if (createdTime < fromTime) return false;
      }
      if (to) {
        const [mm, dd, yyyy] = to.split("/");
        const toTime = new Date(`${yyyy}-${mm}-${dd}T23:59:59`).getTime();
        if (createdTime > toTime) return false;
      }
      void created;
      return true;
    }
    default:
      return true;
  }
}

export type LeadListRow = Company & {
  primaryContactName: string;
  primaryEmail: string;
  primaryPhone: string;
  subsidiaryCount: number;
};

function toListRows(companies: Company[]): LeadListRow[] {
  return companies.map((c) => {
    const contacts = getDb()
      .prepare(
        `SELECT name, email, phone FROM contacts WHERE company_id = ? ORDER BY is_primary DESC, name COLLATE NOCASE LIMIT 1`
      )
      .get(c.id) as
      | { name: string; email: string; phone: string }
      | undefined;
    const subsidiaryCount = (
      getDb()
        .prepare(
          `SELECT COUNT(*) as n FROM companies WHERE parent_account_id = ?`
        )
        .get(c.id) as { n: number }
    ).n;
    return {
      ...c,
      primaryContactName: contacts?.name ?? "",
      primaryEmail: contacts?.email ?? "",
      primaryPhone: contacts?.phone ?? "",
      subsidiaryCount,
    };
  });
}

export function listLeadRows(filters?: {
  statuses?: string[];
  salespeople?: string[];
  searchClauses?: SearchClause[];
}): LeadListRow[] {
  return toListRows(listLeads(filters));
}

export function listProspectRows(filters?: {
  statuses?: string[];
  salespeople?: string[];
  searchClauses?: SearchClause[];
}): LeadListRow[] {
  return toListRows(listProspects(filters));
}

export function listClientRows(filters?: {
  tmsStatuses?: string[];
  salespeople?: string[];
  searchClauses?: SearchClause[];
}): LeadListRow[] {
  return toListRows(listClients(filters));
}

export function countSubsidiaries(companyId: string): number {
  return (
    getDb()
      .prepare(
        `SELECT COUNT(*) as n FROM companies WHERE parent_account_id = ?`
      )
      .get(companyId) as { n: number }
  ).n;
}

export function listSubsidiaries(parentId: string): Company[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM companies WHERE parent_account_id = ? ORDER BY company_name`
    )
    .all(parentId) as CompanyRow[];
  return rows.map(mapRow);
}

export type SubsidiaryRow = {
  id: string;
  companyName: string;
  status: string;
  tmsStatus: string;
  primaryContact: string;
  salesperson: string;
};

export function listSubsidiaryRows(parentId: string): SubsidiaryRow[] {
  return listSubsidiaries(parentId).map((s) => {
    const contact = getDb()
      .prepare(
        `SELECT name FROM contacts WHERE company_id = ? ORDER BY is_primary DESC, name COLLATE NOCASE LIMIT 1`
      )
      .get(s.id) as { name: string } | undefined;
    return {
      id: s.id,
      companyName: s.companyName,
      status: s.status,
      tmsStatus: s.status === "Client" ? s.tmsStatus || "—" : "",
      primaryContact: contact?.name ?? "",
      salesperson: s.salesperson,
    };
  });
}

const FIELD_COLUMN: Record<string, string> = {
  companyName: "company_name",
  status: "status",
  leadSource: "lead_source",
  clientType: "client_type",
  parentAccountId: "parent_account_id",
  industry: "industry",
  annualRevenue: "annual_revenue",
  website: "website",
  linkedin: "linkedin",
  salesTerritory: "sales_territory",
  salesperson: "salesperson",
  office: "office",
  lastContact: "last_contact",
  mailingCountry: "mailing_country",
  mailingAddress1: "mailing_address1",
  mailingAddress2: "mailing_address2",
  mailingCity: "mailing_city",
  mailingState: "mailing_state",
  mailingPostal: "mailing_postal",
  physicalSameAsMailing: "physical_same_as_mailing",
  physicalCountry: "physical_country",
  physicalAddress1: "physical_address1",
  physicalAddress2: "physical_address2",
  physicalCity: "physical_city",
  physicalState: "physical_state",
  physicalPostal: "physical_postal",
  logoPath: "logo_path",
  tmsStatus: "tms_status",
};

export function updateCompanyField(
  id: string,
  field: string,
  value: string | string[] | number | boolean | null
): Company {
  const existing = getCompany(id);
  if (!existing) throw new Error("Company not found");

  const column = FIELD_COLUMN[field];
  if (!column) throw new Error(`Unknown field: ${field}`);

  let dbValue: string | number | null = null;
  if (field === "industry") {
    dbValue = JSON.stringify(Array.isArray(value) ? value : []);
  } else if (field === "physicalSameAsMailing") {
    dbValue = value ? 1 : 0;
  } else if (field === "annualRevenue") {
    dbValue = value == null || value === "" ? null : Number(value);
  } else if (field === "parentAccountId") {
    dbValue = value ? String(value) : null;
  } else if (
    [
      "companyName",
      "salesperson",
      "office",
      "mailingCountry",
      "mailingAddress1",
      "mailingAddress2",
      "mailingCity",
      "mailingState",
      "mailingPostal",
      "physicalCountry",
      "physicalAddress1",
      "physicalAddress2",
      "physicalCity",
      "physicalState",
      "physicalPostal",
    ].includes(field)
  ) {
    dbValue = String(value ?? "").toUpperCase();
  } else {
    dbValue = value == null ? null : String(value);
  }

  if (field === "clientType" && value === "Subsidiary" && !existing.parentAccountId) {
    // allow setting type; parent validated separately when saving parent field
  }
  if (field === "clientType" && value !== "Subsidiary") {
    getDb()
      .prepare(
        `UPDATE companies SET client_type = ?, parent_account_id = NULL, updated_at = ? WHERE id = ?`
      )
      .run(String(value), new Date().toISOString(), id);
    addChangeLog(id, `Client Type changed to ${String(value)}`);
    return getCompany(id)!;
  }
  if (field === "companyName" && !String(dbValue ?? "").trim()) {
    throw new Error("Company Name is required");
  }
  if (field === "salesperson" && !String(dbValue ?? "").trim()) {
    throw new Error("Salesperson is required");
  }
  if (field === "clientType" && !String(dbValue ?? "").trim()) {
    throw new Error("Client Type is required");
  }
  if (field === "parentAccountId") {
    const ct = existing.clientType;
    if (ct === "Subsidiary" && !dbValue) {
      throw new Error("Parent Account is required");
    }
  }
  if (field === "status") {
    const kind = kindFromStatus(existing.status);
    if (kind === "Client") {
      if (String(dbValue) !== "Client") {
        throw new Error("Client Status cannot be changed from Client");
      }
    } else {
      const allowed =
        kind === "Prospect"
          ? (PROSPECT_STATUSES as string[])
          : (LEAD_STATUSES as string[]);
      if (!allowed.includes(String(dbValue))) {
        throw new Error(
          kind === "Prospect" ? "Invalid Prospect status" : "Invalid Lead status"
        );
      }
    }
  }
  if (field === "tmsStatus") {
    if (!isClientStatus(existing.status)) {
      throw new Error("TMS Status applies only to Clients");
    }
    const next = String(dbValue ?? "");
    if (next !== "Active" && next !== "Deactivated") {
      throw new Error("TMS Status must be Active or Deactivated");
    }
  }

  getDb()
    .prepare(
      `UPDATE companies SET ${column} = ?, updated_at = ? WHERE id = ?`
    )
    .run(dbValue, new Date().toISOString(), id);

  const display =
    field === "industry"
      ? Array.isArray(value)
        ? value.join(", ")
        : String(value)
      : String(value ?? "");
  addChangeLog(id, `${field} updated${display ? `: ${display}` : ""}`);

  return getCompany(id)!;
}

export function setCompanyLogo(id: string, logoPath: string | null): Company {
  getDb()
    .prepare(
      `UPDATE companies SET logo_path = ?, updated_at = ? WHERE id = ?`
    )
    .run(logoPath, new Date().toISOString(), id);
  return getCompany(id)!;
}

export function setCompanyStatus(id: string, status: string): Company {
  const existing = getCompany(id);
  if (status === "Client") {
    const tms = normalizeTmsStatus(existing?.tmsStatus);
    getDb()
      .prepare(
        `UPDATE companies SET status = ?, tms_status = ?, updated_at = ? WHERE id = ?`
      )
      .run(status, tms === "Deactivated" ? "Deactivated" : "Active", new Date().toISOString(), id);
  } else {
    getDb()
      .prepare(`UPDATE companies SET status = ?, updated_at = ? WHERE id = ?`)
      .run(status, new Date().toISOString(), id);
  }
  addChangeLog(id, `Status changed to ${status}`);
  return getCompany(id)!;
}

export function deleteCompany(id: string): void {
  if (countSubsidiaries(id) > 0) {
    const existing = getCompany(id);
    const kind = existing ? kindFromStatus(existing.status) : "Lead";
    const label =
      kind === "Client" ? "Client" : kind === "Prospect" ? "Prospect" : "Lead";
    throw new Error(
      `This ${label} currently has Subsidiary Companies linked to it and cannot be deleted. The Parent Company of the subsidiaries must first be updated.`
    );
  }
  getDb().prepare(`DELETE FROM companies WHERE id = ?`).run(id);
}

export function getCompany(id: string): Company | null {
  const row = getDb()
    .prepare(`SELECT * FROM companies WHERE id = ?`)
    .get(id) as CompanyRow | undefined;
  return row ? mapRow(row) : null;
}

export function listParentAccounts(): Company[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM companies WHERE client_type = 'Parent' ORDER BY company_name`
    )
    .all() as CompanyRow[];
  return rows.map(mapRow);
}

export function listSalespeople(): string[] {
  const rows = getDb()
    .prepare(
      `SELECT DISTINCT salesperson FROM companies WHERE salesperson != '' ORDER BY salesperson`
    )
    .all() as { salesperson: string }[];
  return rows.map((r) => r.salesperson);
}

export type ValidationError = { field: string; message: string };

export function validateCompany(input: CompanyInput): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!input.clientType) {
    errors.push({ field: "clientType", message: "Client Type is required" });
  }
  if (input.clientType === "Subsidiary" && !input.parentAccountId) {
    errors.push({
      field: "parentAccountId",
      message: "Parent Account is required",
    });
  }
  if (!input.companyName?.trim()) {
    errors.push({ field: "companyName", message: "Company Name is required" });
  }
  if (!input.salesperson?.trim()) {
    errors.push({ field: "salesperson", message: "Salesperson is required" });
  }
  if (!input.status?.trim()) {
    errors.push({ field: "status", message: "Status is required" });
  }
  return errors;
}

export function createCompany(input: CompanyInput): Company {
  const errors = validateCompany(input);
  if (errors.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }

  const now = new Date().toISOString();
  const id = input.id ?? newId("co");
  getDb()
    .prepare(
      `INSERT INTO companies (
        id, company_name, status, lead_source, client_type, parent_account_id,
        industry, annual_revenue, website, linkedin, sales_territory, salesperson,
        office, last_contact, mailing_country, mailing_address1, mailing_address2,
        mailing_city, mailing_state, mailing_postal, physical_same_as_mailing,
        physical_country, physical_address1, physical_address2, physical_city,
        physical_state, physical_postal, logo_path, tms_status, created_at, updated_at
      ) VALUES (
        @id, @company_name, @status, @lead_source, @client_type, @parent_account_id,
        @industry, @annual_revenue, @website, @linkedin, @sales_territory, @salesperson,
        @office, @last_contact, @mailing_country, @mailing_address1, @mailing_address2,
        @mailing_city, @mailing_state, @mailing_postal, @physical_same_as_mailing,
        @physical_country, @physical_address1, @physical_address2, @physical_city,
        @physical_state, @physical_postal, @logo_path, @tms_status, @created_at, @updated_at
      )`
    )
    .run({
      id,
      company_name: input.companyName.trim().toUpperCase(),
      status: input.status,
      lead_source: input.leadSource,
      client_type: input.clientType,
      parent_account_id: input.parentAccountId,
      industry: JSON.stringify(input.industry ?? []),
      annual_revenue: input.annualRevenue,
      website: input.website,
      linkedin: input.linkedin,
      sales_territory: input.salesTerritory,
      salesperson: input.salesperson.trim().toUpperCase(),
      office: input.office.toUpperCase(),
      last_contact: input.lastContact,
      mailing_country: input.mailingCountry.toUpperCase(),
      mailing_address1: input.mailingAddress1.toUpperCase(),
      mailing_address2: input.mailingAddress2.toUpperCase(),
      mailing_city: input.mailingCity.toUpperCase(),
      mailing_state: input.mailingState.toUpperCase(),
      mailing_postal: input.mailingPostal.toUpperCase(),
      physical_same_as_mailing: input.physicalSameAsMailing ? 1 : 0,
      physical_country: input.physicalCountry.toUpperCase(),
      physical_address1: input.physicalAddress1.toUpperCase(),
      physical_address2: input.physicalAddress2.toUpperCase(),
      physical_city: input.physicalCity.toUpperCase(),
      physical_state: input.physicalState.toUpperCase(),
      physical_postal: input.physicalPostal.toUpperCase(),
      logo_path: input.logoPath ?? null,
      tms_status:
        input.status === "Client"
          ? normalizeTmsStatus(input.tmsStatus)
          : input.tmsStatus || "",
      created_at: now,
      updated_at: now,
    });

  return getCompany(id)!;
}

export function updateCompany(id: string, input: CompanyInput): Company {
  const errors = validateCompany(input);
  if (errors.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }

  const now = new Date().toISOString();
  const result = getDb()
    .prepare(
      `UPDATE companies SET
        company_name = @company_name,
        status = @status,
        lead_source = @lead_source,
        client_type = @client_type,
        parent_account_id = @parent_account_id,
        industry = @industry,
        annual_revenue = @annual_revenue,
        website = @website,
        linkedin = @linkedin,
        sales_territory = @sales_territory,
        salesperson = @salesperson,
        office = @office,
        last_contact = @last_contact,
        mailing_country = @mailing_country,
        mailing_address1 = @mailing_address1,
        mailing_address2 = @mailing_address2,
        mailing_city = @mailing_city,
        mailing_state = @mailing_state,
        mailing_postal = @mailing_postal,
        physical_same_as_mailing = @physical_same_as_mailing,
        physical_country = @physical_country,
        physical_address1 = @physical_address1,
        physical_address2 = @physical_address2,
        physical_city = @physical_city,
        physical_state = @physical_state,
        physical_postal = @physical_postal,
        updated_at = @updated_at
      WHERE id = @id`
    )
    .run({
      id,
      company_name: input.companyName.trim().toUpperCase(),
      status: input.status,
      lead_source: input.leadSource,
      client_type: input.clientType,
      parent_account_id: input.parentAccountId,
      industry: JSON.stringify(input.industry ?? []),
      annual_revenue: input.annualRevenue,
      website: input.website,
      linkedin: input.linkedin,
      sales_territory: input.salesTerritory,
      salesperson: input.salesperson.trim().toUpperCase(),
      office: input.office.toUpperCase(),
      last_contact: input.lastContact,
      mailing_country: input.mailingCountry.toUpperCase(),
      mailing_address1: input.mailingAddress1.toUpperCase(),
      mailing_address2: input.mailingAddress2.toUpperCase(),
      mailing_city: input.mailingCity.toUpperCase(),
      mailing_state: input.mailingState.toUpperCase(),
      mailing_postal: input.mailingPostal.toUpperCase(),
      physical_same_as_mailing: input.physicalSameAsMailing ? 1 : 0,
      physical_country: input.physicalCountry.toUpperCase(),
      physical_address1: input.physicalAddress1.toUpperCase(),
      physical_address2: input.physicalAddress2.toUpperCase(),
      physical_city: input.physicalCity.toUpperCase(),
      physical_state: input.physicalState.toUpperCase(),
      physical_postal: input.physicalPostal.toUpperCase(),
      updated_at: now,
    });

  if (result.changes === 0) throw new Error("Company not found");
  return getCompany(id)!;
}

export function emptyCompanyInput(): CompanyInput {
  return {
    companyName: "",
    status: "New Lead",
    leadSource: "",
    clientType: "",
    parentAccountId: null,
    industry: [],
    annualRevenue: null,
    website: "",
    linkedin: "",
    salesTerritory: "",
    salesperson: "",
    office: "",
    lastContact: "",
    mailingCountry: "",
    mailingAddress1: "",
    mailingAddress2: "",
    mailingCity: "",
    mailingState: "",
    mailingPostal: "",
    physicalSameAsMailing: true,
    physicalCountry: "",
    physicalAddress1: "",
    physicalAddress2: "",
    physicalCity: "",
    physicalState: "",
    physicalPostal: "",
    tmsStatus: "",
  };
}