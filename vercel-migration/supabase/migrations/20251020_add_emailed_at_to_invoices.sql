-- Add emailed_at timestamp to track when invoices were sent by email
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ;

COMMENT ON COLUMN invoices.emailed_at IS 'Timestamp when the invoice was sent by email';
