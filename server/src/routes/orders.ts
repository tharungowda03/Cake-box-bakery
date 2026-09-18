import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { checkServiceabilityLive } from '../services/deliveryService';
import { REGULAR_ORDER_RULES, isValidOrderStatusTransition } from '../services/businessRules';

const router = Router();

// Helper to generate unique order number
function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CBK-${dateStr}-${randomSuffix}`;
}

/**
 * POST /api/orders
 * Authenticated endpoint to place an order.
 * Strictly calculates all prices on the backend from real DB variants.
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user!.id;
    const { items, delivery_type, delivery_address_id, customer_notes } = req.body;

    // 1. Validate basic input
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
      return;
    }

    if (!['DELIVERY', 'PICKUP'].includes(delivery_type)) {
      res.status(400).json({ success: false, message: 'Invalid delivery type. Must be DELIVERY or PICKUP.' });
      return;
    }

    // 2. Fetch branch id
    const { data: branch, error: branchErr } = await supabase
      .from('branches')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (branchErr || !branch) {
      res.status(500).json({ success: false, message: 'Active branch not found.' });
      return;
    }

    // 3. Resolve and validate each item from the DB
    const variantIds = items.map((i: any) => i.variant_id);
    const { data: dbVariants, error: varErr } = await supabase
      .from('product_variants')
      .select(`
        id,
        name,
        price,
        availability,
        product_id,
        products (
          id,
          name,
          availability
        )
      `)
      .in('id', variantIds);

    if (varErr || !dbVariants) {
      res.status(500).json({ success: false, message: 'Failed to verify catalogue items.' });
      return;
    }

    const variantMap = new Map(dbVariants.map(v => [v.id, v]));

    let calculatedSubtotal = 0;
    const orderItemsToInsert: any[] = [];

    for (const item of items) {
      const dbVar: any = variantMap.get(item.variant_id);
      if (!dbVar) {
        res.status(400).json({
          success: false,
          message: `Item variant ${item.variant_id} is no longer available in the catalogue.`,
        });
        return;
      }

      if (dbVar.availability !== 'AVAILABLE' || dbVar.products?.availability !== 'AVAILABLE') {
        res.status(400).json({
          success: false,
          message: `Item "${dbVar.products?.name || dbVar.name}" is currently unavailable for order.`,
        });
        return;
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        res.status(400).json({ success: false, message: 'Invalid item quantity.' });
        return;
      }

      const unitPrice = Number(dbVar.price);
      const lineTotal = unitPrice * qty;
      calculatedSubtotal += lineTotal;

      orderItemsToInsert.push({
        product_id: dbVar.product_id,
        variant_id: dbVar.id,
        product_name_snapshot: dbVar.products?.name || 'Product',
        variant_name_snapshot: dbVar.name,
        unit_price: unitPrice,
        quantity: qty,
        line_total: lineTotal,
      });
    }

    // 4. Handle delivery calculation if delivery_type is DELIVERY
    let calculatedDeliveryFee = 0;
    let addressSnapshot: any = null;
    let customerLat: number | null = null;
    let customerLng: number | null = null;

    if (delivery_type === 'DELIVERY') {
      if (!delivery_address_id) {
        res.status(400).json({
          success: false,
          message: 'Delivery address is required for home delivery.',
        });
        return;
      }

      // Fetch customer address and ensure ownership
      const { data: address, error: addrErr } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', delivery_address_id)
        .eq('customer_id', customerId)
        .single();

      if (addrErr || !address) {
        res.status(400).json({
          success: false,
          message: 'Selected delivery address not found or does not belong to you.',
        });
        return;
      }

      customerLat = address.latitude ? Number(address.latitude) : null;
      customerLng = address.longitude ? Number(address.longitude) : null;

      // If lat/lng present, calculate via Haversine
      if (customerLat != null && customerLng != null) {
        const serviceCheck = await checkServiceabilityLive(customerLat, customerLng);
        if (!serviceCheck.serviceable) {
          res.status(400).json({
            success: false,
            message: serviceCheck.reason || 'Address is outside our 10 km delivery radius.',
          });
          return;
        }
        calculatedDeliveryFee = serviceCheck.deliveryChargeInr;
      } else {
        // Fallback default delivery fee if coordinates not explicitly pinpointed (per-km default base)
        calculatedDeliveryFee = 35; // Standard 5km baseline estimate if unmapped
      }

      addressSnapshot = {
        recipient_name: address.recipient_name,
        phone: address.phone,
        house_flat_building: address.house_flat_building,
        street: address.street,
        area_locality: address.area_locality,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
      };
    }

    const calculatedDiscount = 0; // MVP has no promo discount
    const calculatedTotal = calculatedSubtotal + calculatedDeliveryFee - calculatedDiscount;
    const orderNumber = generateOrderNumber();

    // 5. Insert order
    const { data: orderData, error: orderInsertErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        branch_id: branch.id,
        status: REGULAR_ORDER_RULES.confirmedStatus,
        payment_method: REGULAR_ORDER_RULES.paymentMethod, // forced CASH
        payment_status: 'PENDING',
        subtotal: calculatedSubtotal,
        delivery_fee: calculatedDeliveryFee,
        discount: calculatedDiscount,
        total: calculatedTotal,
        delivery_type,
        delivery_address_id: delivery_type === 'DELIVERY' ? delivery_address_id : null,
        delivery_address_snapshot: addressSnapshot,
        latitude: customerLat,
        longitude: customerLng,
        customer_notes: customer_notes || null,
      })
      .select()
      .single();

    if (orderInsertErr || !orderData) {
      console.error('Order creation error:', orderInsertErr);
      res.status(500).json({ success: false, message: 'Failed to create order.' });
      return;
    }

    // 6. Insert order items
    const itemsPayload = orderItemsToInsert.map(item => ({
      ...item,
      order_id: orderData.id,
    }));

    const { error: itemsInsertErr } = await supabase
      .from('order_items')
      .insert(itemsPayload);

    if (itemsInsertErr) {
      console.error('Order items creation error:', itemsInsertErr);
      // Clean up order to prevent orphans
      await supabase.from('orders').delete().eq('id', orderData.id);
      res.status(500).json({ success: false, message: 'Failed to record order items.' });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        ...orderData,
        items: itemsPayload,
      },
    });
  } catch (err: any) {
    console.error('Order placement exception:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
  }
});

/**
 * GET /api/orders
 * Returns customer's past orders with items.
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user!.id;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/orders/:id
 * Returns single order details.
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user!.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', id)
      .eq('customer_id', customerId)
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

/**
 * PATCH /api/orders/:id/status
 * Owner/Admin endpoint to update order status.
 * Enforces separate lifecycles:
 *   - DELIVERY: CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED
 *   - PICKUP:   CONFIRMED → PREPARING → READY → PICKED_UP
 */
router.patch('/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only the bakery owner or admin can update order status.',
      });
      return;
    }

    const { id } = req.params;
    const { status: targetStatus } = req.body;

    if (!targetStatus || typeof targetStatus !== 'string') {
      res.status(400).json({ success: false, message: 'Target status is required.' });
      return;
    }

    // 1. Fetch current order
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // 2. Validate transition against delivery_type
    const deliveryType = order.delivery_type as 'DELIVERY' | 'PICKUP';
    const isValid = isValidOrderStatusTransition(deliveryType, order.status, targetStatus);

    if (!isValid) {
      if (deliveryType === 'DELIVERY' && (targetStatus === 'READY' || targetStatus === 'PICKED_UP')) {
        res.status(400).json({
          success: false,
          message: `Delivery orders cannot transition to "${targetStatus}". Allowed delivery lifecycle: CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED.`,
        });
        return;
      }

      if (deliveryType === 'PICKUP' && (targetStatus === 'OUT_FOR_DELIVERY' || targetStatus === 'DELIVERED')) {
        res.status(400).json({
          success: false,
          message: `Pickup orders cannot transition to "${targetStatus}". Allowed pickup lifecycle: CONFIRMED → PREPARING → READY → PICKED_UP.`,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: `Invalid status transition for ${deliveryType} order from "${order.status}" to "${targetStatus}".`,
      });
      return;
    }

    // 3. Update status in database
    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({
        status: targetStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('Failed to update order status:', updateErr);
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

export default router;
