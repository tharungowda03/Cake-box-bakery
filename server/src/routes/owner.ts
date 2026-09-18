/**
 * server/src/routes/owner.ts
 *
 * Owner-only API endpoints for the Cake Box Kakinada Owner Dashboard.
 *
 * All endpoints require:
 *   - Valid Bearer auth token
 *   - Profile role = 'OWNER'
 *
 * Endpoints:
 *   GET  /api/owner/stats                      — Dashboard KPI summary
 *   GET  /api/owner/orders                     — All orders (paginated, filterable)
 *   GET  /api/owner/orders/:id                 — Single order with items
 *   PATCH /api/owner/orders/:id/status         — Update order status (lifecycle enforced)
 *   GET  /api/owner/custom-orders              — All custom cake inquiries
 *   PATCH /api/owner/custom-orders/:id         — Update inquiry status/price/notes
 */

import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { isValidOrderStatusTransition } from '../services/businessRules';

const router = Router();

// ---------------------------------------------------------------------------
// Owner gate middleware (applied to all routes in this file)
// ---------------------------------------------------------------------------

router.use(requireAuth, (req: AuthenticatedRequest, res: Response, next: Function) => {
  if (req.user?.role !== 'OWNER') {
    res.status(403).json({
      success: false,
      message: 'Forbidden. Owner access required.',
    });
    return;
  }
  next();
});

// ---------------------------------------------------------------------------
// GET /api/owner/stats
// ---------------------------------------------------------------------------

