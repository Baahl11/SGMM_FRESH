-- ============================================================================= 
-- SAFE WARNING FIXES - CORRECTED WITH EXACT FUNCTION SIGNATURES
-- =============================================================================
-- This migration addresses the low-risk function search_path warnings
-- All 51 functions will get explicit search_path to prevent hijacking attacks
-- Signatures extracted directly from your database
-- =============================================================================

-- Function search_path fixes (ALL SAFE - NO FUNCTIONAL CHANGES)
ALTER FUNCTION public.can_user_perform_action(action_name text, target_user_id uuid) SET search_path = public;
ALTER FUNCTION public.check_location_limit() SET search_path = public;
ALTER FUNCTION public.cleanup_orphaned_form_files() SET search_path = public;
ALTER FUNCTION public.cleanup_orphaned_subscriptions() SET search_path = public;
ALTER FUNCTION public.complete_form_token(token_value character varying) SET search_path = public;
ALTER FUNCTION public.create_default_location_for_user() SET search_path = public;
ALTER FUNCTION public.create_subscription_on_invitation_accept() SET search_path = public;
ALTER FUNCTION public.delete_expired_notifications() SET search_path = public;
ALTER FUNCTION public.ensure_single_principal_location() SET search_path = public;
ALTER FUNCTION public.expire_old_invitations() SET search_path = public;
ALTER FUNCTION public.generate_booking_slug(email_input text) SET search_path = public;
ALTER FUNCTION public.generate_invitation_token() SET search_path = public;
ALTER FUNCTION public.generate_team_invitation_token() SET search_path = public;
ALTER FUNCTION public.get_current_user_id() SET search_path = public;
ALTER FUNCTION public.get_effective_limits(p_user_id uuid) SET search_path = public;
ALTER FUNCTION public.get_user_addon_quantity(p_user_id uuid, p_addon_type text) SET search_path = public;
ALTER FUNCTION public.get_whatsapp_stats(user_uuid uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.increment_email_usage(p_user_id uuid) SET search_path = public;
ALTER FUNCTION public.increment_message_usage(p_user_id uuid) SET search_path = public;
ALTER FUNCTION public.increment_quick_phrase_usage(phrase_id uuid, uid uuid) SET search_path = public;
ALTER FUNCTION public.is_form_token_valid(token_value character varying) SET search_path = public;
ALTER FUNCTION public.is_slot_available(p_clinic_user_id uuid, p_booking_date date, p_booking_time time without time zone, p_duration_minutes integer) SET search_path = public;
ALTER FUNCTION public.release_expired_slot_locks() SET search_path = public;
ALTER FUNCTION public.reset_daily_email_usage() SET search_path = public;
ALTER FUNCTION public.reset_daily_message_usage() SET search_path = public;
ALTER FUNCTION public.set_timestamp() SET search_path = public;
ALTER FUNCTION public.set_user_id() SET search_path = public;
ALTER FUNCTION public.update_appointments_updated_at() SET search_path = public;
ALTER FUNCTION public.update_booking_deposits_updated_at() SET search_path = public;
ALTER FUNCTION public.update_bundles_updated_at() SET search_path = public;
ALTER FUNCTION public.update_clinic_settings_updated_at() SET search_path = public;
ALTER FUNCTION public.update_connected_accounts_updated_at() SET search_path = public;
ALTER FUNCTION public.update_google_calendar_updated_at() SET search_path = public;
ALTER FUNCTION public.update_intake_forms_updated_at() SET search_path = public;
ALTER FUNCTION public.update_locations_updated_at() SET search_path = public;
ALTER FUNCTION public.update_medical_history_updated_at() SET search_path = public;
ALTER FUNCTION public.update_medical_records_updated_at() SET search_path = public;
ALTER FUNCTION public.update_message_status(p_message_id uuid, p_status text, p_meta_message_id text, p_error_message text) SET search_path = public;
ALTER FUNCTION public.update_notification_preferences_updated_at() SET search_path = public;
ALTER FUNCTION public.update_patient_photos_updated_at() SET search_path = public;
ALTER FUNCTION public.update_patient_tags_updated_at() SET search_path = public;
ALTER FUNCTION public.update_promotions_updated_at() SET search_path = public;
ALTER FUNCTION public.update_public_bookings_updated_at() SET search_path = public;
ALTER FUNCTION public.update_quick_phrases_updated_at() SET search_path = public;
ALTER FUNCTION public.update_subscription_addons_updated_at() SET search_path = public;
ALTER FUNCTION public.update_subscriptions_updated_at() SET search_path = public;
ALTER FUNCTION public.update_team_members_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_user_profiles_updated_at() SET search_path = public;
ALTER FUNCTION public.update_variable_expenses_updated_at() SET search_path = public;
ALTER FUNCTION public.user_has_valid_subscription(user_uuid uuid) SET search_path = public;

-- =============================================================================
-- VERIFICATION - Check all functions now have search_path configured
-- =============================================================================

SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as parameters,
    CASE 
        WHEN p.proconfig IS NOT NULL THEN '✓ Has search_path'
        ELSE '✗ Missing search_path'
    END as status,
    p.proconfig as configuration
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'can_user_perform_action', 'check_location_limit', 'cleanup_orphaned_form_files',
    'cleanup_orphaned_subscriptions', 'complete_form_token', 'create_default_location_for_user',
    'create_subscription_on_invitation_accept', 'delete_expired_notifications',
    'ensure_single_principal_location', 'expire_old_invitations', 'generate_booking_slug',
    'generate_invitation_token', 'generate_team_invitation_token', 'get_current_user_id',
    'get_effective_limits', 'get_user_addon_quantity', 'get_whatsapp_stats',
    'handle_new_user', 'increment_email_usage', 'increment_message_usage',
    'increment_quick_phrase_usage', 'is_form_token_valid', 'is_slot_available',
    'release_expired_slot_locks', 'reset_daily_email_usage', 'reset_daily_message_usage',
    'set_timestamp', 'set_user_id', 'update_appointments_updated_at',
    'update_booking_deposits_updated_at', 'update_bundles_updated_at',
    'update_clinic_settings_updated_at', 'update_connected_accounts_updated_at',
    'update_google_calendar_updated_at', 'update_intake_forms_updated_at',
    'update_locations_updated_at', 'update_medical_history_updated_at',
    'update_medical_records_updated_at', 'update_message_status',
    'update_notification_preferences_updated_at', 'update_patient_photos_updated_at',
    'update_patient_tags_updated_at', 'update_promotions_updated_at',
    'update_public_bookings_updated_at', 'update_quick_phrases_updated_at',
    'update_subscription_addons_updated_at', 'update_subscriptions_updated_at',
    'update_team_members_updated_at', 'update_updated_at_column',
    'update_user_profiles_updated_at', 'update_variable_expenses_updated_at',
    'user_has_valid_subscription'
)
ORDER BY 
    CASE WHEN p.proconfig IS NOT NULL THEN 1 ELSE 0 END,
    p.proname;

-- Expected result: All 51 functions should show "✓ Has search_path"
