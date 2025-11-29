import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import type { StreetUser } from '../lib/types';
import type { HQMessage } from '../lib/messageTypes';
import { Bell, AlertCircle, ChevronRight, Inbox, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageDetail } from './MessageDetail';

interface MessagesInboxProps {
  user: StreetUser;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function MessagesInbox({ user, onBack, showBackButton = true }: MessagesInboxProps) {
  const [messages, setMessages] = useState<HQMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<HQMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('hq_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'street_team_messages'
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user.id]);

  async function loadMessages() {
    setLoading(true);

    // Get all messages that target this user
    const { data: messagesData, error } = await supabase
      .from('street_team_messages')
      .select(`
        *,
        street_team_message_reads!left(
          id,
          read_at
        )
      `)
      .or(`target_type.eq.all,and(target_type.eq.tier,target_tier.eq.${user.tier}),and(target_type.eq.individual,target_user_id.eq.${user.id})`)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Error loading messages:', error);
      setLoading(false);
      return;
    }

    // Transform data and check read status
    const transformedMessages: HQMessage[] = messagesData.map((msg: any) => {
      const reads = msg.street_team_message_reads || [];
      const userRead = reads.find((r: any) => r.user_id === user.id);
      
      return {
        ...msg,
        is_read: !!userRead,
        read_at: userRead?.read_at
      };
    });

    setMessages(transformedMessages);
    setLoading(false);
  }

  async function markAsRead(messageId: string) {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.is_read) return;

    // Insert read record
    const { error } = await supabase
      .from('street_team_message_reads')
      .insert({
        message_id: messageId,
        user_id: user.id
      });

    if (!error) {
      // Update local state
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, is_read: true, read_at: new Date().toISOString() } : m
      ));
    }
  }

  function handleMessageClick(message: HQMessage) {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  }

  function handleCloseMessage() {
    setSelectedMessage(null);
  }

  const filteredMessages = filter === 'unread' 
    ? messages.filter(m => !m.is_read)
    : messages;

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (selectedMessage) {
    return (
      <MessageDetail
        message={selectedMessage}
        onBack={handleCloseMessage}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#FFD700]" />

      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE] active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
            </button>
          )}
          
          <div className="flex-1">
            <h3 className="text-[#F6F2EE]">Messages from HQ</h3>
            {unreadCount > 0 && (
              <p className="text-[#FF7A59] text-sm mt-1">
                {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
              </p>
            )}
          </div>

          <div className="relative">
            <Bell className="w-6 h-6 text-[#8A4FFF]" />
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF7A59] border-2 border-[#F6F2EE] flex items-center justify-center"
              >
                <span className="text-[#F6F2EE] text-xs font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 border-3 uppercase text-xs tracking-wider transition-all ${
              filter === 'all'
                ? 'bg-[#8A4FFF] border-[#F6F2EE] text-[#F6F2EE]'
                : 'bg-transparent border-[#F6F2EE] text-[#A0A0A0] hover:border-[#8A4FFF]'
            }`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 px-4 border-3 uppercase text-xs tracking-wider transition-all ${
              filter === 'unread'
                ? 'bg-[#8A4FFF] border-[#F6F2EE] text-[#F6F2EE]'
                : 'bg-transparent border-[#F6F2EE] text-[#A0A0A0] hover:border-[#8A4FFF]'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block p-6 bg-[#151515] border-4 border-[#8A4FFF] mb-4 animate-pulse">
              <Inbox className="w-12 h-12 text-[#8A4FFF]" />
            </div>
            <p className="text-[#A0A0A0] uppercase tracking-widest text-sm">Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-6 bg-[#151515] border-4 border-[#F6F2EE] mb-4">
              <Inbox className="w-12 h-12 text-[#A0A0A0]" />
            </div>
            <h4 className="text-[#F6F2EE] mb-2">
              {filter === 'unread' ? 'All caught up!' : 'No messages yet'}
            </h4>
            <p className="text-[#A0A0A0] text-sm">
              {filter === 'unread' 
                ? "You've read all your messages" 
                : "You'll get updates and announcements here"}
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            <AnimatePresence>
              {filteredMessages.map((message, index) => (
                <motion.button
                  key={message.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleMessageClick(message)}
                  className={`w-full p-5 border-3 text-left transition-all relative overflow-hidden ${
                    message.is_read
                      ? 'bg-[#0A0A0A] border-[#333] hover:border-[#8A4FFF]'
                      : 'bg-[#151515] border-[#8A4FFF] hover:bg-[#1A1A1A]'
                  }`}
                >
                  {/* Unread indicator */}
                  {!message.is_read && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#8A4FFF]" />
                  )}

                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 border-2 flex items-center justify-center flex-shrink-0 ${
                      message.priority === 'urgent'
                        ? 'bg-[#FF4444] border-[#F6F2EE]'
                        : 'bg-[#8A4FFF] border-[#F6F2EE]'
                    }`}>
                      {message.priority === 'urgent' ? (
                        <AlertCircle className="w-6 h-6 text-[#F6F2EE]" />
                      ) : (
                        <Bell className="w-6 h-6 text-[#F6F2EE]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className={`font-bold ${
                          message.is_read ? 'text-[#A0A0A0]' : 'text-[#F6F2EE]'
                        }`}>
                          {message.title}
                        </h4>
                        {message.priority === 'urgent' && (
                          <span className="px-2 py-1 bg-[#FF4444] border-2 border-[#F6F2EE] text-[#F6F2EE] text-xs font-bold uppercase whitespace-nowrap">
                            Urgent
                          </span>
                        )}
                      </div>

                      <p className={`text-sm mb-2 line-clamp-2 ${
                        message.is_read ? 'text-[#666]' : 'text-[#A0A0A0]'
                      }`}>
                        {message.body}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-[#666] text-xs">
                          {formatDate(message.sent_at)}
                        </p>
                        <ChevronRight className={`w-4 h-4 ${
                          message.is_read ? 'text-[#666]' : 'text-[#8A4FFF]'
                        }`} />
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}
