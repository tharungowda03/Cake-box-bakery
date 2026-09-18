/**
 * server/src/routes/settings.ts
 *
 * Internal API route: GET /api/settings/delivery
 *
 * Returns current delivery configuration from bakery_settings.
 * Intended for use by the trusted Express backend (e.g. at checkout)
 * — NOT directly exposed to unauthenticated clients.
 *
 * bakery_settings has NO public SELECT RLS policy (Phase 2 security decision).
 * This route uses the service-role Supabase client (bypasses RLS).
 */

import { Router, Request, Response } from 'express';
import { loadDeliverySettings, checkServiceability } from '../services/deliveryService';
import { CANCELLATION_POLICY, CUSTOM_CAKE_RULES, REGULAR_ORDER_RULES } from '../services/businessRules';

const router = Router();

/**
 * GET /api/settings/delivery
 *
 * Returns the current delivery configuration.
 * In production this endpoint should be protected (internal network / auth header).
 */
router.get('/delivery', async (_req: Request, res: Response) => {
  try {
    const settings = await loadDeliverySettings();
    res.json({
      success: true,
      data: {
        deliveryEnabled: settings.deliveryEnabled,
        serviceRadiusKm: settings.serviceRadiusKm,
        chargePerKm: settings.chargePerKm,
        currency: 'INR',
        note: 'Delivery charge = distance_km × chargePerKm, rounded to nearest INR.',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/settings/check-serviceability
 *
 * Body: { latitude: number, longitude: number }
 *
 * Returns whether a customer location is serviceable and the delivery charge.
 * The backend is the single source of truth — clients must not compute this.
 */
router.post('/check-serviceability', async (req: Request, res: Response) => {
  const { latitude, longitude } = req.body ?? {};

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    res.status(400).json({
      success: false,
      message: 'Request body must include numeric latitude and longitude.',
    });
    return;
  }

  try {
    const settings = await loadDeliverySettings();
    const result = checkServiceability(latitude, longitude, settings);

    res.json({
      success: true,
      data: {
        serviceable: result.serviceable,
        distanceKm: result.distanceKm,
        deliveryChargeInr: result.deliveryChargeInr,
        currency: 'INR',
        ...(result.reason ? { reason: result.reason } : {}),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/settings/business-rules
 *
 * Returns read-only business rule summaries (non-sensitive).
 * Useful for admin dashboards and integration checks.
 */
router.get('/business-rules', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      regularOrders: {
        paymentMethod: REGULAR_ORDER_RULES.paymentMethod,
        confirmedStatus: REGULAR_ORDER_RULES.confirmedStatus,
        trustedFieldsFromDB: REGULAR_ORDER_RULES.trustedFieldsFromDB,
      },
      customCakes: {
        initialStatus: CUSTOM_CAKE_RULES.initialStatus,
        requiredCustomerFields: CUSTOM_CAKE_RULES.requiredCustomerFields,
        optionalCustomerFields: CUSTOM_CAKE_RULES.optionalCustomerFields,
        referenceImageBucket: CUSTOM_CAKE_RULES.referenceImageBucket,
        statusTransitions: CUSTOM_CAKE_RULES.statusTransitions,
        pricingRules: CUSTOM_CAKE_RULES.pricingRules,
      },
      cancellationPolicy: CANCELLATION_POLICY,
    },
  });
});

export default router;
