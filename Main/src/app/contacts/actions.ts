"use server";

import { revalidatePath } from "next/cache";
import {
  createContact,
  deleteContact,
  getContact,
  updateContact,
} from "@/data/contacts";
import { getCompany } from "@/data/companies";
import { getDb } from "@/lib/db";
import { addChangeLog } from "@/data/changeLogs";
import { DEMO_USER } from "@/lib/paths";

function revalidateContacts(companyId?: string) {
  revalidatePath("/contacts");
  revalidatePath("/leads");
  revalidatePath("/prospects");
  revalidatePath("/clients");
  if (companyId) {
    revalidatePath(`/leads/${companyId}`);
    revalidatePath(`/prospects/${companyId}`);
    revalidatePath(`/clients/${companyId}`);
  }
}

function findCompanyIdByName(name: string): string | null {
  const row = getDb()
    .prepare(
      `SELECT id FROM companies WHERE upper(company_name) = upper(?) LIMIT 1`
    )
    .get(name.trim()) as { id: string } | undefined;
  return row?.id ?? null;
}

export async function createGlobalContactAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!companyId) throw new Error("Company is required");
  if (!name) throw new Error("Name is required");
  if (!getCompany(companyId)) throw new Error("Company not found");

  createContact(companyId, {
    name,
    title: String(formData.get("title") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    mobile: String(formData.get("mobile") ?? ""),
    contactOwner:
      String(formData.get("contactOwner") ?? "").trim() || DEMO_USER.fullName,
    isPrimary: formData.get("isPrimary") === "on",
  });
  addChangeLog(companyId, `Contact added: ${name.toUpperCase()}`);
  revalidateContacts(companyId);
}

export async function updateGlobalContactAction(
  contactId: string,
  formData: FormData
) {
  const existing = getContact(contactId);
  if (!existing) throw new Error("Contact not found");
  const companyId = String(formData.get("companyId") ?? existing.companyId).trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!companyId) throw new Error("Company is required");
  if (!name) throw new Error("Name is required");
  if (!getCompany(companyId)) throw new Error("Company not found");

  updateContact(contactId, {
    companyId,
    name,
    title: String(formData.get("title") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    mobile: String(formData.get("mobile") ?? ""),
    contactOwner:
      String(formData.get("contactOwner") ?? "").trim() || DEMO_USER.fullName,
    isPrimary: formData.get("isPrimary") === "on",
  });
  addChangeLog(companyId, `Contact updated: ${name.toUpperCase()}`);
  revalidateContacts(companyId);
  if (companyId !== existing.companyId) {
    revalidateContacts(existing.companyId);
  }
}

export async function deleteGlobalContactAction(contactId: string) {
  const existing = getContact(contactId);
  if (!existing) return;
  deleteContact(contactId);
  addChangeLog(existing.companyId, "Contact deleted");
  revalidateContacts(existing.companyId);
}

export async function massDeleteContactsAction(ids: string[]) {
  for (const id of ids) {
    const existing = getContact(id);
    if (!existing) continue;
    deleteContact(id);
    addChangeLog(existing.companyId, "Contact deleted");
  }
  revalidateContacts();
}

export async function importContactsCsvAction(formData: FormData) {
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
    const name = get("name") || get("contact name");
    const companyName = get("company") || get("company name");
    if (!name.trim() || !companyName.trim()) continue;
    const companyId = findCompanyIdByName(companyName);
    if (!companyId) continue;

    const primaryRaw = get("primary contact") || get("primary");
    createContact(companyId, {
      name,
      title: get("title"),
      email: get("email") || get("primary email"),
      phone: get("phone") || get("office phone"),
      mobile: get("mobile"),
      contactOwner: get("owner") || get("contact owner") || DEMO_USER.fullName,
      isPrimary: /^(y|yes|1|true|✓)$/i.test(primaryRaw.trim()),
    });
    created++;
  }

  revalidateContacts();
  return { created };
}
