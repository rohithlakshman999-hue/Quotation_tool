-- Supabase Schema for Quotation Tool

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients Table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pin TEXT,
  gstin TEXT,
  account_manager TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Units Table
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  symbol TEXT NOT NULL
);

-- GST Rates Table
CREATE TABLE public.gst_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  gst_percentage NUMERIC NOT NULL
);

-- Products Table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  hsn TEXT,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  gst_id UUID REFERENCES public.gst_rates(id) ON DELETE SET NULL
);

-- Quotations Table
CREATE TABLE public.quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  quote_number TEXT NOT NULL,
  quote_date DATE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  terms_conditions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotation Items Table
CREATE TABLE public.quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_rate NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT
);

-- Disable Row Level Security (RLS) to allow public access (demo mode)
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items DISABLE ROW LEVEL SECURITY;

-- Create Indexes for performance
CREATE INDEX idx_clients_name ON public.clients(client_name);
CREATE INDEX idx_products_name ON public.products(product_name);
CREATE INDEX idx_quotations_quote_number ON public.quotations(quote_number);
CREATE INDEX idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);
