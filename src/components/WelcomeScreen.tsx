import { useState } from 'react';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { Zap, TrendingUp, DollarSign } from 'lucide-react';

interface WelcomeScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToApply: () => void;
}

export function WelcomeScreen({ onNavigateToLogin, onNavigateToApply }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#050505] relative overflow-hidden">
      {/* Animated gradient accent bar */}
      <motion.div 
        animate={{ 
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#8A4FFF]"
        style={{ backgroundSize: '200% 100%' }}
      />

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-32 -right-32 w-64 h-64 bg-[#8A4FFF] opacity-10 rotate-45"
        />
        <motion.div 
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#FF7A59] opacity-10 rounded-full"
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        {/* Logo */}
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.2
          }}
          className="mb-12 text-center"
        >
          <div className="inline-block border-4 border-[#F6F2EE] p-8 mb-6 bg-gradient-to-br from-[#8A4FFF] to-[#7A3FEF] relative overflow-hidden"
            style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.8)' }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 5, 0, -5, 0],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <h1 className="text-6xl font-black text-[#F6F2EE] tracking-tight">PP</h1>
            </motion.div>
            {/* Pulse effect */}
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
              }}
              className="absolute inset-0 border-4 border-[#FF7A59]"
            />
          </div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-[#F6F2EE] mb-2 tracking-wide"
          >
            PATRON PASS
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="inline-block px-4 py-2 bg-[#FF7A59] border-3 border-[#F6F2EE]"
            style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)' }}
          >
            <span className="text-[#F6F2EE] uppercase tracking-widest text-sm font-bold">Street Team</span>
          </motion.div>
        </motion.div>

        {/* Hero text */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center mb-12 max-w-md"
        >
          <h1 className="text-[#F6F2EE] mb-4 leading-tight">
            RUN THE CITY.<br />BUILD THE NETWORK.
          </h1>
          <p className="text-[#A0A0A0] text-base leading-relaxed">
            Join the street team. Sign venues. Earn commissions. Climb the ranks. Build your empire.
          </p>
        </motion.div>

        {/* Feature highlights */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="grid grid-cols-3 gap-3 mb-12 w-full max-w-md"
        >
          <div className="p-3 bg-[#151515] border-2 border-[#8A4FFF] text-center">
            <Zap className="w-6 h-6 text-[#8A4FFF] mx-auto mb-2" />
            <p className="text-[#F6F2EE] text-xs uppercase tracking-wide font-bold">Gamified</p>
          </div>
          <div className="p-3 bg-[#151515] border-2 border-[#FF7A59] text-center">
            <TrendingUp className="w-6 h-6 text-[#FF7A59] mx-auto mb-2" />
            <p className="text-[#F6F2EE] text-xs uppercase tracking-wide font-bold">Ranked</p>
          </div>
          <div className="p-3 bg-[#151515] border-2 border-[#FFD700] text-center">
            <DollarSign className="w-6 h-6 text-[#FFD700] mx-auto mb-2" />
            <p className="text-[#F6F2EE] text-xs uppercase tracking-wide font-bold">Paid</p>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="w-full max-w-sm space-y-4"
        >
          <motion.div
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={onNavigateToLogin}
              className="w-full h-16 bg-[#8A4FFF] hover:bg-[#7A3FEF] text-[#F6F2EE] border-4 border-[#F6F2EE] uppercase tracking-wider transition-all relative overflow-hidden group"
              style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)' }}
            >
              <span className="relative z-10 text-lg font-bold">Login</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={onNavigateToApply}
              variant="outline"
              className="w-full h-16 bg-transparent hover:bg-[#151515] text-[#F6F2EE] border-4 border-[#F6F2EE] hover:border-[#FF7A59] uppercase tracking-wider transition-all"
              style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)' }}
            >
              <span className="text-lg font-bold">Apply to Join</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Bottom decorative elements */}
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, type: "spring" }}
          className="mt-16 flex gap-3"
        >
          <motion.div 
            animate={{ 
              y: [0, -5, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 0
            }}
            className="w-4 h-4 bg-[#8A4FFF] border-2 border-[#F6F2EE]"
          />
          <motion.div 
            animate={{ 
              y: [0, -5, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 0.2
            }}
            className="w-4 h-4 bg-[#FF7A59] border-2 border-[#F6F2EE]"
          />
          <motion.div 
            animate={{ 
              y: [0, -5, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 0.4
            }}
            className="w-4 h-4 bg-[#8A4FFF] border-2 border-[#F6F2EE]"
          />
        </motion.div>
      </div>

      {/* Bottom info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="px-6 py-6 text-center text-xs text-[#A0A0A0] uppercase tracking-widest"
      >
        Elite Nightlife Network
      </motion.div>
    </div>
  );
}
