/**
 * client/src/config/businessPolicy.ts
 *
 * Authoritative client-side business policy configuration for Cake Box Kakinada.
 * Reflects server/src/services/businessRules.ts CANCELLATION_POLICY.
 */

export interface PolicySection {
  title: string;
  rules: string[];
}

export const CANCELLATION_AND_REFUND_POLICY = {
  summary:
    'Standard Retail: 100% refund if cancelled 24+ hrs prior (non-refundable within 24 hrs). Custom Cakes: Full refund less deposit 14+ days prior; 50% refund or store credit 7–13 days prior; non-refundable within 7 days. Initial custom deposits (20–50%) are non-refundable. Handover transfers transport liability to customer. Approved refunds processed in 5–10 business days.',

  sections: [
    {
      title: 'Standard / Daily Retail Items',
      rules: [
        'Cancellations made at least 24 hours prior to scheduled pickup or delivery are eligible for a 100% refund.',
        'Cancellations made less than 24 hours prior will not receive a monetary refund, as baking preparation may have already begun.',
      ],
    },
    {
      title: 'Custom & Special Event Orders (Wedding Cakes, Large / Event Orders)',
      rules: [
        'Cancellations made 14 days or more before the scheduled event date receive a full refund minus a non-refundable deposit/administrative fee.',
        'Cancellations made 7–13 days prior receive a 50% refund OR store credit.',
        'Cancellations made less than 7 days prior are non-refundable.',
      ],
    },
    {
      title: 'Non-Refundable Items & Deposits',
      rules: [
        'All custom cake initial deposits (typically 20–50%) are non-refundable.',
        'Perishable items that have already been prepared, baked, decorated, or picked up cannot be returned or refunded due to health and safety standards.',
        'Note: MVP payment is currently Cash on Delivery/Pickup; actual deposit collection will be introduced in a future online payment phase.',
      ],
    },
    {
      title: 'Returns & Quality Issues',
      rules: [
        'Defects / Wrong Orders: Customer should notify the bakery within 2–24 hours of receipt with proof (order receipt and photographs).',
        'Taste / Appearance Discrepancies: Handcrafted baked goods may have minor visual variations. If there is a verified quality deficit (e.g. severe underbaking or incorrect filling), return at least 75% of the unconsumed product within 24 hours for evaluation.',
        'Possible remedies upon evaluation: partial refund, replacement, or store credit.',
      ],
    },
    {
      title: 'Pickup & Transport Liability',
      rules: [
        'Once an order leaves the premises through customer pickup or verified third-party delivery, the customer assumes responsibility for transport, handling, and proper temperature storage.',
        'The bakery is not liable for damage caused by improper handling, warm vehicle transport, or poor storage after handover.',
      ],
    },
    {
      title: 'Refund Method & Processing Time',
      rules: [
        'Approved refunds are credited back to the original payment method within 5–10 business days (handled directly by bakery management for cash transactions).',
      ],
    },
  ],
} as const;

/**
 * Order status transition rules — mirrors server/src/services/businessRules.ts.
 * Used client-side ONLY for display logic in the Owner Dashboard.
 * The server always enforces the authoritative transitions.
 */
export const REGULAR_ORDER_RULES = {
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

