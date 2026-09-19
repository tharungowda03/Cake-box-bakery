import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/profile
 * Returns the current authenticated user's profile and account information.
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.json({
      success: true,
      data: {
        ...profile,
        email: req.user!.email,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/profile
 * Updates the current authenticated user's profile information (full_name, phone).
 * Role changes are STRICTLY rejected to prevent privilege escalation.
 */
router.patch('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { full_name, phone, role } = req.body;

    // Reject attempt to alter role from client
    if (role !== undefined) {
      res.status(403).json({
        success: false,
        message: 'Account role cannot be modified via profile settings.',
      });
      return;
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof full_name === 'string') {
      updates.full_name = full_name.trim();
    }
    if (typeof phone === 'string') {
      updates.phone = phone.trim();
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('id, full_name, phone, role, created_at, updated_at')
      .single();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        ...updated,
        email: req.user!.email,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
