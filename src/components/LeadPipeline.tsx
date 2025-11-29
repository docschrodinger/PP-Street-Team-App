import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Filter, Plus, MapPin, Phone, Mail, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import type { StreetUser } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';

interface LeadPipelineProps {
  user: StreetUser;
  onBack: () => void;
  onAddLead: () => void;
  onViewLead: (leadId: string) => void;
}

const STAGES = [
  { id: 'new', label: 'New', color: '#A0A0A0', emoji: '📋' },
  { id: 'contacted', label: 'Contacted', color: '#8A4FFF', emoji: '📞' },
  { id: 'follow_up', label: 'Follow Up', color: '#8A4FFF', emoji: '🔄' },
  { id: 'demo_scheduled', label: 'Demo', color: '#FF7A59', emoji: '📅' },
  { id: 'verbal_yes', label: 'Verbal Yes', color: '#FF7A59', emoji: '💬' },
  { id: 'signed_pending', label: 'Signed', color: '#FFD700', emoji: '✍️' },
  { id: 'live', label: 'Live', color: '#00FF00', emoji: '🎉' },
];

export function LeadPipeline({ user, onBack, onAddLead, onViewLead }: LeadPipelineProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedStage, setSelectedStage] = useState('new');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLeads();
  }, [user.id]);

  async function loadLeads() {
    const supabase = createClient();
    const { data } = await supabase
      .from('street_venue_leads')
      .select('*')
      .eq('created_by_user_id', user.id)
      .order('created_at', { ascending: false });

    setLeads(data || []);
    setLoading(false);
  }

  const filteredLeads = leads.filter(lead => {
    const matchesStage = lead.status === selectedStage;
    const matchesSearch = searchTerm === '' || 
      lead.venue_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const stageData = STAGES.find(s => s.id === selectedStage);

  // Calculate stage stats
  const stageStats = STAGES.map(stage => ({
    ...stage,
    count: leads.filter(l => l.status === stage.id).length,
  }));

  const totalLeads = leads.length;
  const liveLeads = leads.filter(l => l.status === 'live').length;
  const conversionRate = totalLeads > 0 ? ((liveLeads / totalLeads) * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#8A4FFF]" />

      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
          </button>
          <h3 className="text-[#F6F2EE] flex-1">Lead Pipeline</h3>
          <button 
            onClick={onAddLead}
            className="p-2 border-2 border-[#8A4FFF] bg-[#8A4FFF] hover:bg-[#7A3FEF] transition-colors active:scale-95"
          >
            <Plus className="w-5 h-5 text-[#F6F2EE]" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-3 bg-[#050505] border-2 border-[#8A4FFF] text-center">
            <p className="text-2xl font-bold text-[#8A4FFF]">{totalLeads}</p>
            <p className="text-[#A0A0A0] text-xs uppercase">Total</p>
          </div>
          <div className="p-3 bg-[#050505] border-2 border-[#00FF00] text-center">
            <p className="text-2xl font-bold text-[#00FF00]">{liveLeads}</p>
            <p className="text-[#A0A0A0] text-xs uppercase">Live</p>
          </div>
          <div className="p-3 bg-[#050505] border-2 border-[#FF7A59] text-center">
            <p className="text-2xl font-bold text-[#FF7A59]">{conversionRate}%</p>
            <p className="text-[#A0A0A0] text-xs uppercase">Rate</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search venues..."
            className="w-full h-12 bg-[#050505] border-3 border-[#F6F2EE] text-[#F6F2EE] px-4 focus:border-[#8A4FFF] transition-colors placeholder:text-[#A0A0A0]"
          />
        </div>

        {/* Stage selector - Horizontal scroll */}
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="flex gap-2 min-w-max pb-2">
            {stageStats.map(stage => {
              const isActive = selectedStage === stage.id;
              return (
                <motion.button
                  key={stage.id}
                  onClick={() => setSelectedStage(stage.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-4 py-3 border-3 uppercase text-xs tracking-wider whitespace-nowrap transition-all relative overflow-hidden ${
                    isActive
                      ? 'bg-[#8A4FFF] border-[#F6F2EE] text-[#F6F2EE]'
                      : 'bg-[#151515] border-[#F6F2EE] text-[#A0A0A0] hover:border-[#8A4FFF]'
                  }`}
                  style={isActive ? { boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.8)' } : {}}
                >
                  <div className="flex items-center gap-2">
                    <span>{stage.emoji}</span>
                    <span className="font-bold">{stage.label}</span>
                    <span className={`ml-1 ${isActive ? 'text-[#F6F2EE]' : 'text-[#8A4FFF]'}`}>
                      ({stage.count})
                    </span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeStage"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF7A59]"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block p-6 bg-[#151515] border-3 border-[#8A4FFF] mb-4"
            >
              <TrendingUp className="w-12 h-12 text-[#8A4FFF]" />
            </motion.div>
            <p className="text-[#A0A0A0] uppercase tracking-widest text-sm">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="inline-block p-8 bg-[#151515] border-4 border-[#F6F2EE] mb-4">
              <span className="text-6xl">{stageData?.emoji}</span>
            </div>
            <h3 className="text-[#F6F2EE] mb-2">No leads in {stageData?.label}</h3>
            <p className="text-[#A0A0A0] mb-6 text-sm">
              {searchTerm ? 'Try different search terms' : 'Start adding venues to build your pipeline'}
            </p>
            <Button
              onClick={onAddLead}
              className="bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE] uppercase tracking-wider"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Lead
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3 pb-6">
            <AnimatePresence mode="popLayout">
              {filteredLeads.map((lead, index) => {
                const daysOld = Math.floor(
                  (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
                );
                
                return (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onViewLead(lead.id)}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    className="p-5 bg-[#151515] border-3 border-[#F6F2EE] hover:border-[#8A4FFF] cursor-pointer transition-all relative overflow-hidden group"
                    style={{ boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.6)' }}
                  >
                    {/* Hover gradient effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#8A4FFF]/5 to-[#FF7A59]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-[#F6F2EE] font-bold mb-1 flex items-center gap-2">
                            {lead.venue_name}
                            {lead.venue_type && (
                              <span className="text-xs text-[#A0A0A0] font-normal uppercase">
                                • {lead.venue_type}
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-[#A0A0A0] mb-2">
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs">{lead.address}</span>
                          </div>
                        </div>
                        <div 
                          className="px-3 py-1 border-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                          style={{ 
                            borderColor: stageData?.color || '#A0A0A0',
                            color: stageData?.color || '#A0A0A0'
                          }}
                        >
                          {stageData?.emoji} {stageData?.label}
                        </div>
                      </div>

                      {/* Contact info */}
                      {(lead.contact_name || lead.contact_phone || lead.contact_email) && (
                        <div className="flex flex-wrap gap-3 text-xs text-[#A0A0A0] mb-3">
                          {lead.contact_name && (
                            <span className="flex items-center gap-1">
                              👤 {lead.contact_name}
                              {lead.contact_role && <span className="opacity-75">({lead.contact_role})</span>}
                            </span>
                          )}
                          {lead.contact_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {lead.contact_phone}
                            </span>
                          )}
                          {lead.contact_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {lead.contact_email}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer meta */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#F6F2EE]/20">
                        <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
                          <Clock className="w-3 h-3" />
                          <span>
                            {daysOld === 0 ? 'Today' : 
                             daysOld === 1 ? 'Yesterday' : 
                             `${daysOld} days ago`}
                          </span>
                        </div>
                        {lead.estimated_revenue && (
                          <div className="flex items-center gap-1 text-xs text-[#8A4FFF] font-bold">
                            <DollarSign className="w-3 h-3" />
                            <span>${lead.estimated_revenue}/mo</span>
                          </div>
                        )}
                      </div>

                      {/* Notes preview */}
                      {lead.notes && (
                        <div className="mt-2 pt-2 border-t border-[#F6F2EE]/20">
                          <p className="text-xs text-[#A0A0A0] italic line-clamp-1">
                            "{lead.notes}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Arrow indicator */}
                    <motion.div
                      className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <span className="text-[#8A4FFF] text-xl">→</span>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Add Button - Mobile friendly */}
      <motion.button
        onClick={onAddLead}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-6 w-16 h-16 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-4 border-[#F6F2EE] flex items-center justify-center z-50 shadow-lg"
        style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)' }}
      >
        <Plus className="w-8 h-8 text-[#F6F2EE]" />
      </motion.button>
    </div>
  );
}
