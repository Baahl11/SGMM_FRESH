-- Add user_id column to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);

-- Enable RLS on inventory_items
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can insert their own inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can update their own inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can delete their own inventory items" ON inventory_items;

-- Create RLS policies
CREATE POLICY "Users can view their own inventory items"
  ON inventory_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory items"
  ON inventory_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory items"
  ON inventory_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory items"
  ON inventory_items FOR DELETE
  USING (auth.uid() = user_id);

-- Add user_id column to inventory_movements table
ALTER TABLE inventory_movements 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for inventory_movements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_id ON inventory_movements(user_id);

-- Enable RLS on inventory_movements
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own inventory movements" ON inventory_movements;
DROP POLICY IF EXISTS "Users can insert their own inventory movements" ON inventory_movements;
DROP POLICY IF EXISTS "Users can delete their own inventory movements" ON inventory_movements;

-- Create RLS policies for inventory_movements
CREATE POLICY "Users can view their own inventory movements"
  ON inventory_movements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory movements"
  ON inventory_movements FOR DELETE
  USING (auth.uid() = user_id);
