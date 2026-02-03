export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  store_id?: number;
  roles?: string[];
  permissions?: string[];
  store?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

export interface Table {
  id: number;
  code: string;
  name: string;
  seats: number;
  qr_code?: string;
  location?: string;
  status: string;
  table_type: {
    id: number;
    name: string;
    price_rates: Array<{
      id: number;
      price_per_hour: number;
      active: boolean;
      day_of_week?: string[] | null;
      start_time?: string | null;
      end_time?: string | null;
      priority?: number;
    }>;
    current_price_rate?: {
      id: number;
      price_per_hour: number;
      active: boolean;
    } | null;
  };
  pending_order?: Order | null;
  pending_end_order?: Order | null;
  active_order?: Order | null;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  image?: string | null;
  price: number;
  charge_type: 'per_unit' | 'one_time';
  active: boolean;
  inventory_quantity?: number;
  category_service?: {
    id: number;
    name: string;
    slug?: string;
    sort_order?: number;
  } | null;
}

export interface OrderItem {
  id: number;
  service: {
    id: number;
    name: string;
    price: number;
  } | null;
  name?: string | null;
  qty: number;
  unit_price: number;
  total_price: number;
  is_confirmed?: boolean;
  created_at?: string;
  merged_table_fee?: {
    id: number;
    table_name: string;
    start_at: string;
    end_at: string;
    total_price?: number;
  } | null;
}

export interface OrderTransaction {
  id: number;
  amount: number;
  method: string;
  status: string;
  reference: string;
  created_at: string;
  customer_name?: string | null;
  user?: {
    id: number;
    name: string;
    email?: string;
  } | null;
}

export interface Order {
  id: number;
  order_code: string;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  customer_name?: string | null;
  user_name?: string | null;
  table: {
    id: number;
    code: string;
    name: string;
  };
  price_rate: {
    id: number;
    price_per_hour: number;
  };
  start_at?: string;
  end_at?: string;
  status: 'pending' | 'active' | 'pending_end' | 'completed' | 'cancelled';
  total_play_time_minutes?: number;
  total_before_discount: number;
  total_discount: number;
  total_paid: number;
  total_amount?: number; // Added for UI compatibility
  cashier?: string | null;
  merged_table_fees?: {
    id: number;
    table_name: string;
    start_at: string;
    end_at: string;
    total_price: number;
  }[];
  items?: OrderItem[];
  applied_discount?: {
    code: string;
    discount_type: string;
    discount_value: number;
  };
  transactions: Array<OrderTransaction>;
}

export interface DiscountCode {
  id: number;
  code: string;
  description?: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_spend?: number;
  start_at?: string;
  end_at?: string;
  usage_limit?: number;
  used_count?: number;
  is_saved?: boolean;
}

