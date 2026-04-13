# SaaS Application Comprehensive Audit Report
**Date:** January 15, 2026  
**Scope:** vercel-migration folder  
**Auditor:** GitHub Copilot  

---

## SECTION 1: TEST/DEBUG CODE (Files to Remove)

### 🔴 CRITICAL - Debug API Endpoints (REMOVE IMMEDIATELY)

| File Path | Risk Level | Description |
|-----------|------------|-------------|
| `app/api/debug/bookings/route.ts` | HIGH | Debug endpoint exposing booking data |
| `app/api/debug-env/route.ts` | CRITICAL | Exposes environment variable status |
| `app/api/debug-log/route.ts` | MEDIUM | Debug logging endpoint |
| `app/api/test/messaging-config/route.ts` | HIGH | Test endpoint for messaging config |
| `app/api/test/send-reminder-email/route.ts` | MEDIUM | Test email sending endpoint |
| `app/api/test/send-welcome-email/route.ts` | MEDIUM | Test email sending endpoint |
| `app/api/messaging/debug-credentials/route.ts` | CRITICAL | Exposes decrypted credentials |
| `app/api/messaging/debug-status/route.ts` | HIGH | Debug status endpoint |
| `app/api/messaging/test-send/route.ts` | MEDIUM | Test SMS sending endpoint |

### 🟡 Test Files in Root Directory (REMOVE)

| File Path | Description |
|-----------|-------------|
| `test-api-simple.js` | API test script |
| `test-auth-flow.js` | Auth flow test |
| `test-create-patient.js` | Patient creation test |
| `test-direct-patient.js` | Direct patient test |
| `test-full-flow.js` | Full flow test |
| `test-patient-api.js` | Patient API test |
| `test-patient-creation.js` | Patient creation test |
| `test-patients-direct.js` | Direct patients test |
| `test-simple.js` | Simple test |
| `test-supabase.js` | Supabase test |
| `test_cron_reminders.js` | Cron reminders test |
| `test_user_isolation.js` | User isolation test |

### 🟡 Debug Components (REMOVE)

| File Path | Description |
|-----------|-------------|
| `components/auth-debug.tsx` | Auth debug UI component - displays user info in corner |

### 🟡 Backup Files (REMOVE)

| File Path | Description |
|-----------|-------------|
| `app/dashboard/page-backup.tsx` | Old dashboard backup (832 lines) |
| `app/api/appointments/route.ts.backup` | Appointments route backup |
| `gasto_old.tsx` | Old expense component |

---

## SECTION 2: HARDCODED/MOCK DATA

### 🔴 CRITICAL - Mock Data in Production Code

| File Path | Line | Issue |
|-----------|------|-------|
| `app/api/bundles/route.ts` | L30-40 | **Returns mock data** - Bundle creation returns fake ID with `temp-${Date.now()}` |
| `app/reports/page.tsx` | L495 | Mock billing data for demo purposes when no real data exists |
| `app/dashboard/settings/whatsapp/test/page.tsx` | L77-83 | Sample appointment data hardcoded for testing |

### 🟡 Console.log Statements (200+ instances - Clean up for production)

**High frequency files:**
- `app/reports/page.tsx` - 15+ console.log statements
- `app/patients/page.tsx` - 10+ console.log statements
- `app/records/new/page.tsx` - 10+ console.log statements
- `app/api/treatments/[id]/inventory/route.ts` - 15+ console.log statements
- `app/api/team/members/route.ts` - 10+ console.log statements
- `app/treatments/page.tsx` - 5+ console.log statements

---

## SECTION 3: NON-FUNCTIONAL FEATURES

### 🔴 Incomplete Implementations

| Feature | File Path | Issue |
|---------|-----------|-------|
| **Bundles API** | `app/api/bundles/route.ts` | Returns mock data, database tables not created |
| **Google Calendar Sync** | `hooks/use-google-calendar-sync.ts` L63 | TODO: Not implemented |
| **Admin Email Sending** | `app/api/admin/invitations/route.ts` L162 | TODO: Email not implemented |
| **Admin Resend Invitation** | `app/api/admin/invitations/[id]/route.ts` L86 | TODO: Email resend not implemented |
| **Booking Notifications** | `app/api/public/book/[slug]/route.ts` L293 | TODO: Cancellation notification not sent |
| **Inventory Auto-Deduction** | `app/api/patients/[id]/multi-treatment/route.ts` L146 | TODO: Inventory not auto-deducted |

### 🟡 Duplicate/Redundant Settings Pages

**WhatsApp Settings - 5 DUPLICATE PAGES:**
| Page | Purpose | Recommendation |
|------|---------|----------------|
| `app/dashboard/settings/whatsapp/page.tsx` | Main WhatsApp settings | KEEP - Modern UI |
| `app/dashboard/settings/whatsapp-api/page.tsx` | WhatsApp Business API config | CONSOLIDATE |
| `app/dashboard/settings/whatsapp-simple/page.tsx` | Simple toggle | REMOVE - Redundant |
| `app/dashboard/settings/whatsapp-meta/page.tsx` | Meta API config | REMOVE - Duplicate of main |
| `app/dashboard/settings/whatsapp-templates/page.tsx` | Template management | KEEP - Separate feature |
| `app/dashboard/settings/whatsapp/test/page.tsx` | Test page | KEEP for testing |

---

## SECTION 4: DUPLICATE/DEPRECATED FILES

### 🔴 Duplicate Code Structure

