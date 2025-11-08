-- Migration: Add Quick Phrases System
-- Created: 2025-11-04
-- Purpose: Enable reusable text snippets for medical records and treatments
-- Feature: Quick Phrases Library

-- ============================================
-- 1. CREATE QUICK_PHRASES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS quick_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Context: where this phrase is used
  context TEXT NOT NULL CHECK (context IN ('medical_record', 'treatment', 'both')),
  
  -- Category: type of phrase within context
  -- For medical_record: 'motivo_consulta', 'exploracion', 'diagnostico', 'plan_tratamiento', 'indicaciones', 'evolucion', 'otro'
  -- For treatment: 'descripcion', 'indicaciones', 'contraindicaciones', 'cuidados_post', 'otro'
  category TEXT NOT NULL,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

-- Primary index for user queries
CREATE INDEX IF NOT EXISTS idx_quick_phrases_user 
ON quick_phrases(user_id);

-- Index for context filtering (medical vs treatment)
CREATE INDEX IF NOT EXISTS idx_quick_phrases_context 
ON quick_phrases(user_id, context);

-- Composite index for category filtering within context
CREATE INDEX IF NOT EXISTS idx_quick_phrases_user_context_category 
ON quick_phrases(user_id, context, category);

-- Index for usage tracking (most used phrases)
CREATE INDEX IF NOT EXISTS idx_quick_phrases_usage 
ON quick_phrases(user_id, usage_count DESC);

-- Full text search on title and content
CREATE INDEX IF NOT EXISTS idx_quick_phrases_search 
ON quick_phrases USING GIN(to_tsvector('spanish', title || ' ' || content));

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE quick_phrases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own phrases
CREATE POLICY "Users can view own quick_phrases"
  ON quick_phrases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own phrases
CREATE POLICY "Users can create own quick_phrases"
  ON quick_phrases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own phrases
CREATE POLICY "Users can update own quick_phrases"
  ON quick_phrases
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own phrases
CREATE POLICY "Users can delete own quick_phrases"
  ON quick_phrases
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_quick_phrases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quick_phrases_updated_at
  BEFORE UPDATE ON quick_phrases
  FOR EACH ROW
  EXECUTE FUNCTION update_quick_phrases_updated_at();

-- ============================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE quick_phrases IS 
  'Frases rápidas reutilizables para historiales médicos y tratamientos';

COMMENT ON COLUMN quick_phrases.context IS 
  'Contexto de uso: medical_record (notas médicas), treatment (servicios), both (ambos)';

COMMENT ON COLUMN quick_phrases.category IS 
  'Categoría dentro del contexto. Medical: motivo_consulta, exploracion, diagnostico, plan_tratamiento, indicaciones, evolucion. Treatment: descripcion, indicaciones, contraindicaciones, cuidados_post';

COMMENT ON COLUMN quick_phrases.usage_count IS 
  'Contador de veces que se ha usado esta frase';

COMMENT ON COLUMN quick_phrases.last_used_at IS 
  'Última vez que se usó esta frase';

-- ============================================
-- 6. RPC FUNCTION FOR ATOMIC USAGE INCREMENT
-- ============================================

-- Function to atomically increment usage count
-- This is more efficient than SELECT + UPDATE for high-frequency operations
CREATE OR REPLACE FUNCTION increment_quick_phrase_usage(phrase_id UUID, uid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE quick_phrases
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = phrase_id AND user_id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_quick_phrase_usage IS 
  'Incrementa atómicamente el contador de uso de una frase rápida';

-- ============================================
-- 7. SEED DATA (OPTIONAL - EXAMPLES)
-- ============================================

-- Puedes descomentar esto para tener ejemplos iniciales
-- Estas frases se crearían automáticamente para nuevos usuarios

/*
-- Ejemplo: Frases para historial médico
INSERT INTO quick_phrases (user_id, title, content, context, category) VALUES
(auth.uid(), 'Paciente estable', 'Paciente estable, sin complicaciones. Tolera bien el tratamiento.', 'medical_record', 'evolucion'),
(auth.uid(), 'Indicaciones post-procedimiento', 'Aplicar compresas frías 3 veces al día. Evitar exposición solar directa. No hacer ejercicio intenso por 48 horas.', 'medical_record', 'indicaciones'),
(auth.uid(), 'Cuidados generales', 'Mantener zona limpia y seca. Aplicar crema cicatrizante según indicación. Regresar en caso de dolor intenso o signos de infección.', 'medical_record', 'indicaciones');

-- Ejemplo: Frases para tratamientos
INSERT INTO quick_phrases (user_id, title, content, context, category) VALUES
(auth.uid(), 'Contraindicaciones embarazo', 'No aplicar en caso de embarazo, lactancia, infecciones activas en la zona, o alergias conocidas al producto.', 'treatment', 'contraindicaciones'),
(auth.uid(), 'Cuidados post-Botox', 'No acostarse por 4 horas. Evitar masajes en la zona tratada. No hacer ejercicio intenso por 24 horas. Los resultados serán visibles en 3-7 días.', 'treatment', 'cuidados_post');
*/
