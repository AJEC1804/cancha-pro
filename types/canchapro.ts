// ============================================================
// CANCHA PRO — Definiciones de Tipos TypeScript (Next.js / App Router)
// ============================================================

export type UserRole = 'superadmin' | 'tenant_admin' | 'staff' | 'cliente';

export type PaymentMethodType = 'wompi' | 'cash' | 'nequi' | 'daviplata' | 'bancolombia' | 'mixed';

export type ReservationStatus = 'pending' | 'pending_verification' | 'confirmed' | 'cancelled' | 'completed';

export type PaymentMode = 'deposit_50' | 'full_100' | 'la_vaca';

export interface VenuePaymentMethodDetail {
  phone_number?: string;
  account_name?: string;
  account_number?: string;
  account_type?: string;
  public_key?: string;
  is_active: boolean;
}

export interface VenuePaymentMethods {
  cash: { is_active: boolean; instructions?: string };
  wompi: VenuePaymentMethodDetail;
  nequi: VenuePaymentMethodDetail;
  daviplata: VenuePaymentMethodDetail;
  bancolombia: VenuePaymentMethodDetail;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
  is_active: boolean;
  payment_methods?: VenuePaymentMethods;
  created_at: string;
}

export interface Field {
  id: string;
  venue_id: string;
  name: string;
  sport_type: 'futbol_5' | 'futbol_7' | 'futbol_8' | 'futbol_11' | 'padel';
  surface_type: string;
  default_price_per_hour: number;
  peak_price_per_hour: number;
  weekend_price_per_hour?: number;
  weekend_peak_price_per_hour?: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
  description?: string;
}

export interface CafeteriaItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CafeteriaOrder {
  id: string;
  venue_id: string;
  reservation_id: string;
  staff_user_id: string;
  total_amount: number;
  status: 'open' | 'settled' | 'cancelled';
  payment_method: string;
  items: CafeteriaItem[];
  created_at: string;
}

export interface UnifiedFolio {
  reservation_id: string;
  venue_id: string;
  venue_name: string;
  field_id: string;
  field_name: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  court_price: number;
  court_deposit_paid: number;
  court_pending_balance: number;
  cafeteria_orders: CafeteriaOrder[];
  cafeteria_total_amount: number;
  equipment_delivered: boolean;
  equipment_returned: boolean;
  deposit_status: string;
  grand_total_due: number;
  is_fully_paid: boolean;
  currency: string;
}

export interface Reservation {
  id: string;
  venue_id: string;
  field_id: string;
  field_name: string;
  user_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  payment_status: 'unpaid' | 'partial' | 'paid';
  payment_mode: PaymentMode;
  total_amount: number;
  deposit_required: number;
  deposit_paid: number;
  remaining_balance: number;
  held_until?: string | null;
  payment_reference?: string;
  receipt_url?: string;
  folio?: UnifiedFolio;
  created_at: string;
}

export interface ShiftCashRegister {
  id: string;
  venue_id: string;
  staff_user_id: string;
  staff_name: string;
  opened_at: string;
  closed_at?: string | null;
  initial_cash: number;
  expected_cash: number;
  actual_cash?: number | null;
  difference: number;
  court_sales: number;
  cafeteria_sales: number;
  cash_sales: number;
  electronic_sales: number;
  total_collected: number;
  is_closed: boolean;
}
