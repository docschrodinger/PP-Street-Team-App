-- ============================================================================
-- CREATE TEST USER FOR PATRON PASS STREET TEAM APP
-- ============================================================================
-- 
-- Run this SQL in your Supabase SQL Editor to create a test user.
-- This bypasses RLS policies and creates both auth and street_users records.
--
-- IMPORTANT: Replace 'YOUR_PROJECT_URL' with your actual Supabase project URL
-- ============================================================================

-- Step 1: Create user in auth.users using admin function
-- Note: This uses the service role, so it bypasses RLS

DO $$
DECLARE
  test_user_id UUID;
  existing_user UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user
  FROM auth.users
  WHERE email = 'test@patronpass.com';

  IF existing_user IS NULL THEN
    -- Generate a new UUID for the user
    test_user_id := gen_random_uuid();

    -- Insert into auth.users (this is usually done by Supabase Auth API)
    -- For testing, we'll insert directly
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      test_user_id,
      '00000000-0000-0000-0000-000000000000',
      'test@patronpass.com',
      crypt('PatronPass2024!SecureTest#', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Test Captain", "city": "Hudson Valley", "role": "city_captain"}',
      'authenticated',
      'authenticated'
    );

    -- Insert into street_users
    INSERT INTO street_users (
      id,
      email,
      role,
      full_name,
      city,
      instagram_handle,
      phone,
      status,
      total_xp,
      current_rank,
      avatar_url,
      preferences
    ) VALUES (
      test_user_id,
      'test@patronpass.com',
      'city_captain',
      'Test Captain',
      'Hudson Valley',
      '@testcaptain',
      '+1-555-0100',
      'active',
      2500,
      'Gold',
      NULL,
      '{"email_notifications": true, "push_notifications": true}'::jsonb
    );

    -- Insert contract acceptance
    INSERT INTO street_contract_acceptances (
      user_id,
      agreement_version,
      accepted_at,
      typed_signature,
      ip_address,
      device_info
    ) VALUES (
      test_user_id,
      'v1.0',
      NOW(),
      'Test Captain',
      '127.0.0.1',
      'Test Environment'
    );

    RAISE NOTICE 'Test user created successfully with ID: %', test_user_id;
  ELSE
    RAISE NOTICE 'Test user already exists with ID: %', existing_user;
  END IF;
END $$;

-- ============================================================================
-- ALTERNATIVE: Simpler version using Supabase Auth API
-- ============================================================================
-- 
-- If the above doesn't work due to auth schema restrictions, use this method:
-- 
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" button
-- 3. Fill in:
--    - Email: test@patronpass.com
--    - Password: PatronPass2024!SecureTest#
--    - Auto Confirm User: ✓ (checked)
-- 4. Click "Create user"
-- 5. Copy the User ID (UUID) from the users list
-- 6. Then run this SQL (replace USER_ID_HERE with the copied UUID):

/*
INSERT INTO street_users (
  id,
  email,
  role,
  full_name,
  city,
  instagram_handle,
  phone,
  status,
  total_xp,
  current_rank,
  preferences
) VALUES (
  'USER_ID_HERE',  -- ← PASTE USER ID HERE
  'test@patronpass.com',
  'city_captain',
  'Test Captain',
  'Hudson Valley',
  '@testcaptain',
  '+1-555-0100',
  'active',
  2500,
  'Gold',
  '{"email_notifications": true, "push_notifications": true}'::jsonb
);

INSERT INTO street_contract_acceptances (
  user_id,
  agreement_version,
  accepted_at,
  typed_signature
) VALUES (
  'USER_ID_HERE',  -- ← PASTE SAME USER ID HERE
  'v1.0',
  NOW(),
  'Test Captain'
);
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify the test user was created:

SELECT 
  su.id,
  su.email,
  su.full_name,
  su.role,
  su.city,
  su.status,
  su.total_xp,
  su.current_rank,
  CASE WHEN sca.id IS NOT NULL THEN 'Yes' ELSE 'No' END as contract_signed
FROM street_users su
LEFT JOIN street_contract_acceptances sca ON sca.user_id = su.id
WHERE su.email = 'test@patronpass.com';

-- ============================================================================
-- LOGIN CREDENTIALS
-- ============================================================================
-- Email: test@patronpass.com
-- Password: PatronPass2024!SecureTest#
-- Role: City Captain
-- Rank: Gold (2500 XP)
-- ============================================================================
