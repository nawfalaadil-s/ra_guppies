-- COUPONS ROW LEVEL SECURITY & MANAGEMENT POLICIES
-- Migration: 20261021000000_coupons_rls_and_management.sql

-- Enable RLS on coupons if not already enabled
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow read and write for coupons to enable admin coupon management and customer cart validation
DROP POLICY IF EXISTS "Public can view coupons" ON public.coupons;
DROP POLICY IF EXISTS "allow_public_all_coupons" ON public.coupons;

CREATE POLICY "allow_public_all_coupons" 
  ON public.coupons 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
