import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Zap, Star, Crown, Sparkles, X } from 'lucide-react';

interface RankUpModalProps {
  isOpen: boolean;
  previousRank: string;
  newRank: string;
  totalXP: number;
  onClose: () => void;
}

const RANK_ICONS = {
  'Bronze': Star,
  'Silver': Sparkles,
  'Gold': Trophy,
  'Platinum': Crown,
  'Diamond': Zap,
  'Black Key': Crown
};

const RANK_COLORS = {
  'Bronze': '#CD7F32',
  'Silver': '#C0C0C0',
  'Gold': '#FFD700',
  'Platinum': '#E5E4E2',
  'Diamond': '#B9F2FF',
  'Black Key': '#1A1A1A'
};

export function RankUpModal({ isOpen, previousRank, newRank, totalXP, onClose }: RankUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const Icon = RANK_ICONS[newRank as keyof typeof RANK_ICONS] || Trophy;

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti */}
          {showConfetti && <Confetti />}

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotateY: 180 }}
              transition={{ type: 'spring', duration: 0.8, bounce: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-black border-4 border-[#8A4FFF] max-w-md w-full p-8 shadow-2xl"
              style={{
                boxShadow: '0 0 40px rgba(138, 79, 255, 0.5), 0 0 80px rgba(138, 79, 255, 0.3)'
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Content */}
              <div className="text-center space-y-6">
                {/* Animated Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring', duration: 1 }}
                  className="flex justify-center"
                >
                  <div
                    className="w-32 h-32 border-4 flex items-center justify-center relative"
                    style={{
                      borderColor: RANK_COLORS[newRank as keyof typeof RANK_COLORS],
                      backgroundColor: `${RANK_COLORS[newRank as keyof typeof RANK_COLORS]}20`
                    }}
                  >
                    <Icon
                      className="w-16 h-16"
                      style={{ color: RANK_COLORS[newRank as keyof typeof RANK_COLORS] }}
                    />
                    
                    {/* Pulsing glow */}
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 border-4"
                      style={{
                        borderColor: RANK_COLORS[newRank as keyof typeof RANK_COLORS],
                        filter: 'blur(8px)'
                      }}
                    />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <h2 className="text-[#FF7A59] uppercase tracking-wider">Rank Up!</h2>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-white/60 line-through">{previousRank}</span>
                      <span className="text-[#8A4FFF]">→</span>
                      <span
                        className="text-2xl font-black uppercase tracking-tight"
                        style={{ color: RANK_COLORS[newRank as keyof typeof RANK_COLORS] }}
                      >
                        {newRank}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* XP Display */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="bg-[#8A4FFF]/10 border-2 border-[#8A4FFF] p-4"
                >
                  <div className="text-white/60 uppercase tracking-wider mb-1">Total XP</div>
                  <div className="text-3xl font-black text-[#8A4FFF]">
                    {totalXP.toLocaleString()}
                  </div>
                </motion.div>

                {/* Celebration Text */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="text-white/80"
                >
                  You're moving up! Keep hustling to unlock more perks and higher commissions.
                </motion.div>

                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  onClick={onClose}
                  className="w-full bg-[#8A4FFF] hover:bg-[#7a3fee] text-white py-3 px-6 border-4 border-black font-black uppercase tracking-tight transition-colors"
                >
                  Let's Go!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Confetti Component
function Confetti() {
  const confettiPieces = Array.from({ length: 50 });
  const colors = ['#8A4FFF', '#FF7A59', '#FFD700', '#00FF00', '#00FFFF', '#FF00FF'];

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {confettiPieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0,
            y: -20,
            rotate: 0,
            opacity: 1
          }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 20 : 1000,
            x: typeof window !== 'undefined' 
              ? Math.random() * window.innerWidth + (Math.random() - 0.5) * 200 
              : 0,
            rotate: Math.random() * 720 - 360,
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 0.5,
            ease: 'easeIn'
          }}
          className="absolute w-3 h-3"
          style={{
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
    </div>
  );
}
