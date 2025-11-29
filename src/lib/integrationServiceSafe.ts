/**
 * SAFE INTEGRATION SERVICE
 * 
 * This is a wrapper around integrationService.ts that gracefully handles
 * missing website tables. Use this if your website tables don't exist yet.
 * 
 * When website tables are added, the functions will automatically start working.
 */

import { supabase } from '../utils/supabase/client';
import type { StreetVenueLead } from './types';

// ============================================================================
// TABLE EXISTENCE CHECKS
// ============================================================================

let websiteTablesCache: {
  checked: boolean;
  exists: boolean;
  checkedAt: number;
} = {
  checked: false,
  exists: false,
  checkedAt: 0,
};

/**
 * Check if website tables exist (with 5-minute cache)
 */
async function checkWebsiteTablesExist(): Promise<boolean> {
  const now = Date.now();
  const cacheAge = now - websiteTablesCache.checkedAt;
  
  // Use cache if less than 5 minutes old
  if (websiteTablesCache.checked && cacheAge < 5 * 60 * 1000) {
    return websiteTablesCache.exists;
  }

  try {
    // Try to query the website table
    const { error } = await supabase
      .from('website_partnership_inquiries')
      .select('id')
      .limit(1);

    const exists = !error || !error.message.includes('does not exist');
    
    websiteTablesCache = {
      checked: true,
      exists,
      checkedAt: now,
    };

    return exists;
  } catch (err) {
    console.log('Website tables check error (this is OK if not set up yet):', err);
    websiteTablesCache = {
      checked: true,
      exists: false,
      checkedAt: now,
    };
    return false;
  }
}

// ============================================================================
// LEAD CRM SYNC (SAFE VERSION)
// ============================================================================

/**
 * Sync a street team lead to the main website CRM
 * 
 * SAFE: Returns gracefully if website tables don't exist yet
 */
