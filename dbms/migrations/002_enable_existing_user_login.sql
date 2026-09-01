-- Login and registration are now self-contained in the application. Existing
-- local/demo accounts created before this change should remain usable.
UPDATE app_users
SET is_verified = TRUE,
    verification_token_hash = NULL,
    verification_token_expires_at = NULL
WHERE is_verified = FALSE;
