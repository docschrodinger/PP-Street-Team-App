import { useState } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import {
  ArrowLeft,
  Bell,
  Mail,
  Lock,
  Trash2,
  ExternalLink,
  Shield,
  Settings as SettingsIcon,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import type { StreetUser } from '../lib/types';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { Browser } from '@capacitor/browser';

interface SettingsScreenProps {
  user: StreetUser;
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export function SettingsScreen({ user, onBack, onNavigate }: SettingsScreenProps) {
  const [emailNotifs, setEmailNotifs] = useState(user.preferences?.email_notifications ?? true);
  const [pushNotifs, setPushNotifs] = useState(user.preferences?.push_notifications ?? true);
  const [saving, setSaving] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');

  async function openPrivacyPolicy() {
    try {
      await Browser.open({ url: 'https://patronpass.com/privacy' });
    } catch {
      window.open('https://patronpass.com/privacy', '_blank');
    }
  }

  async function openTermsOfService() {
    try {
      await Browser.open({ url: 'https://patronpass.com/terms' });
    } catch {
      window.open('https://patronpass.com/terms', '_blank');
    }
  }

  async function openHelpSupport() {
    try {
      await Browser.open({ url: 'https://patronpass.com/support' });
    } catch {
      window.open('https://patronpass.com/support', '_blank');
    }
  }

  async function openContactUs() {
    const email = 'support@patronpass.com';
    window.location.href = `mailto:${email}`;
  }

  async function handleSavePreferences() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('street_users')
        .update({
          preferences: {
            email_notifications: emailNotifs,
            push_notifications: pushNotifs,
          },
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Locked in!', {
        description: 'Your preferences have been saved',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;

      toast.success('Reset email sent', {
        description: 'Check your inbox for the password reset link',
      });
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast.error('Failed to send reset email');
    }
  }

  async function handleRequestDeletion() {
    try {
      const { error } = await supabase
        .from('street_account_deletion_requests')
        .insert({
          user_id: user.id,
          reason: deletionReason || null,
          status: 'pending',
        });

      if (error) {
        console.error('Deletion request error:', error);
        toast.info('Account deletion requested', {
          description: 'Contact support to complete deletion',
        });
        return;
      }

      toast.success('Deletion request submitted', {
        description: 'Your account will be reviewed within 48 hours',
      });
    } catch (error) {
      console.error('Error requesting deletion:', error);
      toast.error('Failed to submit deletion request');
    }
  }

  const hasChanges =
    emailNotifs !== (user.preferences?.email_notifications ?? true) ||
    pushNotifs !== (user.preferences?.push_notifications ?? true);

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#8A4FFF]" />

      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
          </button>
          <h3 className="text-[#F6F2EE] flex-1 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-[#8A4FFF]" />
            Settings
          </h3>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-24">
        
        {/* Notifications Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-[#8A4FFF]" />
            <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm">Notifications</h4>
          </div>

          <div className="p-5 bg-[#151515] border-3 border-[#F6F2EE]">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#F6F2EE]/20">
              <div className="flex-1">
                <p className="text-[#F6F2EE] font-bold mb-1">Email Notifications</p>
                <p className="text-[#A0A0A0] text-sm">
                  Get notified about rank ups, missions, and earnings via email
                </p>
              </div>
              <Switch
                checked={emailNotifs}
                onCheckedChange={setEmailNotifs}
                className="ml-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[#F6F2EE] font-bold mb-1">Push Notifications</p>
                <p className="text-[#A0A0A0] text-sm">
                  Receive real-time updates on your device
                </p>
              </div>
              <Switch
                checked={pushNotifs}
                onCheckedChange={setPushNotifs}
                className="ml-4"
              />
            </div>
          </div>

          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onClick={handleSavePreferences}
                disabled={saving}
                className="w-full h-12 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE] uppercase tracking-wider font-bold"
              >
                {saving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Account Security */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-[#8A4FFF]" />
            <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm">Security</h4>
          </div>

          <div className="p-5 bg-[#151515] border-3 border-[#F6F2EE]">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-[#8A4FFF]" />
                  <p className="text-[#F6F2EE] font-bold">Password</p>
                </div>
                <p className="text-[#A0A0A0] text-sm mb-3">
                  Change your password via email reset link
                </p>
                <Button
                  onClick={handleChangePassword}
                  variant="outline"
                  className="border-2 border-[#F6F2EE] text-[#F6F2EE] hover:bg-[#151515] uppercase text-xs tracking-wider"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reset Email
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Legal & Support */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-5 h-5 text-[#8A4FFF]" />
            <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm">Legal & Support</h4>
          </div>

          <div className="space-y-2">
            <button
              onClick={openPrivacyPolicy}
              className="w-full p-4 bg-[#151515] border-2 border-[#F6F2EE] hover:border-[#8A4FFF] transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#F6F2EE]">Privacy Policy</span>
                <ExternalLink className="w-4 h-4 text-[#A0A0A0]" />
              </div>
            </button>

            <button
              onClick={openTermsOfService}
              className="w-full p-4 bg-[#151515] border-2 border-[#F6F2EE] hover:border-[#8A4FFF] transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#F6F2EE]">Terms of Service</span>
                <ExternalLink className="w-4 h-4 text-[#A0A0A0]" />
              </div>
            </button>

            <button
              onClick={openHelpSupport}
              className="w-full p-4 bg-[#151515] border-2 border-[#F6F2EE] hover:border-[#8A4FFF] transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#F6F2EE]">Help & Support</span>
                <ExternalLink className="w-4 h-4 text-[#A0A0A0]" />
              </div>
            </button>

            <button
              onClick={openContactUs}
              className="w-full p-4 bg-[#151515] border-2 border-[#F6F2EE] hover:border-[#8A4FFF] transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#F6F2EE]">Contact Us</span>
                <Mail className="w-4 h-4 text-[#A0A0A0]" />
              </div>
            </button>
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-[#0A0A0A] border-2 border-[#F6F2EE]"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#A0A0A0]">App Version</span>
            <span className="text-[#F6F2EE] font-bold">1.0.0</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-[#A0A0A0]">User ID</span>
            <span className="text-[#8A4FFF] font-mono text-xs">{user.id.slice(0, 8)}...</span>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-5 h-5 text-[#FF4444]" />
            <h4 className="text-[#FF4444] uppercase tracking-wider text-sm">Danger Zone</h4>
          </div>

          <div className="p-5 bg-[#151515] border-3 border-[#FF4444]">
            <p className="text-[#F6F2EE] font-bold mb-2">Delete Account</p>
            <p className="text-[#A0A0A0] text-sm mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-2 border-[#FF4444] text-[#FF4444] hover:bg-[#FF4444] hover:text-[#F6F2EE] uppercase text-xs tracking-wider"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Request Account Deletion
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#151515] border-4 border-[#FF4444]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-[#F6F2EE]">
                    Delete Your Account?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-[#A0A0A0]">
                    This will permanently delete your account, all your leads, earnings history, and progress. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="my-4">
                  <Label className="text-[#F6F2EE] mb-2">
                    Why are you leaving? (optional)
                  </Label>
                  <Textarea
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    placeholder="Help us improve..."
                    className="bg-[#050505] border-2 border-[#F6F2EE] text-[#F6F2EE]"
                    rows={3}
                  />
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel className="border-2 border-[#F6F2EE] text-[#F6F2EE] hover:bg-[#151515]">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRequestDeletion}
                    className="bg-[#FF4444] hover:bg-[#EE3333] border-2 border-[#F6F2EE] text-[#F6F2EE]"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
