import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { CUSTOM_CAKE_RULES } from '../services/businessRules';

const router = Router();

/**
 * POST /api/custom-orders
 * Customer submits a custom cake request.
 * Backend strictly forces status = 'PENDING' and ignores any final_price or owner_notes.
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user!.id;
    const {
      occasion,
      flavour,
      weight,
      theme,
      cake_message,
      required_date,
      preferred_time,
      delivery_type,
      mobile_number,
      additional_requirements,
      reference_image_path,
    } = req.body;

    // Validate required fields according to business audit rules
    if (!required_date) {
      res.status(400).json({ success: false, message: 'Preferred event date is mandatory for custom cake orders.' });
      return;
    }
    if (!preferred_time || !preferred_time.trim()) {
      res.status(400).json({ success: false, message: 'Preferred time is required for custom cake orders.' });
      return;
    }
    if (!mobile_number || !/^\+?[0-9]{10,13}$/.test(mobile_number.replace(/\s+/g, ''))) {
      res.status(400).json({ success: false, message: 'Valid mobile contact number is required.' });
      return;
    }
    if (!additional_requirements || !additional_requirements.trim()) {
      res.status(400).json({ success: false, message: 'Additional cake requirements/description are mandatory.' });
      return;
    }
    if (!delivery_type || !['DELIVERY', 'PICKUP'].includes(delivery_type)) {
      res.status(400).json({ success: false, message: 'Delivery type must be DELIVERY or PICKUP.' });
      return;
    }

    // Fetch active branch
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

    const { data, error } = await supabase
      .from('custom_orders')
      .insert({
        customer_id: customerId,
        branch_id: branch.id,
        occasion: occasion || null,
        flavour: flavour || null,
        weight: weight || null,
        theme: theme || null,
        cake_message: cake_message || null,
        required_date,
        preferred_time: preferred_time || null,
        delivery_type,
        reference_image_path: reference_image_path || null,
        mobile_number,
        additional_requirements: additional_requirements || null,
        owner_notes: null,
        final_price: null,
        status: CUSTOM_CAKE_RULES.initialStatus, // ALWAYS 'PENDING'
      })
      .select()
      .single();

    if (error) {
      console.error('Custom cake creation error:', error);
      res.status(500).json({ success: false, message: 'Failed to submit custom cake inquiry.' });
      return;
    }

    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/custom-orders
 * Customer retrieves their custom cake requests.
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user!.id;

    const { data, error } = await supabase
      .from('custom_orders')
      .select('*')
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
 * GET /api/custom-orders/:id
 * Customer views a specific custom cake inquiry.
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user!.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('custom_orders')
      .select('*')
      .eq('id', id)
      .eq('customer_id', customerId)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, message: 'Custom order request not found.' });
      return;
    }

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/custom-orders/:id/confirm
 * Customer confirms the owner's price quote.
 * Only valid if current status is 'QUOTED'. Transitions to 'CONFIRMED'.
 */
router.patch('/:id/confirm', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user!.id;
    const { id } = req.params;

    // 1. Fetch custom order
    const { data: order, error: fetchErr } = await supabase
      .from('custom_orders')
      .select('*')
      .eq('id', id)
      .eq('customer_id', customerId)
      .single();

    if (fetchErr || !order) {
      res.status(404).json({ success: false, message: 'Custom order not found.' });
      return;
    }

    if (order.status !== 'QUOTED') {
      res.status(400).json({
        success: false,
        message: `Cannot confirm order with status "${order.status}". Only QUOTED orders can be confirmed.`,
      });
      return;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('custom_orders')
      .update({
        status: 'CONFIRMED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      res.status(500).json({ success: false, message: 'Failed to confirm custom order.' });
      return;
    }

    res.json({
      success: true,
      message: 'Custom cake quote confirmed successfully! Our team will prepare it for you.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
