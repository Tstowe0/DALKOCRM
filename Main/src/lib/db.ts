import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { DATA_DIR, DB_PATH, ROOT_DIR, UPLOADS_DIR } from "./paths";

let dbInstance: Database.Database | null = null;

const DEMO_DB_PATH = path.join(ROOT_DIR, "seed", "mycrm.demo.sqlite");

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  if (!fs.existsSync(DB_PATH) && fs.existsSync(DEMO_DB_PATH)) {
    fs.copyFileSync(DEMO_DB_PATH, DB_PATH);
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  dbInstance = db;
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
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

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      mobile TEXT NOT NULL DEFAULT '',
      contact_owner TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      uploaded_by TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS emails (
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

    CREATE TABLE IF NOT EXISTS activities (
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

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      campaign_name TEXT NOT NULL DEFAULT '',
      template_name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS claims (
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

    CREATE TABLE IF NOT EXISTS contact_logs (
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

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS change_logs (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      modification TEXT NOT NULL,
      modified_by TEXT NOT NULL,
      modified_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
    CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
    CREATE INDEX IF NOT EXISTS idx_attachments_company ON attachments(company_id);
    CREATE INDEX IF NOT EXISTS idx_emails_company ON emails(company_id);
    CREATE INDEX IF NOT EXISTS idx_activities_company ON activities(company_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_company ON campaigns(company_id);
    CREATE INDEX IF NOT EXISTS idx_claims_company ON claims(company_id);
    CREATE INDEX IF NOT EXISTS idx_contact_logs_company ON contact_logs(company_id);
    CREATE INDEX IF NOT EXISTS idx_notes_company ON notes(company_id);
    CREATE INDEX IF NOT EXISTS idx_change_logs_company ON change_logs(company_id);
  `);

  ensureColumn(db, "companies", "tms_status", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "contacts", "mobile", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "contacts", "is_primary", "INTEGER NOT NULL DEFAULT 0");
}

function ensureColumn(
  db: Database.Database,
  table: string,
  column: string,
  ddl: string
) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}