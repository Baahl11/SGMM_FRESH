# Add-Ons System - Deployment Checklist

## ✅ Completed

1. **Database Migration**
   - File: `supabase/migrations/20251118_subscription_addons.sql`
   - Tables: `subscription_addons`
   - Functions: `get_user_addon_quantity()`, `get_effective_limits()`
   - **Status:** ⚠️ NEEDS TO BE APPLIED IN SUPABASE

2. **Stripe Products Created**
   - Ubicación Extra: `price_1SUu5kCpe9CE4d2l13VFVUj4` ($499 MXN/month)
   - Doctor Adicional: `price_1SUu5lCpe9CE4d2lv2Jvafmb` ($199 MXN/month)
   - **Status:** ✅ Created in Live Mode

3. **Code Deployed**
   - API Endpoints: `/api/addons/*`
   - Quota Service: Updated to include add-ons
   - Webhook: Syncs subscription items
   - UI: `/dashboard/settings/addons`
   - **Status:** ✅ Pushed to GitHub (deploying to Vercel automatically)

---

## 🔧 PENDING ACTIONS

### 1. Apply Database Migration in Supabase

Go to Supabase Dashboard:
1. Navigate to: https://supabase.com/dashboard/project/sbwpqtrxhiuucwlbozet/editor
2. Click SQL Editor
3. Copy/paste content from: `supabase/migrations/20251118_subscription_addons.sql`
4. Run the migration
5. Verify table exists: `SELECT * FROM subscription_addons LIMIT 1;`

### 2. Update Vercel Environment Variables

Go to Vercel Dashboard:
1. Navigate to: https://vercel.com/baahl11s-projects/sgmm-fresh/settings/environment-variables
2. Add these NEW variables:

```
NEXT_PUBLIC_STRIPE_PRICE_ADDON_EXTRA_LOCATION=price_1SUu5kCpe9CE4d2l13VFVUj4
NEXT_PUBLIC_STRIPE_PRICE_ADDON_EXTRA_DOCTOR=price_1SUu5lCpe9CE4d2lv2Jvafmb
```

3. Redeploy after adding variables

---

## 🧪 Testing Checklist

After migration + env vars are applied:

1. **Visit Add-ons Page**
   - Go to: https://agendamedpro.com/dashboard/settings/addons
   - Should show 2 add-ons cards (Location, Doctor)

2. **Test Purchase Flow**
   - Click "Agregar Add-on" on Location
   - Should call `/api/addons/purchase`
   - Verify in Stripe Dashboard → Subscriptions → Check subscription items
   - Verify in Supabase → `subscription_addons` table

3. **Test Quota Limits**
   - Go to `/dashboard/settings/consultorios`
   - Try adding location beyond base limit
   - Should see updated max limit (base + add-ons)

4. **Test Webhook Sync**
   - Modify subscription in Stripe Dashboard (add/remove items)
   - Check Supabase `subscription_addons` table updates

---

## 📊 Revenue Projection

**Conservative (30% adoption on 200 users):**
- 60 users buy Location ($499): $29,940/month
- 30 users buy Doctor ($199): $5,970/month
- **Total:** +$35,910/month (+19% revenue increase)

**Optimistic (50% adoption):**
- **Total:** +$59,850/month (+32% revenue increase)

---

## 🚀 Next Steps

1. Apply migration in Supabase ⏳
2. Add env vars in Vercel ⏳
3. Wait for Vercel deployment ⏳
4. Test purchase flow 🧪
5. Monitor Stripe webhooks 👀
6. Track adoption metrics 📈

---

**Ready to apply migration?**
