# Messaging Schema Test Checklist

## Database Integrity
- [ ] `SELECT` each messaging table to confirm `created_at`/`updated_at` default to `now()`.
- [ ] Attempt insert with missing `user_id` (expect RLS rejection).
- [ ] Attempt update from non-owner session (expect RLS rejection).
- [ ] Verify `status` CHECK constraints for messages and jobs reject invalid enum values.

## Foreign Keys
- [ ] Insert `messaging_messages` row with nonexistent `provider_id` (expect FK violation).
- [ ] Delete referenced `messaging_providers` row, confirm `ON DELETE SET NULL` updates dependent rows.
- [ ] Cascade delete on `auth.users` removes related provider/template/message rows.

## Triggers
- [ ] Update provider record and confirm `updated_at` changes via `set_timestamp`.
- [ ] Update template record and confirm `updated_at` changes.
- [ ] Update message record and confirm `updated_at` changes.

## RLS Policies
- [ ] Authenticated user can read/write only their own messaging rows.
- [ ] Service role can manage messages and jobs without restriction.
- [ ] Anonymous role denied for all tables.

## Jobs Queue
- [ ] Insert job, then update `status` to `processing`, ensure `attempts` increments via application logic.
- [ ] Verify index `idx_messaging_jobs_status_run_at` is used by scheduler query (`EXPLAIN ANALYZE`).

## Encryption Workflow
- [ ] API stores credential payload as JSON envelope with `algorithm`, `nonce`, and `ciphertext` fields.
- [ ] Decrypt using Vault-managed key and confirm round-trip integrity.
- [ ] Log redactions hide credential values in API responses and logs.

## Migration Smoke Test
- [ ] Run `supabase migration up` on empty test database (should succeed).
- [ ] Re-run migration on seeded database (should be idempotent via `IF NOT EXISTS`).
- [ ] Roll back using `supabase migration down` and ensure cleanup does not break existing tables (verify placeholders remain intact).
