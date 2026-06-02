-- ================================================
-- Quotation Management System – Supabase Schema
-- Run this in your Supabase SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================
-- CLIENTS TABLE
-- ============================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  pin TEXT NOT NULL DEFAULT '',
  gstin TEXT NOT NULL DEFAULT '',
  account_manager TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

-- ============================
-- UNITS TABLE
-- ============================
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  unit_name TEXT NOT NULL,
  symbol TEXT NOT NULL
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own units"
  ON units FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own units"
  ON units FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own units"
  ON units FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own units"
  ON units FOR DELETE
  USING (auth.uid() = user_id);

-- ============================
-- GST_RATES TABLE
-- ============================
CREATE TABLE gst_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gst_percentage NUMERIC NOT NULL
);

ALTER TABLE gst_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gst_rates"
  ON gst_rates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gst_rates"
  ON gst_rates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gst_rates"
  ON gst_rates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gst_rates"
  ON gst_rates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================
-- PRODUCTS TABLE
-- ============================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  hsn TEXT NOT NULL DEFAULT '',
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  gst_id UUID REFERENCES gst_rates(id) ON DELETE SET NULL
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (auth.uid() = user_id);

-- ============================
-- QUOTATIONS TABLE
-- ============================
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quote_number TEXT NOT NULL,
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  terms_conditions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotations"
  ON quotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotations"
  ON quotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotations"
  ON quotations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotations"
  ON quotations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================
-- QUOTATION_ITEMS TABLE
-- ============================
CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_rate NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT DEFAULT ''
);

ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotation_items"
  ON quotation_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_items.quotation_id
      AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own quotation_items"
  ON quotation_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_items.quotation_id
      AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own quotation_items"
  ON quotation_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_items.quotation_id
      AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own quotation_items"
  ON quotation_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_items.quotation_id
      AND q.user_id = auth.uid()
    )
  );
