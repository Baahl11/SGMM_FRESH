-- Migration: Add onboarding drip email tracking column
-- Run this in Supabase SQL editor

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS onboarding_emails_sent text[] DEFAULT '{}';

COMMENT ON COLUMN subscriptions.onboarding_emails_sent IS
  'Array of drip email IDs already sent: day0_welcome, day1_tips, day3_patients, day5_review';
