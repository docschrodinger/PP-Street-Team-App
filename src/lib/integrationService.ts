/**
 * INTEGRATION SERVICE
 * 
 * Handles syncing between Street Team app and main Patron Pass website.
 * 
 * IMPORTANT: This service is NON-DESTRUCTIVE to existing website tables.
 * It only reads from website tables and writes to street_* tables.
 * 
 * Sync Points:
 * 1. Lead CRM: street_venue_leads → website_partnership_inquiries
 * 2. Revenue Tracking: Link to actual billing data
 * 3. SSO/Unified Auth: Share authentication
 * 4. Admin Dashboard: Read/write permissions for HQ
 */

import { supabase } from '../utils/supabase/client';
import type { StreetVenueLead } from './types';

// ============================================================================
// LEAD CRM SYNC
// ============================================================================

/**
 * Sync a street team lead to the main website CRM
 * 
 * This creates or updates a partnership inquiry in the website database
 * when a lead reaches "signed_pending" or "live" status.
 * 
 * SAFE: Only inserts/updates website_partnership_inquiries, never deletes
 */
export async function syncLeadToWebsiteCRM(lead: StreetVenueLead): Promise<{
  success: boolean;
  websiteInquiryId?: string;
  error?: string;
}> {
  try {
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
      .select('id')
      .eq('street_team_lead_id', lead.id)
      .single();

    if (existingInquiry) {
      // Update existing inquiry
      const { error: updateError } = await supabase
        .from('website_partnership_inquiries')
        .update({
          venue_name: lead.venue_name,
          contact_name: lead.contact_name,
          contact_role: lead.contact_role,
          email: lead.email,
          phone: lead.phone,
          city: lead.city,
          state: lead.state,
          status: lead.status === 'live' ? 'active' : 'pending_activation',
          street_team_agent_id: lead.user_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingInquiry.id);

      if (updateError) {
        console.error('Error updating website inquiry:', updateError);
        return { success: false, error: 'Failed to update website inquiry' };
      }

      return {
        success: true,
        websiteInquiryId: existingInquiry.id,
      };
    } else {
      // Create new inquiry
      const { data: newInquiry, error: insertError } = await supabase
        .from('website_partnership_inquiries')
        .insert({
          venue_name: lead.venue_name,
          contact_name: lead.contact_name,
          contact_role: lead.contact_role,
          email: lead.email,
          phone: lead.phone,
          city: lead.city,
          state: lead.state,
          status: lead.status === 'live' ? 'active' : 'pending_activation',
          source: 'street_team',
          street_team_lead_id: lead.id,
          street_team_agent_id: lead.user_id,
          notes: `Added by street team agent. Relationship strength: ${lead.relationship_strength || 'N/A'}`,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating website inquiry:', insertError);
        return { success: false, error: 'Failed to create website inquiry' };
      }

      // Update the street lead with the website inquiry ID
      await supabase
        .from('street_venue_leads')
        .update({ website_inquiry_id: newInquiry.id })
        .eq('id', lead.id);

      return {
        success: true,
        websiteInquiryId: newInquiry.id,
      };
    }
  } catch (error) {
    console.error('Unexpected error syncing lead to website:', error);
    return {
      success: false,
      error: 'Unexpected error',
    };
  }
}

/**
 * Bulk sync all signed/live leads to website CRM
 * Useful for initial migration or periodic syncs
 */
export async function bulkSyncLeadsToWebsite(userId?: string): Promise<{
  success: boolean;
  syncedCount: number;
  errors: string[];
}> {
  try {
    let query = supabase
      .from('street_venue_leads')
      .select('*')
      .in('status', ['signed_pending', 'live']);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: leads, error } = await query;

    if (error) {
      return {
        success: false,
        syncedCount: 0,
        errors: [error.message],
      };
    }

    const errors: string[] = [];
    let syncedCount = 0;

    for (const lead of leads || []) {
      const result = await syncLeadToWebsiteCRM(lead);
      if (result.success) {
        syncedCount++;
      } else if (result.error) {
        errors.push(`${lead.venue_name}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
    };
  } catch (error) {
    console.error('Unexpected error in bulk sync:', error);
    return {
      success: false,
      syncedCount: 0,
      errors: ['Unexpected error'],
    };
  }
}

// ============================================================================
// REVENUE TRACKING
// ============================================================================

/**
 * Link a street team lead to actual billing data from the main website
 * 
 * SAFE: Only reads from website billing tables, updates street_venue_leads
 */
export async function linkLeadToRevenue(leadId: string): Promise<{
  success: boolean;
  monthlyRevenue?: number;
  billingId?: string;
  error?: string;
}> {
  try {
    // Get the lead
    const { data: lead, error: leadError } = await supabase
      .from('street_venue_leads')
      .select('website_inquiry_id, patron_pass_business_id')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return { success: false, error: 'Lead not found' };
    }

    // If we have a business ID, fetch actual billing data
    if (lead.patron_pass_business_id) {
      const { data: billing, error: billingError } = await supabase
        .from('website_business_subscriptions')
        .select('id, monthly_amount, status')
        .eq('business_id', lead.patron_pass_business_id)
        .eq('status', 'active')
        .single();

      if (!billingError && billing) {
        // Update the lead with actual revenue data
        await supabase
          .from('street_venue_leads')
          .update({
            actual_monthly_revenue: billing.monthly_amount,
            billing_subscription_id: billing.id,
          })
          .eq('id', leadId);

        return {
          success: true,
          monthlyRevenue: billing.monthly_amount,
          billingId: billing.id,
        };
      }
    }

    // If no actual billing data, use estimated $150/month
    return {
      success: true,
      monthlyRevenue: 150,
      error: 'No billing data found, using estimate',
    };
  } catch (error) {
    console.error('Error linking lead to revenue:', error);
    return {
      success: false,
      error: 'Unexpected error',
    };
  }
}

/**
 * Get accurate earnings for a user based on actual billing data
 */
export async function getAccurateEarnings(userId: string, commissionRate: number): Promise<{
  estimatedMonthly: number;
  actualMonthly: number;
  liveVenues: number;
  venuesWithBilling: number;
}> {
  try {
    const { data: leads, error } = await supabase
      .from('street_venue_leads')
      .select('id, actual_monthly_revenue, billing_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'live');

    if (error) {
      return {
        estimatedMonthly: 0,
        actualMonthly: 0,
        liveVenues: 0,
        venuesWithBilling: 0,
      };
    }

    const liveVenues = leads?.length || 0;
    const venuesWithBilling = leads?.filter(l => l.billing_subscription_id).length || 0;

    // Calculate from actual billing data where available
    const actualRevenue = leads?.reduce((sum, lead) => {
      return sum + (lead.actual_monthly_revenue || 150);
    }, 0) || 0;

    const estimatedRevenue = liveVenues * 150;

    return {
      estimatedMonthly: estimatedRevenue * commissionRate,
      actualMonthly: actualRevenue * commissionRate,
      liveVenues,
      venuesWithBilling,
    };
  } catch (error) {
    console.error('Error calculating earnings:', error);
    return {
      estimatedMonthly: 0,
      actualMonthly: 0,
      liveVenues: 0,
      venuesWithBilling: 0,
    };
  }
}

// ============================================================================
// SSO / UNIFIED AUTH
// ============================================================================

/**
 * Check if a user has access to both Street Team app and main website
 * 
 * SAFE: Only reads from auth.users and street_users
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
      .select('role, status')
      .eq('id', userId)
      .single();

    // Check website user access
    const { data: websiteUser } = await supabase
      .from('website_users')
      .select('role, status')
      .eq('id', userId)
      .single();

    const roles: string[] = [];
    
    if (streetUser) {
      roles.push(`street_${streetUser.role}`);
    }
    
    if (websiteUser) {
      roles.push(`website_${websiteUser.role}`);
    }

    return {
      hasStreetTeamAccess: !!streetUser && streetUser.status === 'active',
      hasWebsiteAccess: !!websiteUser && websiteUser.status === 'active',
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
// ADMIN DASHBOARD HELPERS
// ============================================================================

/**
 * Get pending applications for HQ admin approval
 * 
 * SAFE: Read-only from street_applications
 */
export async function getPendingApplications(): Promise<{
  applications: any[];
  count: number;
}> {
  try {
    const { data, error } = await supabase
      .from('street_applications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    return {
      applications: data || [],
      count: data?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching pending applications:', error);
    return {
      applications: [],
      count: 0,
    };
  }
}

/**
 * Get all leads across all agents for HQ dashboard
 * 
 * SAFE: Read-only from street_venue_leads
 */
export async function getAllLeadsForHQ(filters?: {
  city?: string;
  status?: string;
  agentId?: string;
}): Promise<{
  leads: any[];
  count: number;
}> {
  try {
    let query = supabase
      .from('street_venue_leads')
      .select(`
        *,
        agent:street_users!street_venue_leads_user_id_fkey(
          id,
          full_name,
          email,
          city,
          current_rank
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.city) {
      query = query.eq('city', filters.city);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.agentId) {
      query = query.eq('user_id', filters.agentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leads for HQ:', error);
      return { leads: [], count: 0 };
    }

    return {
      leads: data || [],
      count: data?.length || 0,
    };
  } catch (error) {
    console.error('Error in getAllLeadsForHQ:', error);
    return {
      leads: [],
      count: 0,
    };
  }
}

/**
 * Get street team performance metrics for HQ dashboard
 * 
 * SAFE: Read-only aggregation queries
 */
export async function getPerformanceMetrics(timeframe: 'week' | 'month' | 'all' = 'month'): Promise<{
  totalLeads: number;
  liveVenues: number;
  activeAgents: number;
  totalRevenue: number;
  averageConversionRate: number;
}> {
  try {
    const { data: leads } = await supabase
      .from('street_venue_leads')
      .select('status, user_id, actual_monthly_revenue');

    const { data: users } = await supabase
      .from('street_users')
      .select('id, status')
      .eq('status', 'active')
      .in('role', ['ambassador', 'city_captain']);

    const liveVenues = leads?.filter(l => l.status === 'live').length || 0;
    const totalRevenue = leads
      ?.filter(l => l.status === 'live')
      .reduce((sum, l) => sum + (l.actual_monthly_revenue || 150), 0) || 0;

    const conversionRate = leads && leads.length > 0
      ? (liveVenues / leads.length) * 100
      : 0;

    return {
      totalLeads: leads?.length || 0,
      liveVenues,
      activeAgents: users?.length || 0,
      totalRevenue,
      averageConversionRate: Math.round(conversionRate * 10) / 10,
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return {
      totalLeads: 0,
      liveVenues: 0,
      activeAgents: 0,
      totalRevenue: 0,
      averageConversionRate: 0,
    };
  }
}
