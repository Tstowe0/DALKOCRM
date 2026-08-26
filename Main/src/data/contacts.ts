import { getDb } from "@/lib/db";
import { newId } from "@/lib/ids";

export type Contact = {
  id: string;
  companyId: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  mobile: string;
  contactOwner: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ContactListRow = Contact & {
  companyName: string;
  companyStatus: string;
  salesperson: string;
  lastContact: string;
};

type ContactRow = {
  id: string;
  company_id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  mobile: string;
  contact_owner: string;
  is_primary?: number;
  created_at: string;
  updated_at: string;
};

function mapRow(row: ContactRow): Contact {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    title: row.title,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile ?? "",
    contactOwner: row.contact_owner,
    isPrimary: Boolean(row.is_primary),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listContacts(companyId: string): Contact[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM contacts WHERE company_id = ? ORDER BY name COLLATE NOCASE`
    )
    .all(companyId) as ContactRow[];
  return rows.map(mapRow);
}

export function listAllContactRows(): ContactListRow[] {
  const rows = getDb()
    .prepare(
      `SELECT c.*,
              co.company_name AS company_name,
              co.status AS company_status,
              co.salesperson AS salesperson,
              co.last_contact AS last_contact
         FROM contacts c
         JOIN companies co ON co.id = c.company_id
     ORDER BY c.name COLLATE NOCASE`
    )
    .all() as Array<
    ContactRow & {
      company_name: string;
      company_status: string;
      salesperson: string;
      last_contact: string;
    }
  >;

  return rows.map((row) => ({
    ...mapRow(row),
    companyName: row.company_name,
    companyStatus: row.company_status,
    salesperson: row.salesperson,
    lastContact: row.last_contact,
  }));
}

export function listContactOwners(): string[] {
  const rows = getDb()
    .prepare(
      `SELECT DISTINCT contact_owner FROM contacts WHERE contact_owner != '' ORDER BY contact_owner`
    )
    .all() as { contact_owner: string }[];
  return rows.map((r) => r.contact_owner);
}

export function getContact(id: string): Contact | null {
  const row = getDb().prepare(`SELECT * FROM contacts WHERE id = ?`).get(id) as
    | ContactRow
    | undefined;
  return row ? mapRow(row) : null;
}

function clearPrimaryForCompany(companyId: string, exceptId?: string) {
  if (exceptId) {
    getDb()
      .prepare(
        `UPDATE contacts SET is_primary = 0 WHERE company_id = ? AND id != ?`
      )
      .run(companyId, exceptId);
  } else {
    getDb()
      .prepare(`UPDATE contacts SET is_primary = 0 WHERE company_id = ?`)
      .run(companyId);
  }
}

export function createContact(
  companyId: string,
  input: {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    contactOwner?: string;
    isPrimary?: boolean;
  }
): Contact {
  const now = new Date().toISOString();
  const id = newId("ct");
  const makePrimary = Boolean(input.isPrimary);
  if (makePrimary) clearPrimaryForCompany(companyId);

  getDb()
    .prepare(
      `INSERT INTO contacts (
        id, company_id, name, title, email, phone, mobile, contact_owner, is_primary, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      companyId,
      input.name.toUpperCase(),
      (input.title ?? "").toUpperCase(),
      input.email ?? "",
      input.phone ?? "",
      input.mobile ?? "",
      (input.contactOwner ?? "").toUpperCase(),
      makePrimary ? 1 : 0,
      now,
      now
    );
  return getContact(id)!;
}

export function updateContact(
  id: string,
  input: {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    contactOwner?: string;
    isPrimary?: boolean;
    companyId?: string;
  }
): Contact {
  const existing = getContact(id);
  if (!existing) throw new Error("Contact not found");
  const companyId = input.companyId ?? existing.companyId;
  const now = new Date().toISOString();
  const isPrimary =
    input.isPrimary === undefined ? existing.isPrimary : Boolean(input.isPrimary);
  if (isPrimary) clearPrimaryForCompany(companyId, id);

  getDb()
    .prepare(
      `UPDATE contacts SET
        company_id = ?, name = ?, title = ?, email = ?, phone = ?, mobile = ?,
        contact_owner = ?, is_primary = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      companyId,
      input.name.toUpperCase(),
      (input.title ?? "").toUpperCase(),
      input.email ?? "",
      input.phone ?? "",
      input.mobile ?? "",
      (input.contactOwner ?? "").toUpperCase(),
      isPrimary ? 1 : 0,
      now,
      id
    );
  return getContact(id)!;
}

export function deleteContact(id: string): void {
  getDb().prepare(`DELETE FROM contacts WHERE id = ?`).run(id);
}
