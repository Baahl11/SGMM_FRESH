-- Query to get all function signatures that need search_path fixes
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as parameters,
    'ALTER FUNCTION public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') SET search_path = public;' as alter_statement
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
