import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/addresses
 * Customer retrieves their saved delivery addresses.
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user!.id;

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
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
 * POST /api/addresses
 * Customer saves a new delivery address.
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user!.id;
    const {
      recipient_name,
      phone,
      house_flat_building,
      street,
      area_locality,
      landmark,
      city,
      state,
      postal_code,
      latitude,
      longitude,
      delivery_instructions,
      is_default,
    } = req.body;

    if (!recipient_name || !phone || !house_flat_building || !street || !area_locality) {
      res.status(400).json({
        success: false,
        message: 'Name, phone, house/flat, street, and area locality are mandatory.',
      });
      return;
    }

    // If setting default, unset existing default first
    if (is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        customer_id: customerId,
        recipient_name,
        phone,
        house_flat_building,
        street,
        area_locality,
        landmark: landmark || null,
        city: city || 'Kakinada',
        state: state || 'Andhra Pradesh',
        postal_code: postal_code || '533001',
        latitude: latitude ? Number(latitude) : 16.9891, // default nearby Kakinada center if unpinned
        longitude: longitude ? Number(longitude) : 82.2475,
        delivery_instructions: delivery_instructions || null,
        is_default: !!is_default,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/addresses/:id
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user!.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('customer_id', customerId);

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.json({ success: true, message: 'Address removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
