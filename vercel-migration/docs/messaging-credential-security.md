# Messaging Credential Security Plan

## Objectives
- Protect third-party messaging credentials at rest and in transit.
- Centralize key management so revocations rotate in one place.
- Reduce blast radius by isolating secrets per user/clinic and per channel.

## Secrets in Scope
- Provider API keys/tokens (Twilio, MessageBird, Plivo, Meta WhatsApp, SendGrid, Resend).
- Sender identifiers: phone numbers, WhatsApp business IDs, email API domains.
- Optional webhook signing secrets where applicable.

## Encryption Strategy
1. **Database encryption**: leverage the `pgsodium` extension already available in Supabase Postgres. Store an authenticated secret box (libsodium `crypto_secretbox`) for each credential blob.
2. **Key management**: generate a project-wide 256-bit key and store it in Supabase Vault as `MESSAGING_CIPHER_KEY`. Rotate via Vault when required.
3. **Server-side envelope**: API routes or Edge Functions fetch the key from Vault, encrypt the JSON payload for `credentials_encrypted`, and persist the base64-encoded ciphertext bundle.
4. **No client-side keys**: the browser only submits raw credentials over HTTPS; it never receives the encryption key nor the decrypted payload.

```ts
// Shape of the serialized JSON persisted in credentials_encrypted
{
  "version": 1,
  "algorithm": "xchacha20poly1305",
  "nonce": "base64_nonce",
  "ciphertext": "base64_ciphertext",
  "created_at": "2025-11-07T00:00:00Z"
}
```

### Write Path
- API handler validates payload and provider type.
- Fetch `MESSAGING_CIPHER_KEY` from Vault (cached in memory for 15 minutes maximum).
- Generate nonce via `pgsodium.crypto_box_detached_noncegen()` or libsodium in the API runtime.
- Encrypt JSON credentials with the project key.
- Store serialized envelope in `messaging_providers.credentials_encrypted`.

### Read Path
- Backend worker or API fetches row, parses the envelope, retrieves key from Vault, decrypts, and returns a scoped DTO to the worker.
- Never send decrypted secrets directly to the frontend; expose only derived metadata (e.g., masked SID).

## Additional Controls
- Enable `pgsodium` in migrations (`CREATE EXTENSION IF NOT EXISTS pgsodium;`).
- Implement per-user rate limiting for credential updates to reduce brute-force attempts.
- Store masking metadata (e.g., last four digits) in `config` instead of the secret payload.
- Implement audit log table capturing credential writes with redacted payload.

## RLS Guidelines
- Retain existing `auth.uid() = user_id` filters.
- Once `account_id` is populated, add policies that require either matching `user_id` or membership in the same clinic/account scope:
  ```sql
  USING (
    auth.uid() = user_id OR
    (account_id IS NOT NULL AND account_id IN (
      SELECT account_id
      FROM clinic_memberships
      WHERE user_id = auth.uid()
    ))
  )
  ```
- Service-role access remains unrestricted for workers handling delivery.

## Sensitive Fields Checklist
- `messaging_messages.to_contact` (phone/email): mask on read, hash for deduplication if analytics are needed.
- `messaging_messages.payload` when storing provider responses: strip access tokens or signatures before persistence.
- `messaging_jobs.last_error`: sanitize to avoid leaking secrets in error messages.

## Operational Tasks
1. Create migration to enable `pgsodium` (idempotent) and document required Vault secret.
2. Provide helper utilities in `lib/crypto/messaging.ts` to wrap encryption/decryption calls (uses `libsodium-wrappers` for XChaCha20-Poly1305).
3. Wire API route `POST /api/messaging/providers` to use helper utilities and redact responses.
4. Schedule quarterly key rotation; during rotation, decrypt with old key and re-encrypt with new key.
5. Execute `npm run migrate:sms-providers` to move legacy `user_sms_credentials` into `messaging_providers` once the cipher key is provisioned.

This plan satisfies the Phase 1 requirement of deciding how encrypted credentials will be stored and retrieved without exposing secrets to clients or logs.
