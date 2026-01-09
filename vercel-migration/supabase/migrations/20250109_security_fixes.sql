-- ============================================================================
-- SECURITY FIX: Enable RLS and fix SECURITY DEFINER views
-- ============================================================================
-- Created: 2025-01-09
-- Description: Fix security issues reported by Supabase linter
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON TABLES WITHOUT IT
-- ============================================================================

-- Enable RLS on verification_tokens (admin only access)
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for verification_tokens
CREATE POLICY "Only admins can view verification tokens"
  ON verification_tokens FOR SELECT
  USING (false); -- Nobody can query this directly via API

CREATE POLICY "Only admins can manage verification tokens"
  ON verification_tokens FOR ALL
  USING (false); -- Nobody can manage this directly via API

-- Enable RLS on promotion_treatments
ALTER TABLE promotion_treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own promotion treatments"
  ON promotion_treatments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM promotions
      WHERE promotions.id = promotion_treatments.promotion_id
      AND promotions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own promotion treatments"
  ON promotion_treatments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM promotions
      WHERE promotions.id = promotion_treatments.promotion_id
      AND promotions.user_id = auth.uid()
    )
  );

-- Enable RLS on cleanup_logs (admin only)
ALTER TABLE cleanup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view cleanup logs"
  ON cleanup_logs FOR SELECT
  USING (false); -- System table, no direct API access

-- Enable RLS on platform_fee_settings (admin only)
ALTER TABLE platform_fee_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view platform fee settings"
  ON platform_fee_settings FOR SELECT
  USING (true); -- Everyone can see fee structure

CREATE POLICY "Only admins can modify platform fee settings"
  ON platform_fee_settings FOR ALL
  USING (false); -- Only via admin functions

-- Enable RLS on seller_commissions (admin only)
ALTER TABLE seller_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view seller commissions"
  ON seller_commissions FOR SELECT
  USING (false); -- Admin panel only, no direct API access

CREATE POLICY "Only admins can manage seller commissions"
  ON seller_commissions FOR ALL
  USING (false); -- Admin panel only

-- Enable RLS on sellers (admin only)
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view sellers"
  ON sellers FOR SELECT
  USING (false); -- Admin panel only, no direct API access

CREATE POLICY "Only admins can manage sellers"
  ON sellers FOR ALL
  USING (false); -- Admin panel only

-- ============================================================================
-- 2. FIX SECURITY DEFINER VIEWS
-- ============================================================================
-- Note: SECURITY DEFINER views can be risky. We'll document them and ensure
-- they have proper RLS or are recreated without SECURITY DEFINER if possible

-- deposit_analytics view - Change to SECURITY INVOKER or add RLS
DROP VIEW IF EXISTS deposit_analytics CASCADE;
CREATE OR REPLACE VIEW deposit_analytics
WITH (security_invoker = true)
AS
SELECT
  d.id,
  d.user_id,
  d.deposit_amount,
  d.deposit_date,
  d.status,
  d.created_at,
  u.email as user_email,
  up.full_name as user_name
FROM deposits d
LEFT JOIN auth.users u ON d.user_id = u.id
LEFT JOIN user_profiles up ON d.user_id = up.id
WHERE d.user_id = auth.uid(); -- Only show user's own deposits

-- seller_commission_summary view
DROP VIEW IF EXISTS seller_commission_summary CASCADE;
CREATE OR REPLACE VIEW seller_commission_summary
WITH (security_invoker = true)
AS
SELECT
  s.id as seller_id,
  s.name as seller_name,
  s.email as seller_email,
  COUNT(DISTINCT sc.subscription_id) as total_sales,
  COUNT(sc.id) as commissions_earned,
  SUM(CASE WHEN sc.paid_to_seller = false THEN sc.commission_amount ELSE 0 END) as pending_amount,
  SUM(CASE WHEN sc.paid_to_seller = true THEN sc.commission_amount ELSE 0 END) as paid_amount,
  SUM(sc.commission_amount) as total_commission_amount
FROM sellers s
LEFT JOIN seller_commissions sc ON s.id = sc.seller_id
GROUP BY s.id, s.name, s.email;

-- platform_fees_summary view
DROP VIEW IF EXISTS platform_fees_summary CASCADE;
CREATE OR REPLACE VIEW platform_fees_summary
WITH (security_invoker = true)
AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_transactions,
  SUM(platform_fee_amount) as total_fees,
  SUM(net_amount) as total_net_amount
FROM subscriptions
WHERE platform_fee_amount > 0
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- pending_seller_payments view
DROP VIEW IF EXISTS pending_seller_payments CASCADE;
CREATE OR REPLACE VIEW pending_seller_payments
WITH (security_invoker = true)
AS
SELECT
  sc.id,
  sc.seller_id,
  s.name as seller_name,
  sc.subscription_id,
  sub.customer_email,
  up.full_name as customer_name,
  sc.month_number,
  sc.billing_date,
  sc.commission_stage,
  sc.gross_amount,
  sc.commission_amount,
  sc.stripe_invoice_id
FROM seller_commissions sc
JOIN sellers s ON sc.seller_id = s.id
JOIN subscriptions sub ON sc.subscription_id = sub.id
LEFT JOIN user_profiles up ON sub.user_id = up.id
WHERE sc.paid_to_seller = false
ORDER BY sc.billing_date ASC;

-- ============================================================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE verification_tokens IS 'Email verification tokens - Admin access only, not exposed via API';
COMMENT ON TABLE cleanup_logs IS 'System cleanup logs - Admin monitoring only';
COMMENT ON TABLE platform_fee_settings IS 'Platform fee configuration - Read-only for users, admin-managed';
COMMENT ON TABLE seller_commissions IS 'Seller commission tracking - Admin panel access only';
COMMENT ON TABLE sellers IS 'Seller/referral agents - Admin panel access only';

COMMENT ON VIEW deposit_analytics IS 'Analytics view for deposits - Uses SECURITY INVOKER for proper RLS';
COMMENT ON VIEW seller_commission_summary IS 'Summary of seller commissions - Admin analytics';
COMMENT ON VIEW platform_fees_summary IS 'Platform fee analytics - Admin dashboard';
COMMENT ON VIEW pending_seller_payments IS 'Pending seller payments - Admin payment processing';
