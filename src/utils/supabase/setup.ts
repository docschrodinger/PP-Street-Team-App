import { createClient } from './client';

export async function initializeDatabase() {
  const supabase = createClient();

  // Check if tables exist by trying to query them
  try {
    await supabase.from('street_ranks').select('*').limit(1);
  } catch (error) {
    console.log('Database tables may not exist yet. They should be created via Supabase dashboard.');
    return;
  }

  // Seed initial ranks if they don't exist
  const { data: existingRanks } = await supabase.from('street_ranks').select('*');
  
  if (!existingRanks || existingRanks.length === 0) {
    const ranks = [
      {
        name: 'Bronze',
        min_xp: 0,
        order_index: 1,
        perks_description: 'Entry level. Learn the ropes. 15% platform fee share on first 15 venues for 12 months.'
      },
      {
        name: 'Silver',
        min_xp: 1000,
        order_index: 2,
        perks_description: 'Proven hustler. Priority lead approval. Early access to new features.'
      },
      {
        name: 'Gold',
        min_xp: 2500,
        order_index: 3,
        perks_description: 'City mover. 20% platform fee share. Exclusive weekly missions.'
      },
      {
        name: 'Platinum',
        min_xp: 5000,
        order_index: 4,
        perks_description: 'Elite status. 25% platform fee share. Direct HQ line. First pick on high-value leads.'
      },
      {
        name: 'Diamond',
        min_xp: 10000,
        order_index: 5,
        perks_description: 'Top 1%. 30% platform fee share for life. VIP events. Mentor bonuses.'
      },
      {
        name: 'Black Key',
        min_xp: 25000,
        order_index: 6,
        perks_description: 'Legendary. Equity consideration. Co-create strategy with HQ. Lifetime rev-share on your network.'
      }
    ];

    for (const rank of ranks) {
      await supabase.from('street_ranks').insert(rank);
    }
  }

  // Seed initial global missions
  const { data: existingMissions } = await supabase.from('street_missions').select('*');
  
  if (!existingMissions || existingMissions.length === 0) {
    const today = new Date().toISOString();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const missions = [
      {
        title: 'First Contact',
        description: 'Add 3 new venue leads today',
        type: 'daily',
        scope: 'global',
        city: null,
        xp_reward: 100,
        point_reward: 10,
        required_count: 3,
        valid_from: today,
        valid_to: nextWeek,
        created_by: null
      },
      {
        title: 'Street Runner',
        description: 'Complete 5 street runs this week',
        type: 'weekly',
        scope: 'global',
        city: null,
        xp_reward: 500,
        point_reward: 50,
        required_count: 5,
        valid_from: today,
        valid_to: nextWeek,
        created_by: null
      },
      {
        title: 'Relationship Builder',
        description: 'Move 2 leads to "Follow Up" stage',
        type: 'daily',
        scope: 'global',
        city: null,
        xp_reward: 150,
        point_reward: 15,
        required_count: 2,
        valid_from: today,
        valid_to: nextWeek,
        created_by: null
      }
    ];

    for (const mission of missions) {
      await supabase.from('street_missions').insert(mission);
    }
  }
}

/**
 * DEPRECATED: This function is no longer called automatically on app startup
 * due to RLS policy restrictions.
 * 
 * To create a test user, use one of these methods:
 * 
 * METHOD 1 - Supabase Dashboard (Recommended):
 * 1. Go to Authentication > Users in Supabase Dashboard
 * 2. Click "Add User" > "Create new user"
 * 3. Email: test@patronpass.com
 * 4. Password: PatronPass2024!SecureTest#
 * 5. Auto Confirm User: YES
 * 6. Copy the User ID
 * 7. Go to SQL Editor and run:
 * 
 *    INSERT INTO street_users (id, email, role, full_name, city, instagram_handle, phone, status, total_xp, current_rank)
 *    VALUES (
 *      'PASTE_USER_ID_HERE',
 *      'test@patronpass.com',
 *      'city_captain',
 *      'Test Captain',
 *      'Hudson Valley',
 *      '@testcaptain',
 *      '+1-555-0100',
 *      'active',
 *      2500,
 *      'Gold'
 *    );
 * 
 * METHOD 2 - Apply through the app:
 * 1. Click "Apply Now" on the welcome screen
 * 2. Fill out the application form
 * 3. As HQ admin, approve the application in Supabase Dashboard
 * 4. Create auth account and street_users record manually
 * 5. User can then login
 * 
 * METHOD 3 - Use this function manually in console (if you have service role key):
 * Open browser console and run: await seedTestUser()
 */
export async function seedTestUser() {
  console.log('⚠️ seedTestUser() is deprecated. See function comments for manual setup instructions.');
  console.log('To create a test user, go to Supabase Dashboard > Authentication > Add User');
  console.log('Email: test@patronpass.com | Password: PatronPass2024!SecureTest#');
}
