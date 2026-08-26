"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCompany,
  deleteCompany,
  emptyCompanyInput,
  setCompanyLogo,
  setCompanyStatus,
  updateCompanyField,
  type CompanyInput,
} from "@/data/companies";
import { createContact, deleteContact, updateContact } from "@/data/contacts";
import {
  createAttachment,
  deleteAttachment,
  renameAttachment,
} from "@/data/attachments";
import {
  createComposedEmail,
  createUploadedEmail,
  deleteEmail,
} from "@/data/emails";
import {
  createActivity,
  deleteActivity,
  updateActivity,
} from "@/data/activities";
import { createCampaign, deleteCampaign } from "@/data/campaigns";
import {
  createContactLog,
  deleteContactLog,
  updateContactLog,
} from "@/data/contactLogs";
import { createNote, deleteNote } from "@/data/notes";
import { addChangeLog } from "@/data/changeLogs";
import { DEMO_USER, UPLOADS_DIR } from "@/lib/paths";
import { parseCurrency, ATTACHMENT_FILE_NAME_MAX } from "@/domain/formatting";
import { isLeadStatus } from "@/domain/status";

function revalidateCompany(companyId?: string) {
  revalidatePath("/leads");
  revalidatePath("/prospects");
  revalidatePath("/clients");
  revalidatePath("/contacts");
  revalidatePath("/campaigns");
  revalidatePath("/claims");
  if (companyId) {
    revalidatePath(`/leads/${companyId}`);
    revalidatePath(`/prospects/${companyId}`);
    revalidatePath(`/clients/${companyId}`);
  }
}