export async function syncLeadToWebsiteCRM(lead: StreetVenueLead): Promise<{
  success: boolean;
  websiteInquiryId?: string;
  error?: string;
  skipped?: boolean;
}> {
  try {
    // Check if website tables exist
    const websiteExists = await checkWebsiteTablesExist();
    
    if (!websiteExists) {
      console.log('⏭️ Skipping website sync - website tables not yet set up');
      return {
        success: true,
        skipped: true,
        error: 'Website tables not yet configured (this is OK)',
      };
    }

    // Only sync leads that are signed or live
    if (lead.status !== 'signed_pending' && lead.status !== 'live') {
      return {
        success: false,
        error: 'Lead must be signed_pending or live to sync to website CRM',
      };
    }

    // Check if this lead has already been synced
    const { data: existingInquiry } = await supabase
      .from('website_partnership_inquiries')
      .eq('street_team_lead_id', lead.id)
      .select('id')
      .single();

    if (existingInquiry) {
      // Already synced, update it
      const { data, error } = await supabase
        .from('website_partnership_inquiries')
        .update({
          venue_name: lead.venue_name,
          contact_name: lead.contact_name,
          contact_email: lead.contact_email,
          contact_phone: lead.contact_phone,
          city: lead.city,
          status: lead.status === 'live' ? 'active' : 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingInquiry.id)
        .select('id')
        .single();

      if (error) throw error;

      // Update the street lead with the website inquiry ID
      await supabase
        .from('street_venue_leads')
        .update({ website_inquiry_id: existingInquiry.id })
        .eq('id', lead.id);

      return {
        success: true,
        websiteInquiryId: existingInquiry.id,
      };
    }

    // Create new inquiry in website CRM
    const { data: newInquiry, error: insertError } = await supabase
      .from('website_partnership_inquiries')
      .insert({
        venue_name: lead.venue_name,
        contact_name: lead.contact_name,
        contact_email: lead.contact_email,
        contact_phone: lead.contact_phone,
        city: lead.city,
        source: 'street_team',
        status: lead.status === 'live' ? 'active' : 'pending',
        street_team_lead_id: lead.id,
        street_team_agent_id: lead.user_id,
        notes: lead.notes || '',
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    // Update the street lead with the website inquiry ID
    const { error: updateError } = await supabase
      .from('street_venue_leads')
      .update({ website_inquiry_id: newInquiry.id })
      .eq('id', lead.id);

    if (updateError) throw updateError;

    return {
      success: true,
      websiteInquiryId: newInquiry.id,
    };
  } catch (error: any) {
    console.error('Error syncing lead to website CRM:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Bulk sync all eligible leads to website CRM
 */
export async function bulkSyncLeadsToWebsite(): Promise<{
  success: boolean;
  syncedCount: number;
  errors: string[];
}> {
  try {
    // Check if website tables exist
    const websiteExists = await checkWebsiteTablesExist();
    
    if (!websiteExists) {
      console.log('⏭️ Skipping bulk sync - website tables not yet set up');
      return {
        success: true,
        syncedCount: 0,
        errors: ['Website tables not yet configured (this is OK)'],
      };
    }

    // Get all signed/live leads that haven't been synced
    const { data: leads, error: fetchError } = await supabase
      .from('street_venue_leads')
      .select('*')
      .in('status', ['signed_pending', 'live'])
      .is('website_inquiry_id', null);

    if (fetchError) throw fetchError;

    if (!leads || leads.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        errors: [],
      };
    }

    // Sync each lead
    let syncedCount = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      const result = await syncLeadToWebsiteCRM(lead as StreetVenueLead);
      if (result.success && !result.skipped) {
        syncedCount++;
      } else if (!result.success) {
        errors.push(`${lead.venue_name}: ${result.error}`);
      }
    }

    return {
      success: true,
      syncedCount,
      errors,
    };
  } catch (error: any) {
    console.error('Error in bulk sync:', error);
    return {
      success: false,
      syncedCount: 0,
      errors: [error.message],
    };
  }
}

// ============================================================================
// REVENUE TRACKING (SAFE VERSION)
// ============================================================================

/**
 * Get accurate earnings for a street team member
 * Links to actual billing data when available
 */
export async function getAccurateEarnings(
  userId: string,
  commissionRate: number = 0.20
): Promise<{
  estimatedMonthly: number;
  actualMonthly: number;
  liveVenueCount: number;
  venuesWithBilling: number;
}> {
  try {
    // Check if website tables exist
    const websiteExists = await checkWebsiteTablesExist();

    // Get all live venues for this user
    const { data: liveVenues, error } = await supabase
      .from('street_venue_leads')
      .select('estimated_monthly_revenue, actual_monthly_revenue, billing_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'live');

    if (error) throw error;

    if (!liveVenues || liveVenues.length === 0) {
      return {
        estimatedMonthly: 0,
        actualMonthly: 0,
        liveVenueCount: 0,
        venuesWithBilling: 0,
      };
    }

    // Calculate estimated earnings
    const estimatedMonthly = liveVenues.reduce(
      (sum, venue) => sum + (venue.estimated_monthly_revenue || 150),
      0
    ) * commissionRate;

    // Calculate actual earnings (use actual if available, otherwise estimated)
    const actualMonthly = liveVenues.reduce(
      (sum, venue) =>
        sum +
        (venue.actual_monthly_revenue || venue.estimated_monthly_revenue || 150),
      0
    ) * commissionRate;

    // Count venues with billing data
    const venuesWithBilling = liveVenues.filter(
      (v) => v.actual_monthly_revenue !== null
    ).length;

    return {
      estimatedMonthly,
      actualMonthly,
      liveVenueCount: liveVenues.length,
      venuesWithBilling,
    };
  } catch (error) {
    console.error('Error getting accurate earnings:', error);
    return {
      estimatedMonthly: 0,
      actualMonthly: 0,
      liveVenueCount: 0,
      venuesWithBilling: 0,
    };
  }
}

// ============================================================================
// UNIFIED AUTH (SAFE VERSION)
// ============================================================================

/**
 * Check if a user has access to both street team and website systems
 */
export async function checkUnifiedAccess(userId: string): Promise<{
  hasStreetTeamAccess: boolean;
  hasWebsiteAccess: boolean;
  roles: string[];
}> {
  try {
    // Check street team access
    const { data: streetUser } = await supabase
      .from('street_users')
      .select('role')
      .eq('id', userId)
      .single();

    const hasStreetTeamAccess = !!streetUser;

    // Check if website tables exist
    const websiteExists = await checkWebsiteTablesExist();
    
    let hasWebsiteAccess = false;
    const roles: string[] = [];

    if (streetUser) {
      roles.push(`street_${streetUser.role}`);
    }

    if (websiteExists) {
      // Check website access
      const { data: websiteUser } = await supabase
        .from('website_users')
        .select('role')
        .eq('id', userId)
        .single();

      hasWebsiteAccess = !!websiteUser;

      if (websiteUser) {
        roles.push(`website_${websiteUser.role}`);
      }
    }

    return {
      hasStreetTeamAccess,
      hasWebsiteAccess,
      roles,
    };
  } catch (error) {
    console.error('Error checking unified access:', error);
    return {
      hasStreetTeamAccess: false,
      hasWebsiteAccess: false,
      roles: [],
    };
  }
}

// ============================================================================
// ADMIN QUERIES (SAFE VERSION)
// ============================================================================

/**
 * Get unified lead data for HQ dashboard
 * Uses the lite view if website tables don't exist
 */
export async function getUnifiedLeads(filters?: {
  city?: string;
  status?: string;
  agentId?: string;
}): Promise<any[]> {
  try {
    // Check if website tables exist
    const websiteExists = await checkWebsiteTablesExist();

    // Use appropriate view based on what's available
    const viewName = websiteExists ? 'hq_unified_leads' : 'hq_unified_leads_lite';

    let query = supabase.from(viewName).select('*');

    // Apply filters
    if (filters?.city) {
      query = query.eq('city', filters.city);
    }
    if (filters?.status) {
      query = query.eq('street_status', filters.status);
    }
    if (filters?.agentId) {
      query = query.eq('agent_id', filters.agentId);
    }

    const { data, error } = await query.order('lead_updated_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting unified leads:', error);
    return [];
  }
}

/**
 * Get metrics for HQ dashboard
 */
export async function getHQMetrics(): Promise<{
  totalLeads: number;
  liveVenues: number;
  activeAgents: number;
  estimatedRevenue: number;
  actualRevenue: number;
  conversionRate: number;
}> {
  try {
    const { data: leads } = await supabase
      .from('street_venue_leads')
      .select('status, estimated_monthly_revenue, actual_monthly_revenue, user_id');

    if (!leads) {
      return {
        totalLeads: 0,
        liveVenues: 0,
        activeAgents: 0,
        estimatedRevenue: 0,
        actualRevenue: 0,
        conversionRate: 0,
      };
    }

    const liveVenues = leads.filter((l) => l.status === 'live').length;
    const activeAgents = new Set(leads.map((l) => l.user_id)).size;
    
    const estimatedRevenue = leads
      .filter((l) => l.status === 'live')
      .reduce((sum, l) => sum + (l.estimated_monthly_revenue || 150), 0);
    
    const actualRevenue = leads
      .filter((l) => l.status === 'live')
      .reduce((sum, l) => sum + (l.actual_monthly_revenue || l.estimated_monthly_revenue || 150), 0);

    const conversionRate = leads.length > 0 ? (liveVenues / leads.length) * 100 : 0;

    return {
      totalLeads: leads.length,
      liveVenues,
      activeAgents,
      estimatedRevenue,
      actualRevenue,
      conversionRate,
    };
  } catch (error) {
    console.error('Error getting HQ metrics:', error);
    return {
      totalLeads: 0,
      liveVenues: 0,
      activeAgents: 0,
      estimatedRevenue: 0,
      actualRevenue: 0,
      conversionRate: 0,
    };
  }
}
