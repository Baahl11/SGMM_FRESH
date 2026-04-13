# Fix Database Warnings - Instructions

## Summary
Created 3 migration files to address all database linter warnings from Supabase.

---

## Migration Files Created

### 1. fix-function-search-path-warnings.sql
**Fixes:** 59 function search_path warnings  
**Impact:** Low risk - adds security hardening to prevent search_path hijacking attacks  
**Action Required:** Apply to database via Supabase SQL Editor

```sql
-- All 59 functions will get: SET search_path = public
```

---

### 2. fix-overly-permissive-rls-policies.sql
**Fixes:** 10 RLS policy warnings  
**Impact:** MEDIUM RISK - Changes security policies for several tables  
**Action Required:** **REVIEW CAREFULLY before applying**

**Changes Made:**
- ✅ **form_submissions**: NO CHANGE (intentional public access for form links)
- ✅ **public_bookings**: NO CHANGE (intentional public access for booking system)
- ✅ **users**: NO CHANGE (service role needs unrestricted access)
- ⚠️ **inventory_items**: Adds `user_id = auth.uid()` checks for INSERT/UPDATE/DELETE
- ⚠️ **inventory_movements**: Adds `user_id = auth.uid()` check for INSERT
- ⚠️ **invoice_records**: Adds `user_id = auth.uid()` check for INSERT
- ⚠️ **patient_fiscal_data**: Adds `user_id = auth.uid()` checks for INSERT/UPDATE

**IMPORTANT:** These changes assume tables have a `user_id` column. If your application uses different security models (e.g., clinic-based multi-tenancy), you'll need to adjust the policies.

---

### 3. move-pgtrgm-extension.sql
**Fixes:** pg_trgm extension in public schema warning  
**Impact:** HIGH RISK - May break existing trigram indexes  
**Action Required:** **TEST IN DEVELOPMENT FIRST**

**What it does:**
- Moves pg_trgm extension from `public` to `extensions` schema
- This may cascade drop trigram indexes on text columns
- Includes instructions for recreating indexes if needed

**Warning:** This is a low-priority warning. Consider leaving pg_trgm in public if it causes complications.

---

### 4. Auth Leaked Password Protection
**Fixes:** Leaked password protection disabled warning  
**Impact:** No code change - dashboard setting only  
**Action Required:** Enable in Supabase Dashboard

**Steps:**
1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Password Security" section
3. Enable "Leaked password protection" (checks against HaveIBeenPwned.org)
4. Save changes

---

## Recommended Application Order

### Option A: Apply All (Thorough)
```bash
# 1. Function search paths (safe)
# Apply fix-function-search-path-warnings.sql in Supabase SQL Editor

# 2. RLS policies (test carefully)
# Apply fix-overly-permissive-rls-policies.sql in Supabase SQL Editor
# TEST YOUR APPLICATION THOROUGHLY

# 3. Extension migration (risky - optional)
# Apply move-pgtrgm-extension.sql in Supabase SQL Editor
# Only if you want to address this low-priority warning

# 4. Auth settings (safe)
# Enable leaked password protection in Dashboard
```

### Option B: Apply Safe Changes Only (Recommended)
```bash
# 1. Function search paths (safe)
# Apply fix-function-search-path-warnings.sql in Supabase SQL Editor

# 2. Auth settings (safe)
# Enable leaked password protection in Dashboard

# 3. SKIP RLS policy changes if your current setup works correctly
# 4. SKIP pg_trgm migration (low priority warning)
```

---

## Testing Checklist

After applying RLS policy changes, test:
- [ ] Inventory management (add/edit/delete items)
- [ ] Invoice creation
- [ ] Patient fiscal data management
- [ ] Multi-user access (ensure users can only see their own data)
- [ ] Public booking form submissions (should still work)
- [ ] Public intake form submissions (should still work)

---

## Rollback Plan

If RLS policy changes break your application:

```sql
-- Rollback to permissive policies
DROP POLICY IF EXISTS "Users can insert inventory items" ON public.inventory_items;
CREATE POLICY "Users can insert inventory items" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (true);

-- Repeat for other tables as needed
```

---

## Summary of Risk Levels

| Migration | Risk Level | Must Apply? | Notes |
|-----------|-----------|-------------|-------|
| Function search_path | 🟢 Low | Yes | Security hardening, no functional changes |
| RLS policies | 🟡 Medium | Review | May need customization for your security model |
| pg_trgm extension | 🔴 High | No | Low priority warning, may break indexes |
| Auth password protection | 🟢 Low | Yes | Dashboard setting only |

---

## Next Steps

1. **Review** the RLS policy changes in `fix-overly-permissive-rls-policies.sql`
2. **Apply** function search_path migration (safe)
3. **Test** in development before applying RLS changes
4. **Enable** leaked password protection in Auth dashboard
5. **Skip** pg_trgm migration unless absolutely necessary
