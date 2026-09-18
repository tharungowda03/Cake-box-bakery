/**
 * server/src/services/deliveryService.ts
 *
 * Centralized delivery logic for Cake Box Kakinada.
 *
 * ALL delivery calculations MUST route through this module.
 * Frontend components must NEVER compute serviceability or delivery charges.
 *
 * Reads live configuration from bakery_settings (service_radius_km,
 * delivery_fee as per-km rate, delivery_enabled) so that the owner can
 * update values in Supabase without a code deployment.
 */

import { supabase } from '../config/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BranchLocation {
  /**
   * Latitude of the Cake Box branch.
   * NOTE: Current value (16.9891) is a provisional Kakinada city-center coordinate.
   * TODO: Owner must verify and confirm the exact Cake Box Google Maps pin before launch.
   */
  latitude: number;
  /**
   * Longitude of the Cake Box branch.
   * NOTE: Current value (82.2475) is a provisional Kakinada city-center coordinate.
   * TODO: Owner must verify and confirm the exact Cake Box Google Maps pin before launch.
   */
  longitude: number;
}

export interface DeliverySettings {
  deliveryEnabled: boolean;
  serviceRadiusKm: number;
  /** Stored in bakery_settings.delivery_fee column. Semantically: INR per km. */
  chargePerKm: number;
  branchLocation: BranchLocation;
}

export interface ServiceabilityResult {
  serviceable: boolean;
  distanceKm: number;
  /** Rounded to nearest INR. 0 if not serviceable. */
  deliveryChargeInr: number;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Haversine distance calculation
// ---------------------------------------------------------------------------

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance between two geographic coordinates
 * using the Haversine formula.
 *
 * @returns Distance in kilometres (floating point).
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// ---------------------------------------------------------------------------
// Settings loader
// ---------------------------------------------------------------------------

/**
 * Loads live delivery settings from Supabase (bakery_settings + branch).
 * Uses service-role key so it bypasses RLS — this is a backend-only call.
 */
export async function loadDeliverySettings(): Promise<DeliverySettings> {
  const { data, error } = await supabase
    .from('bakery_settings')
    .select(`
      delivery_enabled,
      service_radius_km,
      delivery_fee,
      branches (
        latitude,
        longitude
      )
    `)
    .eq('delivery_enabled', true)
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to load delivery settings from Supabase: ${error?.message ?? 'no row found'}`
    );
  }

  const branch = data.branches as unknown as { latitude: number | null; longitude: number | null };

  if (branch.latitude == null || branch.longitude == null) {
    throw new Error(
      'Branch coordinates (latitude/longitude) are not configured. ' +
      'Please update the branches table with the Cake Box GPS location.'
    );
  }

  return {
    deliveryEnabled: data.delivery_enabled,
    serviceRadiusKm: Number(data.service_radius_km),
    chargePerKm: Number(data.delivery_fee), // per-km rate stored in delivery_fee column
    branchLocation: {
      latitude: Number(branch.latitude),
      longitude: Number(branch.longitude),
    },
  };
}

// ---------------------------------------------------------------------------
// Core serviceability check
// ---------------------------------------------------------------------------

/**
 * Determines whether a customer's location is serviceable and calculates
 * the delivery charge.
 *
 * delivery_charge = distance_km × chargePerKm, rounded to nearest INR.
 *
 * This is the ONLY place this calculation must live. Do NOT duplicate it
 * in frontend components.
 *
 * @param customerLat - Customer's delivery latitude.
 * @param customerLng - Customer's delivery longitude.
 * @param settings    - Settings loaded via loadDeliverySettings(). Pass
 *                      pre-loaded settings to avoid redundant DB calls
 *                      within a single request.
 */
export function checkServiceability(
  customerLat: number,
  customerLng: number,
  settings: DeliverySettings
): ServiceabilityResult {
  if (!settings.deliveryEnabled) {
    return {
      serviceable: false,
      distanceKm: 0,
      deliveryChargeInr: 0,
      reason: 'Delivery is currently disabled.',
    };
  }

  const distanceKm = haversineDistanceKm(
    settings.branchLocation.latitude,
    settings.branchLocation.longitude,
    customerLat,
    customerLng
  );

  if (distanceKm > settings.serviceRadiusKm) {
    return {
      serviceable: false,
      distanceKm: Math.round(distanceKm * 100) / 100,
      deliveryChargeInr: 0,
      reason: `Customer location is ${distanceKm.toFixed(2)} km away, which exceeds the ${settings.serviceRadiusKm} km service radius.`,
    };
  }

  // Round delivery charge to nearest INR as required
  const deliveryChargeInr = Math.round(distanceKm * settings.chargePerKm);

  return {
    serviceable: true,
    distanceKm: Math.round(distanceKm * 100) / 100,
    deliveryChargeInr,
  };
}

/**
 * Convenience function that loads settings then checks serviceability.
 * Use this when settings haven't been pre-loaded.
 */
export async function checkServiceabilityLive(
  customerLat: number,
  customerLng: number
): Promise<ServiceabilityResult> {
  const settings = await loadDeliverySettings();
  return checkServiceability(customerLat, customerLng, settings);
}
