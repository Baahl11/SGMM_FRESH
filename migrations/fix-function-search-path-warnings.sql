-- Migration: Fix Function Search Path Warnings
-- Description: Set explicit search_path for all functions to prevent search_path hijacking attacks
-- Date: 2026-02-03

-- All functions will have SET search_path = public to ensure consistent schema resolution

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_bundles_updated_at() SET search_path = public;
ALTER FUNCTION public.update_google_calendar_updated_at() SET search_path = public;
ALTER FUNCTION public.increment_quick_phrase_usage(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.get_whatsapp_stats(uuid, timestamp with time zone, timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.update_subscriptions_updated_at() SET search_path = public;
ALTER FUNCTION public.update_booking_deposits_updated_at() SET search_path = public;
ALTER FUNCTION public.update_clinic_settings_updated_at() SET search_path = public;
ALTER FUNCTION public.update_patient_tags_updated_at() SET search_path = public;
ALTER FUNCTION public.update_promotions_updated_at() SET search_path = public;
ALTER FUNCTION public.update_medical_records_updated_at() SET search_path = public;
ALTER FUNCTION public.check_location_limit() SET search_path = public;
ALTER FUNCTION public.ensure_single_principal_location() SET search_path = public;
ALTER FUNCTION public.update_medical_history_updated_at() SET search_path = public;
ALTER FUNCTION public.update_locations_updated_at() SET search_path = public;
ALTER FUNCTION public.create_default_location_for_user() SET search_path = public;
ALTER FUNCTION public.cleanup_orphaned_form_files() SET search_path = public;
ALTER FUNCTION public.user_has_valid_subscription(uuid) SET search_path = public;
ALTER FUNCTION public.get_user_addon_quantity(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_effective_limits(uuid) SET search_path = public;
ALTER FUNCTION public.update_subscription_addons_updated_at() SET search_path = public;
ALTER FUNCTION public.reset_daily_message_usage() SET search_path = public;
ALTER FUNCTION public.increment_message_usage(uuid, integer) SET search_path = public;
ALTER FUNCTION public.reset_daily_email_usage() SET search_path = public;
ALTER FUNCTION public.set_timestamp() SET search_path = public;
ALTER FUNCTION public.update_message_status(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.generate_booking_slug() SET search_path = public;
ALTER FUNCTION public.increment_email_usage(uuid, integer) SET search_path = public;
ALTER FUNCTION public.get_current_user_id() SET search_path = public;
ALTER FUNCTION public.is_slot_available(uuid, timestamp with time zone, timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.create_subscription_on_invitation_accept() SET search_path = public;
ALTER FUNCTION public.update_connected_accounts_updated_at() SET search_path = public;
ALTER FUNCTION public.release_expired_slot_locks() SET search_path = public;
ALTER FUNCTION public.update_user_profiles_updated_at() SET search_path = public;
ALTER FUNCTION public.update_public_bookings_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_notification_preferences_updated_at() SET search_path = public;
ALTER FUNCTION public.delete_expired_notifications() SET search_path = public;
ALTER FUNCTION public.expire_old_invitations() SET search_path = public;
ALTER FUNCTION public.generate_invitation_token() SET search_path = public;
ALTER FUNCTION public.update_quick_phrases_updated_at() SET search_path = public;
ALTER FUNCTION public.update_patient_photos_updated_at() SET search_path = public;
ALTER FUNCTION public.update_appointments_updated_at() SET search_path = public;
ALTER FUNCTION public.cleanup_orphaned_subscriptions() SET search_path = public;
ALTER FUNCTION public.set_user_id() SET search_path = public;
ALTER FUNCTION public.update_intake_forms_updated_at() SET search_path = public;
ALTER FUNCTION public.is_form_token_valid(uuid) SET search_path = public;
ALTER FUNCTION public.complete_form_token(uuid) SET search_path = public;
ALTER FUNCTION public.generate_team_invitation_token() SET search_path = public;
ALTER FUNCTION public.update_team_members_updated_at() SET search_path = public;
ALTER FUNCTION public.update_variable_expenses_updated_at() SET search_path = public;
ALTER FUNCTION public.can_user_perform_action(uuid, text) SET search_path = public;

-- Verify all functions now have search_path set
SELECT 
    p.proname as function_name,
    p.proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'handle_new_user', 'update_bundles_updated_at', 'update_google_calendar_updated_at',
    'increment_quick_phrase_usage', 'get_whatsapp_stats', 'update_subscriptions_updated_at',
    'update_booking_deposits_updated_at', 'update_clinic_settings_updated_at',
    'update_patient_tags_updated_at', 'update_promotions_updated_at',
    'update_medical_records_updated_at', 'check_location_limit',
    'ensure_single_principal_location', 'update_medical_history_updated_at',
    'update_locations_updated_at', 'create_default_location_for_user',
    'cleanup_orphaned_form_files', 'user_has_valid_subscription',
    'get_user_addon_quantity', 'get_effective_limits',
    'update_subscription_addons_updated_at', 'reset_daily_message_usage',
    'increment_message_usage', 'reset_daily_email_usage',
    'set_timestamp', 'update_message_status', 'generate_booking_slug',
    'increment_email_usage', 'get_current_user_id', 'is_slot_available',
    'create_subscription_on_invitation_accept', 'update_connected_accounts_updated_at',
    'release_expired_slot_locks', 'update_user_profiles_updated_at',
    'update_public_bookings_updated_at', 'update_updated_at_column',
    'update_notification_preferences_updated_at', 'delete_expired_notifications',
    'expire_old_invitations', 'generate_invitation_token',
    'update_quick_phrases_updated_at', 'update_patient_photos_updated_at',
    'update_appointments_updated_at', 'cleanup_orphaned_subscriptions',
    'set_user_id', 'update_intake_forms_updated_at',
    'is_form_token_valid', 'complete_form_token',
    'generate_team_invitation_token', 'update_team_members_updated_at',
    'update_variable_expenses_updated_at', 'can_user_perform_action'
)
ORDER BY p.proname;
