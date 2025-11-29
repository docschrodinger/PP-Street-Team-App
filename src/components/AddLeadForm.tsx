import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, MapPin, User, Phone, Mail, Zap, Save, Flame } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { awardXP } from '../lib/xpService';
import { updateMissionProgress } from '../lib/missionService';
import type { StreetUser } from '../lib/types';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface AddLeadFormProps {
  user: StreetUser;
  runId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

const VENUE_TYPES = [
  { value: 'restaurant', label: '🍽️ Restaurant', emoji: '🍽️' },
  { value: 'bar', label: '🍺 Bar', emoji: '🍺' },
  { value: 'café', label: '☕ Café', emoji: '☕' },
  { value: 'bakery', label: '🥐 Bakery', emoji: '🥐' },
  { value: 'brewery', label: '🍻 Brewery', emoji: '🍻' },
  { value: 'nightclub', label: '🎵 Nightclub', emoji: '🎵' },
  { value: 'lounge', label: '🍸 Lounge', emoji: '🍸' },
  { value: 'other', label: '📍 Other', emoji: '📍' },
];

const LEAD_SOURCES = [
  { id: 'cold_walk_in', label: 'Cold Walk-In', icon: '🚶' },
  { id: 'friend_intro', label: 'Friend Intro', icon: '👋' },
  { id: 'referral', label: 'Referral', icon: '🤝' },
  { id: 'event', label: 'Event', icon: '🎉' },
  { id: 'social_media', label: 'Social Media', icon: '📱' },
];

export function AddLeadForm({ user, runId, onBack, onSuccess }: AddLeadFormProps) {
  const [formData, setFormData] = useState({
    venue_name: '',
    address: '',
    venue_type: '',
    contact_name: '',
    contact_role: '',
    contact_phone: '',
    contact_email: '',
    relationship_strength: 3,
    lead_source: 'cold_walk_in',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate heat score based on completeness and relationship
      const heat_score = Math.min(
        100,
        30 + // Base score
        (formData.contact_name ? 15 : 0) +
        (formData.contact_phone ? 15 : 0) +
        (formData.contact_email ? 15 : 0) +
        (formData.relationship_strength * 5)
      );

      const { error: insertError } = await supabase
        .from('street_venue_leads')
        .insert({
          ...formData,
          created_by_user_id: user.id,
          city: user.city,
          heat_score,
          status: 'new',
        });

      if (insertError) throw insertError;

      // Award XP for adding lead
      const xpAmount = 25;
      const result = await awardXP({
        userId: user.id,
        amount: xpAmount,
        source: 'lead_added',
        pointsAmount: 2,
      });

      // Update mission progress
      await updateMissionProgress(user.id, 'lead_added');

      toast.success(`Lead added successfully!`, {
        description: `+${xpAmount} XP earned! 🎯`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error adding lead:', error);
      toast.error('Failed to add lead', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = formData.venue_name && formData.address && formData.venue_type;
  const heatScore = Math.min(
    100,
    30 +
    (formData.contact_name ? 15 : 0) +
    (formData.contact_phone ? 15 : 0) +
    (formData.contact_email ? 15 : 0) +
    (formData.relationship_strength * 5)
  );

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
          <h3 className="text-[#F6F2EE] flex-1">Add New Lead</h3>
          {runId && (
            <div className="px-3 py-1 bg-[#FF7A59] border-2 border-[#F6F2EE]">
              <span className="text-[#F6F2EE] text-xs font-bold uppercase">On Run</span>
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-2 border-2 ${
            currentStep >= 1 ? 'bg-[#8A4FFF] border-[#8A4FFF]' : 'bg-transparent border-[#F6F2EE]'
          }`} />
          <div className={`flex-1 h-2 border-2 ${
            currentStep >= 2 ? 'bg-[#8A4FFF] border-[#8A4FFF]' : 'bg-transparent border-[#F6F2EE]'
          }`} />
          <div className={`flex-1 h-2 border-2 ${
            currentStep >= 3 ? 'bg-[#8A4FFF] border-[#8A4FFF]' : 'bg-transparent border-[#F6F2EE]'
          }`} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs uppercase tracking-wider ${currentStep >= 1 ? 'text-[#8A4FFF]' : 'text-[#A0A0A0]'}`}>
            Venue
          </span>
          <span className={`text-xs uppercase tracking-wider ${currentStep >= 2 ? 'text-[#8A4FFF]' : 'text-[#A0A0A0]'}`}>
            Contact
          </span>
          <span className={`text-xs uppercase tracking-wider ${currentStep >= 3 ? 'text-[#8A4FFF]' : 'text-[#A0A0A0]'}`}>
            Details
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-24">
        
        {/* STEP 1: Venue Info */}
        {currentStep === 1 && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-4"
          >
            <div className="p-4 bg-[#8A4FFF] border-3 border-[#F6F2EE] mb-6">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-[#F6F2EE]" />
                <h4 className="text-[#F6F2EE] uppercase tracking-wide font-bold">Venue Information</h4>
              </div>
              <p className="text-[#F6F2EE] text-sm opacity-90">
                Start with the basics - where is this venue?
              </p>
            </div>

            <div>
              <Label className="text-[#F6F2EE] mb-2 flex items-center gap-2">
                Venue Name <span className="text-[#FF7A59]">*</span>
              </Label>
              <Input
                type="text"
                value={formData.venue_name}
                onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                required
                className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE] focus:border-[#8A4FFF]"
                placeholder="The Night Owl"
              />
            </div>

            <div>
              <Label className="text-[#F6F2EE] mb-2 flex items-center gap-2">
                Address <span className="text-[#FF7A59]">*</span>
              </Label>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE] focus:border-[#8A4FFF]"
                placeholder="123 Main St, Downtown"
              />
            </div>

            <div>
              <Label className="text-[#F6F2EE] mb-2 flex items-center gap-2">
                Venue Type <span className="text-[#FF7A59]">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {VENUE_TYPES.map(type => (
                  <motion.button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, venue_type: type.value })}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 border-3 transition-all ${
                      formData.venue_type === type.value
                        ? 'bg-[#8A4FFF] border-[#F6F2EE] text-[#F6F2EE]'
                        : 'bg-[#151515] border-[#F6F2EE] text-[#A0A0A0] hover:border-[#8A4FFF]'
                    }`}
                  >
                    <span className="text-lg mr-2">{type.emoji}</span>
                    <span className="text-sm uppercase tracking-wider font-bold">
                      {type.label.split(' ')[1] || type.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!isStep1Valid}
              className="w-full h-14 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE] uppercase tracking-wider font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Contact Info →
            </Button>
          </motion.div>
        )}

        {/* STEP 2: Contact Info */}
        {currentStep === 2 && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-4"
          >
            <div className="p-4 bg-[#8A4FFF] border-3 border-[#F6F2EE] mb-6">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-[#F6F2EE]" />
                <h4 className="text-[#F6F2EE] uppercase tracking-wide font-bold">Contact Information</h4>
              </div>
              <p className="text-[#F6F2EE] text-sm opacity-90">
                Who did you talk to? (Optional but recommended)
              </p>
            </div>

            <div>
              <Label className="text-[#F6F2EE] mb-2">Contact Name</Label>
              <Input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE] focus:border-[#8A4FFF]"
                placeholder="Alex Johnson"
              />
            </div>

            <div>
              <Label className="text-[#F6F2EE] mb-2">Role / Title</Label>
              <Input
                type="text"
                value={formData.contact_role}
                onChange={(e) => setFormData({ ...formData, contact_role: e.target.value })}
                className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE] focus:border-[#8A4FFF]"
                placeholder="Owner, Manager, etc."
              />
            </div>

            <div>
              <Label className="text-[#F6F2EE] mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE] focus:border-[#8A4FFF]"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <Label className="text-[#F6F2EE] mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="h-12 bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE] focus:border-[#8A4FFF]"
                placeholder="alex@venue.com"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setCurrentStep(1)}
                variant="outline"
                className="flex-1 h-12 border-3 border-[#F6F2EE] text-[#F6F2EE] hover:bg-[#151515]"
              >
                ← Back
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1 h-12 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE] uppercase tracking-wider font-bold"
              >
                Continue →
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Additional Details */}
        {currentStep === 3 && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-4"
          >
            <div className="p-4 bg-[#8A4FFF] border-3 border-[#F6F2EE] mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-[#F6F2EE]" />
                <h4 className="text-[#F6F2EE] uppercase tracking-wide font-bold">Additional Details</h4>
              </div>
              <p className="text-[#F6F2EE] text-sm opacity-90">
                Help us understand the context
              </p>
            </div>

            {/* Relationship Strength */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[#F6F2EE] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#FF7A59]" />
                  Relationship Strength
                </Label>
                <span className="text-[#8A4FFF] font-bold">{formData.relationship_strength}/5</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, relationship_strength: level })}
                    className={`flex-1 h-12 border-3 transition-all ${
                      formData.relationship_strength >= level
                        ? 'bg-[#FF7A59] border-[#F6F2EE]'
                        : 'bg-[#151515] border-[#F6F2EE] hover:border-[#FF7A59]'
                    }`}
                  >
                    <span className="text-2xl">
                      {formData.relationship_strength >= level ? '🔥' : '⚪'}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[#A0A0A0] text-xs mt-2">
                {formData.relationship_strength === 1 ? 'Just met' :
                 formData.relationship_strength === 2 ? 'Friendly chat' :
                 formData.relationship_strength === 3 ? 'Good conversation' :
                 formData.relationship_strength === 4 ? 'Strong interest' :
                 'Very interested / Ready to sign'}
              </p>
            </div>

            {/* Lead Source */}
            <div>
              <Label className="text-[#F6F2EE] mb-2">How did you connect?</Label>
              <div className="grid grid-cols-2 gap-2">
                {LEAD_SOURCES.map(source => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, lead_source: source.id })}
                    className={`p-3 border-3 transition-all ${
                      formData.lead_source === source.id
                        ? 'bg-[#8A4FFF] border-[#F6F2EE] text-[#F6F2EE]'
                        : 'bg-[#151515] border-[#F6F2EE] text-[#A0A0A0] hover:border-[#8A4FFF]'
                    }`}
                  >
                    <span className="text-lg mr-2">{source.icon}</span>
                    <span className="text-xs uppercase tracking-wider font-bold">
                      {source.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-[#F6F2EE] mb-2">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="bg-[#151515] border-3 border-[#F6F2EE] text-[#F6F2EE] resize-none focus:border-[#8A4FFF]"
                placeholder="Conversation highlights, follow-up items, next steps..."
              />
            </div>

            {/* Heat Score Preview */}
            <div className="p-4 bg-[#151515] border-3 border-[#F6F2EE]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#F6F2EE] text-sm uppercase tracking-wide">Lead Heat Score</span>
                <span className="text-[#FF7A59] font-bold text-lg">{heatScore}/100</span>
              </div>
              <div className="h-2 bg-[#050505] border-2 border-[#F6F2EE] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${heatScore}%` }}
                  className="h-full bg-gradient-to-r from-[#8A4FFF] to-[#FF7A59]"
                />
              </div>
              <p className="text-[#A0A0A0] text-xs mt-2">
                Based on contact info completeness & relationship strength
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                variant="outline"
                className="flex-1 h-14 border-3 border-[#F6F2EE] text-[#F6F2EE] hover:bg-[#151515]"
              >
                ← Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-14 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE] uppercase tracking-wider font-bold disabled:opacity-50 relative overflow-hidden group"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Lead (+25 XP)
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
