-- Migration: 002_add_pickup_order_statuses.sql
-- Purpose: Update public.orders.status CHECK constraint to include READY and PICKED_UP for pickup orders.
-- Author: Cake Box Kakinada Hotfix

ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check
CHECK (
  status IN (
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED'
  )
);
