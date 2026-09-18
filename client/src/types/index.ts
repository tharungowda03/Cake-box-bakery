export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  variant_type: 'Standard' | 'Portion';
  weight: number | null;
  unit: string | null;
  price: number;
  availability: 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN';
  source?: string;
  created_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  price: number | null;
  compare_at_price: number | null;
  currency: string;
  unit: string | null;
  weight: number | null;
  availability: 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN';
  veg_status: string | null;
  eggless_status: string | null;
  allergens: string | null;
  customizable: string | null;
  customization_options: any;
  preparation_time_minutes: number | null;
  tags: string[] | null;
  source: string | null;
  created_at: string;
  // Joined relations
  category?: Category;
  product_variants?: ProductVariant[];
  product_images?: ProductImage[];
}

export interface CartItem {
  id: string; // unique cart item id (e.g. variant_id + custom notes)
  product_id: string;
  product_name: string;
  variant_id: string;
  variant_name: string;
  unit_price: number;
  quantity: number;
  image_url?: string;
  veg_status?: string | null;
}

export interface Address {
  id: string;
  customer_id: string;
  recipient_name: string;
  phone: string;
  house_flat_building: string;
  street: string;
  area_locality: string;
  landmark: string | null;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  delivery_instructions: string | null;
  is_default: boolean;
  created_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  branch_id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  payment_method: 'CASH';
  payment_status: 'PENDING' | 'PAID' | 'FAILED';
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  delivery_type: 'DELIVERY' | 'PICKUP';
  delivery_address_id: string | null;
  delivery_address_snapshot: any;
  latitude: number | null;
  longitude: number | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface CustomOrder {
  id: string;
  customer_id: string;
  branch_id: string;
  occasion: string | null;
  flavour: string | null;
  weight: string | null;
  theme: string | null;
  cake_message: string | null;
  required_date: string;
  preferred_time: string | null;
  delivery_type: 'DELIVERY' | 'PICKUP';
  reference_image_path: string | null;
  mobile_number: string;
  additional_requirements: string | null;
  owner_notes: string | null;
  final_price: number | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'QUOTED' | 'CONFIRMED';
  created_at: string;
  updated_at: string;
}

export interface DeliverySettingsInfo {
  delivery_enabled: boolean;
  service_radius_km: number;
  charge_per_km_inr: number;
  currency: string;
}

export interface ServiceabilityCheckResponse {
  serviceable: boolean;
  distance_km: number;
  delivery_charge_inr: number;
  reason?: string;
}
