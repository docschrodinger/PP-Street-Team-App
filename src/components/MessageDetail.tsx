import { ArrowLeft, Bell, AlertCircle, Calendar } from 'lucide-react';
import type { HQMessage } from '../lib/messageTypes';
import { motion } from 'motion/react';

interface MessageDetailProps {
  message: HQMessage;
  onBack: () => void;
}

export function MessageDetail({ message, onBack }: MessageDetailProps) {
  const isUrgent = message.priority === 'urgent';

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* Gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isUrgent 
          ? 'bg-[#FF4444]'
          : 'bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#FFD700]'
      }`} />

      {/* Header */}
      <div className={`border-b-4 border-[#F6F2EE] px-6 py-4 ${
        isUrgent ? 'bg-[#FF4444]' : 'bg-[#151515]'
      }`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 hover:bg-opacity-80 transition-colors border-2 border-[#F6F2EE] active:scale-95 ${
              isUrgent ? 'bg-[#CC0000]' : 'hover:bg-[#8A4FFF]'
            }`}
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#F6F2EE] text-sm uppercase tracking-wider">
                Patron Pass HQ
              </span>
              {isUrgent && (
                <span className="px-2 py-0.5 bg-[#CC0000] border-2 border-[#F6F2EE] text-[#F6F2EE] text-xs font-bold uppercase">
                  Urgent
                </span>
              )}
            </div>
          </div>

          {isUrgent ? (
            <AlertCircle className="w-6 h-6 text-[#F6F2EE]" />
          ) : (
            <Bell className="w-6 h-6 text-[#8A4FFF]" />
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-2xl mx-auto"
        >
          {/* Title */}
          <div className={`p-6 border-4 mb-6 ${
            isUrgent 
              ? 'bg-[#FF4444] border-[#F6F2EE]'
              : 'bg-[#8A4FFF] border-[#F6F2EE]'
          }`}>
            <h2 className="text-[#F6F2EE]">{message.title}</h2>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-[#151515] border-2 border-[#F6F2EE]">
            <Calendar className="w-4 h-4 text-[#8A4FFF]" />
            <span className="text-[#A0A0A0] text-sm">
              {formatFullDate(message.sent_at)}
            </span>
            {message.is_read && message.read_at && (
              <>
                <span className="text-[#666]">•</span>
                <span className="text-[#666] text-sm">
                  Read {formatFullDate(message.read_at)}
                </span>
              </>
            )}
          </div>

          {/* Body */}
          <div className="p-6 bg-[#151515] border-3 border-[#F6F2EE]">
            <div className="text-[#F6F2EE] whitespace-pre-wrap leading-relaxed">
              {message.body}
            </div>
          </div>

          {/* Targeting info (debug - can be removed) */}
          {message.target_type !== 'all' && (
            <div className="mt-6 p-4 bg-[#0A0A0A] border-2 border-[#333]">
              <p className="text-[#666] text-xs">
                {message.target_type === 'tier' && (
                  <>Sent to: {message.target_tier?.toUpperCase()} tier</>
                )}
                {message.target_type === 'individual' && (
                  <>Sent to: You specifically</>
                )}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
