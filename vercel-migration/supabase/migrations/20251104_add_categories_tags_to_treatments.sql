-- Migration: Add categories and tags to treatments
-- Created: 2025-11-04
-- Purpose: Enable organization and filtering of treatments by category and tags
-- Feature: Service Categories & Tags (Quick Win #1)

-- ============================================
-- 1. ADD COLUMNS TO TREATMENTS TABLE
-- ============================================

-- Add category column
ALTER TABLE treatments 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add tags column (array of strings)
ALTER TABLE treatments 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- ============================================
-- 2. CREATE INDEXES FOR EFFICIENT SEARCHING
-- ============================================

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_treatments_category 
ON treatments(category) 
WHERE category IS NOT NULL;

-- GIN index for tags array searching
-- Allows fast queries like: WHERE 'botox' = ANY(tags)
CREATE INDEX IF NOT EXISTS idx_treatments_tags 
ON treatments USING GIN(tags);

-- Composite index for category + user_id (common query pattern)
CREATE INDEX IF NOT EXISTS idx_treatments_category_user 
ON treatments(user_id, category) 
WHERE category IS NOT NULL;

-- ============================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN treatments.category IS 
  'Categoría del tratamiento: consulta, procedimiento, estetico, laboratorio, dental, especialidad, otro';

COMMENT ON COLUMN treatments.tags IS 
  'Array de tags/etiquetas para búsqueda y filtrado. Ejemplos: [''botox'', ''facial'', ''antiaging'']';

-- ============================================
-- 4. SET DEFAULT VALUES FOR EXISTING ROWS
-- ============================================

-- Optional: Set 'otro' as default category for existing treatments
-- Comment out if you want to keep them as NULL initially
-- UPDATE treatments 
-- SET category = 'otro' 
-- WHERE category IS NULL;
