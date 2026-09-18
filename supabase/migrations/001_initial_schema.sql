-- Create schema extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. business
CREATE TABLE public.business (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    business_type TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. branches
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.business(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. business_hours
CREATE TABLE public.business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    opens_at TIME,
    closes_at TIME,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_day UNIQUE(branch_id, day_of_week)
);

-- 4. categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    short_description TEXT,
    full_description TEXT,
    price NUMERIC(10,2) CHECK (price >= 0),
    compare_at_price NUMERIC(10,2) CHECK (compare_at_price >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    unit TEXT,
    weight NUMERIC CHECK (weight >= 0),
    availability TEXT NOT NULL CHECK (availability IN ('AVAILABLE', 'UNAVAILABLE', 'HIDDEN')) DEFAULT 'AVAILABLE',
    veg_status TEXT,
    eggless_status TEXT,
    allergens TEXT,
    customizable TEXT,
    customization_options JSONB,
    preparation_time_minutes INTEGER CHECK (preparation_time_minutes >= 0),
    tags TEXT[],
    source TEXT,
    last_verified TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. product_variants
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    variant_type TEXT NOT NULL,
    weight NUMERIC CHECK (weight >= 0),
    unit TEXT,
    price NUMERIC(10,2) CHECK (price >= 0),
    availability TEXT NOT NULL CHECK (availability IN ('AVAILABLE', 'UNAVAILABLE', 'HIDDEN')) DEFAULT 'AVAILABLE',
    source TEXT,
    last_verified TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. product_images
CREATE TABLE public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('CUSTOMER', 'OWNER')) DEFAULT 'CUSTOMER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. addresses
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    house_flat_building TEXT NOT NULL,
    street TEXT NOT NULL,
    area_locality TEXT NOT NULL,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    delivery_instructions TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_address_customer UNIQUE (id, customer_id)
);

-- 10. bakery_settings
CREATE TABLE public.bakery_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    online_ordering_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    service_radius_km NUMERIC CHECK (service_radius_km >= 0),
    delivery_fee NUMERIC(10,2) CHECK (delivery_fee >= 0),
    minimum_order NUMERIC(10,2) CHECK (minimum_order >= 0),
    free_delivery_threshold NUMERIC(10,2) CHECK (free_delivery_threshold >= 0),
    estimated_delivery_minutes INTEGER CHECK (estimated_delivery_minutes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_bakery_settings_branch UNIQUE(branch_id)
);

-- 11. orders
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')) DEFAULT 'PENDING',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED')) DEFAULT 'PENDING',
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee NUMERIC(10,2) NOT NULL CHECK (delivery_fee >= 0),
    discount NUMERIC(10,2) NOT NULL CHECK (discount >= 0),
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('DELIVERY', 'PICKUP')),
    delivery_address_id UUID,
    delivery_address_snapshot JSONB,
    latitude NUMERIC,
    longitude NUMERIC,
    customer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_order_address_ownership FOREIGN KEY (delivery_address_id, customer_id) REFERENCES public.addresses(id, customer_id) ON DELETE RESTRICT
);

-- 12. order_items
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    variant_name_snapshot TEXT,
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(10,2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. custom_orders
CREATE TABLE public.custom_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    occasion TEXT,
    flavour TEXT,
    weight TEXT,
    theme TEXT,
    cake_message TEXT,
    required_date DATE NOT NULL,
    preferred_time TEXT,
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('DELIVERY', 'PICKUP')),
    reference_image_path TEXT,
    mobile_number TEXT NOT NULL,
    additional_requirements TEXT,
    owner_notes TEXT,
    final_price NUMERIC(10,2) CHECK (final_price >= 0),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'QUOTED', 'CONFIRMED')) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_availability ON public.products(availability);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_custom_orders_customer ON public.custom_orders(customer_id);
CREATE INDEX idx_custom_orders_status ON public.custom_orders(status);
CREATE INDEX idx_addresses_customer ON public.addresses(customer_id);

-- Role helper function
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Trigger to create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'CUSTOMER');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS
ALTER TABLE public.business ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bakery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read business" ON public.business FOR SELECT USING (true);
CREATE POLICY "Public read branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Public read business_hours" ON public.business_hours FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (availability != 'HIDDEN');
CREATE POLICY "Public read product_variants" ON public.product_variants FOR SELECT USING (availability != 'HIDDEN');
CREATE POLICY "Public read product_images" ON public.product_images FOR SELECT USING (true);

-- Owner full access policies
CREATE POLICY "Owner full access business" ON public.business FOR ALL USING (public.get_auth_role() = 'OWNER');
CREATE POLICY "Owner full access branches" ON public.branches FOR ALL USING (public.get_auth_role() = 'OWNER');
CREATE POLICY "Owner full access business_hours" ON public.business_hours FOR ALL USING (public.get_auth_role() = 'OWNER');
CREATE POLICY "Owner full access categories" ON public.categories FOR ALL USING (public.get_auth_role() = 'OWNER');
CREATE POLICY "Owner full access products" ON public.products FOR ALL USING (public.get_auth_role() = 'OWNER');
CREATE POLICY "Owner full access product_variants" ON public.product_variants FOR ALL USING (public.get_auth_role() = 'OWNER');
CREATE POLICY "Owner full access product_images" ON public.product_images FOR ALL USING (public.get_auth_role() = 'OWNER');
CREATE POLICY "Owner full access bakery_settings" ON public.bakery_settings FOR ALL USING (public.get_auth_role() = 'OWNER');
CREATE POLICY "Owner full access profiles" ON public.profiles FOR ALL USING (public.get_auth_role() = 'OWNER');
CREATE POLICY "Owner full access orders" ON public.orders FOR ALL USING (public.get_auth_role() = 'OWNER');
CREATE POLICY "Owner full access order items" ON public.order_items FOR ALL USING (public.get_auth_role() = 'OWNER');
CREATE POLICY "Owner full access custom orders" ON public.custom_orders FOR ALL USING (public.get_auth_role() = 'OWNER');

-- Profiles
CREATE POLICY "Customer read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Customer update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (role = 'CUSTOMER');

-- Addresses
CREATE POLICY "Customer full access own addresses" ON public.addresses FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "Owner read addresses" ON public.addresses FOR SELECT USING (public.get_auth_role() = 'OWNER');

-- Orders (Customers can ONLY READ their own orders. Creation MUST route through secure backend API)
CREATE POLICY "Customer read own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);

-- Order Items (Customers can ONLY READ their own order items)
CREATE POLICY "Customer read own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));

-- Custom Orders (Customers can ONLY READ their own custom orders. Creation/Confirmation MUST route through secure backend API)
CREATE POLICY "Customer read own custom orders" ON public.custom_orders FOR SELECT USING (auth.uid() = customer_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('custom-cake-references', 'custom-cake-references', false) ON CONFLICT DO NOTHING;

-- Storage Policies
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Owner manage product images" ON storage.objects FOR ALL USING (bucket_id = 'product-images' AND public.get_auth_role() = 'OWNER');

CREATE POLICY "Customer upload references" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'custom-cake-references' AND (auth.uid()::text = (string_to_array(name, '/'))[1]));
CREATE POLICY "Customer read own references" ON storage.objects FOR SELECT USING (bucket_id = 'custom-cake-references' AND (auth.uid()::text = (string_to_array(name, '/'))[1]));
CREATE POLICY "Owner manage references" ON storage.objects FOR ALL USING (bucket_id = 'custom-cake-references' AND public.get_auth_role() = 'OWNER');
