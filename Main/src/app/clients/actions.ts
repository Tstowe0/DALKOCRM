"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCompany,
  deleteCompany,
  emptyCompanyInput,
  updateCompanyField,
  type CompanyInput,
} from "@/data/companies";
import { DEMO_USER } from "@/lib/paths";
import { parseCurrency } from "@/domain/formatting";
import { isClientStatus, normalizeTmsStatus } from "@/domain/status";

function revalidateClient(companyId?: string) {
  revalidatePath("/clients");
  revalidatePath("/leads");
  revalidatePath("/prospects");
  revalidatePath("/contacts");
  revalidatePath("/campaigns");
  revalidatePath("/claims");
  if (companyId) {
    revalidatePath(`/clients/${companyId}`);
    revalidatePath(`/leads/${companyId}`);
    revalidatePath(`/prospects/${companyId}`);
  }
}

function formToCompanyInput(formData: FormData): CompanyInput {
  const industries = formData.getAll("industry").map(String).filter(Boolean);
  const revenueRaw = String(formData.get("annualRevenue") ?? "").trim();
  return {
    ...emptyCompanyInput(),
    companyName: String(formData.get("companyName") ?? ""),
    status: "Client",
    tmsStatus: normalizeTmsStatus(String(formData.get("tmsStatus") ?? "Active")),
    leadSource: String(formData.get("leadSource") ?? ""),
    clientType: String(formData.get("clientType") ?? ""),
    parentAccountId: String(formData.get("parentAccountId") ?? "") || null,
    industry: industries,
    annualRevenue: parseCurrency(revenueRaw),
    website: String(formData.get("website") ?? ""),
    linkedin: String(formData.get("linkedin") ?? ""),
    salesTerritory: String(formData.get("salesTerritory") ?? ""),
    salesperson: String(formData.get("salesperson") ?? ""),
    office: String(formData.get("office") ?? ""),
    lastContact: String(formData.get("lastContact") ?? ""),
    mailingCountry: String(formData.get("mailingCountry") ?? ""),
    mailingAddress1: String(formData.get("mailingAddress1") ?? ""),
    mailingAddress2: String(formData.get("mailingAddress2") ?? ""),
    mailingCity: String(formData.get("mailingCity") ?? ""),
    mailingState: String(formData.get("mailingState") ?? ""),
    mailingPostal: String(formData.get("mailingPostal") ?? ""),
    physicalSameAsMailing: formData.get("physicalSameAsMailing") === "on",
    physicalCountry: String(formData.get("physicalCountry") ?? ""),
    physicalAddress1: String(formData.get("physicalAddress1") ?? ""),
    physicalAddress2: String(formData.get("physicalAddress2") ?? ""),
    physicalCity: String(formData.get("physicalCity") ?? ""),
    physicalState: String(formData.get("physicalState") ?? ""),
    physicalPostal: String(formData.get("physicalPostal") ?? ""),
  };
}

export async function saveNewClientAction(formData: FormData) {
  const input = formToCompanyInput(formData);
  if (!isClientStatus(input.status)) {
    throw new Error("Status must be Client");
  }
  if (input.physicalSameAsMailing) {
    input.physicalCountry = input.mailingCountry;
    input.physicalAddress1 = input.mailingAddress1;
    input.physicalAddress2 = input.mailingAddress2;
    input.physicalCity = input.mailingCity;
    input.physicalState = input.mailingState;
    input.physicalPostal = input.mailingPostal;
  }
  const company = createCompany(input);
  revalidateClient(company.id);
  redirect(`/clients/${company.id}`);
}

export async function saveClientFieldAction(
  id: string,
  field: string,
  value: string | string[]
) {
  let next: string | string[] | number | boolean | null = value;
  if (field === "annualRevenue") {
    next = parseCurrency(String(value));
  }
  if (field === "physicalSameAsMailing") {
    next =
      value === "true" ||
      value === "on" ||
      value === "1" ||
      value === "Yes";
  }
  if (field === "industry" && typeof value === "string") {
    next = value ? value.split("|").filter(Boolean) : [];
  }
  updateCompanyField(id, field, next);
  revalidateClient(id);
}

export async function deleteClientAction(id: string) {
  deleteCompany(id);
  revalidateClient();
}

export async function massDeleteClientsAction(ids: string[]) {
  const errors: string[] = [];
  for (const id of ids) {
    try {
      deleteCompany(id);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  revalidateClient();
  if (errors.length) throw new Error(errors[0]);
}

export async function importClientsCsvAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Select a CSV file to import");
  }
  const text = (await file.text()).replace(/^\uFEFF/, "");
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) throw new Error("CSV has no data rows");

  function splitCsv(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out.map((c) => c.trim());
  }

  const headers = splitCsv(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => headers.indexOf(name.toLowerCase());

  let created = 0;
  for (const line of lines.slice(1)) {
    const cols = splitCsv(line);
    const get = (name: string) => {
      const i = idx(name);
      return i >= 0 ? cols[i] ?? "" : "";
    };
    const companyName =
      get("company name") || get("company") || get("companyname");
    if (!companyName.trim()) continue;

    const statusCell = get("status");
    const tms =
      statusCell === "Deactivated" || statusCell === "Active"
        ? statusCell
        : normalizeTmsStatus(get("tms status") || get("tms_status") || "Active");
    const industryRaw = get("industry");
    const industries = industryRaw
      ? industryRaw
          .split(/[;|]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    createCompany({
      ...emptyCompanyInput(),
      companyName,
      status: "Client",
      tmsStatus: tms,
      leadSource:
        get("client source") ||
        get("prospect source") ||
        get("source") ||
        get("lead source"),
      clientType: get("client type") || "Standard",
      industry: industries,
      annualRevenue: parseCurrency(get("annual revenue")),
      website: get("website"),
      linkedin: get("linked inn") || get("linkedin"),
      salesTerritory: get("sales territory"),
      salesperson: get("salesperson") || DEMO_USER.fullName,
      office: get("office"),
      lastContact: get("last contacted") || get("last contact"),
      mailingCountry:
        get("mailing address: country") || get("mailing country"),
      mailingAddress1:
        get("mailing address: address 1") || get("mailing address1"),
      mailingAddress2:
        get("mailing address: address 2") || get("mailing address2"),
      mailingCity: get("mailing address: city") || get("mailing city"),
      mailingState: get("mailing address: state") || get("mailing state"),
      mailingPostal:
        get("mailing address: postal") || get("mailing postal"),
      physicalSameAsMailing: true,
    });
    created++;
  }

  revalidateClient();
  return { created };
}
