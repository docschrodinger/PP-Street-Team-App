import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { supabase } from '../../utils/supabase/client';
import { Send, AlertCircle, Users, Award, User } from 'lucide-react';
import { motion } from 'motion/react';
import type { ComposeMessageData } from '../../lib/messageTypes';

interface ComposeHQMessageProps {
  adminId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ComposeHQMessage({ adminId, onSuccess, onCancel }: ComposeHQMessageProps) {
  const [formData, setFormData] = useState<ComposeMessageData>({
    title: '',
    body: '',
    priority: 'normal',
    target_type: 'all'
  });

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);

    try {
      // Insert message
      const { data: message, error: insertError } = await supabase
        .from('street_team_messages')
        .insert({
          title: formData.title,
          body: formData.body,
          priority: formData.priority,
          target_type: formData.target_type,
          target_tier: formData.target_tier,
          target_user_id: formData.target_user_id,
          sent_by_admin_id: adminId,
          sent_at: formData.scheduled_for || new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Send push notifications
      await sendPushNotifications(message);

      setSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setFormData({
          title: '',
          body: '',
          priority: 'normal',
          target_type: 'all'
        });
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  async function sendPushNotifications(message: any) {
    // Get target users based on target_type
    let query = supabase
      .from('street_users')
      .select('id, push_token, first_name');

    if (message.target_type === 'tier') {
      query = query.eq('tier', message.target_tier);
    } else if (message.target_type === 'individual') {
      query = query.eq('id', message.target_user_id);
    }
    // If 'all', no filter needed

    const { data: users } = await query;

    if (!users || users.length === 0) return;

    // Send push notifications via your push service
    // This is a placeholder - implement with your actual push notification service
    const notifications = users.map(user => ({
      to: user.push_token,
      title: message.priority === 'urgent' ? '🚨 Urgent from HQ' : '📬 Message from HQ',
      body: message.title,
      data: {
        type: 'hq_message',
        message_id: message.id
      }
    }));

    // In production, send these to Expo Push Notification service or similar
    console.log('Would send push notifications:', notifications.length);
  }

  if (success) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-8 bg-[#00FF00] border-4 border-[#F6F2EE] text-center"
      >
        <div className="inline-block p-6 bg-[#050505] border-4 border-[#F6F2EE] mb-4">
          <Send className="w-12 h-12 text-[#00FF00]" />
        </div>
        <h3 className="text-[#050505] mb-2">Message Sent!</h3>
        <p className="text-[#050505] opacity-75">
          Your message has been delivered to the street team
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="border-4 border-[#F6F2EE] bg-[#151515]">
        {/* Header */}
        <div className="border-b-4 border-[#F6F2EE] bg-[#8A4FFF] px-6 py-4">
          <h3 className="text-[#F6F2EE]">Send Message to Street Team</h3>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <Label className="text-[#F6F2EE] mb-2">
              Message Title <span className="text-[#FF7A59]">*</span>
            </Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="h-12 bg-[#050505] border-3 border-[#F6F2EE] text-[#F6F2EE]"
              placeholder="e.g., 🎉 Welcome to the team!"
              required
              maxLength={100}
            />
            <p className="text-[#666] text-xs mt-1">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Body */}
          <div>
            <Label className="text-[#F6F2EE] mb-2">
              Message Body <span className="text-[#FF7A59]">*</span>
            </Label>
            <Textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="min-h-[200px] bg-[#050505] border-3 border-[#F6F2EE] text-[#F6F2EE] resize-none"
              placeholder="Write your message here..."
              required
            />
            <p className="text-[#666] text-xs mt-1">
              {formData.body.length} characters
            </p>
          </div>

          {/* Priority */}
          <div>
            <Label className="text-[#F6F2EE] mb-2">Priority</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'normal' })}
                className={`p-4 border-3 transition-all ${
                  formData.priority === 'normal'
                    ? 'bg-[#8A4FFF] border-[#F6F2EE]'
                    : 'bg-[#050505] border-[#F6F2EE] hover:border-[#8A4FFF]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 border-2 flex items-center justify-center ${
                    formData.priority === 'normal' ? 'bg-[#F6F2EE]' : 'bg-[#050505] border-[#F6F2EE]'
                  }`}>
                    <Send className={`w-5 h-5 ${
                      formData.priority === 'normal' ? 'text-[#8A4FFF]' : 'text-[#F6F2EE]'
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className="text-[#F6F2EE] font-bold text-sm">Normal</p>
                    <p className="text-[#A0A0A0] text-xs">Standard message</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'urgent' })}
                className={`p-4 border-3 transition-all ${
                  formData.priority === 'urgent'
                    ? 'bg-[#FF4444] border-[#F6F2EE]'
                    : 'bg-[#050505] border-[#F6F2EE] hover:border-[#FF4444]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 border-2 flex items-center justify-center ${
                    formData.priority === 'urgent' ? 'bg-[#F6F2EE]' : 'bg-[#050505] border-[#F6F2EE]'
                  }`}>
                    <AlertCircle className={`w-5 h-5 ${
                      formData.priority === 'urgent' ? 'text-[#FF4444]' : 'text-[#F6F2EE]'
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className="text-[#F6F2EE] font-bold text-sm">Urgent</p>
                    <p className="text-[#A0A0A0] text-xs">Important alert</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <Label className="text-[#F6F2EE] mb-2">Send To</Label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, target_type: 'all', target_tier: undefined, target_user_id: undefined })}
                className={`w-full p-4 border-3 transition-all ${
                  formData.target_type === 'all'
                    ? 'bg-[#8A4FFF] border-[#F6F2EE]'
                    : 'bg-[#050505] border-[#F6F2EE] hover:border-[#8A4FFF]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 border-2 flex items-center justify-center ${
                    formData.target_type === 'all' ? 'bg-[#F6F2EE]' : 'bg-[#050505] border-[#F6F2EE]'
                  }`}>
                    <Users className={`w-5 h-5 ${
                      formData.target_type === 'all' ? 'text-[#8A4FFF]' : 'text-[#F6F2EE]'
                    }`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[#F6F2EE] font-bold text-sm">All Ambassadors</p>
                    <p className="text-[#A0A0A0] text-xs">Send to everyone</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, target_type: 'tier', target_user_id: undefined })}
                className={`w-full p-4 border-3 transition-all ${
                  formData.target_type === 'tier'
                    ? 'bg-[#8A4FFF] border-[#F6F2EE]'
                    : 'bg-[#050505] border-[#F6F2EE] hover:border-[#8A4FFF]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 border-2 flex items-center justify-center ${
                    formData.target_type === 'tier' ? 'bg-[#F6F2EE]' : 'bg-[#050505] border-[#F6F2EE]'
                  }`}>
                    <Award className={`w-5 h-5 ${
                      formData.target_type === 'tier' ? 'text-[#8A4FFF]' : 'text-[#F6F2EE]'
                    }`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[#F6F2EE] font-bold text-sm">Specific Tier</p>
                    <p className="text-[#A0A0A0] text-xs">Send to Bronze, Silver, Gold, etc.</p>
                  </div>
                </div>
              </button>

              {formData.target_type === 'tier' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="pl-4"
                >
                  <select
                    value={formData.target_tier || ''}
                    onChange={(e) => setFormData({ ...formData, target_tier: e.target.value as any })}
                    className="w-full h-12 bg-[#050505] border-3 border-[#F6F2EE] text-[#F6F2EE] px-3"
                    required
                  >
                    <option value="">Select a tier...</option>
                    <option value="bronze">Bronze (0-15 venues)</option>
                    <option value="silver">Silver (16-30 venues)</option>
                    <option value="gold">Gold (31-75 venues)</option>
                    <option value="platinum">Platinum (76-150 venues)</option>
                    <option value="diamond">Diamond (150+ venues)</option>
                  </select>
                </motion.div>
              )}

              <button
                type="button"
                onClick={() => setFormData({ ...formData, target_type: 'individual', target_tier: undefined })}
                className={`w-full p-4 border-3 transition-all ${
                  formData.target_type === 'individual'
                    ? 'bg-[#8A4FFF] border-[#F6F2EE]'
                    : 'bg-[#050505] border-[#F6F2EE] hover:border-[#8A4FFF]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 border-2 flex items-center justify-center ${
                    formData.target_type === 'individual' ? 'bg-[#F6F2EE]' : 'bg-[#050505] border-[#F6F2EE]'
                  }`}>
                    <User className={`w-5 h-5 ${
                      formData.target_type === 'individual' ? 'text-[#8A4FFF]' : 'text-[#F6F2EE]'
                    }`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[#F6F2EE] font-bold text-sm">Individual Ambassador</p>
                    <p className="text-[#A0A0A0] text-xs">Send to one person</p>
                  </div>
                </div>
              </button>

              {formData.target_type === 'individual' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="pl-4"
                >
                  <Input
                    value={formData.target_user_id || ''}
                    onChange={(e) => setFormData({ ...formData, target_user_id: e.target.value })}
                    className="h-12 bg-[#050505] border-3 border-[#F6F2EE] text-[#F6F2EE]"
                    placeholder="Enter user ID..."
                    required
                  />
                  <p className="text-[#666] text-xs mt-1">
                    Get user ID from the street users list
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-[#FF4444] border-2 border-[#F6F2EE]">
              <p className="text-[#F6F2EE] text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                className="flex-1 h-12 bg-transparent border-3 border-[#F6F2EE] text-[#F6F2EE] hover:bg-[#151515]"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={sending}
              className="flex-1 h-12 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE] uppercase tracking-wider font-bold disabled:opacity-50"
            >
              {sending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
