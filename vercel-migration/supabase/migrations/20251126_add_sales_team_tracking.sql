-- Migration: Add sales team tracking for referral system
-- Date: 2025-11-26
-- Description: Adds columns to track which sales team (internal vs distributor) made each sale
--              and application fee percentages for Stripe Connect integration

-- Add sales team tracking to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS sales_team TEXT CHECK (sales_team IN ('internal', 'distributor')) DEFAULT 'internal',
ADD COLUMN IF NOT EXISTS application_fee_percent DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- Add index for faster queries by sales team
CREATE INDEX IF NOT EXISTS idx_subscriptions_sales_team ON subscriptions(sales_team);
CREATE INDEX IF NOT EXISTS idx_subscriptions_referral_source ON subscriptions(referral_source);

-- Add sales team tracking to connected_accounts table
ALTER TABLE connected_accounts 
ADD COLUMN IF NOT EXISTS sales_team TEXT CHECK (sales_team IN ('internal', 'distributor'));

-- Add unique constraint to ensure only one account per sales team
CREATE UNIQUE INDEX IF NOT EXISTS idx_connected_accounts_sales_team 
ON connected_accounts(sales_team) 
WHERE sales_team IS NOT NULL;

-- Add sales team to subscription_addons for tracking
ALTER TABLE subscription_addons
ADD COLUMN IF NOT EXISTS sales_team TEXT CHECK (sales_team IN ('internal', 'distributor'));

-- Comment on columns for documentation
COMMENT ON COLUMN subscriptions.sales_team IS 'Which sales team generated this subscription (internal or distributor)';
COMMENT ON COLUMN subscriptions.application_fee_percent IS 'Percentage of revenue that goes to platform owner (e.g., 70 for 70%)';
COMMENT ON COLUMN subscriptions.platform_fee_amount IS 'Calculated amount in local currency that platform owner receives';
COMMENT ON COLUMN subscriptions.referral_source IS 'Original referral parameter (e.g., "dist", "internal", campaign codes)';
COMMENT ON COLUMN connected_accounts.sales_team IS 'Designates this Stripe Connect account as belonging to a specific sales team';
