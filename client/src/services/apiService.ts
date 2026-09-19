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

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
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

  async getCustomOrders(): Promise<CustomOrder[]> {
    return this.getCustomerCustomOrders();
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

// ---------------------------------------------------------------------------
// Chat (AI Chatbot)
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const chatService = {
  async sendMessage(
    message: string,
    history: ChatMessage[] = []
  ): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });
    } catch {
      // Network-level failure (offline, CORS, DNS, etc.)
      throw new Error(
        'Unable to reach the assistant. Please check your connection and try again.'
      );
    }

    // Try to parse JSON regardless of status code
    let json: any = null;
    try {
      const text = await res.text();
      if (text.trim().length > 0) {
        json = JSON.parse(text);
      }
    } catch {
      // Body was not valid JSON (should not happen with our server, but be safe)
      json = null;
    }

    if (!res.ok) {
      // Server returned an error status
      const serverMsg = json?.message;
      throw new Error(
        serverMsg ||
          'Sorry, the assistant is temporarily unavailable. Please try again shortly.'
      );
    }

    if (!json?.success) {
      throw new Error(
        json?.message || 'The assistant could not process your request.'
      );
    }

    const reply = json?.data?.reply;
    if (typeof reply !== 'string' || reply.trim().length === 0) {
      throw new Error(
        'The assistant returned an empty response. Please try again.'
      );
    }

    return reply.trim();
  },
};

// ---------------------------------------------------------------------------
// Owner Dashboard API
// ---------------------------------------------------------------------------

export interface OwnerStats {
  orders: {
    total: number;
    by_status: Record<string, number>;
    today_revenue: number;
    total_revenue: number;
  };
  custom_orders: {
    total: number;
    by_status: Record<string, number>;
  };
}

export const ownerService = {
  async getStats(): Promise<OwnerStats> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getOrders(params?: {
    status?: string;
    delivery_type?: string;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<any[]> {
    const token = await getAuthToken();
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.delivery_type) qs.set('delivery_type', params.delivery_type);
    if (params?.date) qs.set('date', params.date);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/owner/orders?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data || [];
  },

  async getOrderById(id: string): Promise<any> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async updateOrderStatus(id: string, status: string): Promise<any> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getCustomOrders(status?: string): Promise<any[]> {
    const token = await getAuthToken();
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_BASE}/owner/custom-orders${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data || [];
  },

  async updateCustomOrder(
    id: string,
    payload: { status?: string; final_price?: number; owner_notes?: string }
  ): Promise<any> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/custom-orders/${id}`, {
      method: 'PATCH',
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

  async getProducts(params?: {
    category_id?: string;
    search?: string;
    availability?: string;
  }): Promise<any[]> {
    const token = await getAuthToken();
    const qs = new URLSearchParams();
    if (params?.category_id) qs.set('category_id', params.category_id);
    if (params?.search) qs.set('search', params.search);
    if (params?.availability) qs.set('availability', params.availability);

    const res = await fetch(`${API_BASE}/owner/products?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data || [];
  },

  async updateProductAvailability(id: string, availability: 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN'): Promise<any> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/products/${id}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ availability }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async updateProductFeatured(id: string, is_featured: boolean): Promise<any> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/products/${id}/featured`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_featured }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async updateVariantPrice(id: string, price: number): Promise<any> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/variants/${id}/price`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ price }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getCategories(): Promise<any[]> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data || [];
  },

  async getCatalogueStats(): Promise<{
    total: number;
    available: number;
    unavailable: number;
    hidden: number;
    variants: number;
    categories: number;
    category_breakdown: { id: string; name: string; count: number }[];
  }> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/catalogue-stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async updateVariantAvailability(id: string, availability: 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN'): Promise<any> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/variants/${id}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ availability }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getCustomers(): Promise<any[]> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data || [];
  },

  async getKnowledgeStats(): Promise<any> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/knowledge`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getShowcaseSlides(): Promise<any[]> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/showcase`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data || [];
  },

  async createShowcaseSlide(data: any): Promise<any> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/showcase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async updateShowcaseSlide(id: string, data: any): Promise<any> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/showcase/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async deleteShowcaseSlide(id: string): Promise<void> {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/owner/showcase/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },
};

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const profileService = {
  async updateProfile(payload: { full_name?: string; phone?: string }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');
    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
    if (error) throw new Error(error.message);
  },
};


