import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { motion, AnimatePresence } from 'motion/react';

interface MessagesBadgeProps {
  userId: string;
  className?: string;
}

export function MessagesBadge({ userId, className = '' }: MessagesBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();

    // Subscribe to new messages and reads
    const messagesChannel = supabase
      .channel('unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'street_team_messages'
      }, () => {
        loadUnreadCount();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'street_team_message_reads',
        filter: `user_id=eq.${userId}`
      }, () => {
        loadUnreadCount();
      })
      .subscribe();

    return () => {
      messagesChannel.unsubscribe();
    };
  }, [userId]);

  async function loadUnreadCount() {
    // Call the database function to get unread count
    const { data, error } = await supabase
      .rpc('get_unread_message_count', { user_id_param: userId });

    if (!error && data !== null) {
      setUnreadCount(data);
    }
  }

  if (unreadCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className={`absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-[#FF7A59] border-2 border-[#F6F2EE] flex items-center justify-center ${className}`}
      >
        <span className="text-[#F6F2EE] text-xs font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook version for getting unread count
export function useUnreadMessageCount(userId: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnreadCount();

    // Subscribe to new messages and reads
    const messagesChannel = supabase
      .channel(`unread_messages_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'street_team_messages'
      }, () => {
        loadUnreadCount();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'street_team_message_reads',
        filter: `user_id=eq.${userId}`
      }, () => {
        loadUnreadCount();
      })
      .subscribe();

    return () => {
      messagesChannel.unsubscribe();
    };
  }, [userId]);

  async function loadUnreadCount() {
    setLoading(true);
    const { data, error } = await supabase
      .rpc('get_unread_message_count', { user_id_param: userId });

    if (!error && data !== null) {
      setUnreadCount(data);
    }
    setLoading(false);
  }

  return { unreadCount, loading, refresh: loadUnreadCount };
}
