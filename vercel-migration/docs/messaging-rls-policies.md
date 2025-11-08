# Messaging RLS Strategy

## Current Baseline (Phase 1)
- Tables `messaging_providers`, `messaging_templates`, `messaging_messages`, and `messaging_jobs` already enforce `auth.uid() = user_id` policies in the core migration.
- Service role retains full access for background workers (`auth.role() = 'service_role'`).
- `user_id` is mandatory while `account_id` is optional and reserved for clinics that manage multiple users.

## Phase 1 Safeguards
1. Keep policies strict to the owning `user_id` until an `account_id` is populated.
2. Expose read/write access only through server-side APIs to prevent bypassing RLS.
3. Ensure every insert/update sets `user_id = auth.uid()` in the application layer to pass the WITH CHECK clause.

## Clinic / Account Scoping (Phase 2)
When multi-clinic accounts go live, update the policies to honor shared access:

```sql
-- Example helper view that maps a user to account IDs
CREATE OR REPLACE VIEW user_account_memberships AS
SELECT m.user_id, m.account_id
FROM clinic_memberships m
UNION
SELECT a.owner_id AS user_id, a.id AS account_id
FROM clinic_accounts a;

ALTER TABLE messaging_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Account members manage providers" ON messaging_providers
FOR ALL
USING (
  auth.uid() = user_id OR
  (account_id IS NOT NULL AND account_id IN (
    SELECT account_id
    FROM user_account_memberships
    WHERE user_id = auth.uid()
  ))
)
WITH CHECK (
  auth.uid() = user_id OR
  account_id IN (
    SELECT account_id
    FROM user_account_memberships
    WHERE user_id = auth.uid()
  )
);
```

Apply the same pattern to `messaging_templates` and `messaging_messages`, but keep `messaging_jobs` restricted to the service role.

## Additional Guards
- Create a security definer function for workers that need to impersonate a user when decrypting credentials; avoid exposing plaintext secrets via direct SELECT queries.
- Log denied access attempts through Supabase audit logs to detect misconfigured policies.
- Pair RLS with column-level redaction via views if you later expose message history directly in analytics dashboards.

## Rollout Checklist
- [ ] Confirm existence of `clinic_memberships` (or equivalent) before enabling account-based policies.
- [ ] Backfill `account_id` for existing messaging rows once multi-clinic support ships.
- [ ] Apply new policies in a separate migration and run regression tests.
- [ ] Update application services to include `account_id` context on inserts and queries.
