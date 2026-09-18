import { supabase } from '../lib/supabase';
import type {
  Order,
  CustomOrder,
  Address,
  DeliverySettingsInfo,
  ServiceabilityCheckResponse,
} from '../types';

const API_BASE = '/api';

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Please sign in to continue.');
  }
  return session.access_token;
}

// ---------------------------------------------------------------------------
// Settings & Delivery
// ---------------------------------------------------------------------------

export const settingsService = {
  async getDeliverySettings(): Promise<DeliverySettingsInfo> {
    const res = await fetch(`${API_BASE}/settings/delivery`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to load delivery settings.');
    return json.data;
  },

  async checkServiceability(lat: number, lng: number): Promise<ServiceabilityCheckResponse> {
    const res = await fetch(`${API_BASE}/settings/check-serviceability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    });
    const json = await res.json();
    if (!json.success) {
      return {
        serviceable: false,
        distance_km: json.data?.distance_km || 0,
        delivery_charge_inr: 0,
        reason: json.message || 'Location not serviceable.',
      };
    }
    return json.data;
  },

  async getBusinessRules() {
    const res = await fetch(`${API_BASE}/settings/business-rules`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
};

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export const addressService = {
  async getAddresses(): Promise<Address[]> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data || [];
  },

  async createAddress(address: Partial<Address>): Promise<Address> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(address),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async deleteAddress(id: string): Promise<void> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/addresses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const orderService = {
  async createOrder(payload: {
    items: { variant_id: string; quantity: number }[];
    delivery_type: 'DELIVERY' | 'PICKUP';
    delivery_address_id?: string;
    customer_notes?: string;
  }): Promise<Order> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to place order.');
    return json.data;
  },

  async getOrders(): Promise<Order[]> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data || [];
  },

  async getOrderById(id: string): Promise<Order> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
};

// ---------------------------------------------------------------------------
// Custom Cake Orders
// ---------------------------------------------------------------------------

export const customCakeService = {
  async submitInquiry(payload: {
    occasion?: string;
    flavour?: string;
    weight?: string;
    theme?: string;
    cake_message?: string;
    required_date: string;
    preferred_time?: string;
    delivery_type: 'DELIVERY' | 'PICKUP';
    mobile_number: string;
    additional_requirements?: string;
    reference_image_path?: string;
  }): Promise<CustomOrder> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/custom-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getCustomerCustomOrders(): Promise<CustomOrder[]> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/custom-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data || [];
  },

  async confirmQuote(id: string): Promise<CustomOrder> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/custom-orders/${id}/confirm`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  /**
   * Uploads reference image to Supabase Storage under {userId}/{timestamp}_{filename}
   */
  async uploadReferenceImage(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('custom-cake-references')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload reference image: ${uploadError.message}`);
    }

    return filePath;
  },
};
