import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Bell, Trophy, Target, TrendingUp, DollarSign, Zap, CheckCircle2, X } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import type { StreetUser } from '../lib/types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface NotificationsScreenProps {
  user: StreetUser;
  onBack: () => void;
  onNavigate: (link: string) => void; // Add this prop
}

const NOTIFICATION_ICONS: Record<string, any> = {
  'xp_awarded': Trophy,
  'rank_up': TrendingUp,
  'mission_complete': Target,
  'lead_status_change': Zap,
  'earnings_update': DollarSign,
  'system': Bell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  'xp_awarded': '#8A4FFF',
  'rank_up': '#FFD700',
  'mission_complete': '#00FF00',
  'lead_status_change': '#FF7A59',
  'earnings_update': '#FFD700',
  'system': '#A0A0A0',
};

export function NotificationsScreen({ user, onBack, onNavigate }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [user.id]);

  async function handleNotificationClick(notification: any) {
    // First, mark the notification as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Then, handle the deep link using the passed-in handler
    if (notification.deep_link) {
      onNavigate(notification.deep_link);
    }
  }

  async function loadNotifications() {
    let query = supabase
      .from('street_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (filter === 'unread') {
      query = query.eq('is_read', false);
    }

    const { data } = await query;
    setNotifications(data || []);
    setLoading(false);
  }

  async function markAsRead(notificationId: string) {
    await supabase
      .from('street_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
  }

  async function markAllAsRead() {
    await supabase
      .from('street_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  }

  async function deleteNotification(notificationId: string) {
    await supabase
      .from('street_notifications')
      .delete()
      .eq('id', notificationId);

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.success('Notification deleted');
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block border-4 border-[#8A4FFF] p-6 mb-4 bg-[#151515] animate-pulse">
            <Bell className="w-12 h-12 text-[#8A4FFF]" />
          </div>
          <p className="text-[#A0A0A0] uppercase tracking-widest text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* Gradient accent */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#8A4FFF]"
        style={{ backgroundSize: '200% 100%' }}
      />

      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
          </button>
          <h3 className="text-[#F6F2EE] flex-1 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#8A4FFF]" />
            Notifications
          </h3>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#FF7A59] border-2 border-[#F6F2EE]">
              <span className="text-[#F6F2EE] font-bold text-sm">{unreadCount} new</span>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 border-3 uppercase text-xs tracking-wider transition-all ${
              filter === 'all'
                ? 'bg-[#8A4FFF] border-[#F6F2EE] text-[#F6F2EE]'
                : 'bg-transparent border-[#F6F2EE] text-[#A0A0A0] hover:border-[#8A4FFF]'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 border-3 uppercase text-xs tracking-wider transition-all ${
              filter === 'unread'
                ? 'bg-[#8A4FFF] border-[#F6F2EE] text-[#F6F2EE]'
                : 'bg-transparent border-[#F6F2EE] text-[#A0A0A0] hover:border-[#8A4FFF]'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className="w-full border-2 border-[#8A4FFF] text-[#8A4FFF] hover:bg-[#8A4FFF] hover:text-[#F6F2EE] uppercase text-xs tracking-wider"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-8 bg-[#151515] border-4 border-[#F6F2EE] mb-4">
              <Bell className="w-16 h-16 text-[#A0A0A0]" />
            </div>
            <p className="text-[#A0A0A0] mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-[#8A4FFF] text-sm">
              {filter === 'unread' ? 'You\'re all caught up!' : 'Activity updates will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, index) => {
                const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                const color = NOTIFICATION_COLORS[notification.type] || '#A0A0A0';
                const isUnread = !notification.is_read;
                const timeAgo = getTimeAgo(notification.created_at);

                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`relative p-4 border-3 cursor-pointer transition-all ${
                      isUnread
                        ? 'bg-[#151515] border-[#8A4FFF]'
                        : 'bg-[#0A0A0A] border-[#F6F2EE] opacity-75'
                    }`}
                    style={isUnread ? { boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.8)' } : {}}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className="w-12 h-12 border-3 border-[#F6F2EE] flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: isUnread ? color : '#050505' }}
                      >
                        <Icon className={`w-6 h-6 ${isUnread ? 'text-[#F6F2EE]' : 'text-[#A0A0A0]'}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold mb-1 ${isUnread ? 'text-[#F6F2EE]' : 'text-[#A0A0A0]'}`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mb-2 ${isUnread ? 'text-[#A0A0A0]' : 'text-[#666]'}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${isUnread ? 'text-[#8A4FFF]' : 'text-[#666]'}`}>
                            {timeAgo}
                          </span>
                          {isUnread && (
                            <div className="w-2 h-2 bg-[#8A4FFF] rounded-full" />
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-2 hover:bg-[#FF4444] border-2 border-[#F6F2EE] transition-colors active:scale-95"
                      >
                        <X className="w-4 h-4 text-[#F6F2EE]" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}
