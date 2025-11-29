import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  User,
  Calendar,
  TrendingUp,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { awardXP } from '../lib/xpService';
import { updateMissionProgress } from '../lib/missionService';
import { syncLeadToWebsiteCRM } from '../lib/integrationServiceSafe';
import type { StreetVenueLead, StreetUser, LeadStatus } from '../lib/types';
import { toast } from 'sonner';

interface LeadDetailsScreenProps {
  leadId: string;
  user: StreetUser;
  onBack: () => void;
  onLeadUpdated?: () => void;
}

const LEAD_STAGES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new', label: 'New', color: '#A0A0A0' },
  { id: 'contacted', label: 'Contacted', color: '#8A4FFF' },
  { id: 'follow_up', label: 'Follow Up', color: '#8A4FFF' },
  { id: 'demo_scheduled', label: 'Demo Scheduled', color: '#FF7A59' },
  { id: 'verbal_yes', label: 'Verbal Yes', color: '#FF7A59' },
  { id: 'signed_pending', label: 'Signed Pending', color: '#FFD700' },
  { id: 'live', label: 'Live', color: '#00FF00' },
];

export function LeadDetailsScreen({ leadId, user, onBack, onLeadUpdated }: LeadDetailsScreenProps) {
  const [lead, setLead] = useState<StreetVenueLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [editData, setEditData] = useState<Partial<StreetVenueLead>>({});

  useEffect(() => {
    loadLead();
  }, [leadId]);

  async function loadLead() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('street_venue_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) throw error;
      
      setLead(data);
      setEditData(data);
    } catch (error) {
      console.error('Error loading lead:', error);
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: LeadStatus) {
    if (!lead) return;

    const oldStatus = lead.status;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('street_venue_leads')
        .update({ 
          status: newStatus,
          // If moving to live, set first_membership_date if not already set
          ...(newStatus === 'live' && !lead.first_membership_date && {
            first_membership_date: new Date().toISOString()
          })
        })
        .eq('id', leadId);

      if (error) throw error;

      // Award XP for significant status changes
      // HQ admin can override these values or approve before XP is awarded
      let xpAmount = 0;
      let missionTrigger: any = null;

      if (newStatus === 'contacted' && oldStatus === 'new') {
        xpAmount = 10;
        missionTrigger = 'lead_to_contacted';
      } else if (newStatus === 'follow_up') {
        xpAmount = 15;
        missionTrigger = 'lead_to_follow_up';
      } else if (newStatus === 'demo_scheduled') {
        xpAmount = 25;
        missionTrigger = 'lead_to_demo';
      } else if (newStatus === 'verbal_yes') {
        xpAmount = 50;
        missionTrigger = 'lead_to_verbal_yes';
      } else if (newStatus === 'signed_pending') {
        xpAmount = 100;
        missionTrigger = 'lead_to_signed_pending';
      } else if (newStatus === 'live') {
        xpAmount = 200;
        missionTrigger = 'lead_to_live';
      }

      if (xpAmount > 0) {
        const result = await awardXP({
          userId: user.id,
          amount: xpAmount,
          source: 'venue_status_change',
          sourceId: leadId,
        });

        if (result.success) {
          toast.success(`Lead updated – +${xpAmount} XP earned!`, {
            description: result.rankUp ? `🎉 Promoted to ${result.newRank}!` : undefined,
          });

          // Update mission progress
          if (missionTrigger) {
            await updateMissionProgress(user.id, missionTrigger);
          }
        }
      } else {
        toast.success('Lead status updated');
      }

      // Auto-sync to website CRM if lead reaches signed/live status
      if (newStatus === 'signed_pending' || newStatus === 'live') {
        const syncResult = await syncLeadToWebsiteCRM({ ...lead, status: newStatus });
        if (syncResult.success) {
          toast.success('Lead synced to website CRM! 🔗');
        }
      }

      // Reload lead
      await loadLead();
      onLeadUpdated?.();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update lead status');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdits() {
    if (!lead) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('street_venue_leads')
        .update({
          contact_name: editData.contact_name,
          contact_role: editData.contact_role,
          contact_phone: editData.contact_phone,
          contact_email: editData.contact_email,
          notes: editData.notes,
          relationship_strength: editData.relationship_strength,
        })
        .eq('id', leadId);

      if (error) throw error;

      toast.success('Lead details updated');
      setEditing(false);
      await loadLead();
      onLeadUpdated?.();
    } catch (error) {
      console.error('Error saving edits:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-[#F6F2EE]">Loading lead...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6">
        <p className="text-[#A0A0A0] mb-6">Lead not found</p>
        <Button onClick={onBack} variant="outline" className="border-2 border-[#F6F2EE]">
          Go Back
        </Button>
      </div>
    );
  }

  const currentStageIndex = LEAD_STAGES.findIndex(s => s.id === lead.status);

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE]"
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
          </button>
          <div className="flex-1">
            <h3 className="text-[#F6F2EE]">{lead.venue_name}</h3>
            <p className="text-[#A0A0A0] text-sm capitalize">{lead.venue_type}</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-2 border-2 border-[#F6F2EE] hover:bg-[#8A4FFF] transition-colors"
            >
              <Edit2 className="w-5 h-5 text-[#F6F2EE]" />
            </button>
          )}
        </div>

        {/* Heat Score */}
        <div className="flex items-center gap-3">
          <span className="text-[#A0A0A0] text-sm uppercase tracking-wide">Heat Score</span>
          <div className="flex-1 h-3 bg-[#050505] border-2 border-[#F6F2EE] overflow-hidden">
            <div
              className="h-full bg-[#FF7A59] transition-all"
              style={{ width: `${lead.heat_score}%` }}
            />
          </div>
          <span className="text-[#F6F2EE] font-bold">{lead.heat_score}/100</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Status Pipeline */}
        <div>
          <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-4">Status</h4>
          <div className="space-y-2">
            {LEAD_STAGES.map((stage, index) => {
              const isActive = stage.id === lead.status;
              const isPast = index < currentStageIndex;
              const isFuture = index > currentStageIndex;

              return (
                <button
                  key={stage.id}
                  onClick={() => !saving && handleStatusChange(stage.id)}
                  disabled={saving}
                  className={`w-full p-4 border-3 text-left transition-all ${
                    isActive
                      ? 'bg-[#8A4FFF] border-[#F6F2EE] text-[#F6F2EE]'
                      : isPast
                      ? 'bg-[#151515] border-[#8A4FFF] text-[#8A4FFF]'
                      : 'bg-[#0A0A0A] border-[#F6F2EE] text-[#A0A0A0] hover:border-[#8A4FFF]'
                  } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wide">{stage.label}</span>
                    {isPast && <span className="text-sm">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location Info */}
        <div>
          <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-3">Location</h4>
          <div className="p-4 bg-[#151515] border-2 border-[#F6F2EE]">
            <div className="flex items-start gap-3 mb-2">
              <MapPin className="w-5 h-5 text-[#8A4FFF] mt-0.5" />
              <div className="flex-1">
                <p className="text-[#F6F2EE]">{lead.address}</p>
                <p className="text-[#A0A0A0] text-sm">{lead.city}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-3">Contact Details</h4>
          
          {editing ? (
            <div className="space-y-4 p-4 bg-[#151515] border-2 border-[#8A4FFF]">
              <div>
                <Label className="text-[#F6F2EE] text-xs mb-2 block">Contact Name</Label>
                <Input
                  value={editData.contact_name || ''}
                  onChange={(e) => setEditData({ ...editData, contact_name: e.target.value })}
                  className="bg-[#050505] border-2 border-[#F6F2EE] text-[#F6F2EE]"
                  placeholder="Owner / Manager name"
                />
              </div>
              <div>
                <Label className="text-[#F6F2EE] text-xs mb-2 block">Role</Label>
                <Input
                  value={editData.contact_role || ''}
                  onChange={(e) => setEditData({ ...editData, contact_role: e.target.value })}
                  className="bg-[#050505] border-2 border-[#F6F2EE] text-[#F6F2EE]"
                  placeholder="Owner, Manager, etc."
                />
              </div>
              <div>
                <Label className="text-[#F6F2EE] text-xs mb-2 block">Phone</Label>
                <Input
                  value={editData.contact_phone || ''}
                  onChange={(e) => setEditData({ ...editData, contact_phone: e.target.value })}
                  className="bg-[#050505] border-2 border-[#F6F2EE] text-[#F6F2EE]"
                  placeholder="+1-555-0123"
                />
              </div>
              <div>
                <Label className="text-[#F6F2EE] text-xs mb-2 block">Email</Label>
                <Input
                  value={editData.contact_email || ''}
                  onChange={(e) => setEditData({ ...editData, contact_email: e.target.value })}
                  className="bg-[#050505] border-2 border-[#F6F2EE] text-[#F6F2EE]"
                  placeholder="owner@venue.com"
                />
              </div>
              <div>
                <Label className="text-[#F6F2EE] text-xs mb-2 block">Relationship (0-5)</Label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={editData.relationship_strength || 0}
                  onChange={(e) => setEditData({ ...editData, relationship_strength: parseInt(e.target.value) || 0 })}
                  className="bg-[#050505] border-2 border-[#F6F2EE] text-[#F6F2EE]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveEdits}
                  disabled={saving}
                  className="flex-1 bg-[#8A4FFF] hover:bg-[#7A3FEF] text-[#F6F2EE] border-3 border-[#F6F2EE]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setEditing(false);
                    setEditData(lead);
                  }}
                  variant="outline"
                  className="border-2 border-[#F6F2EE] text-[#F6F2EE]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {lead.contact_name && (
                <div className="p-3 bg-[#151515] border-2 border-[#F6F2EE] flex items-center gap-3">
                  <User className="w-5 h-5 text-[#8A4FFF]" />
                  <div>
                    <p className="text-[#F6F2EE]">{lead.contact_name}</p>
                    {lead.contact_role && <p className="text-[#A0A0A0] text-sm">{lead.contact_role}</p>}
                  </div>
                </div>
              )}
              {lead.contact_phone && (
                <div className="p-3 bg-[#151515] border-2 border-[#F6F2EE] flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#8A4FFF]" />
                  <a href={`tel:${lead.contact_phone}`} className="text-[#F6F2EE] hover:text-[#8A4FFF]">
                    {lead.contact_phone}
                  </a>
                </div>
              )}
              {lead.contact_email && (
                <div className="p-3 bg-[#151515] border-2 border-[#F6F2EE] flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#8A4FFF]" />
                  <a href={`mailto:${lead.contact_email}`} className="text-[#F6F2EE] hover:text-[#8A4FFF]">
                    {lead.contact_email}
                  </a>
                </div>
              )}
              {!lead.contact_name && !lead.contact_phone && !lead.contact_email && (
                <p className="text-[#A0A0A0] text-center py-4">No contact details yet</p>
              )}
            </div>
          )}
        </div>

        {/* Relationship */}
        <div>
          <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-3">Relationship Strength</h4>
          <div className="p-4 bg-[#151515] border-2 border-[#F6F2EE]">
            <div className="text-2xl text-[#F6F2EE]">
              {'★'.repeat(lead.relationship_strength)}{'☆'.repeat(5 - lead.relationship_strength)}
            </div>
            <p className="text-[#A0A0A0] text-sm mt-2">
              {lead.relationship_strength === 0 && 'No relationship yet'}
              {lead.relationship_strength === 1 && 'Cold contact'}
              {lead.relationship_strength === 2 && 'Initial conversation'}
              {lead.relationship_strength === 3 && 'Building rapport'}
              {lead.relationship_strength === 4 && 'Strong connection'}
              {lead.relationship_strength === 5 && 'Close relationship'}
            </p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-3">Notes</h4>
          {editing ? (
            <Textarea
              value={editData.notes || ''}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              className="bg-[#151515] border-3 border-[#8A4FFF] text-[#F6F2EE] min-h-32"
              placeholder="Add notes about this lead..."
            />
          ) : (
            <div className="p-4 bg-[#151515] border-2 border-[#F6F2EE] min-h-24">
              <p className="text-[#F6F2EE] whitespace-pre-wrap">{lead.notes || 'No notes yet'}</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div>
          <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-3">Details</h4>
          <div className="p-4 bg-[#151515] border-2 border-[#F6F2EE] space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#A0A0A0]">Lead Source</span>
              <span className="text-[#F6F2EE] capitalize">{lead.lead_source.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A0A0]">Added</span>
              <span className="text-[#F6F2EE]">{new Date(lead.created_at).toLocaleDateString()}</span>
            </div>
            {lead.first_membership_date && (
              <div className="flex justify-between">
                <span className="text-[#A0A0A0]">Went Live</span>
                <span className="text-[#F6F2EE]">{new Date(lead.first_membership_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
