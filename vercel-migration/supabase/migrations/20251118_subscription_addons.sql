-- ============================================================================
-- SUBSCRIPTION ADD-ONS SYSTEM
-- ============================================================================
-- Created: 2025-11-18
-- Description: Sistema de add-ons para vender ubicaciones extra y doctores adicionales
-- ============================================================================

-- ============================================================================
-- 1. SUBSCRIPTION ADD-ONS TABLE
-- ============================================================================
-- Stores purchased add-ons per user subscription
CREATE TABLE IF NOT EXISTS subscription_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- Add-on details
  addon_type TEXT NOT NULL CHECK (addon_type IN ('extra_location', 'extra_doctor', 'integration', 'telemedicine')),
  stripe_subscription_item_id TEXT UNIQUE, -- Stripe subscription item ID (for billing)
  stripe_price_id TEXT NOT NULL,
  
  -- Quantity and pricing
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  
  -- Metadata (flexible JSON for future extensions)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  
  -- Ensure user has subscription
  CONSTRAINT fk_subscription_addons_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscription_addons_user_id 
  ON subscription_addons(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_addons_subscription_id 
  ON subscription_addons(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_addons_type 
  ON subscription_addons(addon_type) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscription_addons_stripe_item 
  ON subscription_addons(stripe_subscription_item_id) WHERE stripe_subscription_item_id IS NOT NULL;

-- ============================================================================
-- 2. HELPER FUNCTIONS
-- ============================================================================

-- Function to get total add-on quantity by type for a user
CREATE OR REPLACE FUNCTION get_user_addon_quantity(
  p_user_id UUID,
  p_addon_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(quantity), 0)
  INTO v_total
  FROM subscription_addons
  WHERE user_id = p_user_id
    AND addon_type = p_addon_type
    AND status = 'active';
    
  RETURN v_total;
END;
$$;

-- Function to calculate effective limits including add-ons
CREATE OR REPLACE FUNCTION get_effective_limits(p_user_id UUID)
RETURNS TABLE(
  max_locations INTEGER,
  max_doctors INTEGER,
  plan_tier TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_plan_locations INTEGER;
  v_plan_doctors INTEGER;
  v_plan_tier TEXT;
  v_extra_locations INTEGER;
  v_extra_doctors INTEGER;
BEGIN
  -- Get base plan limits
  SELECT s.max_locations, s.max_doctors, s.plan_tier
  INTO v_plan_locations, v_plan_doctors, v_plan_tier
  FROM subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- If no subscription, return defaults
  IF v_plan_locations IS NULL THEN
    RETURN QUERY SELECT 1::INTEGER, 2::INTEGER, 'basico'::TEXT;
    RETURN;
  END IF;
  
  -- Get add-on quantities
  SELECT COALESCE(SUM(quantity), 0)
  INTO v_extra_locations
  FROM subscription_addons
  WHERE user_id = p_user_id
    AND addon_type = 'extra_location'
    AND status = 'active';
    
  SELECT COALESCE(SUM(quantity), 0)
  INTO v_extra_doctors
  FROM subscription_addons
  WHERE user_id = p_user_id
    AND addon_type = 'extra_doctor'
    AND status = 'active';
  
  -- Return combined limits
  RETURN QUERY SELECT 
    v_plan_locations + v_extra_locations,
    v_plan_doctors + v_extra_doctors,
    v_plan_tier;
END;
$$;

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_addons_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_subscription_addons_updated_at
  BEFORE UPDATE ON subscription_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_addons_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE subscription_addons ENABLE ROW LEVEL SECURITY;

-- Users can view their own add-ons
CREATE POLICY "Users can view own add-ons"
  ON subscription_addons FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own add-ons (via API only, but policy required)
CREATE POLICY "Users can insert own add-ons"
  ON subscription_addons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own add-ons (for cancellations)
CREATE POLICY "Users can update own add-ons"
  ON subscription_addons FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE subscription_addons IS 'Stores purchased add-ons (extra locations, extra doctors, etc.) for user subscriptions';
COMMENT ON COLUMN subscription_addons.addon_type IS 'Type of add-on: extra_location, extra_doctor, integration, telemedicine';
COMMENT ON COLUMN subscription_addons.stripe_subscription_item_id IS 'Stripe subscription item ID for recurring billing';
COMMENT ON COLUMN subscription_addons.quantity IS 'Number of add-on units purchased (e.g., 2 extra locations)';
COMMENT ON COLUMN subscription_addons.unit_price IS 'Price per unit in MXN (e.g., 499.00 for location, 199.00 for doctor)';
COMMENT ON COLUMN subscription_addons.metadata IS 'Flexible JSON for storing additional data (location_ids, doctor_ids, etc.)';

COMMENT ON FUNCTION get_user_addon_quantity(UUID, TEXT) IS 'Returns total quantity of active add-ons for a user by type';
COMMENT ON FUNCTION get_effective_limits(UUID) IS 'Calculates total limits including base plan + add-ons';
