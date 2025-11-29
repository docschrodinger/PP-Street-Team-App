import { useEffect, useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  MapPin,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { 
  getUnifiedLeads,
  getHQMetrics,
  bulkSyncLeadsToWebsite
} from '../lib/integrationServiceSafe';
import { toast } from 'sonner@2.0.3';

export function HQAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    liveVenues: 0,
    activeAgents: 0,
    totalRevenue: 0,
    averageConversionRate: 0,
  });

  const [applications, setApplications] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({
    city: '',
    status: '',
    agentId: '',
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Get metrics
      const metricsData = await getHQMetrics();
      
      // Get pending applications
      const { data: appsData } = await supabase
        .from('street_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      // Get all leads
      const leadsData = await getUnifiedLeads();

      setMetrics({
        totalLeads: metricsData.totalLeads,
        liveVenues: metricsData.liveVenues,
        activeAgents: metricsData.activeAgents,
        totalRevenue: metricsData.actualRevenue || metricsData.estimatedRevenue,
        averageConversionRate: metricsData.conversionRate,
      });
      
      setApplications(appsData || []);
      setLeads(leadsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncToWebsite() {
    setSyncing(true);
    try {
      const result = await bulkSyncLeadsToWebsite();
      
      if (result.success) {
        toast.success(`Successfully synced ${result.syncedCount} leads to website CRM`);
      } else {
        toast.error(`Sync completed with errors. ${result.syncedCount} synced, ${result.errors.length} failed.`);
      }
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Failed to sync leads');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-[#8A4FFF] animate-pulse">Loading HQ Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#8A4FFF] uppercase tracking-tight mb-2">
          HQ Admin Dashboard
        </h1>
        <p className="text-white/60">Manage street team operations and performance</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <button
          onClick={loadDashboardData}
          className="bg-[#8A4FFF] hover:bg-[#7a3fee] text-white px-4 py-2 border-4 border-black font-bold uppercase flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        
        <button
          onClick={handleSyncToWebsite}
          disabled={syncing}
          className="bg-[#FF7A59] hover:bg-[#ff6847] disabled:opacity-50 text-white px-4 py-2 border-4 border-black font-bold uppercase flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          {syncing ? 'Syncing...' : 'Sync to Website CRM'}
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Leads"
          value={metrics.totalLeads}
          icon={<Target className="w-6 h-6" />}
          color="#8A4FFF"
        />
        <MetricCard
          title="Live Venues"
          value={metrics.liveVenues}
          icon={<CheckCircle className="w-6 h-6" />}
          color="#00FF00"
        />
        <MetricCard
          title="Active Agents"
          value={metrics.activeAgents}
          icon={<Users className="w-6 h-6" />}
          color="#FF7A59"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
          color="#FFD700"
        />
      </div>

      {/* Conversion Rate */}
      <div className="bg-black border-4 border-[#8A4FFF] p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/60 uppercase tracking-wider mb-1">
              Avg Conversion Rate
            </div>
            <div className="text-4xl font-black text-[#8A4FFF]">
              {metrics.averageConversionRate}%
            </div>
          </div>
          <TrendingUp className="w-12 h-12 text-[#8A4FFF]" />
        </div>
      </div>

      {/* Pending Applications */}
      {applications.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-black text-[#FF7A59] uppercase tracking-tight mb-4">
            Pending Applications ({applications.length})
          </h2>
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-black border-4 border-[#FF7A59] p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-lg">{app.full_name}</div>
                    <div className="text-white/60">{app.email}</div>
                    <div className="text-white/60 text-sm">
                      {app.city} • {app.instagram_handle}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 border-2 border-black font-bold text-sm transition-colors">
                      Approve
                    </button>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 border-2 border-black font-bold text-sm transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div>
        <h2 className="text-2xl font-black text-[#8A4FFF] uppercase tracking-tight mb-4">
          All Leads ({leads.length})
        </h2>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-black border-2 border-[#8A4FFF] text-white px-3 py-2 font-bold"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="follow_up">Follow Up</option>
            <option value="demo_scheduled">Demo</option>
            <option value="verbal_yes">Verbal Yes</option>
            <option value="signed_pending">Signed Pending</option>
            <option value="live">Live</option>
          </select>

          <input
            type="text"
            placeholder="Filter by city..."
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="bg-black border-2 border-[#8A4FFF] text-white px-3 py-2 font-bold"
          />
        </div>

        {/* Table */}
        <div className="bg-black border-4 border-[#8A4FFF] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-4 border-[#8A4FFF]">
                <th className="text-left p-3 text-[#8A4FFF] uppercase tracking-wider">
                  Venue
                </th>
                <th className="text-left p-3 text-[#8A4FFF] uppercase tracking-wider">
                  Contact
                </th>
                <th className="text-left p-3 text-[#8A4FFF] uppercase tracking-wider">
                  Agent
                </th>
                <th className="text-left p-3 text-[#8A4FFF] uppercase tracking-wider">
                  City
                </th>
                <th className="text-left p-3 text-[#8A4FFF] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left p-3 text-[#8A4FFF] uppercase tracking-wider">
                  Heat
                </th>
              </tr>
            </thead>
            <tbody>
              {leads
                .filter(lead => {
                  if (filters.status && lead.status !== filters.status) return false;
                  if (filters.city && !lead.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;
                  return true;
                })
                .map((lead) => (
                  <tr key={lead.id} className="border-b-2 border-white/10 hover:bg-white/5">
                    <td className="p-3 font-bold">{lead.venue_name}</td>
                    <td className="p-3 text-white/80">{lead.contact_name}</td>
                    <td className="p-3 text-white/80">
                      {lead.agent?.full_name || 'Unknown'}
                      <span className="ml-2 text-xs text-[#8A4FFF]">
                        ({lead.agent?.current_rank})
                      </span>
                    </td>
                    <td className="p-3 text-white/80">{lead.city}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-bold uppercase ${getStatusColor(lead.status)}`}>
                        {lead.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-2xl ${getHeatEmoji(lead.heat_score)}`}>
                        {getHeatEmoji(lead.heat_score)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
}) {
  return (
    <div className="bg-black border-4 p-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-white/60 uppercase tracking-wider text-sm">{title}</div>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="text-3xl font-black" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'new': 'bg-blue-600 text-white',
    'contacted': 'bg-purple-600 text-white',
    'follow_up': 'bg-yellow-600 text-black',
    'demo_scheduled': 'bg-orange-600 text-white',
    'verbal_yes': 'bg-pink-600 text-white',
    'signed_pending': 'bg-green-600 text-white',
    'live': 'bg-green-400 text-black',
  };
  return colors[status] || 'bg-gray-600 text-white';
}

function getHeatEmoji(score?: number | null): string {
  if (!score) return '❄️';
  if (score >= 8) return '🔥';
  if (score >= 5) return '🌡️';
  return '❄️';
}
