# Fix Application Form RLS Issue

## What's Wrong

When you click "Submit" on the application form, you get: `TypeError: load failed`

This means the app is blocked from inserting into `street_applications` table, likely due to RLS (Row-Level Security) policy.

## How to Fix

### Step 1: Check if RLS is enabled

Go to your **Supabase Dashboard**:
1. **Database > Tables > street_applications**
2. Look for the **RLS toggle** - it should be OFF (disabled) for the application form to work for unauthenticated users
3. If it's ON: Click to turn it OFF

### Step 2: If RLS is OFF but still not working

The table might not exist or is misconfigured. Run this SQL in Supabase SQL Editor:

```sql
-- Create the street_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.street_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  instagram_handle TEXT,
  experience_tags TEXT[] DEFAULT '{}',
  why_join TEXT,
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Make sure RLS is disabled for unauthenticated applications
ALTER TABLE public.street_applications DISABLE ROW LEVEL SECURITY;

-- Grant insert permission to anon users (for application form)
GRANT INSERT ON public.street_applications TO anon, authenticated;
GRANT SELECT ON public.street_applications TO authenticated;
```

### Step 3: Test

Once you've done this, try submitting an application again.

## For Login Issues

If login still says "wrong credentials":

1. **Test user might not exist**
2. Go to **Supabase Dashboard > Authentication > Users**
3. Create a new user:
   - Email: `test@patronpass.com`
   - Password: `PatronPass2024!SecureTest#`
   - Check "Auto Confirm User"
4. **Copy the User ID**
5. Run this SQL (replace the UUID):

```sql
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
  current_rank
)
VALUES (
  'UUID_FROM_STEP_4_HERE',
  'test@patronpass.com',
  'city_captain',
  'Test Captain',
  'Hudson Valley',
  '@testcaptain',
  '+1-555-0100',
  'active',
  2500,
  'Gold'
);
```

Then try logging in with:
- Email: `test@patronpass.com`
- Password: `PatronPass2024!SecureTest#`

## Summary

**Two things needed:**
1. Disable RLS on `street_applications` table
2. Create test user in Supabase auth + street_users table

After these, both login and application form should work!
