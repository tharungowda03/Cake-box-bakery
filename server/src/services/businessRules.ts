/**
 * server/src/services/businessRules.ts
 *
 * Authoritative business rules for Cake Box Kakinada MVP.
 *
 * This module documents and enforces:
 *   - Regular order rules
 *   - Custom cake order rules
 *   - Cancellation policy (placeholder — owner must confirm exact terms)
 *
 * AI MUST NEVER:
 *   - Set or suggest product/delivery/order prices
 *   - Accept or reject custom cake requests
 *   - Confirm custom orders on behalf of the customer
 *   - Apply cancellation refunds automatically
 */

// ---------------------------------------------------------------------------
// Regular Order Rules
// ---------------------------------------------------------------------------

export const REGULAR_ORDER_RULES = {
  /**
   * MVP: only CASH on delivery is supported.
   * This value must always be forced by the backend — never trusted from client.
   */
  paymentMethod: 'CASH' as const,

  /**
   * Regular ready-made orders are auto-confirmed by the backend once all
   * validations pass. No owner approval required.
   */
  confirmedStatus: 'CONFIRMED' as const,

  /**
   * Fields the backend MUST calculate/validate — these must NEVER be
   * accepted from the client request payload:
   *   - unit_price       (from product_variants.price in DB)
   *   - line_total       (quantity × unit_price)
   *   - subtotal         (sum of line_totals)
   *   - delivery_fee     (from deliveryService.checkServiceability)
   *   - total            (subtotal + delivery_fee − discount)
   *   - discount         (0 for MVP unless a promotion applies)
   *   - status           (always set to CONFIRMED by backend)
   *   - payment_status   (always set to PENDING for CASH orders)
   *   - customer_id      (from auth.uid() — never from request body)
   *   - branch_id        (from bakery_settings — never from request body)
   */
  trustedFieldsFromDB: [
    'unit_price',
    'line_total',
    'subtotal',
    'delivery_fee',
    'total',
    'discount',
    'status',
    'payment_status',
    'customer_id',
    'branch_id',
  ] as const,
} as const;

// ---------------------------------------------------------------------------
// Custom Cake Order Rules
// ---------------------------------------------------------------------------

export const CUSTOM_CAKE_RULES = {
  /**
   * Customer creates a custom cake request. Initial status is always PENDING.
   * The backend enforces this — it is never accepted from the client.
   */
  initialStatus: 'PENDING' as const,

  /**
   * Allowed status transitions:
   *   PENDING  → ACCEPTED  (owner only)
   *   PENDING  → REJECTED  (owner only)
   *   ACCEPTED → QUOTED    (owner only — owner sets final_price)
   *   QUOTED   → CONFIRMED (customer only — customer reviews and confirms)
   *
   * AI MUST NOT perform any of these transitions.
   */
  statusTransitions: {
    PENDING:   ['ACCEPTED', 'REJECTED'] as const, // owner only
    ACCEPTED:  ['QUOTED']              as const, // owner only; final_price must be set
    QUOTED:    ['CONFIRMED']           as const, // customer only
    REJECTED:  []                      as const, // terminal
    CONFIRMED: []                      as const, // terminal
  },

  /**
   * Required fields the customer must supply when creating a custom order.
   */
  requiredCustomerFields: [
    'mobile_number',
    'required_date',
    'preferred_time',
    'additional_requirements', // cake description / requirements
  ] as const,

  /**
   * Optional fields the customer may supply.
   */
  optionalCustomerFields: [
    'flavour',
    'occasion',   // maps to cake_type / occasion concept
    'weight',
    'cake_message',
    'theme',
    'reference_image_path', // uploaded to custom-cake-references storage bucket
  ] as const,

  /**
   * Storage bucket for customer reference images.
   * Files must be stored under a path prefixed by the customer's auth.uid()
   * so that storage RLS policies (Customer upload references) are satisfied.
   *
   * Recommended path format: {auth.uid()}/{timestamp}_{filename}
   */
  referenceImageBucket: 'custom-cake-references' as const,

  /**
   * Fields the backend MUST NOT accept from customers — owner-only:
   *   - status (must start at PENDING)
   *   - final_price (owner sets this when issuing a quotation)
   *   - owner_notes
   */
  ownerOnlyFields: ['status', 'final_price', 'owner_notes'] as const,

  /**
   * Price rules:
   *   - AI must NEVER set or suggest final_price.
   *   - Only the owner (OWNER role) may set final_price.
   *   - final_price is set when transitioning status to QUOTED.
   */
  pricingRules: {
    setBy: 'OWNER',
    aiMaySetPrice: false,
    aiMayAcceptReject: false,
    aiMayConfirm: false,
  } as const,
} as const;

// ---------------------------------------------------------------------------
// Cancellation Policy
// ---------------------------------------------------------------------------

/**
 * Cancellation policy for Cake Box Kakinada MVP.
 *
 * The owner indicated cancellation should follow a policy similar to
 * mainstream food-delivery platforms. Exact terms (refund percentages,
 * time windows, penalties) have NOT yet been confirmed.
 *
 * DO NOT invent or hard-code specific percentages or windows.
 * The owner must confirm and configure the final policy.
 *
 * Structure: configurable so the owner can define terms later without
 * architectural changes.
 */
export const CANCELLATION_POLICY = {
  /**
   * Human-readable policy description shown to customers until the owner
   * confirms exact terms.
   */
  displayText:
    'Cancellation policy to be confirmed by Cake Box Kakinada.',

  /**
   * Whether cancellations are currently allowed at all for regular orders.
   * Owner can set this to false to disable cancellations entirely.
   */
  cancellationEnabled: true,

  /**
   * Placeholder for future owner-configured rules.
   * Keys are intentionally undefined until the owner confirms terms.
   *
   * Example structure (DO NOT populate until owner confirms):
   * {
   *   windowMinutes: number,          // cancellation allowed within N minutes of order
   *   refundPercentage: number,       // 0–100
   *   allowedStatuses: OrderStatus[], // which statuses allow cancellation
   * }
   */
  configuredRules: null as null | {
    windowMinutes: number;
    refundPercentage: number;
    allowedStatuses: string[];
  },

  /**
   * Regular orders: cancellation is only possible while in CONFIRMED status
   * (before PREPARING begins). Owner must confirm exact window.
   *
   * Custom orders: PENDING/ACCEPTED requests may be cancelled by the customer.
   * QUOTED orders may be declined (not confirmed) by the customer.
   * CONFIRMED custom orders follow the owner's policy.
   */
  notes: [
    'Regular order cancellation window not yet confirmed by owner.',
    'Custom cake requests in PENDING/ACCEPTED status may be withdrawn by customer.',
    'QUOTED custom orders may be declined by customer (do not confirm).',
    'Refund terms and penalties must be confirmed and configured by Cake Box Kakinada owner.',
  ],
} as const;
