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

  /**
   * Allowed status transitions by fulfilment type:
   *
   * DELIVERY:
   *   CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED
   *
   * PICKUP:
   *   CONFIRMED → PREPARING → READY → PICKED_UP
   *
   * Delivery orders CANNOT transition to READY or PICKED_UP.
   * Pickup orders CANNOT transition to OUT_FOR_DELIVERY or DELIVERED.
   * Both can transition to CANCELLED from non-terminal states.
   */
  statusTransitions: {
    DELIVERY: {
      CONFIRMED: ['PREPARING', 'CANCELLED'] as const,
      PREPARING: ['OUT_FOR_DELIVERY', 'CANCELLED'] as const,
      OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'] as const,
      DELIVERED: [] as const,
      CANCELLED: [] as const,
    },
    PICKUP: {
      CONFIRMED: ['PREPARING', 'CANCELLED'] as const,
      PREPARING: ['READY', 'CANCELLED'] as const,
      READY: ['PICKED_UP', 'CANCELLED'] as const,
      PICKED_UP: [] as const,
      CANCELLED: [] as const,
    },
  },
} as const;

export function isValidOrderStatusTransition(
  deliveryType: 'DELIVERY' | 'PICKUP',
  currentStatus: string,
  targetStatus: string
): boolean {
  const transitions = REGULAR_ORDER_RULES.statusTransitions[deliveryType];
  if (!transitions) return false;
  const allowed = (transitions as Record<string, readonly string[]>)[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}

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
 * Confirmed Cancellation Policy for Cake Box Kakinada.
 * Single source of truth for cancellation rules, timelines, and terms.
 */
export const CANCELLATION_POLICY = {
  displayText:
    'Standard Retail Items: 100% refund if cancelled at least 24 hours prior; non-refundable within 24 hours. Custom Cakes: Full refund (less deposit) if cancelled 14+ days prior; 50% refund or store credit 7–13 days prior; non-refundable within 7 days. Deposits are non-refundable. Transport liability passes to customer upon pickup/delivery handover. Approved refunds processed in 5–10 business days.',

  standardItems: {
    noticeWindowHours: 24,
    eligibleRefundPercentage: 100,
    lateCancellationRefundPercentage: 0,
    policyText:
      'Cancellations made at least 24 hours prior to scheduled pickup or delivery are eligible for a 100% refund. Cancellations made less than 24 hours prior will not receive a monetary refund, as baking preparation may have already begun.',
  },

  customOrders: {
    fourteenDaysOrMore: 'Full refund minus a non-refundable deposit/administrative fee.',
    sevenToThirteenDays: '50% refund OR store credit.',
    lessThanSevenDays: 'Non-refundable.',
    policyText:
      'Cancellations made 14 days or more before the scheduled event date receive a full refund minus a non-refundable deposit/administrative fee. Cancellations made 7–13 days prior receive a 50% refund OR store credit. Cancellations made less than 7 days prior are non-refundable.',
  },

  deposits: {
    nonRefundable: true,
    policyText:
      'All custom cake initial deposits (typically 20–50%) are non-refundable. Perishable items that have already been prepared, baked, decorated, or picked up cannot be returned or refunded due to health and safety standards. (Note: MVP uses cash on delivery/pickup).',
  },

  returnsAndQuality: {
    notificationWindowHours: 24,
    requiredEvidence: 'Order receipt and photographs within 2–24 hours of receipt.',
    tasteOrAppearanceDiscrepancies:
      'Handcrafted baked goods may have minor visual variations. For verified quality deficits (such as severe underbaking or incorrect filling), return at least 75% of unconsumed product within 24 hours for evaluation (remedies: partial refund, replacement, or store credit).',
  },

  transportLiability: {
    policyText:
      'Once an order leaves the premises through customer pickup or verified third-party delivery, the customer assumes responsibility for transport, handling, and proper temperature storage. The bakery is not liable for damage caused by improper handling, warm vehicle transport, or poor storage after handover.',
  },

  refundMethod: {
    processingTimeDays: '5–10 business days',
    policyText:
      'Approved refunds are credited back to the original payment method within 5–10 business days (owner-operated for cash transactions).',
  },

  cancellationEnabled: true,
} as const;

