export type UserRole = 'admin' | 'sales';

export type CustomerType = 'corporate' | 'service' | 'individual';

export type Stage = 'care' | 'send_quote' | 'consideration' | 'purchase';

export type Level = 'cold' | 'warm' | 'hot';

export type ContactStatus = 'not_called' | 'called' | 'following' | 'unreachable';

export interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  company_name?: string;
  customer_type: CustomerType;
  business_type?: string;
  products: string[];
  scale?: string;
  province_city?: string;
  customer_source?: string;
  staff_in_charge_id?: number;
  staff_in_charge_name?: string;
  stage: Stage;
  level: Level;
  contact_status: ContactStatus;
  customer_feedback?: string;
  notes?: string;
  appointment_date?: Date;
  appointment_reminder?: string;
  is_tracking: boolean;
  created_at: Date;
  updated_at: Date;
  latest_contact?: ContactHistory;
}

export interface ContactHistory {
  id: number;
  customer_id: number;
  contact_date: Date;
  contact_type: string;
  notes?: string;
  staff_id?: number;
  staff_name?: string;
  created_at: Date;
}

export interface PurchaseHistory {
  id: number;
  customer_id: number;
  product: string;
  amount: number;
  purchase_date: Date;
  notes?: string;
  created_at: Date;
}

export interface PaymentHistory {
  id: number;
  customer_id: number;
  amount: number;
  payment_date: Date;
  payment_method?: string;
  notes?: string;
  created_at: Date;
}

export const AVAILABLE_PRODUCTS = [
  'PM Accounting',
  'PM HKD',
  'PM Shopnet',
  'Equipment'
];
