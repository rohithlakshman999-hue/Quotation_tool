import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'

let db: Database | null = null;

export async function getDb() {
  if (db) return db;
  
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      gstin TEXT,
      email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS uom (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      uqc TEXT,
      is_compound INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS gst_slabs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      percentage REAL NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      hsn_code TEXT,
      barcode TEXT,
      uom TEXT,
      description TEXT,
      initial_qty REAL DEFAULT 0,
      as_of_date TEXT,
      initial_cost REAL DEFAULT 0,
      min_order_qty REAL DEFAULT 0,
      category TEXT,
      subcategory TEXT,
      remarks TEXT,
      tax_account TEXT,
      additional_cess REAL DEFAULT 0,
      enable_pricewise_tax INTEGER DEFAULT 0,
      default_purchase_price_excl REAL DEFAULT 0,
      default_purchase_price_incl REAL DEFAULT 0,
      default_sale_price_excl REAL DEFAULT 0,
      default_sale_price_incl REAL DEFAULT 0,
      default_discount_percent REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_no TEXT NOT NULL,
      quote_date TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_address TEXT,
      client_city TEXT,
      client_state TEXT,
      sub_total REAL,
      discount REAL,
      igst REAL,
      cgst REAL,
      sgst REAL,
      round_off REAL,
      grand_total REAL,
      narration TEXT,
      terms_conditions TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      hsn_sac TEXT,
      qty REAL NOT NULL,
      uom TEXT NOT NULL,
      rate REAL NOT NULL,
      discount_percent REAL DEFAULT 0,
      tax_desc TEXT,
      value REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (quotation_id) REFERENCES quotations (id) ON DELETE CASCADE
    );
  `);

  return db;
}