router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Order counts by status
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('status, total, created_at');

    if (ordersErr) {
      res.status(500).json({ success: false, message: ordersErr.message });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const statusCounts: Record<string, number> = {};
    let todayRevenue = 0;
    let totalRevenue = 0;

    for (const order of orders || []) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      const amount = Number(order.total) || 0;
      totalRevenue += amount;
      if (order.created_at.slice(0, 10) === today) {
        todayRevenue += amount;
      }
    }

    // Custom order counts
    const { data: customOrders, error: coErr } = await supabase
      .from('custom_orders')
      .select('status');

    if (coErr) {
      res.status(500).json({ success: false, message: coErr.message });
      return;
    }

    const customStatusCounts: Record<string, number> = {};
    for (const co of customOrders || []) {
      customStatusCounts[co.status] = (customStatusCounts[co.status] || 0) + 1;
    }

    res.json({
      success: true,
      data: {
        orders: {
          total: orders?.length || 0,
          by_status: statusCounts,
          today_revenue: Math.round(todayRevenue * 100) / 100,
          total_revenue: Math.round(totalRevenue * 100) / 100,
        },
        custom_orders: {
          total: customOrders?.length || 0,
          by_status: customStatusCounts,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/owner/orders
// ---------------------------------------------------------------------------

router.get('/orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, delivery_type, date, page = '1', limit = '50' } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_id,
        status,
        payment_method,
        payment_status,
        subtotal,
        delivery_fee,
        discount,
        total,
        delivery_type,
        delivery_address_snapshot,
        customer_notes,
        created_at,
        updated_at,
        profiles:customer_id (full_name, phone),
        order_items (
          id,
          product_name_snapshot,
          variant_name_snapshot,
          unit_price,
          quantity,
          line_total
        )
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status as string);
    if (delivery_type) query = query.eq('delivery_type', delivery_type as string);
    if (date) {
      const start = `${date}T00:00:00.000Z`;
      const end = `${date}T23:59:59.999Z`;
      query = query.gte('created_at', start).lte('created_at', end);
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/owner/orders/:id
// ---------------------------------------------------------------------------

router.get('/orders/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:customer_id (full_name, phone),
        order_items (*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/owner/orders/:id/status
// ---------------------------------------------------------------------------

router.patch('/orders/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status: targetStatus } = req.body;

    if (!targetStatus || typeof targetStatus !== 'string') {
      res.status(400).json({ success: false, message: 'Target status is required.' });
      return;
    }

    // Fetch current order
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('id, status, delivery_type')
      .eq('id', id)
      .single();

    if (fetchErr || !order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Validate lifecycle transition
    const deliveryType = order.delivery_type as 'DELIVERY' | 'PICKUP';
    if (!isValidOrderStatusTransition(deliveryType, order.status, targetStatus)) {
      res.status(400).json({
        success: false,
        message: `Invalid transition for ${deliveryType} order: "${order.status}" → "${targetStatus}".`,
      });
      return;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ status: targetStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      res.status(500).json({ success: false, message: updateErr.message });
      return;
    }

    res.json({
      success: true,
      message: `Order status updated to ${targetStatus}.`,
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/owner/custom-orders
// ---------------------------------------------------------------------------

router.get('/custom-orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('custom_orders')
      .select(`
        *,
        profiles:customer_id (full_name, phone)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status as string);

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/owner/custom-orders/:id
// ---------------------------------------------------------------------------

/**
 * Allowed transitions (enforced here — matches businessRules.ts CUSTOM_CAKE_RULES):
 *   PENDING  → ACCEPTED | REJECTED  (owner)
 *   ACCEPTED → QUOTED               (owner; final_price required)
 *   QUOTED   → CONFIRMED            (but this is customer-side via /api/custom-orders/:id/confirm)
 */
const OWNER_CUSTOM_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['QUOTED'],
};

router.patch('/custom-orders/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status: targetStatus, final_price, owner_notes } = req.body;

    // Fetch current
    const { data: co, error: fetchErr } = await supabase
      .from('custom_orders')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchErr || !co) {
      res.status(404).json({ success: false, message: 'Custom order not found.' });
      return;
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Status transition
    if (targetStatus) {
      const allowed = OWNER_CUSTOM_TRANSITIONS[co.status] || [];
      if (!allowed.includes(targetStatus)) {
        res.status(400).json({
          success: false,
          message: `Invalid transition: "${co.status}" → "${targetStatus}". Allowed: ${allowed.join(', ') || 'none'}.`,
        });
        return;
      }

      if (targetStatus === 'QUOTED') {
        if (final_price === undefined || final_price === null || isNaN(Number(final_price))) {
          res.status(400).json({
            success: false,
            message: 'final_price is required when setting status to QUOTED.',
          });
          return;
        }
        updatePayload.final_price = Number(final_price);
      }

      updatePayload.status = targetStatus;
    }

    // Owner notes (optional update independent of status)
    if (typeof owner_notes === 'string') {
      updatePayload.owner_notes = owner_notes.trim() || null;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('custom_orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      res.status(500).json({ success: false, message: updateErr.message });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/owner/products
// ---------------------------------------------------------------------------

router.get('/products', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category_id, search, availability } = req.query;

    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        short_description,
        veg_status,
        eggless_status,
        availability,
        display_order,
        category:categories (id, name, slug),
        product_variants (id, name, price, availability, weight, unit, is_default)
      `)
      .order('name');

    if (category_id) query = query.eq('category_id', category_id as string);
    if (availability) query = query.eq('availability', availability as string);
    if (search && typeof search === 'string') {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/owner/products/:id/availability
// ---------------------------------------------------------------------------

router.patch('/products/:id/availability', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    if (availability !== 'AVAILABLE' && availability !== 'UNAVAILABLE') {
      res.status(400).json({ success: false, message: 'Invalid availability state.' });
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .update({ availability, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.json({ success: true, message: 'Product availability updated.', data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/owner/variants/:id/price
// ---------------------------------------------------------------------------

router.patch('/variants/:id/price', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      res.status(400).json({ success: false, message: 'Price must be a valid positive number.' });
      return;
    }

    const { data, error } = await supabase
      .from('product_variants')
      .update({ price: numPrice, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.json({ success: true, message: 'Variant price updated.', data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/owner/categories
// ---------------------------------------------------------------------------

router.get('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        description,
        display_order,
        is_active,
        products (count)
      `)
      .order('display_order');

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    const formatted = (data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      display_order: cat.display_order,
      is_active: cat.is_active,
      product_count: cat.products?.[0]?.count || 0,
    }));

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/owner/customers
// ---------------------------------------------------------------------------

router.get('/customers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, created_at')
      .eq('role', 'CUSTOMER')
      .order('created_at', { ascending: false });

    if (pErr) {
      res.status(500).json({ success: false, message: pErr.message });
      return;
    }

    // Get order counts by customer
    const { data: orders, error: oErr } = await supabase
      .from('orders')
      .select('customer_id, total, status');

    const orderStats: Record<string, { count: number; totalSpend: number }> = {};
    for (const o of orders || []) {
      if (!orderStats[o.customer_id]) {
        orderStats[o.customer_id] = { count: 0, totalSpend: 0 };
      }
      orderStats[o.customer_id].count += 1;
      orderStats[o.customer_id].totalSpend += Number(o.total) || 0;
    }

    const customers = (profiles || []).map(p => ({
      id: p.id,
      full_name: p.full_name || 'Anonymous Customer',
      phone: p.phone || '—',
      created_at: p.created_at,
      orders_count: orderStats[p.id]?.count || 0,
      total_spent: Math.round((orderStats[p.id]?.totalSpend || 0) * 100) / 100,
    }));

    res.json({ success: true, data: customers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/owner/knowledge
// ---------------------------------------------------------------------------

router.get('/knowledge', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('rag_knowledge_base')
      .select('id, source, chunk_type, created_at, embedding')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let embeddedCount = 0;

    for (const row of data || []) {
      bySource[row.source] = (bySource[row.source] || 0) + 1;
      byType[row.chunk_type] = (byType[row.chunk_type] || 0) + 1;
      if (row.embedding) embeddedCount += 1;
    }

    res.json({
      success: true,
      data: {
        total_chunks: data?.length || 0,
        embedded_chunks: embeddedCount,
        sources: bySource,
        types: byType,
        embedding_model: 'gemini-embedding-2 (768-dim)',
        last_ingested_at: data?.[0]?.created_at || null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
