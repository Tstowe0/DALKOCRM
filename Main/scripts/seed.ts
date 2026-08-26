/**
 * Resets local SQLite demo data. Schema aligned with src/lib/db.ts migrate().
 * Run: npm run db:seed
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "mycrm.sqlite");
const UPLOADS_DIR = path.join(ROOT, "uploads");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE companies (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'New Lead',
    lead_source TEXT NOT NULL DEFAULT '',
    client_type TEXT NOT NULL DEFAULT '',
    parent_account_id TEXT,
    industry TEXT NOT NULL DEFAULT '[]',
    annual_revenue REAL,
    website TEXT NOT NULL DEFAULT '',
    linkedin TEXT NOT NULL DEFAULT '',
    sales_territory TEXT NOT NULL DEFAULT '',
    salesperson TEXT NOT NULL DEFAULT '',
    office TEXT NOT NULL DEFAULT '',
    last_contact TEXT NOT NULL DEFAULT '',
    mailing_country TEXT NOT NULL DEFAULT '',
    mailing_address1 TEXT NOT NULL DEFAULT '',
    mailing_address2 TEXT NOT NULL DEFAULT '',
    mailing_city TEXT NOT NULL DEFAULT '',
    mailing_state TEXT NOT NULL DEFAULT '',
    mailing_postal TEXT NOT NULL DEFAULT '',
    physical_same_as_mailing INTEGER NOT NULL DEFAULT 1,
    physical_country TEXT NOT NULL DEFAULT '',
    physical_address1 TEXT NOT NULL DEFAULT '',
    physical_address2 TEXT NOT NULL DEFAULT '',
    physical_city TEXT NOT NULL DEFAULT '',
    physical_state TEXT NOT NULL DEFAULT '',
    physical_postal TEXT NOT NULL DEFAULT '',
    logo_path TEXT,
    tms_status TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (parent_account_id) REFERENCES companies(id)
  );

  CREATE TABLE contacts (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    mobile TEXT NOT NULL DEFAULT '',
    contact_owner TEXT NOT NULL DEFAULT '',
    is_primary INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE TABLE attachments (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    uploaded_by TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE TABLE emails (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    sent_at TEXT NOT NULL,
    to_address TEXT NOT NULL DEFAULT '',
    from_address TEXT NOT NULL DEFAULT '',
    cc_address TEXT NOT NULL DEFAULT '',
    bcc_address TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    has_attachment INTEGER NOT NULL DEFAULT 0,
    stored_name TEXT,
    file_name TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE TABLE activities (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    type TEXT NOT NULL,
    due_date TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT '',
    purpose TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT '',
    activity_owner TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE TABLE campaigns (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    campaign_name TEXT NOT NULL DEFAULT '',
    template_name TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE TABLE claims (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT '',
    topic TEXT NOT NULL DEFAULT '',
    load_no TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    modified_by TEXT NOT NULL DEFAULT '',
    modified_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE TABLE contact_logs (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    contact_name TEXT NOT NULL DEFAULT '',
    log_type TEXT NOT NULL DEFAULT '',
    purpose TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '',
    log_date TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '',
    start_time TEXT NOT NULL DEFAULT '',
    end_time TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    body TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE TABLE change_logs (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    modification TEXT NOT NULL,
    modified_by TEXT NOT NULL,
    modified_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );
`);

const now = new Date().toISOString();

const insertCompany = db.prepare(`
  INSERT INTO companies (
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
  )
`);

function company(row: Record<string, unknown>) {
  insertCompany.run({
    physical_country: "",
    physical_address1: "",
    physical_address2: "",
    physical_city: "",
    physical_state: "",
    physical_postal: "",
    logo_path: null,
    tms_status: "",
    created_at: now,
    updated_at: now,
    ...row,
  });
}

company({
  id: "co-parent-1",
  company_name: "NORTHSTAR RAIL HOLDINGS",
  status: "Client",
  lead_source: "Client Referral",
  client_type: "Parent",
  parent_account_id: null,
  industry: JSON.stringify(["Rail", "Logistics Company"]),
  annual_revenue: 25000000,
  website: "https://example.com/northstar",
  linkedin: "",
  sales_territory: "Northeast",
  salesperson: "DEMO SALESPERSON",
  office: "PITTSBURGH",
  last_contact: "08/01/2025",
  mailing_country: "UNITED STATES",
  mailing_address1: "100 RAIL WAY",
  mailing_address2: "",
  mailing_city: "PITTSBURGH",
  mailing_state: "PA",
  mailing_postal: "15222",
  physical_same_as_mailing: 1,
  tms_status: "ACTIVE",
});

company({
  id: "co-client-2",
  company_name: "RIVERBEND FOUNDRY",
  status: "Client",
  lead_source: "Supplier Referral",
  client_type: "Standard",
  parent_account_id: null,
  industry: JSON.stringify(["Manufacturing", "Rail – Parts"]),
  annual_revenue: 7200000,
  website: "https://example.com/riverbend",
  linkedin: "",
  sales_territory: "Northeast",
  salesperson: "ALEX MORGAN",
  office: "PITTSBURGH",
  last_contact: "06/15/2025",
  mailing_country: "UNITED STATES",
  mailing_address1: "3 CASTING LN",
  mailing_address2: "",
  mailing_city: "BRADDOCK",
  mailing_state: "PA",
  mailing_postal: "15104",
  physical_same_as_mailing: 1,
  tms_status: "Deactivated",
});

company({
  id: "co-lead-1",
  company_name: "ALLEGHENY STEEL PARTS",
  status: "New Lead",
  lead_source: "Trade Show",
  client_type: "Standard",
  parent_account_id: null,
  industry: JSON.stringify(["Rail – Parts", "Manufacturing"]),
  annual_revenue: 4200000,
  website: "https://example.com/allegheny",
  linkedin: "",
  sales_territory: "Northeast",
  salesperson: "DEMO SALESPERSON",
  office: "PITTSBURGH",
  last_contact: "08/10/2025",
  mailing_country: "UNITED STATES",
  mailing_address1: "55 FOUNDRY RD",
  mailing_address2: "",
  mailing_city: "HOMESTEAD",
  mailing_state: "PA",
  mailing_postal: "15120",
  physical_same_as_mailing: 1,
});

company({
  id: "co-lead-2",
  company_name: "GREAT LAKES SHORTLINE",
  status: "Contact",
  lead_source: "Cold Call",
  client_type: "Subsidiary",
  parent_account_id: "co-parent-1",
  industry: JSON.stringify(["Rail – Shortline"]),
  annual_revenue: 8900000,
  website: "",
  linkedin: "",
  sales_territory: "Northwest",
  salesperson: "ALEX MORGAN",
  office: "CHICAGO",
  last_contact: "07/22/2025",
  mailing_country: "UNITED STATES",
  mailing_address1: "12 LAKEFRONT AVE",
  mailing_address2: "SUITE 400",
  mailing_city: "CHICAGO",
  mailing_state: "IL",
  mailing_postal: "60601",
  physical_same_as_mailing: 1,
});

company({
  id: "co-lead-3",
  company_name: "SUMMIT POWER SERVICES",
  status: "Qualify",
  lead_source: "Web Research",
  client_type: "Standard",
  parent_account_id: null,
  industry: JSON.stringify(["Power Generation"]),
  annual_revenue: 6100000,
  website: "https://example.com/summit",
  linkedin: "",
  sales_territory: "Southeast",
  salesperson: "DEMO SALESPERSON",
  office: "ATLANTA",
  last_contact: "08/05/2025",
  mailing_country: "UNITED STATES",
  mailing_address1: "900 ENERGY BLVD",
  mailing_address2: "",
  mailing_city: "ATLANTA",
  mailing_state: "GA",
  mailing_postal: "30308",
  physical_same_as_mailing: 1,
});

company({
  id: "co-prospect-1",
  company_name: "MIDWEST AGGREGATES LLC",
  status: "Present",
  lead_source: "Trade Show",
  client_type: "Standard",
  parent_account_id: null,
  industry: JSON.stringify(["Cement", "Mining"]),
  annual_revenue: 12500000,
  website: "https://example.com/midwest-agg",
  linkedin: "",
  sales_territory: "Northwest",
  salesperson: "DEMO SALESPERSON",
  office: "CHICAGO",
  last_contact: "08/12/2025",
  mailing_country: "UNITED STATES",
  mailing_address1: "440 QUARRY RD",
  mailing_address2: "",
  mailing_city: "JOLIET",
  mailing_state: "IL",
  mailing_postal: "60435",
  physical_same_as_mailing: 1,
});

company({
  id: "co-prospect-2",
  company_name: "COASTAL CHEMICALS INC",
  status: "Proposal",
  lead_source: "Client Referral",
  client_type: "Standard",
  parent_account_id: null,
  industry: JSON.stringify(["Chemicals"]),
  annual_revenue: 9800000,
  website: "",
  linkedin: "",
  sales_territory: "Southeast",
  salesperson: "ALEX MORGAN",
  office: "HOUSTON",
  last_contact: "08/08/2025",
  mailing_country: "UNITED STATES",
  mailing_address1: "17 HARBOR DR",
  mailing_address2: "BLDG C",
  mailing_city: "HOUSTON",
  mailing_state: "TX",
  mailing_postal: "77002",
  physical_same_as_mailing: 1,
});

company({
  id: "co-prospect-3",
  company_name: "PACIFIC TIMBER TRANSPORT",
  status: "Negotiate",
  lead_source: "Email Marketing",
  client_type: "Standard",
  parent_account_id: null,
  industry: JSON.stringify(["Wood Product Manufact", "Logistics Company"]),
  annual_revenue: 15400000,
  website: "https://example.com/pacific-timber",
  linkedin: "",
  sales_territory: "Southwest",
  salesperson: "DEMO SALESPERSON",
  office: "PORTLAND",
  last_contact: "08/01/2025",
  mailing_country: "UNITED STATES",
  mailing_address1: "88 FOREST WAY",
  mailing_address2: "",
  mailing_city: "PORTLAND",
  mailing_state: "OR",
  mailing_postal: "97201",
  physical_same_as_mailing: 1,
});

db.prepare(
  `INSERT INTO contacts (
    id, company_id, name, title, email, phone, mobile, contact_owner, is_primary, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  "ct-1",
  "co-lead-1",
  "JORDAN LEE",
  "PURCHASING MANAGER",
  "jordan.lee@allegheny.example",
  "(412) 555-0101",
  "(412) 555-0199",
  "DEMO SALESPERSON",
  1,
  now,
  now
);

db.prepare(
  `INSERT INTO contacts (
    id, company_id, name, title, email, phone, mobile, contact_owner, is_primary, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  "ct-2",
  "co-lead-2",
  "SAM RIVERA",
  "GM",
  "sam.rivera@greatlakes.example",
  "(312) 555-0144",
  "",
  "ALEX MORGAN",
  1,
  now,
  now
);

db.prepare(
  `INSERT INTO contacts (
    id, company_id, name, title, email, phone, mobile, contact_owner, is_primary, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  "ct-p1",
  "co-prospect-1",
  "TAYLOR BROOKS",
  "VP OPERATIONS",
  "taylor.brooks@midwestagg.example",
  "(815) 555-0160",
  "(815) 555-0161",
  "DEMO SALESPERSON",
  1,
  now,
  now
);

db.prepare(
  `INSERT INTO contacts (
    id, company_id, name, title, email, phone, mobile, contact_owner, is_primary, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  "ct-p2",
  "co-prospect-2",
  "MORGAN CHEN",
  "PROCUREMENT LEAD",
  "morgan.chen@coastalchem.example",
  "(713) 555-0177",
  "",
  "ALEX MORGAN",
  1,
  now,
  now
);

db.prepare(
  `INSERT INTO contacts (
    id, company_id, name, title, email, phone, mobile, contact_owner, is_primary, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  "ct-c1",
  "co-parent-1",
  "PAT REEVES",
  "ACCOUNT MANAGER",
  "pat.reeves@northstar.example",
  "(412) 555-0200",
  "(412) 555-0201",
  "DEMO SALESPERSON",
  1,
  now,
  now
);

db.prepare(
  `INSERT INTO emails (
    id, company_id, subject, sent_at, to_address, from_address,
    cc_address, bcc_address, body, has_attachment, stored_name, file_name, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, '', '', ?, 0, NULL, NULL, ?)`
).run(
  "em-1",
  "co-lead-1",
  "Intro call follow-up",
  now,
  "jordan.lee@allegheny.example",
  "demo.salesperson@dalko.local",
  "Thanks for meeting at the trade show. Looking forward to next steps.",
  now
);

db.prepare(
  `INSERT INTO activities (
    id, company_id, type, due_date, priority, purpose, status,
    activity_owner, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  "act-1",
  "co-lead-1",
  "Call",
  "08/20/2025",
  "HIGH",
  "DISCOVERY",
  "OPEN",
  "DEMO SALESPERSON",
  now,
  now
);

db.prepare(
  `INSERT INTO campaigns (id, company_id, campaign_name, template_name, created_at)
   VALUES (?, ?, ?, ?, ?)`
).run("cmp-1", "co-lead-1", "Q3 RAIL OUTREACH", "INTRO EMAIL V2", now);

db.prepare(
  `INSERT INTO campaigns (id, company_id, campaign_name, template_name, created_at)
   VALUES (?, ?, ?, ?, ?)`
).run("cmp-2", "co-prospect-1", "AGGREGATES SPRING PUSH", "FOLLOW UP V1", now);

db.prepare(
  `INSERT INTO campaigns (id, company_id, campaign_name, template_name, created_at)
   VALUES (?, ?, ?, ?, ?)`
).run("cmp-3", "co-parent-1", "NORTHSTAR RETENTION", "CHECKIN EMAIL", now);

db.prepare(
  `INSERT INTO claims (
    id, company_id, type, topic, load_no, created_by, created_at, modified_by, modified_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  "clm-1",
  "co-parent-1",
  "Billing",
  "Wrong Account",
  "A123456",
  "DEMO SALESPERSON",
  now,
  "DEMO SALESPERSON",
  now
);

db.prepare(
  `INSERT INTO claims (
    id, company_id, type, topic, load_no, created_by, created_at, modified_by, modified_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  "clm-2",
  "co-parent-1",
  "Damage",
  "Product Damaged",
  "A123457",
  "DEMO SALESPERSON",
  now,
  "ALEX MORGAN",
  now
);

db.prepare(
  `INSERT INTO claims (
    id, company_id, type, topic, load_no, created_by, created_at, modified_by, modified_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  "clm-3",
  "co-client-2",
  "Misc",
  "Missing Shipment",
  "B998877",
  "ALEX MORGAN",
  now,
  "ALEX MORGAN",
  now
);

db.prepare(
  `INSERT INTO contact_logs (
    id, company_id, contact_name, log_type, purpose, subject, log_date,
    status, details, start_time, end_time, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  "clog-1",
  "co-lead-1",
  "JORDAN LEE",
  "Call",
  "FOLLOW UP",
  "TRADE SHOW INTRO",
  "08/12/2025",
  "COMPLETED",
  "Discussed parts volume and delivery windows.",
  "09:00",
  "09:30",
  now,
  now
);

db.prepare(
  `INSERT INTO notes (id, company_id, body, created_by, created_at)
   VALUES (?, ?, ?, ?, ?)`
).run(
  "note-1",
  "co-lead-1",
  "Strong fit for Northeast rail parts lane. Decision maker is Jordan Lee.",
  "DEMO SALESPERSON",
  now
);

db.prepare(
  `INSERT INTO change_logs (id, company_id, modification, modified_by, modified_at)
   VALUES (?, ?, ?, ?, ?)`
).run(
  "log-1",
  "co-lead-1",
  "Lead created",
  "DEMO SALESPERSON",
  now
);

console.log("Seeded MyCRM demo database at", DB_PATH);
db.close();