function formToCompanyInput(formData: FormData): CompanyInput {
  const industries = formData.getAll("industry").map(String).filter(Boolean);
  const revenueRaw = String(formData.get("annualRevenue") ?? "").trim();
  return {
    ...emptyCompanyInput(),
    companyName: String(formData.get("companyName") ?? ""),
    status: String(formData.get("status") ?? "New Lead"),
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

export async function saveNewLeadAction(formData: FormData) {
  const input = formToCompanyInput(formData);
  if (!isLeadStatus(input.status)) {
    throw new Error("Status must be New Lead, Contact, or Qualify");
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
  revalidateCompany();
  redirect(`/leads/${company.id}`);
}

export async function saveLeadFieldAction(
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
  revalidateCompany(id);
}

export async function uploadLogoAction(companyId: string, formData: FormData) {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Select an image to upload");
  }
  const ext = path.extname(file.name) || ".png";
  const dir = path.join(UPLOADS_DIR, companyId, "logo");
  fs.mkdirSync(dir, { recursive: true });
  const stored = `logo${ext}`;
  fs.writeFileSync(path.join(dir, stored), Buffer.from(await file.arrayBuffer()));
  setCompanyLogo(companyId, `${companyId}/logo/${stored}`);
  revalidateCompany(companyId);
}

export async function deleteLeadAction(id: string) {
  deleteCompany(id);
  revalidateCompany();
}

export async function convertLeadToProspectAction(id: string) {
  setCompanyStatus(id, "Present");
  revalidateCompany(id);
  redirect(`/prospects/${id}`);
}

export async function convertLeadToClientAction(id: string) {
  setCompanyStatus(id, "Client");
  revalidateCompany(id);
  redirect(`/clients/${id}`);
}

export async function massDeleteLeadsAction(ids: string[]) {
  const errors: string[] = [];
  for (const id of ids) {
    try {
      deleteCompany(id);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  revalidateCompany();
  if (errors.length) throw new Error(errors[0]);
}

export async function massConvertLeadsAction(ids: string[]) {
  for (const id of ids) {
    setCompanyStatus(id, "Client");
  }
  revalidateCompany();
}

export async function addContactAction(companyId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  createContact(companyId, {
    name,
    title: String(formData.get("title") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    mobile: String(formData.get("mobile") ?? ""),
    contactOwner: String(formData.get("contactOwner") ?? DEMO_USER.fullName),
    isPrimary: formData.get("isPrimary") === "on",
  });
  addChangeLog(companyId, `Contact added: ${name.toUpperCase()}`);
  revalidateCompany(companyId);
}

export async function updateContactAction(
  companyId: string,
  contactId: string,
  formData: FormData
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");
  updateContact(contactId, {
    name,
    title: String(formData.get("title") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    mobile: String(formData.get("mobile") ?? ""),
    contactOwner: String(formData.get("contactOwner") ?? DEMO_USER.fullName),
    isPrimary: formData.get("isPrimary") === "on",
  });
  addChangeLog(companyId, `Contact updated: ${name.toUpperCase()}`);
  revalidateCompany(companyId);
}

export async function removeContactAction(companyId: string, contactId: string) {
  deleteContact(contactId);
  addChangeLog(companyId, "Contact deleted");
  revalidateCompany(companyId);
}

export async function uploadAttachmentAction(
  companyId: string,
  formData: FormData
) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("A file must be uploaded");
  }
  const fileName = String(formData.get("fileName") ?? file.name).trim();
  if (!fileName) throw new Error("File name is required");
  if (fileName.length > ATTACHMENT_FILE_NAME_MAX) {
    throw new Error(
      `Character limit of ${ATTACHMENT_FILE_NAME_MAX} exceeded`
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  await createAttachment({
    companyId,
    fileName,
    mimeType: file.type || "application/octet-stream",
    uploadedBy: DEMO_USER.fullName,
    bytes,
  });
  revalidateCompany(companyId);
}

export async function renameAttachmentAction(
  companyId: string,
  attachmentId: string,
  formData: FormData
) {
  const fileName = String(formData.get("fileName") ?? "").trim();
  if (fileName.length > ATTACHMENT_FILE_NAME_MAX) {
    throw new Error(
      `Character limit of ${ATTACHMENT_FILE_NAME_MAX} exceeded`
    );
  }
  renameAttachment(attachmentId, fileName);
  revalidateCompany(companyId);
}

export async function deleteAttachmentAction(
  companyId: string,
  attachmentId: string
) {
  deleteAttachment(attachmentId);
  revalidateCompany(companyId);
}

/**
 * CSV import — columns aligned to Leads export / Company Information fields.
 * Full “same as current CRM” Excel import rules are not in Library (blocked).
 */
export async function importLeadsCsvAction(formData: FormData) {
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
    const companyName = get("company name") || get("company") || get("companyname");
    if (!companyName.trim()) continue;

    const statusRaw = get("status") || "New Lead";
    const status = isLeadStatus(statusRaw) ? statusRaw : "New Lead";
    const industryRaw = get("industry");
    const industries = industryRaw
      ? industryRaw.split(/[;|]/).map((s) => s.trim()).filter(Boolean)
      : [];

    createCompany({
      ...emptyCompanyInput(),
      companyName,
      status,
      leadSource: get("prospect source") || get("source") || get("lead source"),
      clientType: get("client type") || "Standard",
      industry: industries,
      annualRevenue: parseCurrency(get("annual revenue")),
      website: get("website"),
      linkedin: get("linked inn") || get("linkedin"),
      salesTerritory: get("sales territory"),
      salesperson: get("salesperson") || DEMO_USER.fullName,
      office: get("office"),
      lastContact: get("last contacted") || get("last contact"),
      mailingCountry: get("mailing address: country") || get("mailing country"),
      mailingAddress1: get("mailing address: address 1") || get("mailing address1"),
      mailingAddress2: get("mailing address: address 2") || get("mailing address2"),
      mailingCity: get("mailing address: city") || get("mailing city"),
      mailingState: get("mailing address: state") || get("mailing state"),
      mailingPostal: get("mailing address: postal") || get("mailing postal"),
      physicalSameAsMailing: true,
    });
    created++;
  }

  revalidateCompany();
  return { created };
}

function revalidateLead(companyId: string) {
  revalidateCompany(companyId);
}

export async function composeEmailAction(
  companyId: string,
  payload: {
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
  }
) {
  createComposedEmail(companyId, {
    subject: payload.subject,
    toAddress: payload.to,
    ccAddress: payload.cc,
    bccAddress: payload.bcc,
    body: payload.body,
  });
  addChangeLog(companyId, `Email composed: ${payload.subject}`);
  revalidateLead(companyId);
}

export async function uploadEmailAction(companyId: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("A file must be uploaded");
  }
  const dir = path.join(UPLOADS_DIR, companyId, "emails");
  fs.mkdirSync(dir, { recursive: true });
  const stored = `${Date.now()}-${file.name}`;
  fs.writeFileSync(path.join(dir, stored), Buffer.from(await file.arrayBuffer()));
  createUploadedEmail(companyId, {
    fileName: file.name,
    storedName: `${companyId}/emails/${stored}`,
    subject: file.name,
  });
  addChangeLog(companyId, `Email uploaded: ${file.name}`);
  revalidateLead(companyId);
}

export async function deleteEmailAction(companyId: string, emailId: string) {
  deleteEmail(emailId);
  addChangeLog(companyId, "Email deleted");
  revalidateLead(companyId);
}

export async function createActivityAction(
  companyId: string,
  formData: FormData
) {
  createActivity(companyId, {
    type: String(formData.get("type") ?? "Task"),
    dueDate: String(formData.get("dueDate") ?? ""),
    priority: String(formData.get("priority") ?? ""),
    purpose: String(formData.get("purpose") ?? ""),
    status: String(formData.get("status") ?? "OPEN"),
    activityOwner: String(formData.get("activityOwner") ?? DEMO_USER.fullName),
  });
  addChangeLog(companyId, `Activity added: ${String(formData.get("type"))}`);
  revalidateLead(companyId);
}

export async function updateActivityAction(
  companyId: string,
  activityId: string,
  formData: FormData
) {
  updateActivity(activityId, {
    type: String(formData.get("type") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    priority: String(formData.get("priority") ?? ""),
    purpose: String(formData.get("purpose") ?? ""),
    status: String(formData.get("status") ?? ""),
    activityOwner: String(formData.get("activityOwner") ?? ""),
  });
  addChangeLog(companyId, "Activity updated");
  revalidateLead(companyId);
}

export async function deleteActivityAction(
  companyId: string,
  activityId: string
) {
  deleteActivity(activityId);
  addChangeLog(companyId, "Activity deleted");
  revalidateLead(companyId);
}

export async function addCampaignAction(companyId: string, formData: FormData) {
  const campaignName = String(formData.get("campaignName") ?? "").trim();
  if (!campaignName) throw new Error("Campaign Name is required");
  createCampaign(companyId, {
    campaignName,
    templateName: String(formData.get("templateName") ?? ""),
  });
  addChangeLog(companyId, `Campaign added: ${campaignName.toUpperCase()}`);
  revalidateLead(companyId);
}

export async function removeCampaignAction(
  companyId: string,
  campaignId: string
) {
  deleteCampaign(campaignId);
  addChangeLog(companyId, "Campaign removed");
  revalidateLead(companyId);
}

export async function createContactLogAction(
  companyId: string,
  formData: FormData
) {
  const subject = String(formData.get("subject") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const logDate = String(formData.get("logDate") ?? "").trim();
  if (!contactName || !subject || !logDate) {
    throw new Error("Contact, Subject, and Date are required");
  }
  createContactLog(companyId, {
    contactName,
    logType: String(formData.get("logType") ?? "Call"),
    purpose: String(formData.get("purpose") ?? ""),
    subject,
    logDate,
    status: String(formData.get("status") ?? ""),
    details: String(formData.get("details") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
  });
  addChangeLog(companyId, `Contact log added: ${subject.toUpperCase()}`);
  revalidateLead(companyId);
}

export async function updateContactLogAction(
  companyId: string,
  logId: string,
  formData: FormData
) {
  updateContactLog(logId, {
    contactName: String(formData.get("contactName") ?? ""),
    logType: String(formData.get("logType") ?? ""),
    purpose: String(formData.get("purpose") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    logDate: String(formData.get("logDate") ?? ""),
    status: String(formData.get("status") ?? ""),
    details: String(formData.get("details") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
  });
  addChangeLog(companyId, "Contact log updated");
  revalidateLead(companyId);
}

export async function deleteContactLogAction(companyId: string, logId: string) {
  deleteContactLog(logId);
  addChangeLog(companyId, "Contact log deleted");
  revalidateLead(companyId);
}

export async function addNoteAction(companyId: string, body: string) {
  createNote(companyId, body);
  addChangeLog(companyId, "Note added");
  revalidateLead(companyId);
}

export async function deleteNoteAction(companyId: string, noteId: string) {
  deleteNote(noteId);
  addChangeLog(companyId, "Note deleted");
  revalidateLead(companyId);
}