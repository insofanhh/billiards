export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  roles?: string[];
  permissions?: string[];
}

export interface Table {
  id: number;
  code: string;
  name: string;
  seats: number;
  qr_code?: string;
  location?: string;
  status: {
    id: number;
    name: string;
    color: string;
  };
  table_type: {
    id: number;
    name: string;
    price_rates: Array<{
      id: number;
      price_per_hour: number;
      active: boolean;
    }>;
  };
  pending_order?: {
    id: number;
    user_name?: string;
  } | null;
  pending_end_order?: {
    id: number;
    order_code: string;
    user_name?: string;
  } | null;
  active_order?: {
    id: number;
    order_code: string;
    start_at?: string;
  };
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  charge_type: 'per_unit' | 'one_time';
  active: boolean;
}

export interface Order {
  id: number;
  order_code: string;
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
  items: Array<{
    id: number;
    service: {
      id: number;
      name: string;
      price: number;
    };
    qty: number;
    unit_price: number;
    total_price: number;
  }>;
  applied_discount?: {
    code: string;
    discount_type: string;
    discount_value: number;
  };
  transactions: Array<{
    id: number;
    amount: number;
    method: string;
    status: string;
    created_at: string;
  }>;
}

export interface DiscountCode {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_spend?: number;
}

