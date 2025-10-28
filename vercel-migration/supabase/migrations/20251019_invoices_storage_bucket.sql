-- Create storage bucket for invoices
-- Note: Bucket policies are managed through the Supabase Dashboard Storage UI
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;