| Location | Issue | Action |
|----------|-------|--------|
| `src/app/api/public/` | Duplicate of `app/api/public/` | **REMOVE** entire `src/` folder |
| `app/settings/facturacion/` | Duplicate settings location | REVIEW - may conflict with `app/dashboard/settings/facturacion/` |

### 🟡 Script/Migration Files (Consider cleanup after production stable)

| File | Purpose |
|------|---------|
| 23+ `apply_*.py` files | One-time migration scripts |
| 15+ SQL files in root | Database migration files |
| Multiple `create-*.js` files | Setup scripts |

---

## SECTION 5: IMPROVEMENT RECOMMENDATIONS (Priority Ordered)

### 🔴 P0 - CRITICAL (Immediate Action Required)

1. **Remove All Debug/Test API Endpoints**
   - Delete `app/api/debug/`, `app/api/debug-env/`, `app/api/debug-log/`
   - Delete `app/api/test/` directory
   - Delete `app/api/messaging/debug-*` endpoints

2. **Remove Console.log Statements**
   - Create production build script that strips console.logs
   - Or use conditional logging: `if (process.env.NODE_ENV === 'development')`

3. **Fix Bundles API**
   - Create actual database tables for bundles
   - Replace mock data with real implementation

### 🟠 P1 - HIGH PRIORITY (This Sprint)

4. **Consolidate WhatsApp Settings**
   - Keep main page and templates page
   - Remove redundant duplicate pages
   - Merge functionality into single cohesive interface

5. **Complete TODO Items**
   - Google Calendar sync implementation
   - Email sending for admin invitations
   - Booking cancellation notifications
   - Inventory auto-deduction

6. **Remove Backup Files**
   - Delete all `*-backup.*`, `*_old.*` files
   - Remove `src/` duplicate folder

### 🟡 P2 - MEDIUM PRIORITY (This Month)

7. **Implement Proper Logging**
   - Replace console.logs with structured logging service
   - Use different log levels (debug, info, warn, error)

8. **Clean Up Test Files**
   - Move test files to `tests/` directory
   - Add to .gitignore or remove from production

9. **Standardize API Response Formats**
   - Create consistent error handling
   - Standardize success/error response structure

### 🟢 P3 - LOW PRIORITY (Backlog)

10. **Documentation Updates**
    - Remove outdated markdown files (50+ .md files in root)
    - Create consolidated documentation

11. **Code Organization**
    - Consolidate migration scripts
    - Archive completed setup files

---

## SECTION 6: SECURITY CONCERNS

### 🔴 CRITICAL SECURITY ISSUES

| Issue | Location | Risk | Remediation |
|-------|----------|------|-------------|
| **Live API Keys in .env files** | `.env.local`, `.env.production` | CRITICAL | Keys are not in git, but rotate all keys immediately if ever exposed |
| **Debug Endpoints Expose Credentials** | `app/api/messaging/debug-credentials/route.ts` | CRITICAL | Returns decrypted credentials - DELETE IMMEDIATELY |
| **Environment Variables Exposure** | `app/api/debug-env/route.ts` | CRITICAL | Shows which env vars are set - DELETE |

### 🟠 HIGH RISK

| Issue | Location | Risk | Remediation |
|-------|----------|------|-------------|
| **Stripe Live Keys in Local Dev** | `.env.local` | HIGH | Use test keys for development |
| **Database Password Visible** | `.env.production` | HIGH | Ensure file never committed |
| **SendGrid API Key Exposed** | `.env.production` | HIGH | Rotate key after audit |

### 🟡 MEDIUM RISK

| Issue | Location | Risk | Remediation |
|-------|----------|------|-------------|
| **CRON_SECRET Hardcoded** | `.env.production` | MEDIUM | Ensure Vercel env vars override |
| **Supabase Service Role Key** | `.env.local`, `.env.production` | MEDIUM | Restrict usage to server-side only |

### Security Recommendations

1. **Rotate all API keys and secrets** that were visible in .env files
2. **Add rate limiting** to all API endpoints
3. **Implement request validation** for all POST/PUT endpoints
4. **Add CORS restrictions** for production
5. **Remove all debug endpoints** before any deployment
6. **Add authentication** to admin routes that may be missing it

---

## SUMMARY

### Files to Delete (Immediate)
- 9 debug API endpoints
- 12 test JavaScript files
- 1 debug component
- 3 backup files
- 1 entire duplicate folder (`src/`)

### Features to Fix
- 1 mock API (bundles)
- 5 incomplete TODO items
- 4 duplicate WhatsApp settings pages

### Security Actions
- Rotate 5+ exposed API keys
- Remove 3 critical debug endpoints
- Review authentication on all admin routes

---

## APPENDIX: Full File Paths for Deletion

```bash
# Debug API Endpoints
rm -rf app/api/debug/
rm -f app/api/debug-env/route.ts
rm -f app/api/debug-log/route.ts
rm -rf app/api/test/
rm -f app/api/messaging/debug-credentials/route.ts
rm -f app/api/messaging/debug-status/route.ts
rm -f app/api/messaging/test-send/route.ts

# Test Files
rm -f test-*.js
rm -f test_*.js

# Backup Files
rm -f app/dashboard/page-backup.tsx
rm -f app/api/appointments/route.ts.backup
rm -f gasto_old.tsx

# Duplicate Folder
rm -rf src/

# Debug Component
rm -f components/auth-debug.tsx

# Duplicate WhatsApp Pages (after consolidation)
rm -rf app/dashboard/settings/whatsapp-simple/
rm -rf app/dashboard/settings/whatsapp-meta/
```
