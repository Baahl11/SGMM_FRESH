import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Script para crear la tabla patient_notes
export async function GET() {
  const supabase = await createClient();
  
  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Ejecutar query SQL para crear tabla
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Create patient_notes table
        CREATE TABLE IF NOT EXISTS patient_notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          patient_id UUID NOT NULL,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          tipo_nota VARCHAR(20) NOT NULL CHECK (tipo_nota IN ('pendiente', 'idea', 'importante', 'general', 'completada')),
          titulo VARCHAR(255),
          contenido TEXT NOT NULL,
          completada BOOLEAN DEFAULT false,
          fecha_completada TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_id ON patient_notes(patient_id);
        CREATE INDEX IF NOT EXISTS idx_patient_notes_user_id ON patient_notes(user_id);
        CREATE INDEX IF NOT EXISTS idx_patient_notes_tipo ON patient_notes(tipo_nota);
        CREATE INDEX IF NOT EXISTS idx_patient_notes_completada ON patient_notes(completada);

        -- Enable RLS
        ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own patient notes" ON patient_notes;
        DROP POLICY IF EXISTS "Users can insert their own patient notes" ON patient_notes;
        DROP POLICY IF EXISTS "Users can update their own patient notes" ON patient_notes;
        DROP POLICY IF EXISTS "Users can delete their own patient notes" ON patient_notes;

        -- Create policies
        CREATE POLICY "Users can view their own patient notes"
          ON patient_notes FOR SELECT
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own patient notes"
          ON patient_notes FOR INSERT
          WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own patient notes"
          ON patient_notes FOR UPDATE
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own patient notes"
          ON patient_notes FOR DELETE
          USING (auth.uid() = user_id);

        -- Create trigger function
        CREATE OR REPLACE FUNCTION update_patient_notes_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Drop trigger if exists
        DROP TRIGGER IF EXISTS update_patient_notes_updated_at_trigger ON patient_notes;

        -- Create trigger
        CREATE TRIGGER update_patient_notes_updated_at_trigger
          BEFORE UPDATE ON patient_notes
          FOR EACH ROW
          EXECUTE FUNCTION update_patient_notes_updated_at();
      `
    });

    if (error) {
      console.error('❌ Error creating table:', error);
      return NextResponse.json({ 
        error: 'Error creando tabla',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Tabla patient_notes creada exitosamente' 
    });

  } catch (error: any) {
    console.error('❌ Error in setup-notes-table:', error);
    return NextResponse.json({ 
      error: 'Error interno',
      details: error.message 
    }, { status: 500 });
  }
}
