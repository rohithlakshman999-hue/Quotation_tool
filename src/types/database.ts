export interface Client {
  id: string;
  user_id: string;
  client_name: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  gstin: string;
  account_manager: string;
  created_at: string;
}

export interface Unit {
  id: string;
  user_id: string;
  unit_name: string;
  symbol: string;
}

export interface GSTRate {
  id: string;
  user_id: string;
  gst_percentage: number;
}

export interface Product {
  id: string;
  user_id: string;
  product_name: string;
  hsn: string;
  unit_id: string;
  gst_id: string;
  
  // Joins
  unit?: Unit;
  gst_rate?: GSTRate;
}

export interface Quotation {
  id: string;
  user_id: string;
  quote_number: string;
  quote_date: string;
  client_id: string;
  net_amount: number;
  terms_conditions: any;
  created_at: string;
  
  // Joins
  client?: Client;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id: string;
  quantity: number;
  unit_rate: number;
  tax: number;
  total_amount: number;
  description: string;
  
  // Joins
  product?: Product;
}
