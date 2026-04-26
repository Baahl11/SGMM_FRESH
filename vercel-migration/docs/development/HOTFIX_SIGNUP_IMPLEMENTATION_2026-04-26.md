# Hotfix Signup Implementation Runbook (2026-04-26)

This runbook executes signup trigger hardening with observability and rollback safety.

## Scope
- Keep signup non-blocking.
- Ensure auto-creation of user_profiles, subscriptions, and locations.
- Persist trigger exceptions in public.error_logs.

## Files involved
- supabase/migrations/20260426175000_hotfix_signup_database_error.sql
- supabase/migrations/20260426193000_signup_trigger_observability.sql
- scripts/backup-signup-trigger-state.js
- scripts/apply-hotfix-signup-db.js
- scripts/preflight-supabase-connectivity.js

## Preflight (run first)

Validate API keys and DB connectivity before backup/apply:

```bash
cd vercel-migration
npm run preflight:supabase
```

Expected signals:
- `SUPABASE_SERVICE_ROLE_KEY` check must be `ok`.
- At least one `DB_CONNECT_OK` candidate must appear.
- If `NEXT_PUBLIC_SUPABASE_ANON_KEY` is stale, refresh it from Supabase Dashboard > Project Settings > API.

If DB connectivity fails for all candidates, refresh connection details from Supabase Dashboard > Project Settings > Database and retry.

## Phase A - Staging (mandatory first)

1. Backup current trigger/function state.

```bash
cd vercel-migration
node scripts/backup-signup-trigger-state.js
```

Output should include BACKUP_CREATED and paths under backups/.

2. Apply hotfix bundle (base + observability migration) in order.

```bash
cd vercel-migration
node scripts/apply-hotfix-signup-db.js
```

Output should include HOTFIX_BUNDLE_APPLIED.

3. Structural SQL checks.

```sql
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'create_subscription_on_user_signup',
    'create_default_location_for_user',
    'log_signup_trigger_error'
  )
ORDER BY routine_name;
```

4. Functional checks.
- Create a new auth signup user.
- Validate rows exist for that user in:
  - public.user_profiles
  - public.subscriptions
  - public.locations
- Validate public.error_logs receives entries if forced trigger failures happen.

## Phase B - Production

Repeat the same sequence only after Staging checks pass:
1. Backup state.
2. Apply bundle.
3. Run structural checks.
4. Execute signup smoke test.
5. Monitor 30-60 minutes.

## Post-apply monitoring

Run quick health checks from app environment:

```bash
cd vercel-migration
npm run monitor:signup-hotfix:6h
npm run monitor:signup-hotfix
```

Success criteria:
- `status` is `healthy`.
- `signupTriggerErrors` is `0`.
- New auth users have matching profile/subscription/location rows.

## Rollback

Rollback source is the generated SQL backup file from:
- backups/signup-trigger-state-<timestamp>.sql

Apply that SQL in the same target environment to restore prior function/trigger definitions.

## Notes
- Default plan remains basico (2 doctors, 1 location, 7-day trial).
- Default timezone remains America/Mexico_City.
- ON CONFLICT policy remains DO NOTHING for idempotency.
